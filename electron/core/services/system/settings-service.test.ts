// electron/core/services/system/settings-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from './settings-service';

const storeMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  store: {},
}));

vi.mock('../../../lib/store', () => ({
  store: storeMocks,
}));

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

const eventBusMocks = vi.hoisted(() => ({
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}));

vi.mock('../../events', () => ({
  eventBus: eventBusMocks,
}));

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    vi.clearAllMocks();
    (SettingsService as unknown as { instance: SettingsService | undefined }).instance = undefined;
    service = SettingsService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SettingsService.getInstance();
      const instance2 = SettingsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getSettings', () => {
    it('should return store.store', () => {
      const mockSettings = { libraryFolders: ['/videos'] };
      storeMocks.store = mockSettings;

      const result = service.getSettings();

      expect(result).toBe(mockSettings);
    });
  });

  describe('updateSetting', () => {
    it('should update setting in store', async () => {
      const result = await service.updateSetting('enableHardwareDecoding', true);

      expect(storeMocks.set).toHaveBeenCalledWith('enableHardwareDecoding', true);
      expect(result).toBe(true);
    });

    it('should emit settings:mobile-connection-changed when enableMobileConnection is turned ON', async () => {
      storeMocks.get.mockReturnValue(false);

      await service.updateSetting('enableMobileConnection', true);

      expect(eventBusMocks.emit).toHaveBeenCalledWith('settings:mobile-connection-changed', {
        host: '0.0.0.0',
      });
    });

    it('should emit settings:mobile-connection-changed when enableMobileConnection is turned OFF', async () => {
      storeMocks.get.mockReturnValue(true);

      await service.updateSetting('enableMobileConnection', false);

      expect(eventBusMocks.emit).toHaveBeenCalledWith('settings:mobile-connection-changed', {
        host: '127.0.0.1',
      });
    });

    it('should emit settings:library-folders-added when new library folders are added', async () => {
      storeMocks.get.mockReturnValue(['/old']);

      await service.updateSetting('libraryFolders', ['/old', '/new']);

      expect(eventBusMocks.emit).toHaveBeenCalledWith('settings:library-folders-added', {
        folders: ['/new'],
      });
    });

    it('should not emit settings:library-folders-added when no new folders are added', async () => {
      storeMocks.get.mockReturnValue(['/existing']);

      await service.updateSetting('libraryFolders', ['/existing']);

      const libraryAddCalls = eventBusMocks.emit.mock.calls.filter(
        (call) => call[0] === 'settings:library-folders-added'
      );
      expect(libraryAddCalls.length).toBe(0);
    });
  });

  describe('resetAccessToken', () => {
    it('should generate new UUID and store it', () => {
      const result = service.resetAccessToken();

      expect(storeMocks.set).toHaveBeenCalledWith('authAccessToken', expect.any(String));
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });
});
