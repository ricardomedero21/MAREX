from __future__ import annotations

import threading
import time

from marex.alerts.engine import AlertEngine
from marex.alerts.models import (
    Alert,
    AlertConfig,
    AnchorConfig,
    GeofenceConfig,
    GeoPoint,
)
from marex.llm.chat_service import ChatService
from marex.llm.ollama_llm import OllamaLLM
from marex.signals import SignalType
from marex.sources.base import DataSource
from marex.sources.factory import source_from_env
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
        alerts: AlertEngine | None = None,
    ) -> None:
        self.store = store or SignalStore(":memory:")
        self.source = source or source_from_env()
        self.chat = chat or ChatService(OllamaLLM(), self.store)
        self.alerts = alerts or AlertEngine()
        self._latest_alerts: list[Alert] = []
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
            self._latest_alerts = self.alerts.evaluate(self.store)

    def latest_signals(self) -> list:
        """Último valor de cada tipo de señal (omite los que no tienen datos)."""
        out = []
        for t in SignalType:
            sig = self.store.latest(t)
            if sig is not None:
                out.append(sig)
        return out

    def latest_alerts(self) -> list[Alert]:
        """Última evaluación de alertas. Si aún no corrió el loop, evalúa ahora."""
        if not self._latest_alerts:
            return self.alerts.evaluate(self.store)
        return self._latest_alerts

    @property
    def config(self) -> AlertConfig:
        return self.alerts.config

    def _current_point(self) -> GeoPoint | None:
        lat = self.store.latest(SignalType.LATITUDE)
        lon = self.store.latest(SignalType.LONGITUDE)
        if lat is None or lon is None:
            return None
        return GeoPoint(lat=lat.value, lon=lon.value)

    def set_anchor(self, tolerance_m: float = 30.0) -> bool:
        """Fija el fondeo en la posición actual. False si no hay GPS."""
        point = self._current_point()
        if point is None:
            return False
        self.alerts.config.anchor = AnchorConfig(point=point, tolerance_m=tolerance_m)
        return True

    def clear_anchor(self) -> None:
        self.alerts.config.anchor = None

    def set_geofence(self, radius_m: float = 100.0) -> bool:
        """Define la zona centrada en la posición actual. False si no hay GPS."""
        point = self._current_point()
        if point is None:
            return False
        self.alerts.config.geofence = GeofenceConfig(center=point, radius_m=radius_m)
        return True

    def clear_geofence(self) -> None:
        self.alerts.config.geofence = None
