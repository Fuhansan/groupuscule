/// <reference types="vite/client" />

// Electron API types
interface ElectronAPI {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  captureScreenshot: () => Promise<string>
  captureRegionScreenshot: () => Promise<string>
  sendRegionSelection: (region: { x: number, y: number, width: number, height: number }) => void
  cancelRegionSelection: () => void
  // 屏幕录制相关API
  getScreenSources: () => Promise<Array<{id: string, name: string, thumbnail: string}>>
  startScreenRecording: (sourceId: string, options?: {audio?: boolean, video?: {width?: number, height?: number, frameRate?: number}}) => Promise<MediaStream>
  stopScreenRecording: () => Promise<void>
  isScreenRecordingSupported: () => Promise<boolean>
  setupMediaAccess: () => Promise<void>
}

interface IpcRenderer {
  on: (channel: string, func: (...args: any[]) => void) => void
  off: (channel: string, func: (...args: any[]) => void) => void
  send: (channel: string, ...args: any[]) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

interface Window {
  electronAPI: ElectronAPI
  ipcRenderer: IpcRenderer
}