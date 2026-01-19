// src/shared/stores/settings-store.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettingsStore } from './settings-store';
import * as electronApi from '@/shared/api/electron';
import { AppSettings } from '@/shared/types/electron';

vi.mock('@/shared/api/electron', () => ({
  fetchSettings: vi.fn(),
  saveSetting: vi.fn(),
}));

describe('Settings Store (Persistent Only)', () => {
  const initialState = useSettingsStore.getState();

  beforeEach(() => {
    useSettingsStore.setState(initialState, true);
    vi.clearAllMocks();
  });

  it('should initialize settings from API', async () => {
    const mockSettings: Partial<AppSettings> = {
      folderPath: '/mock/path',
      columnCount: 5,
      sortOption: 'random',
      rootMargin: 2000,
    };
    vi.mocked(electronApi.fetchSettings).mockResolvedValue(mockSettings as unknown as AppSettings);

    await useSettingsStore.getState().initialize();

    const state = useSettingsStore.getState();
    expect(state.isInitialized).toBe(true);
    expect(state.folderPath).toBe('/mock/path');
    expect(state.columnCount).toBe(5);
    expect(state.sortOption).toBe('random');
    expect(state.rootMargin).toBe(2000);
  });

  it('should update folderPath and save', async () => {
    await useSettingsStore.getState().setFolderPath('/new/path');
    expect(useSettingsStore.getState().folderPath).toBe('/new/path');
    expect(electronApi.saveSetting).toHaveBeenCalledWith('folderPath', '/new/path');
  });

  it('should update columnCount and save', async () => {
    await useSettingsStore.getState().setColumnCount(3);
    expect(useSettingsStore.getState().columnCount).toBe(3);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('columnCount', 3);
  });

  it('should update sortOption and save', async () => {
    await useSettingsStore.getState().setSortOption('name-asc');
    expect(useSettingsStore.getState().sortOption).toBe('name-asc');
    expect(electronApi.saveSetting).toHaveBeenCalledWith('sortOption', 'name-asc');
  });

  it('should manage libraryFolders (add/remove) and save', async () => {
    await useSettingsStore.getState().addLibraryFolder('/lib/1');
    expect(useSettingsStore.getState().libraryFolders).toEqual(['/lib/1']);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('libraryFolders', ['/lib/1']);

    await useSettingsStore.getState().removeLibraryFolder('/lib/1');
    expect(useSettingsStore.getState().libraryFolders).toEqual([]);
    expect(electronApi.saveSetting).toHaveBeenLastCalledWith('libraryFolders', []);
  });

  it('should toggle and set isSidebarOpen and save', async () => {
    await useSettingsStore.getState().toggleSidebar();
    expect(useSettingsStore.getState().isSidebarOpen).toBe(false);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('isSidebarOpen', false);

    await useSettingsStore.getState().setSidebarOpen(true);
    expect(useSettingsStore.getState().isSidebarOpen).toBe(true);
    expect(electronApi.saveSetting).toHaveBeenLastCalledWith('isSidebarOpen', true);
  });

  it('should toggle expandedPaths and save', async () => {
    await useSettingsStore.getState().toggleExpandedPath('/path/1');
    expect(useSettingsStore.getState().expandedPaths).toContain('/path/1');
    expect(electronApi.saveSetting).toHaveBeenCalledWith('expandedPaths', ['/path/1']);
  });

  it('should update rootMargin and save', async () => {
    await useSettingsStore.getState().setRenderDistance(3000);
    expect(useSettingsStore.getState().rootMargin).toBe(3000);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('rootMargin', 3000);
  });

  it('should update debounceTime and save', async () => {
    await useSettingsStore.getState().setDebounceTime(500);
    expect(useSettingsStore.getState().debounceTime).toBe(500);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('debounceTime', 500);
  });

  it('should update chunkSize and save', async () => {
    await useSettingsStore.getState().setChunkSize(50);
    expect(useSettingsStore.getState().chunkSize).toBe(50);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('chunkSize', 50);
  });

  it('should toggle autoPlayNext and save', async () => {
    const initial = useSettingsStore.getState().autoPlayNext;
    await useSettingsStore.getState().toggleAutoPlayNext();
    expect(useSettingsStore.getState().autoPlayNext).toBe(!initial);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('autoPlayNext', !initial);
  });

  it('should toggle enableHardwareDecoding and save', async () => {
    const initial = useSettingsStore.getState().enableHardwareDecoding;
    await useSettingsStore.getState().toggleHardwareDecoding();
    expect(useSettingsStore.getState().enableHardwareDecoding).toBe(!initial);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('enableHardwareDecoding', !initial);
  });

  it('should toggle playOnHoverOnly and save', async () => {
    const initial = useSettingsStore.getState().playOnHoverOnly;
    await useSettingsStore.getState().togglePlayOnHoverOnly();
    expect(useSettingsStore.getState().playOnHoverOnly).toBe(!initial);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('playOnHoverOnly', !initial);
  });

  it('should update volume/mute state and save both', async () => {
    await useSettingsStore.getState().setVolumeState(0.8, true);
    expect(useSettingsStore.getState().volume).toBe(0.8);
    expect(useSettingsStore.getState().isMuted).toBe(true);

    expect(electronApi.saveSetting).toHaveBeenCalledWith('volume', 0.8);
    expect(electronApi.saveSetting).toHaveBeenCalledWith('isMuted', true);
  });

  it('should update layoutMode and save', async () => {
    await useSettingsStore.getState().setLayoutMode('list');
    expect(useSettingsStore.getState().layoutMode).toBe('list');
    expect(electronApi.saveSetting).toHaveBeenCalledWith('layoutMode', 'list');
  });

  it('should update gridStyle and save', async () => {
    await useSettingsStore.getState().setGridStyle('tile');
    expect(useSettingsStore.getState().gridStyle).toBe('tile');
    expect(electronApi.saveSetting).toHaveBeenCalledWith('gridStyle', 'tile');
  });
});
