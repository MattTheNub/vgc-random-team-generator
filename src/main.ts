// import 'alpinejs'
import generate, { Format } from './generator'

const paste = document.getElementById('paste')
let format = Format.Series8

paste.textContent = generate(format)

{
  let visible = false
  document.getElementById('format-dropdown').addEventListener('click', () => {
    visible = !visible
    document.getElementById('format-dropdown-options').style.display = visible
      ? 'flex'
      : 'none'
  })

  document.getElementById('series-8').addEventListener('click', () => {
    document.getElementById('format-dropdown-options').style.display = 'none'
    document.getElementById('format-dropdown-value').textContent =
      'VGC 2021 Series 8'
    format = Format.Series8
  })

  document.getElementById('series-9').addEventListener('click', () => {
    document.getElementById('format-dropdown-options').style.display = 'none'
    document.getElementById('format-dropdown-value').textContent =
      'VGC 2021 Series 9'
    format = Format.Series9
  })
}

document.getElementById('generate-button').addEventListener('click', () => {
  paste.textContent = generate(format)
})
