const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('qvoice', {
  onServerReady:   (cb) => ipcRenderer.on('server-ready',    () => cb()),
  onShowLoading:   (cb) => ipcRenderer.on('show-loading',    () => cb()),
  onRecordingStart:(cb) => ipcRenderer.on('recording-start', () => cb()),
  onRecordingStop: (cb) => ipcRenderer.on('recording-stop',  () => cb()),

  transcribeAudio: (buf) => ipcRenderer.invoke('transcribe-audio', buf),
  resultReady:     (text, height) => ipcRenderer.send('result-ready', { text, height }),
  setHeight:       (h)    => ipcRenderer.send('set-height', h),
  hideWindow:      ()     => ipcRenderer.send('hide-window'),
})
