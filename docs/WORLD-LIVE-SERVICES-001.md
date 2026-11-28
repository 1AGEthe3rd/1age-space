# 1AGE World Live Services — Activation 001
Base: production main 731006cddfc2435cbcb1d8816d91088988788c9d. Separate shared service, not 1AGE Cash or Identity. No changes to released scenes, payments, DNS or booking providers.

## Staging deployment
Railway project creation for "1AGE World Live Services" in the existing studio workspace was rejected with a free-plan resource provision limit. No project, service, deployment or domain was created; no paid upgrade or existing resource change was made. Once hosting is available, create a dedicated staging service from this reviewed branch, root directory /world, Dockerfile at that root, port 8080 (or host-provided PORT), healthcheck /health. Docker image runs as non-root and contains only schedule service code and the station registry. Configure WORLD_ALLOWED_ORIGINS to https://1age.space,https://1age.world when serving the approved browsers. Keep provider flags false initially. Public network exposure requires hosting review and HTTPS.

## Endpoints
GET /health: liveness, not provider readiness.
GET /v1/time: server UTC epoch milliseconds; client timezone formatting and latency compensation are separate integration work. No city-specific server needed.
GET /v1/rail/arrivals?station=pdx-killingsworth: existing validated station contract. Unconfigured or exhausted provider returns HTTP 503 unavailable, never fictional arrivals.
Provider flags TRIMET_LIVE_ENABLED and WMATA_LIVE_ENABLED default off. Require respective credential (TRIMET_APP_ID / WMATA_API_KEY) and positive integer DAILY_REQUEST_LIMIT (TRIMET_DAILY_REQUEST_LIMIT / WMATA_DAILY_REQUEST_LIMIT) set after reviewing agency limits. WMATA stations remain unverified and fail closed. All credentials are server-side secret variables, never GitHub or chat. Register at https://developer.trimet.org/appid/registration/ and https://developer.wmata.com/signup and accept the applicable terms before use.
 
## Security and limitations
One process, global 1200-request/minute fixed-window limiter, existing per-station 30-second cache/throttle, and explicit per-provider UTC-day request budget. In-memory quotas reset on restart; not a persistent quota or hard billing cap. Before public production enablement require single replica, verified provider limits/terms, upstream quotas or persistent limiter, edge abuse protection, monitoring, and live feed tests. CORS is not authentication. Real schedules, official transit attribution, city scene endpoint mounting, client clock calibration and air-service integration are pending. Existing demo schedules remain distinct. No live service or real feed is active in this build.

## Verification
Five added Node tests cover clock, CORS, methods, missing credentials/flags/budget, daily quota reset, global throttling and unavailable arrivals. CI includes these tests; Docker build/run and external hosting must be verified after capacity is available.
