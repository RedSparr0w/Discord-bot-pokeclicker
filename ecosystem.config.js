module.exports = {
  apps : [
    {
      name: 'Pokeclicker-bot',
      script: 'index.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
    },
  ],
};
