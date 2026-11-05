"""The OpenAI-compatible adapter, against a mocked HTTP server (never a real endpoint)."""

import json

import httpx
import pytest

from app.ai.provider import AIServiceError, Completion, OpenAICompatibleProvider, endpoint_location


def provider(
    handler: httpx.MockTransport, api_key: str | None = "chiave-finta-test"
) -> OpenAICompatibleProvider:
    return OpenAICompatibleProvider(
        base_url="http://llm.test/v1/",
        model="modello-di-prova",
        api_key=api_key,
        temperature=0.3,
        max_tokens=500,
        transport=handler,
    )


def sse(*chunks: dict[str, object]) -> bytes:
    lines = [f"data: {json.dumps(chunk)}" for chunk in chunks] + ["data: [DONE]"]
    return ("\n\n".join(lines) + "\n\n").encode()


async def collect(p: OpenAICompatibleProvider, completion: Completion | None = None) -> str:
    completion = completion or Completion()
    return "".join(
        [piece async for piece in p.stream([{"role": "user", "content": "Ciao"}], completion)]
    )


@pytest.mark.anyio
async def test_streams_the_text_and_sends_the_expected_request() -> None:
    seen: list[httpx.Request] = []

    def handle(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        body = sse(
            {"choices": [{"delta": {"role": "assistant"}}]},
            {"choices": [{"delta": {"content": "Ridurre "}}]},
            {"choices": [{"delta": {"content": "gli abbandoni"}}]},
            {"choices": [], "usage": {"prompt_tokens": 120, "completion_tokens": 4}},
        )
        return httpx.Response(200, content=body, headers={"content-type": "text/event-stream"})

    completion = Completion()
    text = await collect(provider(httpx.MockTransport(handle)), completion)

    assert text == "Ridurre gli abbandoni"
    assert (completion.usage.prompt_tokens, completion.usage.completion_tokens) == (120, 4)
    [request] = seen
    assert str(request.url) == "http://llm.test/v1/chat/completions"
    assert request.headers["authorization"] == "Bearer chiave-finta-test"
    payload = json.loads(request.content)
    assert payload["model"] == "modello-di-prova" and payload["stream"] is True
    assert payload["temperature"] == 0.3 and payload["max_tokens"] == 500


@pytest.mark.anyio
async def test_no_authorization_header_without_a_key() -> None:
    seen: list[httpx.Request] = []

    def handle(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(200, content=sse({"choices": [{"delta": {"content": "ok"}}]}))

    await collect(provider(httpx.MockTransport(handle), api_key=None))

    assert "authorization" not in seen[0].headers


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("status", "expected"),
    [(401, "chiave API"), (404, "non trovato"), (429, "limite"), (500, r"errore \(500\)")],
)
async def test_http_errors_become_readable_messages(status: int, expected: str) -> None:
    def handle(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status, json={"error": {"message": "dettaglio"}})

    with pytest.raises(AIServiceError, match=expected):
        await collect(provider(httpx.MockTransport(handle)))


@pytest.mark.anyio
async def test_unreachable_endpoint_and_timeout() -> None:
    def refuse(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused")

    def slow(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("too slow")

    with pytest.raises(AIServiceError, match="Impossibile raggiungere"):
        await collect(provider(httpx.MockTransport(refuse)))
    with pytest.raises(AIServiceError, match="in tempo"):
        await collect(provider(httpx.MockTransport(slow)))


@pytest.mark.anyio
async def test_ping_measures_a_minimal_request() -> None:
    def handle(request: httpx.Request) -> httpx.Response:
        assert json.loads(request.content)["stream"] is False
        return httpx.Response(200, json={"choices": [{"message": {"content": "OK"}}]})

    assert await provider(httpx.MockTransport(handle)).ping() >= 0


@pytest.mark.parametrize(
    ("url", "location"),
    [
        ("http://localhost:11434/v1", "locale"),
        ("http://127.0.0.1:1234/v1", "locale"),
        ("http://192.168.1.20:8000/v1", "locale"),
        ("http://gpu-box.local:8000/v1", "locale"),
        ("https://openrouter.ai/api/v1", "remoto"),
        ("https://api.mistral.ai/v1", "remoto"),
    ],
)
def test_endpoint_location(url: str, location: str) -> None:
    assert endpoint_location(url) == location
