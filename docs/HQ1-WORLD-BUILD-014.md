# 1AGE World · HQ1 Build 014 — Javan Imports virtual demo fleet

Base: Build 013 PR #26 head fef56bae65b00098e7a882dd191d34a818bdfb0f. Its GitHub validation run 45933226256 completed successfully. Stacked review only; main remains protected Build 009. Earlier drafts, HQ2, Space/World architecture and hosting paths remain unchanged.

## Vehicle and property references
Javan Imports publicly describes Japanese 4WD imports and lists HiAce, TownAce and Delica families; its contact page confirms 4545 NE Martin Luther King Jr. Blvd, Portland. See https://www.javan-imports.com/contact, https://www.javan-imports.com/catalog and https://www.javan-imports.com/japanese-vans-for-sale. No dealer photos, inventory records, marks or vehicle assets copied into the fleet. Founder-provided fence/opening description informs the existing approximate lot; exact frontage, gate, parking orientation and dimensions remain unsurveyed.

## Implemented
- Three stable demo IDs under hq1-javan-imports: touring, high-roof adventure and compact camper. Original procedural designs reference Japanese van families; common dimensions and existing physics are retained. Roof, glazing, trim, grille and exterior color differ. These are not exact replicas or actual available stock.
- Preserve both street vans, all cockpit views, right-hand steering, lights, wipers, sound, weather and braking. Add two lot vehicles alongside the existing one, with aligned bay stripes and a virtual demo placard.
- Select a nearby accessible vehicle by walking to it. Vehicle entry tests the path to either side of the selected vehicle, against scene blockers and other parked vehicles; exit requires a free position. Pedestrian movement checks parked vehicle footprint bounds. No new text overlay while driving.
- Local immutable demo records contain explicit salesEnabled=false and rentalsEnabled=false. These are prototype metadata, not security or ownership enforcement. Future verified inventory, reservations, pricing, authorization and transactions require separate backend work and approval.

## Validation
Three new targeted test cases passed in an isolated JavaScript runtime: unique noncommercial demo IDs; each vehicle drives from its bay through the gate and turns north onto MLK with the other vehicles parked; local selection, wall blocking and pedestrian bounds. The route test drives straight through the gate to x=-3.5 before turning north; turning prematurely near the outer bays can hit the driveway boundary. Ten module syntax checks and HQ1 entry syntax check passed after stripping import/export statements. Full CI, renderer screenshots, touchscreen/controller, actual lot survey, wet-driving and original HQ1/rail/airport/venue regression checks remain pending.

Test path on an approved development preview: /hq1/?stop=javan-lot or /hq1/?stop=javan-lot&weatherPreview=rain. No preview deployment is created here. No physical-property claim, commercial affiliation, actual sales, rentals, charges or property ownership. No merge, migration or deployment. Review PR #24 then #25, #26 and this stacked build; coordinate one release route.
