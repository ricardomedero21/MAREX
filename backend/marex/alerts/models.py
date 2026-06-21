from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class AlertState(str, Enum):
    OK = "ok"
    WARN = "warn"
    DANGER = "danger"
    NODATA = "nodata"


# Claves estables de cada regla (las usa la app para identificar la alerta).
class AlertKey(str, Enum):
    DEPTH = "depth_low"
    BATTERY = "battery_low"
    FUEL = "fuel_low"
    ANCHOR = "anchor_drag"
    GEOFENCE = "geofence"


@dataclass(frozen=True)
class Alert:
    key: AlertKey
    state: AlertState
    title: str
    detail: str


@dataclass
class GeoPoint:
    lat: float
    lon: float


@dataclass
class AnchorConfig:
    point: GeoPoint
    tolerance_m: float = 30.0  # deriva máxima antes de disparar


@dataclass
class GeofenceConfig:
    center: GeoPoint
    radius_m: float = 100.0


@dataclass
class AlertConfig:
    """Parámetros configurables de las reglas. Umbrales en unidades del barco."""

    depth_min: float = 3.0          # m
    depth_margin: float = 2.0       # m extra para el estado 'warn'
    battery_min: float = 11.8       # V
    fuel_min: float = 15.0          # %
    fuel_warn: float = 25.0         # %
    anchor: AnchorConfig | None = None
    geofence: GeofenceConfig | None = None
    enabled: dict[AlertKey, bool] = field(
        default_factory=lambda: {k: True for k in AlertKey}
    )

    def is_enabled(self, key: AlertKey) -> bool:
        return self.enabled.get(key, True)
