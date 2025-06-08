import { app, BrowserWindow, Tray, Menu, ipcMain, desktopCapturer } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1240,
    minWidth: 800,
    height: 900,
    minHeight: 500,
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    autoHideMenuBar: true,
    frame: false,// 无边框，
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }


  // 关键代码：拦截关闭事件，隐藏窗口而不是退出
  win.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      win?.hide();
    }
  });

  // 监听 F12 打开开发者工具
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      win?.webContents.openDevTools();
    }
  });


}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})


let tray: Tray | null
let isQuiting: boolean = false;

/**
 * @description: 托盘
 * @return {*}
 *  
 *  
 */
function createTray() {
  const icon = path.join(process.env.VITE_PUBLIC, 'logo.png')
  tray = new Tray(icon)
  // 显示窗口、退出应用
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        win?.show()
      }
    },
    {
      label: '退出应用',
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ])
  tray.setToolTip('groupuscule.')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    win?.show()
  })

}


// IPC handlers for window controls
ipcMain.handle('window-minimize', () => {
  win?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (win?.isMaximized()) {
    win?.restore()
  } else {
    win?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  win?.hide()
})

// IPC handlers for screenshot
ipcMain.handle('capture-screenshot', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    })
    
    if (sources.length > 0) {
      // 返回第一个屏幕的截图数据
      return sources[0].thumbnail.toDataURL()
    }
    
    throw new Error('No screen sources found')
  } catch (error) {
    console.error('Screenshot capture failed:', error)
    throw error
  }
})

// IPC handlers for region screenshot
ipcMain.handle('capture-region-screenshot', async () => {
  return new Promise(async (resolve, reject) => {
    try {
      // 获取屏幕信息
      const { screen } = require('electron')
      const primaryDisplay = screen.getPrimaryDisplay()
      
      // 创建全屏透明覆盖窗口用于区域选择
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
          preload: path.join(__dirname, 'preload.mjs')
        }
      })
      
      // 加载区域选择页面
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
          </script>
        </body>
        </html>
      `
      
      selectionWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(selectionHtml))
      
      // 处理区域选择结果
      ipcMain.once('region-selected', async (event, region) => {
        // 先隐藏选择窗口，避免截图包含窗口内容
        selectionWindow.hide()
        
        try {
          // 等待一小段时间确保窗口完全隐藏
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // 获取全屏截图
          const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { 
              width: primaryDisplay.bounds.width, 
              height: primaryDisplay.bounds.height 
            }
          })
          
          if (sources.length > 0) {
            const fullScreenshot = sources[0].thumbnail
            
            // 裁剪指定区域
            const croppedImage = fullScreenshot.crop({
              x: Math.round(region.x),
              y: Math.round(region.y),
              width: Math.round(region.width),
              height: Math.round(region.height)
            })
            
            resolve(croppedImage.toDataURL())
          } else {
            reject(new Error('No screen sources found'))
          }
        } catch (error) {
          reject(error)
        } finally {
          // 确保窗口被关闭
          if (!selectionWindow.isDestroyed()) {
            selectionWindow.close()
          }
        }
      })
      
      // 处理取消选择
      ipcMain.once('region-selection-cancelled', () => {
        selectionWindow.close()
        reject(new Error('Region selection cancelled'))
      })
      
    } catch (error) {
      console.error('Region screenshot capture failed:', error)
      reject(error)
    }
  })
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})
