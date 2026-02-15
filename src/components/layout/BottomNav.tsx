"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: Clock },
  { href: "/favorites", label: "Favorites", icon: Heart },
] as const;

export const BOTTOM_NAV_HEIGHT = 49; // iOS standard tab bar height (px)

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-background/80 backdrop-blur-xl backdrop-saturate-[180%]",
        "supports-[backdrop-filter]:bg-background/70",
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Subtle top border — mimics iOS native 0.5px hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.08]" />

      <div
        className="mx-auto flex items-end justify-around"
        style={{ height: `${BOTTOM_NAV_HEIGHT}px` }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-[2px] pb-[5px] pt-[5px]",
                "text-[10px] font-medium tracking-[0.01em]",
                "transition-colors duration-200 active:opacity-70",
                "-webkit-tap-highlight-color: transparent",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/80",
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <Icon
                className={cn(
                  "size-[22px] transition-colors duration-200",
                  isActive && "fill-primary/20",
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
