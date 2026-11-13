"""Save your NASA keys to a local .env file.

Generic setup helper, not part of the challenge solution.
AI-assisted: written with help from Claude. Reviewed by: <team member>.

Run from the repository root:

    python scripts/setup_keys.py

What you type is hidden and is never printed. The .env file is ignored by git.
"""

import getpass
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = REPO_ROOT / ".env"

FIELDS = [
    # (name, prompt, required, hidden, validator, hint)
    ("FIRMS_MAP_KEY", "FIRMS map key", True, True,
     lambda v: re.fullmatch(r"[A-Za-z0-9]{32}", v) is not None,
     "It should be 32 letters and digits. Copy it again from the FIRMS email."),
    ("EARTHDATA_USERNAME", "Earthdata username (Enter to skip)", False, False,
     lambda v: " " not in v, "A username has no spaces."),
    ("EARTHDATA_TOKEN", "Earthdata token (Enter to skip)", False, True,
     lambda v: len(v) >= 20, "That looks too short for a token."),
]


def git_ignores_env() -> bool:
    """True if git will ignore the .env file."""
    try:
        result = subprocess.run(
            ["git", "check-ignore", "-q", str(ENV_FILE)],
            cwd=REPO_ROOT, capture_output=True,
        )
    except FileNotFoundError:
        return False
    return result.returncode == 0


def read_existing() -> dict:
    values = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, _, value = line.partition("=")
                values[key.strip()] = value.strip()
    return values


def ask(prompt: str, hidden: bool) -> str:
    reader = getpass.getpass if hidden else input
    return reader(f"{prompt}: ").strip()


def main() -> int:
    if not git_ignores_env():
        print("Stopping: git is not set to ignore .env in this folder.")
        print("Check that .gitignore contains a line with '.env', then run again.")
        return 1

    values = read_existing()
    if values:
        print(f"Found an existing .env with: {', '.join(sorted(values))}")
        print("Press Enter at any prompt to keep the saved value.\n")

    for name, prompt, required, hidden, valid, hint in FIELDS:
        while True:
            entered = ask(prompt, hidden)
            if not entered:
                if name in values or not required:
                    break
                print("This one is required.")
                continue
            if not valid(entered):
                print(hint)
                continue
            values[name] = entered
            break

    lines = [f"{key}={value}" for key, value in values.items()]
    ENV_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"\nSaved {len(values)} value(s) to {ENV_FILE}")
    print("Saved names: " + ", ".join(values))
    print("The values are not shown. Do not share or commit this file.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
