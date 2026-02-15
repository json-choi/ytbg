interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  return (
    <header
      className="app-header sticky top-0 z-30 bg-background/80 backdrop-blur-xl backdrop-saturate-[180%] supports-[backdrop-filter]:bg-background/70"
    >
      {/* Hairline border */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.08]" />

      <div className="flex h-11 items-center justify-between px-4">
        <h1 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h1>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
