"""Run a reviewed Python script over the project's existing SSH identities."""
import argparse
import subprocess
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script", type=Path)
    parser.add_argument("--account", choices=["api", "public"], default="api")
    args = parser.parse_args()
    account = "gca-backend" if args.account == "api" else "guia_comercial_araraquara"
    identity = "cloudez_gca_backend" if args.account == "api" else "cloudez_guia_comercial_araraquara"
    python = "/srv/gca-backend.2d4f02a0.configr.cloud/.virtualenv/3.12/bin/python" if args.account == "api" else "python3"
    command = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-i", str(Path.home()/".ssh"/identity),
               f"{account}@ip-45-79-2-160.cloudezapp.io", python + " -"]
    result = subprocess.run(command, input=args.script.read_bytes(), check=False)
    raise SystemExit(result.returncode)


if __name__ == "__main__":
    main()
