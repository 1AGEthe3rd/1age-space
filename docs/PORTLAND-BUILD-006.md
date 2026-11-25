# Portland Build 006

## Yellow Line

Choose **MAX Yellow Line** in HQ1 to transfer to the N Killingsworth St platform on the Interstate Avenue corridor. Board at the open doors and choose north or south. The doors close, the car accelerates and slows, and the doors open at the next station. Disembark to explore the platform. The **Return to HQ1** link transfers to the MLK/Killingsworth street scene. Four adjacent stations are modeled with compressed geometry and travel times. The service is a simulation. TriMet train positions, schedules and alerts are outside this release.

[TriMet Yellow Line](https://trimet.org/max/) · [TriMet station census](https://trimet.org/about/pdf/census/2025spring/route_stop_level_passenger_census_report_%28sunday%29.pdf)

## Weather

HQ1 streets and the outdoor MAX scene use the latest Portland International Airport observation from the National Weather Service. The station label shows the observation time in Portland time. Station reports may differ from conditions on MLK. The client refreshes every 15 minutes and can reuse a report under three hours old. When observations are unavailable the scene uses a neutral sky and local solar lighting. Darkness, cloud cover, fog, rain and snow affect the rendered scene. Precipitation is suppressed in the rail car and the arcade and showroom interiors.

The shared renderer in `space/shared/weather/city-sky.mjs` takes a scene, lights, status element, station code, coordinates and time zone. Portland supplies its own configuration. Other city entry points can adopt the renderer independently. No location permission or API key is needed.

[NWS observation API](https://www.weather.gov/documentation/services-web-api) · [Portland observation](https://api.weather.gov/stations/KPDX/observations/latest)

## Review

Direct development route: `/hq1/?rail=yellow`. Ride controls support touch buttons, keyboard and the existing gamepad navigation. E boards or leaves; N and Shift+S select the adjacent station. Actual Logitech F310 and iPhone hardware testing is pending. The weather screenshot uses a controlled rain observation. Roll back this increment by reverting the Build 006 commit.
