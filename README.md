# OfficeBuddy

A managed deployment of the Bytebot template on Railway for the “OfficeBuddy” project.

This repo captures API contracts, smoke workflows, and CI/CD linkage details for the Bytebot Agent/UI/Desktop services.

## Agent Tasks API

POST /tasks
- Purpose: create a new task for the Agent to execute.
- Content-Type: application/json

Required fields:
- description: string
- priority: enum("LOW"|"MEDIUM"|"HIGH")
- model: string

Optional fields:
- metadata?: object (free-form)

Validation/Defaults:
- If `model` is omitted, fallback to environment default OPENAI_MODEL if set; otherwise respond 400 with `{ "error": "model is required" }`.

Example

```bash
curl -sS -X POST "https://<AGENT_DOMAIN>/tasks" \
  -H "Content-Type: application/json" \
  -d '{ "description": "Open example.com and take a screenshot", "priority": "MEDIUM", "model": "gpt-4o-mini" }'
```

Response (200)
- JSON including fields: id, description, type, status, priority, control, timestamps, model

Common errors
- 400 Bad Request: missing model and OPENAI_MODEL not configured
- 401/403: Auth (if enabled later)

## OpenAPI
- See docs/openapi/agent-tasks.yaml for the contract and examples.

## Environment
Copy `.env.example` to `.env.local`.

- OPENAI_API_KEY: your API key (never commit)
- OPENAI_MODEL: default model used when a request omits `model` (e.g., gpt-4o-mini)

## Local development (Windows PowerShell)

```powershell
# Ensure absolute local path
New-Item -ItemType Directory -Force -Path "C:\\Projects\\OfficeBuddy" | Out-Null
Set-Location "C:\\Projects\\OfficeBuddy"

# If repo not cloned yet:
# git clone https://github.com/<YOUR_ORG_OR_USER>/officebuddy.git .
git remote -v
git branch --show-current
git log --pretty=oneline -n 5

# Env scaffolding (placeholders only)
Copy-Item ".env.example" ".env.local" -Force

# Install & run (adjust to pnpm if used)
npm ci
npm run build

# Local ports to avoid conflicts
# UI → 3100, Agent → 3101, Desktop → 3102
$env:NEXT_PUBLIC_AGENT_URL = "http://localhost:3101"
npm run dev

# Quick health checks (adjust to actual routes if different)
# Invoke-WebRequest -UseBasicParsing http://localhost:3100/api/healthz
# Invoke-WebRequest -UseBasicParsing http://localhost:3102/desktop/healthz
```

## Linking to Railway (CI/CD)
1) Create a private GitHub repo (name: officebuddy). If taken, use officebuddy-prod.
2) Push this repo to GitHub.
3) Link the GitHub repo to your Railway project (OfficeBuddy) via the Railway dashboard (recommended) so PRs build and deploy.

