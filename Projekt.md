# Dam med integration til Home Assistant

## Mål: Et samlet kort i Home Assistant

Projektets udstyr, diagrammer og styringslogik samles som grundlag for et HA-kort, der kan vise og styre dammen på samme måde som brugerens ventilationskort. Ventilationskortet skal bruges som reference for udseende, opbygning og betjening. Dets konkrete konfiguration er endnu ikke tilgængelig i denne projektmappe.

Kortet skal give overblik over:

- Dammens samlede status, valgt sæson og aktiv sommer-/vintertilstand.
- Vandtemperatur ved bund og overflade samt vandstand.
- Filterpumpens, UV-C-enhedens, beluftningens og isfriholderens status, i det omfang udstyret er tilsluttet og har tilgængelige entiteter.
- Automatisk påfyldning, spærringer og alarmer for blandt andet vandstand, frost og sensorfejl.
- Driftstider og seneste hændelser.

Betjening skal omfatte sæsonvalg, Auto/Til/Fra for relevante enheder, påfyldning og relevante indstillinger fra den eksisterende ESPHome-konfiguration. Sikkerhedsregler skal fortsat håndhæves lokalt på controlleren, også når en funktion betjenes fra kortet. Visningen skal skelne mellem en kommanderet relætilstand og faktisk bekræftet drift, hvor der ikke er en tilbagemeldingssensor.

Diagrammet over filteranlægget og oplysningerne om isfriholderen skal bruges til at gøre kortets visning forståelig og tro mod den faktiske installation.

### Grundlag for implementering af kortet

Første kortversion er implementeret som `pond-flow-card.js` med SVG-diagram og konfigurerbare entiteter. Repository: [MEbsen/pond-flow-card](https://github.com/MEbsen/pond-flow-card). HACS-releaseflow findes i `.github/workflows/release.yml`; `preview.html` viser demoen. Installation i HA og tilknytning af de faktiske entiteter udestår. ESPHome-filen med adgangsnøgler og det lokale referencebillede er udeladt fra Git.

- Ventilationskortets YAML eller anden eksisterende kortkonfiguration, så designet kan genbruges præcist.
- De faktiske entity-id'er i Home Assistant; ESPHome-navnene alene fastlægger dem ikke sikkert.
- Afklaring af isfriholderens tilslutning og forholdet til luftpumpen, som beskrevet nedenfor.

## Eksisterende udstyr

### Filterpumpe og trykfilter med UV-C

Brugeren har bekræftet, at opstillingen svarer til denne principtegning:

![[Trykfilter-principtegning-1.jpg]]

- En nedsænket filterpumpe i dammen sender vand gennem en slange til et eksternt trykfilter ved dammens kant.
- Tegningen viser filtermaterialer og en UV-C-enhed i toppen af trykfilteret.
- Det filtrerede vand føres tilbage til dammen via et hævet udløb og et vandløb/vandfald.
- Tegningen viser også en separat sideledning fra filteret. Dens konkrete funktion og tilslutning i den faktiske installation er endnu ikke bekræftet.

Vandets hovedvej er: **dam → filterpumpe → trykfilter med UV-C → vandløb/vandfald → dam**.

For styringen betyder det, at UV-C skal være afhængig af vandgennemstrømning. Den eksisterende YAML slukker UV-C, når filterpumpen er slukket; relæstatus alene bekræfter dog ikke faktisk gennemstrømning. I automatisk vintertilstand stopper konfigurationen filterpumpen og dermed også cirkulationen gennem filter og vandfald. Isfriholderen skal derfor indgå særskilt i vinterdriften.

Præcise modeller, pumpeydelse, løftehøjde og eventuel separat strømtilslutning til UV-C fremgår ikke af tegningen og er endnu ikke registreret.

### IceFree 4 Seasons – isfriholder

- Bruges allerede til at holde et hul åbent i dammens is om vinteren, så der kan ske gasudveksling.
- Produkt: [IceFree 4 Seasons hos Havedammen](https://havedammen.dk/cefree-4-seasons-isfriholder-til-havedam/).
- Virkemåde: En pumpe fører vand op omkring en flydeenhed og holder dermed et område af overfladen isfrit.
- Oplyst effekt: 5 W. Ved konstant drift svarer det til ca. 0,12 kWh pr. døgn.
- Oplyst minimumsvanddybde: 40 cm. Kabellængde: 10 m.
- Kan også bruges som et lille flydende springvand om sommeren med de medfølgende dyser.
- Skal sættes i drift inden frosten, ifølge produktsiden.

Kilde: Produktsiden ovenfor, læst 27. oktober 2026. Sidens omtale af −20 °C som vandtemperatur er uklar og bruges ikke som temperaturgrænse i projektets styring.

## Betydning for styringen

Isfriholderen skal indgå som selvstændigt udstyr i projektets vinterdrift. Den er en vandpumpe og må ikke uden videre sidestilles med luftpumpen/beluftningen.

Den nuværende konfiguration i [[pond-controller (3).yaml]] har fire tildelte relækanaler:

| Kanal | Funktion |
| --- | --- |
| 1 | Filterpumpe |
| 2 | Påfyldningsventil |
| 3 | Luftpumpe / beluftning |
| 4 | UV-C |

Der er derfor endnu ikke tildelt en udgang til isfriholderen. Tilslutning og eventuel separat relæudvidelse skal afklares, før automatisk styring implementeres. Det er heller ikke afklaret, om isfriholderen skal erstatte en planlagt luftpumpe, eller om begge skal indgå.

Den eksisterende YAML tænder luftpumpen automatisk om vinteren med kommentaren "hold hul i isen". Vinterlogikken skal ved næste funktionelle ændring tilpasses det faktiske udstyr, så isfriholder og beluftning får hver deres korrekte rolle.

Ved senere integration skal der tages stilling til:

- Kontinuerlig drift i vinterperioden og opstart inden frost.
- Lokal drift ved udfald af Home Assistant eller Wi-Fi samt adfærd efter genstart.
- Betjening og visning i Home Assistant, eksempelvis Auto/Til/Fra og driftstid.
- Placering og vanddybde ved isfriholderen; dammens niveausensor kan først bruges til beskyttelse, når dens reference er sammenholdt med placeringen.

## Projektfiler

- [[pond-controller (3).yaml]] – eksisterende ESPHome-konfiguration.
- [[Trykfilter-principtegning-1.jpg]] – principtegning af trykfilter.
