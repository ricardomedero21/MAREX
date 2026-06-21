from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum


class SignalType(str, Enum):
    DEPTH = "depth"           # profundidad bajo la quilla/transductor
    SOG = "sog"               # speed over ground
    COG = "cog"               # course over ground
    LATITUDE = "latitude"
    LONGITUDE = "longitude"
    WIND_SPEED = "wind_speed"
    WIND_ANGLE = "wind_angle"
    BATTERY = "battery"           # voltaje de la bateria de servicio
    FUEL = "fuel"                 # nivel de combustible (% del tanque)
    ENGINE_TEMP = "engine_temp"   # temperatura del motor


UNITS: dict[SignalType, str] = {
    SignalType.DEPTH: "m",
    SignalType.SOG: "kn",
    SignalType.COG: "deg",
    SignalType.LATITUDE: "deg",
    SignalType.LONGITUDE: "deg",
    SignalType.WIND_SPEED: "kn",
    SignalType.WIND_ANGLE: "deg",
    SignalType.BATTERY: "V",
    SignalType.FUEL: "%",
    SignalType.ENGINE_TEMP: "°C",
}


@dataclass(frozen=True)
class Signal:
    type: SignalType
    value: float
    timestamp: datetime
    unit: str

    @classmethod
    def create(
        cls, signal_type: SignalType, value: float, timestamp: datetime | None = None
    ) -> "Signal":
        return cls(
            type=signal_type,
            value=float(value),
            timestamp=timestamp or datetime.now(timezone.utc),
            unit=UNITS[signal_type],
        )
