import test from 'node:test';
import assert from 'node:assert/strict';
import {readObservation,solarHeight} from '../space/shared/weather/observations.mjs';
const now=Date.parse('2026-11-25T20:00:00Z');
test('station reports expire independently of the city clock',()=>{
  for(const [text,kind] of [['Light Rain','rain'],['Snow Showers','snow'],['Mostly Cloudy','cloud'],['Clear','clear']]){
    const report={timestamp:new Date(now-3600000).toISOString(),textDescription:text};
    assert.equal(readObservation(report,now).kind,kind);
    assert.equal(readObservation(report,now+3*3600000),null);
  }
  assert.equal(readObservation({timestamp:'invalid',textDescription:'Cloudy'},now),null);
});
test('Portland local midday and midnight produce different solar elevations',()=>{
  assert.ok(solarHeight(now,45.56,-122.67)>.1);
  assert.ok(solarHeight(now+12*3600000,45.56,-122.67)<0);
});
