from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

from marex.llm.base import LLM, LLMUnavailable, Message

# Configurables por entorno (para Docker/Jetson sin tocar código).
DEFAULT_HOST = os.environ.get("MAREX_OLLAMA_HOST", "http://localhost:11434")
DEFAULT_MODEL = os.environ.get("MAREX_LLM_MODEL", "gemma2:2b")


class OllamaLLM(LLM):
    """LLM que habla con un servidor Ollama por HTTP (/api/chat).

    Sin dependencias externas: usa urllib de la stdlib. El modelo y el host
    son configurables (por argumento o por variable de entorno) para poder
    cambiarlos entre la PC, Docker y la Jetson.
    """

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        host: str = DEFAULT_HOST,
        timeout: float = 120.0,
    ) -> None:
        self.model = model
        self.host = host.rstrip("/")
        self.timeout = timeout

    def complete(self, system: str, messages: list[Message]) -> str:
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system},
                *({"role": m.role, "content": m.content} for m in messages),
            ],
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.host}/api/chat",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise LLMUnavailable(f"No se pudo contactar a Ollama en {self.host}: {exc}") from exc
        except json.JSONDecodeError as exc:
            raise LLMUnavailable(f"Respuesta inválida de Ollama: {exc}") from exc

        try:
            return body["message"]["content"].strip()
        except (KeyError, TypeError) as exc:
            raise LLMUnavailable(f"Formato inesperado de Ollama: {body!r}") from exc
