module.exports = {
  apps: [
    {
      name: 'knm-monitoring',
      script: 'npm',
      args: 'start',
      cwd: '/home/apps/monitoring',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5005,
      },
      max_memory_restart: '500M',
      error_file: '/home/apps/monitoring/logs/error.log',
      out_file: '/home/apps/monitoring/logs/out.log',
      log_file: '/home/apps/monitoring/logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
