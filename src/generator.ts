import fs from 'fs'
import path from 'path'
import { safeLoad } from 'js-yaml'
import { stripIndents } from 'common-tags'

type SetData = {
  pokemon: string
  item: string | string[]
  ability: string | string[]
  spread: string
  moves: string[] | string[][]
  roles: string[][]
}

const sets = safeLoad(
  fs.readFileSync(path.join(__dirname, 'sets.yml'), 'utf8')
) as SetData[]
const species = new Set([...sets].map(set => set.pokemon.split('-')[0]))

let weather: string = null

function generateSet(set: SetData, usedItems: string[]) {
  const randomSet: Partial<SetData> & { export?: string } = {
    pokemon: set.pokemon,
    roles: set.roles,
  }

  if (Array.isArray(set.item)) {
    const items = set.item.filter(item => !usedItems.includes(item))

    randomSet.item = items[Math.floor(Math.random() * items.length)]
  } else {
    randomSet.item = set.item
  }

  if (Array.isArray(set.ability)) {
    randomSet.ability =
      set.ability[Math.floor(Math.random() * set.ability.length)]
  } else {
    randomSet.ability = set.ability
  }

  if (Array.isArray(set.spread)) {
    randomSet.spread = set.spread[Math.floor(Math.random() * set.spread.length)]
  } else {
    randomSet.spread = set.spread
  }

  randomSet.moves = generateMoves(set.moves)

  randomSet.export = stripIndents`
  ${randomSet.pokemon} @ ${randomSet.item}
  Ability: ${randomSet.ability}
  Level: 50
  ${randomSet.spread.trim()}
  - ${randomSet.moves[0]}
  - ${randomSet.moves[1]}
  - ${randomSet.moves[2]}
  - ${randomSet.moves[3]}`

  const weatherIndex = set.roles.findIndex(role => role[1] === 'weather')
  if (weatherIndex !== -1) {
    weather = set.roles[weatherIndex][2]
  }

  return randomSet as SetData & { export?: string }
}

function generateMoves(moves: string[] | string[][], amount: number = 4) {
  const moveChoices = moves
  while (moveChoices.length > amount) {
    moveChoices.splice(Math.floor(Math.random() * moveChoices.length), 1)
  }

  moveChoices.forEach((choice: any, index: number) => {
    if (Array.isArray(choice)) {
      let moveChoice
      do {
        moveChoice = generateMoves([...choice], 1)[0]
      } while (moveChoices.includes(moveChoice as any))
      moveChoices[index] = moveChoice
    } else {
    }
  })

  return moveChoices as string[]
}

function generate() {
  const pokemon: SetData[] = []
  const items: string[] = []

  {
    let generatedPokemon: SetData | false
    while (!generatedPokemon) {
      console.log(`Picking offensive pokemon`)
      generatedPokemon = generatePokemon(
        items,
        ({ roles }) => roles.findIndex(role => role[0] === 'offense') !== -1
      )
    }
    pokemon.push(generatedPokemon)
    items.push(generatedPokemon.item as string)
  }
  {
    let generatedPokemon: SetData | false
    while (!generatedPokemon) {
      console.log(`Picking dynamax pokemon`)
      generatedPokemon = generatePokemon(
        items,
        ({ roles }) => roles.findIndex(role => role[0] === 'dynamax') !== -1
      )
    }
    pokemon.push(generatedPokemon)
    items.push(generatedPokemon.item as string)
  }
  for (let i = 0; i < 2; i++) {
    let generatedPokemon: SetData | false
    while (!generatedPokemon) {
      console.log(`Picking random pokemon #${i + 1}`)
      generatedPokemon = generatePokemon(items)
    }
    pokemon.push(generatedPokemon)
    items.push(generatedPokemon.item as string)
  }

  let generatedPokemon: SetData | false
  while (!generatedPokemon) {
    if (
      pokemon.findIndex(
        ({ roles }) =>
          roles.findIndex(
            role => role[0] === 'offense' && role[1] === 'weather'
          ) !== -1
      ) !== -1 &&
      pokemon.findIndex(
        ({ roles }) =>
          roles.findIndex(
            role => role[0] === 'speed' && role[1] === 'weather'
          ) !== -1
      ) === -1
    ) {
      console.log(`Picking weather setter: ${weather}`)
      generatedPokemon = generatePokemon(
        items,
        ({ roles }) =>
          roles.findIndex(
            role =>
              role[0] === 'speed' &&
              role[1] === 'weather' &&
              role[2] === weather
          ) !== -1
      )
    } else if (
      pokemon.findIndex(
        ({ roles }) =>
          roles.findIndex(
            role => role[0] === 'offense' && role[1] === 'trickroom'
          ) !== -1
      ) !== -1
    ) {
      if (findPolicyAndTrickRoomUser(pokemon)) {
        console.log('Picking WP + TR user')
        generatedPokemon = generatePokemon(
          items,
          ({ roles }) =>
            roles.findIndex(
              role => role[0] === 'speed' && role[1] === 'trickroom'
            ) !== -1 &&
            roles.findIndex(
              role =>
                role[0] === 'support' &&
                role[1] === 'policy' &&
                findPolicyTypes(pokemon).includes(role[2])
            ) !== -1
        )
      } else if (
        pokemon.findIndex(
          ({ roles }) =>
            roles.findIndex(
              role => role[0] === 'speed' && role[1] === 'trickroom'
            ) !== -1 &&
            roles.findIndex(
              role => role[0] === 'support' && role[1] === 'policy'
            ) === -1
        ) === -1
      ) {
        console.log('Picking TR user')
        generatedPokemon = generatePokemon(
          items,
          ({ roles }) =>
            roles.findIndex(
              role => role[0] === 'speed' && role[1] === 'trickroom'
            ) !== -1
        )
      } else {
        console.log('Picking random pokemon (speed control/policy slot)')
        generatedPokemon = generatePokemon(
          items,
          set =>
            set.roles.findIndex(role => role[1] === 'policy') === -1 &&
            set.roles.findIndex(role => role[1] === 'trickroom') !== -1
        )
      }
    } else if (
      pokemon.findIndex(
        ({ roles }) =>
          roles.findIndex(
            role => role[0] === 'offense' && role[1] === 'policy'
          ) !== -1
      ) !== -1 &&
      pokemon.findIndex(
        ({ roles }) =>
          roles.findIndex(
            role => role[0] === 'support' && role[1] === 'policy'
          ) !== -1
      ) === -1
    ) {
      console.log('Picking WP proccer')
      generatedPokemon = generatePokemon(
        items,
        ({ roles }) =>
          roles.findIndex(
            role =>
              role[0] === 'support' &&
              role[1] === 'policy' &&
              findPolicyTypes(pokemon).includes(role[2])
          ) !== -1
      )
    } else {
      console.log('Picking random pokemon (speed control/policy slot)')
      generatedPokemon = generatePokemon(
        items,
        set =>
          set.roles.findIndex(role => role[1] === 'policy') === -1 &&
          set.roles.findIndex(role => role[1] === 'trickroom') === -1
      )
    }
  }
  pokemon.push(generatedPokemon)
  items.push(generatedPokemon.item as string)

  do {
    if (
      pokemon.findIndex(
        ({ roles }) => roles.findIndex(role => role[0] === 'support') !== -1
      ) === -1
    ) {
      console.log('Picking support pokemon')
      generatedPokemon = generatePokemon(
        items,
        set =>
          set.roles.findIndex(role => role[0] === 'support') !== -1 &&
          set.roles.findIndex(role => role[1] === 'policy') === -1 &&
          set.roles.findIndex(role => role[1] === 'trickroom') === -1
      )
    } else if (
      pokemon.filter(
        ({ roles }) =>
          roles.findIndex(
            role => role[0] === 'support' //  || role[0] === 'speed'
          ) !== -1
      ).length >= 2
    ) {
      console.log(
        'Picking non-support pokemon (too many support pokemon already picked)'
      )
      generatedPokemon = generatePokemon(
        items,
        set => set.roles.findIndex(role => role[0] === 'support') === -1
      )
    } else {
      console.log('Picking random pokemon (support slot)')
      generatedPokemon = generatePokemon(
        items,
        set =>
          set.roles.findIndex(role => role[1] === 'policy') === -1 &&
          set.roles.findIndex(role => role[1] === 'trickroom') === -1
      )
    }
  } while (!generatedPokemon)

  pokemon.push(generatedPokemon)

  return {
    data: pokemon,
    export: (pokemon as any).map((set: any) => set.export).join('\n\n'),
  }
}

function findPolicyAndTrickRoomUser(pokemon: SetData[]) {
  return (
    pokemon.findIndex(
      ({ roles }) =>
        roles.findIndex(
          role => role[0] === 'offense' && role[1] === 'policy'
        ) !== -1
    ) !== -1 &&
    sets.findIndex(
      set =>
        species.has(set.pokemon.split('-')[0]) &&
        set.roles.findIndex(
          role =>
            role[0] === 'support' &&
            role[1] === 'policy' &&
            findPolicyTypes(pokemon).includes(role[2])
        ) !== -1
    ) !== -1
  )
}

function findPolicyTypes(pokemon: SetData[]) {
  return pokemon
    .find(({ roles }) =>
      roles.find(role => role[0] === 'offense' && role[1] === 'policy')
    )
    .roles.filter(role => role[0] === 'offense' && role[1] === 'policy')
    .map(role => role[2])
}

function generatePokemon(
  usedItems: string[],
  requirement: (set: SetData) => boolean = set =>
    set.roles.findIndex(
      role =>
        (role[0] === 'support' || role[0] === 'speed') &&
        (role[1] === 'policy' || role[1] === 'trickroom')
    ) === -1
): SetData | false {
  const randomSpecies = [...species.values()][
    Math.floor(Math.random() * species.size)
  ]

  console.log(`Finding sets... ${randomSpecies}`)
  const possibleSets = sets
    .filter(({ pokemon }) => pokemon.split('-')[0] === randomSpecies)
    .filter(({ item }) =>
      Array.isArray(item)
        ? item.findIndex(item => !usedItems.includes(item)) !== -1
        : !usedItems.includes(item)
    )
    .filter(
      ({ roles }) =>
        weather === null ||
        roles.findIndex(role => role[1] === 'weather') === -1 ||
        roles.findIndex(
          role => role[1] === 'weather' && role[2] === weather
        ) !== -1
    )
    .filter(requirement)

  if (possibleSets.length) {
    species.delete(randomSpecies)
    console.log('Found set. Generating...\n')

    return generateSet(
      possibleSets[Math.floor(Math.random() * possibleSets.length)],
      usedItems
    )
  } else {
    console.log('No available sets!')
    return false
  }
}

const team = generate()
console.log('\n\n===============================\n\n')
console.log(team.export)

document.getElementById('paste').textContent = team.export
