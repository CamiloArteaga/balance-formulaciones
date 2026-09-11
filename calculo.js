(function (g) {
  "use strict";

  const PARAMS = [
    ["hum", "Humedad", "g"],
    ["n", "Nitrógeno", "g"],
    ["prot", "Proteína", "g"],
    ["grasa", "Grasa total", "g"],
    ["sat", "Grasa saturada", "g"],
    ["trans", "Grasa trans", "mg"],
    ["azt", "Azúcares totales", "g"],
    ["aza", "Azúcares añadidos", "g"],
    ["fib", "Fibra dietaria", "g"],
    ["cen", "Cenizas", "g"],
    ["cho", "Carbohidratos totales", "g"],
    ["vita", "Vitamina A", "µg"],
    ["vitd", "Vitamina D", "µg"],
    ["vitc", "Vitamina C", "mg"],
    ["col", "Colesterol", "mg"],
    ["na", "Sodio", "mg"],
    ["k", "Potasio", "mg"],
    ["ca", "Calcio", "mg"],
    ["zn", "Zinc", "mg"],
    ["fe", "Hierro", "mg"],
    ["cu", "Cobre", "mg"],
    ["mg", "Magnesio", "mg"],
    ["mn", "Manganeso", "mg"],
  ];
  const NOMBRE = Object.fromEntries(PARAMS.map((p) => [p[0], p[1]]));
  const VACIAS = new Set(["raw", "and", "or", "with", "without", "the", "of"]);

  const normalizar = (s) =>
    String(s)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  const palabras = (d) =>
    new Set(
      (d.toLowerCase().match(/[a-z]+/g) || []).filter((w) => !VACIAS.has(w)),
    );
  const esNumero = (v) => typeof v === "number" && isFinite(v);

  function perfilUSDA(usda, fid) {
    const a = usda.alimentos[fid];
    if (!a) return null;
    const [desc, , base, fn, vals, alt = {}] = a;
    const perfil = {},
      origen = {};
    usda.claves.forEach((k, i) => {
      if (vals[i] !== null) {
        perfil[k] = vals[i];
        origen[k] = `${fid} (nutriente ${alt[k] || usda.ids[k][0]})`;
      }
    });
    if (!("n" in perfil) && "prot" in perfil) {
      perfil.n = perfil.prot / fn;
      origen.n = `${fid}: proteína ÷ ${fn}`;
    }
    if (!("aza" in perfil)) {
      perfil.aza = 0;
      origen.aza = "0: sin azúcar añadido";
    }
    return { perfil, origen, desc, base };
  }

  function complementar(usda, fid, perfil, origen) {
    const [desc, cat] = usda.alimentos[fid];
    const primera = desc.split(",")[0].toLowerCase();
    const pa = palabras(desc);
    const hechos = [];
    usda.claves.forEach((k, i) => {
      if (k in perfil || k === "aza") return;
      let mejor = null;
      for (const [o, b] of Object.entries(usda.alimentos)) {
        if (
          o === fid ||
          b[1] !== cat ||
          b[4][i] === null ||
          b[0].split(",")[0].toLowerCase() !== primera
        )
          continue;
        const pb = palabras(b[0]);
        const comunes = [...pa].filter((w) => pb.has(w)).length;
        const sim = comunes / new Set([...pa, ...pb]).size;
        if (!mejor || sim > mejor.sim || (sim === mejor.sim && o > mejor.o))
          mejor = { sim, o };
      }
      if (!mejor || mejor.sim < 0.3) return;
      const b = usda.alimentos[mejor.o];
      perfil[k] = b[4][i];
      origen[k] =
        `COMPLEMENTO ${mejor.o} (nutriente ${(b[5] || {})[k] || usda.ids[k][0]})`;
      hechos.push({ clave: k, fdc: mejor.o, desc: b[0], sim: mejor.sim });
    });
    return hechos;
  }

  function buscarEnBiblioteca(nombre, entradas) {
    const n = normalizar(nombre);
    return (
      entradas.find((e) =>
        [e.nombre, ...(e.alias || [])].some((a) => normalizar(a) === n),
      ) || null
    );
  }

  function perfilDeEntrada(entrada, usda) {
    if (entrada.tipo === "agua") {
      const perfil = Object.fromEntries(PARAMS.map((p) => [p[0], 0]));
      perfil.hum = 100;
      return {
        perfil,
        origen: {},
        fuente: "Agua (100 % humedad)",
        ref: "—",
        complementos: [],
      };
    }
    if (entrada.tipo === "valores") {
      const perfil = { ...entrada.valores };
      if ("prot" in perfil && !("n" in perfil)) perfil.n = perfil.prot / 6.25;
      const origen = Object.fromEntries(
        Object.keys(perfil).map((k) => [k, entrada.ref]),
      );
      return {
        perfil,
        origen,
        fuente: entrada.ref,
        ref: entrada.ref,
        complementos: [],
      };
    }
    const p = perfilUSDA(usda, entrada.fdc);
    if (!p)
      return { error: `El ID ${entrada.fdc} no está en la base local de USDA` };
    const complementos = complementar(usda, entrada.fdc, p.perfil, p.origen);
    return {
      perfil: p.perfil,
      origen: p.origen,
      complementos,
      fuente: `${p.base} ${entrada.fdc} — ${p.desc}`,
      ref: `USDA (ID: ${entrada.fdc})`,
    };
  }

  // Las cantidades pueden venir en %, g o kg: todo se refiere al total de la fórmula.
  function calcular(filas, lab) {
    const total = filas.reduce((s, f) => s + f.pct, 0);
    const teorico = {},
      cubierto = {};
    for (const [k] of PARAMS) {
      teorico[k] = 0;
      cubierto[k] = 0;
      for (const f of filas) {
        if (f.perfil && k in f.perfil && total > 0) {
          teorico[k] += (f.pct * f.perfil[k]) / total;
          cubierto[k] += (f.pct / total) * 100;
        }
      }
    }
    const kHum = esNumero(lab.hum) ? (100 - lab.hum) / (100 - teorico.hum) : 1;
    const ajustado = {};
    for (const [k] of PARAMS)
      ajustado[k] =
        k === "hum" && esNumero(lab.hum) ? lab.hum : teorico[k] * kHum;
    const practico = { ...lab };
    if (["hum", "prot", "grasa", "cen"].every((k) => esNumero(lab[k]))) {
      practico.cho = 100 - (lab.hum + lab.prot + lab.grasa + lab.cen);
    }
    const dif = {};
    for (const [k] of PARAMS) {
      if (esNumero(practico[k]) && practico[k] !== 0)
        dif[k] = ((ajustado[k] - practico[k]) / practico[k]) * 100;
    }
    return { teorico, cubierto, total, kHum, ajustado, practico, dif };
  }

  const HOJAS_R07 = [
    { hoja: "HUMEDAD", col: { hum: "K" } },
    { hoja: "CENIZAS", col: { cen: "I" } },
    { hoja: "PROTEINA", col: { n: "H", prot: "I" } },
    { hoja: "GRASA", col: { grasa: "K" } },
    { hoja: "FIBRA DIETARIA", col: { fib: "H" } },
    { hoja: "AZUCARES", col: { azt: "L" } },
    { hoja: "AZ", col: { azt: "G" } },
    { hoja: "VITA C", col: { vitc: "G" } },
    { hoja: "COLESTEROL", col: { col: "H" } },
    {
      hoja: "MINERALES",
      col: {
        na: "F",
        ca: "I",
        fe: "L",
        k: "O",
        zn: "R",
        mg: "X",
        mn: "AA",
        cu: "AD",
      },
      ppm: {
        na: "E",
        ca: "H",
        fe: "K",
        k: "N",
        zn: "Q",
        mg: "W",
        mn: "Z",
        cu: "AC",
      },
    },
  ];

  function leerR07(XLSX, wb, consecutivo) {
    const objetivo = String(consecutivo).trim();
    const lab = {},
      origen = {};
    for (const h of HOJAS_R07) {
      const nombre = wb.SheetNames.find(
        (n) => normalizar(n) === normalizar(h.hoja),
      );
      const ws = nombre && wb.Sheets[nombre];
      if (!ws || !ws["!ref"]) continue;
      const rango = XLSX.utils.decode_range(ws["!ref"]);
      const filas = [];
      let dentro = false;
      for (let r = rango.s.r + 2; r <= rango.e.r + 1; r++) {
        const b = ws["B" + r];
        const txt = b && b.v != null ? String(b.v).trim() : "";
        if (txt) dentro = txt === objetivo;
        if (dentro) filas.push(r);
      }
      if (!filas.length) continue;
      for (const [k, col] of Object.entries(h.col)) {
        if (k in lab) continue;
        const nums = [];
        let nd = false;
        for (const r of filas) {
          if (h.ppm) {
            const ppm = ws[h.ppm[k] + r];
            if (!ppm || ppm.v === "" || ppm.v == null) continue;
            if (typeof ppm.v === "string" && normalizar(ppm.v) === "nd") {
              nd = true;
              continue;
            }
          }
          const c = ws[col + r];
          if (c && c.t === "n" && isFinite(c.v)) nums.push(c.v);
        }
        const donde = `${nombre.trim()}, fila${filas.length > 1 ? "s" : ""} ${filas.join(", ")}`;
        if (nums.length) {
          lab[k] = nums.reduce((s, v) => s + v, 0) / nums.length;
          origen[k] =
            `${donde} (${nums.length === 1 ? "1 valor" : "media de " + nums.length})`;
        } else if (nd) {
          lab[k] = "nd";
          origen[k] = donde;
        }
      }
    }
    return { lab, origen };
  }

  const api = {
    PARAMS,
    NOMBRE,
    normalizar,
    perfilUSDA,
    complementar,
    buscarEnBiblioteca,
    perfilDeEntrada,
    calcular,
    leerR07,
    esNumero,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  g.Calculo = api;
})(typeof window !== "undefined" ? window : globalThis);
