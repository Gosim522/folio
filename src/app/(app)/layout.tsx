import { AlertToast } from "@/components/shell/alert-toast";
import { AppShell } from "@/components/shell/app-shell";
import { AppShortcuts } from "@/components/shell/app-shortcuts";
import { AppZoomHandler } from "@/components/shell/app-zoom-handler";
import { AutoRefresh } from "@/components/shell/auto-refresh";
import { BrokerKeySync } from "@/components/shell/broker-key-sync";
import { HashScrollHandler } from "@/components/shell/hash-scroll-handler";
import { KeyboardNavHandler } from "@/components/shell/keyboard-nav-handler";
import { MouseGestureHandler } from "@/components/shell/mouse-gesture-handler";
import { PriceAlertWatcher } from "@/components/shell/price-alert-watcher";
import { ShortcutsOverlay } from "@/components/shell/shortcuts-overlay";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { UpdateBanner } from "@/components/shell/update-banner";

export default function AppShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell
      sidebar={<Sidebar />}
      topbar={<Topbar />}
      overlays={
        <>
          <HashScrollHandler />
          <KeyboardNavHandler />
          <MouseGestureHandler />
          <AppZoomHandler />
          <AppShortcuts />
          <ShortcutsOverlay />
          <BrokerKeySync />
          <UpdateBanner />
          <AutoRefresh />
          <PriceAlertWatcher />
          <AlertToast />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
