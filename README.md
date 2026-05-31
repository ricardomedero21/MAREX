# Marex 🛥️

**Asistente de inteligencia artificial de a bordo — un "capitán IA" para yates y lanchas.**

Marex se conecta a la red **NMEA 2000** de la embarcación para leer sus datos en
tiempo real, monitorear, alertar y asistir al patrón mediante un asistente
conversacional. Corre sobre una **NVIDIA Jetson Orin Nano** a bordo, funciona
**offline** (sin internet) y se potencia cuando hay conexión (p. ej. Starlink).

## Estado

🚧 **Prototipo — Fase 1** (en desarrollo, no comercial todavía).

## Arquitectura

| Componente | Tecnología | Rol |
|------------|-----------|-----|
| `backend/` | Python + FastAPI | Cerebro: ingestión de datos, motor de alertas, LLM local, API (REST + WebSocket). Corre en la Jetson. |
| `app/` | React Native + Expo | Cliente móvil (iOS/Android): dashboard, chat y alertas. |
| `sim/` | Python | Simulador de datos NMEA para desarrollo sin barco. |
| `docs/` | Markdown | Specs de diseño y decisiones de arquitectura. |

LLM local: **Llama 3.1 8B** cuantizado (Ollama/llama.cpp).

## Fases

- **Fase 0** — Cimientos: repo, scaffolding, modelo de datos, simulador.
- **Fase 1 (MVP)** — Simulador → alertas → API → app (dashboard + chat + alertas) + LLM local.
- **Fase 1.5** — Datos reales grabados con gateway Maretron USB100.
- **Fase 2** — Motor/combustible/baterías (gateway PGN crudo), MFD Garmin/Simrad, voz, nube/remoto.

## Alcance de la Fase 1

- **Datos:** posición/GPS, rumbo (COG), velocidad (SOG), profundidad, viento.
- **Alertas:** profundidad baja, batería baja, combustible insuficiente, anchor drag (fondeo), geofence.
- **Chat:** asistente conversacional en español, offline, sobre el estado del barco.
- **Aprendizaje:** registro completo de datos en base time-series (SQLite).
