import TelegramIVTemplate from 'src/telegram_iv_template.js';

describe('Telegram IV template', () => {
  describe('constructor', () => {
    test('assigns domain', () => {
      const expected = 'http://www.dota.com';
      const template = new TelegramIVTemplate(expected, '');
      const actual = template.domain;

      expect(actual).toEqual(expected);
    });

    test('assigns template hash', () => {
      const expected = 'axw7asd7';
      const template = new TelegramIVTemplate('', expected);
      const actual = template.templateHash;

      expect(actual).toEqual(expected);
    });
  });

  describe('get IV template', () => {
    test('simple url', () => {
      const url = 'http://www.dota.com';
      const domain = 'dota.com';
      const templateHash = 'axw7asd7';
      const expected = 'https://t.me/iv?url=http://www.dota.com&rhash=axw7asd7';
      const template = new TelegramIVTemplate(domain, templateHash);
      const actual = template.getIVUrl(url);

      expect(actual).toEqual(expected);
    });
  });

  describe('test url', () => {
    test('matches', () => {
      const url = 'http://www.dota.com';
      const domain = 'dota.com';
      const templateHash = 'axw7asd7';
      const expected = 'https://t.me/iv?url=http://www.dota.com&rhash=axw7asd7';
      const template = new TelegramIVTemplate(domain, templateHash);
      const actual = template.testUrl(url);

      expect(actual).toEqual(expected);
    });

    test('does not match', () => {
      const url = 'http://www.tf2.com';
      const domain = 'dota.com';
      const templateHash = 'axw7asd7';
      const expected = '';
      const template = new TelegramIVTemplate(domain, templateHash);
      const actual = template.testUrl(url);

      expect(actual).toEqual(expected);
    });
  });

  describe('get link url', () => {
    test('matches', () => {
      const url = 'http://www.dota.com';
      const domain = 'dota.com';
      const templateHash = 'axw7asd7';
      const expected = 'https://t.me/iv?url=http://www.dota.com&rhash=axw7asd7';
      const template = new TelegramIVTemplate(domain, templateHash);
      const actual = template.getLinkUrl(url);

      expect(actual).toEqual(expected);
    });

    test('does not match', () => {
      const url = 'http://www.tf2.com';
      const domain = 'dota.com';
      const templateHash = 'axw7asd7';
      const expected = 'http://www.tf2.com';
      const template = new TelegramIVTemplate(domain, templateHash);
      const actual = template.getLinkUrl(url);

      expect(actual).toEqual(expected);
    });
  });
});
