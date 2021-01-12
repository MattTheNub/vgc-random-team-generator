import generate from './generator'

const team = generate()

document.getElementById('paste').textContent = team.export
