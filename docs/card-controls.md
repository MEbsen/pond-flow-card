# Betjening i Pond Flow Card 0.7.1

## Hvert område svarer til én controllerudgang

- **Drift**: Auto følger controllerens opsætning; Til tilsidesætter tidsplanen, men ikke filter/skimmer/UV-sikkerheden; Fra slukker. Luftpumpens Til/Fra overstyrer også vintervalget.
- **Auto-plan**: Konstant drift, Interval eller Ugeplan, ud fra controllerens tilgængelige options. Det tidligere navn Uden tidsplan vises som Konstant drift, men den oprindelige option sendes stadig til ældre controllere.
- **Interval**: køretid pr. start, timer og ekstra minutter mellem starter; en knap kan starte intervalfasen forfra.
- **Ugeplan**: syv ugedagsknapper, tre individuelle startaktiveringer og tre HH:MM-felter. Køretiden er fælles for udgangens tre starter, som i controlleren. Der er ingen separat pr.-start-varighed i den nuværende firmware.
- **Sikkerhed/service**: filterminimum, skimmerens min./maks./margin/temperatur og UV-servicegrænse står ved deres enheder.
- **Luftpumpens sæsonplaner**: Vinter eller Sommer vælges direkte som Auto-plan. Konstant drift dækker begge. Der er ikke et ekstra sæsonfilter. Dette kræver controller-YAML til 0.7.1.

Sæsonikonet åbner fire temperaturgrænser plus fælles sensorhøjde og sensor-timeout. Det er ikke en manuel tvangsskiftning mellem sommer og vinter.

## HA-kobling

Kortet anvender entity_prefix og eksisterende navne/friendly names. De tidligere eksplicitte entities-overrides til status og drift understøttes fortsat. Alle felter kommer fra controllerens entiteter; ingen faktiske styringsværdier udledes fra demoeksemplerne.

| Handling | HA-service |
|---|---|
| Drift, plan eller vintervalg | select.select_option |
| Køretid, interval eller grænseværdi | number.set_value |
| Starttid HH:MM | text.set_value |
| Ugedag eller aktiv start | switch.turn_on / switch.turn_off |
| Start interval forfra | button.press |

Kortet sender kun valgmuligheder, som entiteten tilbyder, og tal inden for entitetens grænser/trin. Felter med manglende eller utilgængelige entiteter samt frakoblet HA deaktiveres. En button-entitet må have tilstanden unknown før første tryk; unavailable spærrer betjeningen.

Plan- og driftstaster får deres valgte tilstand fra HA. Et vellykket servicekald er ikke en bekræftelse af fysisk drift. Ved HA-opdateringer bevares en igangværende indtastning; efter afsluttet indtastning vises nye bekræftede værdier.

## Forbindelse

Live betyder tilgængelige controller-målinger og last_reported inden for to minutter for bundtemperatur, overfladetemperatur og vandstand. Uden rapporttid kan kortet kun vise Data tilgængelige. Gamle rapporttider giver Data er forsinkede. Manglende målinger giver Data utilgængelige. Frakoblet HA giver Ingen forbindelse. Indikatoren opdateres også tidsstyret, hvis der ikke kommer nye HA-data. Det er ikke fysisk pumpe-/flowovervågning.

## Verifikation

Browserregressionerne dækker de eksisterende animationer, mobilbredde og servicepayloads. En separat suite bruger navnene og standardopsætningen fra esphome/pond-controller-v2.yaml og kontrollerer alle fire enheders drift, planer, køretider, ugedage, alle tre starter, vintervalg, sikkerhedsfelter, indtastningsbevarelse, resetknapper og forbindelsestilstande. Kør npm run test:browser. Testene benytter eksempeldata og ændrer ikke en rigtig HA-installation.

## Timer og alarmikoner

Nulstil timer findes ved hver enhed. Bekræft dialogen for kun at nulstille denne enheds tæller; afvisning sender ingen service. Det bruger button.press og kræver ingen ny firmware i sig selv. Efter et UV-pæreskift nulstilles UV-timerne; det fjerner servicealarmen. Værdien i HA følger næste opdatering fra controlleren.

Alarmikoner er kun synlige ved aktive alarm-entiteter (on). UV-service vises ved UV; lavt vand ved filter og UV; skimmerspærring ved skimmer. Fælles relæ-/indstillings-/sensor-/urfejl kan markeres ved flere enheder. Popupteksten angiver fælles controlleralarmer særskilt, fordi den nuværende firmware ikke altid kan henføre en sådan fejl til én udgang. Ingen nye fysiske fejlmålinger opfindes. Ikoner understøtter klik, Enter og mellemrum. En åben besked opdateres ved nye HA-data.
