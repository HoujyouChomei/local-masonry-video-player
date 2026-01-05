import { Check, Circle } from 'lucide-react';

interface VideoSelectionOverlayProps {
  isSelectionMode: boolean;
  isSelected: boolean;
}

export const VideoSelectionOverlay = ({
  isSelectionMode,
  isSelected,
}: VideoSelectionOverlayProps) => {
  if (!isSelectionMode) return null;

  return (
    <div className="absolute top-2 right-2 z-30 transition-all duration-200">
      {isSelected ? (
        <div className="bg-primary text-primary-foreground scale-110 rounded-full p-1 shadow-md">
          <Check className="h-4 w-4" strokeWidth={3} />
        </div>
      ) : (
        <div className="rounded-full bg-black/20 p-0.5 text-white/70 transition-colors hover:text-white">
          <Circle className="h-6 w-6" strokeWidth={2} />
        </div>
      )}
    </div>
  );
};
