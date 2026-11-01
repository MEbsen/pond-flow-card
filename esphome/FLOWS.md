# Damstyring v2 – opdateret 1. november 2026

Originalfilen i Downloads er uændret. Dette forslag er ikke uploadet til enheden.

## Filterpumpe og temperaturtilstand

I Auto kører filterpumpen, når alle følgende betingelser er opfyldt:

- Gyldig bundtemperatur, overfladetemperatur og vandstand. Målinger bliver ugyldige efter den konfigurerbare sensor-timeout, som standard 60 sekunder uden en ny gyldig værdi.
- Vandstanden er **over** den indstillede minimumsvandstand. Ved præcis grænsen eller under stoppes pumpen. Ingen genstartmargin, ingen manuel kvittering: den frigives automatisk, når vandstanden igen er over grænsen. Andre startbetingelser gælder stadig.
- Temperaturtilstanden er sommer.
- Pumpens egen valgfri tidsplan tillader drift. Standard er Konstant drift.

Vintertilstand aktiveres ved bundtemperatur **under 6 °C** eller overfladetemperatur **0 °C eller derunder**. Sommer aktiveres igen, når bundtemperatur **og** overfladetemperatur samtidig er **over 6 °C**. Imellem disse grænser beholdes tilstanden. Eksempel: efter frost giver bund 8 °C og overflade 3 °C fortsat vinter; først når overfladen også er over 6 °C, bliver det sommer. Når sommer er aktiv, giver overflade 3 °C i sig selv ikke vinter igen.

Alle fire temperaturgrænser er konfigurerbare. En fælles gemt temperaturtilstand bruges, og den afhænger ikke af kalenderen. Første installation starter som vinter, indtil sommerbetingelsen er opfyldt. Vandstand, tidsplan og manuelt pumpestop ændrer ikke sommer/vintertilstanden.

**Vigtigt ved opdatering:** Gemte indstillinger fra tidligere firmware kan overleve opdateringen. Kontrollér i Home Assistant eller webinterfacet, at Sommer bund genstart over og Sommer overflade genstart over begge er indstillet til 6 °C. Nye YAML-startværdier erstatter ikke nødvendigvis gemte værdier.

## UV-C

I Auto følger UV filterpumpen, eventuelt begrænset af UV's egen tidsplan. Konstant drift følger den filterpumpen direkte. Filterstop slukker altid UV. Der måles ikke fysisk vandflow, så beskyttelsen bygger på filterpumpens tændkommando. UV og pumpe kan skifte i samme styringsrunde; der er ingen primingforsinkelse.

## Luftpumpe

Auto følger udelukkende den valgte Auto-plan. Der er ikke længere et separat vintervalg eller en skjult vinteroverstyring.

| Auto-plan | Virkning |
|---|---|
| Konstant drift | Tilladt hele året, både sommer og vinter |
| Gentag med interval | Følg køretid og startinterval hele året |
| Ugeplan | Følg valgte dage, starter og køretid hele året |
| Vinter | Konstant drift i vintertilstand, slukket i sommertilstand |
| Sommer | Konstant drift i sommertilstand, slukket i vintertilstand |

Vinter/Sommer refererer til controllerens temperaturtilstand, ikke kalenderen. Til/Fra overstyrer planen. Vandstand eller filterstop starter ikke selv luftpumpen.

Ved ny installation er luftpumpens plan Vinter. Gemte tidligere planvalg kan overleve firmwareopdatering. Efter opdatering skal du vælge **Auto → Vinter**, hvis pumpen kun skal køre om vinteren. Dens tidligere intervalfelter er bevaret, men har ingen virkning i Vinter-/Sommer-planen.

## Skimmer og dens egen genstartmargin

Skimmeren kræver gyldig vandstand og overfladetemperatur. Bundtemperaturen og sommer/vintertilstanden påvirker den ikke.

- Stop ved vandstand under minimum eller over maksimum.
- Efter vandstandsspærring: genstart først inde i intervallet med den indstillede margin til begge grænser.
- Eksempel med interval 120–150 cm og margin 2 cm: stop udenfor 120–150 cm; frigiv først ved 122–148 cm. Når den kører, må den fortsætte helt ud til 120 eller 150 cm.
- Første opstart kræver også, at vandstanden er inde i genstartintervallet.
- Stop ved overfladetemperatur under den konfigurerbare grænse, som standard 0 °C. Præcis 0 °C er derfor tilladt for skimmeren, mens filterpumpen stopper ved 0 °C.
- Tidsplanen skal tillade drift i Auto. Ingen indhentning af mistet køretid efter spærring.

Eksempelværdierne i YAML er skimmer 90–100 cm og margin 2 cm. De passer geometrisk til originalens sensorhøjde 120 cm, men skal erstattes med dine mål. Intervalbredden skal være større end to gange marginen.

## Ens tidsplaner på alle fire udgange

Hver udgang har sin egen gruppe på enhedens website og samme indstillinger:

| Felt | Betydning |
|---|---|
| Tidsplan – type: Konstant drift | Ingen begrænsning fra tidsplanen; den øvrige automatik gælder |
| Tidsplan – type: Gentag med interval | Kør i den valgte køretid for hver valgt periode |
| Tidsplan – type: Ugeplan | Kør fra op til tre klokkeslæt på valgte ugedage |
| Køretid pr start | Antal minutter, fælles for udgangens tre ugeplanstarter og intervalplan |
| Gentag hver – timer / ekstra minutter | Samlet tid mellem starter; bruges kun i intervalplan |
| Start 1/2/3 HH:MM | Skriv fx 08:00, 13:30 eller 18:45; bruges kun i ugeplan |
| Start 1/2/3 aktiv | Slå den enkelte ugeplanstart til/fra |
| Mandag … Søndag | Vælg hvilke dage ugeplanens starter skal gælde |
| Tidsplan oversigt | Viser valgt plan eller en indstillings-/urfejl |
| Interval – start forfra nu | Starter et nyt intervalvindue ved næste styringsrunde |

Eksempel: Gentag hver = 6 timer og 0 ekstra minutter, køretid = 15 minutter betyder 15 minutters drift hver 6. time, målt fra start til start. Intervalplaner starter med et aktivt vindue efter controlleropstart, også hvis en sikkerhedsbetingelse aktuelt blokerer relæet. Tidsvinduet fortsætter med at løbe under spærring og manuelt Fra. Controllergenstart nulstiller intervalfasen. Ved ændring af intervalindstillinger kan knappen Start forfra nu bruges til at vælge en ny fase.

I ugeplan er start 1 aktiv som standard; start 2 og 3 er slået fra. Alle ugedage er valgt. Standardtiderne er 08:00, 13:00 og 18:00. Starter kan overlappe og giver så sammenhængende drift. Et vindue over midnat tilhører dagen, hvor det starter. Ved sommertidsskift følger planen lokalt klokkeslæt, så et sprunget tidspunkt springes over, og et gentaget tidspunkt kan give gentagen drift.

Standard: Filterpumpe og UV Konstant drift; skimmer Gentag med interval; luft Vinter. Ugeplansfelter har ingen effekt, når interval er valgt, og intervalfelter har ingen effekt, når ugeplan er valgt. Luftpumpen følger altid sit valgte planvalg, inklusive Vinter/Sommer som sæsonplaner.

## Auto / Til / Fra

Alle relæer beholder manuel betjening. Til tilsidesætter tidsplanen, og Fra stopper udgangen.

- Filterpumpe Til tilsidesætter tidsplanen, men ikke vandstands-, temperatur- eller sensorbeskyttelse.
- Skimmer Til tilsidesætter tidsplanen, men ikke vandstandsinterval, genstartmargin eller overfladetemperatur.
- UV Til kræver stadig tændt filterpumpe.
- Luft Til/Fra gælder fuldt ud, også om vinteren.

## Vandstandsreference

Vandstand = sensorhøjde over valgt reference minus sensorens afstand til vandoverfladen. Alle vandstandsgrænser skal bruge samme reference. Hvis skimmerintervallet fx er 120–150 cm, skal sensorhøjden være målt fra samme nulpunkt og sensoren sidde over højeste vandspejl med tilstrækkelig måleafstand.

DS18B20 er stadig valgt via index 0 og 1 fra originalen. Verificér deres fysiske placering; faste sensoradresser bør bruges i den endelige installation.

## Timer, alarmer og drift uden net

Alle fire relæer har samlet driftstid og individuel nulstillingsknap. UV har en konfigurerbar servicegrænse, som foreløbig er 8000 timer. Indstil den efter den konkrete pære. Servicealarmen vises lokalt og i Home Assistant, men sender ikke automatisk pushbeskeder og slukker ikke UV. Timer måler den sidst bekræftede relækommando, ikke fysisk funktion. Op til cirka fem minutters tællerændringer kan gå tabt ved strømsvigt.

Styringen kører hvert 5. sekund efter 15 sekunders opstart. Niveaumålingen filtreres; respons på fysisk vandstandsændring omfatter filterforsinkelsen. Relækommunikationsfejl registreres, men fysisk pumpesvigt eller svejsede kontakter kan ikke registreres med den nuværende hardware.

Automatik, sikkerhedsregler, timetællere og intervalplaner kører uden Wi-Fi, Home Assistant eller internet. Webinterfacets assets er nu valgt som lokale, og indstillinger er grupperet efter udgang. Browseren skal stadig have en netværksforbindelse til selve enheden.

Ugeplan kræver gyldigt klokkeslæt. SNTP eller Home Assistant kan sætte uret; det fortsætter ved netudfald. Efter fuldt strømsvigt uden efterfølgende tidssynkronisering kan automatiske ugeplaner ikke køre. Urfejl vises for ugeplaner, der aktuelt skal bruges i Auto. Vinter/Sommer-planer og Konstant drift kræver ikke klokkeslæt. Vælges Ugeplan, kræves gyldigt ur.

Fra den oprindelige fil er døgnoversigter, daglige min/max, højvandsalarm og særskilt frostalarm fortsat ikke med i v2. Hændelsesloggen er kort og gemmes ikke over genstart.

## Kontrolstatus

ESPHome-konfigurationsvalidering er bestået i en lokal valideringskopi med testværdier for Wi-Fi. C++-kildegenereringen lykkedes. Fuld firmwarekompilering blev afbrudt under download/udpakning af ESP-IDF, fordi C-drevet løb tør for plads. De midlertidige validatorpakker og buildfiler fra forsøget er fjernet. Firmwaren er derfor ikke bekræftet kompilerbar. Ingen firmware er uploadet eller testet på dammens hardware. Originalens pins, board og relæadresse er videreført. Wi-Fi, API-nøgle og hotspot-adgangskode skal ligge i lokal secrets.yaml; de er ikke med i repositoryet.

Brugerfladens tekstfelter og gruppering følger [ESPHome Template Text](https://esphome.io/components/text/template/) og [Web Server](https://esphome.io/components/web_server/).

## Tydelig opsætning og synlig Auto-styring (1. november 2026)

HA-kortet er ikke ændret i denne opdatering. ESPHome-websiden har nu særskilte grupper for **Sommer og vinter - temperaturgraenser**, **Sikkerhed - vandstand og sensorer** samt hver af de fire udgange.

Hver udgang viser:

- **Auto - saadan styres den**: hvilke betingelser Auto følger, og hvad Til/Fra betyder.
- **Aktuel styring**: hvorfor controlleren aktuelt ønsker udgangen tændt/slukket; ved relæfejl oplyses, at fysisk tilstand er ukendt.
- **Tidsplanoversigt**: den valgte plan eller fejl i planen.
- De faktiske planfelter: type, køretid, gentagelse, ugedage og starter.

**Auto** er ikke en ekstra tidsplan: det betyder at følge udgangens styringsregler **og** den valgte tidsplan. **Konstant drift** betyder ingen tidsbegrænsning; sikkerheds- og øvrige styringsregler gælder stadig. **Til** springer tidsplanen over, men ikke filter/skimmer/UV-sikkerheden. **Fra** slukker udgangen. De eksisterende select-værdier er bevaret for kompatibilitet.

Skimmerens 15 minutter hver 6. time kommer udelukkende fra dens synlige standardvalg **Gentag med interval**, **Koeretid pr start = 15**, **Gentag hver - timer = 6** og **ekstra minutter = 0**. Der er ingen ekstra skjult startfunktion. Luftpumpen bruger nu standardplanen Vinter; tidligere intervalværdier bruges kun, hvis Interval vælges. Filter og UV starter fortsat med Konstant drift.

Temperaturgrænserne er fortsat fire selvstændige felter. Vandstandsreference, filterminimum, skimmerminimum/-maksimum, skimmermargin og skimmertemperatur er konfigurerbare. Sensor-timeout er nu også et synligt sikkerhedsfelt: standard 60 sekunder, område 15–600 sekunder. Måleområdefilteret for A02YYUW er fast hardwarevalidering. Sikkerhedsfunktionerne kan ikke deaktiveres med manuel Til.

Navnet på det tidligere planvalg Uden tidsplan er nu **Konstant drift**, så det er en eksplicit driftsplan. Det betyder tilladelse hele tiden, stadig underlagt styrings- og sikkerhedsregler. Auto har ingen selvstændig startfunktion: skimmerens starter kommer fra dens valgte plan, og luftpumpens vinterdrift kommer fra dens eksplicitte vintervalg. Tidligere HA-automationer, som vælger den bogstavelige option Uden tidsplan, skal bruge Konstant drift i stedet. Controllerens og HA-kortets entity-ID'er er ikke ændret.

## Opdatering 0.7.1: timenulstilling, sæsonplaner og diagramalarmer

Kortet har nu en Nulstil timer-knap ved hver udgang. Der kræves bekræftelse, før den tilhørende button-entitet trykkes. De fire tællere er uafhængige. Nulstilling af UV-timer fjerner UV-servicealarmen ved næste styringsrunde. Timetallet i HA kan først vise ændringen ved næste sensorpublicering (op til cirka 30 sekunder).

Luftpumpens gamle Luftpumpe Auto - vinterstyring er fjernet fra den nye firmware. Vinter og Sommer findes direkte i Luftpumpe tidsplan - type. De første tre planvalg og alle eksisterende driftstime-/relæ-ID'er er bevaret. Ingen counter nulstilles af firmwareændringen. Upload denne YAML før Vinter/Sommer kan vælges fra kortet.

Aktive alarmer markeres ved relevante enheder på tegningen. UV-service vises kun ved UV, og skimmerspærring ved skimmeren. Vandstands-/sensor-/relæ-/indstillings-/urfejl kan påvirke flere enheder. Fælles alarmer er mærket som fælles i tekstbeskeden; de påstår ikke et fysisk svigt i den enkelte enhed. Tryk på ikonet for forklaringen.
