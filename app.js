(function () {
  "use strict";
  const C = window.Calculo;
  const $ = (s) => document.querySelector(s);
  const guardado = {
    leer(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : d;
      } catch {
        return d;
      }
    },
    escribir(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* sin almacenamiento */
      }
    },
  };
  const EJEMPLO =
    "Ripio de pollo\t60\nCarne de cerdo magra\t18\nSal refinada\t1,5\nAjo en polvo\t0,1\nAlmidón de yuca\t3\nProteína concentrada de soya\t3\nAgua\t14,4";
  const LAB_CLAVES = [
    "hum",
    "n",
    "prot",
    "grasa",
    "cen",
    "fib",
    "azt",
    "vitc",
    "col",
    "na",
    "k",
    "ca",
    "zn",
    "fe",
    "cu",
    "mg",
    "mn",
  ];
  const ESTADOS = {
    revisado: ["Revisado", "c-ok"],
    propuesto: ["Propuesto", "c-rep"],
    elegido: ["Elegido", "c-keep"],
    "sin soporte": ["Sin soporte", "c-no"],
    "sin fuente": ["Sin fuente", "c-no"],
    error: ["Error", "c-no"],
  };

  const st = {
    formula: [],
    elecciones: guardado.leer("elecciones", {}),
    privada: guardado.leer("bibliotecaPrivada", []),
    lab: {},
    origenLab: {},
    r07: null,
    r07nombre: "",
    abierto: null,
    ultimo: null,
  };
  const cache = new Map();

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const num = (x, d) =>
    C.esNumero(x)
      ? x.toLocaleString("es-CO", {
          minimumFractionDigits: d,
          maximumFractionDigits: d,
        })
      : "—";
  const dec = (x) => (Math.abs(x) >= 100 ? 1 : Math.abs(x) >= 1 ? 2 : 3);
  const leerNumero = (t) => {
    const v = parseFloat(String(t).replace(",", "."));
    return isFinite(v) ? v : null;
  };
  const todas = () => [...st.privada, ...window.BIBLIOTECA];

  function entradaPara(nombre) {
    const e = st.elecciones[C.normalizar(nombre)];
    if (e && e.fdc)
      return {
        nombre,
        tipo: "usda",
        fdc: e.fdc,
        estado: "elegido",
        nota: "Elegido en la herramienta",
      };
    if (e && e.bib) return C.buscarEnBiblioteca(e.bib, todas());
    return C.buscarEnBiblioteca(nombre, todas());
  }

  function perfil(entrada) {
    const clave =
      entrada.tipo === "usda"
        ? "u" + entrada.fdc
        : `${entrada.tipo}:${entrada.ref || entrada.nombre}`;
    if (!cache.has(clave))
      cache.set(clave, C.perfilDeEntrada(entrada, window.USDA));
    return cache.get(clave);
  }

  function filas() {
    return st.formula.map((f) => {
      const e = entradaPara(f.nombre);
      if (!e) return { ...f, estado: "sin fuente" };
      const p = perfil(e);
      if (p.error) return { ...f, estado: "error", nota: p.error };
      return { ...f, ...p, estado: e.estado, nota: e.nota };
    });
  }

  function leerPegado(texto) {
    return texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const m =
          l.match(/^(.*?)[\t;]+\s*([\d.,]+)/) ||
          l.match(/^(.*\S)\s+([\d.,]+)\s*%?$/);
        return m ? { nombre: m[1].trim(), pct: leerNumero(m[2]) } : null;
      })
      .filter(
        (f) =>
          f && f.nombre && f.pct !== null && !/^ingrediente/i.test(f.nombre),
      );
  }

  function chip(estado) {
    const [t, c] = ESTADOS[estado] || [estado || "—", "c-keep"];
    return `<span class="chip ${c}">${esc(t)}</span>`;
  }

  function pintarFormula(fs) {
    const total = fs.reduce((s, f) => s + f.pct, 0);
    const suma = $("#suma");
    suma.textContent = fs.length ? `Suma: ${num(total, 2)} %` : "";
    suma.className =
      "suma " +
      (fs.length ? (Math.abs(total - 100) < 0.01 ? "ok" : "mal") : "");
    let h = `<thead><tr><th class="num">#</th><th>Ingrediente</th><th class="num">%</th><th>Estado</th><th>Fuente</th><th></th></tr></thead><tbody>`;
    fs.forEach((f, i) => {
      const fuente = f.fuente
        ? esc(f.fuente).replace(
            /^(SR Legacy|Foundation) (\d+)/,
            '$1 <span class="id">$2</span>',
          )
        : `<span class="suave">${esc(f.nota || "No está en ninguna biblioteca")}</span>`;
      h += `<tr><td class="num suave">${i + 1}</td><td>${esc(f.nombre)}</td><td class="num">${num(f.pct, 2)}</td><td>${chip(f.estado)}</td><td>${fuente}</td>
        <td><button class="btn mini" data-elegir="${i}" aria-expanded="${st.abierto === i}">${f.estado === "sin fuente" ? "Elegir" : "Cambiar"}</button></td></tr>`;
      if (st.abierto === i) h += filaPicker(f, i);
    });
    $("#t-formula").innerHTML = h + "</tbody>";
    const buscador = $("#busqueda");
    if (buscador) {
      buscador.focus();
      pintarCandidatos(buscador.value);
    }
  }

  function filaPicker(f, i) {
    const tiene = st.elecciones[C.normalizar(f.nombre)];
    return `<tr class="picker"><td colspan="6"><div class="picker-cab">
      <label for="busqueda">Buscar en biblioteca y USDA (español o inglés, o un ID)<input id="busqueda" autocomplete="off" value="${esc(f.nombre)}" data-fila="${i}"></label>
      ${tiene ? `<button class="btn mini" data-quitar="${i}">Quitar elección</button>` : ""}
      <button class="btn mini sec" data-cerrar="1">Cerrar</button></div>
      <ul id="candidatos" class="candidatos"></ul></td></tr>`;
  }

  function pintarCandidatos(texto) {
    const lista = $("#candidatos");
    if (!lista) return;
    const n = C.normalizar(texto);
    const bib = n
      ? todas()
          .filter((e) =>
            [e.nombre, ...(e.alias || [])].some((a) =>
              C.normalizar(a).includes(n),
            ),
          )
          .slice(0, 6)
      : [];
    const usda = C.buscarUSDA(window.USDA, texto, 15);
    let h = bib
      .map(
        (e) =>
          `<li><button data-bib="${esc(e.nombre)}"><span class="base">Biblioteca</span><span>${esc(e.nombre)}${e.fdc ? ` <span class="id">${esc(e.fdc)}</span>` : ""}</span>${chip(e.estado)}</button></li>`,
      )
      .join("");
    h += usda
      .map(
        (u) =>
          `<li><button data-fdc="${u.fdc}"><span class="base">${u.base}</span><span>${esc(u.desc)}</span><span class="id">${u.fdc}</span></button></li>`,
      )
      .join("");
    lista.innerHTML =
      h ||
      `<li class="suave" style="padding:8px 4px">Sin resultados. Prueba con otra palabra o en inglés.</li>`;
  }

  function pintarLab() {
    $("#lab").innerHTML = LAB_CLAVES.map((k) => {
      const v = st.lab[k];
      const txt = C.esNumero(v)
        ? String(Math.round(v * 1e4) / 1e4).replace(".", ",")
        : v === "nd"
          ? "nd"
          : "";
      const [, nombre, unidad] = C.PARAMS.find((p) => p[0] === k);
      return `<label for="lab-${k}">${esc(nombre)} (${unidad})<input id="lab-${k}" data-lab="${k}" inputmode="decimal" value="${txt}" autocomplete="off"><small>${esc(st.origenLab[k] || "")}</small></label>`;
    }).join("");
  }

  function barra(d) {
    const clase =
      Math.abs(d) <= 10 ? "v-ok" : Math.abs(d) <= 25 ? "v-warn" : "v-crit";
    const w = Math.min(Math.abs(d), 100) / 2;
    const izq = d < 0 ? 50 - w : 50;
    const signo = d > 0 ? "+" : d < 0 ? "−" : "";
    return `<div class="dev ${clase}"><span class="bar"><i style="left:${izq}%;width:${w}%"></i></span><span class="pct">${signo}${num(Math.abs(d), 1)} %</span></div>`;
  }

  function pintarResultado(fs, res) {
    const P = res.practico;
    $("#resumen").textContent = C.esNumero(P.hum)
      ? `Humedad teórica de la mezcla ${num(res.teorico.hum, 2)} % · medida ${num(P.hum, 2)} % · factor de ajuste de sólidos k = ${num(res.kHum, 4)}`
      : "Sin humedad medida: el teórico no se ajusta.";
    let h = `<thead><tr><th>Parámetro /100 g</th><th class="num">Teórico mezcla</th><th class="num">Ajustado a humedad</th><th class="num">Práctico</th><th class="num">Diferencia</th><th class="num">Fórmula con dato</th></tr></thead><tbody>`;
    for (const [k, nombre, unidad] of C.PARAMS) {
      const p = P[k];
      const grupo = k === "cho" || k === "col" ? ' class="grp"' : "";
      h += `<tr${grupo}><td>${esc(nombre)}, ${unidad}</td><td class="num">${num(res.teorico[k], dec(res.teorico[k]))}</td>
        <td class="num">${num(res.ajustado[k], dec(res.ajustado[k]))}</td>
        <td class="num">${C.esNumero(p) ? num(p, dec(p)) : p === "nd" ? "nd" : '<span class="suave">—</span>'}</td>
        <td>${k in res.dif ? barra(res.dif[k]) : ""}</td>
        <td class="num ${res.cubierto[k] < res.total - 0.01 ? "" : "suave"}">${num(res.cubierto[k], 1)} %</td></tr>`;
    }
    $("#t-resultado").innerHTML = h + "</tbody>";

    let t = `<thead><tr><th>Ingrediente</th><th class="num">%</th><th>Estado</th><th>Fuente usada</th><th>Completado con</th><th>Sin dato</th></tr></thead><tbody>`;
    for (const f of fs) {
      const comp = (f.complementos || [])
        .map(
          (c) =>
            `${esc(C.NOMBRE[c.clave])} ← <span class="id">${c.fdc}</span> <span class="suave">${esc(c.desc.slice(0, 50))}</span>`,
        )
        .join("<br>");
      const faltan = f.perfil
        ? C.PARAMS.filter(([k]) => !(k in f.perfil))
            .map((p) => p[1])
            .join(", ")
        : "Todos";
      t += `<tr><td>${esc(f.nombre)}</td><td class="num">${num(f.pct, 2)}</td><td>${chip(f.estado)}</td>
        <td>${esc(f.fuente || "—")}${f.nota ? `<br><span class="suave">${esc(f.nota)}</span>` : ""}</td>
        <td>${comp || '<span class="suave">—</span>'}</td><td class="suave">${esc(faltan || "—")}</td></tr>`;
    }
    $("#t-fuentes").innerHTML = t + "</tbody>";
  }

  function pintarBibliotecas() {
    $("#info-bib").textContent =
      `Pública: ${window.BIBLIOTECA.length} ingredientes. Privada: ${st.privada.length ? st.privada.length + " ingredientes cargados" : "sin cargar"}. Elecciones guardadas: ${Object.keys(st.elecciones).length}.`;
  }

  function recalcular() {
    const fs = filas();
    const res = C.calcular(fs, st.lab);
    st.ultimo = { fs, res };
    pintarFormula(fs);
    pintarResultado(fs, res);
    pintarBibliotecas();
  }

  function leerR07() {
    if (!st.r07) return;
    const cons = $("#consecutivo").value.trim();
    if (!cons) {
      $("#info-r07").textContent =
        `${st.r07nombre} cargado. Escribe el consecutivo para leer sus resultados.`;
      return;
    }
    const { lab, origen } = C.leerR07(XLSX, st.r07, cons);
    st.lab = lab;
    st.origenLab = origen;
    const n = Object.keys(lab).length;
    $("#info-r07").textContent = n
      ? `${st.r07nombre}: ${n} resultados del consecutivo ${cons}. Los minerales son la transcripción del informe subcontratado.`
      : `${st.r07nombre}: el consecutivo ${cons} no aparece en las hojas de resultados.`;
    pintarLab();
    recalcular();
  }

  function descargar(nombre, datos, tipo) {
    const url = URL.createObjectURL(new Blob([datos], { type: tipo }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: nombre,
    });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  $("#leer").addEventListener("click", () => {
    st.formula = leerPegado($("#pegado").value);
    st.abierto = null;
    $("#aviso-ejemplo").hidden = true;
    recalcular();
  });

  $("#t-formula").addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.elegir !== undefined) {
      const i = Number(b.dataset.elegir);
      st.abierto = st.abierto === i ? null : i;
    } else if (b.dataset.cerrar) {
      st.abierto = null;
    } else if (b.dataset.quitar !== undefined) {
      delete st.elecciones[
        C.normalizar(st.formula[Number(b.dataset.quitar)].nombre)
      ];
      guardado.escribir("elecciones", st.elecciones);
      st.abierto = null;
    } else if (b.dataset.fdc || b.dataset.bib) {
      const f = st.formula[st.abierto];
      st.elecciones[C.normalizar(f.nombre)] = b.dataset.fdc
        ? { nombre: f.nombre, fdc: b.dataset.fdc }
        : { nombre: f.nombre, bib: b.dataset.bib };
      guardado.escribir("elecciones", st.elecciones);
      st.abierto = null;
    } else return;
    recalcular();
  });

  let espera;
  $("#t-formula").addEventListener("input", (ev) => {
    if (ev.target.id !== "busqueda") return;
    clearTimeout(espera);
    espera = setTimeout(() => pintarCandidatos(ev.target.value), 150);
  });

  $("#lab").addEventListener("input", (ev) => {
    const k = ev.target.dataset.lab;
    if (!k) return;
    const t = ev.target.value.trim();
    if (!t) delete st.lab[k];
    else st.lab[k] = /^nd$/i.test(t) ? "nd" : leerNumero(t);
    if (st.lab[k] === null) delete st.lab[k];
    st.origenLab[k] = t ? "Escrito a mano" : "";
    ev.target.nextElementSibling.textContent = st.origenLab[k];
    const res = C.calcular(st.ultimo.fs, st.lab);
    st.ultimo.res = res;
    pintarResultado(st.ultimo.fs, res);
  });

  $("#consecutivo").addEventListener("change", leerR07);

  $("#archivo-r07").addEventListener("change", async (ev) => {
    const archivo = ev.target.files[0];
    if (!archivo) return;
    $("#info-r07").textContent = `Leyendo ${archivo.name}…`;
    try {
      st.r07 = XLSX.read(await archivo.arrayBuffer(), {
        type: "array",
        cellFormula: false,
        cellHTML: false,
        cellText: false,
      });
      st.r07nombre = archivo.name;
      leerR07();
    } catch (e) {
      $("#info-r07").textContent =
        `No se pudo leer ${archivo.name}: ${e.message}`;
    }
    ev.target.value = "";
  });

  $("#archivo-privada").addEventListener("change", async (ev) => {
    const archivo = ev.target.files[0];
    if (!archivo) return;
    try {
      const datos = JSON.parse(await archivo.text());
      if (!Array.isArray(datos))
        throw new Error("el archivo debe ser una lista de ingredientes");
      st.privada = datos;
      guardado.escribir("bibliotecaPrivada", datos);
      cache.clear();
      recalcular();
    } catch (e) {
      $("#info-bib").textContent =
        `No se pudo cargar ${archivo.name}: ${e.message}`;
    }
    ev.target.value = "";
  });

  $("#quitar-privada").addEventListener("click", () => {
    st.privada = [];
    guardado.escribir("bibliotecaPrivada", []);
    cache.clear();
    recalcular();
  });

  $("#bajar-privada").addEventListener("click", () => {
    const nombres = new Set(st.privada.map((e) => C.normalizar(e.nombre)));
    const nuevas = Object.values(st.elecciones)
      .filter((e) => e.fdc && !nombres.has(C.normalizar(e.nombre)))
      .map((e) => ({
        nombre: e.nombre,
        alias: [],
        tipo: "usda",
        fdc: e.fdc,
        estado: "elegido",
        nota: "Elegido en la herramienta",
      }));
    descargar(
      "biblioteca_privada.json",
      JSON.stringify([...st.privada, ...nuevas], null, 2),
      "application/json",
    );
  });

  $("#descargar").addEventListener("click", async () => {
    const b = $("#descargar");
    b.disabled = true;
    try {
      const { fs, res } = st.ultimo;
      const cons = $("#consecutivo").value.trim();
      const buf = await ExcelTN.construirExcel(ExcelJS, {
        producto: $("#producto").value.trim(),
        consecutivo: cons,
        porcion: leerNumero($("#porcion").value) || 100,
        filas: fs,
        res,
        origenLab: st.origenLab,
      });
      descargar(
        `${cons || "formulacion"}_calculo_TN.xlsx`,
        buf,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    } finally {
      b.disabled = false;
    }
  });

  $("#pie").textContent =
    `Datos: USDA FoodData Central (${window.USDA.versiones.join(", ")}; dominio público CC0). Biblioteca pública: solo ingredientes genéricos. Fichas técnicas y formulaciones nunca salen de este navegador.`;
  $("#pegado").value = EJEMPLO;
  st.formula = leerPegado(EJEMPLO);
  $("#aviso-ejemplo").hidden = false;
  pintarLab();
  recalcular();
})();
