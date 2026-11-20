# 1AGE Space — application Build 001

November 20, 2026 · Unpublished founder review

## Scope and result

1AGE Space is an independent commercial-property, art-space, live/work and virtual-space discovery application. It is no longer a social network. Worldwide indexing is the goal, not an achieved coverage claim. HQ1 Portland and HQ2 Washington, D.C. are being built separately; no city scenes, controls, transportation, existing HQ assets, homepage or checkout code were modified here.

This build implements a small usable discovery application and shared catalog foundation. It is not a property brokerage, live leasing service or complete worldwide index.

## Audit and preservation

- Existing repository: `1AGEthe3rd/1age-space`, public, default branch `main`, existing `CNAME` = `1age.space`, confirmed through the connected GitHub service.
- Existing local base: `e22851b`, an older 1AGE cosmic-homepage copy with title AGE and canonical 1age.com. There was no deployment workflow in that local checkout. A CNAME alone does not prove current hosting settings, registrar access or domain ownership.
- Original worktree `space-dev`, branch `development/space-property-001`, had untracked `property/index.html` and `property/data/properties.json`. Inspected both. The HTML referenced missing CSS/JS and was not a complete functioning application.
- Created isolated worktree `space-app-dev`, branch `feature/space-discovery-001`, from the existing repository base. The uncommitted original draft remains untouched. Reused its stable 5601 property ID and explicit unknown/demo distinctions in the new catalog.
- Root entry now opens the independent Space application in this branch. Legacy `/property/` forwards to that entry. Existing unrelated repository assets remain; the standalone review archive includes only the required Space files.
- Reused the official project SVG and locally pinned Three.js 0.180.0/MIT from the inspected 1AGE commerce prototype. No duplicate repository, new CDN dependency, public push, DNS change or production deployment.

## Implemented and tested

| Capability | Status |
| --- | --- |
| Search by name, street, city and descriptive terms | Implemented; browser and module tests |
| Commercial / art / live-work categories | Implemented; places can have multiple categories |
| Country and city filters; URL-restored search/selection | Implemented; country search and refresh tested |
| Save places and customize sign/accent | Browser-local; saved place and sign persistence verified |
| Property panels, stable IDs, sources and checked dates | Implemented; source panel verified |
| Separate physical/virtual status | Implemented; unknown entries excluded from verified availability |
| Original 3D exterior/interior template; rotate/zoom/keyboard | Implemented; browser-rendered and keyboard/button tested |
| 2D original floor-layout template | Implemented; not a real floor plan or geographic map |
| Fallback when viewer module cannot load | Tested with viewer blocked; search/inquiry and 2D view remained usable |
| Inquiry, owner/agent claim and virtual-space connection | Local draft demonstrations only; no submission/access grant |
| Export current search/draft as JSON | Implemented; visible draft contents verified |
| Validated property snapshot and SQLite FTS index/query | Implemented and tested separately from the browser adapter |
| Owner verification, authenticated editing and real leasing | Planned; not integrated |
| World arrival, payments, smart contracts, asset upload and live publishing | Not integrated |

All six physical statuses are unknown. No records are advertised as vacant or available. Three are founder-reported corridor candidates and three are name/address/use source checks. Source checks do not verify owner identity, current occupancy or leasing rights. No third-party photographs or floor plans were copied.

## Starter catalog

| ID | Place | Evidence |
| --- | --- | --- |
| `property-hq1-5601-ne-mlk` | 5601 NE MLK Jr Boulevard, Portland | Founder candidate; NorthLeftChef virtual concept only |
| `property-hq1-5775-ne-mlk` | 5775 NE MLK Jr Boulevard, Portland | Founder candidate |
| `property-hq1-3735-ne-mlk` | 3735 NE MLK Jr Boulevard, Portland | Founder candidate |
| `place-us-portland-openhaus-5020` | openHAUS Dream Street, Portland | Official operator contact page |
| `place-us-everett-artspace-2917` | Artspace Everett Lofts, Everett | Artspace and official property site |
| `place-gb-london-warton-150` | Warton House, London | Acme historical 2025 publication |

Primary-source URLs, factual-use limitations and checked dates are included in `space/data/catalog.json`. These are curated factual records and short original descriptions, not an acquisition license for bulk copying those websites. The Acme historical event does not establish current access or availability.

## Verification

The renderer redraws only when its view or appearance changes, capped at 30fps and a 1.5 pixel ratio; hidden/offscreen rendering pauses. Draft indexing is disabled in HTML metadata and robots.txt.

Eight Python tests cover catalog validation, duplicate IDs, source references, candidate/source distinction, coordinate evidence, relationships, FTS search/filtering/pagination and no-overwrite protection. JavaScript checks cover combined search terms, type/country/city filters, saved filtering, availability expiry and unsafe URLs. Syntax checks and `git diff --check` passed.

Browser tested: search for Everett, saved place restoration, country selection, empty verified-availability results, 2D/3D switching, original interior template, keyboard rotation, sign persistence, inquiry draft, owner-claim draft and external-space metadata draft. Phone portrait, landscape and compact laptop frames had content widths equal to their available widths: 375/835/1009 pixels respectively. Physical iPhone/Chuwi/NanoTE touch feel and performance are not verified by these frame checks. A blocked-viewer fixture confirmed usable 2D fallback.

## Run locally

From the review source folder:

```bash
python3 -m http.server 4181 --bind 127.0.0.1
```

Open `http://127.0.0.1:4181/`. This is a static app; no account, wallet, Cloudflare setup, API key or payment provider is needed for local review. Do not open index.html directly from the filesystem because catalog/module fetching needs HTTP.

```bash
python3 scripts/property_index.py
python3 -m unittest discover -s tests -v
node tests/catalog.test.mjs
python3 scripts/property_index.py --build-db /tmp/space-index-review.sqlite3
python3 scripts/property_index.py --query-db /tmp/space-index-review.sqlite3 --query studio --limit 20
```

The database builder refuses an existing destination. Use a fresh output path for another snapshot. Runtime databases are ignored by Git and excluded from the review package. The browser currently searches the six-record JSON catalog; it does not call the SQLite query tool.

## Next practical build

1. Review the discovery interface and template interaction on the founder's devices.
2. Add a paginated read API behind the catalog interface, using the validated search index rather than sending a worldwide dataset to the browser.
3. Add permitted dataset connectors, deduplication review and field-level evidence. Validate real coordinates and parcel identities before map pins or footprints appear.
4. Add authenticated owner/agent claims, private evidence storage and moderation. A rights checkbox is not verification.
5. Attach the separately approved HQ building assets and arrival destinations using stable property IDs. No model is currently a replica of those places.

Publishing, real inquiries, listing intake, occupancy agreements and payments remain disabled pending the separate reviews and authorization defined in the founder handoff. No fee or revenue assumptions were introduced.
