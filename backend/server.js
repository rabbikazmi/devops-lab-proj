const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');

const app = express();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const PORT = process.env.PORT || 3001;

const TARGET_CONTAINERS = [
  { id: 'iac-nginx', displayName: 'web-app' },
  { id: 'iac-postgres', displayName: 'postgres-db' },
  { id: 'iac-redis', displayName: 'redis-cache' }
];

app.use(cors());

function formatStatus(inspect) {
  if (!inspect || !inspect.State) {
    return 'not_found';
  }

  if (inspect.State.Running) {
    return 'running';
  }

  if (inspect.State.Status) {
    return inspect.State.Status;
  }

  return 'stopped';
}

function getHostPort(inspect) {
  const ports = inspect?.NetworkSettings?.Ports || {};
  for (const bindings of Object.values(ports)) {
    if (Array.isArray(bindings) && bindings[0] && bindings[0].HostPort) {
      return Number(bindings[0].HostPort);
    }
  }
  return null;
}

function getHealth(inspect) {
  return inspect?.State?.Health?.Status || 'unknown';
}

function getUptimeSeconds(inspect) {
  const startedAt = inspect?.State?.StartedAt;
  if (!startedAt || startedAt.startsWith('0001-01-01')) {
    return null;
  }

  const startMillis = Date.parse(startedAt);
  if (Number.isNaN(startMillis)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - startMillis) / 1000));
}

function calculateCpuPercent(stats) {
  const cpuDelta = (stats?.cpu_stats?.cpu_usage?.total_usage || 0) -
    (stats?.precpu_stats?.cpu_usage?.total_usage || 0);
  const systemDelta = (stats?.cpu_stats?.system_cpu_usage || 0) -
    (stats?.precpu_stats?.system_cpu_usage || 0);

  if (cpuDelta <= 0 || systemDelta <= 0) {
    return 0;
  }

  const onlineCpus = stats?.cpu_stats?.online_cpus ||
    stats?.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;

  const percent = (cpuDelta / systemDelta) * onlineCpus * 100;
  return Math.max(0, Math.min(100, Number(percent.toFixed(1))));
}

async function getContainerSnapshot(target) {
  try {
    const container = docker.getContainer(target.id);
    const inspect = await container.inspect();
    const status = formatStatus(inspect);
    let cpuPercent = 0;

    if (status === 'running') {
      try {
        const stats = await container.stats({ stream: false });
        cpuPercent = calculateCpuPercent(stats);
      } catch (error) {
        cpuPercent = 0;
      }
    }

    return {
      id: target.id,
      name: inspect?.Name ? inspect.Name.replace('/', '') : target.id,
      displayName: target.displayName,
      image: inspect?.Config?.Image || 'unknown',
      status,
      health: getHealth(inspect),
      uptimeSeconds: getUptimeSeconds(inspect),
      hostPort: getHostPort(inspect),
      cpuPercent
    };
  } catch (error) {
    if (error?.statusCode === 404) {
      return {
        id: target.id,
        name: target.id,
        displayName: target.displayName,
        image: 'n/a',
        status: 'not_found',
        health: 'unknown',
        uptimeSeconds: null,
        hostPort: null,
        cpuPercent: 0
      };
    }

    throw error;
  }
}

app.get('/api/health', async (req, res) => {
  try {
    await docker.ping();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Docker daemon unreachable' });
  }
});

app.get('/api/containers', async (req, res) => {
  try {
    const containers = await Promise.all(TARGET_CONTAINERS.map(getContainerSnapshot));
    res.json({
      generatedAt: new Date().toISOString(),
      containers
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch container status',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard API listening on port ${PORT}`);
});
