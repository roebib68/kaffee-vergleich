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
  k.roesterei = spalte(k, "Rösterei") || "";
  k.produkt = k["Produkt"] || "";
  k.herkunft = k["Herkunft"] || "";
  k.verfuegbar = spalte(k, "Verfügbarkeit") || "";
}

const liste = kaffees.filter(k => k.kilo !== null);
liste.sort((a, b) => a.kilo - b.kilo);

const LAENDER = {
  "Indonesien": ["sumatra", "gayo", "aceh"],
  "Costa Rica": ["tarraz"],
  "Äthiopien": ["äthiopien", "aethiopien", "sidamo", "yirgacheffe", "guji", "gera", "refisa", "gedeo"],
  "El Salvador": ["el salvador", "apaneca"],
  "Kenia": ["kenia", "nyeri", "kainyogu", "thunguri"],
  "Kolumbien": ["kolumbien", "huila", "cauca", "quind", "popay"],
  "Brasilien": ["brasilien", "cerrado", "minas"],
  "Ecuador": ["ecuador", "waylla"],
  "Honduras": ["honduras", "cop", "lapaz", "la paz", "aprocomsa"],
  "Nicaragua": ["nicaragua", "dipilto"],
  "Guatemala": ["guatemala", "cob"],
  "Nepal": ["nepal", "gauribesi"],
  "Uganda": ["uganda", "bugisu", "elgon"],
  "Ruanda": ["ruanda", "muzo"],
  "Myanmar": ["myanmar"],
  "Peru": ["peru"],
  "Indien": ["indien"]
};

function landVon(k) {
  const h = k.herkunft.toLowerCase();
  const gefunden = [];
  for (const [land, woerter] of Object.entries(LAENDER)) {
    if (woerter.some(w => h.includes(w))) gefunden.push(land);
  }
  return gefunden;
}

const laender = {};
for (const k of liste) {
  for (const land of landVon(k)) {
    if (!laender[land] || k.kilo < laender[land].kilo) {
      laender[land] = { kilo: k.kilo, produkt: k.produkt, roesterei: k.roesterei };
    }
  }
}
const laenderHtml = Object.entries(laender)
  .sort((a, b) => a[1].kilo - b[1].kilo)
  .map(([land, info]) =>
    `<tr><td>${land}</td><td>${info.kilo.toFixed(2)} €</td>`
    + `<td>${info.roesterei}</td><td>${info.produkt}</td></tr>`)
  .join("");

const roestereien = [...new Set(liste.map(k => k.roesterei))].sort();
const optionen = roestereien.map(r => `<option value="${r}">${r}</option>`).join("");

let zeilenHtml = "";
for (const k of liste) {
  zeilenHtml += "<tr>"
    + "<td class='preis'>" + k.kilo.toFixed(2) + " €</td>"
    + "<td>" + k.roesterei + "</td>"
    + "<td>" + k.produkt + "</td>"
    + "<td>" + k.herkunft + "</td>"
    + "<td><span class='badge " + (k.verfuegbar.includes("verfügbar") ? "ok" : "out") + "'>" + k.verfuegbar + "</span></td>"
    + "</tr>";
}

const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kaffee-Vergleich</title>
<style>
  :root {
    /* >>> HIER deine 3 exakten Farben eintragen <<< */
    --bg: #0d2818;        /* dunkelgrüner Hintergrund */
    --text: #b6f0c2;      /* helle grüne Schrift */
    --gold: #d4af37;      /* goldene Rahmen */
    --panel: #10301f;     /* etwas helleres Grün für Flächen */
    --line: rgba(212,175,55,.35);
  }
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    margin: 0; background: var(--bg); color: var(--text); line-height: 1.5;
  }
  header {
    background: var(--panel); border-bottom: 2px solid var(--gold);
    padding: 32px 20px; text-align: center;
  }
  header h1 { margin: 0; font-size: 1.8rem; color: var(--gold); }
  header p { margin: 6px 0 0; opacity: .8; }
  main { max-width: 1000px; margin: 0 auto; padding: 24px 16px 60px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
  .toolbar input, .toolbar select {
    padding: 9px 12px; border: 1px solid var(--gold); border-radius: 8px;
    font-size: .95rem; background: var(--panel); color: var(--text);
  }
  .toolbar input { flex: 1 1 220px; }
  .card {
    background: var(--panel); border: 1px solid var(--gold); border-radius: 12px;
    overflow: hidden; margin-bottom: 36px;
  }
  table { width: 100%; border-collapse: collapse; font-size: .92rem; }
  th, td { padding: 11px 14px; text-align: left; border-bottom: 1px solid var(--line); }
  thead th {
    background: rgba(212,175,55,.12); color: var(--gold); cursor: pointer;
    user-select: none; position: sticky; top: 0; white-space: nowrap;
  }
  thead th:hover { background: rgba(212,175,55,.22); }
  tbody tr:hover { background: rgba(212,175,55,.08); }
  .preis { font-weight: 600; color: var(--gold); white-space: nowrap; }
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 999px;
    font-size: .78rem; font-weight: 600; white-space: nowrap;
  }
  .badge.ok { background: rgba(120,220,140,.18); color: #8fe3a3; border: 1px solid #8fe3a3; }
  .badge.out { background: rgba(230,120,120,.15); color: #e89a9a; border: 1px solid #e89a9a; }
  h2 { color: var(--gold); margin: 0 0 14px; font-size: 1.25rem; }
  .count { color: var(--text); font-weight: 600; margin: 0 0 14px; }
  .scroll { overflow-x: auto; }
  footer { text-align: center; opacity: .6; font-size: .8rem; padding: 20px; }
  .more-tools {
    display: inline-flex; align-items: center; gap: 8px;
    margin: 8px auto 0; padding: 12px 20px;
    border: 1px solid var(--gold); border-radius: 10px;
    background: var(--panel); color: var(--gold);
    font-weight: 700; text-decoration: none;
  }
  .more-tools:hover, .more-tools:focus, .more-tools:focus-visible {
    background: rgba(212,175,55,.12); outline: 2px solid var(--gold); outline-offset: 2px;
  }
  .more-tools .go { color: var(--text); }
  .site-footer {
    text-align: center; padding: 28px 16px 40px;
    border-top: 1px solid var(--line); margin-top: 8px;
    font-size: .82rem; opacity: .85;
  }
  .footer-links { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 10px; }
  .footer-links a { color: var(--gold); text-decoration: none; }
  .footer-links a:hover, .footer-links a:focus, .footer-links a:focus-visible { text-decoration: underline; outline: none; }
  .footer-sep { color: var(--text); opacity: .5; }
  .footer-copy { margin: 4px 0 0; }
</style>
</head>
<body>
<header>
  <h1>☕ Kaffee-Vergleich</h1>
  <p>Sortiert nach Preis pro Kilogramm</p>
</header>
<main>
  <p class="count"><span id="anzahl">${liste.length}</span> Kaffees</p>
  <div class="toolbar">
    <input id="suche" type="text" placeholder="Suchen (Produkt, Herkunft...)">
    <select id="roesterei">
      <option value="">Alle Röstereien</option>
      ${optionen}
    </select>
    <select id="verfuegbarkeit">
      <option value="">Alle</option>
      <option value="verfügbar">Nur verfügbare</option>
    </select>
  </div>
  <div class="card scroll">
    <table id="tabelle">
      <thead>
        <tr>
          <th class="sortierbar" data-sp="0">€/kg ⇅</th>
          <th class="sortierbar" data-sp="1">Rösterei ⇅</th>
          <th class="sortierbar" data-sp="2">Produkt ⇅</th>
          <th class="sortierbar" data-sp="3">Herkunft ⇅</th>
          <th class="sortierbar" data-sp="4">Verfügbarkeit ⇅</th>
        </tr>
      </thead>
      <tbody>${zeilenHtml}</tbody>
    </table>
  </div>

  <h2>Günstigster Kaffee je Land</h2>
  <div class="card scroll">
    <table>
      <thead><tr><th>Land</th><th>günstigster €/kg</th><th>Rösterei</th><th>Produkt</th></tr></thead>
      <tbody>${laenderHtml}</tbody>
    </table>
  </div>
</main>
<div style="text-align:center">
  <a class="more-tools" href="https://nuetzlicheundkleinetools.de/">Tools die es auch noch gibt <span class="go">↗</span></a>
</div>
<footer class="site-footer">
  <div class="footer-links">
    <a href="https://nuetzlicheundkleinetools.de/impressum.html">Impressum</a>
    <span class="footer-sep">·</span>
    <a href="https://nuetzlicheundkleinetools.de/datenschutz.html">Datenschutz</a>
    <span class="footer-sep">·</span>
    <a href="https://nuetzlicheundkleinetools.de/nutzungsbedingungen.html">Nutzungsbedingungen</a>
    <span class="footer-sep">·</span>
    <a href="https://nuetzlicheundkleinetools.de/hinweise.html">Hinweise</a>
  </div>
  <p class="footer-copy">© 2026 nuetzlicheundkleinetools.de</p>
  <p class="footer-copy">Weitere Tools folgen bald</p>
</footer>
<script>
  const suche = document.getElementById("suche");
  const roesterei = document.getElementById("roesterei");
  const verfuegbarkeit = document.getElementById("verfuegbarkeit");
  const anzahl = document.getElementById("anzahl");
  const tabelle = document.getElementById("tabelle");
  const tbody = tabelle.querySelector("tbody");
  let zeilen = [...tbody.querySelectorAll("tr")];

  function filtern() {
    const s = suche.value.toLowerCase();
    const r = roesterei.value;
    const v = verfuegbarkeit.value;
    let sichtbar = 0;
    for (const z of zeilen) {
      const zellen = z.querySelectorAll("td");
      const zeigt = z.textContent.toLowerCase().includes(s)
        && (!r || zellen[1].textContent === r)
        && (!v || zellen[4].textContent.includes(v));
      z.style.display = zeigt ? "" : "none";
      if (zeigt) sichtbar++;
    }
    anzahl.textContent = sichtbar;
  }

  let aufsteigend = true;
  let letzteSpalte = -1;
  document.querySelectorAll(".sortierbar").forEach(th => {
    th.addEventListener("click", () => {
      const sp = +th.dataset.sp;
      if (sp === letzteSpalte) aufsteigend = !aufsteigend;
      else { aufsteigend = true; letzteSpalte = sp; }
      zeilen.sort((a, b) => {
        const ta = a.querySelectorAll("td")[sp].textContent.trim();
        const tb = b.querySelectorAll("td")[sp].textContent.trim();
        const za = parseFloat(ta.replace(",", "."));
        const zb = parseFloat(tb.replace(",", "."));
        let vergleich = (!isNaN(za) && !isNaN(zb)) ? za - zb : ta.localeCompare(tb);
        return aufsteigend ? vergleich : -vergleich;
      });
      zeilen.forEach(z => tbody.appendChild(z));
    });
  });

  suche.addEventListener("input", filtern);
  roesterei.addEventListener("change", filtern);
  verfuegbarkeit.addEventListener("change", filtern);
</script>
</body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(process.env.PORT || 3000);
