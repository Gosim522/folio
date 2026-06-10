"use client";

import { Keyboard, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CategoryList } from "@/components/settings/category-list";
import { DensityToggle } from "@/components/settings/density-toggle";
import { MyPagePanel } from "@/components/settings/my-page-panel";
import { PriceAlertsPanel } from "@/components/settings/price-alerts-panel";
import { RefreshIntervalToggle } from "@/components/settings/refresh-interval-toggle";
import { SettingsBackupPanel } from "@/components/settings/settings-backup-panel";
import { SidebarSideToggle } from "@/components/settings/sidebar-side-toggle";
import { PnlDirectionToggle } from "./pnl-direction-toggle";
import { ThemeToggle } from "./theme-toggle";

export function SettingsButton() {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="설정"
        className="inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Settings className="size-[18px]" strokeWidth={1.8} />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md sm:w-md overflow-y-auto"
      >
        <SheetHeader className="p-5 pb-2">
          <SheetTitle>설정</SheetTitle>
          <SheetDescription>
            모든 설정은 이 브라우저에 저장돼요.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-5 pt-2">
          <SettingsBlock
            title="마이페이지"
            description="이름과 브로커 API 키를 입력해두세요."
          >
            <MyPagePanel />
          </SettingsBlock>

          <Separator />

          <SettingsBlock title="테마">
            <ThemeToggle />
          </SettingsBlock>

          <Separator />

          <SettingsBlock title="손익 색상" hideTitle>
            <PnlDirectionToggle />
          </SettingsBlock>

          <Separator />

          <SettingsBlock title="레이아웃">
            <div className="space-y-3">
              <SidebarSideToggle />
              <DensityToggle />
            </div>
          </SettingsBlock>

          <Separator />

          <SettingsBlock
            title="데이터 갱신"
            description="시세·자산 정보를 자동으로 다시 불러오는 주기예요."
          >
            <RefreshIntervalToggle />
          </SettingsBlock>

          <Separator />

          <SettingsBlock
            title="위젯"
            description="숨긴 위젯을 다시 켤 수 있어요. 순서·그룹은 페이지·사이드바에서 드래그로 바꿔주세요."
          >
            <CategoryList />
          </SettingsBlock>

          <Separator />

          <SettingsBlock
            title="가격 알림"
            description="설정한 가격을 넘거나 떨어지면 알려드려요. 30초마다 확인합니다."
          >
            <PriceAlertsPanel />
          </SettingsBlock>

          <Separator />

          <SettingsBlock
            title="설정 백업"
            description="앱을 업데이트하거나 다른 기기로 옮길 때 설정을 지킬 수 있어요."
          >
            <SettingsBackupPanel />
          </SettingsBlock>

          <Separator />

          <SettingsBlock title="도움말">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("folio:open-shortcuts"))
              }
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Keyboard className="size-4" strokeWidth={1.8} />
              키보드 단축키 보기
              <kbd className="ml-1 rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ?
              </kbd>
            </button>
          </SettingsBlock>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SettingsBlock({
  title,
  description,
  hideTitle,
  children,
}: {
  title: string;
  description?: string;
  hideTitle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      {!hideTitle ? (
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
