import math
import struct
from types import SimpleNamespace

import pytest

from marex.signals import SignalType
from marex.sources.can_source import SocketCanSource
from marex.sources.n2k import N2kDecoder, parse_id


def can_id(pgn: int, src: int = 35, prio: int = 2) -> int:
    """Identificador CAN de 29 bits para un PGN PDU2 (broadcast)."""
    return (prio << 26) | (pgn << 8) | src


def by_type(signals):
    return {s.type: s.value for s in signals}


def test_parse_id_pdu2_and_pdu1():
    assert parse_id(can_id(129026, src=7)) == (129026, 7)
    # PDU1 (PF < 240): el byte PS es destino, no forma parte del PGN.
    pdu1 = (3 << 26) | (0xEA << 16) | (0x22 << 8) | 0x10  # ISO Request a 0x22
    assert parse_id(pdu1) == (59904, 0x10)


def test_depth_below_keel_uses_negative_offset():
    data = struct.pack("<BIhB", 1, 1234, -500, 0xFF)  # 12.34 m, quilla a 0.5 m
    out = by_type(N2kDecoder().decode(can_id(128267), data))
    assert out[SignalType.DEPTH] == pytest.approx(11.84)


def test_depth_not_available_is_ignored():
    data = struct.pack("<BIhB", 1, 0xFFFFFFFF, 0, 0xFF)
    assert N2kDecoder().decode(can_id(128267), data) == []


def test_position_rapid():
    data = struct.pack("<ii", int(10.6012345 * 1e7), int(-66.9312345 * 1e7))
    out = by_type(N2kDecoder().decode(can_id(129025), data))
    assert out[SignalType.LATITUDE] == pytest.approx(10.6012345, abs=1e-6)
    assert out[SignalType.LONGITUDE] == pytest.approx(-66.9312345, abs=1e-6)


def test_cog_sog_rapid_converts_to_degrees_and_knots():
    cog = int(math.radians(247) * 1e4)
    sog = int(5.0 * 100)  # 5 m/s
    data = struct.pack("<BBHH", 1, 0xFC, cog, sog) + b"\xff\xff"
    out = by_type(N2kDecoder().decode(can_id(129026), data))
    assert out[SignalType.COG] == pytest.approx(247, abs=0.01)
    assert out[SignalType.SOG] == pytest.approx(9.719, abs=0.01)


def test_wind():
    data = struct.pack("<BHHB", 1, 600, int(math.radians(90) * 1e4), 2) + b"\xff\xff"
    out = by_type(N2kDecoder().decode(can_id(130306), data))
    assert out[SignalType.WIND_SPEED] == pytest.approx(11.663, abs=0.01)
    assert out[SignalType.WIND_ANGLE] == pytest.approx(90, abs=0.01)


def test_battery_instance_0_only():
    dec = N2kDecoder()
    data0 = struct.pack("<BhhHB", 0, 1265, 0, 0xFFFF, 1)
    data1 = struct.pack("<BhhHB", 1, 1300, 0, 0xFFFF, 1)
    assert by_type(dec.decode(can_id(127508), data0)) == {SignalType.BATTERY: pytest.approx(12.65)}
    assert dec.decode(can_id(127508), data1) == []


def test_fuel_level_only_fuel_type_instance_0():
    dec = N2kDecoder()
    fuel = struct.pack("<BhIB", 0x00, int(55.0 / 0.004), 4000, 0xFF)
    water = struct.pack("<BhIB", 0x10, int(80.0 / 0.004), 4000, 0xFF)
    assert by_type(dec.decode(can_id(127505), fuel))[SignalType.FUEL] == pytest.approx(55.0)
    assert dec.decode(can_id(127505), water) == []


def engine_dynamic_payload(instance: int, temp_c: float) -> bytes:
    temp = int((temp_c + 273.15) * 100)
    return struct.pack("<BHHHhhIHHBHHbb", instance, 0xFFFF, 0xFFFF, temp,
                       0x7FFF, 0x7FFF, 0xFFFFFFFF, 0xFFFF, 0xFFFF, 0xFF,
                       0, 0, 0x7F, 0x7F)


def fast_packet_frames(payload: bytes, seq: int = 1) -> list[bytes]:
    frames = [bytes([seq << 5, len(payload)]) + payload[:6]]
    rest, n = payload[6:], 1
    while rest:
        chunk = rest[:7].ljust(7, b"\xff")
        frames.append(bytes([(seq << 5) | n]) + chunk)
        rest, n = rest[7:], n + 1
    return frames


def test_engine_dynamic_fast_packet_reassembly():
    dec = N2kDecoder()
    frames = fast_packet_frames(engine_dynamic_payload(0, 82.5))
    results = [dec.decode(can_id(127489), f) for f in frames]
    assert all(r == [] for r in results[:-1])
    assert by_type(results[-1])[SignalType.ENGINE_TEMP] == pytest.approx(82.5)


def test_fast_packet_out_of_order_is_dropped():
    dec = N2kDecoder()
    frames = fast_packet_frames(engine_dynamic_payload(0, 80.0))
    out = [dec.decode(can_id(127489), f) for f in [frames[0], frames[2], frames[1], frames[3]]]
    assert all(r == [] for r in out)


def test_unknown_pgn_is_ignored():
    assert N2kDecoder().decode(can_id(60928), b"\x00" * 8) == []


class FakeBus:
    def __init__(self, frames):
        self._frames = list(frames)

    def recv(self, timeout=None):
        if not self._frames:
            raise StopIteration  # corta el stream infinito en el test
        cid, data = self._frames.pop(0)
        return SimpleNamespace(arbitration_id=cid, data=data, is_extended_id=True)


def test_socketcan_source_streams_decoded_signals():
    depth = struct.pack("<BIhB", 1, 1500, 0, 0xFF)
    pos = struct.pack("<ii", int(10.6 * 1e7), int(-66.9 * 1e7))
    src = SocketCanSource(interval=0.0, bus=FakeBus([(can_id(128267), depth), (can_id(129025), pos)]))
    ticks = []
    with pytest.raises(RuntimeError):  # StopIteration dentro de un generador → RuntimeError
        for tick in src.stream():
            ticks.append(by_type(tick))
    assert ticks[0] == {SignalType.DEPTH: pytest.approx(15.0)}
    assert ticks[1][SignalType.LATITUDE] == pytest.approx(10.6)
