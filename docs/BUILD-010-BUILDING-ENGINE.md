# 1AGE Space Build 010 — Building indexing engine

Founder handoff: Space Build 002. Development branch: feature/space-building-engine-010. Session date: November 21, 2026 (Pacific). Not published to production.

## Measured result

6,011,627 distinct canonical building footprints stored in a separate SQLite database and searchable through a read-only spatial API. Four full regional archives processed, 6,022,027 source observations retained, 10,400 exact geometry duplicates prevented, zero rejected geometries and zero failed jobs. A footprint is a computer-generated outline, not an independently verified current physical building or an available property.

| Source region | Distinct footprints, first source attribution |
| --- | ---: |
| Oregon | 1,873,786 |
| Washington | 3,124,692 |
| Idaho | 935,298 |
| District of Columbia | 77,851 |

All source-provided addresses are absent; verified addresses, verified listings, and known commercial/creative classifications in this new footprint layer are zero. Cities/counties have not been assigned. Portland and Vancouver WA previews use bounding boxes, not official city boundaries. Their larger intersection windows contain 299,842 and 118,586 footprints respectively. Existing 408 curated Space locations and their source records are preserved separately; they are not added to this building count.

## Implemented and tested

- Reviewed-source discovery finds 51 state/district archives in the official Microsoft dataset. Four imported; 47 not imported. No arbitrary building-count limit.
- Streaming ZIP/GeoJSON imports, finite WGS84 coordinate checks, stable geometry hashes, canonical direction/start normalization, exact duplicate prevention, source observations and archive fingerprints.
- Atomic batch checkpoints, resumable jobs, retained rejected records, single writer lock, free-space reserve, bounded downloads and resumable HTTP transfers.
- SQLite RTree geographic search, indexed region search, stable-ID lookup and keyset pagination. Read API returns at most 500 features per request; that is a response bound, not a database limit.
- Dashboard snapshot with actual totals, sources, jobs, duplicates, failures, unknown fields and preview coverage gaps.
- Two bounded 3D footprint tile exports, 23 Portland and 95 Vancouver WA geometries. Each tile can contain at most 200 features. Generic extrusion height is an explicitly illustrative 3 metres, never a measured building height.
- New full-screen buildings.html scene with rotation/zoom controls, footprint selection, accessible list and source panels. Existing root 3D scene and curated catalog remain intact apart from an additional Building layer link.
- SQLite quick_check and rtreecheck both OK; no foreign-key violations. 50 Python tests passed; after a spatial query-plan fix all 15 building-specific tests were rerun. Existing geography/catalog Node checks and JS syntax checks passed. See reports/building-query-checks.json for actual single-run local timings; they are not a production SLA.

Browser QA could not be completed: the managed preview initially was unavailable, then browser policy rejected access. Visual rendering, mobile input and WebGL behavior remain unverified in this session. Do not describe the viewer as visually approved.

## Source and rights

Contains Microsoft US Building Footprints, ODbL 1.0, modified by validation, canonicalization, deduplication and indexing. No Microsoft endorsement.

- Source: https://github.com/microsoft/USBuildingFootprints
- Data: https://minedbuildings.z5.web.core.windows.net/legacy/usbuildings-v2/
- Licence: https://opendatacommons.org/licenses/odbl/1-0/

The source repository is archived and imagery dates vary. Capture ranges are retained when supplied. It is useful coverage, not a current authoritative property registry. Retain attribution and required ODbL share-alike notices with redistributions and public uses; keep this derived open database separate from private identity, payment and owner-submission information. No Craigslist, Zillow or LoopNet data was scraped or republished. OSM, OpenAddresses and municipal/assessor feeds are not yet integrated. Those require source-specific schema/licence review; no generic permission assumption.

## Continue locally

Requires Python 3 with SQLite RTree and a POSIX host for the importer lock; no paid API or new package required for the engine.

```sh
python3 -m building_engine.run --runtime /path/to/runtime
python3 -m building_engine.server --db /path/to/runtime/buildings.sqlite3
python3 -m building_engine.export --db /path/to/runtime/buildings.sqlite3 --out space/data/buildings
python3 -m unittest discover -s tests -v
```

The runner reuses cached downloads and committed fingerprints; --refresh explicitly downloads a new immutable source version. For a new reviewed region, use --sources building_engine/discovered-sources.json --source ID. List IDs from the manifest first. Do not overwrite the curated property database. Engine initialization rejects unrelated databases. Resume ZIP imports reparse the earlier stream to reach the saved ordinal, so late resumes still spend CPU on the prefix.

## Boundaries and next work

This is a working offline import foundation and local API, not a production global service. The browser currently uses exported snapshots, not a live global API. No global XYZ tile service, public HTTPS deployment, scheduler, authentication, rate limiting, operational backup rotation, fuzzy cross-source conflation or deletion/retirement workflow is deployed. Exact identical outlines may refer to the same building; slightly changed overlapping outlines require a later evidence-based reconciliation pass. Polygon validation is structural/numeric, not a comprehensive GIS topology repair system.

Permanent building records, source provenance and placeholders for evidence-backed relationships are implemented; parcel/unit/business/listing associations are not inferred from footprints. Existing curated property workflow remains separate. No owner claims, live leases, payments or verified rental availability were created by this import.

Next: verify the viewer on real mobile/desktop; add city boundaries and lawful address/classification enrichment for Portland/Vancouver WA; implement bounded service tiles and hosted storage/read API; expand the same reviewed source family into California/Nevada/Montana after allocating storage; evaluate newer authorized regional/global sources and overlap reconciliation. Recurring scheduling should follow successful source refresh testing and a configured persistent host.

No paid services, DNS, production deployments or live financial operations changed.
