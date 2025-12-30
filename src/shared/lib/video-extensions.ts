// src/shared/lib/video-extensions.ts

// Chromiumでネイティブ再生可能な拡張子
// .mov や .m4v もコンテナとしてはmp4互換であることが多いため含める
export const NATIVE_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg', '.mov', '.m4v']);

export const isNativeVideo = (filePath: string): boolean => {
  // 拡張子を取得 (.を含む)
  const ext = filePath.slice(Math.max(0, filePath.lastIndexOf('.')) || Infinity).toLowerCase();
  return NATIVE_EXTENSIONS.has(ext);
};

/**
 * サムネイルURL（ローカルサーバーのアドレスを含む）を基に、
 * 動画ストリーミング用のURLを生成する
 */
export const getStreamUrl = (thumbnailSrc: string, videoPath: string): string => {
  try {
    // 例: http://127.0.0.1:3000/thumbnail?path=...
    const url = new URL(thumbnailSrc);

    // パスを /video に変更
    url.pathname = '/video';

    // クエリパラメータを再構築 (pathのみ)
    // サムネイルには ts や size が付いているが、ストリーミングには不要（シーク用の t は別途付与される）
    const searchParams = new URLSearchParams();
    searchParams.set('path', videoPath);
    url.search = searchParams.toString();

    return url.toString();
  } catch (e) {
    console.error('[getStreamUrl] Failed to construct stream URL', e);
    return '';
  }
};
