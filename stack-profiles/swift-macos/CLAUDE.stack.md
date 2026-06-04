
---

## Stack-Regeln: Swift / macOS

Diese Regeln gelten zusätzlich zu den allgemeinen Code-Regeln oben.

### Sandbox und Sicherheit

- App Sandbox bleibt aktiviert — keine Ausnahmen ohne explizite Genehmigung
- Hardened Runtime bleibt aktiviert
- Entitlements nur hinzufügen wenn ein Feature es zwingend erfordert
- Kein Entitlement entfernen ohne zu prüfen ob es noch genutzt wird

### Swift-Code

- Kein Force-Unwrap (`!`) außer in Tests oder wo nil provably impossible ist
- Fehler explizit behandeln — kein `try!` oder leeres `catch {}`
- Kein `as!` Force-Cast — typsicheres Optional-Casting bevorzugen
- `async/await` statt Completion-Handler
- `@MainActor` für alle `ObservableObject`-Klassen die die UI berühren
- Combine nur wo nötig — SwiftUI-State bevorzugen

### Datenspeicherung

- Sensitive Daten (API-Keys, License Keys, Tokens) **nur im Keychain** — nie in UserDefaults
- `UserDefaults` nur für unkritische Einstellungen (Bool-Flags, Strings ohne Sicherheitsbezug)
- Konstante Strings für Keychain/UserDefaults-Keys in einem zentralen Enum bündeln
  (verhindert Tippfehler und macht Umbenennungen sicher)

### XcodeGen-Workflow

- `project.yml` ist die Single Source of Truth — `.xcodeproj` wird nicht committed
- Nach jeder Änderung an `project.yml`: `make generate` ausführen bevor `make build`
- Neue Dateien in `Sources/` werden automatisch erkannt — `project.yml` muss dafür
  nicht geändert werden

### Bekannte Fallstricke (aus der Praxis)

**Accessibility-Permission nach `make generate`:**
Nach XcodeGen-Regenerierung ändert sich der App-Pfad im DerivedData-Verzeichnis.
macOS entzieht dann die Accessibility-Berechtigung (CGEventTap, Tastatur-Hooks).
Lösung: Systemeinstellungen → Datenschutz & Sicherheit → Bedienungshilfen →
alten App-Eintrag löschen → App neu starten → Berechtigung neu erteilen.

**NSPasteboard / CGEvent auf nicht-sandboxed Apps:**
Diese APIs erfordern `ENABLE_APP_SANDBOX: NO` in den Build-Settings.
Sobald Sandbox deaktiviert ist, entfallen viele automatische Schutzmaßnahmen —
Eingabe-Validierung und Keychain-Nutzung dann besonders wichtig.

**WhisperKit / große ML-Modelle:**
Modell-Downloads laufen asynchron. UI muss Download-Zustand anzeigen.
Umlaute können als NFD geliefert werden — vor String-Vergleichen auf NFC normalisieren.

### Dateipfade und Ressourcen

- Keine hardcodierten absoluten Pfade — `FileManager`, `Bundle.main` und `URL` nutzen
- Ressourcen über den Asset Catalog referenzieren, nicht direkt per Pfad
- User-Daten nur in vorgesehenen Verzeichnissen speichern (`applicationSupport`, `documents`)

### Build und Signierung

- Signierung nicht im Quellcode ändern — nur in `project.yml` oder direkt in Xcode
- Deployment Target nicht erhöhen ohne Rückfrage (betrifft Nutzer-Kompatibilität)
- Nach Notarisierung: DMG mit `make archive` erstellen, nicht manuell

### Tests

- Jedes neue Service-Modul bekommt Unit Tests
- Testdatei-Konvention: `[ServiceName]Tests.swift` in `tests/AppTests/`
- UI-Tests nur für kritische Flows (Onboarding, Kauf-Flow)
- SwiftUI Previews müssen kompilieren — Preview-Code nicht auskommentieren
