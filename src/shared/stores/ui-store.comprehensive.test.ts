// src/shared/stores/ui-store.comprehensive.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './ui-store';
import { useSelectionStore } from './selection-store';
import { VideoFile } from '@/shared/types/video';

// Mock helpers for range selection testing
const createMockVideos = (count: number): VideoFile[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `v-${i}`,
    name: `Video ${i}`,
    path: `/path/v-${i}.mp4`,
    src: '',
    thumbnailSrc: '',
    size: 100,
    createdAt: 0,
    updatedAt: 0,
  }));
};

describe('Store Refactoring Integration Test (Comprehensive)', () => {
  const uiInitialState = useUIStore.getState();
  const selectionInitialState = useSelectionStore.getState();

  beforeEach(() => {
    useUIStore.setState(uiInitialState, true);
    useSelectionStore.setState(selectionInitialState, true);
  });

  describe('1. View Context & Navigation (UI Store)', () => {
    it('should set view mode and reset unrelated context', () => {
      // Setup messy state across stores
      useUIStore.setState({
        selectedPlaylistId: 'pl-1',
        selectedTagIds: ['tag-1'],
      });
      useSelectionStore.setState({
        isSelectionMode: true,
        selectedVideoIds: ['v-1'],
      });

      // Action: Switch to Folder View
      useUIStore.getState().setViewMode('folder');

      const uiState = useUIStore.getState();
      const selectionState = useSelectionStore.getState();

      expect(uiState.viewMode).toBe('folder');
      expect(uiState.selectedPlaylistId).toBeNull();

      // Selection should be cleared by UI Store action logic
      expect(selectionState.isSelectionMode).toBe(false);
      expect(selectionState.selectedVideoIds).toEqual([]);
    });

    it('should select playlist and enter playlist mode', () => {
      useUIStore.getState().selectPlaylist('pl-123');

      const uiState = useUIStore.getState();
      const selectionState = useSelectionStore.getState();

      expect(uiState.viewMode).toBe('playlist');
      expect(uiState.selectedPlaylistId).toBe('pl-123');
      expect(uiState.selectedTagIds).toEqual([]);

      // Selection should be cleared
      expect(selectionState.selectedVideoIds).toEqual([]);
    });

    it('should toggle tag selection and switch modes', () => {
      // 1. Select first tag
      useUIStore.getState().toggleSelectTag('tag-a');
      let uiState = useUIStore.getState();
      expect(uiState.viewMode).toBe('tag-results');
      expect(uiState.selectedTagIds).toEqual(['tag-a']);

      // 2. Select second tag (Multi-tag)
      useUIStore.getState().toggleSelectTag('tag-b');
      uiState = useUIStore.getState();
      expect(uiState.selectedTagIds).toContain('tag-a');
      expect(uiState.selectedTagIds).toContain('tag-b');

      // 3. Unselect tag-a
      useUIStore.getState().toggleSelectTag('tag-a');
      uiState = useUIStore.getState();
      expect(uiState.selectedTagIds).toEqual(['tag-b']);

      // 4. Unselect tag-b (All cleared -> return to folder)
      useUIStore.getState().toggleSelectTag('tag-b');
      uiState = useUIStore.getState();
      expect(uiState.selectedTagIds).toEqual([]);
      expect(uiState.viewMode).toBe('folder');
    });
  });

  describe('2. Selection Logic (Selection Store)', () => {
    it('should enter and exit selection mode', () => {
      const { enterSelectionMode, exitSelectionMode } = useSelectionStore.getState();

      enterSelectionMode('v-1');
      let state = useSelectionStore.getState();
      expect(state.isSelectionMode).toBe(true);
      expect(state.selectedVideoIds).toEqual(['v-1']);
      expect(state.lastSelectedVideoId).toBe('v-1');

      exitSelectionMode();
      state = useSelectionStore.getState();
      expect(state.isSelectionMode).toBe(false);
      expect(state.selectedVideoIds).toEqual([]);
      expect(state.lastSelectedVideoId).toBeNull();
    });

    it('should toggle individual items', () => {
      const { toggleSelection } = useSelectionStore.getState();

      // Select v-1
      toggleSelection('v-1');
      expect(useSelectionStore.getState().selectedVideoIds).toEqual(['v-1']);
      expect(useSelectionStore.getState().lastSelectedVideoId).toBe('v-1');

      // Select v-2
      toggleSelection('v-2');
      expect(useSelectionStore.getState().selectedVideoIds).toEqual(['v-1', 'v-2']);
      expect(useSelectionStore.getState().lastSelectedVideoId).toBe('v-2');

      // Unselect v-1
      toggleSelection('v-1');
      expect(useSelectionStore.getState().selectedVideoIds).toEqual(['v-2']);
      expect(useSelectionStore.getState().lastSelectedVideoId).toBe('v-1'); // Last touched updates
    });

    it('should handle Select All', () => {
      const allIds = ['v-1', 'v-2', 'v-3'];
      useSelectionStore.getState().selectAll(allIds);

      const state = useSelectionStore.getState();
      expect(state.selectedVideoIds).toEqual(allIds);
      expect(state.lastSelectedVideoId).toBe('v-3');
    });

    it('should clear selection but KEEP selection mode', () => {
      useSelectionStore.setState({ isSelectionMode: true, selectedVideoIds: ['v-1'] });

      useSelectionStore.getState().clearSelection();

      const state = useSelectionStore.getState();
      expect(state.selectedVideoIds).toEqual([]);
      expect(state.isSelectionMode).toBe(true); // Mode stays active
    });

    describe('Range Selection (Shift+Click)', () => {
      const mockVideos = createMockVideos(10); // v-0 to v-9

      it('should select range from lastSelected to target', () => {
        const { toggleSelection, selectRange } = useSelectionStore.getState();

        // 1. Click v-2 (Start)
        toggleSelection('v-2');

        // 2. Shift+Click v-5 (End)
        selectRange('v-5', mockVideos);

        const state = useSelectionStore.getState();
        // Expect v-2, v-3, v-4, v-5
        expect(state.selectedVideoIds).toHaveLength(4);
        expect(state.selectedVideoIds).toEqual(
          expect.arrayContaining(['v-2', 'v-3', 'v-4', 'v-5'])
        );
        expect(state.lastSelectedVideoId).toBe('v-5'); // Anchor moves to end
      });

      it('should select range backwards', () => {
        const { toggleSelection, selectRange } = useSelectionStore.getState();

        // 1. Click v-5 (Start)
        toggleSelection('v-5');

        // 2. Shift+Click v-2 (End)
        selectRange('v-2', mockVideos);

        const state = useSelectionStore.getState();
        expect(state.selectedVideoIds).toEqual(
          expect.arrayContaining(['v-2', 'v-3', 'v-4', 'v-5'])
        );
      });

      it('should merge range with existing selection', () => {
        const { toggleSelection, selectRange } = useSelectionStore.getState();

        // 1. Pre-select v-0
        toggleSelection('v-0');

        // 2. Click v-3 (Start of range)
        toggleSelection('v-3');

        // 3. Shift+Click v-5 (End of range)
        selectRange('v-5', mockVideos);

        const state = useSelectionStore.getState();
        // Expect v-0 (kept) AND v-3, v-4, v-5 (range)
        expect(state.selectedVideoIds).toEqual(
          expect.arrayContaining(['v-0', 'v-3', 'v-4', 'v-5'])
        );
      });

      it('should default to single select if no lastSelected exists', () => {
        const { selectRange } = useSelectionStore.getState();

        // Direct Shift+Click without prior selection
        selectRange('v-5', mockVideos);

        const state = useSelectionStore.getState();
        expect(state.selectedVideoIds).toEqual(['v-5']);
        expect(state.lastSelectedVideoId).toBe('v-5');
      });
    });
  });
});
