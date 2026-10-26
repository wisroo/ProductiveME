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

This local runtime is the first Phase 5 unit. AWS deployment and CloudWatch
metrics/alarms remain deferred until the deployment target decision is made;
no scheduler is installed by Compose.
