// electron/core/services/ffmpeg-service.ts

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { store } from '../../lib/store';

const execFileAsync = promisify(execFile);

export interface VideoMetadataResult {
  duration?: number;
  width?: number;
  height?: number;
  tags?: Record<string, string>; // AI生成パラメータ用
  fps?: number; // v5 added
  codec?: string; // v5 added
}

// 型定義
interface FFprobeStream {
  codec_type: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  [key: string]: unknown;
}

export class FFmpegService {
  public get ffmpegPath() {
    return store.get('ffmpegPath') as string;
  }

  public get ffprobePath() {
    return store.get('ffprobePath') as string;
  }

  public async validatePath(binaryPath: string, type: 'ffmpeg' | 'ffprobe'): Promise<boolean> {
    if (!binaryPath) return false;

    const fileName = path.basename(binaryPath).toLowerCase();
    const expectedName = type;

    if (!fileName.includes(expectedName)) {
      console.warn(
        `[FFmpegService] Security check failed: ${fileName} does not look like ${expectedName}.`
      );
      return false;
    }

    try {
      const { stdout } = await execFileAsync(binaryPath, ['-version'], { timeout: 1000 });

      const output = stdout.toLowerCase();
      const expectedKeyword = `${type} version`;

      if (output.includes(expectedKeyword)) {
        return true;
      }

      console.warn(
        `[FFmpegService] Binary executed but output mismatch. Expected "${expectedKeyword}".`
      );
      return false;
    } catch (error) {
      console.warn(`[FFmpegService] Validation failed for: ${binaryPath}`, error);
      return false;
    }
  }

  public async generateThumbnail(videoPath: string, outputThumbPath: string): Promise<boolean> {
    const binary = this.ffmpegPath;
    if (!binary) return false;

    if (!path.basename(binary).toLowerCase().includes('ffmpeg')) {
      return false;
    }

    try {
      const args = [
        '-y',
        '-i',
        videoPath,
        '-ss',
        '0',
        '-frames:v',
        '1',
        '-q:v',
        '2',
        outputThumbPath,
      ];

      await execFileAsync(binary, args, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error(`[FFmpegService] Failed to generate thumbnail: ${videoPath}`, error);
      return false;
    }
  }

  public async extractMetadata(videoPath: string): Promise<VideoMetadataResult | null> {
    const binary = this.ffprobePath;
    if (!binary) return null;

    try {
      const args = [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        videoPath,
      ];

      const { stdout } = await execFileAsync(binary, args, { timeout: 10000 });
      const data = JSON.parse(stdout);

      const format = data.format || {};
      const videoStream = (data.streams || []).find((s: FFprobeStream) => s.codec_type === 'video');

      const result: VideoMetadataResult = {
        tags: format.tags || {},
      };

      if (format.duration) {
        result.duration = parseFloat(format.duration);
      }

      if (videoStream) {
        if (videoStream.width) result.width = videoStream.width;
        if (videoStream.height) result.height = videoStream.height;

        // ▼▼▼ FPS Calculation ▼▼▼
        // r_frame_rate または avg_frame_rate を使用 (例: "30000/1001", "24/1")
        const rateStr = videoStream.avg_frame_rate || videoStream.r_frame_rate;
        if (rateStr) {
          const parts = rateStr.split('/');
          if (parts.length === 2) {
            const num = parseInt(parts[0], 10);
            const den = parseInt(parts[1], 10);
            if (den > 0) {
              result.fps = num / den;
            }
          }
        }

        // ▼▼▼ Codec Name ▼▼▼
        if (videoStream.codec_name) {
          result.codec = videoStream.codec_name;
        }
      }

      return result;
    } catch (error) {
      console.error(`[FFmpegService] Failed to extract metadata: ${videoPath}`, error);
      return null;
    }
  }

  public getTranscodeArgs(inputPath: string, startTime = 0): string[] {
    const args: string[] = [];

    // 1. 入力解析オプション (Input Options)
    args.push('-analyzeduration', '100M');
    args.push('-probesize', '100M');

    if (startTime > 0) {
      args.push('-ss', startTime.toString());
    }

    args.push('-i', inputPath);

    // 2. 映像エンコード設定 (Video Options)
    args.push(
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-profile:v',
      'high',
      '-crf',
      '20',
      '-g',
      '30',
      '-bf',
      '0',
      '-pix_fmt',
      'yuv420p'
    );

    // 3. フィルタ設定 (Filters)
    args.push('-vf', 'setpts=PTS-STARTPTS');

    // 4. 音声エンコード設定 (Audio Options)
    args.push('-c:a', 'aac', '-ac', '2', '-ar', '44100');

    // 5. 出力設定 (Output Options)
    args.push('-f', 'mp4', '-movflags', 'frag_keyframe+empty_moov+default_base_moof', 'pipe:1');

    return args;
  }

  public async normalizeVideo(inputPath: string): Promise<string | null> {
    const binary = this.ffmpegPath;
    if (!binary) return null;

    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const name = path.basename(inputPath, ext);

    let outputName = `${name}_normalized.mp4`;
    let outputPath = path.join(dir, outputName);

    let counter = 1;
    while (fs.existsSync(outputPath)) {
      outputName = `${name}_normalized (${counter}).mp4`;
      outputPath = path.join(dir, outputName);
      counter++;
    }

    console.log(`[FFmpegService] Normalizing video: ${inputPath} -> ${outputPath}`);

    const args = [
      '-y',
      '-i',
      inputPath,
      '-vf',
      'pad=ceil(iw/2)*2:ceil(ih/2)*2',
      '-c:v',
      'libx264',
      '-crf',
      '20',
      '-preset',
      'fast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-ac',
      '2',
      '-vsync',
      '1',
      '-f',
      'mp4',
      outputPath,
    ];

    try {
      await execFileAsync(binary, args, { maxBuffer: 1024 * 1024 * 10 });
      console.log(`[FFmpegService] Normalization complete: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`[FFmpegService] Normalization failed for: ${inputPath}`, error);
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch {}
      }
      return null;
    }
  }
}
