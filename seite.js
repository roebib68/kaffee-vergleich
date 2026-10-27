const http = require("http");

const kaffees = [
  { name: "Latin Grande",  roesterei: "Tchibo",         herkunft: "Brasilien", roestgrad: "dunkel", roestdatum: "2026-05-01", gewicht: 500,  preis: 8.95 },
  { name: "Espresso",      roesterei: "Happy Coffee",   herkunft: "Äthiopien", roestgrad: "mittel", roestdatum: "2026-10-10", gewicht: 1000, preis: 17.90 },
  { name: "Bio Filter",    roesterei: "Bohnenreich",    herkunft: "Kolumbien", roestgrad: "hell",   roestdatum: "2026-10-18", gewicht: 250,  preis: 7.50 },
  { name: "Espresso D.",   roesterei: "MyCoffeeDealer", herkunft: "unbekannt", roestgrad: "dunkel", roestdatum: "unbekannt",  gewicht: 1000, preis: 24.90 },
  { name: "Passalacqua",   roesterei: "Passalacqua",    herkunft: "Blend",     roestgrad: "dunkel", roestdatum: "unbekannt",  gewicht: 1000, preis: 29.00 },
];

const heute = new Date("2026-10-27");

for (const k of kaffees) {
  k.kiloPreis = k.preis / (k.gewicht / 1000);
  if (k.roestdatum !== "unbekannt") {
    const tage = Math.round((heute - new Date(k.roestdatum)) / 86400000);
    k.frisch = tage <= 28 ? "frisch" : "alt";
  } else {
    k.frisch = "???";
  }
}

kaffees.sort((a, b) => a.kiloPreis - b.kiloPreis);

let zeilen = "";
for (const k of kaffees) {
  zeilen += "<tr>"
    + "<td>" + k.kiloPreis.toFixed(2) + " €</td>"
    + "<td>" + k.roesterei + "</td>"
    + "<td>" + k.herkunft + "</td>"
    + "<td>" + k.roestgrad + "</td>"
    + "<td>" + k.frisch + "</td>"
    + "</tr>";
}

const html = `
  <h1>Kaffee sortiert nach €/kg</h1>
  <table border="1" cellpadding="8" cellspacing="0">
    <tr><th>€/kg</th><th>Rösterei</th><th>Herkunft</th><th>Röstgrad</th><th>Frische</th></tr>
    ${zeilen}
  </table>
`;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(3000);

console.log("Seite läuft. Öffne: http://localhost:3000");