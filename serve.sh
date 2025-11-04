#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-8000}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
python3 -m http.server "$PORT" --bind 0.0.0.0
