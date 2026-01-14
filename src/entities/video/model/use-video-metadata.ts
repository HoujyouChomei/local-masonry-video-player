// src/entities/video/model/use-video-metadata.ts

import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { VideoFile } from '../../../shared/types/video';
import { updateVideoMetadataApi } from '@/shared/api/electron';

export const useVideoMetadata = (video: VideoFile) => {
  const hasMetadata = video.duration !== undefined && video.duration > 0;

  const [localDuration, setLocalDuration] = useState<number>(0);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const duration = hasMetadata ? video.duration! : localDuration;

  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px',
    skip: hasMetadata,
  });

  const shouldLoadMetadata = !hasMetadata && inView && localDuration === 0;

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    const newDuration = el.duration;
    const width = el.videoWidth;
    const height = el.videoHeight;

    if (isMounted.current) {
      setLocalDuration(newDuration);
    }

    updateVideoMetadataApi(video.id, newDuration, width, height);
  };

  return {
    containerRef: ref,
    shouldLoadMetadata,
    duration,
    handleLoadedMetadata,
  };
};
