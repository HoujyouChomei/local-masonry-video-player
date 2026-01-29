// src/widgets/sidebar/ui/sidebar.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';

vi.mock('electron-trpc/renderer', () => ({
  ipcLink: () => () => ({}),
}));

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

const mockFetchPlaylists = vi.fn();
const mockFetchTagsByFolder = vi.fn();
const mockFetchTagsActive = vi.fn();

vi.mock('@/shared/api', () => ({
  api: {
    playlists: {
      getAll: () => mockFetchPlaylists(),
    },
    tags: {
      getByFolder: (folderPath: string) => mockFetchTagsByFolder(folderPath),
      getActive: () => mockFetchTagsActive(),
    },
    system: {
      getSubdirectories: vi.fn().mockResolvedValue([]),
      selectFolder: vi.fn(),
    },
  },
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const renderWithProviders = (ui: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
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
      showFavoritesOnly: false,
      isMobileMenuOpen: false,
      isTagGlobalScope: false,
      isFavoriteGlobalScope: false,
      isMobile: false,
    });

    resizeWindow(1024);

    mockFetchPlaylists.mockResolvedValue([
      { id: 'pl-1', name: 'My Playlist', mediaPaths: [], createdAt: 0, updatedAt: 0 },
      { id: 'pl-2', name: 'Favorites Mix', mediaPaths: [], createdAt: 0, updatedAt: 0 },
    ]);

    mockFetchTagsByFolder.mockResolvedValue([
      { id: 'tag-1', name: 'Anime', count: 10 },
      { id: 'tag-2', name: 'Movie', count: 5 },
    ]);

    mockFetchTagsActive.mockResolvedValue([
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

  it('toggles favorites filter', () => {
    renderWithProviders(<Sidebar />);

    const favButton = screen.getByRole('button', { name: /favorites/i });
    fireEvent.click(favButton);

    expect(useUIStore.getState().showFavoritesOnly).toBe(true);
    expect(useUIStore.getState().viewMode).toBe('folder');

    fireEvent.click(favButton);
    expect(useUIStore.getState().showFavoritesOnly).toBe(false);
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
      expect(mockFetchTagsByFolder).toHaveBeenCalledWith('/video/folder/1');
      expect(screen.getByText('Anime')).toBeTruthy();
      expect(screen.getByText('Movie')).toBeTruthy();
    });

    const toggleButtons = screen.getAllByTitle(/Scope: Current Folder/i);
    const tagScopeButton = toggleButtons[1];

    fireEvent.click(tagScopeButton);

    expect(useUIStore.getState().isTagGlobalScope).toBe(true);

    await waitFor(() => {
      expect(mockFetchTagsActive).toHaveBeenCalled();
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

    useUIStore.setState({
      isMobile: true,
      isMobileMenuOpen: true,
    });

    renderWithProviders(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('Navigation Menu')).toBeTruthy();
    });
  });
});