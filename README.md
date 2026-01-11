[ English | [日本語](README_jp.md) ]

# Local Masonry Video Player

![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A local video player optimized for browsing video assets and AI-generated videos.**

https://github.com/user-attachments/assets/8b670533-baa1-4f8d-9675-9951359a915e

## Features

*   **Masonry Grid Layout**: Displays videos in a tile layout without gaps while maintaining aspect ratios.
*   **Folder-Referenced Management**: Manages files by indexing existing folders without copying or moving files, saving disk space.
*   **File Watcher**: Detects file additions, deletions, and modifications in monitored folders and automatically updates the library.
*   **File Operations**: Supports renaming, moving folders, and deleting (moving to trash) local files directly from the app.
*   **Drag & Drop**: Supports dropping files to external tools (e.g., ComfyUI) and organizing files within the app.
*   **Mobile Connect**: **(Experimental)** Connect from a smartphone on the same network via QR code to stream videos from your PC.
*   **Organization**: Create playlists, add tags, and favorite your videos.
*   **Metadata Harvesting**: **(Requires FFmpeg)** Automatically extracts and displays AI generation prompts (JSON), FPS, Codec, and other technical information for search and filtering.

### [⬇️ Download Latest Version](https://github.com/HoujyouChomei/local-masonry-video-player/releases)

> **Note**: This application has been tested on Windows only.
>
> Since this is a personal open-source project and does not use a paid code signing certificate, a **SmartScreen warning** will appear upon the first launch.
>
> If you have any security concerns, use is not recommended. As with any software, it is recommended to verify the safety of the source code (e.g., using AI tools) before running it.

## Search Functionality

*   **Scope Switching**: Toggle search scope between the current folder only or the entire registered library (Global).
*   **Advanced Search**:
    *   **Without FFmpeg**: Searches file names only.
    *   **With FFmpeg**: Searches file names as well as metadata such as AI prompts, FPS, and Codec.
    *   **Special Syntax**: Filter by technical specifications by typing `fps:60` or `codec:h264`.

## Mobile Connect [Experimental]

When enabled in the settings, this feature runs the PC app as a "server", allowing you to access it from your smartphone.

> **⚠️ Note**: 
> This is an experimental feature, and performance or stability is not guaranteed.
> Currently tested on **Android** only.
> For security reasons, do not use this feature on public Wi-Fi networks.

### Connection Steps
1.  Open the `Settings` > `EXPERIMENTAL` section in the app on your PC.
2.  Turn **ON** the `Mobile Connect` toggle.
> **Note: Firewall Permissions**
> Enabling mobile integration activates a server function to communicate with your smartphone.
> At this time, Windows may display a security alert stating that "Windows Defender Firewall has blocked some features of this app."
> 
> To allow connections from your smartphone, please select **"Allow access"**.
3.  Scan the displayed QR code with your smartphone.
4.  The browser will open, allowing access to the PC library.

> **About Security**:
> The QR code contains a **authentication token** required for the connection. This ensures only authorized devices can access your library.

> **About Re-connection**:
> Once connected successfully, you can open the URL (including the token) from your bookmarks or history to connect without scanning the QR code again (the Mobile Connect feature on your PC must be enabled).

### Troubleshooting Connection
If you cannot connect from your smartphone, please check the following:

1.  **Same LAN**: PC and smartphone must be on the same Wi-Fi (router).
2.  **Firewall Settings**: Windows Defender Firewall may be blocking the connection.
    *   Open "Firewall & network protection" settings.
    *   Select "Allow an app through firewall".
    *   Find `electron.exe` (or this app name) in the list and check **Private** (and Public if necessary).
## Playback Specifications & FFmpeg

To avoid license issues, **FFmpeg is not included** with this application.
Therefore, functionality is limited by default. To use all features, users must install FFmpeg themselves.

### Playback Modes

| Feature | Without FFmpeg | With FFmpeg |
| :--- | :--- | :--- |
| **Modal Player**<br>(Click to open) | Plays MP4 and WebM only. | **Plays most video formats**<br>(MKV, AVI, WMV, etc.) |
| **Simultaneous Playback**<br>(Grid View) | Plays MP4 and WebM only. | **No Change**<br>(Remains MP4/WebM only due to Chromium limitations) |
| **Data Harvesting** | Basic info only. | **FPS/Codec extraction, and AI prompt retrieval.** |

### FFmpeg Installation Steps

1.  Download `ffmpeg-release-essentials.zip` (for Windows) from the following site:
    *   [Gyan.dev (FFmpeg Builds)](https://www.gyan.dev/ffmpeg/builds/)
2.  Extract the zip file and save `ffmpeg.exe` and `ffprobe.exe` (found in the `bin` folder) to a location of your choice.
3.  Open the app's `Settings` > `External Tools` section and specify the paths for both files.

## Data Collection & Search Indexing

The application collects video metadata in the background, but **the following conditions must be met:**

*   **Search Indexing**: To enable search for a specific video, the folder containing it needs to be opened within the app at least once.
*   **Rebinding Logic**: There may be a lag of a few seconds to a few minutes before detailed information (AI prompts, FPS, etc.) appears.

## Shortcuts & Controls

### Common / Grid View
| Key | Action |
| :--- | :--- |
| `Ctrl` + `B` | Toggle Sidebar |
| `Ctrl` + `Click` | Start Multi-select Mode |
| `Shift` + `Click` | Range Select |
| `Esc` | Deselect / Close Menu |

### Modal Player
| Key | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `F` | Toggle Fullscreen |
| `I` | **Toggle Info Panel (Metadata/Prompts)** |
| `←` / `→` | Previous / Next Video |
| `Mouse Wheel` | Previous / Next Video |
| `Esc` | Close Player |

### Mobile Operations (Touch)
| Action | Function |
| :--- | :--- |
| **Swipe (Left/Right)** | Go to Previous / Next Video |
| **Tap** | Toggle Controls |

## Important Notes

### Large Video Files
To ensure application stability, automatic playback of large video files is restricted by default.
Videos larger than **100MB** will only preview when hovered over.

This threshold can be changed or disabled in `Settings` > `Performance`.

### Playback Stuttering on Specific Videos
Some videos with non-standard encoding, such as odd resolutions (e.g., `1023x767`), may cause playback to freeze due to compatibility issues with GPU hardware acceleration.
If this occurs, try one of the following solutions:

1.  **Disable Hardware Acceleration**
    Go to `Settings` > `System` and turn off the `Hardware Accel` toggle. **A restart is required** to apply this change.

2.  **Re-encode the Video (Requires FFmpeg)**
    To use this feature:
    1.  Set up `ffmpeg.exe` and `ffprobe.exe` in `Settings` > `External Tools`.
    2.  Once FFmpeg is recognized, an `Experimental Features` section will appear in the settings panel.
    3.  Enable `Enable "Normalize Video"`.
    
    After completing these steps, a `Normalize Video` option will appear in the video context menu (right-click). Executing this will generate a new, highly compatible MP4 file with even dimensions.

## Technical Overview

### Tech Stack
*   **Core**: Electron, **Vite**, React, TypeScript
*   **Frontend UI**: React, Tailwind CSS, Shadcn UI, Lucide React
*   **State Management**: Zustand, TanStack Query
*   **Database**: better-sqlite3 (SQLite)
*   **Server**: Node.js HTTP Server + SSE (Server-Sent Events)

### Architecture
*   **Frontend**: Directory structure adopted from Feature-Sliced Design (FSD). Abstracts IPC and HTTP communication using the `ApiClient` pattern, sharing the codebase between Desktop and Mobile.
*   **Backend**: A built-in HTTP server runs within the Electron main process. Synchronizes Desktop and Mobile operations in real-time.

### Data & Search
*   **SQLite**: Manages metadata, settings, and playlists in a single `.db` file.
*   **Search Capability**: Search implementation based on SQLite's FTS5 module.
*   **Portable Data Structure**: Application settings and the database (`userData`) are stored in the same directory as the executable.

### File Integrity & Recovery
*   **Monitoring System**: Runs `chokidar` in a Worker thread to detect file system changes.
*   **Missing Handling**: When a file is moved or deleted, the record is not immediately deleted but kept as `missing`.
*   **Automatic Recovery**:
    *   **Inode Tracking**: Updates paths automatically by verifying file system Inode numbers for moves within the same volume.
    *   **Hash Verification**: Verifies identity using file size and partial hashes to restore metadata when moved to a different volume or if the Inode changes.

## Performance
*   **Startup is kinda fast for Electron.**

## Roadmap

*No guarantees/ETA*

*   Image file support

## Uninstall

This application runs in portable mode. It does not use the registry; settings and the database are saved in the `userData` folder within the same directory as the executable.

*   **To Remove**: Simply delete the downloaded/extracted folder. This removes all data.

## Building from Source

*   Node.js (v22.x recommended / Tested on v22.17.0)

1.  **Clone the repository and navigate into the directory**
    ```bash
    git clone https://github.com/HoujyouChomei/local-masonry-video-player.git
    cd local-masonry-video-player
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run in Development Mode**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    (Output will be in the `release` folder)
    ```bash
    npm run dist
    ```

## Feedback & Contribution

Bug reports and feature suggestions are welcome. Please feel free to contact us via the [Discussions page](https://github.com/HoujyouChomei/local-masonry-video-player/discussions).

**Regarding Code Contributions (Pull Requests):**
Code contributions via Pull Requests are welcome. However, this project is primarily developed with the assistance of AI, and **the author does not possess specialized skills in reading or reviewing code.**

Therefore, it is very difficult to appropriately judge whether proposed code is safe or how it might affect the application as a whole.

Please understand in advance that reviews or replies may be significantly delayed, or that the code may ultimately not be merged. If you wish to use your changes immediately, forking the repository is the most reliable method.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.