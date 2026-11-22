# Space Build 008 — virtual observatory and North American intake

Development branch: `feature/space-geographic-008`, based on `1age-space` commit `171d427`. No production deployment, DNS change, World scene replacement, leasing activation, or payment activation.

## Virtual application

The property discovery entrance now opens a full-screen 3D observatory, with original platform architecture, pillars, stars, a central wireframe sphere, and selectable city spheres. The former standalone directory layout was replaced following founder direction. Country/city controls open from Find places. Selected places open inside the same environment as holographic information panels and original massing templates; they do not require leaving for a conventional directory page.

The official logo opens Store and Blog. Keyboard rotation, camera buttons, mouse drag, pointer selection, native horizontal gestures, and semantic city buttons are available. There is no idle animation loop: rendering is requested on interaction or resize, with device pixel ratio capped at 1.5. A readable fallback remains usable if WebGL fails. Physical phone/Chuwi gestures and low-power hardware have not been tested in this build.

Property panels support local name/address search and batches of 20 links to avoid rendering hundreds of entries at once. Shareable query URLs preserve the selected place on reload. Existing accessible catalog/customization remains an optional link. Existing `?property=` entry links route into the virtual observatory. The existing World export keeps source coordinates but does not assign scene positions or activate destinations.

Scene geometry is original and symbolic. The city layout is not a geographic map, and the generic building is not a replica of any indexed property. No owner authorization, accurate interior, or vacancy is implied.

## Preserved data and verified totals

All original 40 property records are byte-for-byte equivalent as parsed records. A recoverable original catalog is committed at `space/data/snapshots/catalog-before-north-america-20261121.json`; its SHA-256 is `49b011afe5a9c15fbdf8dda42ffe90ed21773084234d39e024aa495f7b5277fe`.

| Measure | Before | After |
| --- | ---: | ---: |
| Indexed property/arts-space locations | 40 | 408 |
| City groups | 16 | 18 |
| Country groups | 6 | 6 |
| Region groups | 14 | 16 |
| Source records in catalog | 45 | 47 |
| Locations with supplied coordinates | 0 | 347 |
| Verified available physical listings | 0 | 0 |
| Activated property-specific World destinations | 0 | 0 |

North America currently has 389 indexed locations: 130 in the United States and 259 in Canada. This batch added 257 Vancouver locations and 111 New York City locations. The other existing countries and original headquarters candidates remain intact. This is not comprehensive North American coverage; Mexico, Central America, and the Caribbean are not covered by this batch. Other US/Canadian cities still need additional licensed sources.

## Sources and limitations

1. City of Vancouver Cultural Spaces API: 1,942 annual source rows spanning 2014–2020. The latest available snapshot is 2020. Only Museum/Gallery, Studio/Rehearsal, Theatre/Performance, and Cafe/Restaurant/Bar records were selected: 294 source records grouped into 257 locations. Historical age is visible in the property panels and descriptions. A fetch in 2026 does not establish current operation.

   Dataset: https://opendata.vancouver.ca/explore/dataset/cultural-spaces/

   Export: https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/cultural-spaces/exports/json

   Licence: https://opendata.vancouver.ca/pages/licence/

   Contains information licensed under the Open Government Licence – Vancouver. This application filters years/types and groups addresses; it is not endorsed by the City.

2. NYC Department of City Planning Facilities Database 26v1: 139 museum source rows fetched from the public API. Ten records lacked the required numbered address/name/stable source ID and were excluded for review. The remaining 129 records group into 111 locations. The source can contain administrative addresses rather than visitor-site locations. This limitation is retained in every new NYC record.

   Dataset: https://data.cityofnewyork.us/City-Government/Facilities-Database/ji82-xba5

   API: https://data.cityofnewyork.us/resource/ji82-xba5.json (museum subset)

   Public use policy: https://cityofnewyork.github.io/opendatatsm/publicpolicies.html

   Terms: https://data.cityofnewyork.us/stories/s/Terms-of-Use/k9k7-3cje

   Original provider: City of New York / NYC Department of City Planning. This modified subset is not City-endorsed.

Source-provided points are retained only when a location group has one consistent valid point. Conflicting points remain unset; no coordinate averaging or geocoding is invented. Coordinates are not surveyed building outlines. Multiple named venues at the same normalized address are grouped; source names/IDs remain in `sourceRecords`. This grouping does not establish parcel ownership or tenancy.

All newly imported physical statuses are unknown, all virtual occupancy is not offered, and no leasing price or availability is inferred. Municipal metadata checking is distinct from a site visit, owner verification, or current-status verification.

## Implementation and checks

`north_america_intake.py` converts saved municipal data offline, validates field/source relationships, stages an append-only batch, checks existing addresses, and refuses to overwrite reviewed artifacts. It does not run an unattended crawler or purchase a data subscription. Source snapshots, metadata, attribution and batch reports are retained under `space/data/intake/` and `space/data/batches/`.

- Python suites: 29 tests passed, including source evidence, preservation, replay, duplicate grouping, invalid coordinates, API pagination/read-only behavior, and World bindings.
- Node geographic/catalog checks passed: 408 records grouped without source mutation, region disambiguation, encoded deep links, existing filters, availability expiry, and safe URLs.
- Browser: 3D scene loaded; a sphere selected New Orleans; Vancouver search found Orpheum records with historical labels; NYC search found Frick Collection; selecting a property displayed its information in the virtual environment. Earlier property drill-down and Back restoration were checked before the final virtual-layout change; full Back/Forward behavior in the final layout remains to be checked.
- No public deployment or physical device performance was verified.

## Next implementation work

Expand current licensed sources into additional US/Canadian regions and Mexico; add source-freshness prioritization and correction workflows; improve virtual navigation on physical touchscreen hardware; and prepare geographic placement from sourced coordinates without fabricating building replicas. World activation remains dependent on the matching latest World source and a working deployment.
