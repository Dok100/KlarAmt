
---

## Stack-Regeln: NextJS / React / TypeScript

Diese Regeln gelten zusätzlich zu den allgemeinen Code-Regeln oben.
Sie sind bewusst prinzipbasiert formuliert — unabhängig von Next.js-Versionen.

### Struktur: Folge was bereits da ist

- Halte die Ordnerstruktur die in `src/` bereits existiert — nicht reorganisieren
- Neue Komponenten dort anlegen wo gleichartige Komponenten bereits liegen
- Neues Routing dort anlegen wo bestehendes Routing liegt
- Kein zweites CSS-System einführen — nutze was das Projekt bereits verwendet

### Server vs. Client (Prinzip, nicht Version)

- **Standard: Server-seitig** — kein `"use client"` ohne konkreten Grund
- `"use client"` nur wenn die Komponente Browser-APIs, Event-Handler oder React-State braucht
- Daten-Fetching bevorzugt server-seitig — kein useEffect-Fetching wenn vermeidbar
- Keine `"use client"` Direktive in Layout-Dateien

### TypeScript — keine Ausnahmen

- Kein `any` — nie, auch nicht temporär
- Kein `@ts-ignore` oder `@ts-expect-error` — Typen korrekt lösen
- Props-Interfaces explizit benennen: `ButtonProps`, nicht anonymer Inline-Typ
- Return-Typen bei API-Handlern immer explizit angeben

### Umgebungsvariablen

- Nur Variablen mit `NEXT_PUBLIC_` Prefix sind im Browser sichtbar
- API-Keys, Tokens und Secrets niemals mit `NEXT_PUBLIC_` prefixen
- Jede genutzte Variable in `.env.example` als Platzhalter dokumentieren (ohne echten Wert)

### Styling

- Keine Inline-Styles (`style={{...}}`) außer für wirklich dynamische Werte
- Keine neuen CSS-Bibliotheken oder UI-Frameworks installieren ohne Rückfrage
- Klassen-Namen konsistent mit dem bestehenden Benennungsmuster halten

### Assets und Medien

- Nutze die Bild- und Asset-Behandlung die bereits im Projekt konfiguriert ist
- Externe Domains für Bilder in der bestehenden Konfigurationsdatei ergänzen — keine neue anlegen
- Fonts: bestehende Font-Konfiguration erweitern, nicht ersetzen
