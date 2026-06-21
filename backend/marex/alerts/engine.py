from __future__ import annotations

from marex.alerts.models import Alert, AlertConfig
from marex.alerts.rules import ALL_RULES
from marex.storage import SignalStore


class AlertEngine:
    """Evalúa las reglas de alerta sobre el estado actual del barco.

    Sin estado propio: cada llamada a evaluate() recomputa la lista a partir
    del store y la config. Las reglas deshabilitadas se omiten.
    """

    def __init__(self, config: AlertConfig | None = None) -> None:
        self.config = config or AlertConfig()

    def evaluate(self, store: SignalStore) -> list[Alert]:
        alerts: list[Alert] = []
        for rule in ALL_RULES:
            alert = rule(store, self.config)
            if self.config.is_enabled(alert.key):
                alerts.append(alert)
        return alerts
