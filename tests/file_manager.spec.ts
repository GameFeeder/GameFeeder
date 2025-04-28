import FileManager from 'src/managers/file_manager.js';

describe('File manager', () => {
  describe('get file path', () => {
    test('with separator', () => {
      const filePath = FileManager.getFilePath('directory/', 'fileName.txt');
      const expected = 'directory/fileName.txt';

      expect(filePath).toEqual(expected);
    });
  });
});
