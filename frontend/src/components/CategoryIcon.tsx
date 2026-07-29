import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ name, className = "", size = 24 }: CategoryIconProps) {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) {
    // Fallback icon
    return <LucideIcons.HelpCircle className={className} size={size} />;
  }
  return <IconComponent className={className} size={size} />;
}
