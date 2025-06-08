import { app, BrowserWindow, ipcMain, desktopCapturer, Tray, Menu } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require2 = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1240,
    minWidth: 800,
    height: 900,
    minHeight: 500,
    icon: path.join(process.env.VITE_PUBLIC, "logo.png"),
    autoHideMenuBar: true,
    frame: false,
    // 无边框，
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.on("close", (event) => {
    if (!isQuiting) {
      event.preventDefault();
      win == null ? void 0 : win.hide();
    }
  });
  win.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F12" && input.type === "keyDown") {
      win == null ? void 0 : win.webContents.openDevTools();
    }
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
let tray;
let isQuiting = false;
function createTray() {
  const icon = path.join(process.env.VITE_PUBLIC, "logo.png");
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示窗口",
      click: () => {
        win == null ? void 0 : win.show();
      }
    },
    {
      label: "退出应用",
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip("groupuscule.");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    win == null ? void 0 : win.show();
  });
}
ipcMain.handle("window-minimize", () => {
  win == null ? void 0 : win.minimize();
});
ipcMain.handle("window-maximize", () => {
  if (win == null ? void 0 : win.isMaximized()) {
    win == null ? void 0 : win.restore();
  } else {
    win == null ? void 0 : win.maximize();
  }
});
ipcMain.handle("window-close", () => {
  win == null ? void 0 : win.hide();
});
ipcMain.handle("capture-screenshot", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    if (sources.length > 0) {
      return sources[0].thumbnail.toDataURL();
    }
    throw new Error("No screen sources found");
  } catch (error) {
    console.error("Screenshot capture failed:", error);
    throw error;
  }
});
ipcMain.handle("capture-region-screenshot", async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const { screen } = require2("electron");
      const primaryDisplay = screen.getPrimaryDisplay();
      const selectionWindow = new BrowserWindow({
        width: primaryDisplay.bounds.width,
        height: primaryDisplay.bounds.height,
        x: primaryDisplay.bounds.x,
        y: primaryDisplay.bounds.y,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, "preload.mjs")
        }
      });
      const selectionHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: rgba(0, 0, 0, 0.3);
              cursor: crosshair;
              user-select: none;
              overflow: hidden;
            }
            .selection-area {
              position: absolute;
              border: 2px dashed #00ff00;
              background: rgba(0, 255, 0, 0.1);
              display: none;
            }
            .instructions {
              position: absolute;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              color: white;
              font-family: Arial, sans-serif;
              font-size: 16px;
              background: rgba(0, 0, 0, 0.7);
              padding: 10px 20px;
              border-radius: 5px;
              z-index: 1000;
            }
          </style>
        </head>
        <body>
          <div class="instructions">拖拽鼠标选择截图区域，按ESC取消</div>
          <div class="selection-area" id="selectionArea"></div>
          <script>
            let isSelecting = false;
            let startX, startY, endX, endY;
            const selectionArea = document.getElementById('selectionArea');
            
            document.addEventListener('mousedown', (e) => {
              isSelecting = true;
              startX = e.clientX;
              startY = e.clientY;
              selectionArea.style.left = startX + 'px';
              selectionArea.style.top = startY + 'px';
              selectionArea.style.width = '0px';
              selectionArea.style.height = '0px';
              selectionArea.style.display = 'block';
            });
            
            document.addEventListener('mousemove', (e) => {
              if (!isSelecting) return;
              
              endX = e.clientX;
              endY = e.clientY;
              
              const left = Math.min(startX, endX);
              const top = Math.min(startY, endY);
              const width = Math.abs(endX - startX);
              const height = Math.abs(endY - startY);
              
              selectionArea.style.left = left + 'px';
              selectionArea.style.top = top + 'px';
              selectionArea.style.width = width + 'px';
              selectionArea.style.height = height + 'px';
            });
            
            document.addEventListener('mouseup', (e) => {
              if (!isSelecting) return;
              isSelecting = false;
              
              const left = Math.min(startX, endX);
              const top = Math.min(startY, endY);
              const width = Math.abs(endX - startX);
              const height = Math.abs(endY - startY);
              
              if (width > 10 && height > 10) {
                window.electronAPI.sendRegionSelection({
                  x: left,
                  y: top,
                  width: width,
                  height: height
                });
              }
            });
            
            document.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                window.electronAPI.cancelRegionSelection();
              }
            });
          <\/script>
        </body>
        </html>
      `;
      selectionWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(selectionHtml));
      ipcMain.once("region-selected", async (event, region) => {
        selectionWindow.hide();
        try {
          await new Promise((resolve2) => setTimeout(resolve2, 100));
          const sources = await desktopCapturer.getSources({
            types: ["screen"],
            thumbnailSize: {
              width: primaryDisplay.bounds.width,
              height: primaryDisplay.bounds.height
            }
          });
          if (sources.length > 0) {
            const fullScreenshot = sources[0].thumbnail;
            const croppedImage = fullScreenshot.crop({
              x: Math.round(region.x),
              y: Math.round(region.y),
              width: Math.round(region.width),
              height: Math.round(region.height)
            });
            resolve(croppedImage.toDataURL());
          } else {
            reject(new Error("No screen sources found"));
          }
        } catch (error) {
          reject(error);
        } finally {
          if (!selectionWindow.isDestroyed()) {
            selectionWindow.close();
          }
        }
      });
      ipcMain.once("region-selection-cancelled", () => {
        selectionWindow.close();
        reject(new Error("Region selection cancelled"));
      });
    } catch (error) {
      console.error("Region screenshot capture failed:", error);
      reject(error);
    }
  });
});
app.whenReady().then(() => {
  createWindow();
  createTray();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
