import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.PLAYWRIGHT_ROOT,'node_modules','playwright'));
const root=process.env.WORLD_SMOKE_URL||'http://127.0.0.1:8765';
await mkdir('world-release-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
async function run(name,viewport,check){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:viewport.width<600,hasTouch:viewport.width<600});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',route=>{const url=new URL(route.request().url());return url.origin===root||url.protocol==='data:'?route.continue():route.abort();});
  async function open(relative){
    const response=await page.goto(root+relative,{waitUntil:'domcontentloaded',timeout:60000});
    assert.ok(response?.ok(),relative);
    await page.locator('#district canvas').first().waitFor({state:'visible',timeout:60000});
    await page.waitForTimeout(1200);
  }
  async function shot(suffix){await page.screenshot({path:'world-release-screenshots/'+name+'-'+suffix+'.png'});}
  try{await check(page,open,shot);assert.deepEqual(errors,[],name+' uncaught page errors');console.log('PASS '+name);}
  finally{await context.close();}
}
try{
  await run('portland',{width:1280,height:800},async(page,open,shot)=>{
    await open('/hq1/?stop=javan-lot&weatherPreview=rain');
    await page.waitForFunction(()=>document.querySelector('#weather')?.textContent.includes('Weather test'),{},{timeout:30000});
    await shot('rain');
    await open('/hq1/?rail=yellow&station=interstate-rose-quarter&weatherPreview=clear');
    await page.getByRole('link',{name:'Transfer to Red Line'}).click();
    await page.getByRole('heading',{name:'MAX Red Line'}).waitFor();
    await page.getByRole('button',{name:'Board train',exact:true}).click();
    await page.getByRole('button',{name:'Leave train',exact:true}).waitFor();
    await shot('max-red');
    await open('/hq1/?rail=red&station=portland-international-airport&weatherPreview=clear');
    await page.getByRole('link',{name:'Enter PDX',exact:true}).click();
    await page.getByRole('heading',{name:'PDX · Virtual airport'}).waitFor();
    await shot('pdx');
    await page.getByRole('button',{name:'Travel services',exact:true}).click();
    await page.getByLabel('Destination airport code').fill('DCA');
    await page.getByRole('button',{name:'Prepare real flight search'}).click();
    const link=page.getByRole('link',{name:'Continue to external flight search'});
    assert.equal(await link.getAttribute('href'),'https://www.skyscanner.net/flights');
    await shot('travel-counter');
  });
  await run('washington',{width:390,height:844},async(page,open,shot)=>{
    await open('/hq2/?weatherPreview=rain&drivePreview=1');
    await page.waitForFunction(()=>document.querySelector('#scene-status')?.hidden===true,{},{timeout:60000});
    await shot('rain-street');
    await open('/hq2/?destination=lenfant-green&weatherPreview=clear');
    await page.getByRole('button',{name:'Transfer to Yellow Line'}).click();
    await page.waitForFunction(()=>document.querySelector('#current-street')?.textContent.includes('Yellow Line'));
    await shot('metro-transfer');
    await open('/hq2/?destination=dca-metro&weatherPreview=clear');
    await page.getByRole('button',{name:'Enter virtual airport'}).click();
    await page.getByRole('heading',{name:'DCA · Virtual airport'}).waitFor();
    await shot('dca');
    await page.getByRole('button',{name:'Travel services',exact:true}).click();
    await page.getByLabel('Destination airport code').fill('PDX');
    await page.getByRole('button',{name:'Prepare real flight search'}).click();
    await page.getByRole('link',{name:'Continue to external flight search'}).waitFor();
    await shot('travel-counter');
    await page.getByRole('button',{name:'Close',exact:true}).click();
    await page.getByRole('link',{name:'Yellow Line · Metro'}).click();
    await page.waitForFunction(()=>document.querySelector('h1')?.textContent.includes('Ronald Reagan Washington National Airport'));
    await shot('metro-return');
  });
}finally{await browser.close();}
