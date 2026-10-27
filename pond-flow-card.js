const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = {temp_bottom:'Dam Temperatur Bund',temp_surface:'Dam Temperatur Overflade',water_level:'Vandstand',status:'Dam status',last_event:'Seneste hændelse',pump_running:'Filterpumpe koerer',uv_running:'UV-C taendt',aerator_running:'Luftpumpe koerer',skimmer_running:'Skimmer koerer',skimmer_mode:'Skimmer tilstand',skimmer_plan:'Skimmer plan',season:'Sæson',pump_mode:'Filterpumpe tilstand',uv_mode:'UV-C tilstand',aerator_mode:'Luftpumpe tilstand',pump_hours:'Filterpumpe drift total',uv_hours:'UV-C drift total',aerator_hours:'Luftpumpe drift total',skimmer_hours:'Skimmer drift total',skimmer_locked:'Skimmer sikkerhedsspaerret',low_water:'Alarm lav vandstand',level_fault:'Fejl niveausensor',temp_fault:'Fejl temperatursensor',relay_fault:'Fejl relaemodul',settings_fault:'Fejl indstillinger',schedule_fault:'Fejl ugeplan ur',uv_service:'UV-C service paakraevet'};
const binaryKeys = new Set(['skimmer_locked','low_water','level_fault','temp_fault','relay_fault','settings_fault','schedule_fault','uv_service']);
const slug = value => value.toLowerCase().replaceAll('æ','ae').replaceAll('ø','o').replaceAll('å','a').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
// Patch values in place: recreating the SVG also recreates every CSS animation.
function patchNode(current, next) {
  if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) {
    current.replaceWith(next.cloneNode(true));
    return;
  }
  if (current.nodeType === Node.TEXT_NODE || current.nodeType === Node.COMMENT_NODE) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }
  if (current.nodeType === Node.ELEMENT_NODE) {
    for (const attr of [...current.attributes]) {
      if (!next.hasAttribute(attr.name) && !(current.localName === 'details' && attr.name === 'open')) current.removeAttribute(attr.name);
    }
    for (const attr of next.attributes) {
      if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
    }
  }
  const wanted = [...next.childNodes];
  const key = node => node.nodeType === Node.ELEMENT_NODE ? node.getAttribute('data-section') : null;
  for (let i=0; i<wanted.length; i++) {
    let child=current.childNodes[i];
    const nextKey=key(wanted[i]);
    if (nextKey && key(child || {}) !== nextKey) {
      const existing=[...current.childNodes].find(node=>key(node)===nextKey);
      current.insertBefore(existing || wanted[i].cloneNode(true),child || null);
      child=current.childNodes[i];
    } else if (!nextKey && key(child || {})) {
      current.insertBefore(wanted[i].cloneNode(true),child);
      child=current.childNodes[i];
    }
    if (!child) current.append(wanted[i].cloneNode(true));
    else patchNode(child,wanted[i]);
  }
  while(current.childNodes.length>wanted.length) current.lastChild.remove();
}
class PondFlowCard extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); this.fishSpeeds = new WeakMap(); this.bubbleBursts = new WeakMap(); }
  connectedCallback() {
    if (!this.fishSpeedTimer) this.fishSpeedTimer = setInterval(()=>{this.updateFishSpeeds();this.updateBubbleBursts();},250);
  }
  disconnectedCallback() { clearInterval(this.fishSpeedTimer); this.fishSpeedTimer = null; }
  updateBubbleBursts(now=performance.now()) {
    if(document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.shadowRoot.querySelectorAll('.fish-bubbles').forEach(group=>{
      let burst=this.bubbleBursts.get(group);
      if(!burst) {burst={next:now+800+Math.random()*9000};this.bubbleBursts.set(group,burst);}
      if(now<burst.next) return;
      const count=1+Math.min(2,Math.floor(Math.random()*3));
      [...group.querySelectorAll('.fish-bubble')].slice(0,count).forEach(circle=>{
        const animation=circle.getAnimations()[0];
        if(animation) {animation.currentTime=0;animation.play();}
      });
      // Allow the whole burst to fade before this fish can emit another one.
      burst.next=now+6500+Math.random()*9000;
    });
  }
  updateFishSpeeds(now=performance.now()) {
    if (document.hidden) return;
    this.shadowRoot.querySelectorAll('.fish').forEach(fish=>{
      const swim=fish.querySelector('.fish-swim')?.getAnimations()[0];
      if (!swim || swim.playState !== 'running') return;
      let speed=this.fishSpeeds.get(swim);
      if (!speed) {
        speed={current:1,target:.65+Math.random()*.7,next:now+1500+Math.random()*6500};
        this.fishSpeeds.set(swim,speed);
      }
      if (now>=speed.next) {
        let target=.5+Math.random();
        // A new target must be noticeably different, within a calm speed range.
        if (Math.abs(target-speed.target)<.25) target=speed.target<=1 ? 1.3 : .65;
        speed.target=target;speed.next=now+4000+Math.random()*8000;
      }
      speed.current+=(speed.target-speed.current)*.12;
      // updatePlaybackRate preserves the playhead; changing duration would jump.
      swim.updatePlaybackRate(speed.current);
      const name=fish.querySelector('.fish-name-swim')?.getAnimations()[0];
      if (name && name.playState === 'running') name.updatePlaybackRate(speed.current);
      fish.querySelectorAll('.fish-facing').forEach(member=>{
        const turn=member.getAnimations()[0];
        if(turn?.playState==='running') turn.updatePlaybackRate(speed.current);
      });
    });
  }
  setConfig(config) {
    if (config.fish !== undefined && !Array.isArray(config.fish)) throw new Error('fish skal være en liste med navn og farve.');
    if (config.fish?.some(fish => !fish || typeof fish !== 'object' || Array.isArray(fish))) throw new Error('Hver fisk skal have name og color.');
    if (config.fish?.some(fish=>fish.size !== undefined && !['small','medium','large'].includes(fish.size))) throw new Error('size skal være small, medium eller large.');
    if (config.fish?.some(fish=>fish.type !== undefined && !['fish','school'].includes(fish.type))) throw new Error('type skal være fish eller school.');
    if (config.fish?.some(fish=>fish.speed !== undefined && (typeof fish.speed !== 'number' || !Number.isFinite(fish.speed) || fish.speed<.5 || fish.speed>1.5))) throw new Error('speed skal være et tal mellem 0.5 og 1.5.');
    const ids = config.fish?.map((fish,index)=>String(fish.id ?? index));
    if (ids && new Set(ids).size !== ids.length) throw new Error('Hver fisk skal have et unikt id.');
    this.config = {...config}; this.signature = ''; this.render();
  }
  fish() {
    let slot=0;
    return (this.config.fish ?? [{id:'default-1',color:'#c49a72'},{id:'default-2',color:'#9aa99d'}]).map((fish,index)=>{
      const school=fish.type==='school';
      const row=Math.floor(slot/3),column=slot%3;
      slot++;
      return {
      id:String(fish.id ?? index),name:String(fish.name ?? ''),
      color:typeof fish.color === 'string' && CSS.supports('color',fish.color) ? fish.color : '#c49a72',
      school,scale:({small:.55,medium:.75,large:1})[fish.size || 'large'],row,rowSpan:1,
      x:300+column*125,y:420+row*48,duration:(22+(index%5)*4)/(fish.speed ?? 1),delay:-(index*7.3)%26
    };});
  }
  pondDepth() { return Math.max(0,...this.fish().map(fish=>fish.row+fish.rowSpan-1))*48; }
  fishBodies(fish) {
    const positions=fish.school?[[0,0],[-15,-9],[15,-9],[-15,9],[15,9]]:[[0,0]];
    const scale=fish.scale*(fish.school ? .28 : 1);
    return positions.map(([x,y],index)=>`<g class="fish-member" transform="translate(${x*fish.scale} ${y*fish.scale})" style="--turn-delay:${fish.delay-(fish.school?index*.18:0)}s;--bubble-delay:${fish.delay-index*.7}s;--bubble-rise:${(362-fish.y-y*fish.scale)/scale}px">
      <g class="fish-scale" transform="scale(${scale})"><g class="fish-facing">
      <g class="fish-body"><path d="M-24 0Q-10-12 10-7L23-16L19 0L23 16L10 7Q-10 12-24 0Z" fill="${esc(fish.color)}" opacity=".85"/><path d="M-3-6L5-13L9-6" fill="${esc(fish.color)}" opacity=".65"/></g>
      ${this.config.fish_bubbles === false ? '' : '<g class="fish-bubbles" aria-hidden="true"><circle class="fish-bubble" cx="-23" cy="-2" r="2.5"/><circle class="fish-bubble" cx="-23" cy="-2" r="1.8"/><circle class="fish-bubble" cx="-23" cy="-2" r="2"/></g>'}
      </g></g></g>`).join('');
  }
  fishMarkup() {
    return this.fish().map(fish => `<g class="fish${fish.school?' fish-school':''}" data-section="fish-${esc(fish.id)}" role="img" aria-label="${esc(fish.name || 'Fisk')}${fish.school?' · flok på 5 fisk':''}" transform="translate(${fish.x} ${fish.y})" style="--swim-duration:${fish.duration}s;--swim-delay:${fish.delay}s;--bubble-rise:${362-fish.y}px">
      <title>${esc(fish.name || 'Fisk')}</title><g class="fish-swim">
      ${this.fishBodies(fish)}
      </g>${this.config.fish_names === false || !fish.name ? '' : `<g class="fish-name-swim" aria-hidden="true"><text class="fish-name" x="0" y="25" text-anchor="middle">${esc(fish.name)}</text></g>`}</g>`).join('');
  }
  set hass(hass) {
    this._hass = hass;
    if (!this.config) return;
    const prefix = this.config.entity_prefix || 'garden_pond_controller';
    const visible = state => state && [state.state,state.attributes];
    const signature = JSON.stringify([Object.keys({...labels,...this.config.entities}).map(key => visible(this.state(key))),Object.entries(hass.states).filter(([id]) => id.startsWith(`number.${prefix}_`) || id.startsWith(`switch.${prefix}_`)).map(([id,state])=>[id,visible(state)])]);
    if (signature !== this.signature) { this.signature = signature; this.render(); }
  }
  getCardSize() { return Math.ceil((this.getBoundingClientRect().height || 650) / 50); }
  getGridOptions() { return {columns:12,min_columns:6,rows:12,min_rows:8}; }
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
    const focused = this.shadowRoot.activeElement;
    const demo = this.config.demo === true;
    const depth = this.pondDepth();
    const active = demo || this.running('pump_running');
    const val = (key, sample) => esc(demo ? sample : this.value(key));
    const controls = [['season','Sæson'],['pump_mode','Filterpumpe'],['uv_mode','UV-C'],['aerator_mode','Beluftning'],['skimmer_mode','Skimmer'],['skimmer_plan','Skimmerplan']].filter(([key]) => demo || this.state(key));
    const operating = key => demo ? 'Kører' : !this.state(key) || ['unknown','unavailable'].includes(this.state(key).state) ? 'Ukendt' : this.running(key) ? 'Kører' : 'Stoppet';
    const template = document.createElement('template');
    template.innerHTML = `
    <style>
      :host{display:block;min-width:0;width:100%;height:100%;container-type:inline-size}ha-card{display:flex;flex-direction:column;box-sizing:border-box;width:100%;height:100%;min-width:0;background:var(--ha-card-background,var(--card-background-color,#1c2328));color:var(--primary-text-color,#edf6f5);border-radius:var(--ha-card-border-radius,16px);overflow:auto;font-family:var(--paper-font-body1_-_font-family,system-ui)}
      header{padding:22px 24px 8px;display:flex;justify-content:space-between;align-items:center}h2{font-size:21px;margin:0}small{opacity:.7}.badge{font-size:12px;padding:7px 10px;border-radius:30px;background:#54887933}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 24px}.metric{background:#7396a415;padding:12px;border-radius:12px}.metric small{display:block;font-size:11px}.metric strong{display:block;margin-top:4px;font-size:18px}
      svg{width:100%;height:auto;min-height:160px;flex:1 0 auto;display:block}ha-card> :not(svg){flex-shrink:0}svg text{font-family:system-ui;fill:#d7e9ed;font-size:13px}.flow{fill:none;stroke:#53d5db;stroke-width:7;stroke-linecap:round;stroke-dasharray:9 14;opacity:.28}.active{opacity:1;animation:water 2s linear infinite}@keyframes water{to{stroke-dashoffset:-48}}@media(prefers-reduced-motion:reduce){.active{animation:none}}
      .controls{padding:4px 24px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.control{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px}.control select{max-width:115px;padding:8px;border:1px solid #7196a550;border-radius:8px;background:var(--card-background-color,#193340);color:inherit}.status{padding:12px 24px;border-top:1px solid #7196a530;font-size:12px;line-height:1.6}.error{color:#f9a99b}.note{opacity:.65;font-size:11px}@media(max-width:420px){.controls{grid-template-columns:1fr}.metrics{padding:12px}.metric strong{font-size:15px}}
      [data-info]{cursor:pointer}.diagram-value{font-size:15px;font-weight:600;fill:#fff}.equipment{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px 24px 18px}.equipment button{font:inherit;text-align:left;color:inherit;background:#7396a415;border:1px solid #7196a530;border-radius:10px;padding:10px;cursor:pointer}.equipment small{display:block}.equipment strong{font-size:13px}.controls button{padding:9px;border-radius:7px;border:1px solid #7196a550;color:inherit;background:transparent;cursor:pointer}.controls button[aria-pressed=true]{background:#438b8b55}.options{display:flex;gap:4px;flex-wrap:wrap}.control{flex-wrap:wrap}.rotor{transform-box:fill-box;transform-origin:center;animation:spin 1.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.rotor{animation:none}}details{padding:0 24px 16px;font-size:12px;overflow-wrap:anywhere}
      .fish-swim{animation:swim var(--swim-duration,22s) linear infinite;animation-delay:var(--swim-delay,0s);transform-box:view-box;transform-origin:0 0}@keyframes swim{0%,100%{transform:translateX(50px)}46%,50%{transform:translateX(-60px)}96%{transform:translateX(50px)}}
      .fish-bubble{fill:none;stroke:#b1d8e0;stroke-width:1.2;opacity:0;animation:fish-bubble 5.5s linear 1 both paused;animation-delay:0s}.fish-bubble:nth-child(2){animation-delay:.2s}.fish-bubble:nth-child(3){animation-delay:.4s}@keyframes fish-bubble{0%{transform:translate(0,0);opacity:0}12%{opacity:.65}75%{opacity:.35}100%{transform:translate(-5px,var(--bubble-rise,-60px));opacity:0}}
      .skimmer-current{visibility:hidden}.skimmer-current.moving{visibility:visible}.intake-ring{fill:none;stroke:#8ad3dc;stroke-width:2;transform-origin:0 0;opacity:0}.moving .intake-ring{animation:intake-ring 3.6s linear infinite}.intake-ring:nth-child(2){animation-delay:-1.2s}.intake-ring:nth-child(3){animation-delay:-2.4s}@keyframes intake-ring{0%{transform:scale(1);opacity:0}15%{opacity:.7}80%{opacity:.5}100%{transform:scale(.04);opacity:0}}.uv-glow{opacity:0}.uv-lamp.on .uv-glow{opacity:1}.uv-tube{fill:#718583}.uv-lamp.on .uv-tube{fill:#fff0c5;filter:drop-shadow(0 0 4px #ffd17b)}
      @container(max-width:560px){header{padding:16px 14px 8px;gap:8px;flex-wrap:wrap}.metrics{padding:10px 14px}.equipment{padding:8px 14px 14px}.controls{grid-template-columns:1fr;padding:4px 14px 16px}.control{flex-wrap:nowrap}.options{justify-content:flex-end}.status{padding:12px 14px}details{padding:0 14px 14px}.metric{padding:10px 8px}.metric strong{font-size:16px}.badge{max-width:100%;overflow-wrap:anywhere}}
      .fountain{display:none}.fountain.running{display:inline}.fountain path{fill:none;stroke:#8ed4e1;stroke-width:3;stroke-linecap:round;stroke-dasharray:5 8;animation:spray 1.2s linear infinite}.fountain path:nth-child(2n){animation-delay:-.6s}.fountain .ripple{fill:none;stroke:#8ed4e1;stroke-width:2;opacity:.6;animation:pond-ripple 2.4s ease-in-out infinite}@keyframes spray{to{stroke-dashoffset:-26}}@keyframes pond-ripple{50%{opacity:.2;stroke-width:4}}
      .fish-name-swim{animation:fish-name-swim var(--swim-duration,22s) linear infinite;animation-delay:var(--swim-delay,0s);pointer-events:none}@keyframes fish-name-swim{0%,100%{transform:translateX(50px)}46%,50%{transform:translateX(-60px)}96%{transform:translateX(50px)}}.pond-diagram .fish-name{font-size:11.3px;font-weight:600;fill:var(--primary-text-color,#e1e8e9);stroke:#183640;stroke-width:2px;paint-order:stroke fill;stroke-linejoin:round}
      .waterfall-water{visibility:hidden}.waterfall-water.running{visibility:visible}.waterfall-water .flow{stroke:#c1e7ed;stroke-width:3}.waterfall-splash{fill:none;stroke:#a3d6df;stroke-width:2;animation:waterfall-splash 1.6s ease-in-out infinite}.waterfall-ripple{fill:none;stroke:#8fc6d1;stroke-width:1.5;animation:pond-ripple 2.4s ease-in-out infinite}@keyframes waterfall-splash{50%{opacity:.3}}
      .fish-facing{animation:fish-turn var(--swim-duration,22s) linear infinite;animation-delay:var(--turn-delay,0s);transform-box:view-box;transform-origin:0 0}@keyframes fish-turn{0%,46%,100%{transform:scaleX(1)}50%,96%{transform:scaleX(-1)}}
      
      @media(prefers-reduced-motion:reduce){.fish-swim,.fish-facing,.fish-name-swim,.fish-bubble,.skimmer-current.moving .intake-ring,.fountain path,.fountain .ripple,.waterfall-splash,.waterfall-ripple{animation:none}}
    </style>
    <ha-card>
      <header data-section="header"><div><small>HAVENS VANDKREDSLØB</small><h2>${esc(this.config.title || 'Dammen')}</h2></div><span class="badge">${demo ? 'DEMO · eksempeldata' : val('status','')}</span></header>
      <div class="metrics" data-section="metrics"><div class="metric"><small>OVERFLADE</small><strong>${val('temp_surface','23,1 °C')}</strong></div><div class="metric"><small>BUND</small><strong>${val('temp_bottom','23,1 °C')}</strong></div><div class="metric"><small>VANDSTAND</small><strong>${val('water_level','48 cm')}</strong></div></div>
<svg data-section="diagram" class="pond-diagram" role="img" aria-label="Snit gennem dammen med fisk, skimmer, beluftning med springvand, filterpumpe, trykfilter med UV-C og vandfald" xmlns="http://www.w3.org/2000/svg" viewBox="0 175 1200 ${455+depth}">
<defs>
 <pattern id="earth" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 22L22 0" stroke="#4a514c" stroke-width=".6"/></pattern>
 <linearGradient id="water" x2="0" y2="1"><stop stop-color="#21444e"/><stop offset="1" stop-color="#183640"/></linearGradient>
 <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1L8 5L0 9" fill="none" stroke="#287785" stroke-width="1.7"/></marker>
 <style>.pond-diagram text{font-family:Segoe UI,Arial,sans-serif;fill:var(--primary-text-color,#e1e8e9)}.label{font-size:17px;font-weight:600}.small{font-size:13px;fill:#63777b}.value{font-size:25px;font-weight:600}.leader{fill:none;stroke:#86979a;stroke-width:1}.pipe{fill:none;stroke:#405a61;stroke-width:12;stroke-linejoin:round;stroke-linecap:round}.flow{fill:none;stroke:#5baebd;stroke-width:3;stroke-dasharray:7 9;opacity:.3}.frame{fill:#f9faf7;stroke:#d8dfdb;stroke-width:1}.flow.active{opacity:1}.fish{pointer-events:visiblePainted}</style>
<radialGradient id="uv-warmth"><stop stop-color="#ffecaf" stop-opacity=".85"/><stop offset=".45" stop-color="#ffc46c" stop-opacity=".42"/><stop offset="1" stop-color="#ed9f53" stop-opacity="0"/></radialGradient><clipPath id="fish-water"><path d="M141 362H748L711 ${474+depth}Q679 ${547+depth} 584 ${550+depth}H288Q198 ${546+depth} 182 ${483+depth}Z"/></clipPath></defs>
<rect width="1200" height="${760+depth}" rx="24" fill="var(--ha-card-background,var(--card-background-color,#1c2328))"/>
<!-- Tydeligt tværsnit: jord, bassinfolie og vand. -->
<path d="M50 342H135L177 ${485+depth}Q192 ${551+depth} 288 ${556+depth}H584Q681 ${553+depth} 714 ${475+depth}L755 342H1150V${608+depth}H50Z" fill="#303635"/>
<path d="M50 342H135L177 ${485+depth}Q192 ${551+depth} 288 ${556+depth}H584Q681 ${553+depth} 714 ${475+depth}L755 342H1150V${608+depth}H50Z" fill="url(#earth)"/>
<path d="M135 342L177 ${485+depth}Q192 ${551+depth} 288 ${556+depth}H584Q681 ${553+depth} 714 ${475+depth}L755 342" fill="none" stroke="#586663" stroke-width="8"/>
<path d="M141 362H748L711 ${474+depth}Q679 ${547+depth} 584 ${550+depth}H288Q198 ${546+depth} 182 ${483+depth}Z" fill="url(#water)"/>
<path d="M141 362H748" stroke="#3b8a98" stroke-width="3"/>
<path d="M50 339H133M758 339H1150" stroke="#83947c" stroke-width="6"/>

<!-- Beplantning, sparsomt og uden illustrationseffekter. -->
<g fill="none" stroke="#738a70" stroke-width="3" stroke-linecap="round"><path d="M96 337Q71 304 74 276M96 337Q101 294 113 267M96 337Q88 294 92 255M1043 336Q1025 310 1030 289M1043 336Q1055 309 1057 282"/></g>
<g fill="#596c57" stroke="#8f9b89"><ellipse cx="91" cy="341" rx="27" ry="9"/><ellipse cx="1081" cy="338" rx="31" ry="10"/></g>

<g data-section="fish-school" clip-path="url(#fish-water)">${this.fishMarkup()}</g><!-- Filterpumpe og trykledning. -->
<path class="pipe" d="M391 ${502+depth}H650L795 462H913"/>
<path class="flow ${active ? 'active' : ''}" d="M391 ${502+depth}H650L795 462H913"/>
<path d="M520 ${502+depth}H559" fill="none" stroke="#287785" stroke-width="2" marker-end="url(#arrow)"/>
<g transform="translate(0 ${depth})"><rect x="290" y="477" width="106" height="53" rx="23" fill="#40565d" stroke="#253d45" stroke-width="2"/>
<g stroke="#849ca2" stroke-width="3"><path d="M307 486V521M319 482V525M331 481V526M343 482V525"/></g>
<circle cx="370" cy="503" r="15" fill="#263f48" stroke="#8bbbc2"/>
<path class="${active ? 'rotor' : ''}" d="M370 492V514M359 503H381" stroke="#b8d6dc" stroke-width="3"/></g>

<!-- Filtrets reelle rolle: beholder, filtermaterialer og UV-C i toppen. -->
<rect x="914" y="337" width="112" height="194" rx="27" fill="#354445" stroke="#50666a" stroke-width="2"/>
<path d="M928 385H1012V506Q1012 516 1000 516H940Q928 516 928 506Z" fill="#43574e"/>
<g stroke="#688775" stroke-width="7"><path d="M937 404H1002M937 427H1002M937 450H1002M937 473H1002M937 496H1002"/></g>
<rect x="909" y="320" width="122" height="35" rx="9" fill="#53696d"/>
<g class="uv-lamp ${demo || this.running('uv_running') ? 'on' : ''}" data-info="uv_running" aria-label="UV-C pære lodret i filteret">
<rect x="955" y="325" width="30" height="23" rx="5" fill="#748180" stroke="#243c40" stroke-width="2"/>
<rect class="uv-glow" x="936" y="342" width="68" height="169" rx="30" fill="url(#uv-warmth)"/>
<rect x="961" y="345" width="18" height="152" rx="8" fill="#536c6d" stroke="#9cad9f" stroke-width="1.5"/>
<rect class="uv-tube" x="966" y="350" width="8" height="141" rx="4"/>
</g>
<text x="1045" y="350" text-anchor="middle" class="small">UV-C</text>

<!-- Returledning til et klart aflæseligt vandfald. -->
<path class="pipe" d="M1026 365H1060V246H884V256H874"/>
<path class="flow ${active ? 'active' : ''}" d="M1026 365H1060V246H884V256H874"/>
<path d="M993 246H949" fill="none" stroke="#287785" stroke-width="2" marker-end="url(#arrow)"/>
<g data-section="waterfall" aria-label="Trappevandfald set fra siden">
<path d="M896 264H840V304H795V344H750V363H900Z" fill="#303a36" stroke="#59665b" stroke-width="2"/>
<path d="M888 248V268H836V260M840 288V308H791V300M795 328V348H746V340" fill="none" stroke="#7b877b" stroke-width="7" stroke-linejoin="miter"/>
<path d="M840 270V289M795 310V329M750 350V361" fill="none" stroke="#202b29" stroke-width="3"/>
<g class="waterfall-water ${active ? 'running' : ''}">
<path d="M874 256H840Q834 256 834 263Q825 276 825 296H795Q789 296 789 303Q780 316 780 336H750Q744 336 744 343Q736 354 732 362" fill="none" stroke="#62aaba" stroke-width="8" stroke-linecap="round"/>
<path class="flow ${active ? 'active' : ''}" d="M874 256H840Q834 256 834 263Q825 276 825 296H795Q789 296 789 303Q780 316 780 336H750Q744 336 744 343Q736 354 732 362"/>
<path class="waterfall-splash" d="M723 359L719 354M732 358V352M741 359L747 353"/>
<ellipse class="waterfall-ripple" cx="728" cy="364" rx="23" ry="4"/>
</g></g>
<!-- Skimmer i vandlinjen, adskilt fra det kendte filterkredsløb. -->
<rect x="166" y="350" width="42" height="57" rx="4" fill="#52676d" stroke="#314a52" stroke-width="2"/>
<rect x="175" y="358" width="26" height="16" fill="#163e4c"/>
<g class="skimmer-current ${demo || this.running('skimmer_running') ? 'moving' : ''}">
<g transform="translate(186 365)"><ellipse class="intake-ring" cx="95" cy="0" rx="95" ry="14"/><ellipse class="intake-ring" cx="95" cy="0" rx="95" ry="14"/><ellipse class="intake-ring" cx="95" cy="0" rx="95" ry="14"/></g>
</g>

<!-- Beluftning uses the controller luftpumpe entities. -->
<g data-info="aerator_running" aria-label="Beluftning, vis status"><g class="fountain ${demo || this.running('aerator_running') ? 'running' : ''}">
<path d="M560 351Q538 279 516 353"/><path d="M560 351Q582 279 604 353"/><path d="M560 351Q549 290 536 354"/><path d="M560 351Q571 290 584 354"/>
<ellipse class="ripple" cx="560" cy="364" rx="46" ry="8"/>
</g><ellipse cx="560" cy="361" rx="32" ry="7" fill="#ecefe9" stroke="#697e80"/><rect x="547" y="349" width="26" height="9" rx="3" fill="#8d9f9c"/><path d="M560 370V412" stroke="#789aa1" stroke-dasharray="3 5"/></g>

<!-- Etiketter og målepunkter uden krydsende linjer. -->
<path class="leader" d="M186 347V243H128"/><text x="68" y="218" class="label">Skimmer</text><text x="68" y="238" data-info="skimmer_running" class="small">Overfladerens · ${esc(operating('skimmer_running'))}</text>
<path class="leader" d="M560 345V235"/><text x="560" y="199" text-anchor="middle" class="label">Beluftning</text><text x="560" y="220" data-info="aerator_running" text-anchor="middle" class="small">${esc(operating('aerator_running'))}</text>
<text x="893" y="202" class="label">Retur via vandfald</text><text x="893" y="223" class="small">Fra trykfilter til dam</text>
<path class="leader" d="M1029 433H1094"/><text x="1094" y="405" text-anchor="end" class="label">Trykfilter</text><text x="1094" y="425" data-info="uv_running" text-anchor="end" class="small">UV-C · ${esc(operating('uv_running'))}</text>
<circle cx="467" cy="391" r="4" fill="#287785"/><path class="leader" d="M474 391H670"/><text x="670" y="415" text-anchor="end" class="small">OVERFLADE</text><text x="670" y="446" data-info="temp_surface" text-anchor="end" class="value">${val('temp_surface','23,1 °C')}</text>
<circle cx="469" cy="${527+depth}" r="4" fill="#287785"/><text x="500" y="${530+depth}" class="small">BUND</text><text x="559" y="${532+depth}" data-info="temp_bottom" font-size="20" font-weight="600">${val('temp_bottom','23,1 °C')}</text>
<path d="M115 363V${550+depth}M109 363H121M109 ${550+depth}H121" fill="none" stroke="#627d82"/><text x="104" y="453" data-info="water_level" text-anchor="end" font-size="16" font-weight="600">${val('water_level','48 cm')}</text>
<path class="leader" d="M343 ${535+depth}V${581+depth}"/><text x="343" y="${606+depth}" data-info="pump_running" text-anchor="middle" class="label">Filterpumpe · ${esc(operating('pump_running'))}</text>

</svg>
      <div class="equipment" data-section="equipment">${[['pump_running','Filterpumpe','pump_hours'],['uv_running','UV-C','uv_hours'],['aerator_running','Beluftning','aerator_hours'],['skimmer_running','Skimmer','skimmer_hours']].map(([key,label,hours]) => `<button data-info="${key}"><small>${label}</small><strong>${esc(operating(key))} · ${val(hours,'2,5 h')} i alt</strong></button>`).join('')}</div>
      ${[...binaryKeys].some(key => this.state(key) && this.state(key).state !== 'off') ? `<div class="equipment alarms" data-section="alarms" role="status">${[...binaryKeys].filter(key => this.state(key) && this.state(key).state !== 'off').map(key => `<button data-info="${key}" class="error"><small>${esc(labels[key])}</small><strong>${['unknown','unavailable'].includes(this.state(key).state) ? 'Status utilgængelig' : 'Aktiv'}</strong></button>`).join('')}</div>` : ''}
      <div class="controls" data-section="controls">${controls.map(([key,label]) => {
        const state = this.state(key);
        const options = state?.attributes.options || (key === 'season' ? ['Auto','Sommer','Vinter'] : key === 'skimmer_plan' ? [] : ['Auto','Til','Fra']);
        const disabled = demo || !state || ['unavailable','unknown'].includes(state.state);
        return `<div class="control"><span>${label}</span><div class="options">${!state && !demo ? '<small>Ikke tilkoblet</small>' : options.map(option => `<button data-key="${key}" data-option="${esc(option)}" aria-label="${label}: ${esc(option)}" aria-pressed="${option === state?.state}" ${disabled ? 'disabled' : ''}>${esc(option)}</button>`).join('')}</div></div>`;
      }).join('')}</div>
      <details data-section="settings"><summary>Indstillinger og skimmerens ugeplan</summary><div class="equipment">${Object.entries(this._hass?.states || {}).filter(([id]) => ['number','switch'].some(domain => id.startsWith(`${domain}.${this.config.entity_prefix || 'garden_pond_controller'}_`))).map(([id,s]) => `<button data-entity="${esc(id)}"><small>${esc(s.attributes.friendly_name || id)}</small><strong>${esc(s.state)} ${esc(s.attributes.unit_of_measurement || '')}</strong></button>`).join('')}</div><span class="note">Tryk for at åbne og ændre indstillingen i Home Assistant.</span></details>
      <details data-section="entities"><summary>Entiteter og forbindelser</summary>${Object.keys(labels).map(key => `<div>${esc(labels[key])}: ${this.state(key) ? '✓' : 'Mangler'} <code>${esc(this.entity(key))}</code></div>`).join('')}</details>
      <div class="status" data-section="status">Seneste hændelse: ${val('last_event','Filterpumpe startet automatisk')}<br><span class="note">${demo ? 'Demo betjener ikke dit udstyr.' : 'Tryk på en måling eller udstyrsstatus for detaljer. Relæstatus bekræfter ikke fysisk drift.'}</span>${this.error ? `<div class="error" role="alert">${esc(this.error)}</div>` : ''}</div>
    </ha-card>`;
    patchNode(this.shadowRoot,template.content);
    if (focused?.isConnected && this.shadowRoot.activeElement !== focused) focused.focus({preventScroll:true});
    this.shadowRoot.querySelectorAll('[data-key]').forEach(el => {el.onclick = () => this.change(el.dataset.key,el.dataset.option);});
    this.shadowRoot.querySelectorAll('[data-entity]').forEach(el => {el.onclick = () => { if (!demo) this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:el.dataset.entity},bubbles:true,composed:true})); };});
    this.shadowRoot.querySelectorAll('[data-info]').forEach(el => {
      const open = () => { const id = this.entity(el.dataset.info); if (!demo && this.state(el.dataset.info)) this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true})); };
      el.onclick = event => {event.stopPropagation();open();};
      if (el.tagName !== 'BUTTON') { el.setAttribute('tabindex','0'); el.setAttribute('role','button'); el.onkeydown = event => { if (['Enter',' '].includes(event.key)) {event.preventDefault();event.stopPropagation();open();} }; }
    });
  }
}
if (!customElements.get('pond-flow-card')) customElements.define('pond-flow-card',PondFlowCard);
window.customCards = window.customCards || [];
window.customCards.push({type:'pond-flow-card',name:'Pond Flow Card',description:'SVG-overblik og betjening af dammens udstyr'});
