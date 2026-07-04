import { Bookmark, BookOpen, FileText, UserRound } from "lucide-react";

export type AppTab = "train" | "digest" | "saved" | "profile";

interface AppShellProps {
  activeTab: AppTab;
  onTabChange(tab: AppTab): void;
  children: React.ReactNode;
}

const navItems = [
  { id: "train", label: "Train", icon: BookOpen },
  { id: "digest", label: "Digest", icon: FileText },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "profile", label: "Profile", icon: UserRound }
] as const;

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="app-frame bg-white">
      <div className="app-shell relative mx-auto w-full max-w-[430px] bg-white">{children}</div>
      <nav
        aria-label="Primary"
        className="bottom-nav fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[430px] items-center justify-around border-t border-line bg-white/96 px-3 pt-2 backdrop-blur"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={selected ? "page" : undefined}
              onClick={() => onTabChange(item.id)}
              className={`flex min-h-[52px] w-20 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium ${
                selected ? "text-action" : "text-graphite"
              }`}
            >
              <Icon aria-hidden="true" size={23} strokeWidth={selected ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

