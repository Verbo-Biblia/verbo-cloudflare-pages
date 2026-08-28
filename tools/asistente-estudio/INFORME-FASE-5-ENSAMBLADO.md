# Fase 5 — Ensamblado completo por pasaje

**Estado:** implementado y validado como prototipo offline  
**Alcance:** solo `tools/asistente-estudio/`; sin integración en producción

## 1. Implementación

`ensamblador.py` recibe `book`, `chapterStart`, `verseStart`, `chapterEnd` y
`verseEnd`, y devuelve un único objeto con `pasaje`, `diccionario`, `historia`
y `costumbres`.

El ensamblador:

- consume los candidatos léxicos aprobados de Camino C, sin aplicar el filtro
  experimental de acepción;
- usa el motor existente de Eusebio, que solo devuelve IDs curados como
  `alta`;
- cruza los rangos conciliares mediante solapamiento inclusivo;
- toma el contexto histórico de las clasificaciones locales;
- añade Freeman por solapamiento bíblico fino;
- añade Tucker por solapamiento de época con su ventana 54–68 d.C. y solo sus
  capítulos `alta`;
- activa el bloque subapostólico únicamente en 90–150 d.C. y Diogneto en
  130–200 d.C.;
- deja vacía cualquier capa sin fuente aplicable.

La función general `ranges_overlap` compara los extremos `(capítulo,
versículo)` y cubre rangos contenidos, parciales y transcapítulo.

## 2. JSON completos de los pilotos

### Romanos 5:1-11

```json
{
  "pasaje": {
    "book": "ROM",
    "chapterStart": 5,
    "verseStart": 1,
    "chapterEnd": 5,
    "verseEnd": 11
  },
  "diccionario": [
    {
      "termino": "Blood",
      "fuente": {
        "modulo": "Easton",
        "headword": "Blood"
      }
    },
    {
      "termino": "Blood",
      "fuente": {
        "modulo": "Smith",
        "headword": "Blood"
      }
    },
    {
      "termino": "Christ",
      "fuente": {
        "modulo": "Easton",
        "headword": "Christ"
      }
    },
    {
      "termino": "Christ",
      "fuente": {
        "modulo": "Smith",
        "headword": "Christ"
      }
    },
    {
      "termino": "Death",
      "fuente": {
        "modulo": "Easton",
        "headword": "Death"
      }
    },
    {
      "termino": "Faith",
      "fuente": {
        "modulo": "Easton",
        "headword": "Faith"
      }
    },
    {
      "termino": "Glory",
      "fuente": {
        "modulo": "Easton",
        "headword": "Glory"
      }
    },
    {
      "termino": "God",
      "fuente": {
        "modulo": "Easton",
        "headword": "God"
      }
    },
    {
      "termino": "God",
      "fuente": {
        "modulo": "Smith",
        "headword": "God"
      }
    },
    {
      "termino": "Grace",
      "fuente": {
        "modulo": "Easton",
        "headword": "Grace"
      }
    },
    {
      "termino": "Heart",
      "fuente": {
        "modulo": "Easton",
        "headword": "Heart"
      }
    },
    {
      "termino": "Hope",
      "fuente": {
        "modulo": "Easton",
        "headword": "Hope"
      }
    },
    {
      "termino": "Jesus",
      "fuente": {
        "modulo": "Easton",
        "headword": "Jesus"
      }
    },
    {
      "termino": "Jesus",
      "fuente": {
        "modulo": "Smith",
        "headword": "Jesus"
      }
    },
    {
      "termino": "Jesus Christ",
      "fuente": {
        "modulo": "Smith",
        "headword": "Jesus Christ"
      }
    },
    {
      "termino": "Justification",
      "fuente": {
        "modulo": "Easton",
        "headword": "Justification"
      }
    },
    {
      "termino": "Life",
      "fuente": {
        "modulo": "Easton",
        "headword": "Life"
      }
    },
    {
      "termino": "Lord",
      "fuente": {
        "modulo": "Easton",
        "headword": "Lord"
      }
    },
    {
      "termino": "Lord",
      "fuente": {
        "modulo": "Smith",
        "headword": "Lord"
      }
    },
    {
      "termino": "Love",
      "fuente": {
        "modulo": "Easton",
        "headword": "Love"
      }
    },
    {
      "termino": "Man",
      "fuente": {
        "modulo": "Easton",
        "headword": "Man"
      }
    },
    {
      "termino": "Man",
      "fuente": {
        "modulo": "Smith",
        "headword": "Man"
      }
    },
    {
      "termino": "Reconcilation",
      "fuente": {
        "modulo": "Easton",
        "headword": "Reconcilation"
      }
    },
    {
      "termino": "Son",
      "fuente": {
        "modulo": "Smith",
        "headword": "Son"
      }
    },
    {
      "termino": "Spirit",
      "fuente": {
        "modulo": "Easton",
        "headword": "Spirit"
      }
    },
    {
      "termino": "Spirit, Holy",
      "fuente": {
        "modulo": "Easton",
        "headword": "Spirit, Holy"
      }
    },
    {
      "termino": "Wills",
      "fuente": {
        "modulo": "Smith",
        "headword": "Wills"
      }
    }
  ],
  "historia": [
    {
      "tipo": "contexto-libro",
      "texto": "JFB introducción a Romanos ('temprana primavera del año 58', al final del tercer viaje de Pablo); Barnes coincide en 'alrededor del año 57' escrita en Corinto.",
      "fuente": {
        "modulo": "book-classification-nt",
        "libroSeccion": "ROM:libro"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter IV — After the Death of Tiberius, Caius appointed Agrippa King of the Jews, having punished Herod with Perpetual Exile.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.4"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter V — Philo's Embassy to Caius in Behalf of the Jews.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.5"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter VIII — The Famine which took Place in the Reign of Claudius.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.8"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter IX — The Martyrdom of James the Apostle.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.9"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter X — Agrippa, who was also called Herod, having persecuted the Apostles, immediately experienced the Divine Vengeance.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.10"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter XI — The Impostor Theudas and his Followers.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.11"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter XIII — Simon Magus.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.13"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter XIV — The Preaching of the Apostle Peter in Rome.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.14"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter XV — The Gospel according to Mark.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.15"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter XXI — The Egyptian, who is mentioned also in the Acts of the Apostles.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.21"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter XXII — Paul having been sent bound from Judea to Rome, made his Defense, and was acquitted of every Charge.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.22"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter XXIII — The Martyrdom of James, who was called the Brother of the Lord.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.23"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter XXV — The Persecution under Nero in which Paul and Peter were honored at Rome with Martyrdom in Behalf of Religion.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.25"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book II, Chapter XXVI — The Jews, afflicted with Innumerable Evils, commenced the Last War Against the Romans.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "II.26"
      }
    }
  ],
  "costumbres": [
    {
      "texto": "The subject of this book is \"Life in the Roman World of Nero and St.\nPaul.\" This is not quite the same thing as \"Life in Ancient Rome\" at\nthe same date. Our survey is to be somewhat wider than that of the\nimperial city itself, with its public and private structures, its\npublic an…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-intro"
      }
    },
    {
      "texto": "The best means of realising the extent of the Roman Empire in or about\nthe year 64 is to glance at the map. It will be found to reach from\nthe Atlantic Ocean to the Euphrates, from the middle of\nEngland—approximately the river Trent—to the south of Egypt, from\nthe Rhine and the D…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch1"
      }
    },
    {
      "texto": "Of the administration in Rome and throughout the provinces enough will\nbe said in the proper place. Meanwhile we may look briefly at one or\ntwo questions of interest which will presumably suggest themselves at\nthis stage. Since all this vast region now formed one empire, since\nRo…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch2"
      }
    },
    {
      "texto": "After thus considering, however incompletely, the manner in which the\npeople of the Roman world contrived to move about within the empire\nitself, we may proceed to glance at the constituent parts of the world\nin which they thus travelled to and fro. And first we must draw a disti…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch3"
      }
    },
    {
      "texto": "We have seen, and succinctly traversed, the extent of the Roman world.\nThe next step is to consider, as tersely as possible, its system of\ngovernment and administration about the year 64. This task is not only\nentirely necessary to our immediate purpose; it is also one of great\ni…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch4"
      }
    },
    {
      "texto": "Roughly then this is the situation at the centre of government.\nSumptuously housed on the Palatine Hill—the origin of our word\n\"palace\"—is His Highness Claudius Nero, Head of the State,\nCommander-in-Chief of the Forces, Empowered to act as Tribune of the\nPeople, and Head of the S…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch5"
      }
    },
    {
      "texto": "We are now brought to the consideration of the methods by which this\nhuge empire was organised and governed. And first let us observe that the Romans—strict disciplinarians and\ngreat lawyers as they were—never sought to impose upon the subject\nprovinces any uniformity. They never…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch6"
      }
    },
    {
      "texto": "In the year 64 the capital of the Roman Empire was, it is true, a\nlarge and splendid city and an \"epitome of the world,\" but it had not\nyet reached either its zenith of splendour or its maximum, of size.\nMany of the largest and most sumptuous structures of which we possess\nthe re…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch7"
      }
    },
    {
      "texto": "We have taken a general survey of the city of Rome, its open places,\nstreets, and public buildings. We may now look at the houses in which\nthe Romans lived, and at the furniture to be expected inside them. Mention has already been made of the large and lofty tenement houses\nor bl…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch9"
      }
    },
    {
      "texto": "We have seen in what sort of a home a Roman dwelt in town or country.\nMeanwhile it goes without saying that the non-Roman or non-Romanized\npopulations of the empire were living in houses and amid furniture of\ntheir own special type—Greek, Syrian, Egyptian, or as the case might\nbe…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch12"
      }
    },
    {
      "texto": "We will suppose that Silius is specially inclined for action and\nsociety. The afternoon is growing chilly, and, as he has no further\nceremonial to undergo, he will probably throw over his toga a richly\ncoloured mantle—violet, amethyst, or scarlet—to be fastened on the\nshoulder wi…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch13"
      }
    },
    {
      "texto": "Silius was a noble, with a nobleman's privileges and also his\nlimitations. The class next in rank below his consisted of the\n\"knights,\" of whom something has already been said. It will be\nremembered that these men of the \"narrow stripe\" were the higher\nmiddle class, who conducted…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch14"
      }
    },
    {
      "texto": "These topics bring us naturally to the consideration of the chief\namusements and entertainments of Rome and of those parts of the empire\nwhich were either fairly romanized or else contained a large number of\nresident Romans. Holidays, some of them lasting over several days, were…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch15"
      }
    },
    {
      "texto": "We will assume that Silius is a married man, and that his wife is a\ntypical Roman dame worthy of his station in life. Her name shall be\nMarcia, or, if she possesses more than one, Marcia Sabina. Marriage\ndoes not confer upon her the name of her husband, and if she requires\nfurthe…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch16"
      }
    },
    {
      "texto": "Unlike too many couples of the same class, Silius and Marcia are\nblessed with children. We will assume that there are two, a boy, whose\nfull name shall be Publius Silius Bassus, and a girl, who is to be\ncalled Silia Bassa. It is perhaps to be regretted that there is not a\nthird,…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch17"
      }
    },
    {
      "texto": "In the older days of Roman history the fighting forces had been a\n\"citizen army,\" called out for so long as it was needed, and levied\nfrom full and true Roman citizens. In the imperial times with which we\nare here dealing it had become a standing army. Soldiering was a\nprofession…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch18"
      }
    },
    {
      "texto": "To undertake to set forth with any definiteness the \"religious ideas\nof a Roman\" of A.D. 64 would be an extremely difficult task. Those\nideas would differ with the individual, being determined or varied by\na number of considerations and influences—by locality, education, and\ntemp…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch19"
      }
    },
    {
      "texto": "With such an unsatisfactory equipment of science, and with such a\nvague and morally inoperative religion, it was no wonder that the\nhigher minds of the contemporary world turned to the study of\nphilosophy. Of such studies there had been many schools or sects, but\nat this date we…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch21"
      }
    },
    {
      "texto": "Whatever conceptions may have been entertained as to existence beyond\nthe grave, there was no doubt in the Roman mind as to the claim of the\ndead to a proper burial and a worthy monument. It had once on a time\nbeen a matter of universal belief that the spirit which had departed\nf…",
      "fuente": {
        "modulo": "tucker-roman-world",
        "entradaId": "tucker-ch23"
      }
    }
  ]
}
```

### Mateo 2:1-12

```json
{
  "pasaje": {
    "book": "MAT",
    "chapterStart": 2,
    "verseStart": 1,
    "chapterEnd": 2,
    "verseEnd": 12
  },
  "diccionario": [
    {
      "termino": "Bethlehem",
      "fuente": {
        "modulo": "Easton",
        "headword": "Bethlehem"
      }
    },
    {
      "termino": "Bethlehem",
      "fuente": {
        "modulo": "Smith",
        "headword": "Bethlehem"
      }
    },
    {
      "termino": "Call",
      "fuente": {
        "modulo": "Easton",
        "headword": "Call"
      }
    },
    {
      "termino": "Calling",
      "fuente": {
        "modulo": "Easton",
        "headword": "Calling"
      }
    },
    {
      "termino": "Chief priest",
      "fuente": {
        "modulo": "Easton",
        "headword": "Chief priest"
      }
    },
    {
      "termino": "Child",
      "fuente": {
        "modulo": "Easton",
        "headword": "Child"
      }
    },
    {
      "termino": "Christ",
      "fuente": {
        "modulo": "Easton",
        "headword": "Christ"
      }
    },
    {
      "termino": "Christ",
      "fuente": {
        "modulo": "Smith",
        "headword": "Christ"
      }
    },
    {
      "termino": "Dream",
      "fuente": {
        "modulo": "Easton",
        "headword": "Dream"
      }
    },
    {
      "termino": "Dreams",
      "fuente": {
        "modulo": "Smith",
        "headword": "Dreams"
      }
    },
    {
      "termino": "East",
      "fuente": {
        "modulo": "Easton",
        "headword": "East"
      }
    },
    {
      "termino": "East",
      "fuente": {
        "modulo": "Smith",
        "headword": "East"
      }
    },
    {
      "termino": "Frankincense",
      "fuente": {
        "modulo": "Easton",
        "headword": "Frankincense"
      }
    },
    {
      "termino": "Frankincense",
      "fuente": {
        "modulo": "Smith",
        "headword": "Frankincense"
      }
    },
    {
      "termino": "Gift",
      "fuente": {
        "modulo": "Easton",
        "headword": "Gift"
      }
    },
    {
      "termino": "Gift",
      "fuente": {
        "modulo": "Smith",
        "headword": "Gift"
      }
    },
    {
      "termino": "Gold",
      "fuente": {
        "modulo": "Easton",
        "headword": "Gold"
      }
    },
    {
      "termino": "Gold",
      "fuente": {
        "modulo": "Smith",
        "headword": "Gold"
      }
    },
    {
      "termino": "Herod",
      "fuente": {
        "modulo": "Smith",
        "headword": "Herod"
      }
    },
    {
      "termino": "House",
      "fuente": {
        "modulo": "Easton",
        "headword": "House"
      }
    },
    {
      "termino": "House",
      "fuente": {
        "modulo": "Smith",
        "headword": "House"
      }
    },
    {
      "termino": "Israel",
      "fuente": {
        "modulo": "Easton",
        "headword": "Israel"
      }
    },
    {
      "termino": "Israel",
      "fuente": {
        "modulo": "Smith",
        "headword": "Israel"
      }
    },
    {
      "termino": "Jerusalem",
      "fuente": {
        "modulo": "Easton",
        "headword": "Jerusalem"
      }
    },
    {
      "termino": "Jerusalem",
      "fuente": {
        "modulo": "Smith",
        "headword": "Jerusalem"
      }
    },
    {
      "termino": "Jesus",
      "fuente": {
        "modulo": "Easton",
        "headword": "Jesus"
      }
    },
    {
      "termino": "Jesus",
      "fuente": {
        "modulo": "Smith",
        "headword": "Jesus"
      }
    },
    {
      "termino": "Judah",
      "fuente": {
        "modulo": "Easton",
        "headword": "Judah"
      }
    },
    {
      "termino": "Judah",
      "fuente": {
        "modulo": "Smith",
        "headword": "Judah"
      }
    },
    {
      "termino": "Judea",
      "fuente": {
        "modulo": "Easton",
        "headword": "Judea"
      }
    },
    {
      "termino": "King",
      "fuente": {
        "modulo": "Easton",
        "headword": "King"
      }
    },
    {
      "termino": "King",
      "fuente": {
        "modulo": "Smith",
        "headword": "King"
      }
    },
    {
      "termino": "Kings",
      "fuente": {
        "modulo": "Smith",
        "headword": "Kings"
      }
    },
    {
      "termino": "Magi",
      "fuente": {
        "modulo": "Smith",
        "headword": "Magi"
      }
    },
    {
      "termino": "Mary",
      "fuente": {
        "modulo": "Easton",
        "headword": "Mary"
      }
    },
    {
      "termino": "Mary",
      "fuente": {
        "modulo": "Smith",
        "headword": "Mary"
      }
    },
    {
      "termino": "Mother",
      "fuente": {
        "modulo": "Smith",
        "headword": "Mother"
      }
    },
    {
      "termino": "Myrrh",
      "fuente": {
        "modulo": "Easton",
        "headword": "Myrrh"
      }
    },
    {
      "termino": "Myrrh",
      "fuente": {
        "modulo": "Smith",
        "headword": "Myrrh"
      }
    },
    {
      "termino": "Presents",
      "fuente": {
        "modulo": "Smith",
        "headword": "Presents"
      }
    },
    {
      "termino": "Priest",
      "fuente": {
        "modulo": "Easton",
        "headword": "Priest"
      }
    },
    {
      "termino": "Priest",
      "fuente": {
        "modulo": "Smith",
        "headword": "Priest"
      }
    },
    {
      "termino": "Prophet",
      "fuente": {
        "modulo": "Easton",
        "headword": "Prophet"
      }
    },
    {
      "termino": "Prophet",
      "fuente": {
        "modulo": "Smith",
        "headword": "Prophet"
      }
    },
    {
      "termino": "Saw",
      "fuente": {
        "modulo": "Smith",
        "headword": "Saw"
      }
    },
    {
      "termino": "Scribes",
      "fuente": {
        "modulo": "Easton",
        "headword": "Scribes"
      }
    },
    {
      "termino": "Scribes",
      "fuente": {
        "modulo": "Smith",
        "headword": "Scribes"
      }
    },
    {
      "termino": "Shepherd",
      "fuente": {
        "modulo": "Easton",
        "headword": "Shepherd"
      }
    },
    {
      "termino": "Shepherd",
      "fuente": {
        "modulo": "Smith",
        "headword": "Shepherd"
      }
    },
    {
      "termino": "Stars",
      "fuente": {
        "modulo": "Easton",
        "headword": "Stars"
      }
    },
    {
      "termino": "Wills",
      "fuente": {
        "modulo": "Smith",
        "headword": "Wills"
      }
    },
    {
      "termino": "Worship",
      "fuente": {
        "modulo": "Easton",
        "headword": "Worship"
      }
    }
  ],
  "historia": [
    {
      "tipo": "circunstancia",
      "texto": "Época de los eventos narrados (vida de Jesús), no de composición del libro — consenso general de cronología del NT.",
      "fuente": {
        "modulo": "book-classification-nt",
        "libroSeccion": "MAT:libro"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book I, Chapter V — The Time of his Appearance among Men.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "I.5"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book I, Chapter VI — About the Time of Christ, in accordance with Prophecy, the Rulers who had governed the Jewish Nation in Regular Succession from the Days of Antiquity came to an End, and Herod, the First Foreigner, Became King.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "I.6"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book I, Chapter VII — The Alleged Discrepancy in the Gospels in regard to the Genealogy of Christ.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "I.7"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book I, Chapter VIII — The Cruelty of Herod toward the Infants, and the Manner of his Death.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "I.8"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book I, Chapter IX — The Times of Pilate.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "I.9"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book I, Chapter X — The High Priests of the Jews under whom Christ taught.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "I.10"
      }
    },
    {
      "tipo": "evento",
      "texto": "Church History, Book I, Chapter XI — Testimonies in Regard to John the Baptist and Christ.",
      "fuente": {
        "modulo": "eusebio-historia-eclesiastica",
        "libroSeccion": "I.11"
      }
    }
  ],
  "costumbres": [
    {
      "texto": "These “wise men,” or, more properly, magi, (υάγοι,) belonged to a numerous and influential order of men. The origin of Magism is involved in obscurity. It is thought to have had its beginning among either the Chaldeans or the Assyrians; more probably among the former. Starting in…",
      "fuente": {
        "modulo": "freeman-manners-customs",
        "entradaId": "freeman-630"
      }
    },
    {
      "texto": "When the preparations were making for the coronation of Solyman III as king of Persia in 1666, the astrologers had very important duties assigned them, according to the custom of their country. Sir John Chardin, who was present, says that these astrologers were appointed “to obse…",
      "fuente": {
        "modulo": "freeman-manners-customs",
        "entradaId": "freeman-631"
      }
    }
  ]
}
```

### Salmo 23:1-6

```json
{
  "pasaje": {
    "book": "PSA",
    "chapterStart": 23,
    "verseStart": 1,
    "chapterEnd": 23,
    "verseEnd": 6
  },
  "diccionario": [
    {
      "termino": "Anoint",
      "fuente": {
        "modulo": "Easton",
        "headword": "Anoint"
      }
    },
    {
      "termino": "Anointing",
      "fuente": {
        "modulo": "Smith",
        "headword": "Anointing"
      }
    },
    {
      "termino": "Cup",
      "fuente": {
        "modulo": "Easton",
        "headword": "Cup"
      }
    },
    {
      "termino": "Cup",
      "fuente": {
        "modulo": "Smith",
        "headword": "Cup"
      }
    },
    {
      "termino": "David",
      "fuente": {
        "modulo": "Easton",
        "headword": "David"
      }
    },
    {
      "termino": "David",
      "fuente": {
        "modulo": "Smith",
        "headword": "David"
      }
    },
    {
      "termino": "Death",
      "fuente": {
        "modulo": "Easton",
        "headword": "Death"
      }
    },
    {
      "termino": "Dwell",
      "fuente": {
        "modulo": "Easton",
        "headword": "Dwell"
      }
    },
    {
      "termino": "Evening",
      "fuente": {
        "modulo": "Easton",
        "headword": "Evening"
      }
    },
    {
      "termino": "Goodness",
      "fuente": {
        "modulo": "Easton",
        "headword": "Goodness"
      }
    },
    {
      "termino": "House",
      "fuente": {
        "modulo": "Easton",
        "headword": "House"
      }
    },
    {
      "termino": "House",
      "fuente": {
        "modulo": "Smith",
        "headword": "House"
      }
    },
    {
      "termino": "Lead",
      "fuente": {
        "modulo": "Smith",
        "headword": "Lead"
      }
    },
    {
      "termino": "Lie",
      "fuente": {
        "modulo": "Easton",
        "headword": "Lie"
      }
    },
    {
      "termino": "Life",
      "fuente": {
        "modulo": "Easton",
        "headword": "Life"
      }
    },
    {
      "termino": "Lord",
      "fuente": {
        "modulo": "Easton",
        "headword": "Lord"
      }
    },
    {
      "termino": "Lord",
      "fuente": {
        "modulo": "Smith",
        "headword": "Lord"
      }
    },
    {
      "termino": "Mercy",
      "fuente": {
        "modulo": "Easton",
        "headword": "Mercy"
      }
    },
    {
      "termino": "Names",
      "fuente": {
        "modulo": "Smith",
        "headword": "Names"
      }
    },
    {
      "termino": "Oil",
      "fuente": {
        "modulo": "Easton",
        "headword": "Oil"
      }
    },
    {
      "termino": "Oil",
      "fuente": {
        "modulo": "Smith",
        "headword": "Oil"
      }
    },
    {
      "termino": "Psalms",
      "fuente": {
        "modulo": "Easton",
        "headword": "Psalms"
      }
    },
    {
      "termino": "Righteousness",
      "fuente": {
        "modulo": "Easton",
        "headword": "Righteousness"
      }
    },
    {
      "termino": "Shadow",
      "fuente": {
        "modulo": "Easton",
        "headword": "Shadow"
      }
    },
    {
      "termino": "Shepherd",
      "fuente": {
        "modulo": "Easton",
        "headword": "Shepherd"
      }
    },
    {
      "termino": "Shepherd",
      "fuente": {
        "modulo": "Smith",
        "headword": "Shepherd"
      }
    },
    {
      "termino": "Tables",
      "fuente": {
        "modulo": "Easton",
        "headword": "Tables"
      }
    },
    {
      "termino": "Valley",
      "fuente": {
        "modulo": "Easton",
        "headword": "Valley"
      }
    },
    {
      "termino": "Wills",
      "fuente": {
        "modulo": "Smith",
        "headword": "Wills"
      }
    }
  ],
  "historia": [],
  "costumbres": [
    {
      "texto": "Anointing was an ancient custom practiced by the Egyptians, and afterward by the Greeks and Romans and other nations. Olive oil was used, (see note on Psa. 92:10 #446) either pure or mixed with fragrant and costly spices, often brought from a long distance. See note on Matthew 26…",
      "fuente": {
        "modulo": "freeman-manners-customs",
        "entradaId": "freeman-429"
      }
    }
  ]
}
```

## 3. Auditoría de fuentes

### Diccionario

Cada asociación procede directamente de `entradasDiccionario`, la salida
léxica aprobada de Camino C. Para cada resultado se verificó que el headword
existe realmente en el módulo Easton o Smith indicado. No se usa el diagnóstico
estricto de acepción y no se afirma certeza semántica.

Conteos por asociación fuente/headword:

| Pasaje | Asociaciones |
|---|---:|
| Romanos 5:1-11 | 27 |
| Mateo 2:1-12 | 52 |
| Salmo 23:1-6 | 29 |

### Historia

Todas las entradas tienen `fuente.modulo` y `fuente.libroSeccion` no vacíos.

- El contexto procede de `book-classification-nt.json` o
  `book-classification-ot.json` y reproduce su `fuenteReferencia`.
- Los eventos proceden de títulos reales de
  `eusebio-historia-eclesiastica`; el motor previo verifica que sus IDs están
  curados como `alta`.
- La recepción doctrinal, cuando exista, reproduce la `razon` del mapeo local y
  enlaza el tema y los concilios de `concilios-temas.json`.

No se generó ningún texto histórico sin fuente. Ninguno de los tres pilotos
solapa un rango conciliar: Romanos 5:1-11 termina inmediatamente antes del
anclaje pelagiano curado en Romanos 5:12-21.

### Costumbres

Todas las entradas tienen `fuente.modulo` y `fuente.entradaId` no vacíos.

- Mateo 2 obtiene dos entradas reales de Freeman (`freeman-630` y
  `freeman-631`).
- Salmo 23 obtiene `freeman-429`, una entrada fina sobre la unción de huéspedes.
- Romanos 5 activa los 19 capítulos `alta` de Tucker por la fecha de escritura
  57–58 d.C., dentro de la ventana 54–68 d.C. El texto mostrado es el excerpt
  real de cada capítulo fuente.
- Ningún piloto activa el bloque subapostólico ni Diogneto.

No se generó ninguna costumbre sin fuente.

## 4. Solapamientos y posibles tensiones en Historia

### Mateo 2:1-12

El contexto de clasificación y Eusebio I.5 se solapan en cronología general.
Eusebio I.6 y I.8 se solapan directamente con Herodes; I.8 es el anclaje más
específico a la matanza de los niños. No apareció una entrada separada sobre el
censo: los datos reales no la activaron.

I.7 (genealogía), I.9 (Pilato), I.10 (sumos sacerdotes) e I.11 (Juan el
Bautista) son resultados `alta` del cruce por la ventana narrativa amplia
−6–30 d.C., pero no todos describen Mateo 2:1-12 de manera inmediata. Se
conservan y reportan porque ocultarlos exigiría alterar el motor curado de Fase
1 o introducir una excepción. No se detectó contradicción textual entre ellos,
pero sí amplitud y repetición cronológica.

### Romanos 5:1-11

El contexto fecha la escritura en 57–58 d.C. Las 14 entradas de Eusebio cubren
un rango amplio 33–100 d.C. y, por ello, se superponen cronológicamente con la
clasificación. II.22 (Pablo enviado a Roma) y II.25 (Pablo y Pedro bajo Nerón)
son las conexiones más cercanas al contexto romano/paulino; las demás son
trasfondo contemporáneo amplio, no comentarios directos de Romanos 5.

No se detectó contradicción explícita, pero el conjunto de Eusebio presenta
solapamiento temporal y posible sobreabundancia. Se mantiene visible en el
informe porque todas las entradas están marcadas `alta` por la curación
existente y Fase 5 no tiene autoridad para recurarla.

### Concilios

No hubo solapamiento con Eusebio o contexto en los tres pilotos porque ninguno
activó un tema conciliar. La función de rangos sí fue probada en solapamientos
del mismo capítulo, parciales, contenidos y transcapítulo.

## 5. Vacíos encontrados

- **Salmo 23 — Historia:** `[]`. Vacío esperado: el libro está clasificado como
  `ninguna`, sin una época única, y Eusebio no cubre el AT.
- **Salmo 23 — Costumbres amplias:** vacío esperado por falta de ventana de
  época. La categoría total no queda vacía porque existe Freeman 429 como capa
  fina específica.
- **Mateo 2 — Costumbres amplias:** vacío esperado; su ventana narrativa −6–30
  d.C. no coincide con Tucker, el bloque subapostólico ni Diogneto. Freeman sí
  aporta dos entradas finas.
- **Romanos 5 — Freeman:** vacío esperado; no hay entrada fina de Freeman para
  ese rango. Tucker sí aporta la capa amplia.
- **Tres pilotos — recepción conciliar:** vacío esperado según los rangos
  curados. En particular, Romanos 5:1-11 no solapa Romanos 5:12-21.

No se rellenó ninguno de estos vacíos.

## 6. Resultado

Fase 5 queda implementada como prototipo offline y los tres pilotos satisfacen
el contrato. La principal observación para una revisión posterior es la
amplitud del cruce temporal de Eusebio, especialmente en Romanos; se reporta
sin ocultarla ni modificar la curación previa.

No se avanzó a UI ni se modificó producción.
