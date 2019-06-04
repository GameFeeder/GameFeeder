module.exports = {
  apps : [{
    name: 'valveGamesAnnouncer',
    script: 'dist/_main.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    instances: 1,
    autorestart: true,
    watch: './dist/',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug'
    },
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    }
  }],
};
