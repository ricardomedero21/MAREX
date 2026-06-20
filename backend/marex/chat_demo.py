"""Demo end-to-end del chat: simulador -> SQLite -> ChatService -> Ollama.

Uso (desde backend/, con el venv activo y Ollama corriendo):
    python -m marex.chat_demo
"""

from __future__ import annotations

import os

from marex.llm.chat_service import ChatService
from marex.llm.ollama_llm import DEFAULT_MODEL, OllamaLLM
from marex.sources.simulator import SimulatorSource
from marex.storage import SignalStore


def main() -> None:
    model = os.environ.get("MAREX_LLM_MODEL", DEFAULT_MODEL)

    # Cargar una muestra del simulador en el store (estado actual del barco).
    store = SignalStore(":memory:")
    store.append_many(SimulatorSource().sample(0.0))

    chat = ChatService(OllamaLLM(model=model), store)

    preguntas = [
        "Capitan presentate en una frase.",
        "¿Que profundidad tengo ahora?",
        "¿Cuanto combustible me queda?",
    ]
    print(f"Marex chat demo · modelo={model}\n")
    for q in preguntas:
        print(f"Capitan> {q}")
        print(f"Marex>   {chat.send(q)}\n")


if __name__ == "__main__":
    main()
