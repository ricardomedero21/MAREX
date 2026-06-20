from datetime import datetime, timezone

from fastapi.testclient import TestClient

from marex.api.app import create_app
from marex.api.engine import MarexEngine
from marex.llm.base import LLM
from marex.llm.chat_service import ChatService
from marex.signals import Signal, SignalType
from marex.sources.base import DataSource
from marex.storage import SignalStore


class _IdleSource(DataSource):
    """Fuente que no emite nada (para no llenar el store en los tests)."""

    def stream(self):
        return iter(())


class _EchoLLM(LLM):
    def complete(self, system, messages):
        return "Recibido, capitan."


def _engine():
    store = SignalStore(":memory:")
    ts = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    store.append(Signal.create(SignalType.DEPTH, 14.2, ts))
    store.append(Signal.create(SignalType.SOG, 8.4, ts))
    chat = ChatService(_EchoLLM(), store)
    return MarexEngine(source=_IdleSource(), store=store, chat=chat)


def _client():
    return TestClient(create_app(_engine()))


def test_health():
    r = _client().get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_state_returns_latest_signals():
    r = _client().get("/state")
    assert r.status_code == 200
    by_type = {s["type"]: s for s in r.json()["signals"]}
    assert by_type["depth"]["value"] == 14.2
    assert by_type["depth"]["unit"] == "m"
    assert by_type["sog"]["value"] == 8.4


def test_chat_returns_reply():
    r = _client().post("/chat", json={"message": "hola"})
    assert r.status_code == 200
    assert r.json()["reply"] == "Recibido, capitan."


def test_chat_requires_message():
    r = _client().post("/chat", json={})
    assert r.status_code == 422
