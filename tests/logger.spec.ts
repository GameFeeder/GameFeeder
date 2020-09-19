/* eslint-disable jest/expect-expect */
import Logger from 'src/logger';

describe('Logger', () => {
  const testMessage = 'testMessage';
  const testLabel = 'testLogger';
  let testLogger: Logger;

  beforeAll(() => {
    testLogger = new Logger(testLabel);
  });

  test('should log a debug message', () => {
    testLogger.debug(testMessage);
  });

  test('should log an info message', () => {
    testLogger.info(testMessage);
  });

  test('should log a warn message', () => {
    testLogger.warn(testMessage);
  });

  test('should log an error message', () => {
    testLogger.error(testMessage);
  });
});
