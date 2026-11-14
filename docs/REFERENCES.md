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
| OpenFreeMap (Positron style) | Map tiles | https://openfreemap.org | Base map, no key needed | Free to use with attribution; VERIFY terms before submission. Not used since 14 Nov (decision 39) |
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
| NASA FIRMS Fire Map (live) | NASA tool, linked | https://firms.modaps.eosdis.nasa.gov/map/ | "Fires burning now" link for the selected area; our app is a historical record | NASA open data |
| Figtree (variable), via @fontsource-variable/figtree 5.3.0 | Font | https://fonts.google.com/specimen/Figtree | App text | SIL Open Font License 1.1; bundled with the app, no request to Google. Not used since 14 Nov (decision 39) |
| Instrument Serif (italic), via @fontsource/instrument-serif 5.3.0 | Font | https://fonts.google.com/specimen/Instrument+Serif | Headline accent | SIL Open Font License 1.1; bundled. Not used since 14 Nov (decision 39) |
| JetBrains Mono (variable), via @fontsource-variable/jetbrains-mono 5.3.0 | Font | https://www.jetbrains.com/lp/mono/ | Numbers and labels | SIL Open Font License 1.1; bundled. Not used since 14 Nov (decision 39) |
| OpenFreeMap "dark" style | Map tiles | https://openfreemap.org | Base map in the dark theme (Positron stays for light) | Free with attribution; VERIFY terms before submission. Not used since 14 Nov (decision 39) |
| NASA MYD14A1 Collection 6.1, Aqua daily 1 km fire mask | NASA data | https://doi.org/10.5067/MODIS/MYD14A1.061 | Clear-view days per cell and month (`obs`) | NASA open data |
| Sofiev, M. and Kouznetsov, R. (2026): Observation operator and detection limits for MODIS and VIIRS Fire Radiative Power products, Geosci. Model Dev., 19, 10123–10142 | Paper (peer-reviewed, open access) | https://doi.org/10.5194/gmd-19-10123-2026 | Check C5: published MODIS detection limits (5.7 MW day, 3.7 MW night at nadir; linear in pixel area, Table 1) | CC BY 4.0 |
| Balwinder-Singh, McDonald, A. J., Srivastava, A. K. and Gerard, B. (2019): Tradeoffs between groundwater conservation and air pollution from agricultural fires in northwest India, Nature Sustainability, 2, 580–583 | Paper (peer-reviewed) | Full text: https://www.iamrenew.com/wp-content/uploads/2019/08/Tradeoffs-between-groundwater-conservation-and-air-pollution-from-agricultural-fires-in-northwest-India.pdf ; summary: https://news.cornell.edu/stories/2019/07/groundwater-policies-fire-air-pollution-northwest-india | Check C7: Punjab peak burning day moved from 24 Oct to 4 Nov after the 2009 laws. DOI UNVERIFIED | Journal terms |
| Python 3.14, DuckDB, pandas, pyarrow, NumPy, SciPy, scikit-learn, matplotlib, pytest | Libraries (pipeline) | https://pypi.org | Cleaning, harmonization, statistics, figures, tests (`pipeline/requirements.txt`) | MIT, BSD or Apache 2.0 |
| earthaccess, pyhdf | Libraries (pipeline) | https://github.com/nsidc/earthaccess ; https://github.com/fhs/pyhdf | Searching and downloading NASA data; reading HDF4 fire masks | MIT |
| NASA LANCE user group briefing on MODIS orbit drift (Giglio, May 2025) | Presentation | https://landweb.modaps.eosdis.nasa.gov/data/filePost/LANCE_UWG_Orbit_Drift_Giglio_202505.pdf | Context for the overpass drift we measured | NASA |
| NASA GIBS, Blue Marble Shaded Relief and Bathymetry (WMTS, EPSG:3857) | Satellite imagery tiles | https://gibs.earthdata.nasa.gov | Base map of the app from decision 39, no key | NASA imagery, free to use; credit NASA GIBS. VERIFY the GIBS citation wording |
| NASA Blue Marble (Visible Earth), via three-globe 2.31.1 example image | Satellite image | https://www.npmjs.com/package/three-globe | Globe pictures in the design mockup only (not in the app) | NASA imagery is public domain; three-globe is MIT |
| Natural Earth 110 m land, via world-atlas 2.0.2 | Map data | https://github.com/topojson/world-atlas | Coastlines in an early mockup only (not in the app) | Public domain |
