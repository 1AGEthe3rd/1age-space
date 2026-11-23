# Space Build 009 — creative-space structure foundation

Branch `feature/space-creative-structure-009`, based on virtual observatory and intake build `38103d3`. Unpublished. The accepted master direction is recorded in `SPACE-MASTER-DIRECTION-20261121.md`.

## Read-only audit and comparison

| Handoff area | Actual state |
| --- | --- |
| Independent source repository | `1AGEthe3rd/1age-space`; existing history and Build 008 preserved |
| 3D destination | Local tested virtual observatory, selectable cities, holographic property details, generic templates |
| Existing index | 408 location records, 18 cities, 6 countries; 347 source-provided points |
| Permanent building records | 0; existing location records are not automatically verified buildings |
| Separate units | 0 |
| Physical listings | 0; no verified vacancy/rental/booking offer |
| Business/tenant records | 0 |
| Owner/manager claims | 0; current frontend creates local demonstration drafts only |
| Virtual spaces | 1 original demonstration; no authorized commercial occupancy |
| Portland pilot | 6 indexed locations; World-specific destinations remain unconnected |
| Vancouver WA pilot | 0 indexed locations; Vancouver BC's 257 locations are a separate geography |
| Property search | Existing name/address/city/category/use search, country/city filters, saved places, read-only paginated local API |
| Creative equipment/amenities/capacity | Not populated or integrated |
| Property/World bridge | Data-only bindings; source coordinates retained; no scene positions or automatic activation |
| Hosting/domain | Local CNAME says `1age.space`; ownership, current DNS and production hosting remain unverified |

The public HTTPS lookup failed, local DNS resolution failed, and the GitHub connector rejected the Pages-settings endpoint as unsupported. These failures do not establish that the domain itself is down. No DNS or hosting change was made.

Craigslist, Zillow and LoopNet integrations are not implemented or authorized by this build. Existing municipal imports are retained with their source/version/licence information. No restricted listing extraction was attempted.

## Smallest safe next build, implemented

Added `scripts/space_structure.py`, a standalone contract prototype for explicit building/unit/listing records. It validates:

- Unique primary building addresses and entity IDs; separately linked units.
- Creative disciplines and hour/day/week/month/long-term duration enums.
- Rental/sale/booking records attached to the correct building/unit.
- Integer minor-unit pricing and explicit currency/billing period when a rate is supplied; null rate remains unknown.
- Unknown/occupied/available/temporarily available/off-market/expired status distinctions.
- Authorization declaration, availability-scoped source evidence, and verification/expiry dates before returning an eligible listing.
- Unit-level claim scope never matching the whole building or a different unit.

The scope helper is a policy primitive only: it does not authenticate anyone, verify an owner, or independently grant access. Callers must perform those checks in a trusted backend before using it. Likewise, contract validation is not proof an uploaded authorization declaration is true.

The contract and listing discovery helper are **implemented and unit-tested, not connected to public listing management, the local HTTP API, or the 3D controls**. No fictional test unit, price, claim, or listing was inserted into the real catalog. The entire existing catalog and 3D presentation are unchanged.

## Verification

From this checkout:

```sh
python3 -m unittest discover -s tests -v
node tests/geography.test.mjs
node tests/catalog.test.mjs
```

The Python suite has 35 passing tests, including six new contract cases for hourly temporary discovery, expiry, unknown status, insufficient evidence, cross-building references, duplicate buildings, noninteger prices, and tenant scope isolation. Node geographic/catalog checks also pass. Existing records remain at 408; no new property count or deployment is claimed.

## Next build

Collect attributable Portland/Vancouver WA building and unit facts, then create explicit building links only after reviewing primary addresses and unit designations. Integrate the new contracts with a reviewed versioned schema, read-only discovery endpoints, and virtual filters. Secure shared identity and evidence-reviewed authorization must precede self-service write access. Broader source/owner partnerships, current availability feeds, equipment/amenity filters, authorized interior models, and production deployment remain future work.
