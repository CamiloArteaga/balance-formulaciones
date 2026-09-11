"""Genera datos/usda.js a partir de los CSV de FoodData Central (SR Legacy + Foundation).

Uso: python scripts/generar_usda.py <carpeta con los CSV descomprimidos>
"""
import csv, glob, json, os, sys

csv.field_size_limit(10**9)
FDC = sys.argv[1]
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datos", "usda.js")

PARAMS = [  # clave, IDs de nutriente FDC en orden de preferencia, factor de unidad
    ("hum", ["1051"], 1), ("n", ["1002"], 1), ("prot", ["1003"], 1), ("grasa", ["1004"], 1),
    ("sat", ["1258"], 1), ("trans", ["1257"], 1000), ("azt", ["2000", "1063"], 1), ("aza", ["1235"], 1),
    ("fib", ["1079"], 1), ("cen", ["1007"], 1), ("cho", ["1005"], 1), ("vita", ["1106", "1105"], 1),
    ("vitd", ["1114"], 1), ("vitc", ["1162"], 1), ("col", ["1253"], 1), ("na", ["1093"], 1),
    ("k", ["1092"], 1), ("ca", ["1087"], 1), ("zn", ["1095"], 1), ("fe", ["1089"], 1),
    ("cu", ["1098"], 1), ("mg", ["1090"], 1), ("mn", ["1101"], 1),
]
BASES = [("FoodData_Central_sr_legacy_food_csv_*", "sr_legacy_food", "SR Legacy"),
         ("FoodData_Central_foundation_food_csv_*", "foundation_food", "Foundation")]

alimentos, versiones = {}, []
for patron, tipo, rotulo in BASES:
    carpeta = sorted(c for c in glob.glob(os.path.join(FDC, patron)) if os.path.isdir(c))[-1]
    versiones.append(f"{rotulo} {carpeta.rsplit('_', 1)[-1]}")
    raiz = glob.glob(os.path.join(carpeta, "*", ""))[0]
    propios = {}
    for r in csv.DictReader(open(raiz + "food.csv", encoding="utf-8")):
        if r["data_type"] == tipo:
            propios[r["fdc_id"]] = {"d": r["description"], "c": r["food_category_id"], "b": rotulo, "v": {}}
    for r in csv.DictReader(open(raiz + "food_nutrient.csv", encoding="utf-8")):
        if r["fdc_id"] in propios and r["amount"] != "":
            propios[r["fdc_id"]]["v"][r["nutrient_id"]] = float(r["amount"])
    conv = {r["id"]: r["fdc_id"] for r in csv.DictReader(open(raiz + "food_nutrient_conversion_factor.csv", encoding="utf-8"))}
    for r in csv.DictReader(open(raiz + "food_protein_conversion_factor.csv", encoding="utf-8")):
        fid = conv.get(r["food_nutrient_conversion_factor_id"])
        if fid in propios and r["value"] and float(r["value"]) > 0:
            propios[fid]["fn"] = float(r["value"])
    alimentos.update(propios)

salida = {}
for fid, a in alimentos.items():
    valores, alternos = [], {}
    for clave, ids, f in PARAMS:
        i = next((i for i in ids if i in a["v"]), None)
        valores.append(None if i is None else round(a["v"][i] * f, 4))
        if i is not None and i != ids[0]:
            alternos[clave] = i
    fila = [a["d"], a["c"], a["b"], a.get("fn", 6.25), valores]
    if alternos:
        fila.append(alternos)
    salida[fid] = fila

datos = {"versiones": versiones, "claves": [p[0] for p in PARAMS], "ids": {p[0]: p[1] for p in PARAMS},
         "alimentos": salida}
with open(SALIDA, "w", encoding="utf-8") as fh:
    fh.write("window.USDA = ")
    json.dump(datos, fh, ensure_ascii=False, separators=(",", ":"))
    fh.write(";\n")
print(len(salida), "alimentos |", ", ".join(versiones), "|", round(os.path.getsize(SALIDA) / 1e6, 2), "MB")
