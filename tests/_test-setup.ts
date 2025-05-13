// filepath: /Users/zachkontoulis/GameFeeder/tests/_test-setup.ts
/** Import jest for every test file. */
import { jest } from '@jest/globals';

// For ESM compatibility, explicitly add jest to the global object
Object.defineProperty(globalThis, 'jest', { value: jest });

// Automatically mock problematic ESM modules
jest.mock('node-fetch');

// Mock RollbarClient globally for all tests
jest.mock('../src/util/rollbar_client.js', () => {
  return {
    default: {
      getInstance: jest.fn().mockReturnValue({
        error: jest.fn(),
        warning: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      }),
    },
  };
});
