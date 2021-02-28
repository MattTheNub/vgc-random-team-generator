import 'alpinejs'
import generate from './generator'

const paste = document.getElementById('paste')

paste.textContent = generate()

document.getElementById('generate-button').addEventListener('click', () => {
  paste.textContent = generate()
})
