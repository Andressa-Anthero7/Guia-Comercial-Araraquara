import { Utensils, ShoppingBag, Briefcase, HeartPulse, Car, GraduationCap, Sparkles,
  PawPrint, Dumbbell, Home, Store, Wrench, Building2, Coffee, Pizza, Scissors,
  Stethoscope, Laptop, Hammer, Hotel, Truck, Church, Music, HelpCircle,
  type LucideIcon } from 'lucide-react';

const icons: Record<string, LucideIcon> = { Utensils, ShoppingBag, Briefcase, HeartPulse,
  Car, GraduationCap, Sparkles, PawPrint, Dumbbell, Home, Store, Wrench, Building2,
  Coffee, Pizza, Scissors, Stethoscope, Laptop, Hammer, Hotel, Truck, Church, Music };

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ name, className = "", size = 24 }: CategoryIconProps) {
  const IconComponent = icons[name];
  if (!IconComponent) {
    // Fallback icon
    return <HelpCircle className={className} size={size} />;
  }
  return <IconComponent className={className} size={size} />;
}
