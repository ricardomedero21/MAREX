import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

from marex.llm.base import LLMUnavailable, Message
from marex.llm.ollama_llm import OllamaLLM


class _Handler(BaseHTTPRequestHandler):
    captured = {}

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        _Handler.captured = json.loads(self.rfile.read(length))
        reply = json.dumps({"message": {"role": "assistant", "content": "  Hola capitan.  "}})
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(reply.encode("utf-8"))

    def log_message(self, *_):  # silenciar logs del server de test
        pass


@pytest.fixture
def fake_ollama():
    server = HTTPServer(("localhost", 0), _Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host = f"http://localhost:{server.server_address[1]}"
    yield host
    server.shutdown()


def test_complete_returns_stripped_content(fake_ollama):
    llm = OllamaLLM(model="gemma2:2b", host=fake_ollama)
    out = llm.complete("eres marex", [Message("user", "hola")])
    assert out == "Hola capitan."


def test_complete_sends_system_and_messages(fake_ollama):
    llm = OllamaLLM(model="gemma2:2b", host=fake_ollama)
    llm.complete("SYS", [Message("user", "u1"), Message("assistant", "a1")])
    sent = _Handler.captured
    assert sent["model"] == "gemma2:2b"
    assert sent["stream"] is False
    assert sent["messages"][0] == {"role": "system", "content": "SYS"}
    assert sent["messages"][1] == {"role": "user", "content": "u1"}
    assert sent["messages"][2] == {"role": "assistant", "content": "a1"}


def test_unreachable_host_raises_llm_unavailable():
    # Puerto cerrado: debe traducir el error de red a LLMUnavailable.
    llm = OllamaLLM(host="http://localhost:1", timeout=1.0)
    with pytest.raises(LLMUnavailable):
        llm.complete("sys", [Message("user", "hola")])
