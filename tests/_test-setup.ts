/** Import jest for every test file. */
import { jest } from '@jest/globals';

// For some reason TS expects a slightly different type here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.jest = jest as any;
