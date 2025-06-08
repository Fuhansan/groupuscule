"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => electron.ipcRenderer.invoke("window-minimize"),
  maximize: () => electron.ipcRenderer.invoke("window-maximize"),
  close: () => electron.ipcRenderer.invoke("window-close"),
  captureScreenshot: () => electron.ipcRenderer.invoke("capture-screenshot"),
  captureRegionScreenshot: () => electron.ipcRenderer.invoke("capture-region-screenshot"),
  // 屏幕录制相关API
  getScreenSources: () => electron.ipcRenderer.invoke("get-screen-sources"),
  isScreenRecordingSupported: () => electron.ipcRenderer.invoke("is-screen-recording-supported"),
  setupMediaAccess: () => electron.ipcRenderer.invoke("setup-media-access"),
  sendRegionSelection: (region) => electron.ipcRenderer.send("region-selected", region),
  cancelRegionSelection: () => electron.ipcRenderer.send("region-selection-cancelled"),
  // 配置文件功能
  getConfigPath: () => electron.ipcRenderer.invoke("get-config-path"),
  readConfig: () => electron.ipcRenderer.invoke("read-config"),
  saveConfig: (config) => electron.ipcRenderer.invoke("save-config", config),
  // 文件保存相关API
  getAppDataPath: () => electron.ipcRenderer.invoke("get-app-data-path"),
  saveFile: (options) => electron.ipcRenderer.invoke("save-file", options),
  readFile: (options) => electron.ipcRenderer.invoke("read-file", options),
  listFiles: (options) => electron.ipcRenderer.invoke("list-files", options)
});
