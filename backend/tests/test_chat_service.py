from datetime import datetime, timezone

from marex.llm.base import LLM, LLMUnavailable, Message
from marex.llm.chat_service import ChatService, FALLBACK_REPLY
from marex.llm.context import build_boat_context
from marex.signals import Signal, SignalType
from marex.storage import SignalStore


def _store_with_data():
    store = SignalStore(":memory:")
    ts = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    store.append(Signal.create(SignalType.DEPTH, 14.2, ts))
    store.append(Signal.create(SignalType.SOG, 8.4, ts))
    store.append(Signal.create(SignalType.COG, 318.0, ts))
    store.append(Signal.create(SignalType.WIND_SPEED, 16.0, ts))
    store.append(Signal.create(SignalType.WIND_ANGLE, 290.0, ts))
    store.append(Signal.create(SignalType.LATITUDE, 25.7617, ts))
    store.append(Signal.create(SignalType.LONGITUDE, -80.1918, ts))
    return store


class _FakeLLM(LLM):
    def __init__(self, reply="respuesta"):
        self.reply = reply
        self.last_system = None
        self.last_messages = None

    def complete(self, system, messages):
        self.last_system = system
        self.last_messages = list(messages)
        return self.reply


class _BrokenLLM(LLM):
    def complete(self, system, messages):
        raise LLMUnavailable("ollama caido")


def test_context_includes_real_values():
    ctx = build_boat_context(_store_with_data())
    assert "14.2 m" in ctx
    assert "8.4 nudos" in ctx
    assert "318" in ctx
    assert "N" in ctx and "O" in ctx


def test_context_empty_store_says_no_data():
    ctx = build_boat_context(SignalStore(":memory:"))
    assert "sin datos" in ctx.lower()


def test_send_injects_context_into_system_prompt():
    llm = _FakeLLM("Profundidad 14.2 m, capitan.")
    chat = ChatService(llm, _store_with_data())
    out = chat.send("¿que profundidad tengo?")
    assert out == "Profundidad 14.2 m, capitan."
    assert "14.2 m" in llm.last_system
    assert "Marex" in llm.last_system


def test_history_accumulates_user_and_assistant():
    chat = ChatService(_FakeLLM("ok"), _store_with_data())
    chat.send("hola")
    chat.send("de nuevo")
    roles = [m.role for m in chat.history]
    assert roles == ["user", "assistant", "user", "assistant"]


def test_fallback_when_llm_unavailable_and_history_not_polluted():
    chat = ChatService(_BrokenLLM(), _store_with_data())
    out = chat.send("hola")
    assert out == FALLBACK_REPLY
    # El usuario queda en el historial, pero no una respuesta de respaldo.
    assert [m.role for m in chat.history] == ["user"]


def test_history_is_trimmed_to_max():
    chat = ChatService(_FakeLLM("ok"), _store_with_data(), max_history=4)
    for _ in range(5):
        chat.send("hola")
    assert len(chat.history) <= 4
