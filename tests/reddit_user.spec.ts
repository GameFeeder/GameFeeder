import RedditUserProvider from 'src/reddit/reddit_user';

describe('RedditUserProvider', () => {
  test('should create a user without a filter', () => {
    const testUser = new RedditUserProvider('testName');
    expect(testUser).toBeDefined();
    expect(testUser.titleFilter).toEqual(/.*/);
  });

  test('should crate a user with a string filter', () => {
    const stringFilter = `/r/test`;
    const testUser = new RedditUserProvider('testName', stringFilter);
    expect(testUser).toBeDefined();
    expect(testUser.titleFilter).toEqual(new RegExp(stringFilter));
  });

  test('should crate a user with a regex filter', () => {
    const regexFilter = new RegExp(`/r/test`);
    const testUser = new RedditUserProvider('testName', regexFilter);
    expect(testUser).toBeDefined();
    expect(testUser.titleFilter).toEqual(regexFilter);
  });
});
