from marex.signals import SignalType
from marex.sources.simulator import SimulatorSource


def test_sample_returns_one_signal_per_type():
    sim = SimulatorSource()
    signals = sim.sample(0.0)
    types = {s.type for s in signals}
    assert types == set(SignalType)


def test_sample_values_are_in_realistic_ranges():
    sim = SimulatorSource()
    for elapsed in (0.0, 7.0, 33.0, 120.0):
        by_type = {s.type: s.value for s in sim.sample(elapsed)}
        assert 10.0 <= by_type[SignalType.DEPTH] <= 20.0
        assert 4.0 <= by_type[SignalType.SOG] <= 8.0
        assert 0.0 <= by_type[SignalType.COG] < 360.0
        assert 0.0 <= by_type[SignalType.WIND_ANGLE] < 360.0
        assert 8.0 <= by_type[SignalType.WIND_SPEED] <= 16.0
        assert 24.0 <= by_type[SignalType.LATITUDE] <= 27.0
        assert -81.0 <= by_type[SignalType.LONGITUDE] <= -79.0


def test_sample_is_deterministic():
    sim = SimulatorSource()
    a = {s.type: s.value for s in sim.sample(42.0)}
    b = {s.type: s.value for s in sim.sample(42.0)}
    assert a == b
