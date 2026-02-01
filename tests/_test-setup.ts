/** Import jest for every test file. */
import { jest } from '@jest/globals';

// For ESM compatibility, explicitly add jest to the global object
Object.defineProperty(globalThis, 'jest', { value: jest });

import fs from 'fs';
import path from 'path';

// Create dummy api_config.json if it doesn't exist (for CI)
const apiConfigPath = path.resolve('config/api_config.json');
if (!fs.existsSync(apiConfigPath)) {
  const configDir = path.dirname(apiConfigPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(
    apiConfigPath,
    JSON.stringify({
      environment: 'test',
      bots: {},
      rollbar: { enabled: false, accessToken: 'mock' },
    }),
  );
}

// Automatically mock problematic ESM modules
jest.mock('node-fetch');

// Mock ConfigManager to prevent file access issues
jest.mock('../src/managers/config_manager.js', () => {
  return {
    __esModule: true,
    default: {
      getRollbarConfig: () => ({ enabled: false, accessToken: 'mock' }),
      getAPIConfig: () => ({
        environment: 'test',
        bots: {},
        rollbar: { enabled: false, accessToken: 'mock' },
      }),
      getBotConfig: () => ({}),
      getGameConfig: () => [],
      getUpdatersConfig: () => ({}),
      getEnvironment: () => 'test',
    },
  };
});

// Mock RollbarClient globally for all tests
jest.mock('../src/util/rollbar_client.js');
