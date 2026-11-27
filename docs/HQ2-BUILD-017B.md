# HQ2 Build 017B — Real people only

Supersedes the simulated traveler feature of Build 017. DCA terminal human occupancy is empty by default. Existing first-person solo flight remains usable, with empty cabin seats; no claim that the current local player is authenticated. Decorative aircraft and terminal details remain. No fake passengers, staff, handles, accounts or occupancy counts.

## Proposed shared architecture (not implemented)
1AGE Page supplies public member profile/handle and avatar preferences; shared 1AGE Identity authenticates the account. An authenticated presence service, not Page directory membership, determines who is actually in a virtual scene or flight instance. Use stable subject identifiers server-side, not editable handles. Scope presence by virtual scene and flight instance, expire disconnected sessions, validate movement and access, support privacy controls and blocking. Expose only opt-in public profile information, not emails, identity tokens, actual physical travel or GPS location. A real scheduled departure is not evidence of a member boarding a virtual flight. Keep schedules separate from presence. Never populate empty seats with NPCs or infer users from registration counts.

No provider endpoints or authentication claims were invented. Multiplayer, session coordination, shared boarding, seat assignment and verified Page avatars are not implemented. Existing first-person demo is local. No change to schedules, flight model, booking, fares, PDX, HQ2 streets or Metro. Do not remove scenery or prior branches.

Validation: eight isolated mocked checks, including repeated zero-NPC occupancy, retained aircraft, active/inactive lifecycle, airport module syntax. Two Node test cases added but not run in Node; full browser/device checks pending. Rollback by reverting this PR after integration.
