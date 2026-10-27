# Pond Flow Card

Version 0.5.3 viser trappevandfaldet rent fra siden: tre vandrette overløbskanter med frit faldende vand imellem og plask/ringe ved dammens overflade. Vandstrømmen er kun synlig, når filterpumpens status er aktiv. Animationerne bevarer deres tidslinje under nye HA-data.

Version 0.5.2 tilpasser dammens tegnede dybde til antallet af fisk. Fiskene fordeles i lag med op til tre fisk pr. svømmehøjde. Fra fire fisk vokser vandområdet nedad, og bund, filterpumpe og bundmålepunkt følger med. Skimmer, overflade, beluftning og trykfilter holder deres placering. De viste HA-målinger påvirkes ikke. Flere fisk kræver mere lodret plads; øg eventuelt kortets højde i dashboardets grid, eller rul i kortet.

## Personlige fisk (v0.5.0)

Tilføj `fish` til kortets YAML for at vælge antal, navne og farver:

```yaml
type: custom:pond-flow-card
title: Dammen
entity_prefix: garden_pond_controller
fish:
  - id: guld
    name: Guld
    color: '#d8a657'
  - id: perle
    name: Perle
    color: '#e0ddd4'
  - id: kobber
    name: Kobber
    color: '#b87962'
fish_bubbles: true
fish_names: true
```

Hvert punkt tilføjer én fisk. `color` kan være en hex-farve eller en gyldig CSS-farve, fx `orange`. Et unikt `id` bevarer fisken ved omrokering af listen. Navnene står direkte ved fiskene i vandet og følger deres bevægelse uden at blive spejlvendt, når fiskene vender. Fiskene placeres automatisk og svømmer i forskellig takt. Små bobler stiger og fader ud ved overfladen; de illustrerer liv i dammen og er ikke en måling.

`fish_bubbles: false` skjuler bobler, `fish_names: false` skjuler navnene ved fiskene, og `fish: []` fjerner fiskene. Uden en `fish`-liste vises de to standardfisk. Konfigurationen gemmes i dashboardet og kræver ingen ændring af ESPHome. Reduceret bevægelse stopper både fisk og bobler.

Version 0.4.2 bevarer SVG-elementer og CSS-animationer ved nye sensormålinger, loghændelser og alarmer. Kun ændrede tekster og attributter opdateres. Fiskene fortsætter gennem hele svømmecyklussen, og vandflow, springvand og rotor genstarter ikke ved uvedkommende dataopdateringer. Åbne indstillinger og fokus bevares også.

Version 0.4.1 samler den flydende enhed under **Beluftning**. Den er samme udstyr som controllerens luftpumpe, bekræftet af brugeren. SVG, status og betjening bruger `aerator_running` / `aerator_mode` (HA: `luftpumpe_koerer` / `luftpumpe_tilstand`). Et lille springvand med fire vandstråler og ringe animeres, når status er `on`; ved stop skjules strålerne. Der er ikke længere et separat IceFree-betjeningsfelt.

Version 0.4.0 dæmper diagrammet og bruger HA-temaets baggrund og tekstfarve. Fiskene svømmer roligt frem og tilbage, og skimmeren har tre strømspor, der kun bevæger sig ved aktiv skimmerstatus. Bevægelse respekterer reduceret bevægelse i systemindstillingerne. OK-alarmer er skjult; aktive alarmer og utilgængelig alarmstatus vises.

Kortet følger containerens bredde og understøtter HA Sections-grid med justerbar bredde og højde (standard 12 kolonner/12 rækker, minimum 6 kolonner/8 rækker). Brug dashboardeditorens layoutindstillinger. Ved lav højde kan indholdet rulles i kortet. Masonry beregner kortets højde fra den aktuelle visning.

Version 0.3.0 bruger det godkendte arkitektoniske snit: jord, bassinfolie, vand, filterpumpe, trykfilter med UV-C, retur via vandfald, skimmer og isfriholder. To diskrete fisk er dekorative. Udstyrets animationer og værdier følger fortsat HA-entiteterne. Diagrammet bygges ind i den selvstændige JavaScript-fil; HACS skal ikke hente ekstra billedfiler.

Version 0.2.1 matcher controllerens faktiske `koerer`-entiteter, viser samlede driftstimer og tilføjer skimmerstatus, skimmertilstand, skimmerplan og alarmer. Sæsonvalg, påfyldning og isfriholderens betjening skjules, når controlleren ikke har disse funktioner. Indstillinger og ugeplan kan åbnes i HA via kortets foldbare indstillingsfelt.

Med den aktuelle controller er denne minimumskonfiguration nok (fjern gamle manuelle entity-id'er for at bruge automatisk registrering):

```yaml
type: custom:pond-flow-card
title: Dammen
entity_prefix: garden_pond_controller
```

Version 0.2.0 afrunder målinger til én decimal, viser værdier ved udstyret, giver direkte Auto/Til/Fra-knapper og åbner HA-detaljer ved tryk på målinger og status. Vandflow og pumpens rotor animeres ved aktiv pumpestatus. Uændrede HA-opdateringer genstarter ikke animationen.

Entiteter findes automatisk under `garden_pond_controller` ud fra ESPHome-navnene. Brug `entity_prefix` for et andet præfiks og `entities` til manuelle id'er. Under **Entiteter og forbindelser** vises de id'er, kortet bruger, samt manglende entiteter. En eksplicit entitet, der findes, har altid forrang. Manglende id'er kan erstattes af et entydigt match på samme enheds præfiks og friendly name.

SVG-kort til Home Assistant med dam, filterpumpe, trykfilter med UV-C, retur via vandfald og separat IceFree 4 Seasons-isfriholder. Første version 0.1.0.

![Pond Flow Card med eksempeldata](docs/pond-flow-card.png)

[Tilføj repoet i HACS](https://my.home-assistant.io/redirect/hacs_repository/?owner=MEbsen&repository=pond-flow-card&category=plugin).

## Installation med HACS

Tilføj GitHub-repoet som et brugerdefineret repository med typen **Dashboard**, download kortet, og kontrollér at ressourcen er registreret som JavaScript-modul:

```text
/hacsfiles/pond-flow-card/pond-flow-card.js
```

Tilføj derefter et manuelt dashboardkort. Entity-id'erne nedenfor er eksempler og skal erstattes med dine faktiske entiteter:

```yaml
type: custom:pond-flow-card
title: Dammen
entities:
  status: sensor.pond_status
  temp_surface: sensor.pond_temperature_surface
  temp_bottom: sensor.pond_temperature_bottom
  water_level: sensor.pond_water_level
  pump_running: binary_sensor.pond_pump_running
  uv_running: binary_sensor.pond_uv_running
  last_event: sensor.pond_last_event
  season: select.pond_season
  pump_mode: select.pond_pump_mode
  uv_mode: select.pond_uv_mode
  aerator_mode: select.pond_aerator_mode
  fill_mode: select.pond_fill_mode
  # icefree_mode tilføjes, når controlleren understøtter den.
```

Vælg `demo: true` uden entiteter for en tydeligt markeret visning med eksempeldata og deaktiveret betjening. Åbn `preview.html` via en lokal HTTP-server for en selvstændig demo.

Kortet bruger eksisterende `select`-entiteter og deres tilgængelige valgmuligheder. Manglende eller utilgængelige entiteter kan ikke betjenes. Animationen følger pumpens statusentitet og dokumenterer ikke faktisk vandgennemstrømning. Den selvstændige isfriholder er tegnet ind, men kræver særskilt controllerunderstøttelse til styring. Kortet viser endnu ikke hele controllerens alarmoversigt, driftstider eller indstillinger; dette er første version.

## Udgivelse

JavaScript leveres direkte uden buildtrin eller eksterne browserafhængigheder. GitHub Actions kontrollerer JavaScript og HACS-format. Et push af et versions-tag som `v0.1.0` opretter en release med `pond-flow-card.js`, som HACS kan hente. Installation eller opdatering i den konkrete HA-instans kræver adgang til den instans.

ESPHome-filen med lokale adgangsnøgler og referencebilledet er udeladt fra Git. Se `Projekt.md` for udstyr og afklaringer.
