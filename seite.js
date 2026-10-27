const http = require("http");
const fs = require("fs");

let roh = fs.readFileSync("kaffees.csv", "latin1").replace(/^\uFEFF/, "");
const zeilen = roh.trim().split(/\r?\n/);

function parseZeile(zeile) {
  const felder = [];
  let feld = "", inAnfuehrung = false;
  for (let i = 0; i < zeile.length; i++) {
    const c = zeile[i];
    if (c === '"') {
      if (inAnfuehrung && zeile[i + 1] === '"') { feld += '"'; i++; }
      else inAnfuehrung = !inAnfuehrung;
    } else if (c === ";" && !inAnfuehrung) {
      felder.push(feld); feld = "";
    } else {
      feld += c;
    }
  }
  felder.push(feld);
  return felder;
}

const header = parseZeile(zeilen[0]);
const kaffees = zeilen.slice(1).map(zeile => {
  const werte = parseZeile(zeile);
  const obj = {};
  header.forEach((h, i) => obj[h] = werte[i]);
  return obj;
});

function spalte(obj, suchwort) {
  for (const name of Object.keys(obj)) {
    if (name.includes(suchwort)) return obj[name];
  }
  return null;
}

function zahl(text) {
  if (!text) return null;
  const n = parseFloat(text.replace(/\s*€/g, "").replace(/\s*g/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

for (const k of kaffees) {
  k.kilo = zahl(spalte(k, "Preis je kg"));
  k.gewicht = zahl(spalte(k, "Packungsgröße"));
  k.preis = zahl(spalte(k, "Preis ("));
  k.roesterei = spalte(k, "Rösterei") || "";
  k.produkt = k["Produkt"] || "";
  k.herkunft = k["Herkunft"] || "";
  k.verfuegbar = spalte(k, "Verfügbarkeit") || "";
}

const liste = kaffees.filter(k => k.kilo !== null);
liste.sort((a, b) => a.kilo - b.kilo);

// Röstereien für das Dropdown sammeln (doppelfreie, sortierte Liste)
const roestereien = [...new Set(liste.map(k => k.roesterei))].sort();
const optionen = roestereien.map(r => `<option value="${r}">${r}</option>`).join("");

let zeilenHtml = "";
for (const k of liste) {
  zeilenHtml += "<tr>"
    + "<td>" + k.kilo.toFixed(2) + " €</td>"
    + "<td>" + k.roesterei + "</td>"
    + "<td>" + k.produkt + "</td>"
    + "<td>" + k.herkunft + "</td>"
    + "<td>" + k.verfuegbar + "</td>"
    + "</tr>";
}

const html = `
  <h1>Kaffee sortiert nach €/kg</h1>
  <p><span id="anzahl">${liste.length}</span> Kaffees</p>
  <div style="margin-bottom:12px">
    <input id="suche" type="text" placeholder="Suchen (Produkt, Herkunft...)" style="padding:6px">
    <select id="roesterei" style="padding:6px">
      <option value="">Alle Röstereien</option>
      ${optionen}
    </select>
    <select id="verfuegbarkeit" style="padding:6px">
      <option value="">Alle</option>
      <option value="verfügbar">Nur verfügbare</option>
    </select>
  </div>
  <table border="1" cellpadding="8" cellspacing="0" id="tabelle">
    <tr><th>€/kg</th><th>Rösterei</th><th>Produkt</th><th>Herkunft</th><th>Verfügbarkeit</th></tr>
    ${zeilenHtml}
  </table>
  <script>
    const suche = document.getElementById("suche");
    const roesterei = document.getElementById("roesterei");
    const verfuegbarkeit = document.getElementById("verfuegbarkeit");
    const anzahl = document.getElementById("anzahl");
    const zeilen = [...document.querySelectorAll("#tabelle tr")].slice(1);

    function filtern() {
      const s = suche.value.toLowerCase();
      const r = roesterei.value;
      const v = verfuegbarkeit.value;
      let sichtbar = 0;
      for (const z of zeilen) {
        const zellen = z.querySelectorAll("td");
        const text = z.textContent.toLowerCase();
        const passtSuche = text.includes(s);
        const passtRoesterei = !r || zellen[1].textContent === r;
        const passtVerf = !v || zellen[4].textContent.includes(v);
        const zeigen = passtSuche && passtRoesterei && passtVerf;
        z.style.display = zeigen ? "" : "none";
        if (zeigen) sichtbar++;
      }
      anzahl.textContent = sichtbar;
    }

    suche.addEventListener("input", filtern);
    roesterei.addEventListener("change", filtern);
    verfuegbarkeit.addEventListener("change", filtern);
  </script>
`;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(process.env.PORT || 3000);
