# Portland Build 009 · NE MLK at Alberta

Review arrival: `/hq1/?stop=openhaus`. The plaza can also be reached on foot from the original HQ1 spawn. The corner sits east of MLK, north of Alberta and south of Webster. Two anonymous shells have been replaced with one partially reconstructed openHAUS exterior and Harry Jackson Plaza. The plaza has a recessed storefront, canopy and suspension rods, two levels of glazing, brick paving, picnic tables, a curved memorial, capped posts and a planted bed. The scene uses original geometry. Its dimensions, colors, plant placement and facade details are visual estimates. The storefront is exterior-only.

| Same camera | Desktop | Portrait |
|---|---|---|
| Build 008 | [Before](images/portland/mlk-before-desktop.jpg) | [Before](images/portland/mlk-before-mobile.jpg) |
| Build 009 | [After](images/portland/mlk-after-desktop.jpg) | [After](images/portland/mlk-after-mobile.jpg) |

## Recovery and reference index

[Media inventory](../hq1/portland/references/media.json) records 27 videos and 26 still images by filename and SHA-256. The site record supplies the intersection, segment, address, building and business. Capture date and camera bearing default to unknown. Four videos match this corner. IMG_1698 and IMG_1699 show the storefront and paving. IMG_1700 and IMG_1701(1) show the memorial and planting. IMG_1734 independently shows a NE Skidmore St blade. The other files include unplaced exteriors, screen captures and unrelated material. Some arcade references are screenshots from third parties. The inventory covers recovered candidates, without establishing completeness of the original collection. Original footage, faces, third-party imagery and artwork are excluded from the game assets.

The private 1AGE World archive contains sol_road.tscn, sol_road.gd, sol_road_living_district.gd, sol_road_build006.gd, sol_road_build007.gd, data/sol_road_properties.csv, SOL_ROAD_README.md and SOL_ROAD_V3_NOTES.md. Its 96 property rows include mixed verification levels. The scripts document the procedural corridor, storefronts, intersections, traffic and venue history. They remain historical references.

## Geographic controls and occupancy

Five official address points were joined to five distinct generalized buildings by building ID. See the [address controls](../hq1/portland/references/mlk-control.json) and [metric conversion](../hq1/portland/references/local-meters.mjs). WGS84 coordinates give east and north offsets in meters from a selected origin for future alignment. The original game corridor still compresses distances. For example, 5601 is approximately 459 m north and 51 m west of the 5020 address point. Entrances, footage viewpoints and address points are distinct locations. Unit boundaries and door bearings need separate evidence.

| NE MLK address | Side | Finding |
|---|---|---|
| 4545 | West | Shares a building whose city building record uses 4525. Javan showroom dimensions need verification. |
| 5020 | East | One-story, flat-roof building at openHAUS. Operator-published location and visible signage support the association. |
| 5601 | West | One-story, flat-roof building between Church and Jessup. NorthLeftChef is a connected virtual destination. |
| 5775 | West | One-story, pitched-roof building. Physical tenancy unverified in this build. |
| 6720 | East | City building record covers 6720–6732. Individual unit dimensions remain unresolved. |

The existing Portland-area footprint artifact contains 23 features. The five joins are reference records and should not be added to that number as new citywide buildings. This build adds zero commercial units, physical vacancies, leases, partnership claims or virtual-claim grants. HQ1 retains founder review, protected venues and disabled self-service claims. The final protected boundary remains open.

Sources: [PortlandMaps Active Address Points](https://www.portlandmaps.com/od/rest/services/COP_OpenData_Property/MapServer/1272), City of Portland Corporate GIS; [generalized Building Footprints](https://www.portlandmaps.com/od/rest/services/COP_OpenData_Property/MapServer/48), Bureau of Planning and Sustainability; [openHAUS](https://www.openhauspdx.com/); [Harry Jackson Plaza location](https://mlkinmotion.wordpress.com/2020/08/20/art-on-the-boulevard-an-alberta-street-last-thursday-event/). GIS use here is limited to factual address and building control records. No source map imagery, LiDAR, footprint mesh or original footage ships with the scene.

## Checks and outstanding work

34 JavaScript tests and 67 Python tests passed. Covered the 5020/5601 metric relation, both sides of MLK, plaza collision boxes, a clear passage, both NorthLeftChef door returns and the parking-lot walking route, NNB gym routing and return pose, driving stops/steering, crossing and weather behavior. The NNB and NorthLeftChef independent interiors still require a live round-trip check before release.

Chromium opened the regular gameplay entrance at both 900×560 and 390×844. A fresh simulated KPDX rain observation appeared in the HUD. The actual NWS KPDX endpoint separately returned HTTP 200. Both browser sizes boarded, exited, reboarded and departed north toward Rosa Parks, without a page exception. The software-rendered browser delivered 42.9 and 60.0 animation callbacks per second respectively over a short 20-interval sample. Fixed-camera preview navigation loaded in 378/258 ms before and 311/202 ms after (desktop/portrait, single local loads). These measurements do not establish sustained GPU performance or physical iPhone behavior. Physical iPhone, joystick input and Logitech F310 playtesting remain pending.

Next: match the Skidmore footage and remaining exteriors to address IDs; establish actual curb and doorway control points for the 5601 parking lot and adjacent blocks; then reconcile compressed block lengths with the existing venue return poses. The build does not add new rail mileage, install new weather providers or reconstruct the rest of the Soul District.

## Release and rollback

Build 009 branches from Build 008 at `0ff642ac39a430c8fd5ac2883f142e1885456a46`. The draft review targets the Portland development branch underlying PR #12. Production was inspected at `f07af66651912358c98e184c102238bdd470bc5a`. Backups are `backup/hq1-before-reconstruction-20261126` (development) and `backup/hq1-production-before-reconstruction-20261126` (production). To withdraw the review, close its draft PR. If integrated later, revert the Build 009 commit on the integration branch and rerun both test suites. No migration or data restoration is required.
