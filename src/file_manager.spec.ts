import FileManager from './file_manager';

describe('File manager', () => {
  describe('get file path', () => {
    test('with seperator', () => {
      const filePath = FileManager.getFilePath('directory/', 'fileName.txt');
      const expected = 'directory/fileName.txt';

      expect(filePath).toEqual(expected);
    });
  });
});
