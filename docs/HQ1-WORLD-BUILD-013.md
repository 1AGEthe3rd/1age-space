# 1AGE World · HQ1 Build 013 — Driving realism

Base: Build 012 review head dc4654c2ce280f14fd77fe124a00eb3e0e0e9263 (PR #25). Build 012 GitHub validation run 45932729452 completed successfully. Production remains Build 009; Build 011 and 012 are separate open drafts. Preserve existing HQ1 and HQ2 destinations and the World/Space architectural separation.

## Changes
- Cockpit windshield uses a 512×225 transparent canvas texture on the actual cabin plane. Up to 100 simulated beads accumulate during observed rain or the existing rain preview, move across the glass, and evaporate when dry. Two moving wiper blades clear intersecting beads. Texture redraws are capped near 25 Hz and only occur in an active cockpit. This is a lightweight visual approximation, not a fluid simulation or an exterior wiper mesh.
- Wiper icon cycles off/slow/fast. Keyboard T and standard controller Back/Select (button 8) do the same. Wipers park when off. Existing pedal, steering, camera, headlight, indicator and gear mappings remain.
- Speaker icon and keyboard M toggle optional synthesized engine and tire noise. Pitch follows vehicle speed and throttle; road sound varies with wetness, cabin view affects volume. Audio starts muted and is silenced on leaving the vehicle, focus loss, hidden page and modal. Browser audio permission/user gesture may be required. No recordings, external media, microphone or autoplay. Actual sound playback not verified.
- Wet road handling uses a conservative approximate grip factor, gentler steering/acceleration and longer braking distance. Original dry handling, speed limit, vehicle collision geometry and lot access are retained. This is not a tire or suspension simulation.
- Right-hand-drive dashboard needles move with speed and engine load; gauges brighten with headlights. Existing headlights remain; true reflections, puddles and exterior windshield details are deferred.

## Verification
Three targeted regression cases passed in an isolated JS runtime: mode cycling, bounded droplets and sweep/parking behavior, and wet braking with unchanged dry input. Twelve module syntax checks plus HQ1 entry syntax passed (import/export declarations removed for parsing). In a seeded ten-second windshield check, off/slow/fast retained 100/62/53 beads, respectively; after 1.5 seconds dry with wipers off, beads cleared and wipers parked. These are deterministic model checks, not measured real-world rain. Full CI, actual browser rendering and audio playback, touch ergonomics, physical F310, nighttime driving, and existing destination/rail/aviation regressions remain required.

## Review
Stacked on PR #25. Test /hq1/?stop=javan-lot&weatherPreview=rain after a development preview is hosted; enter vehicle, cycle to cockpit, test each wiper speed, then toggle sound and headlights. Compare dry preview and live weather. No production, HQ2, shared controller, architecture, ownership, payments or migration changes. Coordinate a single release chain with Build 011 and 012, without independently merging redundant original drafts.
