# 1AGE Space — index expansion 002

November 20, 2026 · Unpublished, data-first development

## Result

Expanded the existing catalog from 6 to 30 places, spanning 16 cities and 6 countries. All previous property IDs and records are preserved. Added 24 curated place records and 30 primary-source references; the complete source registry now has 35 entries. There are 27 source-checked records and 3 founder research candidates.

| Country | Records |
| --- | ---: |
| United States | 19 |
| United Kingdom | 4 |
| Canada | 2 |
| France | 1 |
| Germany | 2 |
| Australia | 2 |

Categories overlap: 16 commercial, 26 art-space and 11 live/work classifications. These are not additive totals. The index is a curated sample, not a complete global inventory. It now includes Anacostia records for future HQ2 research, without editing HQ2 or any other World scenes.

## Data work

- Addresses, names, uses, citations, field-level evidence references, source check dates and explicit unknown physical availability.
- Original stable IDs retained, including `property-hq1-5601-ne-mlk`.
- Operator/developer material used for factual metadata and short original descriptions. No third-party pictures, floor plans, geometry or private resident/applicant data collected.
- Sources based on archival documents are marked as historical in the record/source descriptions. They are not presented as current tenancy evidence.
- Anacostia Arts Center and Hayward Gallery operating notices remain separate from vacancy/lease status. Temporary closure is not a vacancy signal.
- Bethanien studios and showrooms have different documented street addresses and share `complexId`. Friche's alternative Simon entrance is not duplicated as a second property.
- Thirty records have no verified coordinates, parcel match or building replica; all coordinates remain null. There are no verified physical listings, live virtual occupancy offers or activated World destinations.

## Import and search foundation

`scripts/catalog_batch.py` stages append-only imports into a new output file. It validates the merged catalog, detects conflicting IDs/source IDs and likely duplicate normalized addresses, and refuses silent replacement. Retrying the same batch adds zero records. Address normalization is conservative; it is a review aid, not a universal geocoder or entity-resolution engine. Distinct units and alternate entrances need explicit modeling and review.

`scripts/property_index.py` builds a separate SQLite full-text snapshot with bounded pagination and parameterized country/category/city queries. This version adds field-source scope checks and evidence validation for operating notices.

`scripts/space_api.py` provides a local **read-only** API against that snapshot. Routes:

| Route | Behavior |
| --- | --- |
| `/api/space/properties` | Paginated query; `q`, `country`, `city`, `category`, `limit`, `offset` |
| `/api/space/properties/{id}` | Retrieve one stable public record |
| `/api/space/sources/{id}` | Resolve cited evidence/rights information |
| `/api/space/world-manifest` | The same paginated query as data-only World bindings |

Limits: 1–100 records per request, default 20; no write, claim, payment or lease endpoints. No credential or production identity system. The service binds to loopback and is for local integration testing. It is not publicly hosted. The existing browser adapter still loads the JSON catalog; it is not switched to the API in this iteration.

## 1AGE World connection preparation

`scripts/world_export.py` emits a versioned data-only manifest. Each entry carries the property ID, independent Space application path, address, source/status information and nullable World destination. `sceneAsset`, `worldPosition` and unverified geographic coordinates remain null. `activationAllowed` is false. No replica rights or spatial location are fabricated.

The future 1age.space platform in 1AGE World can use these IDs to request property records and present discovery results. Approved scene assets and verified arrival bindings can be attached later. **This does not yet connect the World platform or create 30 explorable buildings.** HQ1/HQ2 city development remains in the founder's separate builds.

## Verification

20 Python tests passed, including real local HTTP API requests, pagination, ID lookup, read-only enforcement, field evidence, append-only import, duplicate handling and data-only World bindings. JavaScript search tests also passed against the expanded catalog. No frontend redesign or browser layout test was undertaken in this index-focused iteration; the previous Build 001 browser tests remain historical evidence for that build.

## Run

From review-source:

```bash
python3 scripts/property_index.py
python3 scripts/catalog_batch.py
python3 -m unittest discover -s tests -v
node tests/catalog.test.mjs
python3 scripts/property_index.py --build-db /tmp/space-index-002-review.sqlite3
python3 scripts/space_api.py --db /tmp/space-index-002-review.sqlite3
```

Example local queries after starting the service:

- `http://127.0.0.1:4182/api/space/properties?country=GB&city=London&limit=2`
- `http://127.0.0.1:4182/api/space/world-manifest?city=Washington%2C%20D.C.`

To review the unchanged application layout with the expanded catalog, serve review-source with `python3 -m http.server 4181 --bind 127.0.0.1` and open `http://127.0.0.1:4181/`.

## Next index priorities

1. Obtain rights-reviewed municipal/property datasets and authorized operator feeds; expand commercial offices, retail, workshops and light-industrial coverage alongside art/live-work records.
2. Verify address/parcel matches and coordinates before geographic map pins or World terrain placement.
3. Add field histories, source-age review queues and operator correction intake. An indexed page's update date is not a current vacancy check.
4. Make batch ingestion incremental and establish API hosting/authentication/rate limits before connecting a public World client.
5. Bind one independently approved property asset to one World destination, then verify discovery-to-arrival and return navigation.

No production push, merge, DNS change, public API deployment, real inquiry, owner verification or payment was performed.
