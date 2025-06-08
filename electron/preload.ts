import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- Expose electronAPI for window controls ---------
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
  captureRegionScreenshot: () => ipcRenderer.invoke('capture-region-screenshot'),
  // 屏幕录制相关API
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  isScreenRecordingSupported: () => ipcRenderer.invoke('is-screen-recording-supported'),
  setupMediaAccess: () => ipcRenderer.invoke('setup-media-access'),
  sendRegionSelection: (region: any) => ipcRenderer.send('region-selected', region),
  cancelRegionSelection: () => ipcRenderer.send('region-selection-cancelled'),
  
  // 配置文件功能
  getConfigPath: () => ipcRenderer.invoke('get-config-path'),
  readConfig: () => ipcRenderer.invoke('read-config'),
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
  
  // 文件保存相关API
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  saveFile: (options: {
    data: string | Buffer | Uint8Array | any,
    fileName: string,
    fileType: 'message' | 'audio' | 'image' | 'video' | 'file',
    encoding?: string
  }) => ipcRenderer.invoke('save-file', options),
  readFile: (options: {
    fileName: string,
    fileType: 'message' | 'audio' | 'image' | 'video' | 'file',
    encoding?: string
  }) => ipcRenderer.invoke('read-file', options),
  listFiles: (options: {
    fileType: 'message' | 'audio' | 'image' | 'video' | 'file'
  }) => ipcRenderer.invoke('list-files', options),
})
