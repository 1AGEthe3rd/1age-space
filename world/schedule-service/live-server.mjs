import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {createScheduleHandler} from './server.mjs';
import {readStation} from './providers.mjs';

// Per-process quota is an additional safety gate, not a persistent provider billing limit.
// No provider calls unless explicitly enabled, credentialed, verified and budgeted.
export function createBudgetedReader({env=process.env,clock=Date.now,reader=readStation}={}){
  const usage=new Map();
  return async (station,options={})=>{
    const prefix=station.provider==='trimet'?'TRIMET':station.provider==='wmata'?'WMATA':null;
    if(!prefix||station.verified!==true||env[prefix+'_LIVE_ENABLED']!=='true')throw Error('Provider disabled');
    const credential=prefix==='TRIMET'?env.TRIMET_APP_ID:env.WMATA_API_KEY;
    const limit=Number(env[prefix+'_DAILY_REQUEST_LIMIT']||0);
    if(!credential||!Number.isSafeInteger(limit)||limit<1||limit>100000)throw Error('Provider not configured');
    const now=clock(),day=Math.floor(now/86400000);
    const previous=usage.get(prefix);
    const counter=previous?.day===day?previous:{day,count:0};
    if(counter.count>=limit)throw Error('Provider budget exhausted');
    counter.count++;usage.set(prefix,counter);
    return reader(station,{...options,env,clock});
  };
}

export function createLiveHandler({env=process.env,clock=Date.now,reader=readStation,maxRequestsPerMinute=1200}={}){
  const origins=new Set((env.WORLD_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean));
  const rail=createScheduleHandler({env,clock,reader:createBudgetedReader({env,clock,reader})});
  let minute=-1,count=0;
  function send(res,status,data){
    res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(JSON.stringify(data));
  }
  return async(req,res)=>{
    const origin=req.headers.origin;
    if(origin&&!origins.has(origin)){send(res,403,{status:'forbidden'});return;}
    if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
    if(req.method!=='GET'){send(res,405,{status:'method-not-allowed'});return;}
    if(typeof req.url!=='string'||req.url.length>2048||!req.url.startsWith('/')){send(res,400,{status:'invalid-request'});return;}
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/health'){send(res,200,{status:'ok'});return;}
    const now=clock(),window=Math.floor(now/60000);
    if(window!==minute){minute=window;count=0;}
    if(++count>maxRequestsPerMinute){res.setHeader('Retry-After','60');send(res,429,{status:'rate-limited'});return;}
    if(url.pathname==='/v1/time'){send(res,200,{kind:'world-clock',serverTimeMs:now,source:'server-utc'});return;}
    await rail(req,res);
  };
}
export function startLiveServer(env=process.env){
  const handler=createLiveHandler({env});
  const server=createServer(async(req,res)=>{
    try{await handler(req,res);}catch{
      if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});
      if(!res.writableEnded)res.end(JSON.stringify({status:'unavailable'}));
    }
  });
  server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.maxHeadersCount=40;
  server.listen(Number(env.PORT||8080),'0.0.0.0');
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)startLiveServer();
