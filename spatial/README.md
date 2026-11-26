# Spatial Design 003 — Space Global Discovery Center

Preview: spatial/index.html on this development branch, served through a static HTTP server. The root entry, HQ1 and HQ2 remain untouched.

The center is a walkable cosmic observatory: circular architectural shell, recessed lighting, layered glazing, textured stone floor, a rotating interactive Earth, and three exhibition pavilions. Portland and Washington pavilions lead to the existing districts; the property pavilion opens the existing catalog. The miniature buildings are conceptual exhibits, not real property replicas. The globe opens a destination chooser; geographic picking and worldwide property indexing are future work.

## Quality and input
HQ1 is the quality benchmark. Reuses its local Three.js renderer and gamepad modules, 64-degree first-person camera and 1.75m eye height. Repeated floor strips use instancing, as HQ1 batches repeated geometry. Page Build 002 walking and architecture modules are ported from commit c1414ed39f45d4c0ea7b87895c708f2f61e84b49 with local import paths and eye height adjusted. The small Earth texture is embedded from the same Page snapshot; no external downloads. Shared modules are pinned copies for this prototype, not a centrally distributed library yet.

Controls: WASD or left stick moves, right stick or drag looks, Shift runs, E or interact opens nearby destination, tap nearby station to select, center logo opens menu, home resets. Standard gamepad mapping through the existing input module. Select render resolution in menu.

## Release gates
- Browser render test, Earth image decode/orientation, shader/material inspection, screenshots at arrival and each pavilion.
- Compare visual quality against current HQ1 using the same device, check frame times and iPhone portrait/landscape controls, and test actual controller hardware.
- Verify all destination links and collision boundaries.
- Review latest main and other PRs before merge. No automatic merge, domain cutover, HQ controller replacement, DNS or production deployment.

Current limitations: procedural architecture and a low-resolution existing Earth texture, no measured visual parity with HQ1, no browser or device validation, no live vacancy claims. HQ1/HQ2 existing return links still lead to the production Space root; later approved cutover can connect them to this center.
