// Embed the approved native SVG concept into the standalone HACS module.
import {readFile,writeFile} from 'node:fs/promises';
let svg=await readFile('docs/pond-section-concept.svg','utf8');
svg=svg.replace('width="1200" height="760" viewBox="0 0 1200 760"','viewBox="0 175 1200 455"');
svg=svg.slice(0,svg.indexOf('<!-- Tilstandsstribe'))+'</svg>';
const start=svg.indexOf('<text x="48" y="51"');
svg=svg.slice(0,start)+svg.slice(svg.indexOf('<!-- Tydeligt'));
svg=svg.replace('<svg xmlns=', '<svg data-section="diagram" class="pond-diagram" role="img" aria-label="Snit gennem dammen med fisk, skimmer, filterpumpe, trykfilter med UV-C og vandfald" xmlns=');
for(const path of ['M391 502H650L795 462H913','M1026 365H1060V251H846','M846 258H819V290H791V322H764V344L739 362']) {
  svg=svg.replace(`d="${path}" class="flow"`,`d="${path}" class="flow ${'${active ? \'active\' : \'\'}'}"`);
  svg=svg.replace(`class="flow" d="${path}"`,`class="flow ${'${active ? \'active\' : \'\'}'}" d="${path}"`);
}
svg=svg.replace('<path d="M249 365H216" fill="none" stroke="#287785" stroke-width="2" marker-end="url(#arrow)"/>','<path d="M249 365H216" class="flow ${demo || this.running(\'skimmer_running\') ? \'active\' : \'\'}" marker-end="url(#arrow)"/>');
svg=svg.replace('<path d="M370 492V514M359 503H381"','<path class="${active ? \'rotor\' : \'\'}" d="M370 492V514M359 503H381"');
svg=svg.replace('fill="#b9a6c7"','fill="${demo || this.running(\'uv_running\') ? \'#b9a6c7\' : \'#86948e\'}"');
svg=svg.replace('Overfladerens · kører','Overfladerens · ${esc(operating(\'skimmer_running\'))}');
svg=svg.replace('Filterpumpe · kører','Filterpumpe · ${esc(operating(\'pump_running\'))}');
svg=svg.replace('UV-C tændt','UV-C · ${esc(operating(\'uv_running\'))}');
let temperatureIndex=0;
svg=svg.replaceAll('23,1 °C',()=>temperatureIndex++ === 0 ? '${val(\'temp_surface\',\'23,1 °C\')}' : '${val(\'temp_bottom\',\'23,1 °C\')}');
svg=svg.replace('48 cm','${val(\'water_level\',\'48 cm\')}');
const info=[['x="670" y="446"','temp_surface'],['x="559" y="532"','temp_bottom'],['x="104" y="453"','water_level'],['x="343" y="606"','pump_running'],['x="1094" y="425"','uv_running'],['x="68" y="238"','skimmer_running']];
for(const [position,key] of info) svg=svg.replace(position,`${position} data-info="${key}"`);
svg=svg.replace('<!-- Filterpumpe og trykledning. -->','<g data-section="fish-school">${this.fishMarkup()}</g><!-- Filterpumpe og trykledning. -->');
svg=svg.replace('text{font-family:', '.pond-diagram text{font-family:').replace('stroke-width:3;stroke-dasharray:7 9','stroke-width:3;stroke-dasharray:7 9;opacity:.3').replace('</style>', '.flow.active{opacity:1}.fish{pointer-events:visiblePainted}</style>');
// HA theme background, with a restrained dark material palette for the section.
for(const [light,dark] of Object.entries({'#f4f5f0':'var(--ha-card-background,var(--card-background-color,#1c2328))','#263d43':'var(--primary-text-color,#e1e8e9)','#d9d6cb':'#303635','#b9b6ac':'#4a514c','#d6e9ec':'#21444e','#a7cbd2':'#183640','#e8ebE5':'#354445','#c2cdc5':'#43574e','#93a99d':'#688775','#a8aca3':'#57625b','#b3b9a8':'#596c57','#9b7353':'#c49a72','#737d73':'#9aa99d'})) svg=svg.replaceAll(light,dark);
svg=svg.replace('<path d="M249 365H216" class="flow ${demo || this.running(\'skimmer_running\') ? \'active\' : \'\'}" marker-end="url(#arrow)"/>',`<g class="skimmer-current ${'${demo || this.running(\'skimmer_running\') ? \'moving\' : \'\'}'}">
<path d="M325 361Q260 348 190 365V391"/><path d="M330 373Q260 377 190 365V391"/><path d="M316 387Q250 399 190 370V391"/>
</g>`);
svg=svg.replace('IceFree 4 Seasons','Beluftning').replace('Vinterudstyr · 5 W · status ikke tilkoblet','${esc(operating(\'aerator_running\'))}');
svg=svg.replace('x="560" y="220"','x="560" y="220" data-info="aerator_running"');
svg=svg.replace('<!-- Isfriholder: kendt udstyr, ingen opdigtet elektrisk status. -->','<!-- Beluftning uses the controller luftpumpe entities. -->');
svg=svg.replace('<g opacity=".68"><ellipse',`<g data-info="aerator_running" aria-label="Beluftning, vis status"><g class="fountain ${'${demo || this.running(\'aerator_running\') ? \'running\' : \'\'}'}">
<path d="M560 351Q538 279 516 353"/><path d="M560 351Q582 279 604 353"/><path d="M560 351Q549 290 536 354"/><path d="M560 351Q571 290 584 354"/>
<ellipse class="ripple" cx="560" cy="364" rx="46" ry="8"/>
</g><ellipse`);
svg=svg.replace('Snit gennem dammen med fisk, skimmer, filterpumpe, trykfilter med UV-C og vandfald','Snit gennem dammen med fisk, skimmer, beluftning med springvand, filterpumpe, trykfilter med UV-C og vandfald');
// Add depth below the fixed surface; equipment above ground keeps its scale.
const waterShape='M141 362H748L711 ${474+depth}Q679 ${547+depth} 584 ${550+depth}H288Q198 ${546+depth} 182 ${483+depth}Z';
const shapes={
 'M50 342H135L177 485Q192 551 288 556H584Q681 553 714 475L755 342H1150V608H50Z':'M50 342H135L177 ${485+depth}Q192 ${551+depth} 288 ${556+depth}H584Q681 ${553+depth} 714 ${475+depth}L755 342H1150V${608+depth}H50Z',
 'M135 342L177 485Q192 551 288 556H584Q681 553 714 475L755 342':'M135 342L177 ${485+depth}Q192 ${551+depth} 288 ${556+depth}H584Q681 ${553+depth} 714 ${475+depth}L755 342',
 'M141 362H748L711 474Q679 547 584 550H288Q198 546 182 483Z':waterShape,
 'M391 502H650L795 462H913':'M391 ${502+depth}H650L795 462H913',
 'M520 502H559':'M520 ${502+depth}H559',
 'M115 363V550M109 363H121M109 550H121':'M115 363V${550+depth}M109 363H121M109 ${550+depth}H121',
 'M343 535V581':'M343 ${535+depth}V${581+depth}'
};
for(const [original,dynamic] of Object.entries(shapes)) svg=svg.replaceAll(original,dynamic);
svg=svg.replace('viewBox="0 175 1200 455"','viewBox="0 175 1200 ${455+depth}"').replace('height="760"','height="${760+depth}"');
svg=svg.replace(/(<rect x="290"[\s\S]*?stroke="#b8d6dc" stroke-width="3"\/>)/, '<g transform="translate(0 ${depth})">$1</g>');
for(const [x,y] of [[469,527],[500,530],[559,532],[343,606]]) svg=svg.replace(`x="${x}" y="${y}"`,`x="${x}" y="${'${'+y+'+depth}'}"`).replace(`cx="${x}" cy="${y}"`,`cx="${x}" cy="${'${'+y+'+depth}'}"`);
svg=svg.replace('</defs>',`<clipPath id="fish-water"><path d="${waterShape}"/></clipPath></defs>`).replace('<g data-section="fish-school">','<g data-section="fish-school" clip-path="url(#fish-water)">');
let card=await readFile('pond-flow-card.js','utf8');
const from=card.indexOf('<svg '),to=card.indexOf('</svg>',from)+6;
if(from<0 || to<6) throw Error('Card SVG not found');
card=card.slice(0,from)+svg+card.slice(to);
await writeFile('pond-flow-card.js',card);
