let settings = {}

function setToggle(el, value) {
  el.classList.toggle('on', !!value)
}

async function init() {
  settings = await window.qvoiceSettings.getSettings()

  document.getElementById('whisperModel').value = settings.whisperModel
  document.getElementById('llmRepo').value       = settings.llmRepo
  document.getElementById('llmFile').value       = settings.llmFile
  document.getElementById('systemPrompt').value  = settings.systemPrompt
  document.getElementById('beamSize').value      = settings.beamSize

  setToggle(document.getElementById('toggle-correction'), settings.correctionEnabled)
  setToggle(document.getElementById('toggle-autopaste'),  settings.autoPaste)
}

document.getElementById('toggle-correction').addEventListener('click', (e) => {
  settings.correctionEnabled = !settings.correctionEnabled
  setToggle(e.currentTarget, settings.correctionEnabled)
})

document.getElementById('toggle-autopaste').addEventListener('click', (e) => {
  settings.autoPaste = !settings.autoPaste
  setToggle(e.currentTarget, settings.autoPaste)
})

document.getElementById('btn-save').addEventListener('click', async () => {
  const btn = document.getElementById('btn-save')
  if (btn.classList.contains('saved')) return

  const newSettings = {
    whisperModel:      document.getElementById('whisperModel').value,
    llmRepo:           document.getElementById('llmRepo').value.trim(),
    llmFile:           document.getElementById('llmFile').value.trim(),
    systemPrompt:      document.getElementById('systemPrompt').value.trim(),
    beamSize:          Math.max(1, Math.min(10, parseInt(document.getElementById('beamSize').value, 10) || 5)),
    correctionEnabled: settings.correctionEnabled,
    autoPaste:         settings.autoPaste,
  }

  await window.qvoiceSettings.saveSettings(newSettings)
  settings = { ...settings, ...newSettings }

  btn.textContent = 'Saved!'
  btn.classList.add('saved')
  setTimeout(() => {
    btn.textContent = 'Save Settings'
    btn.classList.remove('saved')
  }, 1500)
})

init()
