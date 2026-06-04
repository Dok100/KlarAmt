"""Aufgabenliste — einfaches CLI-Tool."""

import json
import sys
from pathlib import Path

DATEI = Path("aufgaben.json")


def lade_aufgaben() -> list[str]:
    if not DATEI.exists():
        return []
    try:
        return json.loads(DATEI.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        print("Fehler: aufgaben.json konnte nicht gelesen werden.")
        return []


def speichere_aufgaben(aufgaben: list[str]) -> None:
    DATEI.write_text(json.dumps(aufgaben, ensure_ascii=False, indent=2), encoding="utf-8")


def cmd_add(text: str) -> None:
    if not text.strip():
        print("Fehler: Aufgabe darf nicht leer sein.")
        return
    aufgaben = lade_aufgaben()
    aufgaben.append(text.strip())
    speichere_aufgaben(aufgaben)
    print(f"Aufgabe gespeichert: {text.strip()}")


def cmd_list() -> None:
    aufgaben = lade_aufgaben()
    if not aufgaben:
        print("Keine offenen Aufgaben.")
        return
    for i, aufgabe in enumerate(aufgaben, start=1):
        print(f"{i}. {aufgabe}")


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print("Verwendung: app.py add <text> | list")
        return
    befehl = args[0]
    if befehl == "add":
        cmd_add(" ".join(args[1:]))
    elif befehl == "list":
        cmd_list()
    else:
        print(f"Unbekannter Befehl: {befehl}")


if __name__ == "__main__":
    main()
