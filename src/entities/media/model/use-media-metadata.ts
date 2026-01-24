// src/entities/media/model/use-media-metadata.ts

import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Media } from '@/shared/schemas/media';
import { api } from '@/shared/api';

export const useMediaMetadata = (media: Media) => {
  const hasMetadata = media.duration !== undefined && media.duration > 0;

  const [localDuration, setLocalDuration] = useState<number>(0);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const duration = hasMetadata ? media.duration! : localDuration;

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

    api.media.updateMetadata(media.id, newDuration, width, height);
  };

  return {
    containerRef: ref,
    shouldLoadMetadata,
    duration,
    handleLoadedMetadata,
  };
};
