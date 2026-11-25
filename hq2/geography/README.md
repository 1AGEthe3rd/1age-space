# HQ2 Anacostia geography

Tiles are a renderable subset of street and building data. Local X points east and local Z points south. Local meters use an equirectangular approximation centered on MLK Avenue SE and Marion Barry Avenue SE; the Earth-to-scene origin and per-degree factors are in [index.json](index.json). Geographic footprints are sourced. Building heights, façades, lane widths, fixtures and bridge elevation are rendered estimates.

| Tile field | Data provider | Terms and processing |
| --- | --- | --- |
| `dc.buildings` | [District of Columbia OCTO, Building Footprints](https://www.arcgis.com/home/item.html?id=a657b34942564aa8b06f293cb0934cbd) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Selected footprint polygons projected, simplified and grouped into tiles. |
| `dc.surfaces` (sidewalks and crossings) | [District of Columbia OCTO, Sidewalks 2021](https://www.arcgis.com/home/item.html?id=5060cc08bc964cb9bb02ca4d43d9553a) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Projected, simplified and clipped into tiles. Hidden sidewalks omitted. |
| `dc.surfaces` (water) | [District of Columbia OCTO, Waterbodies 2021](https://www.arcgis.com/home/item.html?id=1d544196d7044aef9a0ffc809de6e60c) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Projected, simplified and clipped into tiles. |
| `osm` | [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) | The OSM-derived database in these files is distributed under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Filtered to roads, paths, parks and fixtures, projected, simplified and clipped into tiles. The DC data remains a separate CC BY 4.0 component. |

Source extraction on November 25, 2026. Keep attribution visible in rendered scenes and include this file when redistributing tiles. No endorsement is implied.

To regenerate, download the ArcGIS layer features as WGS84 GeoJSON with global IDs and descriptions. Query the Building Footprints service over `-76.997,38.8608,-76.9828,38.8759`; use object ID batches so the service record limit does not truncate the result. Query Sidewalks and Waterbodies over `-76.9968,38.861,-76.983,38.8756`. Save them as `footprints.geojson`, `sidewalks.geojson` and `water.geojson`. Save the [OSM map extract](https://api.openstreetmap.org/api/0.6/map?bbox=-76.998,38.8605,-76.982,38.878) as `streets.osm`. Run `python scripts/hq2_geography.py INPUT_DIRECTORY hq2/geography` using Shapely 2.


### Street-name signs

[intersections.json](intersections.json) records selected named junctions from the same OpenStreetMap extract under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Each record carries the source node and individual street way IDs. Scene positions use the existing projection. Post locations are selected near mapped sidewalks and away from building footprints. Blade direction follows the adjacent mapped road segment. The blades use original graphics with standard street-type abbreviations. Exact municipal post locations, face design and installation heights are approximations.

Marion Barry Avenue SE reflects the [District’s official renaming](https://code.dccouncil.gov/us/dc/council/code/sections/9-204.01). The other corridor names and connections can be checked against the [DDOT corridor study](https://mlk-ghrsafetystudy.ddot.dc.gov/) and [DC Office of Planning historic district map](https://planning.dc.gov/sites/default/files/dc/sites/op/publication/attachments/Anacostia%20Historic%20District%20Map.pdf).
