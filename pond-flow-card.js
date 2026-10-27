const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = {temp_bottom:'Dam Temperatur Bund',temp_surface:'Dam Temperatur Overflade',water_level:'Vandstand',status:'Dam status',last_event:'Seneste hændelse',pump_running:'Filterpumpe koerer',uv_running:'UV-C taendt',aerator_running:'Luftpumpe koerer',skimmer_running:'Skimmer koerer',skimmer_mode:'Skimmer tilstand',skimmer_plan:'Skimmer plan',season:'Sæson',pump_mode:'Filterpumpe tilstand',uv_mode:'UV-C tilstand',aerator_mode:'Luftpumpe tilstand',pump_hours:'Filterpumpe drift total',uv_hours:'UV-C drift total',aerator_hours:'Luftpumpe drift total',skimmer_hours:'Skimmer drift total',skimmer_locked:'Skimmer sikkerhedsspaerret',low_water:'Alarm lav vandstand',level_fault:'Fejl niveausensor',temp_fault:'Fejl temperatursensor',relay_fault:'Fejl relaemodul',settings_fault:'Fejl indstillinger',schedule_fault:'Fejl ugeplan ur',uv_service:'UV-C service paakraevet'};
const binaryKeys = new Set(['skimmer_locked','low_water','level_fault','temp_fault','relay_fault','settings_fault','schedule_fault','uv_service']);
const slug = value => value.toLowerCase().replaceAll('æ','ae').replaceAll('ø','o').replaceAll('å','a').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
class PondFlowCard extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); }
  setConfig(config) { this.config = {...config}; this.signature = ''; this.render(); }
  set hass(hass) {
    this._hass = hass;
    if (!this.config) return;
    const prefix = this.config.entity_prefix || 'garden_pond_controller';
    const signature = JSON.stringify([Object.keys({...labels,...this.config.entities}).map(key => this.state(key)),Object.entries(hass.states).filter(([id]) => id.startsWith(`number.${prefix}_`) || id.startsWith(`switch.${prefix}_`))]);
    if (signature !== this.signature) { this.signature = signature; this.render(); }
  }
  getCardSize() { return 7; }
  entity(key) {
    const explicit = this.config.entities?.[key];
    if (explicit && this._hass?.states[explicit]) return explicit;
    if (!labels[key]) return explicit;
    const prefix = this.config.entity_prefix || 'garden_pond_controller';
    const domain = key.endsWith('_mode') || key === 'season' || key === 'skimmer_plan' ? 'select' : key.endsWith('_running') || binaryKeys.has(key) ? 'binary_sensor' : 'sensor';
    const expected = `${domain}.${prefix}_${slug(labels[key])}`;
    if (this._hass?.states[expected]) return expected;
    const matches = Object.entries(this._hass?.states || {}).filter(([id,s]) => id.startsWith(`${domain}.${prefix}_`) && (slug(s.attributes?.friendly_name || '') === slug(labels[key]) || slug(s.attributes?.friendly_name || '').endsWith('_'+slug(labels[key]))));
    return matches.length === 1 ? matches[0][0] : explicit || expected;
  }
  state(key) { return this._hass?.states[this.entity(key)]; }
  value(key) {
    const s = this.state(key);
    if (!s || ['unknown','unavailable'].includes(s.state)) return '—';
    const number = Number(s.state);
    const formatted = s.state.trim() !== '' && Number.isFinite(number) ? new Intl.NumberFormat(this._hass?.locale?.language || 'da-DK',{maximumFractionDigits:1}).format(number) : s.state;
    return `${formatted}${s.attributes.unit_of_measurement ? ' '+s.attributes.unit_of_measurement : ''}`;
  }
  running(key) { return this.state(key)?.state === 'on'; }
  async change(key, option) {
    const entity = this.entity(key);
    const state = this.state(key);
    if (!entity || !state || !this._hass || this.config.demo || !state.attributes.options?.includes(option) || ['unknown','unavailable'].includes(state.state)) return;
    try { this.error = ''; await this._hass.callService('select','select_option',{entity_id:entity,option}); }
    catch { this.error = 'Ændringen kunne ikke sendes. Kontrollér forbindelsen.'; this.render(); }
  }
  render() {
    if (!this.config) return;
    const demo = this.config.demo === true;
    const active = demo || this.running('pump_running');
    const val = (key, sample) => esc(demo ? sample : this.value(key));
    const controls = [['season','Sæson'],['pump_mode','Filterpumpe'],['uv_mode','UV-C'],['aerator_mode','Beluftning'],['skimmer_mode','Skimmer'],['skimmer_plan','Skimmerplan'],['icefree_mode','Isfriholder']].filter(([key]) => demo || this.state(key));
    const operating = key => demo ? 'Kører' : !this.state(key) || ['unknown','unavailable'].includes(this.state(key).state) ? 'Ukendt' : this.running(key) ? 'Kører' : 'Stoppet';
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block}ha-card{display:block;background:var(--ha-card-background,var(--card-background-color,#112631));color:var(--primary-text-color,#edf6f5);border-radius:22px;overflow:hidden;font-family:var(--paper-font-body1_-_font-family,system-ui)}
      header{padding:22px 24px 8px;display:flex;justify-content:space-between;align-items:center}h2{font-size:21px;margin:0}small{opacity:.7}.badge{font-size:12px;padding:7px 10px;border-radius:30px;background:#54887933}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 24px}.metric{background:#7396a415;padding:12px;border-radius:12px}.metric small{display:block;font-size:11px}.metric strong{display:block;margin-top:4px;font-size:18px}
      svg{width:100%;height:auto;display:block}svg text{font-family:system-ui;fill:#d7e9ed;font-size:13px}.flow{fill:none;stroke:#53d5db;stroke-width:7;stroke-linecap:round;stroke-dasharray:9 14;opacity:.28}.active{opacity:1;animation:water 2s linear infinite}@keyframes water{to{stroke-dashoffset:-46}}@media(prefers-reduced-motion:reduce){.active{animation:none}}
      .controls{padding:4px 24px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.control{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px}.control select{max-width:115px;padding:8px;border:1px solid #7196a550;border-radius:8px;background:var(--card-background-color,#193340);color:inherit}.status{padding:12px 24px;border-top:1px solid #7196a530;font-size:12px;line-height:1.6}.error{color:#f9a99b}.note{opacity:.65;font-size:11px}@media(max-width:420px){.controls{grid-template-columns:1fr}.metrics{padding:12px}.metric strong{font-size:15px}}
      [data-info]{cursor:pointer}.diagram-value{font-size:15px;font-weight:600;fill:#fff}.equipment{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px 24px 18px}.equipment button{font:inherit;text-align:left;color:inherit;background:#7396a415;border:1px solid #7196a530;border-radius:10px;padding:10px;cursor:pointer}.equipment small{display:block}.equipment strong{font-size:13px}.controls button{padding:9px;border-radius:7px;border:1px solid #7196a550;color:inherit;background:transparent;cursor:pointer}.controls button[aria-pressed=true]{background:#438b8b55}.options{display:flex;gap:4px;flex-wrap:wrap}.control{flex-wrap:wrap}.rotor{transform-box:fill-box;transform-origin:center;animation:spin 1.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.rotor{animation:none}}details{padding:0 24px 16px;font-size:12px;overflow-wrap:anywhere}
    </style>
    <ha-card>
      <header><div><small>HAVENS VANDKREDSLØB</small><h2>${esc(this.config.title || 'Dammen')}</h2></div><span class="badge">${demo ? 'DEMO · eksempeldata' : val('status','')}</span></header>
      <div class="metrics"><div class="metric"><small>OVERFLADE</small><strong>${val('temp_surface','23,1 °C')}</strong></div><div class="metric"><small>BUND</small><strong>${val('temp_bottom','23,1 °C')}</strong></div><div class="metric"><small>VANDSTAND</small><strong>${val('water_level','48 cm')}</strong></div></div>
<svg class="pond-diagram" role="img" aria-label="Snit gennem dammen med fisk, skimmer, filterpumpe, trykfilter med UV-C og vandfald" xmlns="http://www.w3.org/2000/svg" viewBox="0 175 1200 455">
<defs>
 <pattern id="earth" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 22L22 0" stroke="#b9b6ac" stroke-width=".6"/></pattern>
 <linearGradient id="water" x2="0" y2="1"><stop stop-color="#d6e9ec"/><stop offset="1" stop-color="#a7cbd2"/></linearGradient>
 <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1L8 5L0 9" fill="none" stroke="#287785" stroke-width="1.7"/></marker>
 <style>.pond-diagram text{font-family:Segoe UI,Arial,sans-serif;fill:#263d43}.label{font-size:17px;font-weight:600}.small{font-size:13px;fill:#63777b}.value{font-size:25px;font-weight:600}.leader{fill:none;stroke:#86979a;stroke-width:1}.pipe{fill:none;stroke:#405a61;stroke-width:12;stroke-linejoin:round;stroke-linecap:round}.flow{fill:none;stroke:#5baebd;stroke-width:3;stroke-dasharray:7 9;opacity:.3}.frame{fill:#f9faf7;stroke:#d8dfdb;stroke-width:1}.flow.active{opacity:1}.fish{pointer-events:none}</style>
</defs>
<rect width="1200" height="760" rx="24" fill="#f4f5f0"/>
<!-- Tydeligt tværsnit: jord, bassinfolie og vand. -->
<path d="M50 342H135L177 485Q192 551 288 556H584Q681 553 714 475L755 342H1150V608H50Z" fill="#d9d6cb"/>
<path d="M50 342H135L177 485Q192 551 288 556H584Q681 553 714 475L755 342H1150V608H50Z" fill="url(#earth)"/>
<path d="M135 342L177 485Q192 551 288 556H584Q681 553 714 475L755 342" fill="none" stroke="#586663" stroke-width="8"/>
<path d="M141 362H748L711 474Q679 547 584 550H288Q198 546 182 483Z" fill="url(#water)"/>
<path d="M141 362H748" stroke="#3b8a98" stroke-width="3"/>
<path d="M50 339H133M758 339H1150" stroke="#83947c" stroke-width="6"/>

<!-- Beplantning, sparsomt og uden illustrationseffekter. -->
<g fill="none" stroke="#738a70" stroke-width="3" stroke-linecap="round"><path d="M96 337Q71 304 74 276M96 337Q101 294 113 267M96 337Q88 294 92 255M1043 336Q1025 310 1030 289M1043 336Q1055 309 1057 282"/></g>
<g fill="#b3b9a8" stroke="#8f9b89"><ellipse cx="91" cy="341" rx="27" ry="9"/><ellipse cx="1081" cy="338" rx="31" ry="10"/></g>

<!-- Fish are decorative silhouettes, not live measurements. -->
<g aria-hidden="true" class="fish" transform="translate(350 425)"><path d="M-24 0Q-10-12 10-7L23-16L19 0L23 16L10 7Q-10 12-24 0Z" fill="#9b7353" opacity=".78"/><path d="M-3-6L5-13L9-6" fill="#9b7353" opacity=".6"/></g>
<g aria-hidden="true" class="fish" transform="translate(595 480) scale(-.8 .8)"><path d="M-24 0Q-10-12 10-7L23-16L19 0L23 16L10 7Q-10 12-24 0Z" fill="#737d73" opacity=".8"/><path d="M-3-6L5-13L9-6" fill="#737d73" opacity=".6"/></g>
<!-- Filterpumpe og trykledning. -->
<path class="pipe" d="M391 502H650L795 462H913"/>
<path class="flow ${active ? 'active' : ''}" d="M391 502H650L795 462H913"/>
<path d="M520 502H559" fill="none" stroke="#287785" stroke-width="2" marker-end="url(#arrow)"/>
<rect x="290" y="477" width="106" height="53" rx="23" fill="#40565d" stroke="#253d45" stroke-width="2"/>
<g stroke="#849ca2" stroke-width="3"><path d="M307 486V521M319 482V525M331 481V526M343 482V525"/></g>
<circle cx="370" cy="503" r="15" fill="#263f48" stroke="#8bbbc2"/>
<path class="${active ? 'rotor' : ''}" d="M370 492V514M359 503H381" stroke="#b8d6dc" stroke-width="3"/>

<!-- Filtrets reelle rolle: beholder, filtermaterialer og UV-C i toppen. -->
<rect x="914" y="337" width="112" height="194" rx="27" fill="#e8ebE5" stroke="#50666a" stroke-width="2"/>
<path d="M928 385H1012V506Q1012 516 1000 516H940Q928 516 928 506Z" fill="#c2cdc5"/>
<g stroke="#93a99d" stroke-width="7"><path d="M937 404H1002M937 427H1002M937 450H1002M937 473H1002M937 496H1002"/></g>
<rect x="909" y="320" width="122" height="35" rx="9" fill="#53696d"/>
<rect x="929" y="327" width="83" height="11" rx="5" fill="${demo || this.running('uv_running') ? '#b9a6c7' : '#86948e'}"/>
<text x="971" y="372" text-anchor="middle" class="small">UV-C</text>

<!-- Returledning til et klart aflæseligt vandfald. -->
<path class="pipe" d="M1026 365H1060V251H846"/>
<path class="flow ${active ? 'active' : ''}" d="M1026 365H1060V251H846"/>
<path d="M993 251H949" fill="none" stroke="#287785" stroke-width="2" marker-end="url(#arrow)"/>
<path d="M846 269H817V301H789V333H762V350H742" fill="none" stroke="#a8aca3" stroke-width="25" stroke-linejoin="round"/>
<path d="M846 258H819V290H791V322H764V344L739 362" fill="none" stroke="#73b4c0" stroke-width="8" stroke-linejoin="round"/>
<path d="M846 258H819V290H791V322H764V344L739 362" class="flow ${active ? 'active' : ''}" stroke="#e0f1f1"/>

<!-- Skimmer i vandlinjen, adskilt fra det kendte filterkredsløb. -->
<rect x="166" y="350" width="42" height="57" rx="4" fill="#52676d" stroke="#314a52" stroke-width="2"/>
<rect x="175" y="358" width="26" height="16" fill="#163e4c"/>
<path d="M249 365H216" class="flow ${demo || this.running('skimmer_running') ? 'active' : ''}" marker-end="url(#arrow)"/>

<!-- Isfriholder: kendt udstyr, ingen opdigtet elektrisk status. -->
<g opacity=".68"><ellipse cx="560" cy="361" rx="32" ry="7" fill="#ecefe9" stroke="#697e80"/><rect x="547" y="349" width="26" height="9" rx="3" fill="#8d9f9c"/><path d="M560 370V412" stroke="#789aa1" stroke-dasharray="3 5"/></g>

<!-- Etiketter og målepunkter uden krydsende linjer. -->
<path class="leader" d="M186 347V243H128"/><text x="68" y="218" class="label">Skimmer</text><text x="68" y="238" data-info="skimmer_running" class="small">Overfladerens · ${esc(operating('skimmer_running'))}</text>
<path class="leader" d="M560 345V235"/><text x="560" y="199" text-anchor="middle" class="label">IceFree 4 Seasons</text><text x="560" y="220" text-anchor="middle" class="small">Vinterudstyr · 5 W · status ikke tilkoblet</text>
<text x="893" y="202" class="label">Retur via vandfald</text><text x="893" y="223" class="small">Fra trykfilter til dam</text>
<path class="leader" d="M1029 433H1094"/><text x="1094" y="405" text-anchor="end" class="label">Trykfilter</text><text x="1094" y="425" data-info="uv_running" text-anchor="end" class="small">UV-C · ${esc(operating('uv_running'))}</text>
<circle cx="467" cy="391" r="4" fill="#287785"/><path class="leader" d="M474 391H670"/><text x="670" y="415" text-anchor="end" class="small">OVERFLADE</text><text x="670" y="446" data-info="temp_surface" text-anchor="end" class="value">${val('temp_surface','23,1 °C')}</text>
<circle cx="469" cy="527" r="4" fill="#287785"/><text x="500" y="530" class="small">BUND</text><text x="559" y="532" data-info="temp_bottom" font-size="20" font-weight="600">${val('temp_bottom','23,1 °C')}</text>
<path d="M115 363V550M109 363H121M109 550H121" fill="none" stroke="#627d82"/><text x="104" y="453" data-info="water_level" text-anchor="end" font-size="16" font-weight="600">${val('water_level','48 cm')}</text>
<path class="leader" d="M343 535V581"/><text x="343" y="606" data-info="pump_running" text-anchor="middle" class="label">Filterpumpe · ${esc(operating('pump_running'))}</text>

</svg>
      <div class="equipment">${[['pump_running','Filterpumpe','pump_hours'],['uv_running','UV-C','uv_hours'],['aerator_running','Beluftning','aerator_hours'],['skimmer_running','Skimmer','skimmer_hours']].map(([key,label,hours]) => `<button data-info="${key}"><small>${label}</small><strong>${esc(operating(key))} · ${val(hours,'2,5 h')} i alt</strong></button>`).join('')}</div>
      <div class="equipment">${[...binaryKeys].filter(key => this.state(key)).map(key => `<button data-info="${key}" ${this.running(key) ? 'class="error"' : ''}><small>${esc(labels[key])}</small><strong>${['unknown','unavailable'].includes(this.state(key).state) ? 'Ukendt' : this.running(key) ? 'Aktiv' : 'OK'}</strong></button>`).join('')}</div>
      <div class="controls">${controls.map(([key,label]) => {
        const state = this.state(key);
        const options = state?.attributes.options || (key === 'season' ? ['Auto','Sommer','Vinter'] : key === 'skimmer_plan' ? [] : ['Auto','Til','Fra']);
        const disabled = demo || !state || ['unavailable','unknown'].includes(state.state);
        return `<div class="control"><span>${label}</span><div class="options">${!state && !demo ? '<small>Ikke tilkoblet</small>' : options.map(option => `<button data-key="${key}" data-option="${esc(option)}" aria-label="${label}: ${esc(option)}" aria-pressed="${option === state?.state}" ${disabled ? 'disabled' : ''}>${esc(option)}</button>`).join('')}</div></div>`;
      }).join('')}</div>
      <details><summary>Indstillinger og skimmerens ugeplan</summary><div class="equipment">${Object.entries(this._hass?.states || {}).filter(([id]) => ['number','switch'].some(domain => id.startsWith(`${domain}.${this.config.entity_prefix || 'garden_pond_controller'}_`))).map(([id,s]) => `<button data-entity="${esc(id)}"><small>${esc(s.attributes.friendly_name || id)}</small><strong>${esc(s.state)} ${esc(s.attributes.unit_of_measurement || '')}</strong></button>`).join('')}</div><span class="note">Tryk for at åbne og ændre indstillingen i Home Assistant.</span></details>
      <details><summary>Entiteter og forbindelser</summary>${Object.keys(labels).map(key => `<div>${esc(labels[key])}: ${this.state(key) ? '✓' : 'Mangler'} <code>${esc(this.entity(key))}</code></div>`).join('')}</details>
      <div class="status">Seneste hændelse: ${val('last_event','Filterpumpe startet automatisk')}<br><span class="note">${demo ? 'Demo betjener ikke dit udstyr.' : 'Tryk på en måling eller udstyrsstatus for detaljer. Relæstatus bekræfter ikke fysisk drift.'}</span>${this.error ? `<div class="error" role="alert">${esc(this.error)}</div>` : ''}</div>
    </ha-card>`;
    this.shadowRoot.querySelectorAll('[data-key]').forEach(el => el.addEventListener('click', () => this.change(el.dataset.key,el.dataset.option)));
    this.shadowRoot.querySelectorAll('[data-entity]').forEach(el => el.addEventListener('click', () => { if (!demo) this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:el.dataset.entity},bubbles:true,composed:true})); }));
    this.shadowRoot.querySelectorAll('[data-info]').forEach(el => {
      const open = () => { const id = this.entity(el.dataset.info); if (!demo && this.state(el.dataset.info)) this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true})); };
      el.addEventListener('click',open);
      if (el.tagName !== 'BUTTON') { el.setAttribute('tabindex','0'); el.setAttribute('role','button'); el.addEventListener('keydown',event => { if (['Enter',' '].includes(event.key)) {event.preventDefault();open();} }); }
    });
  }
}
if (!customElements.get('pond-flow-card')) customElements.define('pond-flow-card',PondFlowCard);
window.customCards = window.customCards || [];
window.customCards.push({type:'pond-flow-card',name:'Pond Flow Card',description:'SVG-overblik og betjening af dammens udstyr'});
