from marex.sources.can_source import SocketCanSource
from marex.sources.factory import source_from_env
from marex.sources.simulator import SimulatorSource


def test_default_is_simulator(monkeypatch):
    monkeypatch.delenv("MAREX_DATA_SOURCE", raising=False)
    assert isinstance(source_from_env(), SimulatorSource)


def test_can_source_from_env(monkeypatch):
    monkeypatch.setenv("MAREX_DATA_SOURCE", "can")
    monkeypatch.setenv("MAREX_CAN_CHANNEL", "can1")
    src = source_from_env()
    assert isinstance(src, SocketCanSource)
    assert src.channel == "can1"
