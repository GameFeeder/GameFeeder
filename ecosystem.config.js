module.exports = {
  apps : [{
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    name: 'valveGamesAnnouncer',
    script: 'dist/_main.js',
    instances: 1,
    interpreter : 'node@10.15.3',
    autorestart: true,
    watch: ['./dist/', './config/'],
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
