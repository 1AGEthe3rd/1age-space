# HQ1 Air Travel Build 001 — PDX ↔ Washington, D.C.
Base: published Build 009, 62907d943a7222ecd4d34b9ecbf9e5d168527d3b. Isolated HQ1 branch; no HQ2, shared controller or production edits.

## Prototype flow
- Start at HQ1, enter MAX Yellow Line. Travel south to the new Interstate/Rose Quarter stop (via Overlook Park); disembark and transfer via the labeled connection to the Red Line at Rose Quarter Transit Center.
- Board Red Line and ride east through the named stations to Portland International Airport. Rail distances, station geometry and trip timing are illustrative. Existing Yellow Line default entry and original stops retained. Red Line westward route beyond Rose Quarter and direction-specific Gateway routing are deferred.
- At PDX, enter the virtual airport terminal, walk to Gate 01, board the free demonstration and depart. A short simulated flight progresses through taxi, takeoff, cruise, descent and arrival over 80 seconds of active simulation time. Use V, the camera icon, or a standard gamepad stick press to switch between passenger aisle and window views. The outside scenery, wings, runway and clouds animate; this is not a pilot simulator, exact terrain or real flight schedule.
- Leave aircraft at the DCA terminal. The city-transfer link opens existing HQ2. The DCA terminal also supports the reverse flight back to PDX. Direct preview entry: /hq1/?airport=pdx and /hq1/?airport=dca. HQ2 has not been modified to add a return link yet; after visiting HQ2, return to the DCA terminal using that preview URL. Future work: geographically modeled DCA airport/Metro connection, realistic PDX architecture and airport layout, terminal boarding bridge and synchronized aircraft exterior, full cross-city integration.

## Sources
- TriMet Red Line stop order: https://www.trimet.org/home/route/90/
- TriMet transfer and station information: https://trimet.org/transitcenters/rosequarter.htm
- TriMet PDX station information: https://www.trimet.org/schedules/maxredline.htm
- DCA connection to Metro Yellow/Blue Lines: https://www.wmata.com/ride/guides/airports-and-train-stations.html
PDX and DCA are proposed virtual endpoints, not a claim of scheduled service or affiliation. Original simplified geometry only.

## Fare design
Free simulation only. No Stripe, 1AGE Cash debits, live payments, ticket sales, real airline reservation or mandatory wallet. Future optional virtual journey fares require explicit pricing, account/ledger integration, refund/cancellation policy, authorization and a server-side entitlement workflow. Do not treat local prototype state as payment proof.

## Review gates
Flight model checked in isolated JS runtime: 12/12 targeted assertions across both directions. New Node regression file included; full CI and live browser/physical-device tests pending. Verify original MAX routes, Kenton and Expo Center, transfers, boarding, disembarkation, both flights, touch/keyboard/controller, performance and screenshot comparisons. Reconcile parallel HQ1 PRs (some modify hq1.mjs) before merge. No production deployment without approval.
