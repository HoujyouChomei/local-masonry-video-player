[ [English](README.md) | 日本語 ]

# Local Masonry Video Player

![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white) ![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**動画素材や動画生成AI用ローカルビデオプレイヤー。**

https://github.com/user-attachments/assets/8b670533-baa1-4f8d-9675-9951359a915e

### [⬇️ Download Latest Version](https://github.com/HoujyouChomei/local-masonry-video-player/releases)

> **Note**: 本アプリケーションはWindowsでのみ動作確認をしています。

## 主な機能

*   **Masonry Gridレイアウト**: 動画のアスペクト比を維持し、隙間なくタイル状に配置します。
*   **フォルダ参照型管理**: ファイルの実体を移動せず、インデックスのみを作成して管理します。
*   **ファイル監視 (File Watcher)**: 対象フォルダ内のファイル追加・削除・変更を検知し、ライブラリを自動更新します。
*   **ファイル操作**: アプリ内からローカルファイルのリネーム、フォルダ移動、削除（ゴミ箱へ移動）が可能です。
*   **ドラッグ＆ドロップ**: アプリ外（ComfyUI等の外部ツール）へのファイルドロップや、アプリ内でのフォルダ移動に対応しています。
*   **整理機能**: プレイリスト作成、タグ付け、お気に入り登録機能があります。
*   **メタデータ収集**: **(要FFmpeg)** AI生成動画のプロンプト情報（JSON）、FPS、Codec等の技術情報を自動取得して表示・検索に使用できます。

## 検索機能

*   **スコープ切り替え**: 現在のフォルダ内のみを検索するか、登録済みライブラリ全体（グローバル）を検索するかを切り替え可能です。
*   **検索対象**:
    *   **FFmpegなし**: ファイル名のみ検索対象。
    *   **FFmpegあり**: ファイル名に加え、AIプロンプト、FPS、Codecなどのメタデータも検索対象になります。

## 再生仕様とFFmpegについて

本アプリはライセンス回避のため、**FFmpegを含めずに配布しています。**
そのため、初期状態では機能に制限があります。すべての機能を利用するには、ユーザー自身でFFmpegを導入する必要があります。

### 再生モードの仕様

| 機能 | FFmpeg なし | FFmpeg あり |
| :--- | :--- | :--- |
| **詳細プレーヤー**<br>(クリックして開く) | MP4, WebM のみ再生可能 | **多くの動画形式を再生可能**<br>(MKV, AVI, WMV 等) |
| **一覧画面での同時再生**<br>(グリッド表示) | MP4, WebM のみ | **変化なし**<br>(Chromium準拠のため、FFmpegを入れてもMP4/WebMのみ) |
| **データ取得** | 基本情報のみ | **サムネイル生成、FPS/Codec、AIプロンプト取得が可能** |

### FFmpeg 導入手順

1.  以下のサイトから `ffmpeg-release-essentials.zip` (Windows用) をダウンロードしてください。
    *   [Gyan.dev (FFmpeg Builds)](https://www.gyan.dev/ffmpeg/builds/)
2.  解凍したフォルダ内の `bin` フォルダにある `ffmpeg.exe` と `ffprobe.exe` を任意の場所に保存します。
3.  アプリの設定画面 (Settings) > External Tools セクションを開き、それぞれのパスを指定してください。

## データ収集の仕様

本アプリは、バックグラウンドで動画のメタデータを収集します。

*   **検索への反映**: 検索機能を利用するには、対象の動画が含まれるフォルダを**一度アプリ内で開く必要があります。**
*   **反映ラグ**: 動画の詳細情報（AIプロンプトやFPSなど）が表示されるまで、数秒〜数分のラグが発生する場合があります。

## ショートカットキー

### 共通 / 一覧画面 (Grid View)
| キー | 動作 |
| :--- | :--- |
| `Ctrl` + `B` | サイドバーの開閉 |
| `Ctrl` + `Click` | 複数選択モード開始 |
| `Shift` + `Click` | 範囲選択 |
| `Esc` | 選択解除 / メニューを閉じる |

### 詳細プレーヤー (Modal Player)
| キー | 動作 |
| :--- | :--- |
| `Space` | 再生 / 一時停止 |
| `F` | フルスクリーン切り替え |
| `I` | **情報パネル (メタデータ・プロンプト) の開閉** |
| `←` / `→` | 前の動画 / 次の動画へ移動 |
| `Mouse Wheel` | 前の動画 / 次の動画へ移動 |
| `Esc` | プレーヤーを閉じる |

## 注意事項

### 大容量の動画ファイルについて
アプリケーションの安定性のため、初期設定では大容量の動画ファイルの自動再生が制限されています。
デフォルトでは **1GB** を超える動画は、サムネイルにマウスカーソルを合わせた時のみプレビュー再生が開始されます。

この制限は `設定 (Settings) > Performance` セクションから、閾値の変更または機能の無効化が可能です。

### 特定の動画で再生が停止する問題について
動画の解像度が奇数（例: `1023x767`）など、エンコードが標準的でない一部の動画は、GPUのハードウェアアクセラレーションとの相性問題で再生が停止（スタック）することがあります。
この問題が発生した場合、以下のいずれかの方法で解決できる可能性があります。

1.  **ハードウェアアクセラレーションを無効にする**
    `設定 (Settings) > System` を開き、`Hardware Accel` のトグルをOFFにしてください。設定の適用には**アプリケーションの再起動が必要です。**

2.  **動画を再エンコードする (要FFmpeg)**
    この機能を利用するには、以下の手順が必要です。
    1.  まず、`ffmpeg.exe` と `ffprobe.exe` の両方をアプリの `設定 (Settings) > External Tools` から設定してください。
    2.  FFmpegが正しく認識されると、設定パネル内に `Experimental Features` という項目が表示されます。
    3.  その中にある `Enable "Normalize Video"` の項目を有効にしてください。
    
    上記の手順を完了すると、動画の右クリックメニューに `Normalize Video` が表示されるようになります。これを実行すると、互換性の高い偶数解像度のMP4ファイルが新しく生成されます。

## 技術概要
### 技術スタック
*   **Core**: Electron, Next.js (App Router), TypeScript
*   **Frontend UI**: React, Tailwind CSS, Shadcn UI, Lucide React
*   **State Management**: Zustand, TanStack Query
*   **Database**: better-sqlite3 (SQLite)
*   **Native Modules**: chokidar (ファイル監視)

### アーキテクチャ
*   **Frontend**: Feature-Sliced Design (FSD) をベースにしたディレクトリ構成を採用。
*   **Backend**: Electronのメインプロセス内を Service/Repository パターンで構成。

### データ管理と検索
*   **SQLite**: メタデータ、設定、プレイリスト情報を単一の `.db` ファイルで管理。
*   **Hybrid Search**: SQLiteの全文検索モジュール (FTS5) と通常のSQLクエリを組み合わせた検索実装。
*   **ポータブルデータ構造**: アプリケーション設定やデータベース（`userData`）は実行ファイルと同階層に保存。

### ファイル整合性と自動復元
*   **監視システム**: `chokidar` をWorkerスレッドで実行し、ファイルシステムの変更を検知。
*   **欠損処理**: ファイルが移動または削除された際、即座にレコードを削除せず `missing` ステータスとして保持。
*   **自動復元**:
    *   **Inode追跡**: 同一ボリューム内での移動は、ファイルシステムのInode番号を照合してパスを更新。
    *   **ハッシュ照合**: 別ボリュームへの移動やInode変更時は、ファイルサイズと部分ハッシュを用いて同一性を検証し、メタデータを復元。

## ロードマップ

*実装を保証するものではありません*

*   画像ファイルのサポート
*   スマートフォン等でのリモート再生

## アンインストール方法

本アプリはポータブル形式で動作します。レジストリを使用せず、設定ファイルやデータベースも実行ファイルと同じフォルダ内の `userData` フォルダに保存されます。

*   **削除手順**: ダウンロード・解凍したフォルダをそのままゴミ箱に捨ててください。これだけですべてのデータが削除されます。

## ソースからのビルド

*   Node.js (v22.x 推奨 / v22.17.0 動作確認済み)

1.  **リポジトリのクローンと移動**
    ```bash
    git clone https://github.com/HoujyouChomei/local-masonry-video-player.git
    cd local-masonry-video-player
    ```

2.  **依存関係のインストール**
    ```bash
    npm install
    ```

3.  **開発モードで起動**
    ```bash
    npm run dev
    ```

4.  **配布用にビルド**
    (成果物は `release` フォルダに出力されます)
    ```bash
    npm run dist
    ```

## フィードバックと貢献について

バグの報告や、新機能の提案はいつでも歓迎します。[Discussionsページ](https://github.com/HoujyouChomei/local-masonry-video-player/discussions)からお気軽にご連絡ください。

**コードの貢献 (プルリクエスト) について:**
プルリクエストを通じたコードの貢献も歓迎します。しかし、本プロジェクトは主にAIの支援を受けて開発されており、**作者自身はコードの読み書きやレビューに関する専門的なスキルを持っていません。**

そのため、提案されたコードが安全か、またアプリケーション全体にどのような影響を与えるかを適切に判断することが非常に困難です。

レビューや返信が大幅に遅れたり、最終的にマージ（取り込み）できない可能性があることを、あらかじめご了承ください。ご自身の変更をすぐに利用したい場合は、リポジトリをフォークしていただくのが最も確実な方法です。

## ライセンス

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
