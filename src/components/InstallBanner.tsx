"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/hooks/useInstallPrompt";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "install-banner-dismissed";

export function InstallBanner() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (isInstalled || dismissed) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      {isIOS ? (
        <div className="flex flex-1 items-start gap-3">
          <Share className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">홈 화면에 추가하기</p>
            <p className="text-xs text-muted-foreground">
              하단 공유 버튼 <Share className="inline size-3" /> 을 탭한 후 &ldquo;홈 화면에 추가&rdquo;를 선택하세요.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-3">
          <Download className="size-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm font-medium">앱을 설치하면 더 빠르게 이용할 수 있어요</p>
          <Button size="sm" onClick={promptInstall}>
            설치
          </Button>
        </div>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
