const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
class PondFlowCard extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); }
  setConfig(config) { this.config = {...config}; this.render(); }
  set hass(hass) { this._hass = hass; this.render(); }
  getCardSize() { return 7; }
  state(key) { return this._hass?.states[this.config.entities?.[key]]; }
  value(key) {
    const s = this.state(key);
    if (!s || ['unknown','unavailable'].includes(s.state)) return '—';
    return `${s.state}${s.attributes.unit_of_measurement ? ' '+s.attributes.unit_of_measurement : ''}`;
  }
  running(key) { return this.state(key)?.state === 'on'; }
  async change(key, option) {
    const entity = this.config.entities?.[key];
    if (!entity || !this._hass || this.config.demo) return;
    try { await this._hass.callService('select','select_option',{entity_id:entity,option}); }
    catch { this.error = 'Ændringen kunne ikke sendes. Kontrollér forbindelsen.'; this.render(); }
  }
  render() {
    if (!this.config) return;
    const demo = this.config.demo === true;
    const active = demo || this.running('pump_running');
    const val = (key, sample) => esc(demo ? sample : this.value(key));
    const controls = [['season','Sæson'],['pump_mode','Filterpumpe'],['uv_mode','UV-C'],['aerator_mode','Beluftning'],['icefree_mode','Isfriholder'],['fill_mode','Påfyldning']];
    this.shadowRoot.innerHTML = `
    <style>
      :host{display:block}ha-card{display:block;background:var(--ha-card-background,var(--card-background-color,#112631));color:var(--primary-text-color,#edf6f5);border-radius:22px;overflow:hidden;font-family:var(--paper-font-body1_-_font-family,system-ui)}
      header{padding:22px 24px 8px;display:flex;justify-content:space-between;align-items:center}h2{font-size:21px;margin:0}small{opacity:.7}.badge{font-size:12px;padding:7px 10px;border-radius:30px;background:#54887933}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 24px}.metric{background:#7396a415;padding:12px;border-radius:12px}.metric small{display:block;font-size:11px}.metric strong{display:block;margin-top:4px;font-size:18px}
      svg{width:100%;height:auto;display:block}svg text{font-family:system-ui;fill:#d7e9ed;font-size:13px}.flow{fill:none;stroke:#53d5db;stroke-width:7;stroke-linecap:round;stroke-dasharray:9 14;opacity:.28}.active{opacity:1;animation:water 2s linear infinite}@keyframes water{to{stroke-dashoffset:-46}}@media(prefers-reduced-motion:reduce){.active{animation:none}}
      .controls{padding:4px 24px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.control{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px}.control select{max-width:115px;padding:8px;border:1px solid #7196a550;border-radius:8px;background:var(--card-background-color,#193340);color:inherit}.status{padding:12px 24px;border-top:1px solid #7196a530;font-size:12px;line-height:1.6}.error{color:#f9a99b}.note{opacity:.65;font-size:11px}@media(max-width:420px){.controls{grid-template-columns:1fr}.metrics{padding:12px}.metric strong{font-size:15px}}
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
        <path d="M600 131 L568 104 L540 119 L551 139 L515 148 L525 170 L474 183 L453 205 L417 211" fill="none" stroke="#8ab8ab" stroke-width="24" stroke-linejoin="round"/>
        <path class="flow ${active ? 'active' : ''}" d="M600 131 L568 104 L540 119 L551 139 L515 148 L525 170 L474 183 L453 205 L417 211"/>
        <path d="M197 283 L425 283 L478 241 L559 241" fill="none" stroke="#15313b" stroke-width="14"/>
        <path class="flow ${active ? 'active' : ''}" d="M197 283 L425 283 L478 241 L559 241"/>
        <rect x="155" y="260" width="64" height="46" rx="20" fill="#172a35" stroke="#7aa0a8" stroke-width="2"/>
        <path d="M171 265V301 M182 263V303 M193 264V302" stroke="#64808d" stroke-width="3"/>
        <rect x="561" y="191" width="88" height="122" rx="23" fill="#243f4d" stroke="#84a3a8" stroke-width="2"/>
        <rect x="571" y="182" width="68" height="25" rx="9" fill="#536b72"/>
        <path d="M579 223H630 M579 242H630 M579 261H630 M579 280H630" stroke="#689b99" stroke-width="10"/>
        <path d="M607 190V287" stroke="${demo || this.running('uv_running') ? '#c2a4ff' : '#677580'}" stroke-width="6"/>
        <path d="M607 183V143L600 131" fill="none" stroke="#7daeb1" stroke-width="9"/>
        <ellipse cx="313" cy="184" rx="32" ry="8" fill="#d9e7db"/><rect x="300" y="173" width="26" height="10" rx="4" fill="#84a59c"/>
        <path d="M313 191V238" stroke="#8ab8c3" stroke-width="3" stroke-dasharray="4 5"/>
        <text x="154" y="329">Filterpumpe</text><text x="554" y="337">Trykfilter</text><text x="583" y="173">UV-C</text>
        <text x="260" y="152">Isfriholder · 5 W</text><text x="455" y="63">Retur via vandfald</text>
        <text x="44" y="375" style="font-size:11px;fill:#95b5bd">${demo ? 'Illustration med eksempeldata' : 'Animation følger pumpens statusentitet · gennemstrømning er ikke målt'}</text>
      </svg>
      <div class="controls">${controls.map(([key,label]) => {
        const state = this.state(key);
        const options = state?.attributes.options || (key === 'season' ? ['Auto','Sommer','Vinter'] : ['Auto','Til','Fra']);
        return `<label class="control">${label}<select data-key="${key}" aria-label="${label}" ${demo || !state || ['unavailable','unknown'].includes(state.state) ? 'disabled' : ''}><option value="" disabled ${!state ? 'selected' : ''}>${demo ? 'Auto' : 'Ikke tilkoblet'}</option>${options.map(option => `<option value="${esc(option)}" ${option===state?.state ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></label>`;
      }).join('')}</div>
      <div class="status">Seneste hændelse: ${val('last_event','Filterpumpe startet automatisk')}<br><span class="note">${demo ? 'Demo betjener ikke dit udstyr.' : 'Betjening sendes til controlleren. Relæstatus bekræfter ikke fysisk drift.'}</span>${this.error ? `<div class="error" role="alert">${esc(this.error)}</div>` : ''}</div>
    </ha-card>`;
    this.shadowRoot.querySelectorAll('select').forEach(el => el.addEventListener('change', () => this.change(el.dataset.key,el.value)));
  }
}
if (!customElements.get('pond-flow-card')) customElements.define('pond-flow-card',PondFlowCard);
window.customCards = window.customCards || [];
window.customCards.push({type:'pond-flow-card',name:'Pond Flow Card',description:'SVG-overblik og betjening af dammens udstyr'});
