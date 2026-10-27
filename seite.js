const http = require("http");
const fs = require("fs");

// CSV lesen – deine Datei ist TAB-getrennt, nicht kommagetrennt
const roh = fs.readFileSync("kaffees.csv", "utf-8");
const zeilen = roh.trim().split("\n");
const header = zeilen[0].split("\t");
const kaffees = zeilen.slice(1).map(zeile => {
  const werte = zeile.split("\t");
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

// Kaffees ohne Preis aussortieren
const liste = kaffees.filter(k => k.kilo !== null);

// Sortieren nach €/kg
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
