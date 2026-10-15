from __future__ import annotations

import time
from collections.abc import Iterator

from marex.signals import Signal, SignalType
from marex.sources.base import DataSource
from marex.sources.n2k import N2kDecoder


class SocketCanSource(DataSource):
    """Lee NMEA 2000 en vivo desde SocketCAN (p. ej. `can0` con el RH-02).

    Cada `interval` segundos entrega el último valor de cada señal recibida.
    """

    def __init__(self, channel: str = "can0", interval: float = 1.0, bus=None) -> None:
        self.channel = channel
        self.interval = interval
        self._bus = bus
        self.decoder = N2kDecoder()

    def _open(self):
        if self._bus is None:
            import can  # python-can; solo hace falta en la Jetson

            self._bus = can.interface.Bus(channel=self.channel, interface="socketcan")
        return self._bus

    def stream(self) -> Iterator[list[Signal]]:
        bus = self._open()
        latest: dict[SignalType, Signal] = {}
        deadline = time.monotonic() + self.interval
        while True:
            msg = bus.recv(timeout=self.interval)
            if msg is not None and msg.is_extended_id:
                for sig in self.decoder.decode(msg.arbitration_id, bytes(msg.data)):
                    latest[sig.type] = sig
            if time.monotonic() >= deadline:
                if latest:
                    yield list(latest.values())
                    latest = {}
                deadline = time.monotonic() + self.interval
