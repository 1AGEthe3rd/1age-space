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
