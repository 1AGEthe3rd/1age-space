// Configure each city's station and coordinates in its own entry point.
export function readObservation(properties,now=Date.now()) {
  const time=Date.parse(properties?.timestamp);
  if(!Number.isFinite(time)||time>now+300000||now-time>3*3600000)return null;
  const description=properties.textDescription?.trim();
  if(!description)return null;
  const snow=/snow|flurr|ice pellets/i.test(description);
  const rain=/rain|drizzle|showers|thunderstorm/i.test(description);
  const cloud=/cloud|overcast|fog|haze|mist/i.test(description);
  return {time,description,kind:snow?'snow':rain?'rain':cloud?'cloud':'clear',
    fog:/fog|mist|haze/i.test(description)};
}

export function solarHeight(now,lat,lon) {
  const date=new Date(now), days=(now-Date.UTC(date.getUTCFullYear(),0,1))/86400000;
  const rad=Math.PI/180,decl=23.44*rad*Math.sin(2*Math.PI*(days-80)/365.25);
  const hour=date.getUTCHours()+date.getUTCMinutes()/60+lon/15;
  return Math.sin(lat*rad)*Math.sin(decl)+Math.cos(lat*rad)*Math.cos(decl)*Math.cos((hour-12)*15*rad);
}
