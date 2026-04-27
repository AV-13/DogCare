# DogCare — Infrastructure

Two Azure VMs (Ubuntu 24.04, `Standard_B2ats_v2`) :

| VM       | Role                              | Region          |
|----------|-----------------------------------|-----------------|
| backend  | Node API + Postgres (Docker)      | France Central  |
| frontend | nginx serving Vite build + proxy  | Sweden Central  |

The frontend nginx proxies `/api` and `/uploads` to the backend, so the browser
sees a single origin → no CORS, the React app keeps using `/api` paths
unchanged.

## 0. Prerequisites on your laptop

- `bash` (Git Bash or WSL on Windows), `ssh`, `rsync`, `curl`
- `node` 20+ (for the local frontend build inside `deploy.sh`)
- The Azure CLI to fetch IPs (or grab them from the portal)

## 1. Get the public IPs

```bash
az vm list-ip-addresses -g fil-rouge -o table
```

## 2. Open Azure NSG ports

| VM       | Inbound port | Source              |
|----------|--------------|---------------------|
| backend  | 22 (SSH)     | your IP             |
| backend  | 3000 (API)   | frontend VM IP only (recommended) — or anywhere to test |
| frontend | 22 (SSH)     | your IP             |
| frontend | 80 (HTTP)    | anywhere            |

`provision-*.sh` also sets up `ufw` inside the VM as defence-in-depth.

## 3. Configure the deploy file

```bash
cp infra/.env.deploy.example infra/.env.deploy
# edit BACKEND_HOST, FRONTEND_HOST, JWT_SECRET, DB_PASSWORD…
```

`infra/.env.deploy` is gitignored.

## 4. First-time bootstrap

From the repo root:

```bash
bash infra/deploy.sh
```

This will:
1. SSH into the backend VM, install Node 20 + Docker, start Postgres in
   docker-compose, install the systemd unit, push the API code, start it.
2. SSH into the frontend VM, install nginx, drop a templated site config
   (with the backend IP substituted), build `client/dist/` locally, push it.

When it finishes, open `http://<FRONTEND_HOST>` in a browser.

## 5. Configure Jenkins (one-time)

In **Manage Jenkins → Credentials**, add two SSH credentials:

| ID                        | Type                     | Username  | Key                            |
|---------------------------|--------------------------|-----------|--------------------------------|
| `dogcare-backend-ssh`     | SSH Username + Private Key | azureuser | contents of `backend_key.pem`  |
| `dogcare-frontend-ssh`    | SSH Username + Private Key | azureuser | contents of `frontend_key.pem` |

Recommended plugins: **SSH Agent**, **Pipeline**, **AnsiColor**, **Pipeline: Stage View**.

Create two **Pipeline** jobs:

| Job name             | Pipeline script from SCM | Script Path           | Default param           |
|----------------------|--------------------------|-----------------------|-------------------------|
| `dogcare-backend`    | this repo                | `Jenkinsfile.backend` | `BACKEND_HOST=<IP>`     |
| `dogcare-frontend`   | this repo                | `Jenkinsfile.frontend`| `FRONTEND_HOST=<IP>`    |

Both pipelines:
- run `lint` + `test` + (frontend: `build`) on every push
- only deploy when the branch is `main`

The backend test stage spins up an ephemeral Postgres container on port 55432
on the Jenkins host, so Jenkins needs a working `docker` CLI.

## 6. Day-to-day

- Push to a feature branch → CI lints + tests, no deploy.
- Push to `main` → CI runs, then deploys.
- Need to redeploy without code change → run the job with `FORCE_DEPLOY=true`.

## Files in this folder

| File                            | What it is                                                |
|---------------------------------|-----------------------------------------------------------|
| `.env.deploy.example`           | Template for the local config (gitignored when copied).   |
| `deploy.sh`                     | One-shot bootstrap of both VMs from your laptop.          |
| `provision-backend.sh`          | Idempotent setup script run on the backend VM.            |
| `provision-frontend.sh`         | Idempotent setup script run on the frontend VM.           |
| `docker-compose.prod.yml`       | Postgres for the backend VM (bound to 127.0.0.1).         |
| `dogcare-api.service`           | systemd unit running the Node API on the backend VM.      |
| `nginx-frontend.conf.template`  | Frontend nginx site (placeholders substituted on deploy). |

## Troubleshooting

- **API won't start**: `ssh` in, `sudo journalctl -u dogcare-api -e -n 100`.
- **Postgres unhealthy**: `cd /srv/dogcare-db && docker compose logs db`.
- **Photos 404 on the front**: confirm `/uploads/` proxy works — `curl -I http://<FRONTEND_HOST>/uploads/dogs/<filename>`.
- **CORS errors**: should not happen since same-origin via proxy. If they do,
  the front is calling absolute `http://<BACKEND_HOST>:3000` instead of `/api`
  — check `client/src/services/api.js`.
