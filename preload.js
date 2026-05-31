const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),

  // Data
  readData: (name, defaultVal) => ipcRenderer.invoke('data:read', name, defaultVal),
  writeData: (name, data) => ipcRenderer.invoke('data:write', name, data),

  // Clipboard
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),

  // Dialogs
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
  showInFolder: (p) => ipcRenderer.invoke('shell:showInFolder', p),

  // File system
  readDir: (p) => ipcRenderer.invoke('fs:readDir', p),

  // Notifications
  notify: (title, body) => ipcRenderer.send('notify', { title, body })
});
