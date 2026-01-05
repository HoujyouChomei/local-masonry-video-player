import { cn } from '@/lib/utils';

interface SettingsSwitchProps {
  checked: boolean;
  onCheckedChange: () => void;
}

export const SettingsSwitch = ({ checked, onCheckedChange }: SettingsSwitchProps) => (
  <button
    onClick={onCheckedChange}
    className={cn(
      'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-hidden',
      checked ? 'bg-primary' : 'bg-muted'
    )}
  >
    <span
      className={cn(
        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out',
        checked ? 'translate-x-4.5' : 'translate-x-1'
      )}
    />
  </button>
);
