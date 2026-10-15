# Marex — contexto para Claude Code

Capitán IA de a bordo para lanchas y yates (pesca deportiva, motores gemelos
Babor/Estribor). Lee la red NMEA 2000, monitorea, alerta y conversa en español.
Corre **offline** en una NVIDIA Jetson Orin Nano; mercado: Venezuela/LatAm,
modelo por suscripción. Autor: Ing. Ricardo Medero (Nautinations).

## Estructura
- `backend/` — Python 3.11 + FastAPI. Cerebro: ingestión → SQLite → motor de
  alertas → chat con LLM local (Ollama). Tests: `cd backend && python -m pytest -q`.
- `app/` — React Native + Expo SDK 54 (iOS/Android). Dashboard, Alertas, Chat
  (botón central), Ajustes. Si el backend no responde, usa su simulador local.
  Chequeo: `cd app && npx tsc --noEmit`.
- `docs/superpowers/` — specs y planes (brainstorming → writing-plans → TDD).
- `docker-compose.yml` — despliegue en la Jetson (backend; Ollama nativo).

## Fuentes de datos (`MAREX_DATA_SOURCE`)
- `simulator` (default en PC) — `marex/sources/simulator.py`.
- `can` — NMEA 2000 en vivo por SocketCAN (`MAREX_CAN_CHANNEL`, default `can0`)
  con el adaptador **RH-02** (clon CANable) a **250 kbit/s**.
  Decodificador: `marex/sources/n2k.py` (PGNs 128267, 129025, 129026, 130306,
  127508, 127505, 127489 con fast-packet). Batería/combustible/motor: instancia 0.
- Maretron USB100 (NMEA 0183): reemplazado por el RH-02 (PGN crudo, incluye motores).

## Decisiones vigentes
- Offline-first; la nube (Claude API con Starlink) es un plus, nunca requisito.
- LLM local: Llama 3.2 3B vía Ollama nativo en la Jetson (validar latencia).
- Alertas por reglas primero; perfiles estadísticos por barco y ML (Isolation
  Forest) cuando haya 20–30 h de datos reales grabados.
- MFD Garmin (OneHelm HTML5 por Ethernet + PoE Isolation Coupler), voz
  (Whisper + Piper, Yealink SP92) y cámara: fases posteriores.

## Convenciones
- Commits en español, con archivo de mensaje UTF-8 (`git commit -F`), ver
  `docs/commits-utf8.md`. Una rama por feature, merge a `main`.
- Sin espacios ni acentos en nombres de archivo. Nunca subir `.env`.
- Respuestas cortas, sin narrar planes; ediciones parciales; validar (tests /
  tsc) antes de dar algo por hecho.

## Pendiente (oct 2026)
1. Levantar `can0` en la Jetson y validar lectura real del bus.
2. Desplegar backend en la Jetson y medir el chat con Llama 3.2 3B.
3. Grabar navegaciones reales (`candump -l can0`) y fuente de reproducción.
4. Motores gemelos: RPM (127488), presión de aceite, horas — instancias 0/1.
5. WebSocket para tiempo real (hoy la app consulta por polling).
