# Space Build 012 — Continued indexing and safe snapshot comparison

Date: November 22, 2026 (Pacific). Branch: feature/space-address-refresh-012. Development only; no production or DNS changes.

## What changed

Preserved the Build 011 30,000-address database and used SQLite's backup API to create a separate continuation database. Resumed the official Portland address feed from its committed OBJECTID checkpoint, with the same 500-record provider page limit and conservative point-in-polygon matching. The six-million-footprint database and curated catalog are unchanged.

Added building_engine/compare_addresses.py. It opens both address snapshots read-only, requires matching source sets, rejects changed source endpoints or licences, and reports counts and bounded ID samples for added, changed and absent records. It records whether the newer snapshot finished enumeration. Missing records are review candidates only; automatic retirements always remain zero. It does not assume a missing address means a demolished building, vacancy or closed business.

This is comparison infrastructure, not an automatic update/merge workflow. The importer still skips existing source OBJECTIDs. To capture changes to those records, import into a fresh sidecar, then compare it with the retained previous snapshot. Both originals are preserved. Upstream live pagination is not a transactionally frozen snapshot and source ID reuse still needs review.

## Verified scope

62 Python tests passed, including tests proving comparison leaves both databases unchanged, incomplete feeds do not trigger retirement, complete feeds still require review, and changed sources/unrelated databases are rejected. The import report records actual final counts, inferred links, unresolved points and checkpoint state; it does not present the provider's total as imported coverage.

Original footprint source: Microsoft US Building Footprints, ODbL 1.0. Address source: City of Portland Corporate GIS active address points, PDDL 1.0 with source terms/metadata retained in address_sources.json. Address links are geographic inferences, not independent property verification. No owner contacts, restricted listing content, rental inventory or payment data were added.

Vancouver WA address enrichment remains pending a confirmed reusable feed. Existing Vancouver WA footprint coverage is preserved. No new visual changes; prior 3D visual verification remains pending.

## Continue and compare

```sh
python3 -m building_engine.addresses --db /path/to/addresses-012.sqlite3 --footprints /path/to/buildings.sqlite3 --seconds 300
python3 -m building_engine.compare_addresses --previous /path/to/addresses-011.sqlite3 --current /path/to/addresses-012.sqlite3 --out comparison.json
```

The comparison refuses to overwrite an existing report. For a fresh source refresh, choose a new empty sidecar path; do not overwrite a prior database. Serve the latest sidecar with building_engine.server --db ... --addresses ... after reviewing its status. The API remains local-only and is not a production deployment.

Next: continue the full regional enumeration, obtain a reusable Vancouver WA address source, review fresh-snapshot differences, and deploy a secured read service with bounded tiles after preview testing and founder approval.
