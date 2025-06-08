import { app, BrowserWindow, ipcMain, desktopCapturer, Tray, Menu } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
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
ipcMain.handle("get-screen-sources", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 300, height: 200 }
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }));
  } catch (error) {
    console.error("Failed to get screen sources:", error);
    throw error;
  }
});
ipcMain.handle("is-screen-recording-supported", async () => {
  return true;
});
ipcMain.handle("setup-media-access", async () => {
  try {
    if (win && win.webContents) {
      win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        if (["media", "camera", "microphone", "display-capture"].includes(permission)) {
          callback(true);
        } else {
          callback(false);
        }
      });
      win.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ["screen", "window"] }).then((sources) => {
          const availableSources = sources.filter((source) => {
            return !source.name.includes("Electron") && !source.name.includes("DevTools") && source.id && source.id.length > 0;
          });
          if (availableSources.length > 0) {
            const screenSource = availableSources.find(
              (source) => source.id.startsWith("screen:") || source.name.toLowerCase().includes("screen") || source.name.toLowerCase().includes("屏幕")
            ) || availableSources[0];
            console.log("选择的录制源:", screenSource.name, screenSource.id);
            callback({ video: screenSource, audio: "loopback" });
          } else {
            console.warn("没有找到可用的录制源");
            callback({});
          }
        }).catch((error) => {
          console.error("获取屏幕源失败:", error);
          callback({});
        });
      });
    }
    return true;
  } catch (error) {
    console.error("Failed to setup media access:", error);
    return false;
  }
});
ipcMain.handle("get-config-path", async () => {
  try {
    const isPackaged = app.isPackaged;
    let configPath;
    if (isPackaged) {
      const appPath = path.dirname(app.getPath("exe"));
      configPath = path.join(appPath, "AppData", "config.json");
    } else {
      const userDataPath = app.getPath("userData");
      configPath = path.join(userDataPath, "config.json");
    }
    return {
      success: true,
      configPath,
      message: "获取配置文件路径成功"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "获取配置文件路径失败"
    };
  }
});
ipcMain.handle("read-config", async () => {
  try {
    const isPackaged = app.isPackaged;
    let configPath;
    if (isPackaged) {
      const appPath = path.dirname(app.getPath("exe"));
      configPath = path.join(appPath, "AppData", "config.json");
    } else {
      const userDataPath = app.getPath("userData");
      configPath = path.join(userDataPath, "config.json");
    }
    if (!fs.existsSync(configPath)) {
      return {
        success: false,
        error: "配置文件不存在",
        message: "配置文件不存在"
      };
    }
    const configData = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configData);
    return {
      success: true,
      config,
      message: "读取配置文件成功"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "读取配置文件失败"
    };
  }
});
ipcMain.handle("save-config", async (event, config) => {
  try {
    const isPackaged = app.isPackaged;
    let configPath;
    if (isPackaged) {
      const appPath = path.dirname(app.getPath("exe"));
      configPath = path.join(appPath, "AppData", "config.json");
    } else {
      const userDataPath = app.getPath("userData");
      configPath = path.join(userDataPath, "config.json");
    }
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    return {
      success: true,
      message: "保存配置文件成功"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "保存配置文件失败"
    };
  }
});
ipcMain.handle("get-app-data-path", async () => {
  try {
    const appPath = app.getAppPath();
    const isInstalled = appPath.includes("Program Files") || appPath.includes("Program Files (x86)") || !appPath.includes("node_modules");
    let basePath;
    if (isInstalled) {
      basePath = path.join(app.getPath("appData"), app.getName());
    } else {
      basePath = path.join(os.homedir(), "AppData", "HdSome");
    }
    const folders = ["messages", "audio", "images", "videos", "files"];
    for (const folder of folders) {
      const folderPath = path.join(basePath, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    }
    return {
      basePath,
      folders: {
        messages: path.join(basePath, "messages"),
        audio: path.join(basePath, "audio"),
        images: path.join(basePath, "images"),
        videos: path.join(basePath, "videos"),
        files: path.join(basePath, "files")
      }
    };
  } catch (error) {
    console.error("Failed to get app data path:", error);
    throw error;
  }
});
ipcMain.handle("save-file", async (event, { data, fileName, fileType, encoding = "utf8" }) => {
  try {
    const appPath = app.getAppPath();
    const isInstalled = appPath.includes("Program Files") || appPath.includes("Program Files (x86)") || !appPath.includes("node_modules");
    let basePath;
    if (isInstalled) {
      basePath = path.join(app.getPath("appData"), app.getName());
    } else {
      basePath = path.join(os.homedir(), "AppData", "HdSome");
    }
    const folders = {
      messages: path.join(basePath, "messages"),
      audio: path.join(basePath, "audio"),
      images: path.join(basePath, "images"),
      videos: path.join(basePath, "videos"),
      files: path.join(basePath, "files")
    };
    let targetFolder;
    switch (fileType) {
      case "message":
        targetFolder = folders.messages;
        break;
      case "audio":
        targetFolder = folders.audio;
        break;
      case "image":
        targetFolder = folders.images;
        break;
      case "video":
        targetFolder = folders.videos;
        break;
      case "file":
      default:
        targetFolder = folders.files;
        break;
    }
    const filePath = path.join(targetFolder, fileName);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    if (typeof data === "string") {
      fs.writeFileSync(filePath, data, encoding);
    } else if (Buffer.isBuffer(data)) {
      fs.writeFileSync(filePath, data);
    } else if (data instanceof Uint8Array) {
      fs.writeFileSync(filePath, Buffer.from(data));
    } else {
      fs.writeFileSync(filePath, JSON.stringify(data), encoding);
    }
    return {
      success: true,
      filePath,
      message: `文件已保存到: ${filePath}`
    };
  } catch (error) {
    console.error("Failed to save file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "文件保存失败"
    };
  }
});
ipcMain.handle("read-file", async (event, { fileName, fileType, encoding = "utf8" }) => {
  try {
    const appPath = app.getAppPath();
    const isInstalled = appPath.includes("Program Files") || appPath.includes("Program Files (x86)") || !appPath.includes("node_modules");
    let basePath;
    if (isInstalled) {
      basePath = path.join(app.getPath("appData"), app.getName());
    } else {
      basePath = path.join(os.homedir(), "AppData", "HdSome");
    }
    const folders = {
      messages: path.join(basePath, "messages"),
      audio: path.join(basePath, "audio"),
      images: path.join(basePath, "images"),
      videos: path.join(basePath, "videos"),
      files: path.join(basePath, "files")
    };
    let targetFolder;
    switch (fileType) {
      case "message":
        targetFolder = folders.messages;
        break;
      case "audio":
        targetFolder = folders.audio;
        break;
      case "image":
        targetFolder = folders.images;
        break;
      case "video":
        targetFolder = folders.videos;
        break;
      case "file":
      default:
        targetFolder = folders.files;
        break;
    }
    const filePath = path.join(targetFolder, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error("文件不存在");
    }
    const data = fs.readFileSync(filePath, encoding);
    return {
      success: true,
      data,
      filePath,
      message: "文件读取成功"
    };
  } catch (error) {
    console.error("Failed to read file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "文件读取失败"
    };
  }
});
ipcMain.handle("list-files", async (event, { fileType }) => {
  try {
    const appPath = app.getAppPath();
    const isInstalled = appPath.includes("Program Files") || appPath.includes("Program Files (x86)") || !appPath.includes("node_modules");
    let basePath;
    if (isInstalled) {
      basePath = path.join(app.getPath("appData"), app.getName());
    } else {
      basePath = path.join(os.homedir(), "AppData", "HdSome");
    }
    const folders = {
      messages: path.join(basePath, "messages"),
      audio: path.join(basePath, "audio"),
      images: path.join(basePath, "images"),
      videos: path.join(basePath, "videos"),
      files: path.join(basePath, "files")
    };
    let targetFolder;
    switch (fileType) {
      case "message":
        targetFolder = folders.messages;
        break;
      case "audio":
        targetFolder = folders.audio;
        break;
      case "image":
        targetFolder = folders.images;
        break;
      case "video":
        targetFolder = folders.videos;
        break;
      case "file":
      default:
        targetFolder = folders.files;
        break;
    }
    if (!fs.existsSync(targetFolder)) {
      return {
        success: true,
        files: [],
        message: "目录不存在，返回空列表"
      };
    }
    const files = fs.readdirSync(targetFolder).map((fileName) => {
      const filePath = path.join(targetFolder, fileName);
      const stats = fs.statSync(filePath);
      return {
        name: fileName,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      };
    });
    return {
      success: true,
      files,
      message: `找到 ${files.length} 个文件`
    };
  } catch (error) {
    console.error("Failed to list files:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "文件列表获取失败"
    };
  }
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
