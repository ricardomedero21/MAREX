from datetime import datetime, timezone

from marex.signals import Signal, SignalType, UNITS


def test_create_sets_unit_from_type():
    s = Signal.create(SignalType.DEPTH, 12.5)
    assert s.type is SignalType.DEPTH
    assert s.value == 12.5
    assert s.unit == "m"
    assert s.timestamp.tzinfo is not None


def test_create_accepts_explicit_timestamp():
    ts = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    s = Signal.create(SignalType.SOG, 6.0, ts)
    assert s.timestamp == ts
    assert s.unit == "kn"


def test_every_signal_type_has_a_unit():
    for t in SignalType:
        assert t in UNITS
