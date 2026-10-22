// Gera assets/mapa-dots.json: pontos de terra numa grade (mapa pontilhado)
import { readFileSync, writeFileSync } from "node:fs";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";

const out = process.argv[2];
const topo = JSON.parse(readFileSync(new URL("./node_modules/world-atlas/land-110m.json", import.meta.url)));
const land = feature(topo, topo.objects.land);
const step = 2.4;
const dots = [];
for (let lat = 78; lat >= -58; lat -= step) {
  for (let lon = -170; lon <= 180; lon += step) {
    if (geoContains(land, [lon, lat])) dots.push([+lon.toFixed(1), +lat.toFixed(1)]);
  }
}
writeFileSync(out, JSON.stringify(dots));
console.log(dots.length, "pontos");
