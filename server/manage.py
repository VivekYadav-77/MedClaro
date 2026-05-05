#!/usr/bin/env python
import os
import subprocess
import sys
from pathlib import Path


def ensure_local_venv() -> None:
    base_dir = Path(__file__).resolve().parent
    if os.name == "nt":
        venv_python = base_dir / "venv" / "Scripts" / "python.exe"
    else:
        venv_python = base_dir / "venv" / "bin" / "python"

    current_python = Path(sys.executable).resolve()
    if venv_python.exists() and current_python != venv_python.resolve():
        raise SystemExit(subprocess.call([str(venv_python), *sys.argv]))


def main() -> None:
    ensure_local_venv()
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projecthealth_backend.settings")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
