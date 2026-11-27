# 1AGE World · HQ1 Build 012 — PDX terminal and passenger aircraft

Base: combined Build 011 review head 3686cbd1dc4c5692e9470b8512c753656ea59c17 (PR #24). Build 011 GitHub validation run 45916890425 completed successfully before this development. Build 012 is a stacked review, not a production release. Existing HQ1/HQ2 hosting, World and Space architecture work and all reserved studio locations remain protected.

## PDX architectural interpretation
Original compressed public passenger hall with timber canopy, skylight bands, tall glazed walls, interior grove, mezzanine railings, ticket counters, seating, original teal carpet pattern and virtual departure gate. Architectural boxes are grouped into instanced meshes to reduce draw calls. Walkable central route and planter/counter collision zones use explicit bounds. Existing DCA terminal architecture remains unchanged. Actual gate assignment, architectural dimensions, concourse geometry, exterior airport and accessibility routes have not been surveyed. The virtual terminal is a stylized interpretation, not an exact floor plan.

Public references:
- Architect: https://www.zgf.com/work/5683-port-of-portland-pdx-airport-main-terminal-expansion — signature undulating timber roof, 49 skylights, indoor greenery and neighborhood-inspired public space.
- Project completion: https://www.zgf.com/ideas/9464-portland-international-airport-main-terminal-completes
- Official passenger map: https://www.flypdx.com/Map/ — public terminal naming and transit connection reference. No map geometry or photography copied.

## Aircraft
Original unbranded passenger cabin detailing: window glazing and circular trim, seat armrests, ceiling light, aisle runner, engine nacelle models, and a window camera aligned with an opening. Existing virtual boarding and departure flow, 80-second simulated flight in both directions, and MAX transfer links retained. Ground motion adjusted to avoid visible modulo reset during takeoff and landing. This is not a verified aircraft replica, actual airline service or real flight simulation.

## Review
Two new targeted walking/gate logic tests passed in an isolated JS runtime; all four new/modified airport JS files passed a syntax check with import/export declarations stripped. Full GitHub validation and browser screenshot comparison remain pending. Test mobile/desktop performance, iPhone Safari, physical F310, cabin/window views, both flight directions and MAX arrival, including regression checks of rain, driving, NLC/NNB returns and existing HQ1. No screenshots or device test claims. No real fare, transaction, property ownership, deployment or migration. Keep Build 011 and all prior drafts intact; coordinate a single release path, not multiple redundant merges.
