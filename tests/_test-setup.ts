/** Import jest for every test file. */
import { jest } from '@jest/globals';

// For ESM compatibility, explicitly add jest to the global object
Object.defineProperty(globalThis, 'jest', { value: jest });

// Automatically mock problematic ESM modules
jest.mock('node-fetch');

// Mock ConfigManager to prevent file access issues
jest.mock('../src/managers/config_manager.js', () => {
  return {
    __esModule: true,
    default: {
      getRollbarConfig: () => ({ enabled: false, accessToken: 'mock' }),
      getAPIConfig: () => ({
        bots: {},
        reddit: {},
        rollbar: { enabled: false, accessToken: 'mock' },
      }),
      getBotConfig: () => ({}),
      getRedditConfig: () => ({}),
      getGameConfig: () => [],
      getUpdatersConfig: () => ({}),
    },
  };
});

// Mock RollbarClient globally for all tests
jest.mock('../src/util/rollbar_client.js');
