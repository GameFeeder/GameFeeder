/** Import jest for every test file. */
import { jest } from '@jest/globals';

// For ESM compatibility, explicitly add jest to the global object
Object.defineProperty(globalThis, 'jest', { value: jest });

// Automatically mock problematic ESM modules
jest.mock('node-fetch');
