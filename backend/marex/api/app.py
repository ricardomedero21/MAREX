from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from marex.api.engine import MarexEngine
from marex.api.schemas import ChatRequest, ChatResponse, SignalOut, StateOut


def create_app(engine: MarexEngine | None = None) -> FastAPI:
    """Construye la app FastAPI. Acepta un engine inyectado (para tests)."""
    eng = engine or MarexEngine()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        eng.start()
        yield
        eng.stop()

    app = FastAPI(title="Marex API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # prototipo: la app se conecta desde la wifi del barco
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.engine = eng

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.get("/state", response_model=StateOut)
    def state() -> StateOut:
        signals = [
            SignalOut(
                type=s.type.value,
                value=round(s.value, 4),
                unit=s.unit,
                timestamp=s.timestamp.isoformat(),
            )
            for s in eng.latest_signals()
        ]
        return StateOut(signals=signals)

    @app.post("/chat", response_model=ChatResponse)
    def chat(req: ChatRequest) -> ChatResponse:
        return ChatResponse(reply=eng.chat.send(req.message))

    return app


# Instancia por defecto para `uvicorn marex.api.app:app`
app = create_app()
