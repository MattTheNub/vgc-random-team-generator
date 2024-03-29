// import 'alpinejs'
import generate, { Format } from './generator'

const paste = document.getElementById('paste')
let format = Format.Series12

paste.textContent = generate(format)

{
  let visible = false
  document.getElementById('format-dropdown').addEventListener('click', () => {
    visible = !visible
    document.getElementById('format-dropdown-options').style.display = visible
      ? 'flex'
      : 'none'
  })

  document.getElementById('series-11').addEventListener('click', () => {
    document.getElementById('format-dropdown-options').style.display = 'none'
    document.getElementById('format-dropdown-value').textContent =
      'VGC 2021 Series 11'
    format = Format.Series11
  })

  document.getElementById('series-12').addEventListener('click', () => {
    document.getElementById('format-dropdown-options').style.display = 'none'
    document.getElementById('format-dropdown-value').textContent =
      'VGC 2022 Series 12'
    format = Format.Series12
  })

  document.getElementById('series-9').addEventListener('click', () => {
    document.getElementById('format-dropdown-options').style.display = 'none'
    document.getElementById('format-dropdown-value').textContent =
      'VGC 2021 Series 9'
    format = Format.Series9
  })

  document.getElementById('series-10').addEventListener('click', () => {
    document.getElementById('format-dropdown-options').style.display = 'none'
    document.getElementById('format-dropdown-value').textContent =
      'VGC 2021 Series 10'
    document.getElementById('series-10-warning').style.display = 'flex'
    format = Format.Series10
  })
}

document.getElementById('generate-button').addEventListener('click', () => {
  paste.textContent = generate(format)
})
