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
The web app sends `/api/*` requests through Vite to the API at
`http://127.0.0.1:3000`; set `VITE_API_BASE_URL` to an absolute API base URL
ending in `/api` when using a different setup.

The API reads snapshots from `snapshots/<registry-entry-id>/*.json` at the
repository root. An absent snapshot directory appears as a per-entry “No
snapshots found” status. Empty registry, snapshot, and signal results have
their own empty states, and a failure in one section leaves other sections
available for retry. Domain detail also retains illustrative prototype panels,
which are labeled separately from live API data.
