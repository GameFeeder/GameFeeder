import Permissions from 'src/permissions.js';

describe('Permissions', () => {
  test('should have channel access', () => {
    const testPermissions = new Permissions(true, false, false, false);
    expect(testPermissions.hasChannelAccess).toBeTruthy();
  });

  test('shouldnt have channel access', () => {
    const testPermissions = new Permissions(false, false, false, false);
    expect(testPermissions.hasChannelAccess).toBeFalsy();
  });

  test('should have write access', () => {
    const testPermissions = new Permissions(false, true, false, false);
    expect(testPermissions.canWrite).toBeTruthy();
  });

  test('shouldnt have write access', () => {
    const testPermissions = new Permissions(false, false, false, false);
    expect(testPermissions.canWrite).toBeFalsy();
  });

  test('should have edit access', () => {
    const testPermissions = new Permissions(false, false, true, false);
    expect(testPermissions.canEdit).toBeTruthy();
  });

  test('shouldnt have edit access', () => {
    const testPermissions = new Permissions(false, false, false, false);
    expect(testPermissions.canEdit).toBeFalsy();
  });

  test('should have pin access', () => {
    const testPermissions = new Permissions(false, false, false, true);
    expect(testPermissions.canPin).toBeTruthy();
  });

  test('shouldnt have pin access', () => {
    const testPermissions = new Permissions(false, false, false, false);
    expect(testPermissions.canPin).toBeFalsy();
  });
});
