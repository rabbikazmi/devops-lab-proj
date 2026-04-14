# IaC Simulator

> A beginner-friendly Infrastructure as Code project demonstrating Docker Compose and Ansible working together — provision containers, verify services, and monitor everything from a live dashboard.

---

## Overview

| Component | Role |
|-----------|------|
| **Docker Compose** | Provisions Nginx, PostgreSQL, and Redis containers |
| **Ansible** | Verifies services are running and healthy |
| **Dashboard** | Interactive UI with real-time metrics at `http://localhost:8081` |

---

## Quick Start

```bash
# 1. Start all services
docker-compose up -d

# 2. Verify with Ansible
ansible-playbook -i ansible/inventory.ini ansible/site.yml

# 3. Open the dashboard
open http://localhost:8081
```

That's it — all three services will be running in under a minute.

---

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/index.html) 2.10+
- Bash shell

**Estimated setup time:** 5–10 minutes (after tools are installed)

---

## Project Structure

```
iac-simulator/
├── docker-compose.yml       # Nginx, PostgreSQL, and Redis service definitions
├── ansible/
│   ├── inventory.ini        # Ansible host configuration
│   └── site.yml             # Service verification playbook
├── frontend/
│   └── index.html           # Dashboard UI
├── scripts/
│   └── smoke-test.sh        # Automated smoke tests
├── README.md
└── .gitignore
```

---

## Service Reference

| Service | URL / Host | Credentials |
|---------|-----------|-------------|
| Dashboard (Nginx) | http://localhost:8081 | — |
| PostgreSQL | `localhost:5432` | user: `admin`, password: *(your-password)* |
| Redis | `localhost:6379` | — |

---

## Common Commands

```bash
# Start services in the background
docker-compose up -d

# Stop all services
docker-compose down

# Check running containers
docker-compose ps

# View all logs
docker-compose logs

# View logs for a specific service
docker-compose logs nginx
docker-compose logs postgres
docker-compose logs redis
```

---

## Testing Services

```bash
# Test Nginx
curl http://localhost:8081

# Test PostgreSQL
psql -h localhost -U postgres -d iac_simulator
# Password: example

# Test Redis
redis-cli -h localhost
nc -z -w2 localhost 6379 && echo "Redis OK"

# Run automated smoke tests
./scripts/smoke-test.sh
```

---

## Dashboard

The interactive dashboard at `http://localhost:8081` updates every 2 seconds and displays:

- **Live Status** — Real-time health for all three containers
- **Uptime Counters** — How long each service has been running
- **CPU Usage** — Animated usage bars per container
- **Live Logs** — Streaming deployment log entries
- **Ansible Playbook** — Task execution status

---

## CI/CD Pipeline (GitHub Actions)

A GitHub Actions workflow is included that runs automatically on every push or pull request to `main`.

**Pipeline steps:**

1. **Terraform Validate** — Validates IaC configuration
2. **Ansible Lint** — Lints configuration management files
3. **Security Scan** — Runs basic security checks

To enable, push this repository to GitHub and view results under the **Actions** tab.

---

## Troubleshooting

### Services won't start

```bash
# Check that Docker is running
docker ps

# Inspect logs for errors
docker-compose logs
```

### Ansible playbook fails

```bash
# Verify host connectivity
ansible -i ansible/inventory.ini all -m ping

# Run playbook with verbose output
ansible-playbook -i ansible/inventory.ini ansible/site.yml -v
```

### Can't access the dashboard

1. Wait ~10 seconds for Nginx to finish starting
2. Refresh your browser (`Ctrl+R` / `Cmd+R`)
3. Confirm Nginx is responding: `curl http://localhost:8081`

### Port 8081 is already in use

Edit `docker-compose.yml` and change the Nginx port mapping, e.g. `8081:80`.

---

## Learning Outcomes

By exploring this project you'll get hands-on experience with:

- **Docker Compose** — Defining and managing multi-container applications
- **Ansible** — Automating service verification and configuration
- **DevOps basics** — Infrastructure automation and health monitoring
- **Redis** — Understanding a caching layer in a real stack
- **CI/CD** — Setting up GitHub Actions for IaC workflows

---

## Next Steps

1. Add more services to `docker-compose.yml`
2. Extend `ansible/site.yml` with additional health checks
3. Customize the dashboard in `frontend/index.html`
4. Connect a remote state backend for production-ready IaC

---

## Clean Up

```bash
docker-compose down
```

To remove volumes(database data) as well:

```bash
docker-compose down -v
```

