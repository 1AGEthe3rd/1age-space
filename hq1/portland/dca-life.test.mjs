import test from 'node:test';
import assert from 'node:assert/strict';
import {createDcaLife} from './dca-life.mjs';
class Node {
 constructor(){this.children=[];this.visible=true;this.rotation={};this.position={set(){}};this.scale={set(){}};}
 add(node){this.children.push(node);}
}
const T={Group:Node,Mesh:Node,SphereGeometry:Node,MeshStandardMaterial:Node};
const box=(parent)=>{const mesh=new Node();parent.add(mesh);return mesh;};
const sign=()=>{};
test('terminal starts empty and cannot generate fictional travelers',()=>{
 const life=createDcaLife(T,new Node(),new Node(),box,sign);
 for(let i=0;i<100;i++){life.update(.05,true);assert.equal(life.people.children.length,0);}
});
test('decorative aircraft remain separate from human occupancy',()=>{
 const life=createDcaLife(T,new Node(),new Node(),box,sign);
 assert.equal(life.scenery.children.length,2);
 life.update(.05,false);
 assert.equal(life.scenery.visible,false);
 assert.equal(life.people.children.length,0);
 life.update(.05,true);
 assert.equal(life.scenery.visible,true);
 assert.equal(life.people.children.length,0);
});
