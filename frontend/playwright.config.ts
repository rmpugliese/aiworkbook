import { defineConfig, devices } from '@playwright/test'

import { E2E_USER } from './e2e/user.ts'

// End-to-end tests run their own backend (port 8011, throwaway SQLite file) and frontend
// (port 5174), so they never touch the development database or the dev servers.
const BACKEND_PORT = 8011
const FRONTEND_PORT = 5174
// Same as the Makefile: Pango for WeasyPrint, set on the command because macOS strips DYLD_*.
const PANGO = process.platform === 'darwin' ? 'DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib ' : ''

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
        `uv run python -m app.cli create-user --email ${E2E_USER.email} --password ${E2E_USER.password} --verified --accept-terms && ` +
        `${PANGO}uv run fastapi run app/main.py --port ${BACKEND_PORT}`,
      cwd: '../backend',
      env: {
        ...process.env,
        APP_DATABASE_URL: 'sqlite:///./e2e.db',
        APP_ENV: 'test',
        // Share links point at the e2e frontend, not at the dev server.
        APP_PUBLIC_URL: `http://localhost:${FRONTEND_PORT}`,
      },
      url: `http://127.0.0.1:${BACKEND_PORT}/api/health`,
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      env: { ...process.env, API_PROXY_TARGET: `http://127.0.0.1:${BACKEND_PORT}` },
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
    },
  ],
})
