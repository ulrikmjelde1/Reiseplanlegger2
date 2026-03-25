# Reiseplanlegger

En statisk, interaktiv reiseplanlegger laget for GitHub Pages.

## Hvorfor denne løsningen?

Denne versjonen er laget for **GitHub Pages som MVP**:
- ingen backend nødvendig
- all logikk kjører i nettleseren
- reiser lagres som **JSON-objekter i `localStorage`**
- import/eksport av JSON er innebygd for backup og senere migrering

Det gjør løsningen enkel å publisere nå, samtidig som datastrukturen er klar for senere flytting til API + database.

## Repo-struktur

```text
.
├── index.html
├── styles.css
├── app.js
├── .nojekyll
└── README.md
```

## Datastruktur

Hver reise lagres som ett JSON-objekt. Jeg har brukt arrays for fly, hotell og deltakere i stedet for nummererte felter som `hotel_name1`, `hotel_name2` osv., fordi dette er lettere å vedlikeholde og mye enklere å utvide senere.

### Eksempel

```json
{
  "id": "2b3152b8-b2dd-458f-8c39-60c5c00f8ab9",
  "destination": "Tokyo",
  "category": "fritid",
  "region": "Japan",
  "currency": "NOK",
  "startDate": "2026-10-03",
  "endDate": "2026-10-14",
  "flightTotalPrice": 9800,
  "hotelTotalPrice": 13500,
  "flights": [
    {
      "flightNumber": "SK983",
      "depAirport": "CPH",
      "arrAirport": "HND",
      "airline": "SAS",
      "durationMinutes": 710
    }
  ],
  "hotels": [
    {
      "name": "Shinjuku Hotel",
      "totalPrice": 13500
    }
  ],
  "participants": [
    { "name": "Ola" },
    { "name": "Kari" }
  ],
  "tags": ["mat", "storby"],
  "notes": "Book restaurant tidlig",
  "createdAt": "2026-03-25T12:00:00.000Z",
  "updatedAt": "2026-03-25T12:00:00.000Z"
}
```

## Hvordan inndeles reiser?

Reisene deles automatisk i:
- **Fremtidige reiser** når `endDate >= dagens lokale dato`
- **Tidligere reiser** når `endDate < dagens lokale dato`

Dagens dato regnes i JavaScript i brukerens nettleser, så dette fungerer direkte på GitHub Pages uten backend.

## Statistikk

Statistikk bygges i `buildStatDefinitions()` i `app.js`.

Der kan du enkelt legge til nye nøkkeltall senere, for eksempel:
- total CO₂
- gjennomsnittlig flypris per tur
- hotellkost per natt
- antall land
- total distanse
- flydata hentet fra API

## Slik publiserer du på GitHub Pages

1. Lag et nytt repo på GitHub.
2. Last opp alle filene i denne mappen.
3. Gå til **Settings → Pages**.
4. Velg publisering fra ønsket branch, typisk `main` og `/root`.
5. Lagre.
6. Etter kort tid får du en GitHub Pages-URL.

## Videre vei når du vil gjøre dette til en tjeneste for flere brukere

Når du vil ha flere brukere, innlogging og deling på tvers av enheter, anbefaler jeg å beholde frontend-strukturen men bytte lagringslaget:

### Gode neste steg
- **Frontend videreført som den er**: GitHub Pages, Netlify eller Vercel
- **Backend/API**: Supabase, Firebase, Appwrite eller egen backend
- **Database**: PostgreSQL eller dokumentbasert lagring
- **Auth**: GitHub, Google eller e-post/passord

Da kan `TravelStorage`-klassen i `app.js` byttes fra `localStorage` til API-kall uten å skrive om hele UI-et.

## Tips

- Ta jevnlig JSON-eksport som backup.
- `localStorage` er per nettleser og per enhet.
- Om du ønsker mer data senere, er arrays allerede støttet for fly, hotell og deltakere.

# Reiseplanlegger2
