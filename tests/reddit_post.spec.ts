import RedditPost from 'src/reddit/reddit_post';

describe('Name of the group', () => {
  const now = new Date();
  const testPost = new RedditPost(
    'testTitle',
    'test.url.com',
    'test content',
    'testsub',
    'testUser',
    now,
  );

  test('should check if its a new source', () => {
    expect(testPost.isNewSource(['test.url.com'])).toBeFalsy();
    expect(testPost.isNewSource(['test2.url.com'])).toBeTruthy();
  });

  test('should test title validity', () => {
    expect(testPost.hasValidTitle(/test/)).toBeTruthy();
    expect(testPost.hasValidTitle(/test2/)).toBeFalsy();
  });

  test('should check if its the correct sub', () => {
    expect(testPost.isCorrectSub('testsub')).toBeTruthy();
    expect(testPost.isCorrectSub('testsub2')).toBeFalsy();
  });

  test('should check if its new', () => {
    const after = new Date();
    expect(testPost.isNew(after)).toBeFalsy();
    const testPostAfter = new RedditPost(
      'testTitle',
      'test.url.com',
      'test content',
      'testsub',
      'testUser',
      after,
    );
    expect(testPostAfter.isNew(now)).toBeTruthy();
  });

  test('should check if the post is deleted', () => {
    expect(testPost.isDeleted()).toBeFalsy();
    const notDeletedPost = new RedditPost(
      'testTitle',
      'test.url.com',
      'test [removed] test',
      'testsub',
      'testUser',
      now,
    );
    expect(notDeletedPost.isDeleted()).toBeFalsy();
    const deletedPost = new RedditPost(
      'testTitle',
      'test.url.com',
      '[removed]',
      'testsub',
      'testUser',
      now,
    );
    expect(deletedPost.isDeleted()).toBeTruthy();
  });

  test('should test that a post is valid', () => {
    const after = new Date();
    const testPostAfter = new RedditPost(
      'testTitle',
      'test.url.com',
      'test content',
      'testsub',
      'testUser',
      after,
    );
    expect(testPostAfter.isValid(now, /test/, ['test2.url.com'])).toBeTruthy();
    expect(testPostAfter.isValid(after, /test/, ['test2.url.com'])).toBeFalsy();
    expect(testPostAfter.isValid(now, /test/, ['test.url.com'])).toBeFalsy();
    expect(testPostAfter.isValid(now, /test2/, ['test2.url.com'])).toBeFalsy();
  });
});
