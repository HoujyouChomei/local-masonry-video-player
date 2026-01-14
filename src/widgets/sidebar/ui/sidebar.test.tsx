// src/widgets/sidebar/ui/sidebar.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './sidebar';
import { Providers } from '@/app/providers';
import * as electronApi from '@/shared/api/electron';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('@/shared/api/electron', async (importOriginal) => {
  const actual = await importOriginal<typeof electronApi>();
  return {
    ...actual,
    fetchPlaylists: vi.fn(),
    createPlaylistApi: vi.fn(),
    fetchTagsActiveApi: vi.fn(),
    fetchTagsByFolderApi: vi.fn(),
    fetchSubdirectories: vi.fn(),
    selectFolder: vi.fn(),
  };
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const renderWithProviders = (ui: React.ReactNode) => {
  return render(<Providers>{ui}</Providers>);
};

const resizeWindow = (width: number) => {
  window.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
};

describe('Sidebar Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useSettingsStore.setState({
      isSidebarOpen: true,
      libraryFolders: ['/video/folder/1', '/video/folder/2'],
      folderPath: '/video/folder/1',
    });
    useUIStore.setState({
      viewMode: 'folder',
      isMobileMenuOpen: false,
      isTagGlobalScope: false,
    });

    resizeWindow(1024);

    (electronApi.fetchPlaylists as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'pl-1', name: 'My Playlist', videoPaths: [], createdAt: 0, updatedAt: 0 },
      { id: 'pl-2', name: 'Favorites Mix', videoPaths: [], createdAt: 0, updatedAt: 0 },
    ]);

    (electronApi.fetchTagsByFolderApi as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'tag-1', name: 'Anime', count: 10 },
      { id: 'tag-2', name: 'Movie', count: 5 },
    ]);

    (electronApi.fetchTagsActiveApi as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'tag-1', name: 'Anime', count: 20 },
      { id: 'tag-3', name: 'Drama', count: 8 },
    ]);
  });

  it('renders sidebar correctly on desktop', async () => {
    renderWithProviders(<Sidebar />);

    const aside = screen.queryByRole('complementary');
    expect(aside).not.toBeNull();

    expect(screen.getByText('VIEWS')).toBeTruthy();
    expect(screen.getByText('PLAYLISTS')).toBeTruthy();
    expect(screen.getByText('LIBRARY')).toBeTruthy();
    expect(screen.getByText('TAGS')).toBeTruthy();
  });

  it('toggles "All Favorites" view mode', () => {
    renderWithProviders(<Sidebar />);

    const favButton = screen.getByText('All Favorites');
    fireEvent.click(favButton);

    expect(useUIStore.getState().viewMode).toBe('all-favorites');

    fireEvent.click(favButton);
    expect(useUIStore.getState().viewMode).toBe('folder');
  });

  it('displays playlists fetched from API', async () => {
    renderWithProviders(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByText('My Playlist')).toBeTruthy();
      expect(screen.getByText('Favorites Mix')).toBeTruthy();
    });
  });

  it('displays library folders from settings', () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('displays tags and handles scope toggle', async () => {
    renderWithProviders(<Sidebar />);

    await waitFor(() => {
      expect(electronApi.fetchTagsByFolderApi).toHaveBeenCalledWith('/video/folder/1');
      expect(screen.getByText('Anime')).toBeTruthy();
      expect(screen.getByText('Movie')).toBeTruthy();
    });

    const toggleButton = screen.getByTitle(/Scope: Current Folder/i);
    fireEvent.click(toggleButton);

    expect(useUIStore.getState().isTagGlobalScope).toBe(true);

    await waitFor(() => {
      expect(electronApi.fetchTagsActiveApi).toHaveBeenCalled();
      expect(screen.getByText('Drama')).toBeTruthy();
    });
  });

  it('hides sidebar when isSidebarOpen is false', () => {
    useSettingsStore.setState({ isSidebarOpen: false });
    renderWithProviders(<Sidebar />);

    const aside = screen.queryByRole('complementary');
    expect(aside).toBeNull();
  });

  it('switches to mobile drawer when screen is small', async () => {
    resizeWindow(375);

    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    useUIStore.setState({ isMobileMenuOpen: true });

    renderWithProviders(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('Navigation Menu')).toBeTruthy();
    });
  });
});
