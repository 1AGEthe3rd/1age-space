# Shared property index and HQ connection contract

1AGE Space owns discovery metadata. HQ1/HQ2 own their city scenes. Share IDs and asset references; do not fork the core catalog per city.

## Entity boundaries

| Entity | Relationship / intended fields | Build 001 |
| --- | --- | --- |
| Property | Stable internal ID; structured address, country, coordinates with evidence, classifications, sources/dates | Six records |
| Building | `propertyId`; exterior assets, footprint, representation accuracy and rights | Reserved empty collection |
| Unit | `buildingId`; unit identity, use, authorized interior | Reserved empty collection |
| PhysicalListing | `propertyId`; authorized party, availability evidence, dates, price/currency/terms | Empty; no verified listings |
| OwnerClaim | `propertyId`; verified owner/agent, private evidence, review status | Local UI rehearsal only |
| VirtualSpace | Optional `propertyId`; creator, representation, asset rights, World destination | One original NLC demo template |
| VirtualOccupancy | `virtualSpaceId`; authorization, disclosed period/termination/renewal | Reserved; no reservations |
| LeaseApplication | `propertyId`; private applicant data, owner review and agreement references | Local draft only |
| CreatorAsset | Creator, origin, license, portable ownership and permitted use | Reserved; no uploads |
| WorkRequest | Optional `propertyId`; scope, commissioning party and confirmed funding | Local interest draft only |
| BusinessProfile | Business identity, independent Page/Shop references | Reserved; no real business occupancy claims |

Private claim, application and financial records must never be added to the public seed JSON. Empty collections define relationship names for later private service implementations, not production schemas or APIs. Property IDs are identifiers, not ownership tokens or property rights.

The validator checks available snapshot relationships and evidence. It is not an authorization service. A future `authorized` virtual status must be backed by a reviewed agreement and permissions service before exposure through the app; it is not used in the current catalog.

## Current HQ attachment point

Use `property-hq1-5601-ne-mlk` for the existing founder-selected 5601 candidate. Keep the same ID when the address is independently verified. `vs-nlc-template` is an original virtual café study, not a replica or authorization to occupy 5601 physically. Other HQ1 candidate IDs are in the catalog. HQ2 has no fabricated seed addresses: add sourced Anacostia records through the same schema when available.

To attach a future approved representation, propose a Building record with `id`, `propertyId`, `representation` (`surveyed`, `approximate` or `original_template`), `assetUri`, `assetRights`, `sourceIds` and `updatedAt`. A World connection should have an approved URL/arrival key and a tested return URL. Leave `worldDestination` null until that arrival works. The existing World button intentionally opens its main entrance.

`GET /?property=<stable-id>` in the static app selects a catalog record; filters can be combined in query parameters. The export button returns a public JSON subset with matching property/source/virtual-space references for inspection. This subset is a data handoff, not an automatic import into Godot or a replacement for the complete catalog.

## Geography and growth

Addresses support country/region/city/postal code independently of US parcel formats. Coordinates remain null until sourced. Do not derive identity solely from street text: one address can contain multiple buildings/units and can change. Add jurisdiction-scoped external IDs and reviewed alias matches for parcel data; never silently merge uncertain matches.

The initial categories are commercial, art and live/work; a property can have more than one. Future taxonomy revisions should be versioned. There are no blockchain participation requirements to search the catalog.

Worldwide collection should progress by rights-reviewed feeds: municipal open datasets where reuse terms permit, authorized operator feeds, owner/agent submissions and moderated corrections. Each connector must record origin, source feature ID, license/use terms, field provenance, fetch/check date, update cadence and deletion/correction policy. Metadata permission does not grant photographic or 3D reproduction rights. No unattended global scraping is configured.

The current browser adapter loads a small JSON seed. SQLite FTS snapshots provide a tested pagination/filter boundary for the next service, not a claim of worldwide throughput. Move search to a paginated read API, retain source attribution and stale-listing rules, add incremental jobs and monitoring, then evaluate geospatial storage and region sharding using measured scale. Snapshot building currently reads the full input; streaming/incremental ingestion and geographic search are future work.

## Availability rule

`unknown` is the default physical status. `available` requires a linked authorized PhysicalListing, cited evidence, a check date and an unexpired review deadline. UI filters re-evaluate expiry at read time. Source-checked property identity and physical availability are separate assertions. Virtual demos never qualify a place as physically available.

No built-in payment or shared occupancy contract is active. Reuse the separately developed Virtual Checkout foundation only after authorized offers, identity, provider eligibility and agreement handling exist. Keep Cash credits, USD/USDC and the proposed $1AGE token distinct.
