# HQ2 Build 001 · Historic Anacostia

November 25, 2026 · 1AGE Space · Review branch feature/hq2-anacostia-build-001

## What you can explore

Open /hq2/ from the Washington, D.C. link in Space. Start at Martin Luther King Jr. Avenue SE and Marion Barry Avenue SE. Walk with the left stick or WASD and look with the right stick or drag. The Places menu searches indexed storefronts and destinations and offers direct arrivals at Anacostia Metro on Howard Road, the Riverwalk and the public 11th Street Bridge approach. All four arrivals share one coordinate system and the same exterior scene. Bridge and ramp profiles approximate elevation.

The geographic bounds are approximately **1.16 × 1.58 km** (1.83 km² bounding box, including river and scenery). They contain **30 tiles**, **1,042 footprint parts**, **1,443 road and path segments**, **747 mapped surface polygons** and **131 source-mapped street fixtures**. These are scene features. Commercial records are counted separately.

Sources are DC OCTO building, sidewalk and water polygons and an attributed OpenStreetMap streets and parks extract. See the [dataset metadata and reproduction notes](../hq2/geography/README.md). The scene uses original façades, text signs, storefront windows, street furniture and moving water. Building heights, entrances, materials, terrain grade and bridge elevations are approximations. HQ1-level exterior fidelity and the accuracy of continuous public walking paths across the entire bounds require further review.

## Property index and protected access

| Measure | Build 001 |
| --- | ---: |
| Shared Space catalog | 416 records |
| HQ2 subset, including 2 preserved records and 8 additions | 10 |
| Operator-backed occupied properties | 5 |
| Physical occupancy unknown | 5 |
| Of the unknown records, DC vacant-or-blighted register leads | 3 |
| Independently confirmed vacant | 0 |
| Commercial suites advertised by the operator in the shared index | 3 |
| Direct exterior property arrivals | 8 |
| Source-linked business records | 7 |

All 10 records have source-checked identities or addresses. Physical occupancy has separate evidence. A renovation closure and the city's combined vacant-or-blighted layer each require independent follow-up before labeling a property vacant. Lease advertisements are recorded as operator notices, with physical vacancy left unknown. Names and factual links do not imply business participation.

HQ2 records and protected public destination records permit exploration while excluding public virtual acquisition. The shared catalog rejects owner claims and independent virtual offers for protected properties. The read-only Python property API returns HTTP 403 for property-scoped writes on protected records and 405 for other writes. The deployed static site has no transaction backend. When production ownership is added, enforce the same rule at its authenticated mutation boundary, backed by canonical district boundaries and IDs. Any future studio-authorized business participation needs its own permission.

## Transportation, Treasury and DMV

- The walking scene includes the Howard Road Metro exterior, waterfront pathways and local bridge geometry. Four direct arrivals support early travel. Trains, scheduled buses, driving, cycling physics, interiors and door return positions remain future work.
- The 1AGE Department of Treasury has a protected, searchable planned destination with an official exterior reference and four planned rooms. The original 1AGE institution is independent of the U.S. Treasury. The Digital Mint will default to simulation until the token configuration is verified. $1AGE blockchain token data and 1AGE Cash internal credits use separate systems.
- The DMV registry covers Washington, D.C., Prince George’s County, Arlington and Alexandria. Downtown, the National Mall, Maryland and Virginia have destination records without scenes. The next scene priority is the Southeast waterfront connection and a public-route audit, followed by downtown Treasury and landmark exteriors, other D.C. districts, Maryland and Virginia.
- Space has property-specific entry URLs and includes them in the data-only World export. Production World and cross-domain 1AGE Search integration remain future work.

## Verification and review

Shared Three.js and 1AGE joystick controls come from HQ1. Tiles stream around the current location. Mobile uses a shorter draw distance, reduced pixel ratio and fewer visible façade details. Device performance and physical controller compatibility require a real-device playtest.

Verification passed 67 Python tests and 10 Node tests. Chromium walkthrough passed keyboard walking, mouse look, a simulated standard-mapped controller, touch joystick input in an iPhone-sized viewport, direct destinations, browser history, search and protected property controls. On the local Chromium run the first street tile responded at about 235 ms after navigation. That is a local development timing and does not measure mobile frame rate or deployed load time.

Screenshots from the running development scene:

- [MLK Avenue SE and Marion Barry Avenue SE](images/hq2/anacostia-mlk-gateway.jpg)
- [Anacostia Riverwalk](images/hq2/anacostia-riverwalk.jpg)
- [11th Street Bridge pedestrian approach](images/hq2/11th-street-bridge.jpg)
- [Anacostia Metro at Howard Road](images/hq2/anacostia-metro.jpg)
- [Anacostia Arts Center in an iPhone-sized viewport](images/hq2/anacostia-arts-center-iphone.jpg)

## Rollback

The review baseline is d7028142e1e21667bcd17a800d58504cd39d21fe. This review branch requires no production rollback. If a later release needs reversal, revert the HQ2 integration commit through a reviewed PR and use the normal 1AGE Space release workflow. Keep the review branch for traceability.

## Build 002 · Street signs and intersections

The next review commit adds 40 street-name blades covering 22 named streets at 19 mapped junctions. The route runs from the MLK Gateway and Historic Anacostia commercial blocks toward Howard Road, Anacostia Drive and the 11th Street Bridge approaches. Search Places by street name or abbreviation to inspect a junction and open its stable street arrival. The HUD shows the nearest signed junction at street level.

Mapped crossing polygons now have painted ladder markings. Signal heads have separate lenses. The sign art, post placement and traffic-control details are original approximations. This pass does not simulate traffic or certify continuous pedestrian routes throughout the district.

Verification passed 67 Python and 11 Node tests. Desktop Chromium and an emulated mobile viewport verified intersection search, scene arrival and direct-link reload.

- [Marion Barry Avenue street signs](images/hq2/hq2-002-marion-barry-street-signs.jpg)
- [MLK Gateway crosswalk](images/hq2/hq2-002-mlk-crosswalk.jpg)
- [Howard Road mobile view](images/hq2/hq2-002-howard-road-mobile.jpg)

## Build 003 · Gateway interiors

In Places, select MLK Gateway Phase II or Grounded and choose an interior. Return to street restores the previous camera position and heading. The showroom contains six 1AGE application display stations. The market contains six creator stalls. The plant shop study combines plant displays, a café counter and a small wellness area. These are original virtual design studies with collision-aware walking. The application displays are exhibits.

The [leasing bulletin](https://www.mlkgatewaydc.com/leasing) lists 1,519 sq ft at 1911 MLK and 2,205 sq ft at 1111 Marion Barry. Rectangular proportions, layouts and fixtures are design assumptions. Current vacancy, physical occupancy rights and commercial partnerships remain unverified. The [Grounded operator FAQ](https://feelgrounded.com/pages/faq) informed the program at 1913 MLK. Its interior dimensions are estimated. The [Anacostia House project page](https://www.mlkgatewaydc.com/anacostiahouse) identifies the building at 1916 13th Street SE. Its new exterior destination uses the existing mapped footprint and an approximate façade.

Screenshots from the review build: [application showroom](images/hq2/hq2-003-showroom.jpg), [creator market](images/hq2/hq2-003-market.jpg), [plant shop and café](images/hq2/hq2-003-plant-cafe.jpg).
