"""Decodificador mínimo de NMEA 2000 (CAN 29 bits, 250 kbit/s) → señales Marex.

Campos y escalas según canboat (pgns.json). Solo los PGNs que Marex usa hoy;
lo demás se ignora. Batería, combustible y motor: solo la instancia 0 por ahora.
"""
from __future__ import annotations

import math
import struct
from collections.abc import Callable
from datetime import datetime, timezone

from marex.signals import Signal, SignalType

MS_TO_KN = 1.943844
KELVIN = 273.15


def parse_id(can_id: int) -> tuple[int, int]:
    """(pgn, source) de un identificador CAN extendido de NMEA 2000."""
    pgn = (can_id >> 8) & 0x3FFFF
    if (pgn >> 8) & 0xFF < 240:  # PDU1: el byte bajo es destino
        pgn &= 0x3FF00
    return pgn, can_id & 0xFF


# Lectores little-endian; devuelven None si el valor es "no disponible".
def _u16(d: bytes, o: int) -> int | None:
    v = struct.unpack_from("<H", d, o)[0]
    return None if v >= 0xFFFD else v


def _i16(d: bytes, o: int) -> int | None:
    v = struct.unpack_from("<h", d, o)[0]
    return None if v >= 0x7FFD else v


def _u32(d: bytes, o: int) -> int | None:
    v = struct.unpack_from("<I", d, o)[0]
    return None if v >= 0xFFFFFFFD else v


def _i32(d: bytes, o: int) -> int | None:
    v = struct.unpack_from("<i", d, o)[0]
    return None if v >= 0x7FFFFFFD else v


def _scale(v: int | None, k: float, add: float = 0.0) -> float | None:
    return None if v is None else v * k + add


def _depth(d: bytes):
    depth = _scale(_u32(d, 1), 0.01)
    offset = _i16(d, 5)
    if depth is not None and offset is not None and offset < 0:
        depth += offset * 0.001  # offset negativo = distancia a la quilla
    return [(SignalType.DEPTH, depth)]


def _position(d: bytes):
    return [(SignalType.LATITUDE, _scale(_i32(d, 0), 1e-7)),
            (SignalType.LONGITUDE, _scale(_i32(d, 4), 1e-7))]


def _cog_sog(d: bytes):
    cog = _scale(_u16(d, 2), 1e-4 * 180 / math.pi)
    return [(SignalType.COG, None if cog is None else cog % 360.0),
            (SignalType.SOG, _scale(_u16(d, 4), 0.01 * MS_TO_KN))]


def _wind(d: bytes):
    return [(SignalType.WIND_SPEED, _scale(_u16(d, 1), 0.01 * MS_TO_KN)),
            (SignalType.WIND_ANGLE, _scale(_u16(d, 3), 1e-4 * 180 / math.pi))]


def _battery(d: bytes):
    if d[0] != 0:
        return []
    return [(SignalType.BATTERY, _scale(_i16(d, 1), 0.01))]


def _fluid_level(d: bytes):
    instance, fluid_type = d[0] & 0x0F, d[0] >> 4
    if fluid_type != 0 or instance != 0:  # 0 = combustible
        return []
    return [(SignalType.FUEL, _scale(_i16(d, 1), 0.004))]


def _engine_dynamic(d: bytes):
    if d[0] != 0:
        return []
    return [(SignalType.ENGINE_TEMP, _scale(_u16(d, 5), 0.01, -KELVIN))]


DECODERS: dict[int, Callable[[bytes], list]] = {
    128267: _depth,
    129025: _position,
    129026: _cog_sog,
    130306: _wind,
    127508: _battery,
    127505: _fluid_level,
    127489: _engine_dynamic,
}
FAST_PACKET_PGNS = {127489}


class FastPacket:
    """Reensambla mensajes fast-packet (hasta 223 bytes en varias tramas)."""

    def __init__(self) -> None:
        self._buf: dict[tuple, list] = {}  # key -> [largo, bytes, próxima trama]

    def add(self, src: int, pgn: int, data: bytes) -> bytes | None:
        seq, frame = data[0] >> 5, data[0] & 0x1F
        key = (src, pgn, seq)
        if frame == 0:
            entry = self._buf[key] = [data[1], bytearray(data[2:8]), 1]
        else:
            entry = self._buf.get(key)
            if entry is None or entry[2] != frame:
                self._buf.pop(key, None)
                return None
            entry[1] += data[1:8]
            entry[2] += 1
        if len(entry[1]) >= entry[0]:
            del self._buf[key]
            return bytes(entry[1][: entry[0]])
        return None


class N2kDecoder:
    def __init__(self) -> None:
        self._fast = FastPacket()

    def decode(self, can_id: int, data: bytes, ts: datetime | None = None) -> list[Signal]:
        pgn, src = parse_id(can_id)
        fn = DECODERS.get(pgn)
        if fn is None:
            return []
        if pgn in FAST_PACKET_PGNS:
            data = self._fast.add(src, pgn, data)
            if data is None:
                return []
        try:
            pairs = fn(data)
        except (struct.error, IndexError):
            return []
        ts = ts or datetime.now(timezone.utc)
        return [Signal.create(t, v, ts) for t, v in pairs if v is not None]
