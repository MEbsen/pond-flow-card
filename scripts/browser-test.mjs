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
  assert.equal(await page.locator('.waterfall-water').evaluate(el=>getComputedStyle(el).visibility),'visible');
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
  assert.equal(await page.locator('.waterfall-water').evaluate(el=>getComputedStyle(el).visibility),'hidden');
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
  assert.equal(await page.locator('.fountain.running').count(),0);
  assert.equal(await page.locator('[data-key="icefree_mode"]').count(),0);
  assert.equal(await page.locator('svg').textContent().then(text=>text.includes('IceFree')),false);
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
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    card.hass={...card._hass,states:{...card._hass.states,'binary_sensor.garden_pond_controller_luftpumpe_koerer':{state:'on',attributes:{}}}};
  });
  assert.equal(await page.locator('.fountain.running path').count(),4);
  const sprayBefore=await page.locator('.fountain.running path').first().evaluate(el=>getComputedStyle(el).strokeDashoffset);
  await page.waitForTimeout(150);
  assert.notEqual(await page.locator('.fountain.running path').first().evaluate(el=>getComputedStyle(el).strokeDashoffset),sprayBefore);
  await page.locator('[data-key="aerator_mode"][data-option="Til"]').click();
  assert.deepEqual(await page.evaluate(()=>window.calls.at(-1)),['select','select_option',{entity_id:'select.garden_pond_controller_luftpumpe_tilstand',option:'Til'}]);
  // Changing readings, logs and HA timestamps must preserve the actual animation
  // objects, not replace them and restore an approximate playback time.
  const continuity = await page.evaluate(async()=>{
    const card=document.querySelector('pond-flow-card');
    const svg=card.shadowRoot.querySelector('svg');
    const animated=[...svg.querySelectorAll('.fish-swim,.flow.active,.rotor,.skimmer-current.moving path,.fountain.running path,.ripple,.waterfall-splash,.waterfall-ripple')];
    const animations=animated.map(el=>el.getAnimations()[0]).filter(Boolean);
    const fish=card.shadowRoot.querySelector('.fish-swim');
    fish.getAnimations()[0].currentTime=21900;
    const initial=animations.map(a=>a.currentTime);
    const details=card.shadowRoot.querySelector('details');
    details.open=true;
    const control=card.shadowRoot.querySelector('[data-key="skimmer_mode"]');
    control.focus();
    const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
    for(let i=0;i<90;i++) {
      const tempId='sensor.garden_pond_controller_dam_temperatur_bund';
      card.hass={...card._hass,states:{...card._hass.states,
        [tempId]:{state:String(8+i/100),attributes:{unit_of_measurement:'°C'},last_updated:String(i)},
        'sensor.garden_pond_controller_seneste_haendelse':{state:'Opdatering '+i,attributes:{}},
        'binary_sensor.garden_pond_controller_alarm_lav_vandstand':{state:i%2?'on':'off',attributes:{}}
      }};
      await nextFrame();
    }
    const sameNodes=animated.every(el=>el.isConnected) && svg===card.shadowRoot.querySelector('svg');
    const sameAnimations=animations.every(a=>a.effect.target.getAnimations().includes(a));
    const advanced=animations.every((a,i)=>a.currentTime>initial[i]);
    const fishProgress=fish.getAnimations()[0].currentTime>22000;
    const uiPreserved=details.open && card.shadowRoot.activeElement===control;
    const fishAnimation=fish.getAnimations()[0];
    card.hass={...card._hass,states:{...card._hass.states,'binary_sensor.garden_pond_controller_filterpumpe_koerer':{state:'off',attributes:{}}}};
    const independent=fish.getAnimations()[0]===fishAnimation && !card.shadowRoot.querySelector('.flow.active');
    const count=window.calls.length;
    card.shadowRoot.querySelector('[data-key="skimmer_mode"][data-option="Til"]').click();
    return {sameNodes,sameAnimations,advanced,fishProgress,uiPreserved,independent,singleCall:window.calls.length===count+1};
  });
  assert.deepEqual(continuity,{sameNodes:true,sameAnimations:true,advanced:true,fishProgress:true,uiPreserved:true,independent:true,singleCall:true});
  await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    card.style.height='auto';card.style.width='760px';
    card.setConfig({demo:true,fish:[{id:'gold',name:'Guld',color:'#d8a657'},{id:'pearl',name:'Perle',color:'ivory'},{id:'test',name:'<img src=x onerror=alert(1)>',color:'red;stroke:black'}]});
  });
  assert.equal(await page.locator('.fish').count(),3);
  assert.equal(await page.locator('.fish-bubble').count(),9);
  assert.match(await page.locator('.fish-name').first().textContent(),/Guld/);
  assert.equal(await page.locator('.fish-legend').count(),0);
  assert.equal(await page.locator('.fish-name img').count(),0);
  assert.equal(await page.locator('.fish[data-section="fish-gold"] path').first().getAttribute('fill'),'#d8a657');
  assert.equal(await page.locator('.fish[data-section="fish-test"] path').first().getAttribute('fill'),'#c49a72');
  const bubbleContinuity=await page.evaluate(async()=>{
    const card=document.querySelector('pond-flow-card');
    const bubble=card.shadowRoot.querySelector('.fish-bubble');
    const animation=bubble.getAnimations()[0];
    animation.currentTime=2500;
    const before=getComputedStyle(bubble).transform;
    const opacity=Number(getComputedStyle(bubble).opacity);
    card.hass={...card._hass,states:{...card._hass.states,'sensor.garden_pond_controller_dam_temperatur_bund':{state:'12.3',attributes:{}}}};
    await new Promise(resolve=>setTimeout(resolve,100));
    return {same:bubble.getAnimations()[0]===animation,moving:getComputedStyle(bubble).transform!==before,visible:opacity>0};
  });
  assert.deepEqual(bubbleContinuity,{same:true,moving:true,visible:true});
  const nameTracking=await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    const fish=card.shadowRoot.querySelector('.fish[data-section="fish-gold"]');
    const swimmer=fish.querySelector('.fish-swim'),label=fish.querySelector('.fish-name-swim');
    const bodyAnimation=swimmer.getAnimations()[0],labelAnimation=label.getAnimations()[0];
    bodyAnimation.pause();labelAnimation.pause();
    const phases=[0,10560,11000,15000,21560];
    const readable=phases.every(time=>{
      bodyAnimation.currentTime=time;labelAnimation.currentTime=time;
      const body=new DOMMatrixReadOnly(getComputedStyle(swimmer).transform);
      const name=new DOMMatrixReadOnly(getComputedStyle(label).transform);
      return Math.abs(body.m41-name.m41)<.1 && name.m11===1;
    });
    card.hass={...card._hass,states:{...card._hass.states,'sensor.garden_pond_controller_dam_temperatur_bund':{state:'13.4',attributes:{}}}};
    const preserved=label.getAnimations()[0]===labelAnimation;
    bodyAnimation.play();labelAnimation.play();
    return {readable,preserved};
  });
  assert.deepEqual(nameTracking,{readable:true,preserved:true});
  await page.setViewportSize({width:820,height:1100});
  await page.evaluate(()=>{
    const card=document.createElement('pond-flow-card');
    card.style.height='auto';
    document.querySelector('pond-flow-card').replaceWith(card);
    card.setConfig({demo:true,fish:[{id:'gold',name:'Guld',color:'#d8a657'},{id:'pearl',name:'Perle',color:'#e0ddd4'},{id:'copper',name:'Kobber',color:'#b87962'}]});
    window.scrollTo(0,0);
  });
  await page.screenshot({path:'preview-fish.png',fullPage:true});
  await page.evaluate(()=>document.querySelector('pond-flow-card').setConfig({demo:true,fish:[{name:'Guld',color:'orange'}],fish_bubbles:false,fish_names:false}));
  assert.equal(await page.locator('.fish-bubble').count(),0);
  assert.equal(await page.locator('.fish-legend').count(),0);
  assert.equal(await page.locator('.fish-name').count(),0);
  await page.evaluate(()=>document.querySelector('pond-flow-card').setConfig({demo:true,fish:[]}));
  assert.equal(await page.locator('.fish').count(),0);
  await page.evaluate(()=>document.querySelector('pond-flow-card').setConfig({demo:true}));
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.fish-bubble').first().evaluate(el=>el.getAnimations().length),0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const depthLayout=await page.evaluate(()=>{
    const card=document.querySelector('pond-flow-card');
    card.setConfig({demo:true,fish:Array.from({length:18},(_,i)=>({id:'fish-'+i,name:'Fisk '+(i+1),color:['#d8a657','#e0ddd4','#b87962'][i%3]}))});
    const svg=card.shadowRoot.querySelector('.pond-diagram');
    const positions=card.fish();
    return {depth:card.pondDepth(),height:svg.viewBox.baseVal.height,levels:new Set(positions.map(fish=>fish.y)).size,
      inside:positions.every(fish=>fish.y-16>362 && fish.y+25<550+card.pondDepth()),
      clip:card.shadowRoot.querySelector('[data-section="fish-school"]').getAttribute('clip-path')};
  });
  assert.deepEqual(depthLayout,{depth:240,height:695,levels:6,inside:true,clip:'url(#fish-water)'});
  assert.equal(await page.locator('.fish').count(),18);
  await page.screenshot({path:'preview-many-fish.png',fullPage:true});
  await page.setViewportSize({width:360,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth),true);
  console.log('PASS: demo disabled, service payload, pump animation, unavailable entities');
} finally { await browser.close(); }
