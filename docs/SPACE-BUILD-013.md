# Space Build 013 — Address search to 3D building scenes

Development branch: feature/space-address-3d-search-013. Not deployed.

Added an explicit-submit address search to the existing building viewer. Search never fires on typing. Up to 50 source-reported results appear; linked results load a bounded scene around the associated footprint, select its ID and expose the existing address information panel. Unmatched results explain that no model association is assumed. Empty, unavailable-service and scene-error states are provided. DOM text insertion avoids rendering imported HTML. Saved area previews remain usable without the API.

The new read-only /api/buildings/scene?id= route loads at most 200 source footprints around the selected geometry and ensures the selected feature is present. It preserves inferred address provenance and illustrative 3-metre heights. This is not a walkable or verified reconstruction. Existing 53,500 address records, 6,011,627 footprints and 408 curated places remain unchanged.

The loopback-only server can optionally serve a fixed allowlist of viewer assets for same-origin search. It does not expose database files, arbitrary source files or directory listings. Static hosting without the backend does not provide live address search. Production HTTPS hosting, rate limiting and operational review remain pending. No DNS, payments or production changes were made.

Run from the source repository:

```sh
python3 -m building_engine.server --db /path/to/buildings.sqlite3 --addresses /path/to/addresses-012.sqlite3 --web-root .
```

Open http://127.0.0.1:4184/buildings.html. The viewer provides an explicit return link to 1age.com; the complete curated Space frontend remains in the repository and its normal hosting. This server is an optional local test service, not a replacement deployment.

Verification: automated API tests cover bounded scene loading, selected-ID preservation, malformed/unknown IDs, unsupported filters, allowed HTML and denied database/source/traversal paths. Existing Python and Node checks are retained. A measured real-data scene query is recorded in reports/address-scene-013.json. New browser interactions and WebGL rendering have not been visually verified; prior preview access restrictions remain unresolved. Do not treat backend tests as mobile visual approval.
