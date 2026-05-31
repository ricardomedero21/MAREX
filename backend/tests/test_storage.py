from datetime import datetime, timedelta, timezone

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
