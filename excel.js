(function (g) {
  "use strict";

  const CAB_TN = [
    "Ingredientes",
    "Cantidad",
    "%",
    "Azúcares totales % en ingrediente",
    "Aporte de azúcares totales % en el producto",
    "azucares añadidos % en ingrediente",
    "Aporte de Azúcares añadidos % en el producto",
    "grasa Total  % en ingrediente",
    "Aporte de grasa total % en el producto",
    "grasa saturada  % en ingrediente",
    "Aporte de grasa saturada % en el producto",
    "grasa trans  mg en ingrediente",
    "Aporte de grasa TRANS mg en el producto",
    "vita A  mcg ER en ingrediente",
    "Aporte de Vitamina A mcg ER en el producto",
    "vita D  mcg en ingrediente",
    "Aporte de Vitamina D mcg  en el producto",
    "Fuente",
  ];
  const ANCHOS_TN = [
    23.6, 11.7, 9, 15.7, 12.9, 15.7, 15.3, 14.4, 13.3, 14.9, 12.6, 14.6, 11.9,
    15.4, 13.3, 14.7, 12.7, 26,
  ];
  const PARES = [
    ["D", "E", "azt"],
    ["F", "G", "aza"],
    ["H", "I", "grasa"],
    ["J", "K", "sat"],
    ["L", "M", "trans"],
    ["N", "O", "vita"],
    ["P", "Q", "vitd"],
  ];
  const FUENTE = { name: "Calibri", size: 11 };
  const NEGRITA = { ...FUENTE, bold: true };
  const BORDE = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  const GRIS = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDDDDDD" },
  };

  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  const r2 = (x) => Math.round(x * 100) / 100;
  const elegidos = (ctx, C) =>
    C.PARAMS.filter(([k]) => !ctx.claves || ctx.claves.includes(k));

  function encabezado(fila) {
    fila.eachCell((c) => {
      c.font = NEGRITA;
      c.fill = GRIS;
      c.alignment = { wrapText: true, vertical: "top" };
    });
  }

  // Misma estructura que el Cálculo TN: siempre con sus columnas fijas.
  function hojaCalculoTN(wb, ctx, C) {
    const { filas, res } = ctx;
    const ws = wb.addWorksheet("Cálculo TN");
    ANCHOS_TN.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });
    ws.getCell("A1").value =
      `${ctx.producto || "Producto"} · consecutivo ${ctx.consecutivo || "—"}`;
    ws.getCell("A1").font = NEGRITA;

    CAB_TN.forEach((t, i) => {
      const c = ws.getCell(3, i + 1);
      c.value = t;
      c.font = NEGRITA;
      c.alignment = { wrapText: true, vertical: "top" };
      c.border = BORDE;
    });

    const ini = 4,
      teo = ini + filas.length,
      rep = teo + 1;
    const suma = {};
    filas.forEach((f, j) => {
      const r = ini + j;
      const pctProd = (f.pct / res.total) * 100;
      ws.getCell(`A${r}`).value = f.nombre;
      ws.getCell(`B${r}`).value = f.pct;
      ws.getCell(`C${r}`).value = {
        formula: `B${r}/$B$${rep}*100`,
        result: pctProd,
      };
      for (const [v, a, k] of PARES) {
        const x = f.perfil && C.esNumero(f.perfil[k]) ? r4(f.perfil[k]) : null;
        ws.getCell(`${v}${r}`).value = x;
        ws.getCell(`${a}${r}`).value = {
          formula: `(${v}${r}*C${r})/100`,
          result: ((x || 0) * pctProd) / 100,
        };
        suma[a] = (suma[a] || 0) + ((x || 0) * pctProd) / 100;
      }
      ws.getCell(`R${r}`).value = f.ref || "Sin fuente";
      for (let col = 1; col <= 18; col++) ws.getCell(r, col).border = BORDE;
    });

    ws.getCell(`A${teo}`).value = "Total cálculo teórico";
    for (const [, a] of PARES)
      ws.getCell(`${a}${teo}`).value = {
        formula: `SUM(${a}${ini}:${a}${teo - 1})`,
        result: suma[a],
      };

    const P = res.practico;
    ws.getCell(`A${rep}`).value = "Total para reportar";
    ws.getCell(`A${rep}`).font = NEGRITA;
    ws.getCell(`B${rep}`).value = {
      formula: `SUM(B${ini}:B${teo - 1})`,
      result: res.total,
    };
    ws.getCell(`C${rep}`).value = {
      formula: `SUM(C${ini}:C${teo - 1})`,
      result: 100,
    };
    const azt = C.esNumero(P.azt) ? r2(P.azt) : suma.E;
    ws.getCell(`E${rep}`).value = C.esNumero(P.azt)
      ? azt
      : { formula: `E${teo}`, result: azt };
    ws.getCell(`G${rep}`).value = {
      formula: `IF(E${teo}=0,0,E${rep}*G${teo}/E${teo})`,
      result: suma.E ? (azt * suma.G) / suma.E : 0,
    };
    const grasa = C.esNumero(P.grasa) ? r2(P.grasa) : suma.I;
    ws.getCell(`I${rep}`).value = C.esNumero(P.grasa)
      ? grasa
      : { formula: `I${teo}`, result: grasa };
    for (const a of ["K", "M", "O", "Q"]) {
      ws.getCell(`${a}${rep}`).value = {
        formula: `IF($I$${teo}=0,0,$I$${rep}*${a}${teo}/$I$${teo})`,
        result: suma.I ? (grasa * suma[a]) / suma.I : 0,
      };
    }
    for (let col = 5; col <= 17; col++) ws.getCell(rep, col).border = BORDE;

    const cal = rep + 4,
      cab = cal + 2;
    const valor = (k) => (C.esNumero(P[k]) ? P[k] : res.ajustado[k]);
    ws.getCell(`A${cal}`).value = "Porción (g)";
    ws.getCell(`A${cal + 1}`).value = ctx.porcion;
    ws.mergeCells(`B${cal}:D${cal + 1}`);
    ws.getCell(`B${cal}`).value = "CALORIAS 100g";
    ws.mergeCells(`E${cal}:G${cal + 1}`);
    ws.getCell(`E${cal}`).value = "CALORIAS PORCIÓN";
    [
      "NUTRIENTE",
      "CANTIDAD",
      "FACTOR",
      "APORTE ENERGETICO",
      "CANTIDAD",
      "FACTOR",
      "APORTE ENERGETICO",
    ].forEach((t, i) => {
      ws.getCell(cab, i + 1).value = t;
    });
    const fib = cab + 4;
    const nutrientes = [
      [
        "Carbohidratos disponibles",
        {
          formula: `${r2(valor("cho"))}-B${fib}`,
          result: r2(valor("cho")) - r2(valor("fib")),
        },
        4,
      ],
      ["grasa", r2(valor("grasa")), 9],
      ["proteína", r2(valor("prot")), 4],
      ["fibra", r2(valor("fib")), 2],
    ];
    let d = 0,
      e = 0;
    nutrientes.forEach(([nombre, cantidad, factor], i) => {
      const r = cab + 1 + i;
      const b = typeof cantidad === "number" ? cantidad : cantidad.result;
      ws.getCell(`A${r}`).value = nombre;
      ws.getCell(`B${r}`).value = cantidad;
      ws.getCell(`C${r}`).value = factor;
      ws.getCell(`D${r}`).value = {
        formula: `B${r}*C${r}`,
        result: b * factor,
      };
      ws.getCell(`E${r}`).value = {
        formula: `B${r}*$A$${cal + 1}/100`,
        result: (b * ctx.porcion) / 100,
      };
      ws.getCell(`F${r}`).value = factor;
      ws.getCell(`G${r}`).value = {
        formula: `E${r}*F${r}`,
        result: ((b * ctx.porcion) / 100) * factor,
      };
      d += b * factor;
      e += ((b * ctx.porcion) / 100) * factor;
    });
    const tot = cab + 5;
    ws.getCell(`A${tot}`).value = "total";
    ws.getCell(`D${tot}`).value = {
      formula: `SUM(D${cab + 1}:D${cab + 4})`,
      result: d,
    };
    ws.getCell(`G${tot}`).value = {
      formula: `SUM(G${cab + 1}:G${cab + 4})`,
      result: e,
    };
    for (let r = cal; r <= tot; r++)
      for (let col = 1; col <= 7; col++) ws.getCell(r, col).border = BORDE;
    ws.getCell(`A${tot + 2}`).value = C.esNumero(P.grasa)
      ? "Grasa, proteína, carbohidratos y fibra: dato práctico del laboratorio cuando existe; si no, teórico ajustado a humedad."
      : "Sin dato práctico: grasa, proteína, carbohidratos y fibra son teóricos ajustados a humedad.";

    ws.eachRow((fila) =>
      fila.eachCell((c) => {
        if (!c.font || !c.font.bold) c.font = FUENTE;
      }),
    );
  }

  function hojaComparacion(wb, ctx, C) {
    const { res, origenLab } = ctx;
    const ws = wb.addWorksheet("Teórico vs práctico");
    ws.addRow([
      `${ctx.producto || "Producto"} · consecutivo ${ctx.consecutivo || "—"}`,
    ]).font = NEGRITA;
    ws.addRow([
      C.esNumero(res.practico.hum)
        ? `Humedad teórica de la mezcla: ${res.teorico.hum.toFixed(2)} % · humedad medida: ${res.practico.hum.toFixed(2)} % · factor de ajuste de sólidos: ${res.kHum.toFixed(4)}`
        : "Sin humedad medida: el teórico no se ajustó.",
    ]);
    ws.addRow([]);
    encabezado(
      ws.addRow([
        "Componente",
        "Unidad /100 g",
        "Teórico mezcla",
        "Teórico ajustado a humedad",
        "Práctico (laboratorio)",
        "Diferencia (%)",
        "PRSD Horwitz (%)",
        "Z Horwitz",
        "Criterio Horwitz",
        "% de la fórmula con dato",
        "Origen del dato práctico",
      ]),
    );
    for (const [k, nombre, unidad] of elegidos(ctx, C)) {
      const p = res.practico[k];
      const h = res.horwitz[k];
      const az = h ? Math.abs(h.z) : null;
      ws.addRow([
        nombre,
        unidad,
        r4(res.teorico[k]),
        r4(res.ajustado[k]),
        C.esNumero(p) ? r4(p) : p === "nd" ? "nd" : "sin dato",
        k in res.dif ? Math.round(res.dif[k] * 10) / 10 : "",
        h ? r2(h.prsd) : "",
        h ? Math.round(h.z * 100) / 100 : "",
        az == null
          ? ""
          : az <= 2
            ? "Aceptable"
            : az < 3
              ? "Cuestionable"
              : "No aceptable",
        r2(res.cubierto[k]),
        k === "cho" && C.esNumero(p)
          ? "100 − (humedad + proteína + grasa + cenizas)"
          : origenLab[k] || "",
      ]);
    }
    ws.addRow([]);
    ws.addRow([
      "Proteína con N × 6,25. Minerales: según el informe de laboratorio.",
    ]);
    [24, 12, 14, 16, 14, 13, 14, 44].forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });
  }

  function hojaAporte(wb, ctx, C) {
    const { filas, res } = ctx;
    const ps = elegidos(ctx, C);
    const ws = wb.addWorksheet("Aporte por ingrediente");
    encabezado(
      ws.addRow([
        "Ingrediente",
        "% en fórmula",
        ...ps.map((p) => `${p[1]} (${p[2]})`),
      ]),
    );
    for (const f of filas) {
      const pct = (f.pct / res.total) * 100;
      ws.addRow([
        f.nombre,
        r4(pct),
        ...ps.map(([k]) =>
          f.perfil && C.esNumero(f.perfil[k])
            ? r4((pct * f.perfil[k]) / 100)
            : "—",
        ),
      ]);
    }
    ws.addRow([
      "TOTAL mezcla",
      100,
      ...ps.map(([k]) => r4(res.teorico[k])),
    ]).font = NEGRITA;
    ws.getColumn(1).width = 28;
    for (let i = 2; i <= ps.length + 2; i++) ws.getColumn(i).width = 12;
  }

  function hojaFuentes(wb, ctx, C) {
    const ps = elegidos(ctx, C);
    const ws = wb.addWorksheet("Fuentes e IDs");
    encabezado(
      ws.addRow([
        "Ingrediente",
        "Cantidad",
        "Fuente usada",
        "Referencia",
        "Estado",
        "Complementado con",
        "Sin dato",
        "Nota",
      ]),
    );
    for (const f of ctx.filas) {
      const comp = (f.complementos || [])
        .filter((c) => ps.some((p) => p[0] === c.clave))
        .map(
          (c) =>
            `${C.NOMBRE[c.clave]} ← ${c.fdc} «${c.desc.slice(0, 60)}» (similitud ${c.sim.toFixed(2)})`,
        )
        .join("\n");
      const faltan = ps
        .filter(([k]) => !f.perfil || !(k in f.perfil))
        .map((p) => p[1])
        .join(", ");
      ws.addRow([
        f.nombre,
        f.pct,
        f.fuente || "Sin fuente",
        f.ref || "—",
        f.estado || "—",
        comp || "—",
        faltan || "—",
        f.nota || "",
      ]);
    }
    [28, 10, 50, 22, 16, 60, 40, 50].forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });
    ws.eachRow((fila) =>
      fila.eachCell((c) => {
        c.alignment = { wrapText: true, vertical: "top" };
      }),
    );
  }

  async function construirExcel(ExcelJS, ctx) {
    const C = g.Calculo;
    const wb = new ExcelJS.Workbook();
    wb.calcProperties.fullCalcOnLoad = true;
    hojaCalculoTN(wb, ctx, C);
    hojaComparacion(wb, ctx, C);
    hojaAporte(wb, ctx, C);
    hojaFuentes(wb, ctx, C);
    return wb.xlsx.writeBuffer();
  }

  const api = { construirExcel };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  g.ExcelTN = api;
})(typeof window !== "undefined" ? window : globalThis);
