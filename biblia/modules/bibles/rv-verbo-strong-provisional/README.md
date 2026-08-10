# Biblia Verbo con Strong (provisional)

El texto de los 66 libros coincide exactamente con la edición editorial completa de Biblia Verbo. La capa Strong continúa siendo provisional.

Generada con `tools/build_rv_verbo_strong.py` a partir de STEPBible Data, CC BY 4.0. La reconstrucción transfiere una asociación anterior solamente cuando la palabra española permanece idéntica y el mismo código está presente en STEPBible para ese versículo. Las palabras nuevas se etiquetan únicamente mediante las reglas abiertas estrictas del generador.

La ubicación heredada procede de la referencia no comercial de Bible SuperSearch `rv_1909_strongs.sqlite`, cuyo etiquetado RV1909 fue desarrollado por Rubén Gómez. Una segunda referencia local RV1960+ se usa solo para ubicar candidatos que estén confirmados por versículo en STEPBible; no se copia su texto. Por esas dependencias posicionales, el módulo completo conserva el estado `provisional-noncommercial`.

Estados: `verified-open` se reproduce directamente con Biblia Verbo y STEPBible; `cross-verified-open` añade una relación palabra-código abierta, repetida y con precisión corpus-wide documentada; `provisional-reference` conserva una ubicación idéntica respaldada por el código del versículo, pero requiere revisión editorial.

Estado al 10 de agosto de 2026: 31.097 registros de versículos, texto idéntico a Biblia Verbo, 253.792 asociaciones y 29.080 versículos etiquetados. Hay 81.323 asociaciones `verified-open`, 14.425 `cross-verified-open` y 158.044 `provisional-reference`. La cobertura sobre los grupos STEPBible es 60,68 %. En el Nuevo Testamento, 16.286 asociaciones adicionales fueron confirmadas por coincidencia literal, composición exacta o variante flexiva de alta similitud con la glosa española abierta de STEPBible y morfología compatible. Las verificaciones corpus-wide y de pares palabra–código repetidos han promovido 8.578 relaciones abiertas adicionales. La auditoría integral de texto, versificación, segmentos, índices y diccionario no registra errores. La revisión editorial debe reemplazar progresivamente las asociaciones provisionales antes de adoptar una licencia abierta definitiva.
