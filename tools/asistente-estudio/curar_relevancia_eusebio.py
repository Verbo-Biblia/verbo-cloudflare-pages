#!/usr/bin/env python3
"""
Fase 1 (continuación) — Parte C: curación de relevancia (PROPUESTA, no definitiva).

Toma la unión de 78 entradas de Eusebio activadas por el NT completo
(generada por dimensionar_curacion_eusebio.py, data/_eusebio_union_nt.json)
y les asigna una propuesta de relevancia ("alta"/"baja") + justificación,
pensando en un pastor que lee el NT y quiere contexto histórico puntual.

Es una PROPUESTA para que Juan revise el criterio — no filtra ni descarta
nada todavía.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"

# eusebioId -> (relevancia, justificacion)
CURACION = {
    # ---- Libro I — Orígenes y persona de Cristo (1-33 d.C.) ----
    "eusebio-he-l1-c1": ("baja", "Es el plan metodológico de Eusebio para su propia obra, no aporta trasfondo histórico del período."),
    "eusebio-he-l1-c2": ("baja", "Tratado teológico sobre la preexistencia/divinidad de Cristo, no trasfondo histórico-cultural puntual."),
    "eusebio-he-l1-c3": ("baja", "Argumento apologético sobre los nombres 'Jesús'/'Cristo', no dato histórico nuevo."),
    "eusebio-he-l1-c4": ("baja", "Argumento apologético general ('la religión no era nueva'), sin dato puntual."),
    "eusebio-he-l1-c5": ("alta", "Ubica cronológicamente el nacimiento de Cristo frente al censo romano — trasfondo político-administrativo directo de Lc 2."),
    "eusebio-he-l1-c6": ("alta", "Explica el fin de la sucesión de gobernantes judíos nativos y la llegada de Herodes como el 'primer extranjero' rey — clave para leer las genealogías/profecías mesiánicas de Mt 1-2 y el contexto político de los Evangelios."),
    "eusebio-he-l1-c7": ("alta", "Aborda directamente la aparente discrepancia entre las genealogías de Mateo y Lucas — trasfondo interpretativo puntual y muy citado."),
    "eusebio-he-l1-c8": ("alta", "Detalla la crueldad de Herodes y las circunstancias de su muerte — ilumina directamente Mt 2 (matanza de los inocentes, regreso de Egipto)."),
    "eusebio-he-l1-c9": ("alta", "Contextualiza el gobierno de Poncio Pilato — trasfondo directo de los relatos de la Pasión en los cuatro Evangelios."),
    "eusebio-he-l1-c10": ("alta", "Identifica a los sumos sacerdotes bajo los que Cristo enseñó (Anás, Caifás) — trasfondo directo de los Evangelios y Hechos 4."),
    "eusebio-he-l1-c11": ("alta", "Reúne testimonios extrabíblicos (incl. Josefo) sobre Juan el Bautista y Cristo — corroboración histórica puntual, útil para los relatos de los Evangelios."),
    "eusebio-he-l1-c12": ("baja", "Listado incidental de discípulos, sin trasfondo cultural o político nuevo."),
    "eusebio-he-l1-c13": ("baja", "La leyenda del rey Abgaro de Edesa es una tradición extracanónica tangencial, no ilumina un pasaje del NT en concreto."),

    # ---- Libro II — Época apostólica (33-100 d.C.) ----
    "eusebio-he-l2-c1": ("baja", "Resumen general de la misión apostólica tras la ascensión, sin dato puntual más allá de lo que ya narra Hch 1-2."),
    "eusebio-he-l2-c2": ("baja", "La supuesta reacción de Tiberio ante el informe de Pilato es tradición apologética poco fiable, tangencial."),
    "eusebio-he-l2-c3": ("baja", "Afirmación apologética general sobre la rápida expansión de la fe, sin dato puntual."),
    "eusebio-he-l2-c4": ("alta", "El nombramiento de Herodes Agripa I como rey (tras el destierro de Herodes Antipas) es trasfondo político directo de Hch 12."),
    "eusebio-he-l2-c5": ("alta", "La embajada de Filón ante Calígula ilustra la tensión judío-romana real del período narrado en Hechos (estatua imperial en el Templo)."),
    "eusebio-he-l2-c6": ("baja", "Marco moralizante/teológico ('juicio divino sobre los judíos'), no aporta dato histórico puntual nuevo."),
    "eusebio-he-l2-c7": ("baja", "El suicidio de Pilato es un dato posterior sobre el personaje; no ilumina la lectura de un pasaje del NT en sí."),
    "eusebio-he-l2-c8": ("alta", "La hambruna bajo Claudio es la corroboración histórica directa de la profecía de Agabo en Hch 11:28 — ejemplo de manual de relevancia alta."),
    "eusebio-he-l2-c9": ("alta", "El martirio de Jacobo (hijo de Zebedeo) es exactamente el evento narrado en Hch 12:2."),
    "eusebio-he-l2-c10": ("alta", "La muerte de Agripa 'comido de gusanos' es el evento narrado en Hch 12:20-23."),
    "eusebio-he-l2-c11": ("alta", "El impostor Teudas es mencionado por nombre en el discurso de Gamaliel, Hch 5:36 — conexión textual directa."),
    "eusebio-he-l2-c12": ("baja", "AJUSTADO por Juan: la reina Helena de Osroene es trasfondo tangencial (conexión con Hch 11:28-30 indirecta, vía una fuente distinta a Eusebio), no una corroboración directa del texto."),
    "eusebio-he-l2-c13": ("alta", "Simón el Mago es el personaje de Hch 8:9-24 — conexión textual directa."),
    "eusebio-he-l2-c14": ("alta", "La predicación de Pedro en Roma es trasfondo directo para la tradicional ubicación de composición de 1 Pedro ('Babilonia' = Roma, 1 Pe 5:13)."),
    "eusebio-he-l2-c15": ("alta", "El origen del Evangelio de Marcos (ligado a la predicación de Pedro) es trasfondo compositivo directo y muy citado del segundo Evangelio."),
    "eusebio-he-l2-c16": ("baja", "La tradición sobre la misión posterior de Marcos en Egipto es tangencial, sin conexión a un pasaje del NT."),
    "eusebio-he-l2-c17": ("baja", "La identificación (histórica y probablemente errónea) de los terapeutas de Filón con monjes cristianos es tangencial y no ilumina el NT."),
    "eusebio-he-l2-c18": ("baja", "Catálogo bibliográfico de obras de Filón, sin narrativa histórica conectada al NT."),
    "eusebio-he-l2-c19": ("baja", "Incidente de Josefo sobre una matanza en el Templo en Pascua — trasfondo general de la época, sin conexión textual puntual."),
    "eusebio-he-l2-c20": ("baja", "Relato general de disturbios en Jerusalén bajo Nerón, trasfondo amplio sin anclaje a un pasaje específico."),
    "eusebio-he-l2-c21": ("alta", "'El Egipcio' es mencionado explícitamente por el tribuno romano en Hch 21:38 — conexión textual directa."),
    "eusebio-he-l2-c22": ("alta", "El primer juicio y liberación de Pablo en Roma es la base tradicional para fechar Efesios/Colosenses/Filipenses/Filemón y para la hipótesis del 'segundo encarcelamiento' detrás de las Pastorales — caso ya señalado como disputado en la clasificación del NT."),
    "eusebio-he-l2-c23": ("alta", "El martirio de Jacobo 'el hermano del Señor' es directamente relevante para la autoría/fecha de la epístola de Santiago, ya marcada como caso dudoso."),
    "eusebio-he-l2-c24": ("baja", "Lista de sucesión episcopal de Alejandría, sin conexión temática a un pasaje del NT (ejemplo típico de 'baja' según el criterio pedido)."),
    "eusebio-he-l2-c25": ("alta", "La persecución de Nerón y el martirio de Pablo y Pedro en Roma es trasfondo directo del final de la vida de ambos apóstoles, relevante para 2 Timoteo."),
    "eusebio-he-l2-c26": ("alta", "El inicio de la guerra judía contra Roma contextualiza la urgencia escatológica de Hebreos y el cumplimiento de las profecías de Jesús sobre Jerusalén."),

    # ---- Libro III — Sucesión apostólica (68-117 d.C.) ----
    "eusebio-he-l3-c1": ("alta", "Detalla dónde ministró cada apóstol, incl. Juan en Asia — trasfondo directo del entorno de Apocalipsis y 1-3 Juan (las 7 iglesias de Asia Menor)."),
    "eusebio-he-l3-c2": ("baja", "Sucesión episcopal de Roma (Lino), sin conexión temática a un pasaje del NT."),
    "eusebio-he-l3-c3": ("alta", "Discute qué epístolas apostólicas se consideraban genuinas/disputadas — conecta directamente con las disputas de autoría/canonicidad de Santiago, 2 Pedro, Judas, 2-3 Juan ya señaladas."),
    "eusebio-he-l3-c4": ("baja", "Nota general sobre los primeros sucesores de los apóstoles, sin dato puntual."),
    "eusebio-he-l3-c5": ("alta", "El asedio final de Jerusalén (70 d.C.) es trasfondo histórico directo del cumplimiento de las profecías de Jesús y la urgencia de Hebreos."),
    "eusebio-he-l3-c6": ("baja", "Detalle adicional (la hambruna durante el asedio) ya cubierto conceptualmente por III.5, sin anclaje textual propio."),
    "eusebio-he-l3-c7": ("alta", "Conecta explícitamente las profecías de Jesús (Mt 24, Mc 13, Lc 21) con su cumplimiento histórico en la guerra judía — ilumina directamente esos pasajes."),
    "eusebio-he-l3-c8": ("baja", "Los presagios (de Josefo) que precedieron la guerra son de carácter legendario/general, sin anclaje textual puntual."),
    "eusebio-he-l3-c9": ("baja", "Catálogo bibliográfico de las obras de Josefo, referencia útil pero no narrativa conectada a un pasaje del NT."),
    "eusebio-he-l3-c10": ("baja", "Discute el canon del AT según Josefo — trasfondo de historia del canon, tangencial a la interpretación del NT."),
    "eusebio-he-l3-c11": ("baja", "Sucesión episcopal de Jerusalén (Simeón tras Jacobo), incidental."),
    "eusebio-he-l3-c12": ("baja", "Anécdota específica pero sin conexión a un pasaje del NT (a diferencia de III.19-20, que sí se conectan con la familia de Judas)."),
    "eusebio-he-l3-c13": ("baja", "Sucesión episcopal de Roma (Anacleto), incidental."),
    "eusebio-he-l3-c14": ("baja", "Sucesión episcopal de Alejandría (Abilio), incidental."),
    "eusebio-he-l3-c15": ("baja", "Sucesión episcopal de Roma (Clemente); la identificación tradicional con el 'Clemente' de Flp 4:3 es especulativa y no está en este capítulo puntual."),
    "eusebio-he-l3-c16": ("baja", "La Epístola de Clemente informa sobre la iglesia de Corinto en la siguiente generación, pero es historia post-NT, no ilumina un pasaje puntual del NT."),
    "eusebio-he-l3-c17": ("alta", "La persecución bajo Domiciano es la base tradicional para la fecha 'domicianea' de Apocalipsis — caso central ya señalado como disputado."),
    "eusebio-he-l3-c18": ("alta", "Narra directamente el destierro de Juan en Patmos y la escritura de Apocalipsis — conexión textual directa y central."),
    "eusebio-he-l3-c19": ("alta", "El temor de Domiciano a los descendientes de David es el antecedente directo de la anécdota sobre los nietos de Judas (III.20)."),
    "eusebio-he-l3-c20": ("alta", "Relata el interrogatorio a los nietos de Judas (el hermano del Señor) ante Domiciano — trasfondo directo sobre la familia y época del autor tradicional de la epístola de Judas."),
    "eusebio-he-l3-c21": ("baja", "Sucesión episcopal de Alejandría (Cerdón), incidental."),
    "eusebio-he-l3-c22": ("baja", "Nota de sucesión (Ignacio como segundo obispo de Antioquía); el contenido relevante de Ignacio está en III.36, no aquí."),
    "eusebio-he-l3-c23": ("baja", "La anécdota de 'Juan y el ladrón' es edificante pero no ilumina un pasaje específico del NT."),
    "eusebio-he-l3-c24": ("alta", "Expone el orden y la ocasión tradicional de composición de los cuatro Evangelios — trasfondo compositivo directo, muy relevante para todo lector de los Evangelios."),
    "eusebio-he-l3-c25": ("alta", "El famoso catálogo de libros aceptados/disputados de Eusebio — conecta directamente con las disputas de autoría/canonicidad de Santiago, 2 Pedro, Judas, 2-3 Juan y Apocalipsis ya señaladas en la clasificación del NT."),
    "eusebio-he-l3-c26": ("baja", "Menandro el mago es trasfondo de herejías post-NT, sin conexión a un pasaje específico."),
    "eusebio-he-l3-c27": ("baja", "La herejía ebionita es desarrollo post-NT; trasfondo general de judaizantes, no anclado a un pasaje puntual."),
    "eusebio-he-l3-c28": ("alta", "Cerinto es el hereje tradicionalmente identificado como trasfondo polémico de 1 Juan (proto-gnosticismo, negación de la encarnación) — conexión directa."),
    "eusebio-he-l3-c29": ("alta", "Los nicolaítas son mencionados explícitamente en Ap 2:6 y 2:15 — conexión textual directa."),
    "eusebio-he-l3-c30": ("alta", "Confirma que Pedro estaba casado — trasfondo directo de la mención de la esposa de Pedro en 1 Co 9:5."),
    "eusebio-he-l3-c31": ("baja", "Datos martirológicos generales sobre Juan y Felipe, sin conexión a un pasaje específico."),
    "eusebio-he-l3-c32": ("baja", "Martirio de Simeón de Jerusalén, sucesión/martirología incidental."),
    "eusebio-he-l3-c33": ("baja", "AJUSTADO por Juan: la política de Trajano es posterior a la ventana de composición de la mayoría de los libros del NT y demasiado general (política imperial amplia, no un dato puntual sobre un pasaje)."),
    "eusebio-he-l3-c34": ("baja", "Sucesión episcopal de Roma (Evaristo), incidental."),
    "eusebio-he-l3-c35": ("baja", "Sucesión episcopal de Jerusalén (Justo), incidental."),
    "eusebio-he-l3-c36": ("baja", "Las epístolas de Ignacio son valiosas para la historia de la iglesia primitiva, pero no explican un pasaje puntual del NT en este capítulo."),
    "eusebio-he-l3-c37": ("baja", "Nota general sobre evangelistas itinerantes de la época, sin dato puntual."),
    "eusebio-he-l3-c38": ("alta", "Toca la tradición de que Clemente tradujo/mejoró el estilo de Hebreos — conecta directamente con la disputa de autoría de Hebreos ya señalada como caso dudoso."),
    "eusebio-he-l3-c39": ("alta", "Los escritos de Papías son la fuente externa más antigua sobre el origen de Mateo y Marcos (Marcos escribiendo la predicación de Pedro, Mateo compilando dichos en hebreo) — pieza clave para el trasfondo compositivo de los Evangelios."),
}


def main():
    union = json.loads((DATA_DIR / "_eusebio_union_nt.json").read_text(encoding="utf-8"))

    faltantes = [e["id"] for e in union if e["id"] not in CURACION]
    sobrantes = [k for k in CURACION if k not in {e["id"] for e in union}]
    if faltantes:
        raise SystemExit(f"Faltan curar {len(faltantes)} entradas: {faltantes}")
    if sobrantes:
        raise SystemExit(f"Hay curaciones de entradas que ya no están en la unión: {sobrantes}")

    salida = []
    for e in union:
        relevancia, justificacion = CURACION[e["id"]]
        salida.append({
            "eusebioId": e["id"],
            "libroSeccion": e["id"],
            "titulo": e["title"],
            "periodo": e["periodo"],
            "anioInicio": e["anioInicio"],
            "anioFin": e["anioFin"],
            "relevancia": relevancia,
            "justificacion": justificacion,
        })

    out_path = DATA_DIR / "eusebio-relevancia-nt.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({
            "_metadata": {
                "descripcion": "PROPUESTA de curación de relevancia (alta/baja) para las 78 entradas únicas de Eusebio que se activan al cruzar contra los 27 libros del NT (Fase 1, Parte C). No es un filtro aplicado — es para revisión de Juan.",
                "totalEntradas": len(salida),
                "totalAlta": sum(1 for x in salida if x["relevancia"] == "alta"),
                "totalBaja": sum(1 for x in salida if x["relevancia"] == "baja"),
            },
            "entradas": salida,
        }, f, ensure_ascii=False, indent=2)

    print(f"Escrito: {out_path}")
    print(f"Total: {len(salida)}  Alta: {sum(1 for x in salida if x['relevancia']=='alta')}  Baja: {sum(1 for x in salida if x['relevancia']=='baja')}")


if __name__ == "__main__":
    main()
