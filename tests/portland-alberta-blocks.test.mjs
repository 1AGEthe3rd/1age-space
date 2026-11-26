import assert from 'node:assert/strict';
import test from 'node:test';
import {albertaBlocks,eastSidewalkRuns} from '../hq1/portland/alberta-blocks.mjs';
import {buildingFootprint,neighboringBuildings} from '../hq1/streetscape.mjs';
import {neighborhood} from '../hq1/venues.mjs';
import {stops} from '../hq1/portland/showrooms.mjs';

const walls=[...neighboringBuildings,...neighborhood.venues].map(buildingFootprint);
test('east arms clear the storefront footprints and MLK curb at all four streets',()=>{
  for(const {id,z,halfWidth} of albertaBlocks){
    for(const wall of walls)assert.ok(wall.x+wall.w<=6 || wall.x>=36 ||
      wall.z+wall.d<=z-halfWidth || wall.z>=z+halfWidth,id+' overlaps building');
    for(const [center,length] of eastSidewalkRuns())assert.ok(
      center+length/2<=z-halfWidth+.001 || center-length/2>=z+halfWidth-.001,id+' blocked by curb');
    const stop=stops[id];
    for(const wall of walls)assert.ok(stop.x<wall.x-.34 || stop.x>wall.x+wall.w+.34 ||
      stop.z<wall.z-.34 || stop.z>wall.z+wall.d+.34,id+' arrival blocked');
  }
});
