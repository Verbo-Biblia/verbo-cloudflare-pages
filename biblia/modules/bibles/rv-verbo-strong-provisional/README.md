# Biblia Verbo con Strong (provisional)

El texto de los 66 libros coincide exactamente con la edición editorial completa de Biblia Verbo. La capa Strong continúa siendo provisional.

Generada con `tools/build_rv_verbo_strong.py` a partir de STEPBible Data, CC BY 4.0. La reconstrucción transfiere una asociación anterior solamente cuando la palabra española permanece idéntica y el mismo código está presente en STEPBible para ese versículo. Las palabras nuevas se etiquetan únicamente mediante las reglas abiertas estrictas del generador.

La ubicación heredada procede de la referencia no comercial de Bible SuperSearch `rv_1909_strongs.sqlite`, cuyo etiquetado RV1909 fue desarrollado por Rubén Gómez. Por esa dependencia, el módulo completo conserva el estado `provisional-noncommercial`.

Estados: `verified-open` se reproduce directamente con Biblia Verbo y STEPBible; `cross-verified-open` añade una relación palabra-código abierta, inequívoca y repetida; `provisional-reference` conserva una ubicación idéntica respaldada por el código del versículo, pero requiere revisión editorial.

Estado de la reconstrucción: 31.097 registros de versículos, texto idéntico a Biblia Verbo, 226.722 asociaciones, 28.942 versículos etiquetados y auditoría estructural sin errores. La cobertura sobre los grupos STEPBible es 54,20 %. La revisión editorial debe reemplazar progresivamente las 155.838 asociaciones provisionales antes de adoptar una licencia abierta definitiva.
