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
svg=svg.replace('<rect x="929" y="327" width="83" height="11" rx="5" fill="#b9a6c7"/>',`<g class="uv-lamp ${'${demo || this.running(\'uv_running\') ? \'on\' : \'\'}'}" data-info="uv_running" aria-label="UV-C pære lodret i filteret">
<rect x="955" y="325" width="30" height="23" rx="5" fill="#748180" stroke="#243c40" stroke-width="2"/>
<rect class="uv-glow" x="936" y="342" width="68" height="169" rx="30" fill="url(#uv-warmth)"/>
<rect x="961" y="345" width="18" height="152" rx="8" fill="#536c6d" stroke="#9cad9f" stroke-width="1.5"/>
<rect class="uv-tube" x="966" y="350" width="8" height="141" rx="4"/>
</g>`);
svg=svg.replace('</defs>','<radialGradient id="uv-warmth"><stop stop-color="#eadbff" stop-opacity=".9"/><stop offset=".45" stop-color="#b58aff" stop-opacity=".5"/><stop offset="1" stop-color="#8642ed" stop-opacity="0"/></radialGradient></defs>');
svg=svg.replace('<text x="971" y="372"','<text x="970" y="307"');
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
<g transform="translate(186 365)"><ellipse class="intake-ring" cx="95" cy="8" rx="95" ry="7"/><ellipse class="intake-ring" cx="95" cy="8" rx="95" ry="7"/><ellipse class="intake-ring" cx="95" cy="8" rx="95" ry="7"/></g>
</g>`);
svg=svg.replace('IceFree 4 Seasons','Beluftning').replace('Vinterudstyr · 5 W · status ikke tilkoblet','${esc(operating(\'aerator_running\'))}');
svg=svg.replace('x="560" y="220"','x="560" y="220" data-info="aerator_running"');
svg=svg.replace('<!-- Isfriholder: kendt udstyr, ingen opdigtet elektrisk status. -->','<!-- Beluftning uses the controller luftpumpe entities. -->');
svg=svg.replace('<g opacity=".68"><ellipse',`<g data-info="aerator_running" aria-label="Beluftning, vis status"><g class="fountain ${'${demo || this.running(\'aerator_running\') ? \'running\' : \'\'}'}">
<path d="M560 351Q538 279 516 353"/><path d="M560 351Q582 279 604 353"/><path d="M560 351Q549 290 536 354"/><path d="M560 351Q571 290 584 354"/>
<ellipse class="ripple" cx="560" cy="364" rx="46" ry="8"/>
</g><ellipse`);
svg=svg.replace('Snit gennem dammen med fisk, skimmer, filterpumpe, trykfilter med UV-C og vandfald','Snit gennem dammen med fisk, skimmer, beluftning med springvand, filterpumpe, trykfilter med UV-C og vandfald');
// Side elevation: horizontal spillway lips, then visibly free falling water.
svg=svg.replaceAll('M1026 365H1060V251H846','M1026 365H1060V246H884V256H874').replace('M993 251H949','M993 246H949');
const waterfallStart=svg.indexOf('<path d="M846 269');
const waterfallEnd=svg.indexOf('<!-- Skimmer',waterfallStart);
if(waterfallStart<0 || waterfallEnd<0) throw Error('Waterfall geometry not found');
svg=svg.slice(0,waterfallStart)+`<g data-section="waterfall" aria-label="Trappevandfald set fra siden">
<path d="M896 264H840V304H795V344H750V363H900Z" fill="#303a36" stroke="#59665b" stroke-width="2"/>
<path d="M888 248V268H836V260M840 288V308H791V300M795 328V348H746V340" fill="none" stroke="#7b877b" stroke-width="7" stroke-linejoin="miter"/>
<path d="M840 270V289M795 310V329M750 350V361" fill="none" stroke="#202b29" stroke-width="3"/>
<g class="waterfall-water ${'${active ? \'running\' : \'\'}'}">
<path d="M874 256H840Q834 256 834 263Q825 276 825 296H795Q789 296 789 303Q780 316 780 336H750Q744 336 744 343Q736 354 732 362" fill="none" stroke="#62aaba" stroke-width="8" stroke-linecap="round"/>
<path class="flow ${'${active ? \'active\' : \'\'}'}" d="M874 256H840Q834 256 834 263Q825 276 825 296H795Q789 296 789 303Q780 316 780 336H750Q744 336 744 343Q736 354 732 362"/>
<path class="waterfall-splash" d="M723 359L719 354M732 358V352M741 359L747 353"/>
<ellipse class="waterfall-ripple" cx="728" cy="364" rx="23" ry="4"/>
</g></g>
`+svg.slice(waterfallEnd);
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
svg=svg.replace('<g class="skimmer-current ', '<g clip-path="url(#fish-water)" class="skimmer-current ');
svg=svg.replace('<text x="1094" y="405" text-anchor="end"', '<text x="1044" y="405" text-anchor="start"')
 .replace('<text x="1094" y="425" data-info="uv_running" text-anchor="end"', '<text x="1044" y="425" data-info="uv_running" text-anchor="start"');
svg=svg.replace('UV-C · ${esc(operating(\'uv_running\'))}</text>', 'UV-C · ${esc(operating(\'uv_running\'))}</text><text x="1044" y="447" data-info="uv_hours" class="small">${val(\'uv_hours\',\'2,5 h\')} tændt i alt</text>');
let card=await readFile('pond-flow-card.js','utf8');
svg=svg.replace('Retur via vandfald','Retur').replace('<text x="893" y="223" class="small">Fra trykfilter til dam</text>','');
svg=svg.replace('Filterpumpe · ${esc(operating(\'pump_running\'))}</text>', 'Filterpumpe</text><text x="343" y="${618+depth}" data-info="pump_running" text-anchor="middle" class="small">${esc(operating(\'pump_running\'))}</text>')
 .replace('y="${606+depth}" data-info="pump_running"','y="${596+depth}"');
svg=svg.replace('<text x="670" y="415" text-anchor="end" class="small">OVERFLADE</text><text x="670" y="446" data-info="temp_surface" text-anchor="end" class="value">','<text x="500" y="400" class="small">OVERFLADE</text><text x="590" y="402" data-info="temp_surface" class="temperature-reading">')
 .replace('data-info="temp_bottom" font-size="20" font-weight="600"','data-info="temp_bottom" class="temperature-reading"');
svg=svg.replace('class="small">UV-C</text>', 'class="label">UV-C</text>').replace('.small{font-size:13px;', '.small{font-size:13px;font-weight:400;').replace('.value{font-size:25px;font-weight:600}', '.temperature-reading{font-size:13px;font-weight:600}');
svg=svg.replace('y="${596+depth}"','y="${584+depth}"').replace('y="${618+depth}"','y="${601+depth}"').replace('V${581+depth}','V${568+depth}');
svg=svg.replace('</defs>','<g id="temperature-icon" fill="none" stroke="#9cc7d0" stroke-width="1.7" stroke-linecap="round"><path d="M5 12V4a3 3 0 0 1 6 0v8a5 5 0 1 1-6 0Z"/><path d="M8 6v10"/><circle cx="8" cy="17" r="1.8" fill="#9cc7d0" stroke="none"/></g></defs>');
const temperature=(key,label,y)=>`<g class="temperature-status" data-info="${key}" transform="translate(475 ${y})"><use href="#temperature-icon" x="0" y="-16"/><text x="23" y="0"><tspan class="small">${label}</tspan><tspan dx="6" class="temperature-reading">${'${val(\''+key+'\',\'23,1 °C\')}'}</tspan></text></g>`;
svg=svg.replace(/<circle cx="467"[^\n]*/, temperature('temp_surface','OVERFLADE','400'))
 .replace(/<circle cx="469"[^\n]*/,temperature('temp_bottom','BUND','${530+depth}'));
const from=card.indexOf('<svg '),to=card.indexOf('</svg>',from)+6;
if(from<0 || to<6) throw Error('Card SVG not found');
card=card.slice(0,from)+svg+card.slice(to);
await writeFile('pond-flow-card.js',card);
