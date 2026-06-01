// ─── WAV Recorder ─────────────────────────────────────────────
// Records 16kHz mono PCM, encodes to WAV — no ffmpeg dependency.
class WavRecorder {
  constructor() {
    this.ctx = null
    this.stream = null
    this.processor = null
    this.analyser = null
    this.chunks = []
    this.RATE = 16000
  }

  async start() {
    this.chunks = []
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: this.RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true }
    })
    this.ctx = new AudioContext({ sampleRate: this.RATE })
    const src = this.ctx.createMediaStreamSource(this.stream)

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256
    src.connect(this.analyser)

    this.processor = this.ctx.createScriptProcessor(4096, 1, 1)
    this.processor.onaudioprocess = (e) => {
      this.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))
    }
    src.connect(this.processor)
    this.processor.connect(this.ctx.destination)

    return this.analyser
  }

  stop() {
    this.processor.disconnect()
    this.stream.getTracks().forEach(t => t.stop())
    this.ctx.close()

    const total = this.chunks.reduce((n, c) => n + c.length, 0)
    const pcm = new Float32Array(total)
    let offset = 0
    for (const c of this.chunks) { pcm.set(c, offset); offset += c.length }

    return this._toWav(pcm, this.RATE)
  }

  _toWav(samples, rate) {
    const buf = new ArrayBuffer(44 + samples.length * 2)
    const v = new DataView(buf)
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }

    str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true)
    str(8, 'WAVE'); str(12, 'fmt ')
    v.setUint32(16, 16, true)        // chunk size
    v.setUint16(20, 1, true)         // PCM
    v.setUint16(22, 1, true)         // mono
    v.setUint32(24, rate, true)      // sample rate
    v.setUint32(28, rate * 2, true)  // byte rate
    v.setUint16(32, 2, true)         // block align
    v.setUint16(34, 16, true)        // bits per sample
    str(36, 'data'); v.setUint32(40, samples.length * 2, true)

    let off = 44
    for (const s of samples) {
      const clamped = Math.max(-1, Math.min(1, s))
      v.setInt16(off, clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF, true)
      off += 2
    }
    return buf
  }
}

// ─── UI ───────────────────────────────────────────────────────
const panel    = document.getElementById('panel')
const states   = { loading: 's-loading', recording: 's-recording', transcribing: 's-transcribing', result: 's-result' }
const waveform = document.getElementById('waveform')
const bars     = waveform.querySelectorAll('.bar')
const resultEl = document.getElementById('result-text')

function showState(name) {
  Object.values(states).forEach(id => document.getElementById(id).classList.add('hidden'))
  document.getElementById(states[name]).classList.remove('hidden')
}

function setHeight(h) {
  window.qvoice.setHeight(h)
}

// ─── Waveform Animation ───────────────────────────────────────
let animFrame = null
const NUM_BARS = bars.length

function startWaveViz(analyser) {
  waveform.classList.remove('idle')
  const data = new Uint8Array(analyser.frequencyBinCount)
  const step = Math.floor(data.length / NUM_BARS)

  function tick() {
    animFrame = requestAnimationFrame(tick)
    analyser.getByteFrequencyData(data)
    for (let i = 0; i < NUM_BARS; i++) {
      let sum = 0
      for (let j = 0; j < step; j++) sum += data[i * step + j]
      const avg = sum / step
      const h = Math.max(3, Math.min(34, (avg / 255) * 38 + 3))
      bars[i].style.height = `${h}px`
    }
  }
  tick()
}

function stopWaveViz() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null }
  waveform.classList.add('idle')
  bars.forEach(b => (b.style.height = '4px'))
}

// ─── Main Logic ───────────────────────────────────────────────
const recorder = new WavRecorder()

// Show loading until server is ready, then hide
showState('loading')

window.qvoice.onServerReady(() => {
  // Window is already hidden between uses; nothing to do here.
  // On next recording, we'll show recording state directly.
})

window.qvoice.onShowLoading(() => {
  showState('loading')
})

window.qvoice.onRecordingStart(async () => {
  showState('recording')
  setHeight(110)

  try {
    const analyser = await recorder.start()
    startWaveViz(analyser)
  } catch (err) {
    console.error('Mic access error:', err)
    window.qvoice.hideWindow()
  }
})

window.qvoice.onRecordingStop(async () => {
  stopWaveViz()
  showState('transcribing')

  let wavBuf
  try {
    wavBuf = recorder.stop()
  } catch (err) {
    console.error('Recorder stop error:', err)
    window.qvoice.hideWindow()
    return
  }

  let result
  try {
    result = await window.qvoice.transcribeAudio(wavBuf)
  } catch (err) {
    console.error('Transcription error:', err)
    window.qvoice.hideWindow()
    return
  }

  if (!result || result.status !== 'ok' || !result.text?.trim()) {
    window.qvoice.hideWindow()
    return
  }

  // Show result
  resultEl.textContent = result.text.trim()
  showState('result')

  // Resize to fit text
  requestAnimationFrame(() => {
    const newH = Math.max(90, panel.scrollHeight + 20)
    setHeight(newH)
    window.qvoice.resultReady(result.text.trim(), newH)
  })

  // Fade out after 3s then hide
  setTimeout(() => {
    panel.classList.remove('entering')
    panel.classList.add('exiting')
    setTimeout(() => {
      panel.classList.remove('exiting')
      panel.classList.add('entering')
      window.qvoice.hideWindow()
    }, 200)
  }, 3000)
})
