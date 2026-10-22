// Idiomas de la interfaz (es / en) y traducción de citas bíblicas.
window.I18N = (() => {
  const T = {
    es: {
      tagline: "Preguntas bíblicas con la Escritura abierta",
      chooseMode: "Elige un modo",
      easyTitle: "Fácil · Datos bíblicos", easySub: "Nombres, familias, edades, lugares y cifras",
      hardTitle: "Difícil · Enseñanza", hardSub: "Comprende lo que la Biblia enseña",
      theoTitle: "Teólogo · Doctrina y Biblia", theoSub: "Doctrina cristiana común y conocimiento bíblico avanzado",
      mixTitle: "Mixto", mixSub: "Todas las preguntas combinadas",
      perGame: "Preguntas por partida", all: "Todas",
      foot: "Los textos bíblicos se presentan parafraseados para facilitar la comprensión. Abre cada cita en tu Biblia para leerla completa.",
      games: "Partidas", accuracy: "Aciertos", bestStreak: "Mejor racha",
      question: (i, n) => `Pregunta ${i} de ${n}`,
      readContext: "Lee el contexto", next: "Siguiente", seeResult: "Ver resultado",
      correct: "✓ ¡Correcto!", wrong: "✗ Esa no es la respuesta bíblica",
      correctAnswer: "Respuesta correcta", streak: n => `🔥 ${n} seguidas`,
      quitTitle: "¿Salir de la partida?",
      quitText: "Tu progreso en esta partida se perderá, pero las estadísticas de las preguntas respondidas se conservan.",
      quitYes: "Salir", quitNo: "Seguir jugando",
      of: (a, b) => `${a} de ${b}`,
      res100: ["¡Perfecto!", "Respondiste todo correctamente. Sigue escudriñando las Escrituras."],
      res80: ["¡Excelente!", "Conoces bien la Palabra. Repasa los pocos textos que fallaste."],
      res50: ["¡Buen trabajo!", "Vas por buen camino. Lee los pasajes de las preguntas que fallaste."],
      res0: ["Sigue aprendiendo", "El propósito no es solo acertar, sino comprender. Repasa los textos abajo."],
      rCorrect: "Correctas", rWrong: "Incorrectas", review: "Repasa estas preguntas",
      home: "Inicio", again: "Jugar otra vez",
      paraphrased: "Texto parafraseado para mejor comprensión.", close: "Cerrar",
      settings: "Ajustes", music: "Música", sound: "Efectos de sonido", haptic: "Vibración", fontSize: "Tamaño de letra",
      reset: "Reiniciar progreso y estadísticas", done: "Listo",
      resetTitle: "¿Reiniciar progreso?",
      resetText: "Se borrarán tus estadísticas y el registro de preguntas vistas. Los ajustes se conservan.",
      resetYes: "Reiniciar", cancel: "Cancelar", quit: "Salir",
    },
    en: {
      tagline: "Bible questions with the Scriptures open",
      chooseMode: "Choose a mode",
      easyTitle: "Easy · Bible facts", easySub: "Names, families, ages, places and numbers",
      hardTitle: "Hard · Teaching", hardSub: "Understand what the Bible teaches",
      theoTitle: "Theologian · Doctrine & Bible", theoSub: "Core Christian doctrine and advanced Bible knowledge",
      mixTitle: "Mixed", mixSub: "All questions combined",
      perGame: "Questions per game", all: "All",
      foot: "Bible passages are paraphrased to make them easier to understand. Open each reference in your Bible to read it in full.",
      games: "Games", accuracy: "Accuracy", bestStreak: "Best streak",
      question: (i, n) => `Question ${i} of ${n}`,
      readContext: "Read the context", next: "Next", seeResult: "See result",
      correct: "✓ Correct!", wrong: "✗ That is not the biblical answer",
      correctAnswer: "Correct answer", streak: n => `🔥 ${n} in a row`,
      quitTitle: "Leave this game?",
      quitText: "Your progress in this game will be lost, but the stats for the questions you answered are kept.",
      quitYes: "Leave", quitNo: "Keep playing",
      of: (a, b) => `${a} of ${b}`,
      res100: ["Perfect!", "You got everything right. Keep searching the Scriptures."],
      res80: ["Excellent!", "You know the Word well. Review the few passages you missed."],
      res50: ["Good job!", "You're on the right track. Read the passages for the questions you missed."],
      res0: ["Keep learning", "The goal is not just to get it right, but to understand. Review the passages below."],
      rCorrect: "Correct", rWrong: "Wrong", review: "Review these questions",
      home: "Home", again: "Play again",
      paraphrased: "Paraphrased text for easier understanding.", close: "Close",
      settings: "Settings", music: "Music", sound: "Sound effects", haptic: "Vibration", fontSize: "Text size",
      reset: "Reset progress and stats", done: "Done",
      resetTitle: "Reset progress?",
      resetText: "Your stats and the record of questions you've seen will be erased. Your settings are kept.",
      resetYes: "Reset", cancel: "Cancel", quit: "Leave",
    },
  };

  // Nombres de libros: español → inglés (las citas se escriben una sola vez, en los datos en español)
  const BOOKS = [
    ["1 Corintios", "1 Corinthians"], ["2 Corintios", "2 Corinthians"], ["1 Tesalonicenses", "1 Thessalonians"],
    ["2 Tesalonicenses", "2 Thessalonians"], ["1 Timoteo", "1 Timothy"], ["2 Timoteo", "2 Timothy"],
    ["1 Pedro", "1 Peter"], ["2 Pedro", "2 Peter"], ["1 Juan", "1 John"], ["2 Juan", "2 John"], ["3 Juan", "3 John"],
    ["1 Reyes", "1 Kings"], ["2 Reyes", "2 Kings"],
    ["Génesis", "Genesis"], ["Éxodo", "Exodus"], ["Levítico", "Leviticus"], ["Salmos", "Psalms"], ["Salmo", "Psalm"], ["Isaías", "Isaiah"], ["Miqueas", "Micah"], ["Ezequiel", "Ezekiel"], ["Números", "Numbers"], ["Deuteronomio", "Deuteronomy"],
    ["Josué", "Joshua"], ["Jueces", "Judges"], ["Rut", "Ruth"], ["Esdras", "Ezra"], ["Nehemías", "Nehemiah"],
    ["Ester", "Esther"], ["Jeremías", "Jeremiah"], ["Oseas", "Hosea"], ["Jonás", "Jonah"],
    ["Mateo", "Matthew"], ["Marcos", "Mark"], ["Lucas", "Luke"], ["Juan", "John"], ["Hechos", "Acts"],
    ["Romanos", "Romans"], ["Gálatas", "Galatians"], ["Efesios", "Ephesians"], ["Filipenses", "Philippians"],
    ["Colosenses", "Colossians"], ["Tito", "Titus"], ["Filemón", "Philemon"], ["Hebreos", "Hebrews"],
    ["Santiago", "James"], ["Judas", "Jude"], ["Apocalipsis", "Revelation"],
  ];
  function cite(ref, lang) {
    if (lang !== "en") return ref;
    for (const [es, en] of BOOKS) if (ref === es || ref.startsWith(es + " ")) return en + ref.slice(es.length);
    return ref;
  }
  const detect = () => ((navigator.language || "es").toLowerCase().startsWith("es") ? "es" : "en");
  return { T, cite, detect };
})();
