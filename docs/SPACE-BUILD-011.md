# Space Build 011 — Source-reported address enrichment

Date: November 21, 2026 (Pacific). Branch: feature/space-address-enrichment-011. Development only; not pushed or deployed.

## Implemented

Added a separate resumable address database. The original 6,011,627-footprint database remains byte-for-byte unchanged (SHA-256 in reports/address-base-protection-011.json). The existing curated 408-location catalog is unchanged.

The reviewed City of Portland Corporate GIS active-address service supplies address text, optional units, source-reported city/county/state/postal fields and coordinates. Source attribution, PDDL licence and terms links are stored with the import. Only these geographic/address fields are fetched; no owner names or contact information is collected.

- Pages respect the source's 500-record limit, use ordered OBJECTID cursors, commit atomically and resume from the last committed page. A single-writer lock prevents concurrent imports. A time budget pauses the job safely; it is not a record-count cap.
- A read-only attachment to the footprint database uses the RTree to find candidate polygons. Only one interior containment match links automatically. Multiple matches and boundaries stay ambiguous; outside points stay unmatched. Holes are respected. This is an inferred geographic association, not verification of a legal address/building relationship.
- Different unit addresses may link to one building without duplicating the building. Original address spelling is retained; city reporting normalizes casing. FTS search safely tokenizes address, city and unit text.
- GET /api/addresses?q=...&limit=... returns at most 100 records. Building queries can attach up to five address records plus the full linked-address count. API status exposes measured address counts and source metadata when configured.
- Static footprint exports and the 3D information panel support source-reported linked addresses. Existing 3D geometry is preserved. The static browser panel has bounded exported data, not live global address search.
- Source-provided addresses do not populate the base database's independently-verified address fields. Ownership, occupancy, commercial/creative use and rental availability remain unknown.

## Source review

Official source: https://www.portlandmaps.com/od/rest/services/COP_OpenData_Property/MapServer/47
Metadata: https://www.portlandmaps.com/metadata/index.cfm?LayerID=52064&action=DisplayLayer
Terms: https://www.portlandmaps.com/bps/arpa/tos.pdf
Licence: https://opendatacommons.org/licenses/pddl/1-0/

Metadata identifies public-use address data. The Portland open-data terms identify PDDL as the default unless dataset-specific restrictions supersede it. Preserve source context, attribution and as-is notices. The feed reports 900,773 source records when queried; that is a provider count, NOT the number imported by 1AGE. See reports/address-import-011.json for actual stored counts and job state.

Clark County/Vancouver WA address sources were researched but not imported: explicit downstream reuse terms for a suitable endpoint still need confirmation. Existing Vancouver WA footprint coverage is preserved. No Craigslist, Zillow or LoopNet data was copied. No paid data or services were purchased.

## Verification

58 Python tests passed, including source-safe search, exact containment/holes/boundaries, unit-to-building relationships, duplicate replay, invalid-point retention, resumable network failure, base-database protection, HTTP address queries and optional address integration. Existing Node geography/catalog checks and JavaScript syntax checks passed. Full-dataset queries and sidecar integrity checks are recorded with the import report. Browser visual testing remains blocked by the prior preview access restriction; no new visual approval is claimed.

## Continue

```sh
python3 -m building_engine.addresses --db /path/to/addresses-011.sqlite3 --footprints /path/to/buildings.sqlite3 --seconds 300
python3 -m building_engine.addresses --db /path/to/addresses-011.sqlite3 --query 'Portland'
python3 -m building_engine.server --db /path/to/buildings.sqlite3 --addresses /path/to/addresses-011.sqlite3
python3 -m building_engine.export --db /path/to/buildings.sqlite3 --addresses /path/to/addresses-011.sqlite3 --out space/data/buildings
```

Resume uses the same sidecar path. It does not refresh changed existing records or discover deleted/retired addresses; use a new sidecar for a fresh full snapshot until an audited update/reconciliation workflow is added. The live provider can change while pagination is running, so these pages are not a transactionally frozen upstream snapshot. A completed cursor alone must not imply source freshness or exhaustive verified coverage. Checkpointed import failures are recoverable, not silently ignored.

Next: finish the metropolitan feed through checkpointed runs, add an authorized Vancouver WA source, add address/use enrichment and classification with provenance, then connect a secured deployed API and bounded 3D search tiles. City labels from addresses are not official boundary assignments. This build does not create verified listings, owner claims, leases, payments, or a production hosting service.
