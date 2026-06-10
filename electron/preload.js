// Preload runs before the renderer with limited privileges. Exposes a minimal,
// safe bridge for the desktop-only features (auto-update banner, native zoom).
const { contextBridge, ipcRenderer, webFrame } = require("electron");

contextBridge.exposeInMainWorld("folioDesktop", {
  isDesktop: true,
  // Auto-update: register a callback for "new version downloaded", and request
  // a restart-to-install. No-ops in the browser (object simply absent there).
  onUpdateReady: (cb) => {
    ipcRenderer.on("folio:update-ready", (_e, version) => cb(version));
  },
  restartToUpdate: () => ipcRenderer.send("folio:restart-to-update"),
  // Chromium 의 네이티브 줌. CSS `zoom` 과 달리 sticky/flex 레이아웃을 망가뜨리지 않는다.
  // factor 1.0 = 100%. 브라우저에서는 이 함수가 없으니 CSS 폴백을 쓴다.
  setZoomFactor: (factor) => webFrame.setZoomFactor(factor),
  getZoomFactor: () => webFrame.getZoomFactor(),
});
