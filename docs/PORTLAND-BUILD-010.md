# Portland Build 010 — partial 5601 visual refinement and Skidmore evidence gate

Base: 62907d943a7222ecd4d34b9ecbf9e5d168527d3b (main matched at start). HQ1 only; HQ2, shared code and production untouched.

## 5601 NE MLK
Existing official address-control record: address ID 576323; building 1N1E15DD-13700-B1; property R243114; west of MLK between Church and Jessup. The broker's Geneva Knauls Building listing (https://www.loopnet.com/Listing/5601-NE-Martin-Luther-King-Jr-Blvd-Portland-OR/36159504/) corroborates the Jessup corner, two suites, 2,163 sq ft retail area and fourteen parking spaces. These are listing facts, not verified current occupancy, a physical lease, or a partnership.

The listing primary photo and two aerials show muted rose fascia, pale masonry, yellow stall lines, flat roof, landscaping and the lot beside the storefront. The first patch updated material colors/texturing and stall stripe color. A follow-up patch used the broker’s June 2025 brochure (linked below) to refine the fascia, wider central masonry bay, noninteractive service door, red end piers, separate glazing spans, dark kick rails and approximate roof fixtures. The brochure shows a pale warm-neutral fascia; this supersedes the earlier rose color estimate. No changes to the gameplay footprint, interactive door coordinates, collision bounds or returns. No listing images are stored or embedded. Color values are approximate and may reflect the photo date, not present-day paint.

Potential geometry discrepancy: aerial views appear to put the parking lot toward the Jessup corner; the existing compressed scene puts the lot on the opposite side of the building from its Jessup road. Confirm orientation with official georeferenced footprint/curb data and match entrance positions before moving the building, street or return poses. Exact stall layout, driveway, door bearings and unit boundaries remain unverified. PortlandMaps property page could not be opened in this session; existing controls are retained, not independently re-surveyed.

The [broker brochure](https://images1.showcase.com/d2/5pMviNilG1O8KvEXrw2K1xxlJ_xSnc2-BGZT9SkcK4I/document.pdf) also contains a measured suite sketch dated June 9, 2025. It reports a combined rear span of 93.5 ft (28.50 m) and roughly 2,165 sq ft across two suites; the existing gameplay width is 20.7 m. These figures are reference measurements, not an authorized copy of the floor plan or a surveyed coordinate transform. Do not resize the footprint in isolation from street alignment, interior integration and entrance testing. The brochure's area figures differ slightly from the listing, so retain both as reported. No floor plan or photos are embedded.

## Skidmore
Original IMG_1734.mp4 found in the private Library but its bytes could not be retrieved in this session. Expected SHA-256 remains 6d923923d8bf82315a33b6cc70453c5fb954015823999f6435bb86d4e340f209 from Build 009 inventory, not newly verified. The inventory notes NE Skidmore St blade 4300 and a blue corner building; the cross street, address ID, footprint and occupancy remain unresolved. Do not place the exterior until clip and official geographic records agree. No original media is included. The [City of Portland corridor strategy](https://www.portland.gov/transportation/planning/construction/ne-mlk-jr-blvd-corridor-safety-investment-strategy) and [King Neighborhood Association's 2009 redevelopment notice](https://kingneighborhood.org/869/) support an MLK/Skidmore intersection as a candidate, not identification of the filmed blue building. The 4300 blade may denote the north-south block rather than the east-west address; do not infer the cross street solely from that number.

## Review gates
- Confirm CI and both suites; previous Build 009 test results do not certify this patch.
- Capture same-camera desktop and portrait before/after images at the 5601 stop.
- Physical iPhone Safari, F310 and independent venue round trips remain pending.
- Confirm the 5601 parking-lot route, NLC doors and returns, NNB, driving, MAX, weather and controls remain functional.
- Keep draft until reviewed. No merge or deployment authorized by this patch.

The patch is intentionally limited to original cosmetic geometry and materials: no coordinate changes, new buildings, new occupancy records, or geographic expansion. Revert the visual commit on a new branch if necessary after integration.
