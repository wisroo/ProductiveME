#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture_dir="$(mktemp -d)"
project="productiveme-smoke-$$"
port="${API_PUBLISHED_PORT:-$((18000 + $$ % 20000))}"
compose=(docker compose -p "$project" -f "$repo_root/compose.yaml" -f "$fixture_dir/compose.yaml")

cleanup() {
  "${compose[@]}" down --volumes --rmi local --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$fixture_dir"
}
trap cleanup EXIT

cat >"$fixture_dir/registry.yaml" <<'YAML'
entries:
  - id: docker-smoke
    name: Docker smoke fixture
    kind: tool
    domain: career
    locator: /app/test-fixture.json
    connector: static-file
YAML
cat >"$fixture_dir/test-fixture.json" <<'JSON'
{"entryId":"docker-smoke","fetchedAt":"2026-10-27T00:00:00.000Z","status":"ok","items":[{"title":"container snapshot smoke"}]}
JSON
cat >"$fixture_dir/compose.yaml" <<YAML
services:
  api:
    volumes:
      - $fixture_dir/registry.yaml:/app/registry.yaml:ro
  sync:
    volumes:
      - $fixture_dir/registry.yaml:/app/registry.yaml:ro
      - $fixture_dir/test-fixture.json:/app/test-fixture.json:ro
YAML

export API_PUBLISHED_PORT="$port"
"${compose[@]}" build api sync
sync_output="$("${compose[@]}" run --rm sync)"
if ! grep -F '"event":"sync.completed","total":1,"ok":1,"errors":0' <<<"$sync_output" >/dev/null; then
  printf '%s\n' "Sync did not report a successful fixture run: $sync_output" >&2
  exit 1
fi

"${compose[@]}" up -d api
for attempt in {1..30}; do
  if curl --fail --silent "http://127.0.0.1:$port/healthz" >/dev/null; then break; fi
  if [[ "$attempt" == 30 ]]; then
    "${compose[@]}" logs api >&2
    echo 'API did not become healthy' >&2
    exit 1
  fi
  sleep 1
done

snapshots="$(curl --fail --silent "http://127.0.0.1:$port/snapshots")"
if ! grep -F 'container snapshot smoke' <<<"$snapshots" >/dev/null; then
  echo 'API did not read the snapshot written by Sync' >&2
  exit 1
fi

"${compose[@]}" kill api >/dev/null
container_id="$("${compose[@]}" ps -aq api)"
for attempt in {1..20}; do
  state="$(docker inspect --format '{{.State.Status}}' "$container_id")"
  if [[ "$state" == exited ]]; then break; fi
  sleep 1
done
if [[ "${state:-}" != exited ]]; then
  echo "API container did not stop after kill (state: ${state:-unknown})" >&2
  exit 1
fi
echo 'Docker smoke passed: Sync wrote a snapshot, API served it and health, and API stopped after kill.'
