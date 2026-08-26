# Matthew Poole — Annotations upon the Holy Bible

## Fuentes publicadas

- TCP `A55363`: *Annotations upon the Holy Bible*, vol. I, London, 1683.
  - Registro: https://name.umdl.umich.edu/A55363.0001.001
  - XML: https://raw.githubusercontent.com/textcreationpartnership/A55363/master/A55363.xml
  - SHA-256: `fc494999def0b470be3e1d826d1bb310fe2e627da7d9946067485ddc92fbe6b5`
- TCP `A55368`: *Annotations upon the Holy Bible*, vol. II, London, 1685.
  - Registro: https://name.umdl.umich.edu/A55368.0001.001
  - XML: https://raw.githubusercontent.com/textcreationpartnership/A55368/master/A55368.xml
  - SHA-256: `88e15a73286b932440edfa76936b374ba63360ffea2d62d0d3ba514c5cf9a6e6`

Ambos registros declaran que Text Creation Partnership renuncia, mediante
CC0 1.0, a los derechos sobre la edición transcrita y codificada. La renuncia
no cubre imágenes ni archivos suplementarios; Verbo usa solo los XML TEI.

## Autoría

Poole llegó hasta Isaías 58. Las entradas desde Isaías 59, aunque estén en el
XML del primer volumen físico, y las del volumen II se atribuyen a
`Continuation of Matthew Poole by various divines`, no personalmente a Poole.
El prefacio del volumen II presenta expresamente el resto como continuación de
su obra por varios teólogos.

## Tratamiento editorial

- Se excluye el texto bíblico continuo impreso alrededor de las notas.
- Se conservan las notas marginales y al pie, incluidas variantes y referencias.
- Se conservan los argumentos de libro como introducciones (`chapterStart: 0`).
- Los `<gap>` de TCP se publican como `[illegible]`; no se inventa texto perdido.
- Se eliminan marcadores de página y guiones tipográficos de fin de línea.
- Se corrigen dos problemas estructurales de TCP usando el impreso: los
  versículos conservados 25–47 de Levítico 11 quedaron anexados al bloque del
  capítulo 10, y Salmo 45 fue codificado con `n=65`.
- Cuando TCP divide un versículo impreso en varios párrafos, sus notas se unen
  en orden en una sola entrada Verbo; no se duplica el identificador.

## Construcción

```bash
python3 tools/import_matthew_poole.py
```

El importador descarga únicamente los dos XML, verifica los checksums y genera
el módulo. Los XML fuente no se versionan porque son artefactos reproducibles
de aproximadamente 33,6 MB en total.
