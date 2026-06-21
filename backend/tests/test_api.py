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
    store.append(Signal.create(SignalType.LATITUDE, 25.0, ts))
    store.append(Signal.create(SignalType.LONGITUDE, -80.0, ts))
    store.append(Signal.create(SignalType.BATTERY, 12.5, ts))
    store.append(Signal.create(SignalType.FUEL, 80.0, ts))
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


def test_alerts_returns_five_rules():
    r = _client().get("/alerts")
    assert r.status_code == 200
    keys = {a["key"] for a in r.json()["alerts"]}
    assert keys == {"depth_low", "battery_low", "fuel_low", "anchor_drag", "geofence"}


def test_set_anchor_then_config_reports_it():
    c = _client()
    r = c.post("/alerts/anchor", json={"tolerance_m": 30})
    assert r.status_code == 200
    assert r.json()["anchor_set"] is True
    # limpiar lo desactiva
    r2 = c.post("/alerts/anchor", json={"clear": True})
    assert r2.json()["anchor_set"] is False


def test_set_geofence_and_update_config():
    c = _client()
    assert c.post("/alerts/geofence", json={"radius_m": 50}).json()["geofence_set"] is True
    r = c.post("/alerts/config", json={"depth_min": 5.0})
    assert r.json()["depth_min"] == 5.0


def test_anchor_without_gps_returns_409():
    # engine sin posición → set_anchor falla
    from marex.llm.chat_service import ChatService

    store = SignalStore(":memory:")
    store.append(Signal.create(SignalType.DEPTH, 10.0, datetime(2026, 1, 1, tzinfo=timezone.utc)))
    eng = MarexEngine(source=_IdleSource(), store=store, chat=ChatService(_EchoLLM(), store))
    c = TestClient(create_app(eng))
    r = c.post("/alerts/anchor", json={})
    assert r.status_code == 409
