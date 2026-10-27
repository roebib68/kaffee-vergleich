// ============================================
//  HIER KOMMEN DEINE KAFFEES REIN
//  Jede Zeile = ein Kaffee.
//  Nach jeder Zeile ein Komma, außer nach der letzten.
//  roestdatum: "2026-10-10" = Jahr-Monat-Tag
//  Bei unbekanntem Datum: "unbekannt" schreiben
// ============================================

const kaffees = [
  { name: "Latin Grande",  roesterei: "Tchibo",         herkunft: "Brasilien", roestgrad: "dunkel", roestdatum: "2026-05-01", gewicht: 500,  preis: 8.95 },
  { name: "Espresso",      roesterei: "Happy Coffee",   herkunft: "Äthiopien", roestgrad: "mittel", roestdatum: "2026-10-10", gewicht: 1000, preis: 17.90 },
  { name: "Bio Filter",    roesterei: "Bohnenreich",    herkunft: "Kolumbien", roestgrad: "hell",   roestdatum: "2026-10-18", gewicht: 250,  preis: 7.50 },
  { name: "Espresso D.",   roesterei: "MyCoffeeDealer", herkunft: "unbekannt", roestgrad: "dunkel", roestdatum: "unbekannt",  gewicht: 1000, preis: 24.90 },
  { name: "Espresso",      roesterei: "Happy Coffee",   herkunft: "Äthiopien", roestgrad: "mittel", roestdatum: "2026-10-10", gewicht: 1000, preis: 17.90 },
  { name: "Passalacqua",   roesterei: "Passalacqua",    herkunft: "Blend",     roestgrad: "dunkel", roestdatum: "unbekannt",  gewicht: 1000, preis: 29.00 },
];

module.exports = kaffees;
