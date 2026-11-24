# Portland HQ1 and venue entrances

This branch adds a short browser-based section of the conceptual Sol Road to 1AGE Space. The existing Godot project and property catalog stay in their respective repositories. HQ1 remains a neighborhood that can contain independently operated venues.

## Sources inspected

| Source | Reuse or disposition |
| --- | --- |
| Godot `sol_road.tscn`, `sol_road.gd` | The scene root runs GDScript that generates the boulevard, sidewalks, storefronts, and wayfinding. This preview adapts the street dimensions and selected conceptual facades. |
| `sol_road_living_district.gd` | The Alberta cross street, crosswalks, and plaza informed the browser layout. The existing NNB sign was a concept. |
| `sol_road_build006.gd`, `sol_road_build007.gd` | These add photo-informed and illustrative street details. This first browser section uses a limited subset of the existing visual cues, including a Cason’s concept facade. |
| `data/sol_road_properties.csv` | Existing records and verification labels were reviewed for context. No record was promoted into a verified listing or occupancy claim. |
| `SOL_ROAD_README.md`, `SOL_ROAD_V3_NOTES.md` | The route and original environment are conceptual. The existing World portals and controls require no change for this rollout. |
| NNB web repository | The original Three.js gym remains the only gym implementation used by all entry routes. |
| Studio web repository | The original globe and dial remain the basis of the preview and navigation. |

## Venue contract

`hq1/venues.mjs` holds the neighborhood spawn and public virtual venue records. A record has a stable ID, operator name, position and orientation, facade dimensions and palette, an entrance with a proximity radius, a public HTTPS destination, and an approved virtual return position.

HQ1 adds `from=hq1&venue=<venue-id>` to participating venue links. An independently operated venue may offer a return to `https://1age.space/hq1/?return=<venue-id>`. HQ1 resolves that ID to a configured arrival and otherwise uses the default neighborhood spawn. The URL never supplies coordinates. The gym returns to HQ1's default arrival when entered directly.

NNB uses the conceptual ID `hq1-nnb-gym`. Its building position asserts no address, real-world occupancy, ownership, or lease. A second destination can use the same contract by supplying its own record and HTTPS URL. Later embed or API integrations can be added separately.

Preview mode `?preview=1` supplies an input-free scene for the studio globe. Default visit paths remain the full walkable experiences. Review the NNB, Space, and studio drafts together before deploying their cross-domain links.

## Build 003 · Realistic Soul District

The short street layout, NNB footprint, venue ID and return position carry forward. The realistic facades use modeled wall openings, sills, transoms, recessed doors, glazed display bays and visible interior shells. Procedural materials provide brick, concrete and asphalt without extra network requests. Shared static geometry is instanced by material. Street details draw on the existing Sol Road source and the [Portland Bureau of Transportation corridor strategy](https://www.portland.gov/transportation/planning/documents/ne-mlk-jr-blvd-corridor-investment-strategy-110923/download). Locations and storefront designs are illustrative.

The NNB sign uses the published gym's NO NAME BESUTO wordmark lettering. The street uses the existing 1AGE logo asset. The source audit did not locate a separate official NNB logo asset, and the streetscape uses generic storefronts away from the NNB gym and fictional second venue. This build makes no occupancy or availability claims.

Alberta Workroom (`hq1-alberta-workroom`) is a fictional commercial shell. Its door opens the walkable interior within HQ1 at `?inside=hq1-alberta-workroom`. Exit lands at that venue's return position through the shared registry. Run `node --test tests/hq1-venues.test.mjs` to verify the routing contract.

Preview camera URLs use `?preview=1`. Append `&view=street`, `&view=nnb`, or `&view=workroom` for alternate exterior views. Append `&inside=hq1-alberta-workroom` to preview the room.

## Build 004 · Alberta street continuation

The intersection now has a longer walkable Alberta corridor, sidewalks on both sides, commercial corner shells, and a small conceptual seating area. The cross street retains its original crossing. A dedicated `?preview=1&view=alberta` camera shows the eastbound view. NNB and Alberta Workroom keep their existing entrances and return coordinates from Build 003.

Building collision uses the facade orientation and its registered dimensions. Turning a corner shell to face Alberta also turns its collision footprint. The new corner shells represent fictional geometry with no claim of a tenant, surveyed address, or vacancy.

## NorthLeftChef · Jessup extension

The walkable north-end extension represents the Geneva Knauls Building at 5601 NE Martin Luther King Jr. Boulevard. The [leasing brochure](https://images1.showcase.com/d2/5pMviNilG1O8KvEXrw2K1xxlJ_xSnc2-BGZT9SkcK4I/document.pdf) provides reference images of the glazed suites, red facade accents, and surface lot. The [property listing](https://www.cityfeet.com/cont/listing/5601-ne-martin-luther-king-jr-blvd-portland-or-97211/cs36159504) reports two suites totaling 2,163 square feet. The virtual footprint is approximately 20.7 × 9.65 m, an area-based fit to the existing NorthLeftChef proportions. Scene placement and dimensions are approximate and do not imply a tenancy or a surveyed reconstruction.

The café and studio doors use separate fixed return positions in one venue record. NorthLeftChef's exit links return just outside those doors, facing the parking area. The lot has a pedestrian path to the NE MLK sidewalk. The neighborhood compresses the real distance between Alberta and Jessup.
