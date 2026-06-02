const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('qvoiceSettings', {
  getSettings:  ()  => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
})
