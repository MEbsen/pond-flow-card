import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
try {
  const page = await browser.newPage({viewport:{width:820,height:850}});
  await page.setContent('<body style="background:#09171e;margin:24px"><pond-flow-card></pond-flow-card></body>');
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
  assert.equal(await page.locator('path.active').count(),2);
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
  console.log('PASS: demo disabled, service payload, pump animation, unavailable entities');
} finally { await browser.close(); }
