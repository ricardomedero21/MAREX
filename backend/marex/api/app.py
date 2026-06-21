from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi import HTTPException

from marex.api.engine import MarexEngine
from marex.api.schemas import (
    AlertConfigUpdate,
    AlertOut,
    AlertsOut,
    AnchorRequest,
    ChatRequest,
    ChatResponse,
    ConfigOut,
    GeofenceRequest,
    SignalOut,
    StateOut,
)


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

    @app.get("/alerts", response_model=AlertsOut)
    def alerts() -> AlertsOut:
        return AlertsOut(
            alerts=[
                AlertOut(key=a.key.value, state=a.state.value, title=a.title, detail=a.detail)
                for a in eng.latest_alerts()
            ]
        )

    @app.get("/alerts/config", response_model=ConfigOut)
    def get_config() -> ConfigOut:
        c = eng.config
        return ConfigOut(
            depth_min=c.depth_min,
            battery_min=c.battery_min,
            fuel_min=c.fuel_min,
            fuel_warn=c.fuel_warn,
            anchor_set=c.anchor is not None,
            geofence_set=c.geofence is not None,
        )

    @app.post("/alerts/config", response_model=ConfigOut)
    def set_config(req: AlertConfigUpdate) -> ConfigOut:
        c = eng.config
        if req.depth_min is not None:
            c.depth_min = req.depth_min
        if req.battery_min is not None:
            c.battery_min = req.battery_min
        if req.fuel_min is not None:
            c.fuel_min = req.fuel_min
        if req.fuel_warn is not None:
            c.fuel_warn = req.fuel_warn
        return get_config()

    @app.post("/alerts/anchor", response_model=ConfigOut)
    def anchor(req: AnchorRequest) -> ConfigOut:
        if req.clear:
            eng.clear_anchor()
        elif not eng.set_anchor(req.tolerance_m):
            raise HTTPException(status_code=409, detail="Sin posición GPS para fijar el fondeo.")
        return get_config()

    @app.post("/alerts/geofence", response_model=ConfigOut)
    def geofence(req: GeofenceRequest) -> ConfigOut:
        if req.clear:
            eng.clear_geofence()
        elif not eng.set_geofence(req.radius_m):
            raise HTTPException(status_code=409, detail="Sin posición GPS para definir la zona.")
        return get_config()

    return app


# Instancia por defecto para `uvicorn marex.api.app:app`
app = create_app()
