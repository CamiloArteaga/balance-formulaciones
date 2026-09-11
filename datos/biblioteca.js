// Biblioteca pública: solo ingredientes genéricos con su fuente USDA.
// Los nombres comerciales y los valores de fichas técnicas van en la biblioteca privada (fuera de este repo).
// estado: "revisado" = ID evaluado y aceptado; "propuesto" = cambio pendiente de aprobación.
window.BIBLIOTECA = [
  {
    nombre: "Ripio de pollo",
    alias: ["pollo solo carne"],
    tipo: "usda",
    fdc: "171052",
    estado: "revisado",
    nota: "Pollo, solo carne, crudo. Se mantiene frente a 171104 (carne mecánicamente deshuesada) por contraste con datos de laboratorio.",
  },
  {
    nombre: "Carne de cerdo magra",
    alias: ["cerdo magro", "carne de cerdo"],
    tipo: "usda",
    fdc: "168220",
    estado: "revisado",
    nota: "Cortes compuestos (pierna, lomo, paleta), solo magro, crudo.",
  },
  {
    nombre: "Sal refinada",
    alias: ["sal"],
    tipo: "usda",
    fdc: "173468",
    estado: "revisado",
  },
  {
    nombre: "Ajo en polvo",
    alias: [],
    tipo: "usda",
    fdc: "171325",
    estado: "revisado",
  },
  {
    nombre: "Cebolla puerro",
    alias: ["puerro"],
    tipo: "usda",
    fdc: "2727584",
    estado: "propuesto",
    nota: "Reemplaza 170005 (cebolla larga, scallions).",
  },
  {
    nombre: "Almidón de yuca",
    alias: ["almidon de yuca", "tapioca"],
    tipo: "usda",
    fdc: "169717",
    estado: "propuesto",
    nota: "Tapioca seca; la ficha del proveedor no trae información nutricional.",
  },
  {
    nombre: "Proteína concentrada de soya",
    alias: ["concentrado de soya", "proteina de soya"],
    tipo: "usda",
    fdc: "172447",
    estado: "propuesto",
    nota: "Concentrado de soya por extracción con alcohol.",
  },
  {
    nombre: "Agua",
    alias: ["agua potable", "hielo"],
    tipo: "agua",
    estado: "revisado",
  },
];
