# 1AGE World — Travel Services 003
November 27, 2026. Stacked on Scheduling 002 PR #35, a9e246654b156e314572b49581e78dc847a8e782. Both previous GitHub workflows passed (45978364091 and 45978363787). Existing HQ2 airport immersion PR #36 and other city/architecture reviews remain untouched.

## Implemented
- Extensible airport registry, initially PDX and DCA with their IANA time zones and virtual destination IDs. Future city records and route catalogs may be injected independently. Real flight search criteria are not restricted to the developed virtual city network; external providers must validate any additional airport code.
- Travel request model validates dates in departure airport local time, one-way/round-trip, adults and cabin. No passenger identity, card, passport, or wallet collection.
- Optional airport-counter interaction component with separate virtual route buttons (only if the city supplies a route callback) and real flight search preparation. City adapters own the physical 3D counter, interaction trigger, styling, and routing. It is not mounted in any scene yet.
- Fixed public Skyscanner search link with explicit user click and unbooked notice. No tracking, affiliate relationship, prices, prefilled itinerary or live provider API. Travelers manually enter the prepared details on the external site. No reservation is created. 
- Payments, affiliate tracking, live flight search and direct booking are disabled. Future virtual travel fares must be separately approved; no real ticket can be issued from a virtual route.

## Provider research and next gates
Official public flight search: https://www.skyscanner.net/flights
Affiliate program: https://www.partners.skyscanner.net/product/affiliates
Flight search widget (requires partner approval for commission): https://www.partners.skyscanner.net/affiliates/widgets-documentation/flight-search-widget
Potential future direct search/booking integration: https://duffel.com/docs/guides/getting-started-with-flights
Approve provider agreement, data use, secure backend, pricing/offer expiry, privacy, disclosures and customer support before implementing real reservations. No partner relationship or commission is implied by the public link. Live flight schedules are a separate data integration, not supplied by this build.

## Verification
Five targeted travel-model tests passed and four JS module syntax checks passed in isolated JS. Added tests to the dedicated Node CI workflow. Actual browser counter interaction, full CI and airport integration are pending. No city scene, production, hosting or DNS changes. Preserve all existing branches and coordinate installation with both city teams.
