// Electron main process — wraps the Next.js app as a local desktop program.
//
// Why a desktop app: runs entirely on the user's machine (no hosting, no
// server-side storage of personal data), and Electron's userData directory
// survives app updates, so a reinstall never wipes the user's settings.
const { app, BrowserWindow, Menu, shell, screen, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");
const { autoUpdater } = require("electron-updater");

// A FIXED port keeps the page origin (http://127.0.0.1:42813) constant across
// launches — localStorage is keyed by origin, so a stable port means user
// settings (widgets, layout, keys) persist every restart.
const PORT = 42813;
const HOST = "127.0.0.1";
const APP_URL = `http://${HOST}:${PORT}`;

const isDev = !app.isPackaged;
let serverProcess = null;
let mainWindow = null;

// --- window position/size persistence -----------------------------------
const stateFile = path.join(app.getPath("userData"), "window-state.json");

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  } catch {
    return { width: 480, height: 920, alwaysOnTop: false };
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    // getNormalBounds 는 최대화/전체화면 상태에서도 "원래 일반 창의 좌표/크기"를
    // 돌려준다 — 사용자가 다음 실행에서 최대화를 해제하면 이 값으로 돌아가도록.
    const bounds = mainWindow.getNormalBounds();
    fs.writeFileSync(
      stateFile,
      JSON.stringify({
        ...bounds,
        isMaximized: mainWindow.isMaximized(),
        alwaysOnTop: mainWindow.isAlwaysOnTop(),
      }),
    );
  } catch {
    /* ignore */
  }
}

// Returns the saved {x,y} only when the window would still be visible on a
// connected display — guards against off-screen restores after a monitor is
// unplugged or rearranged. Otherwise returns {} so Electron centers the window.
function visiblePosition(state) {
  if (typeof state.x !== "number" || typeof state.y !== "number") return {};
  const w = state.width ?? 480;
  const h = state.height ?? 920;
  const onScreen = screen.getAllDisplays().some((d) => {
    const b = d.bounds;
    const overlapX =
      Math.min(state.x + w, b.x + b.width) - Math.max(state.x, b.x);
    const overlapY =
      Math.min(state.y + h, b.y + b.height) - Math.max(state.y, b.y);
    return overlapX >= 120 && overlapY >= 40;
  });
  return onScreen ? { x: state.x, y: state.y } : {};
}

// --- bundled Next.js standalone server ----------------------------------
function startServer() {
  if (isDev) return; // dev: `npm run dev` already serves the app
  const serverJs = path.join(process.resourcesPath, "app", "server.js");
  serverProcess = spawn(process.execPath, [serverJs], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      HOSTNAME: HOST,
    },
    stdio: "ignore",
  });
}

function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Next.js server did not start in time"));
        } else {
          setTimeout(attempt, 300);
        }
      });
    };
    attempt();
  });
}

function createWindow() {
  const state = loadWindowState();
  mainWindow = new BrowserWindow({
    width: state.width ?? 480,
    height: state.height ?? 920,
    ...visiblePosition(state),
    minWidth: 360,
    minHeight: 480,
    alwaysOnTop: Boolean(state.alwaysOnTop),
    backgroundColor: "#0a0a0a",
    title: "Folio",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(APP_URL);

  // 종료 시점에 최대화 상태였다면 다음 실행에서도 최대화로 복원.
  if (state.isMaximized) mainWindow.maximize();

  // Open external links (TradingView, broker docs…) in the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // resize/move 외에 maximize/unmaximize 도 저장해서 토글 직후 종료해도 보존.
  for (const ev of ["resize", "move", "close", "maximize", "unmaximize"]) {
    mainWindow.on(ev, saveWindowState);
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  buildMenu();
}

function buildMenu() {
  const onTop = mainWindow ? mainWindow.isAlwaysOnTop() : false;
  const template = [
    {
      label: "보기",
      submenu: [
        {
          label: "항상 위에 표시",
          type: "checkbox",
          checked: onTop,
          accelerator: "CmdOrCtrl+T",
          click: (item) => {
            if (mainWindow) mainWindow.setAlwaysOnTop(item.checked);
            saveWindowState();
          },
        },
        { type: "separator" },
        { role: "reload", label: "새로고침" },
        { role: "forceReload", label: "강제 새로고침" },
        { role: "toggleDevTools", label: "개발자 도구" },
        { type: "separator" },
        { role: "resetZoom", label: "기본 배율" },
        { role: "zoomIn", label: "확대" },
        { role: "zoomOut", label: "축소" },
        { type: "separator" },
        { role: "togglefullscreen", label: "전체화면" },
        { role: "minimize", label: "최소화" },
        { role: "quit", label: "종료" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// --- auto-update ---------------------------------------------------------
// Checks the GitHub Releases feed, downloads a newer version in the background,
// and installs it on the next app quit. Failures are swallowed so a missing
// network or release never disrupts the app.
function setupAutoUpdate() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("error", () => {
    /* ignore — update problems must never break the running app */
  });
  // A new version finished downloading — tell the renderer to show its banner.
  autoUpdater.on("update-downloaded", (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("folio:update-ready", info?.version ?? "");
    }
  });
  // Renderer's "지금 재시작" button → quit and install the downloaded update.
  ipcMain.on("folio:restart-to-update", () => autoUpdater.quitAndInstall());

  autoUpdater.checkForUpdates().catch(() => {});
  // This dashboard often stays open all day — re-check every 6 hours.
  setInterval(
    () => autoUpdater.checkForUpdates().catch(() => {}),
    6 * 60 * 60 * 1000,
  );
}

// Single-instance: focus the existing window instead of opening a second one.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    startServer();
    try {
      await waitForServer(APP_URL);
    } catch {
      /* create the window anyway so the user sees a load error, not nothing */
    }
    createWindow();
    setupAutoUpdate();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
