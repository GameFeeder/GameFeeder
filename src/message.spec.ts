import Message from './message';
import User from './user';
import MockBot from './__mocks__/mockBot';
import Channel from './channel';

describe('Message', () => {
  let testMessage: Message;
  const mockBot = new MockBot();
  const mockUser = new User(mockBot, 'testUser');
  const mockChannel = new Channel('testChannel', mockBot);
  const testContent = 'testContent';
  const now = new Date();

  beforeAll(() => {
    testMessage = new Message(mockUser, mockChannel, testContent, now);
  });

  test('should check that the message is not empty', () => {
    expect(testMessage.isEmpty()).toBeFalsy();
    const emptyMessage = new Message(mockUser, mockChannel, '', now);
    expect(emptyMessage.isEmpty()).toBeTruthy();
  });

  test('should get the bot that the message belongs to', () => {
    expect(testMessage.getBot()).toEqual(mockBot);
  });
});
