// Local WGS84 tangent-plane approximation for neighborhood measurements.
// Use a new origin for distant neighborhoods. Gameplay currently uses compressed blocks.
export function localMeters(point, origin) {
  const radians = Math.PI / 180;
  const latitude = origin.latitude * radians;
  const eccentricitySquared = 0.0066943799901413165;
  const denominator = 1 - eccentricitySquared * Math.sin(latitude) ** 2;
  const primeVertical = 6378137 / Math.sqrt(denominator);
  const meridional = primeVertical * (1-eccentricitySquared) / denominator;
  return {
    east: (point.longitude-origin.longitude)*radians*primeVertical*Math.cos(latitude),
    north: (point.latitude-origin.latitude)*radians*meridional,
  };
}
