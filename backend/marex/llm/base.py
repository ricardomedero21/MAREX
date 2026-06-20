from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal

Role = Literal["user", "assistant"]


@dataclass(frozen=True)
class Message:
    role: Role
    content: str


class LLMUnavailable(Exception):
    """El motor de inferencia no está disponible (Ollama caído, timeout, etc.)."""


class LLM(ABC):
    """Interfaz del modelo de lenguaje. No sabe nada de Ollama ni de barcos."""

    @abstractmethod
    def complete(self, system: str, messages: list[Message]) -> str:
        """Genera una respuesta dado un system prompt y el historial de mensajes."""
        raise NotImplementedError
