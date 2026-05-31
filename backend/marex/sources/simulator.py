from __future__ import annotations

import math
import time
from collections.abc import Iterator
from datetime import datetime, timezone

from marex.signals import Signal, SignalType
from marex.sources.base import DataSource

# Bahia ficticia (Miami) como punto base de la simulacion.
BASE_LAT = 25.7617
BASE_LON = -80.1918


class SimulatorSource(DataSource):
    def __init__(self, interval: float = 1.0) -> None:
        self.interval = interval

    def sample(self, elapsed: float) -> list[Signal]:
        ts = datetime.now(timezone.utc)
        depth = 15.0 + 5.0 * math.sin(elapsed / 30.0)        # 10..20 m
        sog = 6.0 + 2.0 * math.sin(elapsed / 20.0)           # 4..8 kn
        cog = (elapsed * 2.0) % 360.0
        lat = BASE_LAT + 0.0005 * math.sin(elapsed / 60.0)
        lon = BASE_LON + 0.0005 * math.cos(elapsed / 60.0)
        wind_speed = 12.0 + 4.0 * math.sin(elapsed / 45.0)   # 8..16 kn
        wind_angle = (elapsed * 1.5) % 360.0
        return [
            Signal.create(SignalType.DEPTH, depth, ts),
            Signal.create(SignalType.SOG, sog, ts),
            Signal.create(SignalType.COG, cog, ts),
            Signal.create(SignalType.LATITUDE, lat, ts),
            Signal.create(SignalType.LONGITUDE, lon, ts),
            Signal.create(SignalType.WIND_SPEED, wind_speed, ts),
            Signal.create(SignalType.WIND_ANGLE, wind_angle, ts),
        ]

    def stream(self) -> Iterator[list[Signal]]:
        start = time.monotonic()
        while True:
            yield self.sample(time.monotonic() - start)
            time.sleep(self.interval)
