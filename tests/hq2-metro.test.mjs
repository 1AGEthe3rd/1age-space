import test from 'node:test';
import assert from 'node:assert/strict';
import {createMetro,stops} from '../hq2/metro.mjs';

test('Metro shuttle requires boarding, stops at endpoints and returns to Howard Road',()=>{
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){}})})};
  let train;
  try {train=createMetro()} finally {
    if(previous===undefined) delete globalThis.document;
    else globalThis.document=previous;
  }
  assert.equal(train.atStreet,true);
  assert.equal(train.clear(0,0),false);
  train.depart(1);
  assert.equal(train.riding,false);
  train.toggle();
  assert.equal(train.clear(0,0),true);
  const start=stops.indexOf('Anacostia');
  const itinerary=[...Array.from({length:stops.length-start-1},(_,i)=>[1,start+i+1]),...Array.from({length:stops.length-1},(_,i)=>[-1,stops.length-2-i]),...Array.from({length:start},(_,i)=>[1,i+1])];
  for(const [direction,index] of itinerary) {
    train.depart(direction);
    assert.equal(train.riding,true);
    train.toggle();
    assert.equal(train.aboard,true);
    train.tick(6);
    assert.equal(train.name,stops[index]);
    if(index===0||index===stops.length-1){
      train.depart(direction);
      assert.equal(train.riding,false);
    }
  }
  train.toggle();
  assert.equal(train.name,'Anacostia');
  assert.equal(train.atStreet,true);
  for(const name of stops){train.reset(name);assert.equal(train.name,name);assert.equal(train.aboard,false);assert.equal(train.riding,false);}
});
