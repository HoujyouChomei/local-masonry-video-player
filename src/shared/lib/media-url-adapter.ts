// src/shared/lib/media-url-adapter.ts

import { Media } from '@/shared/schemas/media';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('lvm_auth_token') ||
    new URLSearchParams(window.location.search).get('token')
  );
};

export const adaptMediaUrl = (media: Media): Media => {
  if (typeof window !== 'undefined' && window.electron) {
    return media;
  }

  if (typeof window === 'undefined') return media;

  let thumb = media.thumbnailSrc;
  let src = media.src;

  const token = getToken();
  const origin = window.location.origin;
  const hostname = window.location.hostname;

  if (thumb.startsWith('file://')) {
    thumb = `${origin}/thumbnail?path=${encodeURIComponent(media.path)}&t=${media.updatedAt}&size=${media.size}`;
  } else if (thumb.includes('127.0.0.1')) {
    thumb = thumb.replace('127.0.0.1', hostname);
  }

  if (token && !thumb.includes('token=')) {
    thumb += `${thumb.includes('?') ? '&' : '?'}token=${token}`;
  }

  if (src.startsWith('file://')) {
    src = `${origin}/video?path=${encodeURIComponent(media.path)}`;
  } else if (src.includes('127.0.0.1')) {
    src = src.replace('127.0.0.1', hostname);
  }

  if (token && !src.includes('token=')) {
    src += `${src.includes('?') ? '&' : '?'}token=${token}`;
  }

  return {
    ...media,
    thumbnailSrc: thumb,
    src: src,
  };
};

export const adaptMediaList = (mediaList: Media[]): Media[] => {
  return mediaList.map(adaptMediaUrl);
};
