import {
  Home,
  Zap,
  TrendingUp,
  PiggyBank,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  zap: Zap,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  'shopping-cart': ShoppingCart,
  wallet: Wallet,
};

/** Stored icon names and user-selected emoji share a readable, bounded badge. */
export function BucketIcon({ icon, color }: { icon: string; color: string }) {
  const Icon = ICONS[icon] ?? Wallet;
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-foreground"
      style={{ backgroundColor: `${color}20` }}
    >
      {/\p{Extended_Pictographic}/u.test(icon) ? icon : <Icon className="h-5 w-5" />}
    </span>
  );
}
