# ProductiveME

## Run the read API and web app

Install workspace dependencies from the repository root:

```sh
pnpm install
```

Start the API and web app in separate terminals, both from the repository root:

```sh
pnpm --filter @productiveme/api dev
```

```sh
pnpm --filter @productiveme/web dev
```

Open the Vite URL shown in the web terminal (usually `http://localhost:5173`).
By default, the web app sends `/api/*` requests through Vite's reverse proxy,
which strips `/api` before forwarding to the root API at
`http://127.0.0.1:3000`. This same-origin proxy is the recommended setup. A
direct `VITE_API_BASE_URL` override can point to the API root, such as
`http://127.0.0.1:3000`, but cross-origin browser requests require CORS to be
enabled on the destination API; the API as shipped does not enable CORS. Include
an `/api` suffix only when a reverse proxy actually mounts the API under that
path.

The API reads snapshots from `snapshots/<registry-entry-id>/*.json` at the
repository root. An absent snapshot directory appears as a per-entry “No
snapshots found” status. Empty registry, snapshot, and signal results have
their own empty states, and a failure in one section leaves other sections
available for retry. Domain detail also retains illustrative prototype panels,
which are labeled separately from live API data.

Run the sync worker manually with `pnpm sync run` from the repository root.
It reads `registry.yaml` and writes validated snapshot history under
`snapshots/<registry-entry-id>/`. Pass `--root <path>` to use a different
checkout or a temporary registry. Configure a GitHub personal access token in
`GITHUB_TOKEN` only when private repository access is needed; it is not saved.
For scheduled runs, add an OS cron entry such as `0 * * * * cd /path/to/ProductiveME && pnpm sync run`.

The `static-file` connector reads a Snapshot JSON fixture from a local path or
`file://` URL. `local-folder` records immediate file and directory children,
using modification times as activity timestamps. `github` reads repository
metadata and recent repository events using GitHub's REST API.

## Local inference and review drafts

The API can optionally generate a short weekly or monthly draft using an
Ollama server. It is disabled until both `INFERENCE_BASE_URL` and
`INFERENCE_MODEL` are configured. The endpoint can run on the Wyse or another
host reachable over the private network; Compose does not install an inference
daemon or download model weights. Defaults bound each request to 2048 context
tokens, 512 output tokens, and 30 seconds. Measure quality, latency, and memory
for a small quantized model on the actual host. Configured context must leave
at least 512 tokens beyond the output cap. Prompt text has a separate character
limit; that limit is not an exact token estimate. Requests set `think: false`,
so select an Ollama model that supports disabling thinking. `POST /reviews`
uses brief server-side snapshot facts and computed signals, and returns a draft
without saving it.

### First model to evaluate

Use [`qwen3:0.6b`](https://ollama.com/library/qwen3:0.6b) with its Q4_K_M
quantization as the initial smoke-test candidate (about 523 MB on the Ollama
library page). Compare it with [`qwen3:1.7b`](https://ollama.com/library/qwen3:1.7b)
Q4_K_M (about 1.4 GB) if the smaller model's drafts are too weak and the host has room.
These are evaluation candidates, not a performance guarantee or final model
choice. The Wyse 5060 has an older AMD CPU, so start with CPU inference; check
`lscpu` flags on the actual machine before assuming a particular instruction
set or GPU acceleration will work. Record draft quality, wall-clock latency,
and peak memory for the same prompts on that host before deciding.

### Install and check Ollama on the inference host

Install Ollama using the current [official Linux instructions](https://docs.ollama.com/linux)
on the machine that will host inference. The installer creates a system service;
check it with `sudo systemctl status ollama`. Then pull the small candidate manually:

```sh
ollama pull qwen3:0.6b
```

Check the model through the local API on that machine. This makes one short
request and does not configure ProductiveME:

```sh
curl http://127.0.0.1:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen3:0.6b","prompt":"Summarize: completed one task; one task remains blocked.","stream":false,"think":false,"options":{"num_ctx":2048,"num_predict":128}}'
```

Use the same repeatable set of real review inputs to compare candidates. Note
whether each draft stays grounded, whether it invents facts, its elapsed time,
and the host's peak memory. Do not infer tokens per second or hardware support
from the model's library size.

### Connect the API to Ollama

For the simplest first check, run the API on the same Linux host as Ollama and
set these in the API process environment:

```sh
INFERENCE_BASE_URL=http://127.0.0.1:11434
INFERENCE_MODEL=qwen3:0.6b
```

The Compose API runs in a separate network namespace, so its `127.0.0.1` points
to the API container, not Ollama on the Docker host. For Compose, set
`INFERENCE_BASE_URL` to an Ollama address reachable from the container on the
private LAN or Tailscale network, and restrict the inference port with the host
firewall to trusted devices. For example, if the inference host has the stable
private address `192.168.1.20`, configure the Linux service to bind that address:

```sh
sudo systemctl edit ollama.service
```

Add this override, replacing the example address with that host's private
interface address:

```ini
[Service]
Environment="OLLAMA_HOST=192.168.1.20:11434"
```

Then run `sudo systemctl daemon-reload` and `sudo systemctl restart ollama`, and
configure the firewall to allow port 11434 only from the API host's private
address. Set `INFERENCE_BASE_URL` to `http://192.168.1.20:11434` in Compose
`.env`. Keep the inference port off public interfaces. Ollama binds to loopback
by default; do not bind it to all interfaces without a restrictive firewall.

For a same-host native API, leave Ollama bound to loopback and use the earlier
`127.0.0.1` URL. For remote access, Ollama supports binding a specific private
address through `OLLAMA_HOST`; see the [official server configuration FAQ](https://docs.ollama.com/faq#how-can-i-expose-ollama-on-my-network).

Compose reads `.env` values for variable substitution, and `compose.yaml`
passes the inference variables into the API container. `pnpm --filter
@productiveme/api dev` reads the shell's environment directly; Compose `.env`
is not automatically loaded into that native process. Leave both required
values blank to keep generation disabled. When configured, restart the API and
use **Generate review** in the Review view. Weekly and monthly requests are
manual; errors do not trigger automatic retries. Drafts are displayed only and
are not saved or exported yet.

## Run the local containers

Build the API and run one Sync pass with Docker Compose:

```sh
docker compose build
docker compose run --rm sync
docker compose up -d api
```

The API is available at `http://127.0.0.1:3000`; set `API_PUBLISHED_PORT` to
choose a different host port. The API process listens on all interfaces inside
its container, while Compose publishes it only on host loopback. The API sees
the repository registry and shared snapshots read-only. Sync can write the
same named snapshot volume. To stop the API and remove the local volume, run
`docker compose down --volumes`.

`API_HOST` and `API_PORT` configure the process listener (defaults:
`127.0.0.1` and `3000`; Compose sets the container host to `0.0.0.0`). API
requests and Sync outcomes are logged as JSON. The API's `GET /healthz` checks
process liveness only. `scripts/docker-smoke.sh` builds and exercises the two
images against temporary fixture data; CI runs the same smoke check.

This local runtime is the first Phase 5 unit and is intended to run first on
the Wyse 5060. AWS deployment remains optional learning work; no scheduler is
installed by Compose.

To enable local review drafts, copy `.env.example` to `.env` and set the
Ollama URL and model. Use a private-network address reachable from the API
container, such as a host name/IP on the home LAN or a Tailscale address. Keep
the inference service off public interfaces. The API continues to start and
serve read routes when these settings are empty.
