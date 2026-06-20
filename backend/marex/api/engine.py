from __future__ import annotations

import threading
import time

from marex.llm.chat_service import ChatService
from marex.llm.ollama_llm import OllamaLLM
from marex.signals import SignalType
from marex.sources.base import DataSource
from marex.sources.simulator import SimulatorSource
from marex.storage import SignalStore


class MarexEngine:
    """Estado vivo del backend: ingesta datos de una fuente al store y
    expone el ChatService. Pensado como singleton de la app FastAPI.
    """

    def __init__(
        self,
        source: DataSource | None = None,
        store: SignalStore | None = None,
        chat: ChatService | None = None,
    ) -> None:
        self.store = store or SignalStore(":memory:")
        self.source = source or SimulatorSource(interval=1.0)
        self.chat = chat or ChatService(OllamaLLM(), self.store)
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()

    def start(self) -> None:
        """Arranca el hilo de ingestión en segundo plano (idempotente)."""
        if self._thread is not None:
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._ingest_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=2.0)
            self._thread = None

    def _ingest_loop(self) -> None:
        for tick in self.source.stream():
            if self._stop.is_set():
                break
            self.store.append_many(tick)

    def latest_signals(self) -> list:
        """Último valor de cada tipo de señal (omite los que no tienen datos)."""
        out = []
        for t in SignalType:
            sig = self.store.latest(t)
            if sig is not None:
                out.append(sig)
        return out
