import { Menu } from "lucide-react";
import { useState, type PropsWithChildren } from "react";
import { Sidebar } from "./Sidebar";

export function WorkspaceLayout({ children }: PropsWithChildren) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-[18px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[290px,1fr]">
          <div className={`${menuOpen ? "block" : "hidden"} lg:block`}>
            <Sidebar />
          </div>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
