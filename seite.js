const http = require("http");
const kaffees = require("./kaffees");

const port = process.env.PORT || 3000;
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
}).listen(port);
