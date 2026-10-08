import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run their own backend (port 8011, throwaway SQLite file) and frontend
// (port 5174), so they never touch the development database or the dev servers.
const BACKEND_PORT = 8011
const FRONTEND_PORT = 5174

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: `http://localhost:${FRONTEND_PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command:
        'rm -f e2e.db && uv run alembic upgrade head && ' +
        `uv run fastapi run app/main.py --port ${BACKEND_PORT}`,
      cwd: '../backend',
      env: { APP_DATABASE_URL: 'sqlite:///./e2e.db', APP_ENV: 'test' },
      url: `http://127.0.0.1:${BACKEND_PORT}/api/health`,
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      env: { API_PROXY_TARGET: `http://127.0.0.1:${BACKEND_PORT}` },
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
    },
  ],
})
