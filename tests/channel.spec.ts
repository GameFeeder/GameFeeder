import Channel from 'src/channel.js';
import DataManager from 'src/managers/data_manager.js';
import MockBot from './mockClasses/mockBot.js';

jest.mock('src/managers/data_manager');

const mockBot = new MockBot();
let testChannel: Channel;

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('Channel', () => {
  beforeAll(() => {
    testChannel = new Channel('testChannel', mockBot);
    expect(testChannel).toBeTruthy();

    const mockGetSubscriberData = jest.fn();
    DataManager.getSubscriberData = mockGetSubscriberData;
    mockGetSubscriberData.mockReturnValue(Promise.resolve([testChannel]));
  });

  test('should set and get the channel label', () => {
    testChannel.label = 'newLabel';
    expect(testChannel.label).toBe('newLabel');
  });

  test('should set and get the channel prefix', () => {
    testChannel.prefix = 'newPrefix';
    expect(testChannel.prefix).toBe('newPrefix');
  });

  test('should set and get the disabled property', () => {
    testChannel.disabled = true;
    expect(testChannel.disabled).toBeTruthy();
  });

  test('should check if the channel equals another channel', () => {
    const testChannel2 = new Channel('testChannel2', mockBot);
    // With channel param
    expect(testChannel.isEqual(testChannel)).toBeTruthy();
    expect(testChannel.isEqual(testChannel2)).toBeFalsy();
    // With channel id param
    expect(testChannel.isEqual(testChannel.id)).toBeTruthy();
    expect(testChannel.isEqual(testChannel2.id)).toBeFalsy();
  });

  test('should get the user count', () => {
    // TODO: Maybe this needs to be set up somehow?
    expect(testChannel.getUserCount()).toEqual(0);
  });

  test('should check if the channel has a label', () => {
    testChannel.label = 'anyLabel';
    expect(testChannel.hasLabel).toBeTruthy();
    testChannel.label = '';
    expect(testChannel.hasLabel).toBeFalsy();
  });
});

describe('Channel prefix fallback', () => {
  const mockBot = new MockBot();

  test('falls back to the bot prefix when no custom prefix is set', () => {
    const channel = new Channel('mockChannel', mockBot);

    expect(channel.prefix).toEqual(mockBot.prefix);
  });

  test('ignores a persisted custom prefix, always using the bot prefix', () => {
    // Simulates a channel that persisted a custom prefix before the /prefix command was
    // removed from both bots - there's no longer any way to discover, change, or reset
    // it, so it should no longer take effect.
    const channel = new Channel('mockChannel', mockBot, [], 'customPrefix');

    expect(channel.prefix).toEqual(mockBot.prefix);
    expect(channel.prefix).not.toEqual('customPrefix');
  });
});
