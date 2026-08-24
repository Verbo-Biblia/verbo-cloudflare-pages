# Fuentes bíblicas externas utilizadas

Este directorio contiene solamente las fuentes necesarias para regenerar capas
que la aplicación usa actualmente en **Lenguajes originales**.

| Fuente | Alcance publicado | Licencia |
|---|---|---|
| MACULA Greek | NT completo, alineado conservadoramente con TAGNT | CC BY 4.0 |
| MACULA Hebrew | Salmo 8, enlazado con los 77 tokens TAHOT existentes | CC BY 4.0 |

Cada fuente tiene una entrada en `BIBLIOGRAPHY.json` con repositorio, commit,
atribución y SHA-256. Los objetos derivados enlazan esa entrada mediante su
campo de procedencia.

No se conservan datasets duplicados que no use la aplicación ni fuentes cuya
licencia aplicable no se haya podido determinar. Por esa razón se excluyeron
los snapshots redundantes N1904, SBLGNT e IGNTP.

## Regeneración

```bash
python3 tools/import_macula_hebrew_chapter.py
python3 tools/import_macula_greek.py
```
