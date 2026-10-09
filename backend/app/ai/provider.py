"""Language-model endpoints. One adapter: any server speaking the OpenAI chat completions API
(Ollama, LM Studio, vLLM, OpenRouter, Mistral, OpenAI…)."""

import json
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from ipaddress import ip_address
from typing import Literal, Protocol
from urllib.parse import urlparse

import httpx

Message = dict[str, str]  # {"role": "system" | "user" | "assistant", "content": "…"}


class AIServiceError(Exception):
    """The endpoint could not answer; the message is meant for the user (Italian)."""


@dataclass
class Usage:
    prompt_tokens: int | None = None
    completion_tokens: int | None = None


@dataclass
class Completion:
    """Filled in while streaming, so the caller can log it afterwards."""

    usage: Usage = field(default_factory=Usage)


class LLMProvider(Protocol):
    model: str

    def stream(self, messages: list[Message], completion: Completion) -> AsyncIterator[str]: ...

    async def ping(self) -> float:
        """Seconds taken by a minimal request; raises AIServiceError."""
        ...


def endpoint_location(base_url: str) -> Literal["locale", "remoto"]:
    """Whether data stays on this machine (or the local network) or goes to a remote service."""
    host = (urlparse(base_url).hostname or "").lower()
    if host in {"localhost", ""} or host.endswith(".local") or host.endswith(".localhost"):
        return "locale"
    try:
        address = ip_address(host)
    except ValueError:
        return "remoto"
    return "locale" if address.is_loopback or address.is_private else "remoto"


class OpenAICompatibleProvider:
    def __init__(
        self,
        *,
        base_url: str,
        model: str,
        api_key: str | None,
        temperature: float,
        max_tokens: int,
        timeout: float = 120.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.model = model
        self._url = base_url.rstrip("/") + "/chat/completions"
        self._temperature = temperature
        self._max_tokens = max_tokens
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self._headers = headers
        self._timeout = httpx.Timeout(timeout, connect=10.0)
        self._transport = transport

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            headers=self._headers, timeout=self._timeout, transport=self._transport
        )

    def _body(self, messages: list[Message], *, stream: bool, max_tokens: int) -> dict[str, object]:
        return {
            "model": self.model,
            "messages": messages,
            "temperature": self._temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }

    async def stream(self, messages: list[Message], completion: Completion) -> AsyncIterator[str]:
        body = self._body(messages, stream=True, max_tokens=self._max_tokens)
        try:
            async with (
                self._client() as client,
                client.stream("POST", self._url, json=body) as response,
            ):
                if response.status_code >= 400:
                    await response.aread()
                    raise AIServiceError(_http_error(response))
                async for line in response.aiter_lines():
                    text = _parse_sse_line(line, completion)
                    if text:
                        yield text
        except httpx.TimeoutException as error:
            raise AIServiceError("Il modello non ha risposto in tempo: riprova.") from error
        except httpx.HTTPError as error:
            raise AIServiceError(f"Impossibile raggiungere l'assistente ({self._url}).") from error

    async def ping(self) -> float:
        body = self._body(
            [{"role": "user", "content": "Rispondi solo: OK"}], stream=False, max_tokens=5
        )
        started = time.monotonic()
        try:
            async with self._client() as client:
                response = await client.post(self._url, json=body)
        except httpx.TimeoutException as error:
            raise AIServiceError("Il modello non ha risposto in tempo.") from error
        except httpx.HTTPError as error:
            raise AIServiceError(f"Impossibile raggiungere {self._url}.") from error
        if response.status_code >= 400:
            raise AIServiceError(_http_error(response))
        return time.monotonic() - started


def _parse_sse_line(line: str, completion: Completion) -> str | None:
    """One line of an OpenAI-style stream: `data: {json}` or `data: [DONE]`."""
    if not line.startswith("data:"):
        return None
    data = line[len("data:") :].strip()
    if not data or data == "[DONE]":
        return None
    try:
        chunk = json.loads(data)
    except json.JSONDecodeError:
        return None
    usage = chunk.get("usage") or {}
    if usage:
        completion.usage = Usage(usage.get("prompt_tokens"), usage.get("completion_tokens"))
    choices = chunk.get("choices") or []
    if not choices:
        return None
    content = (choices[0].get("delta") or {}).get("content")
    return content if isinstance(content, str) else None


def _http_error(response: httpx.Response) -> str:
    detail = ""
    try:
        payload = response.json()
        error = payload.get("error") if isinstance(payload, dict) else None
        detail = error.get("message", "") if isinstance(error, dict) else str(error or "")
    except (ValueError, AttributeError):
        detail = response.text[:200]
    if response.status_code in (401, 403):
        return "L'endpoint ha rifiutato la chiave API: controlla la configurazione."
    if response.status_code == 404:
        return f"Modello o percorso non trovato sull'endpoint. {detail}".strip()
    if response.status_code == 429:
        return "L'endpoint ha raggiunto il suo limite di richieste: riprova più tardi."
    return f"L'assistente ha restituito un errore ({response.status_code}). {detail}".strip()
