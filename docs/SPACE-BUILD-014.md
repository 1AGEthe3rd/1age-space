# Space Build 014 — Paginated address discovery

November 22, 2026. Branch feature/space-search-paging-014. Development only.

Address search now supports source-reported city filters, an optional associated-footprint filter, and stable record-ID keyset pagination. Each request returns at most 100 records (viewer requests 50), with a next cursor only when another matching row exists. There is no arbitrary total-result cap or growing offset. Stable ID ordering replaces relevance-rank ordering for this address browsing endpoint; general 1AGE Search is unchanged. Punctuation is not treated as a wildcard. Invalid cursors/filter types are rejected.

The 3D viewer adds city/footprint controls and a Load more action. A new explicit search resets the cursor and results, while subsequent pages preserve the submitted filters. Response-version checks reject stale results. Search runs only on submit or Load more. A matched address still opens the bounded 3D scene from Build 013; unmatched records remain searchable unless filtered out. The associated-footprint filter is not a verified-property or availability filter.

Data remains 53,500 source-reported addresses, 45,818 inferred associated footprints, 6,011,627 underlying footprints and 408 separately curated locations. No new import, production change, DNS change or financial action occurred in this build.

Validation: 66 Python tests passed; existing Node geography/catalog checks and JavaScript syntax checks passed. Real-data traversal reached all 15,199 linked source-reported Portland address rows across 152 pages of at most 100 without duplicate IDs. See reports/address-paging-014.json. These are address rows, not distinct buildings or official municipal-boundary coverage. Visual browser/mobile verification remains pending; API tests do not substitute for that review.

API example (local configured service):

/api/addresses?q=Main&city=Portland&linked=true&limit=50&after=0

Pass nextCursor as after for the next page while retaining filters. Concurrent upstream reimports or a replacement database can change result sets; this is not a signed frozen search session. Future million-address datasets may require additional query planning and city expression indexes. No production performance guarantee is inferred from this local fixture.

The broader unfinished handoff is tracked in HANDOFF-STATUS-014.md.
