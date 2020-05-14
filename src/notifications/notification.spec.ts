import Notification from './notification';
import Game from '../game';
import NotificationElement from './notification_element';

jest.mock('request-promise-native');

describe('Notification', () => {
  test('should create a notification with a predefined timestamp', () => {
    const now = new Date();
    const notif = new Notification(now);
    expect(notif.timestamp).toEqual(now);
  });

  test('should create a notification without a provided timestamp', () => {
    const spy = jest.spyOn(global, 'Date');
    const notif = new Notification();
    const date = spy.mock.instances[0]; // get what 'new Date()' returned
    expect(notif.timestamp).toEqual(date);
  });

  test('should have empty default metadata', () => {
    const notif = new Notification();
    expect(notif.timestamp).not.toBeUndefined();
    expect(notif.content).toBeUndefined();
    expect(notif.game).toBeUndefined();
    expect(notif.title).toBeUndefined();
    expect(notif.image).toBeUndefined();
    expect(notif.author).toBeUndefined();
    expect(notif.color).toBeUndefined();
    expect(notif.footer).toBeUndefined();
    expect(notif.thumbnail).toBeUndefined();
  });

  test('should add metadata', () => {
    const notif = new Notification();
    const testGame = new Game(
      'testGame',
      ['test', 'testGame', 'TG'],
      'TestGame',
      '#000000',
      'https://i.imgur.com/aRVbvDh.png',
      [],
      [],
    );
    const testAuthor = new NotificationElement('testAuthor');
    const testTitle = new NotificationElement('testTitle');
    const testFooter = new NotificationElement('testFooter');
    const testTimestamp = new Date();
    notif
      .withContent('testContent')
      .withTitle(testTitle.text)
      .withImage('testImage')
      .withAuthor('testAuthor')
      .withGameDefaults(testGame)
      .withFooter('testFooter')
      .withColor('#AAAAAA')
      .withTimestamp(testTimestamp)
      .withThumbnail('testThumbnail');

    expect(notif.content).toBe('testContent');
    expect(notif.game).toEqual(testGame);
    expect(notif.title).toEqual(testTitle);
    expect(notif.image).toEqual('testImage');
    expect(notif.author).toEqual(testAuthor);
    expect(notif.color).toBe('#AAAAAA');
    expect(notif.footer).toEqual(testFooter);
    expect(notif.timestamp).toEqual(testTimestamp);
    expect(notif.thumbnail).toEqual('testThumbnail');
  });

  test('should test game defaults', () => {
    const notif = new Notification();
    const testGame = new Game(
      'testGame',
      ['test', 'testGame', 'TG'],
      'TestGame',
      '#000000',
      'https://i.imgur.com/aRVbvDh.png',
      [],
      [],
    );
    const expectedFooter = new NotificationElement(
      `New ${testGame.label} update!`,
      undefined,
      testGame.icon,
    );
    notif.withGameDefaults(testGame);
    expect(notif.game).toEqual(testGame);
    expect(notif.color).toBe('#000000');
    expect(notif.footer).toEqual(expectedFooter);
  });
});
