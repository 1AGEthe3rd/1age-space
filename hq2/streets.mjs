import * as THREE from '../space/shared/three.module.js';

const wallTones = ['#ad735b', '#947365', '#ba8d6d', '#c1ac8b', '#9e6752', '#aa8b74', '#ccbca3'];
const pavement = ['motorway','trunk','primary','secondary','tertiary','residential','unclassified','living_street','service'];
const materials = {
  opaque: new THREE.MeshLambertMaterial({vertexColors:true, side:THREE.DoubleSide}),
  window: new THREE.MeshStandardMaterial({vertexColors:true, side:THREE.DoubleSide, roughness:.31, metalness:.28, emissive:0x182329, emissiveIntensity:.17}),
  trim: new THREE.MeshLambertMaterial({vertexColors:true, side:THREE.DoubleSide}),
  facade: new THREE.MeshLambertMaterial({vertexColors:true, side:THREE.DoubleSide}),
  water: new THREE.MeshLambertMaterial({color:'#536f76', side:THREE.DoubleSide}),
};
// Subtle deterministic masonry and road detail without additional texture requests.
materials.facade.onBeforeCompile = shader => {
  shader.vertexShader = 'varying vec3 surfacePosition;\n' + shader.vertexShader
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nsurfacePosition = position;');
  shader.fragmentShader = 'varying vec3 surfacePosition;\n' + shader.fragmentShader
    .replace('#include <color_fragment>', `#include <color_fragment>
      float along = (surfacePosition.x + surfacePosition.z * .87) * 4.0;
      float row = surfacePosition.y * 10.0;
      float horizontal = fract(along + floor(row) * .5);
      float vertical = fract(row);
      float mortar = min(smoothstep(.0, .09, horizontal), smoothstep(.0, .14, vertical));
      float cell = fract(sin(dot(vec2(floor(along), floor(row)), vec2(119.2, 55.1))) * 4376.58);
      float viewFade = min(1., fwidth(row) * 1.6);
      diffuseColor.rgb *= mix(.84 + mortar * (.12 + cell * .08), 1., viewFade);`);
};
const waterTime = {value:0};
materials.water.onBeforeCompile = shader => {
  shader.uniforms.waterTime = waterTime;
  shader.vertexShader = 'varying vec2 riverPosition;\n' + shader.vertexShader
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nriverPosition = position.xz;');
  shader.fragmentShader = 'uniform float waterTime;\nvarying vec2 riverPosition;\n' + shader.fragmentShader
    .replace('#include <color_fragment>', `#include <color_fragment>
      float ripple = sin(riverPosition.x * .17 + riverPosition.y * .81 + waterTime * 1.38);
      float chop = sin(riverPosition.x * .54 - riverPosition.y * .31 - waterTime);
      float glint = smoothstep(.54, .92, ripple * .65 + chop * .35);
      diffuseColor.rgb = mix(diffuseColor.rgb * .78, diffuseColor.rgb * 1.63, glint);`);
};

class Batch {
  positions = [];
  colors = [];
  color = new THREE.Color();
  triangle(a,b,c,paint) {
    this.color.set(paint);
    this.positions.push(...a,...b,...c);
    for (let i=0;i<3;i++) this.colors.push(this.color.r,this.color.g,this.color.b);
  }
  quad(a,b,c,d,paint) {
    this.triangle(a,b,c,paint);
    this.triangle(a,c,d,paint);
  }
  polygon(rings,y,paint) {
    const loops = rings.map(ring => ring.slice(0,-1).map(([x,z]) => new THREE.Vector2(x,z)));
    const indices = THREE.ShapeUtils.triangulateShape(loops[0],loops.slice(1));
    const vertices = loops.flat().map(p => [p.x,y,p.y]);
    for (const [a,b,c] of indices) this.triangle(vertices[c],vertices[b],vertices[a],paint);
  }
  mesh(material,group) {
    if (!this.positions.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(this.colors,3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry,material);
    group.add(mesh);
    return mesh;
  }
}

const box = new THREE.BoxGeometry();
const crown = new THREE.IcosahedronGeometry(1,0);
const fixtureMaterial = new THREE.MeshLambertMaterial();
function instances(group,geometry,items) {
  if (!items.length) return;
  const mesh = new THREE.InstancedMesh(geometry,fixtureMaterial,items.length);
  const pose = new THREE.Object3D();
  const paint = new THREE.Color();
  items.forEach(([x,y,z,w,h,d,color],i) => {
    pose.position.set(x,y,z);
    pose.rotation.y = Math.sin(x+z)*.17;
    pose.scale.set(w,h,d);
    pose.updateMatrix();
    mesh.setMatrixAt(i,pose.matrix);
    mesh.setColorAt(i,paint.set(color));
  });
  group.add(mesh);
}

// Positive signed area means the existing left-hand normal points inward.
// Rings can have either winding; choose an outward-facing facade consistently.
export function facadeNormalSign(ring) {
  let area=0;
  for(let i=1;i<ring.length;i++) area+=ring[i-1][0]*ring[i][1]-ring[i][0]*ring[i-1][1];
  return area>0?-1:1;
}

function building(shell,details,glass,rings,id,design) {
  const outer = rings[0];
  const width = Math.max(...outer.map(p=>p[0])) - Math.min(...outer.map(p=>p[0]));
  const depth = Math.max(...outer.map(p=>p[1])) - Math.min(...outer.map(p=>p[1]));
  const seed = parseInt(id.slice(0,6),16);
  const stories = design?.stories || (Math.min(width,depth) < 5 ? 1 : (width*depth < 220 ? 2 + Number(seed%7===0) : 2 + seed%4));
  const height = stories * 3.05 + .22;
  const color = design?.wall || wallTones[seed%wallTones.length];
  shell.polygon(rings,height,'#514e49');
  for (const ring of rings) {
    const normalSign=facadeNormalSign(ring)*(ring===outer?1:-1);
    for (let i=1; i<ring.length; i++) {
      const [x,z] = ring[i-1];
      const [u,v] = ring[i];
      const length = Math.hypot(u-x,v-z);
      if (length < .32) continue;
      const dx=(u-x)/length, dz=(v-z)/length;
      const point=(along,y,offset)=>[x+dx*along-dz*offset*normalSign,y,z+dz*along+dx*offset*normalSign];
      const wall=(batch,from,to,bottom,top,offset,paint)=>{
        if(to<=from||top<=bottom) return;
        const a=point(from,bottom,offset),b=point(to,bottom,offset),c=point(to,top,offset),d=point(from,top,offset);
        // Keep normals toward the exterior for realistic lighting.
        if(normalSign>0) batch.quad(a,b,c,d,paint); else batch.quad(d,c,b,a,paint);
      };
      const sill=(batch,from,to,y,back,front,paint)=>{
        const a=point(from,y,back),b=point(to,y,back),c=point(to,y,front),d=point(from,y,front);
        if(normalSign<0) batch.quad(a,b,c,d,paint); else batch.quad(d,c,b,a,paint);
      };
      wall(shell,0,length,0,height,0,color);
      wall(shell,0,length,0,.42,.012,'#6c6861');
      wall(shell,0,length,height-.34,height+.03,.04,design?.trim || '#c4b6a4');
      wall(shell,0,length,height-.10,height+.09,.11,'#756c5f');
      sill(shell,0,length,height+.09,0,.11,'#9d9486');
      if (length < 2.1 || width*depth < 35 || ring !== outer) continue;
      const bays = Math.floor(length/(design?.commercial ? 2.7 : 2.75)) || 1;
      const step = length/bays;
      for (let floor=0;floor<stories;floor++) {
        const shop = floor===0 && design?.commercial;
        if(shop) wall(shell,0,length,2.69,2.9,.038,design.trim||'#6c6254');
        else if(floor>0) wall(details,0,length,floor*3.05+.14,floor*3.05+.23,.045,design?.trim||color);
        for (let bay=0;bay<bays;bay++) {
          const center=step*(bay+.5), half=step*(shop ? .40 : .255);
          const y=floor*3.05+(shop ? .22 : 1);
          const upper=y+(shop ? 2.22 : 1.45);
          const a=center-half,b=center+half;
          const frame=shop?'#4b4540':(design?.trim||'#c2b39e');
          wall(details,a,b,y,upper,.034,frame);
          wall(glass,a+.075,b-.075,y+.078,upper-.075,.055,
            shop ? (bay%3===0 ? '#52696a' : '#263b42') : (bay%3===0 ? '#667c87' : '#405762'));
          // A narrow upper reflection band and projecting mullions add depth without textures.
          wall(glass,a+.075,b-.075,upper-.23,upper-.075,.059,'#81979f');
          wall(details,center-.026,center+.026,y,upper,.078,frame);
          wall(details,a,b,upper-.41,upper-.365,.078,frame);
          wall(details,a-.055,b+.055,y-.075,y+.015,.105,frame);
          sill(details,a-.055,b+.055,y+.015,.035,.105,frame);
          if(!shop) wall(details,a-.045,b+.045,upper,upper+.075,.073,frame);
        }
      }
    }
  }
}

export function inside([x,z],ring) {
  let hit=false;
  for (let i=1,j=0;i<ring.length;j=i++) {
    const [a,b]=ring[i], [c,d]=ring[j];
    if ((b>z)!==(d>z) && x<(c-a)*(z-b)/(d-b)+a) hit=!hit;
  }
  return hit;
}

function collider(rings) {
  const exterior = rings[0];
  const minX=Math.min(...exterior.map(p=>p[0])), maxX=Math.max(...exterior.map(p=>p[0]));
  const minZ=Math.min(...exterior.map(p=>p[1])), maxZ=Math.max(...exterior.map(p=>p[1]));
  return (x,z) => x>=minX && x<=maxX && z>=minZ && z<=maxZ &&
    inside([x,z],exterior) && !rings.slice(1).some(r=>inside([x,z],r));
}

export function segmentDistance(x,z,a,b) {
  const dx=b[0]-a[0], dz=b[1]-a[1];
  const t=THREE.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz || 1),0,1);
  return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
}

function strip(batch,a,b,width,y,paint) {
  const h=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if (h<.04) return;
  const nx=(b[1]-a[1])/h*width/2, nz=(a[0]-b[0])/h*width/2;
  batch.quad([a[0]+nx,y,a[1]+nz],[b[0]+nx,y,b[1]+nz],[b[0]-nx,y,b[1]-nz],[a[0]-nx,y,a[1]-nz],paint);
}

function crosswalk(batch,rings) {
  const ring=rings[0];
  const edge=ring.slice(1).reduce((longest,b,i)=>{
    const a=ring[i], length=Math.hypot(a[0]-b[0],a[1]-b[1]);
    return length>longest.length ? {a,b,length} : longest;
  },{length:0});
  if (edge.length<2) return;
  const dx=(edge.b[0]-edge.a[0])/edge.length;
  const dz=(edge.b[1]-edge.a[1])/edge.length;
  const vertices=ring.slice(0,-1).map(([x,z])=>{
    const a=x-edge.a[0],b=z-edge.a[1];
    return [a*dx+b*dz,-a*dz+b*dx];
  });
  const span=Math.max(...vertices.map(p=>p[0]));
  const from=Math.min(...vertices.map(p=>p[0]));
  const world=(u,v)=>[edge.a[0]+u*dx-v*dz,.097,edge.a[1]+u*dz+v*dx];
  function extent(u) {
    const crossings=[];
    for(let i=0;i<vertices.length;i++) {
      const [x,y]=vertices[i],[a,b]=vertices[(i+1)%vertices.length];
      if((x<=u)===(a<=u)) continue;
      crossings.push(y+(b-y)*(u-x)/(a-x));
    }
    crossings.sort((a,b)=>a-b);
    return crossings.length===2 ? [crossings[0]+.13,crossings[1]-.13] : null;
  }
  for(let u=from+.19;u+.34<span;u+=.77) {
    const a=extent(u),b=extent(u+.34);
    if(!a||!b||a[1]<=a[0]||b[1]<=b[0]) continue;
    batch.quad(world(u,a[0]),world(u+.34,b[0]),world(u+.34,b[1]),world(u,a[1]),'#e7e1cb');
  }
}

function road(batch,kind,width,bridge,points,fixtures,decks) {
  const lane = pavement.includes(kind);
  const height = bridge ? (lane ? 2.8 : 2.9) : .025;
  for (let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i];
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if (length<.08) continue;
    const direction=[(b[0]-a[0])/length,(b[1]-a[1])/length];
    const offset=(distance,side=0)=>[a[0]+direction[0]*distance+direction[1]*side,a[1]+direction[1]*distance-direction[0]*side];
    if (lane && !bridge && kind!=='motorway' && kind!=='service') strip(batch,a,b,width+1.0,.013,'#878078');
    strip(batch,a,b,width,height, lane ? (kind==='service' ? '#5b5956' : '#484944') : '#9a9383');
    if (bridge) {
      decks.push([a,b,width*.56,height,kind]);
      for (const side of [-1,1]) {
        strip(batch,offset(0,side*(width/2-.12)),offset(length,side*(width/2-.12)),.22,height+.55,'#929694');
        for (let d=2;d<length;d+=8) {
          const [x,z]=offset(d,side*(width/2-.12));
          fixtures.push([x,height+.29,z,.18,.59,.18,'#6a7475']);
        }
      }
      if (lane && length>13) {
        for (let d=11;d<length;d+=22) {
          const [x,z]=offset(d);
          fixtures.push([x,.78,z,1.1,3.8,1.7,'#797b72']);
        }
      }
    }
    if (lane && width>=8 && length>3) {
      for (let d=1;d<length-1;d+=8) {
        strip(batch,offset(d),offset(Math.min(d+2.8,length-1)),.13,height+.022,width>=10 ? '#d5aa4b' : '#c1baaa');
      }
    }
  }
}

export function makeTile(data,designs,detailed) {
  const group=new THREE.Group();
  const ground=new Batch(), markings=new Batch(), shell=new Batch(), details=new Batch(), glass=new Batch(), river=new Batch();
  const fixtures=[], foliage=[], blockers=[], water=[], decks=[];
  for (const rings of data.osm.parks) ground.polygon(rings,.007,'#788053');
  for (const [kind,rings] of data.dc.surfaces) {
    if (kind==='water') {
      river.polygon(rings,.016,'#ffffff');
      water.push(collider(rings));
    } else if(kind==='crosswalk') {
      ground.polygon(rings,.084,'#595853');
      crosswalk(markings,rings);
    } else {
      ground.polygon(rings,.063,'#a59e90');
    }
  }
  for (const [kind,width,bridge,points] of data.osm.roads) road(ground,kind,width,bridge,points,fixtures,decks);
  for (const [id,rings] of data.dc.buildings) {
    const design=designs[id];
    if (!design?.open) blockers.push(collider(rings));
    building(shell,details,glass,rings,id,design);
  }
  for (const [kind,x,z] of data.osm.props) {
    if (kind==='tree') {
      const size=2+Math.abs(Math.sin(x*13+z))*2.2;
      fixtures.push([x,1.95,z,.29,3.9,.29,'#635746']);
      foliage.push([x,3.1+size*.45,z,size*.76,size,size*.76,'#55683c']);
      foliage.push([x+.7,3.6+size*.47,z-.5,size*.56,size*.71,size*.53,'#667a46']);
    } else if (kind==='bus_stop') {
      fixtures.push([x,1.4,z,.09,2.8,.09,'#555f64'],[x,2.65,z,.34,.39,.10,'#386789']);
    } else {
      fixtures.push([x,2.14,z,.13,4.3,.13,'#5a605a'],[x,4.08,z,.29,.64,.29,'#4f5141']);
      if(kind==='traffic_signals') {
        fixtures.push([x,4.25,z,.31,.83,.31,'#594b30']);
        fixtures.push([x,4.49,z,.26,.15,.33,'#b44535'],[x,4.25,z,.26,.15,.33,'#9d813e'],[x,4.01,z,.26,.15,.33,'#3f6651']);
      }
    }
  }
  const waterMesh=river.mesh(materials.water,group);
  if (waterMesh) waterMesh.renderOrder=1;
  ground.mesh(materials.opaque,group);
  markings.mesh(materials.opaque,group);
  shell.mesh(materials.facade,group);
  const trim = detailed ? new THREE.Group() : null;
  if(trim) {
    details.mesh(materials.trim,trim);
    glass.mesh(materials.window,trim);
    group.add(trim);
  }
  instances(group,box,fixtures);
  instances(group,crown,foliage);
  return {group,trim,blockers,water,decks};
}

export function updateWater(seconds) {
  waterTime.value=seconds;
}
