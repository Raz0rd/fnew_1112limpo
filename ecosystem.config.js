module.exports = {
  apps: [{
    name: 'ffireshop',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ffireshop',
    exec_mode: 'fork', // FORK mode (não cluster)
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3044
    },
    error_file: '/var/www/ffireshop/logs/err.log',
    out_file: '/var/www/ffireshop/logs/out.log',
    log_file: '/var/www/ffireshop/logs/combined.log',
    time: true
  }]
}
