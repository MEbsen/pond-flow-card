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
      <div class="metrics"><div class="metric"><small>OVERFLADE</small><strong>${val('temp_surface','8,4 °C')}</strong></div><div class="metric"><small>BUND</small><strong>${val('temp_bottom','9,1 °C')}</strong></div><div class="metric"><small>VANDSTAND</small><strong>${val('water_level','95 cm')}</strong></div></div>
      <svg viewBox="0 0 720 390" role="img" aria-label="Vandets vej fra dammens filterpumpe til trykfilter med UV-C og tilbage via vandfald. Separat isfriholder i overfladen.">
        <defs><linearGradient id="water" x2="0" y2="1"><stop stop-color="#2b8494"/><stop offset="1" stop-color="#123f59"/></linearGradient><linearGradient id="land" x2="0" y2="1"><stop stop-color="#477369"/><stop offset="1" stop-color="#263e3d"/></linearGradient></defs>
        <rect width="720" height="390" fill="#112631"/>
        <path d="M25 180 Q160 130 340 160 L420 180 Q485 95 555 76 Q610 80 625 175 L695 180 L695 352 L25 352Z" fill="url(#land)"/>
        <path d="M35 190 Q200 165 435 191 L420 270 Q385 338 230 337 Q85 330 50 267Z" fill="url(#water)" stroke="#72b9bb" stroke-width="2"/>
        <path d="M35 190 Q200 165 435 191" stroke="#98e4df" fill="none" stroke-width="3"/>
        <g data-info="skimmer_running" aria-label="Skimmerstatus"><rect x="380" y="178" width="36" height="25" rx="3" fill="#254451" stroke="#7daeb1"/><path class="flow ${demo || this.running('skimmer_running') ? 'active' : ''}" d="M343 194H393"/><text x="360" y="226">Skimmer</text></g>
        <path d="M600 131 L568 104 L540 119 L551 139 L515 148 L525 170 L474 183 L453 205 L417 211" fill="none" stroke="#8ab8ab" stroke-width="24" stroke-linejoin="round"/>
        <path class="flow ${active ? 'active' : ''}" d="M600 131 L568 104 L540 119 L551 139 L515 148 L525 170 L474 183 L453 205 L417 211"/>
        <path d="M197 283 L425 283 L478 241 L559 241" fill="none" stroke="#15313b" stroke-width="14"/>
        <path class="flow ${active ? 'active' : ''}" d="M197 283 L425 283 L478 241 L559 241"/>
        <rect x="155" y="260" width="64" height="46" rx="20" fill="#172a35" stroke="#7aa0a8" stroke-width="2"/>
        <path d="M171 265V301 M182 263V303 M193 264V302" stroke="#64808d" stroke-width="3"/>
        <g data-info="pump_running" role="button" tabindex="0" aria-label="Vis filterpumpens status"><circle cx="235" cy="286" r="18" fill="#1d4354" stroke="#8fbac2"/><path class="${active ? 'rotor' : ''}" d="M235 273V299 M222 286H248" stroke="#93e1e4" stroke-width="4"/></g>
        <rect x="561" y="191" width="88" height="122" rx="23" fill="#243f4d" stroke="#84a3a8" stroke-width="2"/>
        <rect x="571" y="182" width="68" height="25" rx="9" fill="#536b72"/>
        <path d="M579 223H630 M579 242H630 M579 261H630 M579 280H630" stroke="#689b99" stroke-width="10"/>
        <path d="M607 190V287" stroke="${demo || this.running('uv_running') ? '#c2a4ff' : '#677580'}" stroke-width="6"/>
        <path d="M607 183V143L600 131" fill="none" stroke="#7daeb1" stroke-width="9"/>
        <ellipse cx="313" cy="184" rx="32" ry="8" fill="#d9e7db"/><rect x="300" y="173" width="26" height="10" rx="4" fill="#84a59c"/>
        <path d="M313 191V238" stroke="#8ab8c3" stroke-width="3" stroke-dasharray="4 5"/>
        <text x="154" y="329">Filterpumpe</text><text x="554" y="337">Trykfilter</text><text x="583" y="173">UV-C</text>
        <text x="260" y="152">Isfriholder · 5 W</text><text x="455" y="63">Retur via vandfald</text>
        <text class="diagram-value" data-info="temp_surface" x="52" y="215">Overflade ${val('temp_surface','8,4 °C')}</text>
        <text class="diagram-value" data-info="temp_bottom" x="70" y="307">Bund ${val('temp_bottom','9,1 °C')}</text>
        <text data-info="water_level" x="47" y="244">Vandstand ${val('water_level','95 cm')}</text>
        <text data-info="pump_running" x="270" y="309">${esc(operating('pump_running'))}</text>
        <text data-info="uv_running" x="558" y="359">UV-C: ${esc(operating('uv_running'))}</text>
        <text x="44" y="375" style="font-size:11px;fill:#95b5bd">${demo ? 'Illustration med eksempeldata' : 'Animation følger pumpens statusentitet · gennemstrømning er ikke målt'}</text>
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
