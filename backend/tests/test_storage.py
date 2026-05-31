from datetime import datetime, timedelta, timezone

import pytest

from marex.signals import Signal, SignalType
from marex.storage import SignalStore


def _store():
    return SignalStore(":memory:")


def test_append_and_latest_returns_most_recent():
    store = _store()
    t1 = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 1, 1, 12, 0, 1, tzinfo=timezone.utc)
    store.append(Signal.create(SignalType.DEPTH, 10.0, t1))
    store.append(Signal.create(SignalType.DEPTH, 11.0, t2))
    latest = store.latest(SignalType.DEPTH)
    assert latest is not None
    assert latest.value == 11.0
    assert latest.unit == "m"


def test_latest_returns_none_when_empty():
    assert _store().latest(SignalType.SOG) is None


def test_append_many_and_history_filters_by_type_and_time():
    store = _store()
    base = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    store.append_many(
        Signal.create(SignalType.DEPTH, float(i), base + timedelta(seconds=i))
        for i in range(5)
    )
    store.append(Signal.create(SignalType.SOG, 99.0, base))  # otro tipo, se excluye
    rows = store.history(SignalType.DEPTH, base, base + timedelta(seconds=2))
    assert [r.value for r in rows] == [0.0, 1.0, 2.0]


def test_round_trip_preserves_timezone_aware_timestamp():
    store = _store()
    ts = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    store.append(Signal.create(SignalType.DEPTH, 10.0, ts))
    latest = store.latest(SignalType.DEPTH)
    assert latest.timestamp.tzinfo is not None
    assert latest.timestamp == ts


def test_append_rejects_naive_timestamp():
    store = _store()
    naive = Signal(SignalType.DEPTH, 10.0, datetime(2026, 1, 1, 12, 0, 0), "m")
    with pytest.raises(ValueError):
        store.append(naive)


def test_store_works_as_context_manager():
    ts = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    with SignalStore(":memory:") as store:
        store.append(Signal.create(SignalType.SOG, 6.0, ts))
        assert store.latest(SignalType.SOG).value == 6.0
