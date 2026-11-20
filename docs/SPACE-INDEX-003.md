# 1AGE Space — index development 003

November 20, 2026 · Unpublished

## Delivered

The catalog now contains 40 places: 37 source-checked places and 3 founder research candidates, across the existing 16 cities and 6 countries. Ten new London commercial workspace properties were added from individually cited Workspace operator pages. The catalog has 45 source records. Existing property records/IDs were preserved.

This is an intermediate step toward the proposed 100-record milestone, not completion of that milestone. It deliberately adds commercial office coverage and a reusable ingestion path rather than labeling more cultural venues as commercial offices without evidence.

## Repeatable reviewed CSV intake

`scripts/operator_csv.py` converts a strict CSV metadata template into a staged batch compatible with the existing `catalog_batch.py` validation and merge process. The included fixture is `space/data/feeds/workspace-reviewed-20261120.csv`; its produced batch is `space/data/batches/workspace-20261120.json`.

The converter requires stable record/source IDs, structured addresses, dated primary-source citations, commercial-use classifications and explicit rights notes. It rejects unknown columns, malformed rows, future evidence dates, unsafe source URLs and unrecognized space uses. It never imports availability, rent or pricing claims. The merge process retains existing conflict/duplicate protection. A replay of the included feed adds zero duplicate records.

This CSV is manually reviewed operator-published factual metadata. It is not a licensed live feed, an operator partnership, a general web scraper or an automated refresh service. New providers need evidence and reuse review before their metadata is added.

## Commercial classification

The optional `spaceUses` field distinguishes supported uses: office, retail, industrial, warehouse, restaurant, workshop, studio, coworking, mixed_use and live_work. Only office/studio uses are populated for this batch; the other supported codes do not imply that records of those types have been collected or that zoning/permitted use has been verified.

Historic factory names are not grounds for classifying a current office building as industrial. Existing art/live-work categories remain unchanged. Records without this new field are unclassified at that level, not automatically inferred.

The SQLite search snapshot indexes these uses. The local read API accepts `use=office` or another supported use; for example `/api/space/properties?use=office&limit=20`. Browser text search includes the new terms; no layout redesign or new UI filters were introduced.

## Verification

26 Python tests and existing JavaScript search checks passed. Tests cover feed replay, invalid evidence/URLs/uses, rejection of unreviewed columns, unknown availability, full-text search and office-use filtering alongside the existing API/import/World-export checks. Browser layout testing was not repeated because this iteration changes data and index tooling, not layout.

All 40 records retain unknown physical availability, unconnected World destinations and null coordinates. No real listings, prices, leases or model permissions were fabricated. World exports continue to contain stable IDs with unconnected spatial bindings. No HQ1/HQ2 scenes, public website, DNS or payment functionality changed.

## Replay the pipeline safely

Use fresh output paths:

```bash
python3 scripts/operator_csv.py --csv space/data/feeds/workspace-reviewed-20261120.csv --out /tmp/workspace-review-batch.json --batch-id workspace-reviewed-20261120
python3 scripts/catalog_batch.py --batch /tmp/workspace-review-batch.json --out /tmp/space-next-review.json
python3 scripts/property_index.py --input /tmp/space-next-review.json --build-db /tmp/space-next-review.sqlite3
python3 scripts/space_api.py --db /tmp/space-next-review.sqlite3
```

The current catalog already contains the fixture records; replay reports zero additions. Incoming changes to an existing record require explicit review rather than silent replacement.

## Next data milestone

Continue toward 100 sourced records with more geographic/operator diversity, particularly retail, workshops and industrial properties. Prioritize a rights-reviewed municipal or authorized operator dataset for the first recurring source integration, and verify coordinates/parcel identities before map or World placement. The current repeatable CSV intake is ready for reviewed metadata, but it does not supply an ongoing external feed on its own.
