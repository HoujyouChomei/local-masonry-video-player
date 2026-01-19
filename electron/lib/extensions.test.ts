// electron/lib/extensions.test.ts

import { describe, it, expect } from 'vitest';
import {
  isVideoFile,
  isImageFile,
  getMediaType,
  NATIVE_EXTENSIONS,
  EXTENDED_EXTENSIONS,
  IMAGE_EXTENSIONS_SET,
} from './extensions';

describe('extensions', () => {
  describe('NATIVE_EXTENSIONS', () => {
    it('should include mp4 and webm', () => {
      expect(NATIVE_EXTENSIONS.has('.mp4')).toBe(true);
      expect(NATIVE_EXTENSIONS.has('.webm')).toBe(true);
    });
  });

  describe('EXTENDED_EXTENSIONS', () => {
    it('should include ffmpeg formats', () => {
      expect(EXTENDED_EXTENSIONS.has('.mkv')).toBe(true);
      expect(EXTENDED_EXTENSIONS.has('.avi')).toBe(true);
      expect(EXTENDED_EXTENSIONS.has('.mov')).toBe(true);
    });
  });

  describe('IMAGE_EXTENSIONS_SET', () => {
    it('should include common image formats', () => {
      expect(IMAGE_EXTENSIONS_SET.has('.jpg')).toBe(true);
      expect(IMAGE_EXTENSIONS_SET.has('.jpeg')).toBe(true);
      expect(IMAGE_EXTENSIONS_SET.has('.png')).toBe(true);
      expect(IMAGE_EXTENSIONS_SET.has('.gif')).toBe(true);
      expect(IMAGE_EXTENSIONS_SET.has('.webp')).toBe(true);
    });
  });

  describe('isVideoFile', () => {
    it('should return true for native video files', () => {
      expect(isVideoFile('/path/to/video.mp4', false)).toBe(true);
      expect(isVideoFile('/path/to/video.webm', false)).toBe(true);
    });

    it('should return false for extended formats when not enabled', () => {
      expect(isVideoFile('/path/to/video.mkv', false)).toBe(false);
    });

    it('should return true for extended formats when enabled', () => {
      expect(isVideoFile('/path/to/video.mkv', true)).toBe(true);
      expect(isVideoFile('/path/to/video.avi', true)).toBe(true);
    });

    it('should handle uppercase extensions', () => {
      expect(isVideoFile('/path/to/video.MP4', false)).toBe(true);
    });

    it('should return false for non-video files', () => {
      expect(isVideoFile('/path/to/image.png', true)).toBe(false);
    });
  });

  describe('isImageFile', () => {
    it('should return true for image files', () => {
      expect(isImageFile('/path/to/image.jpg')).toBe(true);
      expect(isImageFile('/path/to/image.jpeg')).toBe(true);
      expect(isImageFile('/path/to/image.png')).toBe(true);
      expect(isImageFile('/path/to/image.gif')).toBe(true);
      expect(isImageFile('/path/to/image.webp')).toBe(true);
    });

    it('should handle uppercase extensions', () => {
      expect(isImageFile('/path/to/image.PNG')).toBe(true);
      expect(isImageFile('/path/to/image.JPG')).toBe(true);
    });

    it('should return false for non-image files', () => {
      expect(isImageFile('/path/to/video.mp4')).toBe(false);
      expect(isImageFile('/path/to/document.pdf')).toBe(false);
    });
  });

  describe('getMediaType', () => {
    it('should return video for video files', () => {
      expect(getMediaType('/path/to/video.mp4', false)).toBe('video');
      expect(getMediaType('/path/to/video.mkv', true)).toBe('video');
    });

    it('should return image for image files', () => {
      expect(getMediaType('/path/to/image.png', false)).toBe('image');
      expect(getMediaType('/path/to/image.jpg', true)).toBe('image');
    });

    it('should return unknown for unrecognized files', () => {
      expect(getMediaType('/path/to/document.pdf', true)).toBe('unknown');
      expect(getMediaType('/path/to/file.txt', true)).toBe('unknown');
    });
  });
});
