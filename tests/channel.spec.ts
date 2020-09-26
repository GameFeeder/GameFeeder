import mockFS from 'mock-fs';
import Channel from 'src/channel';
import Game from 'src/game';
import MockBot from './mockClasses/mockBot';

jest.mock('request-promise-native');

const mockBot = new MockBot();
const testGame = new Game(
  'testGameName',
  ['test', 'testGame', 'TG'],
  'TestGameLabel',
  '#000000',
  'https://i.imgur.com/aRVbvDh.png',
  {},
  [],
);
const testChannel = new Channel('1', mockBot, [testGame]);
const fakeSubData = `{
  "mockBot": [
    {
      "gameSubs": [
        "testGame"
      ],
      "id": "1"
    }
  ]
}
`;

describe('Channel', () => {
  beforeAll(() => {
    mockFS({
      data: {
        'subscriber_data.json': fakeSubData,
      },
    });
    expect(testChannel).toBeTruthy();
  });

  test('should set and get the channel label', () => {
    expect(testChannel.label).toBe(`M|1`);
    testChannel.label = 'newLabel';
    expect(testChannel.label).toBe(`'newLabel' (M|1)`);
  });

  test('should get the bot prefix when there is none', () => {
    expect(testChannel.prefix).toBe('mockPrefix');
  });

  test('should set and get the channel prefix', () => {
    testChannel.prefix = 'newPrefix';
    expect(testChannel.prefix).toBe('newPrefix');
  });

  test('should reset the channel prefix', () => {
    testChannel.prefix = 'reset';
    expect(testChannel.prefix).toBe('mockPrefix');
  });

  test('should set and get the disabled property', () => {
    testChannel.disabled = true;
    expect(testChannel.disabled).toBeTruthy();
    const unregisteredChannel = new Channel('-1', mockBot);
    unregisteredChannel.disabled = false;
    expect(testChannel.disabled).toBeTruthy();
  });

  test('should delete disabled false lines', () => {
    testChannel.disabled = false;
    expect(testChannel.disabled).toBeFalsy();
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

  test('should get a JSON version of the channel', () => {
    const channelJSON = JSON.parse(testChannel.toJSONString());
    expect(channelJSON).toHaveProperty('id');
    expect(channelJSON).toHaveProperty('label');
    expect(channelJSON).toHaveProperty('prefix');
    expect(channelJSON).toHaveProperty('gameSubs');
    const emptyChannel = new Channel('0', mockBot);
    const emptyChannelJSON = JSON.parse(emptyChannel.toJSONString());
    expect(emptyChannelJSON).toHaveProperty('id');
    expect(emptyChannelJSON).not.toHaveProperty('label');
    expect(emptyChannelJSON).not.toHaveProperty('prefix');
    expect(emptyChannelJSON).toHaveProperty('gameSubs');
  });

  test('should get the user count', async () => {
    // TODO: Maybe this needs to be set up somehow?
    expect(await testChannel.getUserCount()).toEqual(0);
  });

  test('should check if the channel has a label', () => {
    testChannel.label = 'anyLabel';
    expect(testChannel.hasLabel()).toBeTruthy();
    testChannel.label = '';
    expect(testChannel.hasLabel()).toBeFalsy();
  });

  const newChannelByLabel = new Channel('2', mockBot);
  test('should add a subscriber when setting the label', () => {
    newChannelByLabel.label = 'newChannel';
    expect(newChannelByLabel.label).toBe(`'newChannel' (M|2)`);
  });

  test('should remove subscriber with no games when removing the label', () => {
    const removeSpy = jest.spyOn(newChannelByLabel, 'removeChannel');
    newChannelByLabel.label = '';
    expect(removeSpy).toHaveBeenCalled();
  });

  const newChannelByPrefix = new Channel('3', mockBot);
  test('should add a subscriber when setting the prefix', () => {
    newChannelByPrefix.prefix = 'newPrefix';
    expect(newChannelByPrefix.prefix).toBe(`newPrefix`);
  });

  test('should remove subscriber with no games when removing the prefix', () => {
    const removeSpy = jest.spyOn(newChannelByPrefix, 'removeChannel');
    newChannelByPrefix.prefix = '';
    expect(removeSpy).toHaveBeenCalled();
  });

  afterAll(() => {
    mockFS.restore();
  });
});
