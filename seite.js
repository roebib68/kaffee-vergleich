const http = require("http");
const fs = require("fs");

// CSV lesen, BOM entfernen, tab- oder semikolon-getrennt
let roh = fs.readFileSync("kaffees.csv", "utf-8").replace(/^\uFEFF/, "");
const zeilen = roh.trim().split(/\r?\n/);

// Parser, der Semikolons in Anführungszeichen NICHT als Trennzeichen zählt
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

// Zahlen sauber machen: "16,40 €" -> 16.40, "250 g" -> 250
function zahl(text) {
  if (!text) return null;
  const n = parseFloat(text.replace(/\s*€/g, "").replace(/\s*g/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

for (const k of kaffees) {
  k.kilo = zahl(k["Preis je kg (€)"]);
  k.gewicht = zahl(k["Packungsgröße (g)"]);
  k.preis = zahl(k["Preis (€)"]);
}

const liste = kaffees.filter(k => k.kilo !== null);
liste.sort((a, b) => a.kilo - b.kilo);

let zeilenHtml = "";
for (const k of liste) {
  zeilenHtml += "<tr>"
    + "<td>" + k.kilo.toFixed(2) + " €</td>"
    + "<td>" + k["Rösterei"] + "</td>"
    + "<td>" + k["Produkt"] + "</td>"
    + "<td>" + k["Herkunft"] + "</td>"
    + "<td>" + k["Verfügbarkeit"] + "</td>"
    + "</tr>";
}

const html = `
  <h1>Kaffee sortiert nach €/kg</h1>
  <p>${liste.length} Kaffees</p>
  <table border="1" cellpadding="8" cellspacing="0">
    <tr><th>€/kg</th><th>Rösterei</th><th>Produkt</th><th>Herkunft</th><th>Verfügbarkeit</th></tr>
    ${zeilenHtml}
  </table>
`;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(process.env.PORT || 3000);
