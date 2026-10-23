# Verbo Desktop: pasar las descargas de MEGA a GitHub Releases

Estado: **plan listo, sin ejecutar.** No se subió nada ni se cambiaron enlaces. Espera la confirmación de Juan.

## Por qué

MEGA pide abrir otra página, a veces limita la velocidad y no da un enlace directo estable. GitHub Releases da
enlaces directos y permanentes (`…/releases/download/<etiqueta>/<archivo>`), sin límite práctico para archivos de
este tamaño (hasta 2 GiB por archivo) y con el historial de versiones a la vista.

## Repositorio propuesto

`Juvejona1978/verbo-desktop` (público, solo para publicar versiones). El código de la app (`~/Verbo/App-Escritorio-Linux`)
no tiene remoto y no hace falta subirlo: un release puede vivir en un repositorio con solo un `LEEME.md`.

## Archivos de la versión Beta 0.9 (en `~/Verbo/Instaladores-Linux/`)

| Archivo | SHA-256 |
|---|---|
| `verbo-desktop_0.9.0~dev1_amd64.deb` | `ba068e0c…db244` |
| `verbo-desktop-0.9.0~dev1-1.x86_64.rpm` | `79bc840a…2119f` |
| `verbo-desktop_0.9.0~dev1_amd64.deb.asc` | firma separada del DEB |
| `SHA256SUMS` y `SHA256SUMS.asc` | copias en `software/descargas/` |

**Ojo con la tilde `~`.** GitHub cambia los caracteres raros de los nombres de archivo de los assets (la `~` puede
convertirse en `.`). Si pasa, `sha256sum -c SHA256SUMS` ya no encuentra el archivo y `gpg --verify` del `.asc` se
hace contra un nombre distinto (la firma sigue valiendo, pero las instrucciones de la web dejan de coincidir).
Dos salidas:

1. **Recomendada:** en la próxima compilación, usar versiones sin `~` (por ejemplo `0.9.0-beta1`), regenerar y firmar
   `SHA256SUMS` y publicar con esos nombres.
2. Publicar ya, comprobar los nombres que deja GitHub (`gh release view`) y, si cambiaron, regenerar `SHA256SUMS` con
   los nombres nuevos y volver a firmarlo (lo firma Juan con su clave).

## Comandos (no ejecutados)

```sh
cd ~/Verbo/Instaladores-Linux
cp ~/Verbo/Sitio-Web-verbobiblia/software/descargas/SHA256SUMS ~/Verbo/Sitio-Web-verbobiblia/software/descargas/SHA256SUMS.asc .

# 1. Repositorio solo para versiones
gh repo create Juvejona1978/verbo-desktop --public \
  --description "Verbo Desktop: estudio bíblico para Linux (descargas oficiales)"

# 2. Release Beta 0.9 marcado como prerelease
gh release create v0.9.0-beta --repo Juvejona1978/verbo-desktop \
  --title "Verbo Desktop Beta 0.9" --prerelease \
  --notes "Beta 0.9 para Linux Mint 22+ (.deb) y openSUSE Tumbleweed / Leap 16 (.rpm). Verificación: https://verbobiblia.com/verbo-desktop/#verificar" \
  "verbo-desktop_0.9.0~dev1_amd64.deb" \
  "verbo-desktop-0.9.0~dev1-1.x86_64.rpm" \
  "verbo-desktop_0.9.0~dev1_amd64.deb.asc" \
  SHA256SUMS SHA256SUMS.asc

# 3. Ver los nombres finales y los enlaces directos
gh release view v0.9.0-beta --repo Juvejona1978/verbo-desktop --json assets --jq '.assets[] | .name + "  " + .url'
```

## Después de confirmar (cambios en la web)

Los enlaces de MEGA están en tres lugares (ver también `version.json`):

- `software/index.html` (tarjetas .deb y .rpm)
- `verbo-desktop/index.html` (botones de descarga y nota «Las descargas se alojan en MEGA»)
- `verbo-desktop/version.json` (aviso de actualización de la app instalada)

Se reemplaza cada `https://mega.nz/file/…` por el enlace directo del release, se cambia el texto
`softwareExtra.desktopMirror` / `softwareExtra.hubDownloadNote` («Descargas externas en MEGA») por GitHub en ES y EN, y
la flecha ↗ se mantiene porque sigue siendo un enlace externo.
