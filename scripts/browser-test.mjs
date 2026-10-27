import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
try {
  const page = await browser.newPage({viewport:{width:820,height:850}});
  await page.setContent('<body style="background:#09171e;margin:24px"><pond-flow-card style="height:auto"></pond-flow-card></body>');
  await page.addScriptTag({content:await readFile('pond-flow-card.js','utf8')});
  await page.evaluate(()=>document.querySelector('pond-flow-card').setConfig({demo:true}));
  assert.equal(await page.locator('[data-key]:enabled').count(),0);
  await page.screenshot({path:'preview.png',fullPage:true});
  await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    window.calls=[];
    card.setConfig({entities:{pump_mode:'select.test',pump_running:'binary_sensor.pump'}});
    card.hass={states:{'select.test':{state:'Auto',attributes:{options:['Auto','Til','Fra']}},'binary_sensor.pump':{state:'on',attributes:{}}},callService:async(...args)=>window.calls.push(args)};
  });
  await page.locator('[data-key="pump_mode"][data-option="Til"]').click();
  assert.deepEqual(await page.evaluate(()=>window.calls),[['select','select_option',{entity_id:'select.test',option:'Til'}]]);
  assert.equal(await page.locator('path.active').count(),3);
  await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    const sensor={state:'8.456789',attributes:{unit_of_measurement:'°C'}};
    card.hass={states:{...card._hass.states,'sensor.garden_pond_controller_dam_temperatur_bund':sensor},callService:card._hass.callService};
    window.oldRotor=card.shadowRoot.querySelector('.rotor');
    card.hass={...card._hass};
    window.sameRotor=window.oldRotor===card.shadowRoot.querySelector('.rotor');
    card.addEventListener('hass-more-info',event=>window.openedEntity=event.detail.entityId);
  });
  assert.equal(await page.evaluate(()=>window.sameRotor),true);
  assert.match(await page.locator('[data-info="temp_bottom"]').textContent(),/8,5 °C/);
  await page.locator('[data-info="temp_bottom"]').click();
  assert.equal(await page.evaluate(()=>window.openedEntity),'sensor.garden_pond_controller_dam_temperatur_bund');
  const before = await page.locator('path.active').first().evaluate(el=>getComputedStyle(el).strokeDashoffset);
  await page.waitForTimeout(150);
  assert.notEqual(await page.locator('path.active').first().evaluate(el=>getComputedStyle(el).strokeDashoffset),before);
  await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    card.hass={states:{'select.test':{state:'unavailable',attributes:{}}},callService:async()=>{throw Error('must not call');}};
  });
  assert.equal(await page.locator('[data-key]:enabled').count(),0);
  assert.equal(await page.locator('path.active').count(),0);
  await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    const prefix='garden_pond_controller';
    const states={};
    for(const name of ['filterpumpe_koerer','luftpumpe_koerer','skimmer_koerer','uv_c_taendt']) states[`binary_sensor.${prefix}_${name}`]={state:name==='luftpumpe_koerer'?'off':'on',attributes:{}};
    for(const name of ['filterpumpe','luftpumpe','skimmer','uv_c']) {
      states[`select.${prefix}_${name}_tilstand`]={state:'Auto',attributes:{options:['Auto','Til','Fra']}};
      states[`sensor.${prefix}_${name}_drift_total`]={state:'2.495849609375',attributes:{unit_of_measurement:'h'}};
    }
    states[`select.${prefix}_skimmer_plan`]={state:'Ugeplan',attributes:{options:['Ugeplan','Interval']}};
    states[`switch.${prefix}_skimmer_ugeplan_mandag`]={state:'on',attributes:{friendly_name:'Skimmer ugeplan mandag'}};
    card.setConfig({entities:{pump_running:`binary_sensor.${prefix}_filterpumpe_korer`}});
    card.hass={states,callService:async(...args)=>window.calls.push(args)};
  });
  assert.equal(await page.locator('path.active').count(),3);
  assert.equal(await page.locator('.skimmer-current.moving path').count(),3);
  assert.equal(await page.locator('.fish').count(),2);
  assert.match(await page.locator('.equipment').first().textContent(),/2,5 h i alt/);
  assert.equal(await page.locator('[data-key="season"]').count(),0);
  assert.equal(await page.locator('[data-key="fill_mode"]').count(),0);
  await page.locator('[data-key="skimmer_mode"][data-option="Til"]').click();
  assert.deepEqual(await page.evaluate(()=>window.calls.at(-1)),['select','select_option',{entity_id:'select.garden_pond_controller_skimmer_tilstand',option:'Til'}]);
  await page.locator('[data-key="skimmer_plan"][data-option="Interval"]').click();
  assert.deepEqual(await page.evaluate(()=>window.calls.at(-1)),['select','select_option',{entity_id:'select.garden_pond_controller_skimmer_plan',option:'Interval'}]);
  await page.setViewportSize({width:360,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth),true);
  await page.screenshot({path:'preview-mobile.png',fullPage:true});
  await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    window.gridOptions=card.getGridOptions();
    card.shadowRoot.querySelector('.fish-swim').getAnimations()[0].currentTime=9000;
    card.hass={...card._hass,states:{...card._hass.states,'binary_sensor.garden_pond_controller_alarm_lav_vandstand':{state:'off',attributes:{}}}};
  });
  assert.equal(await page.locator('.alarms').count(),0);
  assert.ok(await page.locator('.fish-swim').first().evaluate(el=>el.getAnimations()[0].currentTime)>=9000);
  assert.deepEqual(await page.evaluate(()=>window.gridOptions),{columns:12,min_columns:6,rows:12,min_rows:8});
  const fishBefore=await page.locator('.fish-swim').first().evaluate(el=>getComputedStyle(el).transform);
  await page.waitForTimeout(150);
  assert.notEqual(await page.locator('.fish-swim').first().evaluate(el=>getComputedStyle(el).transform),fishBefore);
  await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    card.hass={...card._hass,states:{...card._hass.states,'binary_sensor.garden_pond_controller_alarm_lav_vandstand':{state:'on',attributes:{}}}};
  });
  assert.equal(await page.locator('.alarms button').count(),1);
  assert.match(await page.locator('.alarms').textContent(),/Aktiv/);
  await page.setViewportSize({width:1200,height:900});
  await page.evaluate(()=>{document.querySelector('pond-flow-card').style.width='420px';});
  assert.equal(await page.locator('.controls').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
  await page.evaluate(()=>{document.querySelector('pond-flow-card').style.width='900px';});
  assert.equal(await page.locator('.controls').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2);
  await page.evaluate(()=>{document.querySelector('pond-flow-card').style.height='500px';});
  assert.equal(await page.locator('ha-card').evaluate(el=>Math.round(el.getBoundingClientRect().height)),500);
  assert.equal(await page.locator('ha-card').evaluate(el=>el.scrollHeight>el.clientHeight),true);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.fish-swim').first().evaluate(el=>el.getAnimations().length),0);
  console.log('PASS: demo disabled, service payload, pump animation, unavailable entities');
} finally { await browser.close(); }
