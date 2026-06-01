const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('qvoice', {
  onServerReady:          (cb) => ipcRenderer.on('server-ready',           () => cb()),
  onShowLoading:          (cb) => ipcRenderer.on('show-loading',           () => cb()),
  onRecordingStart:       (cb) => ipcRenderer.on('recording-start',        () => cb()),
  onRecordingStop:        (cb) => ipcRenderer.on('recording-stop',         () => cb()),
  onTranscriptionProgress:(cb) => ipcRenderer.on('transcription-progress', (_, d) => cb(d)),

  transcribeAudio: (buf) => ipcRenderer.invoke('transcribe-audio', buf),
  resultReady:     (text) => ipcRenderer.send('result-ready', { text }),
  setHeight:       (h)    => ipcRenderer.send('set-height', h),
  hideWindow:      ()     => ipcRenderer.send('hide-window'),
})
