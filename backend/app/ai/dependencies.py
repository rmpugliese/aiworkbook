from collections.abc import Callable

from app.ai.provider import LLMProvider
from app.models import AISettings
from app.services.ai import build_provider

ProviderFactory = Callable[[AISettings], LLMProvider]


def get_provider_factory() -> ProviderFactory:
    """Overridden in tests with a fake provider: tests never call a real endpoint."""
    return build_provider
