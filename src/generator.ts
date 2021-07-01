import fs from 'fs'
import path from 'path'
import { safeLoad } from 'js-yaml'
import { stripIndents } from 'common-tags'

export enum Format {
  Series8,
  Series9,
  Series10,
}

const setData = safeLoad(
  fs.readFileSync(path.join(__dirname, 'sets.yml'), 'utf8'),
) as SetData[]

type SetData = {
  pokemon: string
  item: string | string[]
  ability: string | string[]
  spread: string
  moves: (string | string[])[]
  roles: string[][]
}

type GeneratedSetData = {
  pokemon: string
  item: string
  ability: string
  spread: string
  moves: string[]
  roles: string[][]
  export: string
}

class Requirement {
  constructor(public test: (set: SetData) => boolean) {}

  testIn(sets: Iterable<SetData>) {
    for (const set of sets) {
      if (this.test(set)) return true
    }

    return false
  }
  countIn(sets: Iterable<SetData>) {
    let count = 0

    for (const set of sets) {
      if (this.test(set)) count++
    }

    return count
  }

  static restricted() {
    return Requirement.role('restricted')
  }
  static dynamax() {
    return Requirement.role('dynamax')
  }
  static offense() {
    return Requirement.role('offense')
  }
  static support() {
    return Requirement.role('support')
  }
  static weather(weather?: string) {
    return weather
      ? Requirement.or(
          Requirement.role(null, 'weather', weather),
          Requirement.not(Requirement.role(null, 'weather')),
        )
      : Requirement.none()
  }
  static noTRSetters() {
    return Requirement.not(Requirement.role('speed', 'trickroom'))
  }
  static noTRUsers() {
    return Requirement.not(Requirement.role('offense', 'trickroom'))
  }
  static noWPProccers() {
    return Requirement.not(Requirement.role('support', 'policy'))
  }
  static noWPUsers() {
    return Requirement.not(Requirement.role('offense', 'policy'))
  }
  static noAdditionalTR(sets: GeneratedSetData[]) {
    return this.noTRSetters().testIn(sets)
      ? Requirement.noTRUsers()
      : Requirement.none()
  }
  static noAdditionalWeather(sets: GeneratedSetData[]) {
    return findWeather(sets)
      ? Requirement.weather(findWeather(sets))
      : Requirement.not(Requirement.role('offense', 'weather'))
  }

  static itemClause(items: string[]) {
    return new Requirement(set =>
      Array.isArray(set.item)
        ? set.item.findIndex(item => !items.includes(item)) !== -1
        : !items.includes(set.item),
    )
  }
  static role(...role: (string | string[])[]) {
    return new Requirement(
      set =>
        set.roles.findIndex((setRole, index) => {
          let allow = true

          for (let i = 0; i < role.length; i++) {
            if (role[i] === null) {
              continue
            } else if (Array.isArray(role[i])) {
              if (!role[i].includes(setRole[i])) {
                allow = false
                break
              }
            } else if (role[i] !== setRole[i]) {
              allow = false
              break
            }
          }

          return allow
        }) !== -1,
    )
  }
  static not(requirement: Requirement) {
    return new Requirement(set => !requirement.test(set))
  }
  static and(...requirements: Requirement[]) {
    return new Requirement(
      set =>
        requirements.findIndex(requirement => !requirement.test(set)) === -1,
    )
  }
  static or(...requirements: Requirement[]) {
    return new Requirement(
      set =>
        requirements.findIndex(requirement => requirement.test(set)) !== -1,
    )
  }
  static none() {
    return new Requirement(() => true)
  }
}

function generateSet(set: SetData, usedItems: string[]) {
  // The Pokémon and roles will always be constant
  const randomSet: Partial<GeneratedSetData> = {
    pokemon: set.pokemon,
    roles: set.roles,
  }

  // If the item is an array, pick a random item from the array that hasn't already been used
  if (Array.isArray(set.item)) {
    const items = set.item.filter(item => !usedItems.includes(item))

    randomSet.item = items[Math.floor(Math.random() * items.length)]
  } else {
    randomSet.item = set.item
  }

  // If the ability is an array, pick a random ability from the array
  if (Array.isArray(set.ability)) {
    randomSet.ability =
      set.ability[Math.floor(Math.random() * set.ability.length)]
  } else {
    randomSet.ability = set.ability
  }

  // If the spread is an array, pick a random spread from the array
  if (Array.isArray(set.spread)) {
    randomSet.spread = set.spread[Math.floor(Math.random() * set.spread.length)]
  } else {
    randomSet.spread = set.spread
  }

  randomSet.moves = generateMoves(set.moves)

  randomSet.export = stripIndents`
  ${randomSet.pokemon} @ ${randomSet.item}
  Ability: ${randomSet.ability}
  Level: 50${Math.random() < 1 / 4096 ? '\nShiny: Yes' : ''}
  ${randomSet.spread.trim()}
  - ${randomSet.moves[0]}
  - ${randomSet.moves[1]}
  - ${randomSet.moves[2]}
  - ${randomSet.moves[3]}`

  return randomSet as GeneratedSetData
}

function generateMoves(moves: (string | string[])[], amount: number = 4) {
  const moveChoices = moves
  while (moveChoices.length > amount) {
    // Remove random moves until only the desired amount remains
    moveChoices.splice(Math.floor(Math.random() * moveChoices.length), 1)
  }

  moveChoices.forEach((choice: any, index: number) => {
    // If the move slot is an array, select a random move from the array
    if (Array.isArray(choice)) {
      let moveChoice
      do {
        moveChoice = generateMoves([...choice], 1)[0]

        // Ensure that the move has not already been selected
      } while (moveChoices.includes(moveChoice))
      moveChoices[index] = moveChoice
    }
  })

  return moveChoices as string[]
}

export default function generate(format: Format) {
  let sets: GeneratedSetData[] = []
  const species = new Set(setData.map(set => set.pokemon.replace(/-.+$/, '')))
  const usedItems: string[] = []

  switch (format) {
    case Format.Series8:
    case Format.Series10:
      // The first Pokémon must be a restricted legendary
      sets.push(
        generatePokemon(
          // The weather requirement is skipped since the team is empty,
          // so no weather could have been established
          // There are also no weakness policy proccing restricted Pokémon,
          // so that requirement is also omitted
          Requirement.and(Requirement.restricted()),
          species,
          usedItems,
        ),
      )

    case Format.Series9:
      // The first Pokémon is an offensive pokemon
      sets.push(
        generatePokemon(
          // The weather requirement is skipped; see above
          Requirement.and(
            Requirement.offense(),
            Requirement.not(Requirement.restricted()),
          ),
          species,
          usedItems,
        ),
      )
  }

  // Add an offensive Pokémon in the second slot
  sets.push(
    generatePokemon(
      Requirement.and(
        // Check if the first Pokémon was a dynamax target
        // If it wasn't, force the second Pokémon to be a dynamax target
        Requirement.dynamax().test(sets[0]) &&
          // Additionally, skip this check in series 10 since there is no dynamax
          format != Format.Series10
          ? Requirement.offense()
          : Requirement.dynamax(),

        // From this point on, Pokémon cannot summon or rely on a different
        // weather if one of the earlier generated Pokémon already summons or
        // relies on a different weather
        Requirement.weather(findWeather(sets)),
        // Weakness policy proccers will also not be allowed to be selected,
        // with the exception of the fifth slot
        Requirement.noWPProccers(),
        // We must also ensure that no other Pokémon are restricted legendareis
        Requirement.not(Requirement.restricted()),
      ),
      species,
      usedItems,
    ),
  )

  // Generate two random Pokémon (no added restrictions)
  for (let i = 0; i < 2; i++) {
    sets.push(
      generatePokemon(
        Requirement.and(
          Requirement.weather(findWeather(sets)),
          Requirement.noWPProccers(),
          Requirement.not(Requirement.restricted()),
        ),
        species,
        usedItems,
      ),
    )
  }

  {
    // Fifth slot
    // Find all remaining available sets
    const availableSets = setData.filter(set =>
      species.has(set.pokemon.replace(/-.+$/, '')),
    )
    if (Requirement.role('offense', 'policy').testIn(sets)) {
      const policyType = findPolicyTypes(sets)
      if (
        Requirement.role('offense', 'trickroom').testIn(sets) &&
        !Requirement.role('speed', 'trickroom').testIn(sets)
      ) {
        // If the team requires weakness policy and trick room support,
        // try to find a Pokémon that satisfies both requirements
        if (
          Requirement.and(
            Requirement.weather(findWeather(sets)),
            Requirement.role('speed', 'trickroom'),
            Requirement.role('support', 'policy', policyType),
            Requirement.not(Requirement.restricted()),
          ).testIn(availableSets)
        ) {
          // If one exists, generate it
          sets.push(
            generatePokemon(
              Requirement.and(
                Requirement.weather(findWeather(sets)),
                Requirement.role('speed', 'trickroom'),
                Requirement.role('support', 'policy', policyType),
                Requirement.not(Requirement.restricted()),
              ),
              species,
              usedItems,
            ),
          )
        }
      } else {
        // If there is no need for trick room, no extra steps are needed
        // Just generate the weakness policy proccer
        sets.push(
          generatePokemon(
            Requirement.and(
              Requirement.weather(findWeather(sets)),
              Requirement.not(Requirement.restricted()),
              Requirement.noTRSetters(), // Specifically disallow trick room setters from appearing
              Requirement.role('support', 'policy', policyType),
            ),
            species,
            usedItems,
          ),
        )
      }
    } else if (
      Requirement.role('speed', 'trickroom').testIn(sets) &&
      !Requirement.role('offense', 'trickroom').testIn(sets)
    ) {
      // If the team has a trick room Pokémon with no trick room setter, add one
      sets.push(
        generatePokemon(
          Requirement.and(
            Requirement.weather(findWeather(sets)),
            Requirement.noWPProccers(),
            Requirement.not(Requirement.restricted()),
            Requirement.role('speed', 'trickroom'),
          ),
          species,
          usedItems,
        ),
      )
    } else if (
      Requirement.role('speed', 'trickroom').testIn(sets) &&
      !Requirement.role('offense', 'trickroom').testIn(sets)
    ) {
      // If the team has a trick room setter with no trick room Pokémon, add one
      sets.push(
        generatePokemon(
          Requirement.and(
            Requirement.weather(findWeather(sets)),
            Requirement.noWPProccers(),
            Requirement.not(Requirement.restricted()),
            Requirement.role('offense', 'trickroom'),
          ),
          species,
          usedItems,
        ),
      )
    } else if (Requirement.support().countIn(sets) < 2) {
      // If the team has less than 2 support Pokémon, add another
      // support Pokémon
      sets.push(
        generatePokemon(
          Requirement.and(
            Requirement.weather(findWeather(sets)),
            Requirement.noWPProccers(),
            Requirement.not(Requirement.restricted()),
            Requirement.support(),
          ),
          species,
          usedItems,
        ),
      )
    } else {
      // If none of the above conditions apply, just generate
      // another random Pokémon
      sets.push(
        generatePokemon(
          Requirement.and(
            Requirement.weather(findWeather(sets)),
            Requirement.noWPProccers(),
            Requirement.not(Requirement.restricted()),
            // At this point, do not add new trick room setters,
            // and do not add trick room Pokémon unless trick room
            // is already on the team
            Requirement.noTRSetters(),
            Requirement.noAdditionalTR(sets),
            // Also, do not add any new Weakness Policy Pokémon
            // at this point
            Requirement.noWPUsers(),
          ),
          species,
          usedItems,
        ),
      )
    }
  }

  {
    // Sixth slot

    if (
      findWeather(sets) &&
      !Requirement.role('speed', 'weather', findWeather(sets)).testIn(sets)
    ) {
      // If the team needs weather support, add it
      sets.push(
        generatePokemon(
          Requirement.and(
            Requirement.role('speed', 'weather', findWeather(sets)),
            Requirement.noWPProccers(),
            Requirement.not(Requirement.restricted()),
            Requirement.noTRSetters(),
            Requirement.noAdditionalTR(sets),
            Requirement.noWPUsers(),
          ),
          species,
          usedItems,
        ),
      )
    } else if (
      Requirement.role('speed', 'trickroom').testIn(sets) &&
      !Requirement.role('offense', 'trickroom').testIn(sets)
    ) {
      // If the team has a trick room Pokémon with no trick room setter, add one
      // This may not have been achieved in the previous slot due to the possibility
      // of having a weakness policy proccer in that slot instead
      sets.push(
        generatePokemon(
          Requirement.and(
            Requirement.weather(findWeather(sets)),
            Requirement.noWPProccers(),
            Requirement.not(Requirement.restricted()),
            Requirement.role('speed', 'trickroom'),
            Requirement.noWPUsers(),
          ),
          species,
          usedItems,
        ),
      )
    } else if (
      Requirement.role('speed', 'trickroom').testIn(sets) &&
      !Requirement.role('offense', 'trickroom').testIn(sets)
    ) {
      // If the team has a trick room setter with no trick room Pokémon, add one
      // Similarly to above, this may have been omitted in the previous slot
      sets.push(
        generatePokemon(
          Requirement.and(
            Requirement.weather(findWeather(sets)),
            Requirement.noWPProccers(),
            Requirement.not(Requirement.restricted()),
            Requirement.role('offense', 'trickroom'),
            Requirement.noWPUsers(),
          ),
          species,
          usedItems,
        ),
      )
    } else {
      // If none of the above conditions apply, just generate
      // another random Pokémon
      sets.push(
        generatePokemon(
          Requirement.and(
            Requirement.weather(findWeather(sets)),
            Requirement.noWPProccers(),
            Requirement.not(Requirement.restricted()),
            Requirement.noTRSetters(),
            Requirement.noAdditionalTR(sets),
            Requirement.noWPUsers(),
            // Ensure the last Pokémon does not rely on a new weather,
            // as no weather Pokémon will be added
            Requirement.noAdditionalWeather(sets),
          ),
          species,
          usedItems,
        ),
      )
    }
  }

  if (process.env.NODE_ENV === 'production') {
    // Randomize the order of the Pokémon
    // This step is skipped in development to make it easier to recognize
    // how each Pokémon has been generated
    const shuffledSets = []
    for (let i = 0; i < 6; i++) {
      const index = Math.floor(Math.random() * sets.length)
      shuffledSets.push(sets[index])
      sets.splice(index, 1)
    }
    sets = shuffledSets
  }

  return sets.map(set => set.export).join('\n\n')
}

function generatePokemon(
  requirements: Requirement,
  species: Set<string>,
  usedItems: string[],
) {
  // Create a copy of the set of available species
  const availableSpecies = new Set(species)

  // Include Item Clause as a requirement
  requirements = Requirement.and(
    Requirement.itemClause(usedItems),
    requirements,
  )

  while (true) {
    // Select a random species from the set of available species
    const speciesArray = [...availableSpecies.values()]
    const speciesName =
      speciesArray[Math.floor(Math.random() * speciesArray.length)]

    if (!speciesName) {
      throw new Error('No species found')
    }

    const speciesSets = setData.filter(
      set =>
        set.pokemon.startsWith(speciesName) && // Find all the sets for the species
        requirements.test(set), // and select only the ones that match the requirements
    )

    if (speciesSets.length === 0) {
      // If no sets were found, remove the species and try another one
      availableSpecies.delete(speciesName)
      continue
    }

    // Select a random set to use
    const set = speciesSets[Math.floor(Math.random() * speciesSets.length)]

    // Remove the species from the global set of species (Species Clause)
    species.delete(speciesName)

    // Generate a set and add its item to the item array before returning
    const generatedSet = generateSet(set, usedItems)
    usedItems.push(generatedSet.item)

    return generatedSet
  }
}

function findWeather(sets: Iterable<SetData>) {
  for (const set of sets) {
    const role = set.roles.find(role => role[1] === 'weather')

    if (role) return role[2]
  }

  return null
}

function findPolicyTypes(sets: Iterable<SetData>) {
  const types = new Set<string>()

  for (const set of sets) {
    set.roles.forEach(role => {
      if (role[0] === 'offense' && role[1] === 'policy') {
        types.add(role[2])
      }
    })
  }

  return [...types.values()]
}
