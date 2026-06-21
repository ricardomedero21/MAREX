# Motor de Alertas — Diseño

> Spec aprobado el 2026-06-21. Es la prioridad #1 del producto Marex
> (monitoreo + alertas inteligentes). Ver [[../../../../MEMORY|contexto]].

## Contexto

Marex debe avisar proactivamente cuando algo se sale de lo normal a bordo. Hoy
la pantalla de Alertas de la app muestra alertas **hardcodeadas** (visuales pero
sin lógica real). Este trabajo implementa el motor real en el backend, que
evalúa reglas sobre los datos del barco en cada tick de ingestión, y conecta la
app a esas alertas reales.

El simulador actual genera profundidad, SOG, COG, posición y viento. Para poder
demostrar las 5 alertas, se agregan al simulador batería, combustible y
temperatura de motor (datos simulados; los reales llegan en Fase 2 con el
gateway de PGN crudo).

Docker/contenedores quedan para la Fase B (Jetson); el backend se mantiene
containerizable (sin estado oculto, config por entorno).

## Arquitectura

Pieza nueva `backend/marex/alerts/`, lógica pura separada de la API.

```
MarexEngine (cada tick) → AlertEngine.evaluate(store, config) → list[Alert]
                                  ↓
              5 reglas puras (depth, battery, fuel, anchor, geofence)
```

- **`Alert`** (dataclass): `key`, `state` (ok|warn|danger|nodata), `title`,
  `detail`, `since` (timestamp de cuándo entró al estado actual).
- **`AlertConfig`** (dataclass): umbrales y referencias configurables —
  `depth_min`, `battery_min`, `fuel_min`, `anchor` (lat/lon/tolerancia o None),
  `geofence` (lat/lon/radio o None), y `enabled` por regla.
- **`AlertEngine`**: recibe `SignalStore` + `AlertConfig`, corre las 5 reglas,
  devuelve `list[Alert]`. Recuerda `since` por regla (única pieza de estado).
- **5 reglas** = funciones puras independientes, testeables por separado.
- **`haversine(lat1, lon1, lat2, lon2) -> metros`**: helper para anchor/geofence.

### Reglas

- **Profundidad baja**: `danger` si `depth < depth_min`; `warn` si
  `depth < depth_min + margen`; si no `ok`. `nodata` si falta el dato.
- **Batería baja**: `danger` si `battery < battery_min` (ej. 11.8 V); si no `ok`.
- **Combustible insuficiente**: `danger`/`warn` si `fuel%` bajo umbral
  (`fuel_min`). La fórmula con distancia a puerto llega cuando exista destino.
- **Anchor drag**: si `anchor` está fijado, `danger` cuando
  `haversine(pos, anchor) > tolerancia`; si no, regla inactiva (no se muestra o
  se muestra `ok` "sin fondeo").
- **Geofence**: si `geofence` está definido, `danger` cuando
  `haversine(pos, centro) > radio`; si no, inactiva.

## Datos nuevos (simulador)

`SignalType` suma: `BATTERY` (unit "V"), `FUEL` (unit "%"),
`ENGINE_TEMP` (unit "°C"). `UNITS` y `SimulatorSource.sample` los generan en
rangos realistas oscilantes (p. ej. batería 12.0–12.8 V, combustible 30–90 %,
temp motor 70–90 °C). El dashboard pasa a mostrar batería/combustible reales.

## API (FastAPI)

- `GET /alerts` → `list[Alert]` con estado actual.
- `GET /alerts/config` → configuración actual.
- `POST /alerts/config` → actualiza umbrales (depth_min, battery_min, fuel_min).
- `POST /alerts/anchor` → fija fondeo en la posición actual (o lo limpia con
  `{"clear": true}`).
- `POST /alerts/geofence` → fija zona en la posición actual + radio (o la limpia).

El `MarexEngine` evalúa el `AlertEngine` en cada tick y guarda la última lista de
alertas para que `GET /alerts` la devuelva sin recomputar.

## App

- **Pantalla Alertas**: reemplaza las alertas hardcodeadas por `GET /alerts`
  (polling, mismo patrón que `useBoatState`). Dos botones de acción:
  **"Fondear aquí"** (POST /alerts/anchor) y **"Definir zona aquí"**
  (POST /alerts/geofence con radio por defecto). Cada uno se puede desactivar.
  Estado "sin conexión" si el backend no responde.
- **Ajustes › Seguridad**: umbrales editables de batería y combustible (el de
  profundidad ya existe).
- **Dashboard**: batería/combustible muestran valores reales del backend.

## Verificación

- **Unit (pytest)**: cada regla (cruza umbral arriba/abajo, nodata), `haversine`
  con distancias conocidas, `AlertEngine` completo, simulador con los 3 nuevos
  tipos en rango.
- **API**: `GET /alerts`, `POST /alerts/anchor` y `/geofence` con `TestClient`.
- **End-to-end (preview)**: forzar profundidad baja → alerta roja en la app;
  "fondear aquí" y simular deriva → anchor drag dispara.

## Fuera de alcance

Notificaciones push, pantalla de Mapa con editor visual de geofence, fórmula de
combustible con distancia a puerto real, datos reales de motor (Fase 2).
