module.exports = {
  apps: [
    {
      name: "transport-next-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "transport-cron-worker",
      script: "cron-runner.js",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};