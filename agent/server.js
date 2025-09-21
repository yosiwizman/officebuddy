// Minimal agent runtime exposing /tasks with contracts-first validation
// and /metrics via prom-client. Listens on process.env.PORT or 9991.

import express from 'express';
import { randomUUID } from 'uuid';
import { CreateTaskSchema, normalizeCreateTask } from '../contracts/tasks.js';
import client from 'prom-client';

const app = express();
app.use(express.json());

// Metrics registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const requests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(requests);

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const dur = Date.now() - start;
    requests.labels(req.method, req.path, String(res.statusCode)).inc();
    console.log(`[agent] ${req.method} ${req.path} -> ${res.statusCode} ${dur}ms`);
  });
  next();
});

app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (e) {
    res.status(500).json({ error: 'metrics_error' });
  }
});

app.post('/tasks', (req, res) => {
  try {
    // Validate and normalize payload
    const parsed = CreateTaskSchema.parse(req.body);
    const normalized = normalizeCreateTask(parsed);

    // Simulate task creation and return a contract-aligned response
    const id = randomUUID();
    const now = new Date().toISOString();
    const response = {
      id,
      description: normalized.description,
      type: 'IMMEDIATE',
      status: 'PENDING',
      priority: normalized.priority,
      control: 'ASSISTANT',
      createdAt: now,
      createdBy: 'USER',
      scheduledFor: null,
      updatedAt: now,
      executedAt: null,
      completedAt: null,
      queuedAt: null,
      error: null,
      result: null,
      model: normalized.model
    };

    console.log(`[tasks] created task id=${id} model=${normalized.model}`);
    res.status(200).json(response);
  } catch (err) {
    const status = (err && err.statusCode) || 400;
    res.status(status).json({ error: err?.message || 'invalid_request' });
  }
});

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'officebuddy-agent' });
});

const port = Number(process.env.PORT || 9991);
app.listen(port, () => {
  console.log(`[agent] listening on :${port}`);
});
