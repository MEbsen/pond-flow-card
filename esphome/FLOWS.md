# Damstyring v2 – opdateret 29. oktober 2026

Originalfilen i Downloads er uændret. Dette forslag er ikke uploadet til enheden.

## Filterpumpe og temperaturtilstand

I Auto kører filterpumpen, når alle følgende betingelser er opfyldt:

- Gyldig bundtemperatur, overfladetemperatur og vandstand. Målinger bliver ugyldige efter 60 sekunder uden en ny gyldig værdi.
- Vandstanden er **over** den indstillede minimumsvandstand. Ved præcis grænsen eller under stoppes pumpen. Ingen genstartmargin, ingen manuel kvittering: den frigives automatisk, når vandstanden igen er over grænsen. Andre startbetingelser gælder stadig.
- Temperaturtilstanden er sommer.
- Pumpens egen valgfri tidsplan tillader drift. Standard er Uden tidsplan.

Vintertilstand aktiveres ved bundtemperatur **under 6 °C** eller overfladetemperatur **0 °C eller derunder**. Sommer aktiveres igen, når bundtemperatur **og** overfladetemperatur samtidig er **over 6 °C**. Imellem disse grænser beholdes tilstanden. Eksempel: efter frost giver bund 8 °C og overflade 3 °C fortsat vinter; først når overfladen også er over 6 °C, bliver det sommer. Når sommer er aktiv, giver overflade 3 °C i sig selv ikke vinter igen.

Alle fire temperaturgrænser er konfigurerbare. En fælles gemt temperaturtilstand bruges, og den afhænger ikke af kalenderen. Første installation starter som vinter, indtil sommerbetingelsen er opfyldt. Vandstand, tidsplan og manuelt pumpestop ændrer ikke sommer/vintertilstanden.

**Vigtigt ved opdatering:** Gemte indstillinger fra tidligere firmware kan overleve opdateringen. Kontrollér i Home Assistant eller webinterfacet, at Sommer bund genstart over og Sommer overflade genstart over begge er indstillet til 6 °C. Nye YAML-startværdier erstatter ikke nødvendigvis gemte værdier.

## UV-C

I Auto følger UV filterpumpen, eventuelt begrænset af UV's egen tidsplan. Uden tidsplan følger den filterpumpen direkte. Filterstop slukker altid UV. Der måles ikke fysisk vandflow, så beskyttelsen bygger på filterpumpens tændkommando. UV og pumpe kan skifte i samme styringsrunde; der er ingen primingforsinkelse.

## Luftpumpe

I Auto kører luftpumpen konstant i vintertilstand. I sommertilstand følger den sin egen tidsplan. Den er ikke længere direkte koblet til filterpumpens stop/start.

Det betyder eksempelvis, at lav vandstand eller manuelt filterstop om sommeren ikke i sig selv starter luftpumpen. En tidsplan begrænser aldrig luftpumpens automatiske vinterdrift. Manuel Fra kan stadig slukke den.

Standardens sommertidsplan er 15 minutter hver 6. time. Dette er en redigerbar eksempelplan, ikke en beregning af dammens iltbehov.

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
| Tidsplan – type: Uden tidsplan | Ingen begrænsning fra tidsplanen; den øvrige automatik gælder |
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

Standard: Filterpumpe og UV Uden tidsplan; skimmer og luft Gentag med interval. Ugeplansfelter har ingen effekt, når interval er valgt, og intervalfelter har ingen effekt, når ugeplan er valgt. Luftpumpen ignorerer tidsplanen i Auto-vinterdrift.

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

Ugeplan kræver gyldigt klokkeslæt. SNTP eller Home Assistant kan sætte uret; det fortsætter ved netudfald. Efter fuldt strømsvigt uden efterfølgende tidssynkronisering kan automatiske ugeplaner ikke køre. Urfejl vises for ugeplaner, der aktuelt skal bruges i Auto. Automatisk vinterluft kræver ikke klokkeslæt. Faste ugedage/klokkeslæt efter strømsvigt helt uden net kræver et batteribackup-ur og en udvidelse af YAML.

Fra den oprindelige fil er døgnoversigter, daglige min/max, højvandsalarm og særskilt frostalarm fortsat ikke med i v2. Hændelsesloggen er kort og gemmes ikke over genstart.

## Kontrolstatus

ESPHome-konfigurationsvalidering er bestået i en lokal valideringskopi med testværdier for Wi-Fi. C++-kildegenereringen lykkedes. Fuld firmwarekompilering blev afbrudt under download/udpakning af ESP-IDF, fordi C-drevet løb tør for plads. De midlertidige validatorpakker og buildfiler fra forsøget er fjernet. Firmwaren er derfor ikke bekræftet kompilerbar. Ingen firmware er uploadet eller testet på dammens hardware. Originalens pins, board og relæadresse er videreført. Wi-Fi, API-nøgle og hotspot-adgangskode skal ligge i lokal secrets.yaml; de er ikke med i repositoryet.

Brugerfladens tekstfelter og gruppering følger [ESPHome Template Text](https://esphome.io/components/text/template/) og [Web Server](https://esphome.io/components/web_server/).
