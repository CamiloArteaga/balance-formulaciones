(function (g) {
  "use strict";

  const normalizar = (s) =>
    String(s)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  // Frases que se traducen juntas (se buscan antes que las palabras sueltas).
  const FRASES = {
    "carne de cerdo": "pork lean",
    "carne de res": "beef lean",
    "carne de pollo": "chicken",
    "fecula de maiz": "cornstarch",
    "almidon de maiz": "cornstarch",
    "cebolla larga": "scallions",
    "cebolla de huevo": "onions",
    "cebolla cabezona": "onions",
    "leche condensada": "milk condensed",
    "leche en polvo": "milk dry",
    "crema de leche": "cream fluid",
    "polvo para hornear": "baking powder",
    "polvo de hornear": "baking powder",
    "frutos secos": "nuts",
    "salsa de soya": "soy sauce",
    "salsa de soja": "soy sauce",
    "pimienta negra": "pepper black",
    "pimienta blanca": "pepper white",
    "uvas pasas": "raisins",
    "manteca de cacao": "cocoa butter",
    "pure de manzana": "applesauce",
    "te negro": "tea black",
    "te verde": "tea green",
    "nuez moscada": "nutmeg",
    "clavo de olor": "cloves",
    "carne molida": "beef ground",
    "queso crema": "cheese cream",
    "leche de coco": "coconut milk",
    "azucar morena": "sugars brown",
    "azucar blanca": "sugars granulated",
    "azucar refinada": "sugars granulated",
    "azucar pulverizada": "sugars powdered",
    "miga de pan": "bread crumbs",
    "pan rallado": "bread crumbs",
    "proteina de suero": "whey protein",
    "suero de leche": "whey",
    "sin enriquecer": "unenriched",
    habichuela: "beans snap",
    "queso campesino": "cheese fresco",
    "queso fresco": "cheese fresco",
    "leche entera": "milk whole milkfat",
    "leche descremada": "milk nonfat",
    "almidon de papa": "potato starch",
  };

  // Español → inglés de USDA. El orden de las opciones es la preferencia; "~x" suma pero no es obligatoria; "" se ignora.
  const ES_EN = {
    pollo: "chicken",
    gallina: ["chicken", "hen"],
    pavo: "turkey",
    cerdo: "pork",
    res: "beef",
    carne: ["meat", "beef"],
    ternera: "veal",
    cordero: "lamb",
    conejo: "rabbit",
    pato: "duck",
    pechuga: "breast",
    muslo: "thigh",
    contramuslo: "thigh",
    ala: "wing",
    pierna: "leg",
    costilla: ["ribs", "spareribs"],
    lomo: "loin",
    paleta: "shoulder",
    pecho: "brisket",
    tocino: ["bacon", "salt pork"],
    tocineta: "bacon",
    papada: "jowl",
    higado: "liver",
    corazon: "heart",
    molleja: "gizzard",
    piel: "skin",
    cuero: "skin",
    grasa: "fat",
    manteca: ["lard", "shortening"],
    sebo: "tallow",
    molida: "~ground",
    molido: "~ground",
    jamon: "ham",
    salchicha: "sausage",
    mortadela: "bologna",
    chorizo: ["chorizo", "sausage"],
    mecanicamente: "mechanically",
    deshuesada: "deboned",
    deshuesado: "deboned",
    menudencias: "giblets",
    sangre: "blood",
    pescado: "fish",
    atun: "tuna",
    salmon: "salmon",
    tilapia: "tilapia",
    trucha: "trout",
    camaron: "shrimp",
    sardina: "sardines",
    leche: "milk",
    queso: "cheese",
    crema: "cream",
    mantequilla: "butter",
    yogur: "yogurt",
    yogurt: "yogurt",
    suero: "whey",
    lactosuero: "whey",
    arequipe: ["dulce de leche", "caramel"],
    cuajada: "cheese",
    huevo: "egg",
    clara: "white",
    yema: "yolk",
    descremada: ["nonfat", "skim"],
    descremado: ["nonfat", "skim"],
    semidescremada: "lowfat",
    condensada: "condensed",
    parmesano: "parmesan",
    mozarella: "mozzarella",
    mozzarella: "mozzarella",
    harina: "flour",
    trigo: "wheat",
    maiz: "corn",
    arroz: "rice",
    avena: "oat",
    cebada: "barley",
    centeno: "rye",
    salvado: "bran",
    germen: "germ",
    almidon: "starch",
    fecula: "starch",
    maicena: "cornstarch",
    pan: "bread",
    miga: "crumbs",
    galleta: ["cookies", "crackers"],
    levadura: ["yeast baker", "yeast"],
    gluten: "gluten",
    semola: "semolina",
    quinua: "quinoa",
    pasta: "pasta",
    hornear: "baking",
    papa: "potato",
    yuca: "cassava",
    tapioca: "tapioca",
    batata: "sweet potato",
    cebolla: "onion",
    ajo: "garlic",
    puerro: "leeks",
    cebollin: ["chives", "scallions"],
    tomate: ["tomato red", "tomato"],
    zanahoria: "carrot",
    apio: "celery",
    pimenton: ["peppers sweet", "paprika"],
    pimiento: ["peppers sweet", "peppers"],
    aji: ["peppers hot", "chili"],
    espinaca: "spinach",
    lechuga: "lettuce",
    repollo: "cabbage",
    brocoli: "broccoli",
    coliflor: "cauliflower",
    pepino: "cucumber",
    ahuyama: ["squash", "pumpkin"],
    calabaza: ["pumpkin", "squash"],
    berenjena: "eggplant",
    remolacha: "beets",
    rabano: "radishes",
    champinon: "mushrooms",
    champinones: "mushrooms",
    hongo: "mushrooms",
    perejil: "parsley",
    cilantro: "coriander",
    albahaca: "basil",
    tomillo: "thyme",
    romero: "rosemary",
    laurel: "bay",
    oregano: "oregano",
    aceituna: "olives",
    mazorca: "corn",
    hierbabuena: ["peppermint", "spearmint"],
    menta: ["peppermint", "spearmint"],
    cascara: "skin",
    semilla: "seed",
    mango: "mangos",
    fresa: "strawberries",
    mora: "blackberries",
    lulo: "naranjilla",
    maracuya: "passion fruit",
    granadilla: "passion fruit",
    guayaba: "guavas",
    pina: "pineapple",
    banano: "bananas",
    platano: "plantains",
    naranja: "oranges",
    limon: ["lemons", "limes"],
    mandarina: "tangerines",
    manzana: "apples",
    pera: "pears",
    uva: "grapes",
    uchuva: "groundcherries",
    papaya: "papayas",
    melon: "melons",
    sandia: "watermelon",
    durazno: "peaches",
    cereza: "cherries",
    coco: "coconut",
    aguacate: "avocados",
    tamarindo: "tamarinds",
    arandano: ["blueberries", "cranberries"],
    ciruela: "plums",
    pasa: "raisins",
    datil: "dates",
    higo: "figs",
    frijol: "beans",
    lenteja: "lentils",
    garbanzo: "chickpeas",
    arveja: "peas",
    soya: "soy",
    soja: "soy",
    mani: "peanuts",
    haba: "broad beans",
    almendra: "almonds",
    nuez: ["walnuts", "nuts"],
    maranon: "cashew",
    avellana: "hazelnuts",
    pistacho: "pistachio",
    ajonjoli: "sesame",
    chia: "chia",
    linaza: "flaxseed",
    girasol: "sunflower",
    azucar: ["sugars granulated", "sugar"],
    panela: ["sugars brown", "piloncillo"],
    miel: "honey",
    glucosa: ["glucose", "syrups corn"],
    jarabe: "syrup",
    sirope: "syrup",
    cana: "cane",
    melaza: "molasses",
    chocolate: "chocolate",
    cacao: "cocoa",
    cafe: "coffee",
    instantaneo: "instant",
    te: "tea",
    aceite: "oil",
    palma: "palm",
    oliva: "olive",
    canola: "canola",
    margarina: "margarine",
    agua: "water",
    jugo: "juice",
    zumo: "juice",
    vino: "wine",
    cerveza: "beer",
    salsa: "sauce",
    sal: "salt",
    pimienta: "pepper",
    comino: "cumin",
    canela: "cinnamon",
    clavo: "cloves",
    jengibre: "ginger",
    curcuma: "turmeric",
    anis: "anise",
    paprika: "paprika",
    mostaza: "mustard",
    curry: "curry",
    vainilla: "vanilla",
    vinagre: "vinegar",
    destilado: "distilled",
    bicarbonato: "baking soda",
    gelatina: "gelatin",
    agar: "agar",
    azafran: "saffron",
    cardamomo: "cardamom",
    polvo: ["~powder", "~dry", "~dried"],
    seco: ["dried", "dry", "dehydrated"],
    seca: ["dried", "dry", "dehydrated"],
    deshidratado: ["dehydrated", "dried"],
    deshidratada: ["dehydrated", "dried"],
    concentrado: "concentrate",
    concentrada: "concentrate",
    aislado: "isolate",
    aislada: "isolate",
    proteina: "protein",
    hidrolizada: "hydrolyzed",
    magro: "lean",
    magra: "lean",
    amarillo: "yellow",
    amarilla: "yellow",
    blanco: "white",
    blanca: "white",
    negro: "black",
    negra: "black",
    rojo: "red",
    roja: "red",
    verde: "green",
    integral: "whole",
    rallado: "grated",
    rallada: "grated",
    tostado: "toasted",
    cocido: "cooked",
    cocida: "cooked",
    frito: "fried",
    asado: "roasted",
    congelado: "frozen",
    enlatado: "canned",
    dulce: "~sweet",
    solo: "~only",
    crudo: "~raw",
    cruda: "~raw",
    fresco: "~raw",
    fresca: "~raw",
    entero: "~whole",
    entera: "~whole",
    natural: "",
    pulpa: "",
    refinada: "",
    refinado: "",
    tipo: "",
    sabor: "",
    mezcla: "",
    fritura: "",
    sin: "",
    con: "",
    de: "",
    del: "",
    la: "",
    las: "",
    el: "",
    los: "",
    en: "",
    y: "",
    al: "",
    para: "",
    por: "",
    x: "",
  };
  const ESPECIAS = new Set([
    "basil",
    "thyme",
    "rosemary",
    "oregano",
    "ginger",
    "cumin",
    "pepper",
    "cinnamon",
    "cloves",
    "nutmeg",
    "turmeric",
    "anise",
    "cardamom",
    "saffron",
    "paprika",
    "mustard",
    "bay",
  ]);
  const PENALIZA = [
    "cooked",
    "fried",
    "roasted",
    "boiled",
    "braised",
    "broiled",
    "baked",
    "stewed",
    "canned",
    "frozen",
    "prepared",
    "microwaved",
    "grilled",
    "heated",
    "babyfood",
    "infant",
    "toddler",
    "juice",
    "restaurant",
    "fast",
    "school",
    "mix",
    "imitation",
    "dessert",
    "candies",
    "snacks",
    "formula", "deli", "rotisserie", "prepackaged", "seasoned", "made", "sliced", "flavor", "variety", "products", "breaded", "meatless", "luncheon", "skin", "turkey", "imported",
  ];

  function traducir(t) {
    for (const v of [
      t,
      t.endsWith("es") && t.slice(0, -2),
      t.endsWith("s") && t.slice(0, -1),
    ]) {
      if (v && ES_EN[v] !== undefined) return ES_EN[v];
    }
    return undefined;
  }

  function terminosDe(texto) {
    let resto = ` ${normalizar(texto)
      .replace(/\(.*?\)/g, " ")
      .replace(/[^a-z0-9]+/g, " ")} `;
    const out = [];
    for (const f of Object.keys(FRASES).sort((a, b) => b.length - a.length)) {
      if (resto.includes(` ${f} `)) {
        FRASES[f]
          .split(" ")
          .forEach((w) => out.push({ alts: [w], blando: false }));
        resto = resto.replace(` ${f} `, " ");
      }
    }
    for (const t of resto.trim().split(" ")) {
      if (!t || /^\d+$/.test(t)) continue;
      const tr = traducir(t);
      if (tr === "") continue;
      if (tr === undefined) {
        if (t.length > 2)
          out.push({ alts: [t], blando: true, desconocido: true });
        continue;
      }
      const alts = [].concat(tr);
      out.push({
        alts: alts.map((a) => a.replace(/^~/, "")),
        blando: alts.every((a) => a.startsWith("~")),
      });
    }
    return out;
  }

  // Igual o su plural; el prefijo solo vale para palabras escritas directamente en inglés.
  const igual = (p, x, prefijo) =>
    x === p ||
    x === p + "s" ||
    x === p + "es" ||
    (p.endsWith("y") && x === p.slice(0, -1) + "ies") ||
    (prefijo && p.length >= 4 && x.startsWith(p));
  const coincide = (alt, w, prefijo) =>
    alt.split(" ").every((p) => w.some((x) => igual(p, x, prefijo)));
  const NEUTRAS = new Set([
    "spices",
    "beverages",
    "beverage",
    "alcoholic",
    "leavening",
    "agents",
    "oil",
    "nuts",
    "seeds",
    "broilers",
    "fryers",
    "or",
    "fresh",
  ]);

  function candidatosUSDA(usda, texto, claves) {
    const terminos = terminosDe(texto);
    let duros = terminos.filter((t) => !t.blando);
    if (!duros.length) duros = terminos.filter((t) => t.desconocido);
    if (!duros.length) return [];
    const pedidos = new Set(
      terminos.flatMap((t) => t.alts.flatMap((a) => a.split(" "))),
    );
    const quiereFresco = terminos.some(
      (t) => t.blando && t.alts.includes("raw"),
    );
    const especia = !quiereFresco && duros.some((t) => ESPECIAS.has(t.alts[0]));
    const indices = (claves || [])
      .map((k) => usda.claves.indexOf(k))
      .filter((i) => i >= 0);
    const pideForma = ["powder", "dry", "dried", "ground"].some((f) => pedidos.has(f));
    const res = [];
    for (const [fdc, a] of Object.entries(usda.alimentos)) {
      const w = a[0].toLowerCase().match(/[a-z]+/g) || [];
      const aciertos = duros.filter((t) =>
        t.alts.some((alt) => coincide(alt, w, t.desconocido)),
      ).length;
      if (!aciertos) continue;
      const cabeza =
        a[0]
          .split(",")[0]
          .toLowerCase()
          .match(/[a-z]+/g) || [];
      let puntos = aciertos * 10;
      if (duros[0].alts.some((alt) => coincide(alt, w))) puntos += 6;
      if (duros[0].alts.some((alt) => coincide(alt, cabeza))) puntos += 4;
      puntos += 3 * duros.filter((t) => coincide(t.alts[0], w)).length;
      puntos +=
        3 *
        terminos.filter(
          (t) => t.blando && t.alts.some((alt) => coincide(alt, w)),
        ).length;
      if (indices.length)
        puntos +=
          (4 * indices.filter((i) => a[4][i] !== null).length) / indices.length;
      if (especia && cabeza[0] === "spices") puntos += 8;
      if (!pideForma && !pedidos.has("raw") && w.includes("raw")) puntos += 2;
      if (pideForma && w.includes("raw")) puntos -= 3;
      puntos -=
        3 * PENALIZA.filter((p) => w.includes(p) && !pedidos.has(p)).length;
      const ajenas = cabeza.filter(
        (x) => !NEUTRAS.has(x) && ![...pedidos].some((p) => igual(p, x, false)),
      ).length;
      puntos -= 2 * Math.min(ajenas, 3);
      puntos -= w.length * 0.15;
      res.push({
        fdc,
        desc: a[0],
        base: a[2],
        puntos,
        aciertos,
        total: duros.length,
      });
    }
    return res.sort(
      (x, y) => y.puntos - x.puntos || x.desc.length - y.desc.length,
    );
  }

  function buscarUSDA(usda, texto, limite = 15, claves) {
    const id = normalizar(texto);
    if (/^\d{5,8}$/.test(id) && usda.alimentos[id]) {
      const a = usda.alimentos[id];
      return [{ fdc: id, desc: a[0], base: a[2], aciertos: 1, total: 1 }];
    }
    return candidatosUSDA(usda, texto, claves).slice(0, limite);
  }

  // Elige solo si reconoce la palabra principal y encuentra todas las obligatorias; si no, se elige a mano.
  // Tampoco elige un procesado no pedido cuyo nombre no empieza por el ingrediente (almidón → gomitas).
  function elegirAutomatico(usda, nombre, claves) {
    const terminos = terminosDe(nombre);
    if (!terminos.length || terminos[0].desconocido) return null;
    const c = candidatosUSDA(usda, nombre, claves);
    if (!c.length || c[0].aciertos < c[0].total) return null;
    const w = c[0].desc.toLowerCase().match(/[a-z]+/g) || [];
    const pedidos = terminos.flatMap((t) => t.alts.flatMap((x) => x.split(" ")));
    const duros = terminos.filter((t) => !t.blando);
    const cabeza = c[0].desc.split(",")[0].toLowerCase().match(/[a-z]+/g) || [];
    const enCabeza = (duros[0] || terminos[0]).alts.some((alt) => coincide(alt, cabeza));
    if (!enCabeza && PENALIZA.some((x) => w.includes(x) && !pedidos.includes(x))) return null;
    return { ...c[0], alternativas: c.slice(1, 4) };
  }

  const api = { terminosDe, buscarUSDA, elegirAutomatico };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  g.Busqueda = api;
})(typeof window !== "undefined" ? window : globalThis);
