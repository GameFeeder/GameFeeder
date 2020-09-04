import Game from '../src/game';

jest.mock('request-promise-native');

describe('Game', () => {
  let testGame: Game;

  beforeAll(() => {
    testGame = new Game(
      'testGameName',
      ['test', 'testGame', 'TG'],
      'TestGameLabel',
      '#000000',
      'https://i.imgur.com/aRVbvDh.png',
      {},
      [],
    );
    jest.spyOn(Game, 'getGames').mockReturnValue([testGame]);
  });

  test('should have alias', () => {
    expect(testGame.name).toEqual('testGameName');
    expect(testGame.hasAlias('test')).toBeTruthy();
    expect(testGame.hasAlias('testGame')).toBeTruthy();
    expect(testGame.hasAlias('TG')).toBeTruthy();
    expect(testGame.hasAlias('all')).toBeTruthy();
    expect(testGame.hasAlias('testGameName')).toBeTruthy();
    expect(testGame.hasAlias('TestGameLabel')).toBeTruthy();
    expect(testGame.hasAlias('wrongAlias')).toBeFalsy();
  });

  test('should get a list of available games aliases', () => {
    expect(Game.getAliases()).toEqual(['all', 'test', 'testGame', 'TG']);
  });

  test('should get game by its name', () => {
    expect(Game.getGameByName('testGameName')).toEqual(testGame);
  });

  test('should get a game by its alias', () => {
    expect(Game.getGamesByAlias('test')).toEqual([testGame]);
    expect(Game.getGamesByAlias('testGame')).toEqual([testGame]);
    expect(Game.getGamesByAlias('TG')).toEqual([testGame]);
  });
});
