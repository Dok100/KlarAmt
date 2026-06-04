from src.app import get_message


def test_smoke() -> None:
    assert get_message() == "Python-Starter aus dem Codex-Projekt-Framework."
