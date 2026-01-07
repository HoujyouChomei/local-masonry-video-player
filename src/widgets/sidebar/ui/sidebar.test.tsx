// src/widgets/sidebar/ui/sidebar.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './sidebar';
import { Providers } from '@/app/providers';
import * as electronApi from '@/shared/api/electron';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';

// --- Mocks ---

// 1. matchMedia Mock (for useIsMobile & Radix UI)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 2. Electron API Mock
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

// 3. ResizeObserver Mock (for ScrollArea)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// --- Test Utilities ---

const renderWithProviders = (ui: React.ReactNode) => {
  return render(<Providers>{ui}</Providers>);
};

// Helper to simulate window resize
const resizeWindow = (width: number) => {
  window.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
};

describe('Sidebar Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Stores
    useSettingsStore.setState({
      isSidebarOpen: true,
      libraryFolders: ['/video/folder/1', '/video/folder/2'],
      folderPath: '/video/folder/1',
    });
    useUIStore.setState({
      viewMode: 'folder',
      isMobileMenuOpen: false,
      isTagGlobalScope: false, // Folder scope by default
    });

    // Reset Window Size to Desktop
    resizeWindow(1024);

    // Mock Data Defaults
    (electronApi.fetchPlaylists as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'pl-1', name: 'My Playlist', videoPaths: [], createdAt: 0, updatedAt: 0 },
      { id: 'pl-2', name: 'Favorites Mix', videoPaths: [], createdAt: 0, updatedAt: 0 },
    ]);

    (electronApi.fetchTagsByFolderApi as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'tag-1', name: 'Anime', count: 10 },
      { id: 'tag-2', name: 'Movie', count: 5 },
    ]);

    (electronApi.fetchTagsActiveApi as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'tag-1', name: 'Anime', count: 20 }, // Global count might be different
      { id: 'tag-3', name: 'Drama', count: 8 },
    ]);
  });

  it('renders sidebar correctly on desktop', async () => {
    renderWithProviders(<Sidebar />);

    // Sidebar container should be visible (<aside>)
    // Using role 'complementary' which corresponds to <aside>
    const aside = screen.queryByRole('complementary');
    expect(aside).not.toBeNull();

    // Sections Header Check
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

    expect(screen.getByText('1')).toBeTruthy(); // basename of /video/folder/1
    expect(screen.getByText('2')).toBeTruthy(); // basename of /video/folder/2
  });

  it('displays tags and handles scope toggle', async () => {
    renderWithProviders(<Sidebar />);

    // 1. Initial State (Folder Scope)
    await waitFor(() => {
      expect(electronApi.fetchTagsByFolderApi).toHaveBeenCalledWith('/video/folder/1');
      expect(screen.getByText('Anime')).toBeTruthy();
      expect(screen.getByText('Movie')).toBeTruthy();
    });

    // 2. Toggle to Global Scope
    const toggleButton = screen.getByTitle(/Scope: Current Folder/i);
    fireEvent.click(toggleButton);

    expect(useUIStore.getState().isTagGlobalScope).toBe(true);

    // 3. Check Global Tags
    await waitFor(() => {
      expect(electronApi.fetchTagsActiveApi).toHaveBeenCalled();
      expect(screen.getByText('Drama')).toBeTruthy(); // Only in global mock
    });
  });

  it('hides sidebar when isSidebarOpen is false', () => {
    useSettingsStore.setState({ isSidebarOpen: false });
    renderWithProviders(<Sidebar />);

    // <aside> (role="complementary") should NOT be in the document
    const aside = screen.queryByRole('complementary');
    expect(aside).toBeNull();
  });

  it('switches to mobile drawer when screen is small', async () => {
    // 1. Resize window to mobile width
    resizeWindow(375);

    // 2. Mock matchMedia to return true for mobile query
    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query) => ({
      matches: true, // Mobile
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // 3. Open Mobile Menu via Store
    useUIStore.setState({ isMobileMenuOpen: true });

    renderWithProviders(<Sidebar />);

    // 4. In mobile mode, Sidebar renders a Sheet (Radix UI Dialog)
    // Dialog content renders asynchronously, so use waitFor
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('Navigation Menu')).toBeTruthy();
    });
  });
});
