import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {controllerStates} from './controller-fixture.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
const prefix='garden_pond_controller';
try {
  const page=await browser.newPage({viewport:{width:1100,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<body style="margin:24px;background:#101a1e;color:#e1e8e9"><pond-flow-card style="display:block;width:100%;max-width:1020px;height:auto"></pond-flow-card></body>');
  await page.addScriptTag({content:await readFile('pond-flow-card.js','utf8')});
  await page.evaluate(states=>{
    const card=document.querySelector('pond-flow-card');window.card=card;window.calls=[];
    card.setConfig({entity_prefix:'garden_pond_controller'});
    card.hass={connection:{connected:true},states,callService:async(...args)=>window.calls.push(args)};
  },await controllerStates());
  const unit=id=>page.locator(`[data-section="unit-${id}"]`);
  const last=()=>page.evaluate(()=>window.calls.at(-1));
  const echo=async(id,value)=>page.evaluate(({id,value})=>{window.card.hass={...window.card._hass,states:{...window.card._hass.states,[id]:{...window.card._hass.states[id],state:value}}};},{id,value});
  const edit=async(id,value)=>{const input=page.locator(`[data-control="${id}"]`);await input.fill(value);await input.dispatchEvent('change');};
  assert.equal(await page.locator('.metrics').count(),0);
  assert.equal(await page.locator('[data-section="entities"]').count(),0);
  assert.equal(await page.locator('.unit').count(),4);
  assert.equal(await page.locator('[data-info="skimmer_running"]').textContent(),'Stoppet');
  assert.equal(await page.locator('[data-connection]').getAttribute('data-state'),'live');
  assert.equal(await page.locator('.season-panel summary strong').textContent(),'Sommerdrift');
  await page.locator('.season-panel summary').click();
  await edit(`number.${prefix}_sommer_overflade_genstart_over`,'12');
  assert.deepEqual(await last(),['number','set_value',{entity_id:`number.${prefix}_sommer_overflade_genstart_over`,value:12}]);
  await echo(`binary_sensor.${prefix}_vinterdrift_aktiv`,'on');
  assert.equal(await page.locator('.season-panel summary strong').textContent(),'Vinterdrift');
  await page.locator('.season-panel summary').click();
  for(const [id,base,key] of [['pump','filterpumpe','pump'],['uv','uv_c','uv'],['aer','luftpumpe','aerator'],['skimmer','skimmer','skimmer']]) {
    await unit(id).locator(`[data-key="${key}_mode"][data-option="Til"]`).click();
    assert.deepEqual(await last(),['select','select_option',{entity_id:`select.${prefix}_${base}_tilstand`,option:'Til'}]);
    const plan=`select.${prefix}_${base}_tidsplan_type`;
    await unit(id).locator(`[data-key="${key}_plan"][data-option="Gentag med interval"]`).click();
    assert.deepEqual(await last(),['select','select_option',{entity_id:plan,option:'Gentag med interval'}]);
    await echo(plan,'Gentag med interval');
    await edit(`number.${prefix}_${base}_tidsplan_koeretid_pr_start`,'20');
    assert.deepEqual(await last(),['number','set_value',{entity_id:`number.${prefix}_${base}_tidsplan_koeretid_pr_start`,value:20}]);
    await edit(`number.${prefix}_${base}_tidsplan_gentag_hver_timer`,'3');
    assert.deepEqual(await last(),['number','set_value',{entity_id:`number.${prefix}_${base}_tidsplan_gentag_hver_timer`,value:3}]);
    const reset=`button.${prefix}_${base}_interval_start_forfra_nu`;
    await unit(id).locator(`[data-press="${reset}"]`).click();
    assert.deepEqual(await last(),['button','press',{entity_id:reset}]);
    await echo(plan,'Ugeplan');
    assert.equal(await unit(id).locator('.weekdays button').count(),7);
    assert.equal(await unit(id).locator('.slots input[type=time]').count(),3);
    const monday=`switch.${prefix}_${base}_ugeplan_mandag`;
    await unit(id).locator(`[data-switch="${monday}"]`).click();
    assert.deepEqual(await last(),['switch','turn_off',{entity_id:monday}]);
    await echo(monday,'off');
    assert.equal(await unit(id).locator(`[data-switch="${monday}"]`).getAttribute('aria-pressed'),'false');
    for(let i=1;i<=3;i++) {
      const time=`text.${prefix}_${base}_ugeplan_start_${i}_hh_mm`;
      await edit(time,`0${i+6}:30`);
      assert.deepEqual(await last(),['text','set_value',{entity_id:time,value:`0${i+6}:30`}]);
    }
    const start2=`switch.${prefix}_${base}_ugeplan_start_2_aktiv`;
    await unit(id).locator(`[data-switch="${start2}"]`).click();
    assert.deepEqual(await last(),['switch','turn_on',{entity_id:start2}]);
  }
  const draft=`number.${prefix}_skimmer_tidsplan_koeretid_pr_start`;
  await page.locator(`[data-control="${draft}"]`).fill('25');
  await echo(`sensor.${prefix}_vandstand`,'96');
  assert.equal(await page.locator(`[data-control="${draft}"]`).inputValue(),'25');
  await page.locator(`[data-control="${draft}"]`).dispatchEvent('change');
  assert.deepEqual(await last(),['number','set_value',{entity_id:draft,value:25}]);
  await echo(draft,'30');
  assert.equal(await page.locator(`[data-control="${draft}"]`).inputValue(),'30');
  for(const option of ['Vinter','Sommer','Konstant drift']) {
    await unit('aer').locator(`[data-key="aerator_plan"][data-option="${option}"]`).click();
    assert.deepEqual(await last(),['select','select_option',{entity_id:`select.${prefix}_luftpumpe_tidsplan_type`,option}]);
  }
  assert.equal(await unit('aer').locator('.season-choice').count(),0);
  // Every reset targets only its own counter, and asks before deleting it.
  for(const [id,base] of [['pump','filterpumpe'],['uv','uv_c'],['aer','luftpumpe'],['skimmer','skimmer']]) {
    const button=`button.${prefix}_nulstil_${base}_driftstimer`;
    page.once('dialog',dialog=>dialog.accept());
    await unit(id).locator('[data-reset-hours]').click();
    assert.deepEqual(await last(),['button','press',{entity_id:button}]);
  }
  const beforeCancel=await page.evaluate(()=>window.calls.length);
  page.once('dialog',dialog=>dialog.dismiss());
  await unit('pump').locator('[data-reset-hours]').click();
  assert.equal(await page.evaluate(()=>window.calls.length),beforeCancel);
  // UV service has an icon at UV, but not an invented alarm at other units.
  await echo(`binary_sensor.${prefix}_uv_c_service_paakraevet`,'on');
  assert.equal(await page.locator('[data-alarm-unit="uv"]').count(),1);
  assert.equal(await page.locator('[data-alarm-unit="pump"]').count(),0);
  await page.locator('[data-alarm-unit="uv"]').click();
  assert.equal(await page.locator('.alarm-dialog').evaluate(el=>el.open),true);
  assert.match(await page.locator('.alarm-dialog').textContent(),/servicegrænsen er 8000 timer/);
  await echo(`sensor.${prefix}_vandstand`,'94');
  assert.equal(await page.locator('.alarm-dialog').evaluate(el=>el.open),true);
  await page.locator('[data-close-alarm]').click();
  await echo(`binary_sensor.${prefix}_uv_c_service_paakraevet`,'off');
  assert.equal(await page.locator('[data-alarm-unit="uv"]').count(),0);
  // A shared relay communication alarm marks all four affected outputs.
  await echo(`binary_sensor.${prefix}_fejl_relaemodul`,'on');
  assert.equal(await page.locator('[data-alarm-unit]').count(),4);
  await page.locator('[data-alarm-unit="aer"]').focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('.alarm-dialog').textContent(),/fælles controlleralarm/);
  await page.locator('[data-close-alarm]').click();
  await echo(`binary_sensor.${prefix}_fejl_relaemodul`,'off');
  assert.equal(await page.locator('[data-alarm-unit]').count(),0);
  await edit(`number.${prefix}_skimmer_genstartmargin_inden_for_vandstandsinterval`,'3');
  assert.deepEqual(await last(),['number','set_value',{entity_id:`number.${prefix}_skimmer_genstartmargin_inden_for_vandstandsinterval`,value:3}]);
  await page.evaluate(()=>{window.beforeInvalid=window.calls.length;window.card.sendEntity('number.garden_pond_controller_skimmer_tidsplan_koeretid_pr_start','number',-1);});
  assert.equal(await page.evaluate(()=>window.calls.length),await page.evaluate(()=>window.beforeInvalid));
  await page.evaluate(()=>window.card.sendEntity('text.garden_pond_controller_skimmer_ugeplan_start_1_hh_mm','text','99:99'));
  assert.equal(await page.evaluate(()=>window.calls.length),await page.evaluate(()=>window.beforeInvalid));
  await echo(`sensor.${prefix}_dam_status`,'Normal');
  await page.evaluate(()=>{window.card.hass={...window.card._hass,connection:{connected:false}};});
  assert.equal(await page.locator('[data-connection]').getAttribute('data-state'),'offline');
  assert.equal(await page.locator('[data-key]:enabled,[data-control]:enabled,[data-switch]:enabled').count(),0);
  await page.evaluate(()=>{window.card.hass={...window.card._hass,connection:{connected:true}};});
  await page.evaluate(()=>{const states={...window.card._hass.states};for(const id of ['dam_temperatur_bund','dam_temperatur_overflade','vandstand']) states['sensor.garden_pond_controller_'+id]={...states['sensor.garden_pond_controller_'+id],last_reported:new Date(Date.now()-180000).toISOString()};window.card.hass={...window.card._hass,states};});
  assert.equal(await page.locator('[data-connection]').getAttribute('data-state'),'stale');
  await page.evaluate(()=>{const states={...window.card._hass.states};for(const id of ['dam_temperatur_bund','dam_temperatur_overflade','vandstand']) {states['sensor.garden_pond_controller_'+id]={...states['sensor.garden_pond_controller_'+id]};delete states['sensor.garden_pond_controller_'+id].last_reported;}window.card.hass={...window.card._hass,states};});
  assert.equal(await page.locator('[data-connection]').getAttribute('data-state'),'available');
  await echo(`sensor.${prefix}_vandstand`,'unavailable');
  assert.equal(await page.locator('[data-connection]').getAttribute('data-state'),'offline');
  // Reset to representative standard settings for visual QA.
  await page.evaluate(states=>{window.card.error='';window.card.hass={...window.card._hass,states};},await controllerStates());
  await echo(`select.${prefix}_skimmer_tidsplan_type`,'Ugeplan');
  await echo(`binary_sensor.${prefix}_uv_c_service_paakraevet`,'on');
  await echo(`sensor.${prefix}_uv_c_drift_total`,'8001');
  await page.evaluate(()=>{window.card.style.height=window.card.shadowRoot.querySelector('ha-card').scrollHeight+'px';window.card.shadowRoot.querySelector('ha-card').scrollTop=0;window.scrollTo(0,0);});
  await page.screenshot({path:'preview-controls.png',fullPage:true});
  await page.setViewportSize({width:390,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  for(const id of ['pump','uv','aer','skimmer']) assert.equal(await unit(id).evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await page.evaluate(()=>{window.card.style.height='auto';window.card.style.height=window.card.shadowRoot.querySelector('ha-card').scrollHeight+'px';window.card.shadowRoot.querySelector('ha-card').scrollTop=0;window.scrollTo(0,0);});
  await page.screenshot({path:'preview-controls-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: four relay panels, direct HA services, weekdays/three starts, editable safety/climate, connection states and mobile layout');
} finally {await browser.close();}
