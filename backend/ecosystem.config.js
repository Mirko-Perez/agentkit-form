// PM2 Ecosystem configuration file
// This file allows PM2 to manage the application with proper environment variables
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'emcopre-app',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 80
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // Load environment variables from .env file
    env_file: './.env'
  }]
};
