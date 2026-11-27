import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {stationById} from '../gameplay/rail-stations.mjs';
import {readStation} from './providers.mjs';

export function createScheduleHandler({env=process.env,clock=Date.now,reader=readStation}={}){
  const cache=new Map(),pending=new Map(),lastAttempt=new Map();
  const origins=new Set((env.WORLD_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean));
  function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
  return async (req,res)=>{
    const origin=req.headers.origin;
    if(origin&&!origins.has(origin)){send(res,403,{status:'forbidden'});return;}
    if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
    if(req.method!=='GET'){send(res,405,{status:'method-not-allowed'});return;}
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/health'){send(res,200,{status:'ok'});return;}
    if(url.pathname!=='/v1/rail/arrivals'){send(res,404,{status:'not-found'});return;}
    const station=stationById(url.searchParams.get('station'));
    if(!station){send(res,404,{status:'unknown-station'});return;}
    const now=clock(),id=station.id,previous=cache.get(id);
    if(previous&&now<previous.expiresAt&&now-previous.observedAt<30000){send(res,200,previous);return;}
    if(!pending.has(id)){
      if(now-(lastAttempt.get(id)??-Infinity)<30000){send(res,503,{station:id,status:'unavailable'});return;}
      lastAttempt.set(id,now);
      const task=Promise.resolve().then(()=>reader(station,{env,clock})).then(value=>{
        if(value?.station!==id||!Array.isArray(value.rows)||!Number.isFinite(value.expiresAt)||value.expiresAt<=clock())throw Error('Invalid result');
        cache.set(id,value);return value;
      }).finally(()=>pending.delete(id));
      pending.set(id,task);
    }
    try{send(res,200,await pending.get(id));}catch{cache.delete(id);send(res,503,{station:id,status:'unavailable'});}
  };
}
export function startServer(env=process.env){
  const server=createServer((req,res)=>createSafe(req,res));
  const handler=createScheduleHandler({env});
  async function createSafe(req,res){try{await handler(req,res);}catch{if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({status:'unavailable'}));}}
  server.requestTimeout=15000;server.headersTimeout=10000;
  server.listen(Number(env.PORT||8080),'0.0.0.0');
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)startServer();
