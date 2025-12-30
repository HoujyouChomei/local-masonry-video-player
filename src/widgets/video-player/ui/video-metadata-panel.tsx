// src/widgets/video-player/ui/video-metadata-panel.tsx

import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { VideoFile } from '@/shared/types/video';

interface VideoMetadataPanelProps {
  video: VideoFile;
  className?: string;
}

// ヘルパー関数をコンポーネント外に移動（再レンダリングごとの生成を防ぎ、依存配列から除外可能にする）
const deepParse = (data: unknown): unknown => {
  // 文字列ならパースを試みる
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      // パース結果がオブジェクトや配列なら、さらにその中身もチェックする
      if (typeof parsed === 'object' && parsed !== null) {
        return deepParse(parsed);
      }
      return parsed;
    } catch {
      // パースできなければそのままの文字列を返す
      return data;
    }
  }

  // オブジェクトなら各プロパティに対して再帰処理
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => deepParse(item));
    }

    const nextData: Record<string, unknown> = {};
    for (const key in data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nextData[key] = deepParse((data as any)[key]);
    }
    return nextData;
  }

  // それ以外はそのまま
  return data;
};

export const VideoMetadataPanel = ({ video, className }: VideoMetadataPanelProps) => {
  // 表示用データの生成
  const formattedParams = useMemo(() => {
    if (!video.generationParams) return null;

    try {
      // 1. まず普通にパース
      const parsed = JSON.parse(video.generationParams);

      // 2. "prompt" などのキーがさらに文字列化されたJSONを含んでいる場合があるので
      //    再帰的に展開してきれいにする
      const cleaned = deepParse(parsed);

      if (typeof cleaned === 'object' && cleaned !== null && Object.keys(cleaned).length === 0) {
        return null;
      }

      // 3. きれいになったオブジェクトを整形して文字列化
      return JSON.stringify(cleaned, null, 2);
    } catch {
      // JSONですらない場合は生の文字列を返す
      return video.generationParams;
    }
  }, [video.generationParams]);

  return (
    <div
      // ガード用属性: この要素内でのホイールは動画切り替えをトリガーしない
      data-no-wheel-nav="true"
      className={cn(
        'flex h-full w-80 flex-col overflow-hidden rounded-xl border border-white/10 bg-gray-950/95 shadow-2xl backdrop-blur-md',
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-gray-900/50 p-4">
        <h3 className="text-sm font-semibold text-gray-200">Metadata</h3>
        {/* ステータス表示を削除 */}
      </div>

      <ScrollArea className="min-h-0 w-full flex-1">
        <div className="p-4">
          {formattedParams ? (
            <pre className="font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-blue-100 select-text">
              {formattedParams}
            </pre>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500 italic">
              {video.metadataStatus === 'processing'
                ? 'Harvesting metadata...'
                : 'No metadata found.'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
