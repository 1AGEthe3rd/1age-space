# 1AGE World — Scheduling Foundation 001

Founder direction: consider real-world schedules as shared gameplay. Implement a reusable foundation independently of city scenes, with real information distinguished from virtual services. Current main is protected Build 009, 62907d943a7222ecd4d34b9ecbf9e5d168527d3b. HQ1 engine PR #29, HQ2 engine PR #30 and newer HQ2 airport/Metro PRs #31–33 remain untouched. No scene files changed.

## Proposed behavior
- Real local time; published GTFS schedules as baseline; fresh GTFS-Realtime predictions/cancellations when available. Real and virtual times must be independently labeled. Missing/expired data remains unavailable. No service is not the same as an unavailable feed.
- Both cities can consume the same normalized departure snapshot model. Official source registry identifies TriMet and WMATA; both are marked not-connected. Backend adapters must normalize stop/direction/trip/service-day identifiers, including GTFS times beyond 24:00, agency time zones, DST, service calendars and exceptions. Scope each snapshot to a single station, route and direction; use a verified station crosswalk. Secure API credentials server-side; respect provider licenses, quotas, attribution and refresh requirements.
- Businesses use verified local weekly hours and date-specific exceptions. Missing/stale records remain unknown. Real business hours are informational; public exploration remains available. Separate virtual venue access rules from physical operating hours.
- Airports may display licensed real flight information as reference. Virtual flights have explicitly separate schedules and compressed journey duration; do not imply actual airline booking or boarding. Existing virtual routes remain unchanged. Do not activate fares or payments.
- Explicit simulation mode can offer virtual departures without waiting. Real schedules as default is a proposed product policy, not yet enforced in existing city scenes.

## Implemented and verified
Shared schedules.mjs handles local clocks, source-aware departures, prediction freshness, cancellation, unavailable state, explicit simulation mode and verified business-hour evaluation. schedule-sources.mjs defines initial provider documentation and policy. Six test cases passed in isolated JS runtime (imports/exports stripped), covering city clocks/DST, updates/cancellations, stale data, missing service, simulation separation, overnight hours/holiday closure and incomplete records. Three module syntax checks passed. No network feeds, real schedules, data ingestion or scene UI wired yet; full CI and integration tests pending.

## Next
Connect licensed provider feeds through a secure backend, validate stop identifiers and service days, add in-world station departure boards and train arrival timing; preserve current manual rides during development. Next verified business hours, holiday exceptions and opt-in simulated flight departure boards. Coordinate a single shared engine integration with both cities; no production merge, deployment, DNS changes, ownership or payment changes without approval.
