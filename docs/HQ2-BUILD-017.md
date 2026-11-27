# HQ2 Build 017 — DCA public terminal life

Stacked on airport Metro return PR #32. Animated fictional travelers (six on mobile, ten on desktop), rolling luggage, two decorative original aircraft, seating and check-in detail. No collision changes, PDX changes, flight timing changes or real airline affiliation.

## Shared city time and schedules
The separate global city system owns real time, time zones, flight schedules, departure and arrival times and operational status. This build intentionally adds no clock, timetable, schedule provider, polling, local storage or second timing service. The scene uses animation delta only; the existing compressed demo journey remains unchanged. The public virtual departure sign is explicitly labeled DEMO and displays no fabricated flight times. Replace its presentation with the shared system's approved read-only data integration when its contract is available. No assumed endpoints or schemas.

## Validation
20 targeted isolated JS checks: 10 traveler path sweeps (400 samples each), 10 mocked scene lifecycle/density checks across two modes. Separate earlier syntax and path checks passed. Node test file added but not run under Node here. Browser/WebGL, screenshots, actual mobile FPS, physical controller and complete flight round trip remain unverified. Aircraft are static and illustrative. Sound and regional weather integration deferred; do not build a competing city weather/time service. NPCs decorative and nonblocking. No real bookings, fares or schedules.

Rollback: revert this PR after coordinated integration. No changes to main or deployment.
