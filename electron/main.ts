import { app, BrowserWindow, ipcMain, desktopCapturer, Tray, Menu, nativeImage, session } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

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

// 屏幕录制相关的IPC处理程序
ipcMain.handle('get-screen-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 300, height: 200 }
    })
    
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }))
  } catch (error) {
    console.error('Failed to get screen sources:', error)
    throw error
  }
})

ipcMain.handle('is-screen-recording-supported', async () => {
  // Electron环境下总是支持屏幕录制
  return true
})

// 设置媒体访问权限
ipcMain.handle('setup-media-access', async () => {
  try {
    // 为渲染进程设置媒体访问权限
    if (win && win.webContents) {
      // 允许访问媒体权限
      win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        // 允许所有媒体相关权限请求
        if (['media', 'camera', 'microphone', 'display-capture'].includes(permission)) {
          callback(true)
        } else {
          callback(false)
        }
      })
      
      // 设置显示媒体处理器
      win.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
        // 获取所有可用的屏幕源
        desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
          // 过滤出可用的源
          const availableSources = sources.filter(source => {
            // 排除一些已知不可用的源
            return !source.name.includes('Electron') && 
                   !source.name.includes('DevTools') &&
                   source.id && source.id.length > 0
          })
          
          if (availableSources.length > 0) {
            // 优先选择屏幕源，如果没有则选择第一个窗口源
            const screenSource = availableSources.find(source => 
              source.id.startsWith('screen:') || 
              source.name.toLowerCase().includes('screen') ||
              source.name.toLowerCase().includes('屏幕')
            ) || availableSources[0]
            
            console.log('选择的录制源:', screenSource.name, screenSource.id)
            callback({ video: screenSource, audio: 'loopback' })
          } else {
            console.warn('没有找到可用的录制源')
            callback({})
          }
        }).catch((error) => {
          console.error('获取屏幕源失败:', error)
          callback({})
        })
      })
    }
    return true
  } catch (error) {
    console.error('Failed to setup media access:', error)
    return false
  }
})

// 配置文件相关的 IPC 处理器
// 获取配置文件路径
ipcMain.handle('get-config-path', async () => {
  try {
    const isPackaged = app.isPackaged
    let configPath: string
    
    if (isPackaged) {
      // 已安装版本：使用安装目录下的 AppData
      const appPath = path.dirname(app.getPath('exe'))
      configPath = path.join(appPath, 'AppData', 'config.json')
    } else {
      // 开发版本：使用用户 AppData 目录
      const userDataPath = app.getPath('userData')
      configPath = path.join(userDataPath, 'config.json')
    }
    
    return {
      success: true,
      configPath,
      message: '获取配置文件路径成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: '获取配置文件路径失败'
    }
  }
})

// 读取配置文件
ipcMain.handle('read-config', async () => {
  try {
    // 直接计算配置文件路径
    const isPackaged = app.isPackaged
    let configPath: string
    
    if (isPackaged) {
      // 已安装版本：使用安装目录下的 AppData
      const appPath = path.dirname(app.getPath('exe'))
      configPath = path.join(appPath, 'AppData', 'config.json')
    } else {
      // 开发版本：使用用户 AppData 目录
      const userDataPath = app.getPath('userData')
      configPath = path.join(userDataPath, 'config.json')
    }
    
    if (!fs.existsSync(configPath)) {
      return {
        success: false,
        error: '配置文件不存在',
        message: '配置文件不存在'
      }
    }
    
    const configData = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configData)
    
    return {
      success: true,
      config,
      message: '读取配置文件成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: '读取配置文件失败'
    }
  }
})

// 保存配置文件
ipcMain.handle('save-config', async (event, config) => {
  try {
    // 直接计算配置文件路径
    const isPackaged = app.isPackaged
    let configPath: string
    
    if (isPackaged) {
      // 已安装版本：使用安装目录下的 AppData
      const appPath = path.dirname(app.getPath('exe'))
      configPath = path.join(appPath, 'AppData', 'config.json')
    } else {
      // 开发版本：使用用户 AppData 目录
      const userDataPath = app.getPath('userData')
      configPath = path.join(userDataPath, 'config.json')
    }
    
    // 确保目录存在
    const configDir = path.dirname(configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    
    // 保存配置文件
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    
    return {
      success: true,
      message: '保存配置文件成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: '保存配置文件失败'
    }
  }
})

// 文件保存相关的IPC处理器

// 获取应用数据保存路径
ipcMain.handle('get-app-data-path', async () => {
  try {
    // 检查是否为安装版本（通过检查是否在Program Files等目录下）
    const appPath = app.getAppPath()
    const isInstalled = appPath.includes('Program Files') || 
                       appPath.includes('Program Files (x86)') ||
                       !appPath.includes('node_modules')
    
    let basePath: string
    
    if (isInstalled) {
      // 安装版本：使用应用数据目录
      basePath = path.join(app.getPath('appData'), app.getName())
    } else {
      // 开发版本：使用用户目录下的AppData/HdSome
      basePath = path.join(os.homedir(), 'AppData', 'HdSome')
    }
    
    // 创建必要的文件夹结构
    const folders = ['messages', 'audio', 'images', 'videos', 'files']
    for (const folder of folders) {
      const folderPath = path.join(basePath, folder)
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }
    }
    
    return {
      basePath,
      folders: {
        messages: path.join(basePath, 'messages'),
        audio: path.join(basePath, 'audio'),
        images: path.join(basePath, 'images'),
        videos: path.join(basePath, 'videos'),
        files: path.join(basePath, 'files')
      }
    }
  } catch (error) {
    console.error('Failed to get app data path:', error)
    throw error
  }
})

// 保存文件
ipcMain.handle('save-file', async (event, { data, fileName, fileType, encoding = 'utf8' }) => {
  try {
    // 获取应用数据路径
    const appPath = app.getAppPath()
    const isInstalled = appPath.includes('Program Files') || 
                       appPath.includes('Program Files (x86)') ||
                       !appPath.includes('node_modules')
    
    let basePath: string
    if (isInstalled) {
      basePath = path.join(app.getPath('appData'), app.getName())
    } else {
      basePath = path.join(os.homedir(), 'AppData', 'HdSome')
    }
    
    const folders = {
      messages: path.join(basePath, 'messages'),
      audio: path.join(basePath, 'audio'),
      images: path.join(basePath, 'images'),
      videos: path.join(basePath, 'videos'),
      files: path.join(basePath, 'files')
    }
    
    // 根据文件类型确定保存路径
    let targetFolder: string
    switch (fileType) {
      case 'message':
        targetFolder = folders.messages
        break
      case 'audio':
        targetFolder = folders.audio
        break
      case 'image':
        targetFolder = folders.images
        break
      case 'video':
        targetFolder = folders.videos
        break
      case 'file':
      default:
        targetFolder = folders.files
        break
    }
    
    const filePath = path.join(targetFolder, fileName)
    
    // 确保目录存在
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true })
    }
    
    // 根据数据类型保存文件
    if (typeof data === 'string') {
      // 文本数据
      fs.writeFileSync(filePath, data, encoding)
    } else if (Buffer.isBuffer(data)) {
      // Buffer数据
      fs.writeFileSync(filePath, data)
    } else if (data instanceof Uint8Array) {
      // Uint8Array数据
      fs.writeFileSync(filePath, Buffer.from(data))
    } else {
      // 其他数据类型，尝试JSON序列化
      fs.writeFileSync(filePath, JSON.stringify(data), encoding)
    }
    
    return {
      success: true,
      filePath,
      message: `文件已保存到: ${filePath}`
    }
  } catch (error) {
    console.error('Failed to save file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: '文件保存失败'
    }
  }
})

// 读取文件
ipcMain.handle('read-file', async (event, { fileName, fileType, encoding = 'utf8' }) => {
  try {
    // 获取应用数据路径
    const appPath = app.getAppPath()
    const isInstalled = appPath.includes('Program Files') || 
                       appPath.includes('Program Files (x86)') ||
                       !appPath.includes('node_modules')
    
    let basePath: string
    if (isInstalled) {
      basePath = path.join(app.getPath('appData'), app.getName())
    } else {
      basePath = path.join(os.homedir(), 'AppData', 'HdSome')
    }
    
    const folders = {
      messages: path.join(basePath, 'messages'),
      audio: path.join(basePath, 'audio'),
      images: path.join(basePath, 'images'),
      videos: path.join(basePath, 'videos'),
      files: path.join(basePath, 'files')
    }
    
    // 根据文件类型确定读取路径
    let targetFolder: string
    switch (fileType) {
      case 'message':
        targetFolder = folders.messages
        break
      case 'audio':
        targetFolder = folders.audio
        break
      case 'image':
        targetFolder = folders.images
        break
      case 'video':
        targetFolder = folders.videos
        break
      case 'file':
      default:
        targetFolder = folders.files
        break
    }
    
    const filePath = path.join(targetFolder, fileName)
    
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在')
    }
    
    const data = fs.readFileSync(filePath, encoding)
    
    return {
      success: true,
      data,
      filePath,
      message: '文件读取成功'
    }
  } catch (error) {
    console.error('Failed to read file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: '文件读取失败'
    }
  }
})

// 列出指定类型的所有文件
ipcMain.handle('list-files', async (event, { fileType }) => {
  try {
    // 获取应用数据路径
    const appPath = app.getAppPath()
    const isInstalled = appPath.includes('Program Files') || 
                       appPath.includes('Program Files (x86)') ||
                       !appPath.includes('node_modules')
    
    let basePath: string
    if (isInstalled) {
      basePath = path.join(app.getPath('appData'), app.getName())
    } else {
      basePath = path.join(os.homedir(), 'AppData', 'HdSome')
    }
    
    const folders = {
      messages: path.join(basePath, 'messages'),
      audio: path.join(basePath, 'audio'),
      images: path.join(basePath, 'images'),
      videos: path.join(basePath, 'videos'),
      files: path.join(basePath, 'files')
    }
    
    // 根据文件类型确定目录
    let targetFolder: string
    switch (fileType) {
      case 'message':
        targetFolder = folders.messages
        break
      case 'audio':
        targetFolder = folders.audio
        break
      case 'image':
        targetFolder = folders.images
        break
      case 'video':
        targetFolder = folders.videos
        break
      case 'file':
      default:
        targetFolder = folders.files
        break
    }
    
    if (!fs.existsSync(targetFolder)) {
      return {
        success: true,
        files: [],
        message: '目录不存在，返回空列表'
      }
    }
    
    const files = fs.readdirSync(targetFolder).map(fileName => {
      const filePath = path.join(targetFolder, fileName)
      const stats = fs.statSync(filePath)
      return {
        name: fileName,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      }
    })
    
    return {
      success: true,
      files,
      message: `找到 ${files.length} 个文件`
    }
  } catch (error) {
    console.error('Failed to list files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: '文件列表获取失败'
    }
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()
  
  // 注意：媒体访问权限和显示媒体请求处理器已在setup-media-access中设置
})
