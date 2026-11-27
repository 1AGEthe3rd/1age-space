// Official public source registry. These are documentation/public reference URLs,
// not active API endpoints or evidence of a configured provider connection.
export const worldScheduleSources=Object.freeze({
  'us-or-portland':Object.freeze({
    timeZone:'America/Los_Angeles',
    rail:{provider:'TriMet',format:'GTFS + GTFS-Realtime',documentation:'https://developer.trimet.org/GTFS.shtml',status:'not-connected'},
    airport:{code:'PDX',reference:'https://www.flypdx.com/flights/',status:'not-connected'}
  }),
  'us-dc-washington':Object.freeze({
    timeZone:'America/New_York',
    rail:{provider:'WMATA',format:'GTFS + arrival predictions',documentation:'https://developer.wmata.com/',status:'not-connected'},
    airport:{code:'DCA',status:'not-connected'}
  })
});
export const schedulePolicy=Object.freeze({
  realByDefault:true,
  allowExplicitSimulation:true,
  realPredictionMaxAgeMs:120000,
  publishedScheduleMaxAgeMs:604800000,
  businessHoursMaxAgeMs:2592000000,
  // Virtual elapsed travel is distinct from real-world scheduled time.
  simulatedDurationIsIndependent:true,
  businessClosureDoesNotBlockPublicExploration:true,
  bookingEnabled:false,
  paymentsEnabled:false
});
