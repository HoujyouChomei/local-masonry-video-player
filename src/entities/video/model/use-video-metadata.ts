// src/entities/video/model/use-video-metadata.ts

import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { VideoFile } from '../../../shared/types/video';
import { updateVideoMetadataApi } from '@/shared/api/electron';

export const useVideoMetadata = (video: VideoFile) => {
  // DBから有効なメタデータが来ているか判定
  const hasMetadata = video.duration !== undefined && video.duration > 0;

  // ローカルでロードしたDurationを保持するState
  const [localDuration, setLocalDuration] = useState<number>(0);

  // 実際に使用するDuration: DBの値があればそれを優先、なければローカルの値
  const duration = hasMetadata ? video.duration! : localDuration;

  // メタデータがない場合のみ監視を行う
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px',
    skip: hasMetadata, // すでにデータがあれば監視しない
  });

  // ロードすべき条件: DBになく、画面内にあり、まだローカルでもロードしていない
  const shouldLoadMetadata = !hasMetadata && inView && localDuration === 0;

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    const newDuration = el.duration;
    const width = el.videoWidth;
    const height = el.videoHeight;

    setLocalDuration(newDuration);

    // Electron経由でDBに保存 (Harvesting)
    // ▼▼▼ 修正: path -> id ▼▼▼
    updateVideoMetadataApi(video.id, newDuration, width, height);
  };

  return {
    containerRef: ref,
    shouldLoadMetadata,
    duration,
    handleLoadedMetadata,
  };
};