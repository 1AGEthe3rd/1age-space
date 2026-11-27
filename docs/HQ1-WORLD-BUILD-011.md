# 1AGE World · HQ1 Integration Build 011
November 26, 2026. Review candidate only. The live Build 009 base remains 62907d943a7222ecd4d34b9ecbf9e5d168527d3b.

## Pinned inputs
- PR #19 reconstruction: 63f2f68e970cdaedc7c7063779ffc16ac6ed135c
- PR #21 weather: 170f926da34f48bd622c66922dc273456641968d
- PR #22 driving: 7fd5e555dd2c5be54a8467930600eb501127b761
- PR #23 airport/rail: d97102bea56dd47dffc1d74175659114afbb6a9a

The candidate snapshot is a new single-parent commit based on the protected main. Original drafts and branches were not merged or changed. All 23 nonoverlapping source files were copied as exact blobs; HQ1 entry code was reconciled to retain the asphalt material registry, armed physical controller trigger selection, and airport/rail route dispatch. Architecture PR #20, World Web #7 and Godot #11 remain independent. Existing hosting and all HQ2 files remain untouched. Do not merge multiple redundant review branches: coordinate one integration route and review any later updates to their pinned heads before approval.

## Combined-weather fix
Precipitation now updates after the active camera moves, rather than before the driving camera is placed. When using the cockpit camera, rain streaks in a 2.5 m radius near the camera collapse to zero-length segments while outdoor rain stays visible. This is a bounded visual approximation, not windshield droplets, a roof collision system, or true reflections. Road wetness remains independent of the camera mode.

## Verification
18/18 targeted assertions passed in an isolated JavaScript runtime on the combined branch modules: 5 driving/lot, 4 station/transfer, 6 flight, and 3 rain checks (mock Three.js objects, reversible wet materials, cockpit exclusion, cleanup). These are not the complete Node/Python suites, not a browser renderer check, and not physical device testing. Full CI, actual visual QA, touch/F310, MAX/airport round trips, NLC/NNB independent domain returns and screenshots are required before approval. No real fare, sale, rental, property claim or ownership issuance.

## Review paths (only after a preview is hosted)
- /hq1/ original city
- /hq1/?weatherPreview=rain
- /hq1/?stop=javan-lot&weatherPreview=rain
- /hq1/?rail=yellow
- /hq1/?rail=red&station=rose-quarter-tc
- /hq1/?airport=pdx
- /hq1/?airport=dca

Skidmore identification and exact 5601/Javan geometry remain unresolved. Airport and rail geometry and distances remain illustrative. DCA-to-HQ2 links are one-way from terminal; the return from HQ2 still requires the direct airport entry. No migration, DNS, merge or deployment was authorized. Preserve the reserved studio locations, original World environment, and existing routes. Close this draft to withdraw it; after any approved integration use a history-preserving revert and review later changes first.
