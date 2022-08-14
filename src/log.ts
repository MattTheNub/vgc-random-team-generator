import { stripIndents } from 'common-tags'
import { GeneratedSetData, Requirement } from './generator'

export default class GeneratorLog {
  setLog = ''

  constructor(public sets: GeneratedSetData[]) {}

  beginSet(requirements: Requirement) {
    this.setLog = `Generating with req: ${requirements.name}\n\n`
  }
  noneFound(species: string) {
    this.setLog += `No sets found for ${species}\n`
  }
  crash(error: string) {
    const crashStr = stripIndents`Error: ${error}

    Current Team:
    ${this.sets.map(set => set.export).join('\n\n')}

    Generator Log:
    ${this.setLog}`

    document.getElementById('crash-report').style.display = 'flex'
    document
      .getElementById('crash-report-link')
      .setAttribute(
        'href',
        `https://github.com/MattTheNub/vgc-random-team-generator/issues/new?title=Generator%20Crashed&body=${encodeURIComponent(
          `Crash Report:\n\`\`\`\n${crashStr}\n\`\`\``,
        )}`,
      )
    console.error(crashStr)
  }
}
