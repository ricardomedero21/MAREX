# Convención: commits en español con UTF-8 (Windows)

## Problema

En Windows + PowerShell 5.1, los mensajes de commit con tildes y ñ se corrompían
(`diseño` → `diseno`, mangling tipo `backffd`). Causa raíz:

- `$OutputEncoding` de PowerShell 5.1 es **us-ascii** por defecto. Esa variable es
  la que PowerShell usa al pasar texto a ejecutables nativos como `git`, así que
  `git commit -m "diseño"` y los here-strings (`@'...'@`) pierden los caracteres no-ASCII.
- `chcp` ya era 65001 y `[Console]::OutputEncoding` ya era utf-8: el code page de la
  consola **no** era el problema. El cuello de botella es `$OutputEncoding`.

## Solución estándar del repo

**Hacer commits con un archivo de mensaje en UTF-8, nunca con `-m` ni here-strings.**

1. Escribir el mensaje en un archivo UTF-8 (sin BOM). Con Claude Code: usar la
   herramienta `Write` (escribe UTF-8 sin BOM). A mano: `Set-Content msg.txt -Encoding utf8`.
2. Commitear con `-F`:

   ```
   git commit -F msg.txt
   ```

3. Borrar el archivo temporal.

Config del repo ya aplicada (commit-local, no global):

```
git config i18n.commitEncoding utf-8
git config i18n.logOutputEncoding utf-8
```

## Verificado

```
git commit --allow-empty -F msg.txt   # msg: "diseño, configuración, ñandú áéíóú"
git log -1 --format=%s                 # → diseño, configuración, ñandú áéíóú  ✓
```

## Qué NO usar

- ❌ `git commit -m "mensaje con tildes"` desde PowerShell 5.1.
- ❌ here-strings (`@'...'@`) hacia git en PowerShell 5.1.
- ✅ Siempre `git commit -F archivo.txt` con el archivo escrito en UTF-8.

## Alternativa (si se prefiere `-m`)

Fijar en el perfil de PowerShell:

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

Con eso `-m` también respeta UTF-8, pero el flujo con `-F` es el oficial del repo por
ser independiente de la config de cada máquina.
