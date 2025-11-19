import { jest } from '@jest/globals';

const mockLogger = {
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  critical: jest.fn(),
  reportCaughtError: jest.fn(),
};

export default mockLogger;
