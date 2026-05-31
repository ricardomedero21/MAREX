# Marex — Asistente IA de a bordo (Capitán virtual). Diseño Prototipo Fase 1

> Spec de diseño aprobado el 2026-05-31. Producto: capitán IA de a bordo que se
> conecta a la red NMEA 2000 de la embarcación.

## Contexto

Marex es un producto de hardware + software que se monta en yates y lanchas
recreativas/deportivas y actúa como un "capitán IA" a bordo. Se conecta a la red
**NMEA 2000** para leer todos sus datos, aprender de la embarcación y asistir al
usuario.

Objetivo final comercial: prototipo funcional → hardware (probablemente fabricado
en China) → app con suscripción (mensual/anual). Este documento cubre **solo el
primer prototipo funcional**, no el lanzamiento al mercado.

Hardware actual: **NVIDIA Jetson Orin Nano** (cerebro). Gateway de datos actual:
**Maretron USB100** (NMEA 2000 → USB), con la limitación de que a terceros solo
entrega un subconjunto de PGNs traducidos a NMEA 0183 (no garantiza
motor/combustible/baterías). Mientras se consiguen datos reales, se desarrolla
contra **datos simulados**.

### Prioridades del producto
1. **Monitoreo + alertas inteligentes** (núcleo del MVP)
2. **Asistente conversacional** (chat de estado del barco, offline)
3. **Registro y aprendizaje** (base transversal: graba todo)
4. **Asistente de navegación** (resultado futuro)
- Futuro lejano: pesca + cámara (detección de capturas, recortes de trips).

### Decisiones clave
- **Offline-first, arquitectura híbrida.** Lo crítico (alertas, monitoreo, chat)
  corre 100% en la Jetson sin internet. La nube es un "plus" con señal (Starlink):
  monitoreo remoto, mejor IA, sync de datos.
- **Backend:** Python + FastAPI (REST + WebSocket).
- **App:** React Native + Expo (iOS/Android, con preview en desarrollo).
- **LLM local:** Llama 3.1 8B cuantizado (Ollama/llama.cpp).
- **Repo:** monorepo en GitHub, commits frecuentes desde el día 1.
- **Metodología:** skills de superpowers (brainstorming → writing-plans →
  executing-plans con TDD y revisiones).
- **MFD Garmin/Simrad vía Ethernet** y **voz:** Fase 2.

## Arquitectura

### 1. `backend/` — el cerebro (Python, corre en la Jetson)

- **Ingestión (interfaz intercambiable `DataSource`):**
  - `SimulatorSource` — genera datos NMEA realistas (desarrollo).
  - `RecordingSource` — reproduce grabaciones reales del USB100.
  - `SerialNmea0183Source` — lee el USB100 en vivo por puerto serial.
  - `CanboatSource` — PGN crudo vía canboat (Fase 2: motor/combustible/baterías).
  Todas normalizan a un **modelo interno de señales** (depth, sog, cog, position,
  wind; luego rpm/fuel/battery/engine_temp).
- **Almacenamiento time-series (SQLite):** graba toda la data. Base del
  aprendizaje (#3) y de la sync futura a la nube.
- **Motor de alertas (reglas configurables):** profundidad baja, batería baja,
  combustible insuficiente para volver, anchor drag, geofence.
- **Servicio conversacional:** LLM local offline con acceso a estado actual +
  histórico; interfaz que permite escalar a Claude API con internet sin acoplar
  el resto del sistema al proveedor.
- **Servidor API (FastAPI):** REST (estado, histórico, config) + WebSocket
  (tiempo real + push de alertas).

### 2. `app/` — el cliente (React Native + Expo)

- Dashboard en vivo, chat con Marex (español, offline), alertas con
  notificaciones, configuración (umbrales, geofence, punto de fondeo).
- Se conecta a la Jetson por la wifi del barco (WebSocket/REST); la misma base
  sirve luego para acceso remoto.

### 3. Nube + MFD → Fase 2

Monitoreo remoto, suscripción, voz, MFD Garmin/Simrad, gateway PGN crudo.

### Estructura del monorepo

```
marex/
  backend/   # Python: ingestión, alertas, LLM, API (FastAPI)
  app/       # React Native + Expo
  sim/       # simulador de datos NMEA
  data/      # grabaciones reales del USB100 (gitignored si son grandes)
  docs/      # specs de superpowers, ADRs
  README.md
```

## Alcance del prototipo (Fase 1)

- **Datos (dashboard):** posición, COG, SOG, profundidad, viento.
- **Alertas:** profundidad baja, batería baja, combustible insuficiente, anchor
  drag, geofence.
- **Conversacional:** chat de texto en español, offline, sobre estado actual e
  histórico.
- **Aprendizaje:** grabación completa en SQLite time-series.

**Fuera de alcance (Fase 1):** voz, MFD Garmin, nube/remoto, gateway PGN crudo
(motor/combustible reales), suscripción, pesca/cámara.

## Roadmap

- **Fase 0 — Cimientos:** repo + scaffolding backend/app, modelo de señales,
  `SimulatorSource`, README. Primer commit.
- **Fase 1 — MVP end-to-end:** ingestión simulada → SQLite → alertas → API
  (REST+WS) → app Expo (dashboard + chat + alertas) → LLM local. Demostrable.
- **Fase 1.5 — Data real:** grabación con USB100; ajustar parsers y umbrales.
- **Fase 2 — Producto:** gateway PGN crudo, MFD Garmin/Simrad, voz, nube/remoto,
  suscripción, hardware para fabricar.

## Verificación

- **Backend:** pytest del modelo de señales, motor de alertas (profundidad cruza
  umbral, anchor drag, geofence, combustible) e ingestión con `SimulatorSource`.
  TDD: test primero.
- **API:** tests de endpoints REST y canal WebSocket (datos en vivo + alertas).
- **App:** correr en Expo, conectar al backend local, verificar dashboard en
  vivo, alerta al cruzar umbral, y respuesta del chat.
- **End-to-end Fase 1:** simulador → backend → app mostrando dashboard +
  alerta + respuesta del chat. Esa es la demo de validación.
