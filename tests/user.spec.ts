import User, { UserRole } from '../src/user';
import Channel from '../src/channel';
import MockBot from './__mocks__/mockBot';

let testUser: User;
let testChannel: Channel;

// eslint-disable-next-line jest/no-focused-tests
describe('User', () => {
  beforeAll(() => {
    const mockBot = new MockBot();
    testUser = new User(mockBot, 'testUser');
    testChannel = new Channel('testChannel', mockBot);
  });

  test('should get the user role', async () => {
    expect(await testUser.getRole(testChannel)).toBe('User');
  });

  test('should check that the user has a specific role', async () => {
    expect(await testUser.hasRole(testChannel, UserRole.OWNER)).toBeFalsy();
    expect(await testUser.hasRole(testChannel, UserRole.ADMIN)).toBeFalsy();
    expect(await testUser.hasRole(testChannel, UserRole.USER)).toBeTruthy();
  });
});
