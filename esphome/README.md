# Pond Controller

Lokal ESPHome-styring til en dam på 7.600 liter med integration til Home Assistant.

## Filer

- `pond-controller-v2.yaml`: konfigurationsforslaget.
- `FLOWS.md`: styringsregler, tidsplaner, indstillinger og begrænsninger.
- `secrets.example.yaml`: eksempel på nødvendige lokale adgangsoplysninger.

## Status

Forslag pr. 29. oktober 2026. ESPHome 2026.10.1-konfigurationsvalidering og C++-kildegenerering bestod før adgangsoplysninger blev udskilt til secret-referencer. Fuld firmwarekompilering blev afbrudt under udpakning af ESP-IDF på grund af pladsmangel. Ingen upload eller hardwaretest er udført. Valider og kompilér med dine egne secrets før brug.

## Hardware og relæer

ESP32-S3-konfiguration (8 MB), ATOMportABC, A02YYUW, to DS18B20 og M5Stack 4-relay. Pins og boardvalg er videreført fra den oprindelige konfiguration og skal verificeres mod den fysiske hardware.

1. Filterpumpe
2. Skimmer
3. Luftpumpe
4. UV-C

## Lokal opsætning

Kopier `secrets.example.yaml` til `secrets.yaml` ved siden af YAML-filen og indsæt dine egne værdier. Brug API-nøglen fra din eksisterende installation, hvis HA-forbindelsen skal bevares. `secrets.yaml` ignoreres af Git. Kalibrer sensorhøjde og vandstandsgrænser før brug, og verificér hvilken temperatursensor der sidder ved bund og overflade.

Styringsregler og intervalplaner fungerer uden internet eller Home Assistant. Ugeplaner kræver et gyldigt ur; efter strømsvigt uden tidssynkronisering kræves et batteribackup-ur for fuld kalenderdrift offline.

## Versionshistorik

Git-commits gemmer projektets stadier, så tidligere versioner kan ses og gendannes. Den stabile fil hedder fortsat `pond-controller-v2.yaml`; fremtidige ændringer kan gemmes som nye commits uden at lave kopier med nye filnavne.
