# References

Every external resource used in the project goes here: data, code, libraries,
images, papers. The project page's References field is filled from this file.
Add a row when you add the resource, not at the end.

| Resource | Type | Link | Used for | Licence or terms |
|---|---|---|---|---|
| NASA FIRMS active fire data (MODIS C6.1; VIIRS 375 m) | NASA data | https://www.earthdata.nasa.gov/data/tools/firms | All fire detections | NASA open data; cite as in docs/CONTEXT.md |
| React 18.3.1 | Library (app) | https://react.dev | User interface | MIT |
| Vite 5.4.10 and @vitejs/plugin-react | Build tool (app) | https://vitejs.dev | Development server and static build | MIT |
| TypeScript 5.6.3 | Language (app) | https://www.typescriptlang.org | Typed app code and the shared interfaces | Apache 2.0 |
| Vitest 2.1.4 | Test runner (app) | https://vitest.dev | Unit tests for the data layer | MIT |
| MapLibre GL JS 4.7.1 | Library (app) | https://maplibre.org | Interactive map and area drawing | BSD 3-Clause |
| OpenFreeMap (Positron style) | Map tiles | https://openfreemap.org | Base map, no key needed | Free to use with attribution; VERIFY terms before submission |
| OpenStreetMap data | Map data | https://www.openstreetmap.org/copyright | Base map content, via OpenFreeMap | ODbL; attribution "© OpenStreetMap contributors" shown on the map |
| GitHub Pages and GitHub Actions | Hosting | https://pages.github.com | Publishing the app | GitHub terms of service |
| Observable Plot 0.6.16 | Library (app) | https://observablehq.com/plot/ | Burning calendar and the other charts (cells, tooltips, colour legend) | ISC |
| Cividis colour map, via d3-scale-chromatic | Colour scale (app) | https://github.com/d3/d3-scale-chromatic | Calendar colour ramp, readable with colour-vision deficiency. Paper: Nuñez, Anderton and Renslow (2018), PLOS ONE, doi:10.1371/journal.pone.0199239 (VERIFY the citation; not opened) | ISC (library) |
| geoBoundaries gbOpen India ADM2 (2021; source Pathways Data Pvt. Ltd., lgdirectory.gov.in) | Boundary data | https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/ | District search and outlines, Punjab and Haryana area | ODbL 1.0. Our derived `districts.json` files are offered under ODbL 1.0 too |
| geoBoundaries gbOpen India ADM1 | Boundary data | https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/ | State names in district labels | CC BY 2.5 India |
| geoBoundaries gbOpen Pakistan ADM2 and ADM1 (2019; source geoBoundaries, Wikipedia) | Boundary data | https://www.geoboundaries.org/api/current/gbOpen/PAK/ADM2/ | District search for the Pakistani part of the Punjab area | Public Domain |
| geoBoundaries gbOpen Argentina ADM2 (2020; source Instituto Geográfico Nacional, UNHCR, OCHA ROLAC) | Boundary data | https://www.geoboundaries.org/api/current/gbOpen/ARG/ADM2/ | Department search, Córdoba and Chilecito areas | CC BY 3.0 IGO |
| geoBoundaries gbOpen Argentina ADM1 | Boundary data | https://www.geoboundaries.org/api/current/gbOpen/ARG/ADM1/ | Province names in labels. We corrected the source's "La Roja" to "La Rioja" | CC BY 2.5 |
| geoBoundaries project (Runfola et al. 2020, PLoS ONE 15(4): e0231866) | Citation | https://www.geoboundaries.org | Credit for all boundary data above. VERIFY the citation before submission | |
