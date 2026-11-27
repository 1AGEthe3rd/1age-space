# HQ1 Driving Build 001 — virtual Javan test drives
Base: 62907d943a7222ecd4d34b9ecbf9e5d168527d3b. Separate from reconstruction PR #19 and weather PR #21. No shared or HQ2 edits.

## Controls
Touch: original left joystick steers, right joystick adjusts camera; two hold-to-drive pedal icons, camera, gear, lights, left/right indicators and exit icons are arranged in the matching driving gamepad overlay. Hide header/footer text while driving. Accessible names remain nonvisual. Walking joystick behavior unchanged.
Keyboard: WASD or arrow keys, Space brake, V camera, R gear at rest, H lights, Q/C indicators, E enter/exit at rest.
Standard controller (e.g. F310 XInput): left stick steering, right stick camera, RT accelerator, LT brake, Y gear, X lights, bumpers indicators, stick press camera, A enter/exit. Analog triggers require an armed standard gamepad. Blur, disconnect and orientation resets release controls.

## Cameras
Third-person chase, forward/bonnet view and simple cockpit with steering wheel on the right, gauges, dash, seats, mirror and wheel animation. Prototype vehicles represent Japanese-style vans, not licensed or exact replicas or current real stock. Existing speed/steering dynamics remain; no transmission simulation, traffic AI or comprehensive physics engine.

## Lot and real-world status
Javan Imports' official pages https://www.javan-imports.com/about and https://www.javan-imports.com/contact establish the business and 4545 NE MLK address; https://www.javan-imports.com/ describes Japanese imports. Founder reports a fenced small parking lot and opening for cars. The new original fence, lot, gate and driveway are approximate in compressed gameplay coordinates, not verified real-world dimensions or gate position. No imagery, vehicle inventory, commercial claims, real payments or booking. Preserve both original street vehicles; add a third demo van in the lot. New arrival: /hq1/?stop=javan-lot. Collision footprint sampling permits only the modeled driveway and lot beyond existing roads.

## Review
Fetched branch modules exercised together in an isolated JS runtime: the three new regression cases passed (gate/fence/road bounds, accelerate and turn from lot then brake, reverse and parked vehicle collision). This is not the full Node/Python suite or a browser rendering check. Repeat with node --test hq1/portland/javan-lot.test.mjs. Validate existing routes, all three views, icon layout, simultaneous touch, physical controller, desktop and iPhone Safari before release. Check actual lot dimensions and fence orientation against suitable references later. No merge/deployment until approved. Rollback by reverting the review commit(s) on a fresh branch after integration.
