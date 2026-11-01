import {readFile} from 'node:fs/promises';
// Use the checked-in controller names/options rather than inventing a card-only API.
export async function controllerStates(prefix='garden_pond_controller') {
  const yaml=await readFile('esphome/pond-controller-v2.yaml','utf8');
  const states={};
  let section='';
  const lines=yaml.replace(/\r\n/g,'\n').split('\n');
  for(let i=0;i<lines.length;i++) {
    const top=lines[i].match(/^([a-z_]+):$/);
    if(top) section=top[1];
    if(!/^  - platform:/.test(lines[i]) || !['sensor','binary_sensor','text_sensor','number','select','switch','text','button'].includes(section)) continue;
    const block=[];
    for(let j=i;j<lines.length && (j===i || !/^  - |^[a-z_]+:/.test(lines[j]));j++) block.push(lines[j]);
    const text=block.join('\n'),name=text.match(/^    name: "([^"]+)"/m)?.[1];
    if(!name) continue;
    const slug=value=>value.toLowerCase().replaceAll('æ','ae').replaceAll('ø','o').replaceAll('å','a').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    const domain=section==='text_sensor'?'sensor':section;
    const attributes={friendly_name:name};
    const option=text.match(/^    options: (\[.+\])/m);
    if(option) attributes.options=JSON.parse(option[1]);
    for(const attr of ['min','max','step']) {
      const value=text.match(new RegExp('^    '+(attr==='step'?'step':attr+'_value')+': ([0-9.-]+)','m'))?.[1];
      if(value!==undefined) attributes[attr]=Number(value);
    }
    const unit=text.match(/^    unit_of_measurement: "([^"]+)"/m)?.[1];
    if(unit) attributes.unit_of_measurement=unit;
    else if(name.toLowerCase().includes('temperatur') && section==='sensor') attributes.unit_of_measurement='°C';
    let state=text.match(/^    initial_(?:value|option): "?([^"\n]+)"?$/m)?.[1];
    if(state===undefined) state=domain==='switch'?text.includes('RESTORE_DEFAULT_ON')?'on':'off':domain==='binary_sensor'?'off':domain==='button'?'unknown':domain==='sensor'?'12.5':'unknown';
    states[`${domain}.${prefix}_${slug(name)}`]={state:String(state),attributes,last_reported:new Date().toISOString()};
  }
  const set=(name,value)=>{states[name].state=value;};
  for(const name of ['filterpumpe_koerer','uv_c_taendt']) set(`binary_sensor.${prefix}_${name}`,'on');
  set(`sensor.${prefix}_dam_status`,'Sommerdrift (temperatur)');
  set(`sensor.${prefix}_filterpumpe_aktuel_styring`,'Auto: sommer, sikkerhed opfyldt, tidsplan tillader drift');
  set(`sensor.${prefix}_skimmer_aktuel_styring`,'Auto: tidsplan tillader ikke drift; næste interval afventes');
  set(`sensor.${prefix}_luftpumpe_aktuel_styring`,'Auto: sommer, tidsplan tillader ikke drift');
  set(`sensor.${prefix}_uv_c_aktuel_styring`,'Auto: filterpumpe tændt, UV-tidsplan tillader drift');
  set(`sensor.${prefix}_vandstand`,'95');
  set(`sensor.${prefix}_seneste_haendelse`,'Filterpumpe startet automatisk');
  return states;
}
