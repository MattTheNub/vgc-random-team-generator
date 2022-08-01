# Contributing Guide

## Contents

1. [General](#general)
2. [Code Contributions](#code-contributions)
3. [Set Contributions](#set-contributions)

## General

All commit messages should follow the format "Scope: brief description" where "Scope" is either "Generator", "Sets", or "Misc" and "brief description" is a brief description of what was changed or added. An extended description may also be added if it is deemded necessary. Example:

```bash
git commit -am "Generator: Move weather setter to sixth slot

This allows for weather and Trick Room to appear on the same team."
```

## Code Contributions

We use [Prettier](https://prettier.io/) (more specifically, `prettierx`) to format our code. Before commiting, please run `npx prettierx --write src/generator.ts` to ensure that your code is formatted correctly.

## Set Contributions

All movesets are stored using YAML in `src/sets.yml`. Here is a quick run-down of all the keys and what purpose they serve.

### Ordering

Please ensure that all Pokémon are listed in alphabetical order.

### Random Choices

In a lot of places, the generator can randomly choose from a list of possibilities. The possibilities are equal by default, but weight can be added to them by repeating an item. For example, `item: [Choice Band, Choice Band, Choice Scarf]` gives a 2/3 chance of getting a Choice Band and a 1/3 chance of getting a Choice Scarf.

#### `pokemon`

This is the Pokémon's species and forme, in Smogon's format (ex: `Landorus-Therian`, `Indeedee-F`, etc.).

#### `item`

These are the Pokémon's different possible held items. One item can be entered (i.e. `item: Weakness Policy`), or multiple items can be listed as an array (i.e. `item: [Life Orb, Expert Belt, Black Glasses]`), and an item will be randomly picked.

#### `ability`

This is the Pokémon's ability. Similarly to [items](#item), this can be one ability, or multiple as an array.

#### `spread`

This is the Pokémon's spread, including EVs, natures, IVs, and miscellanious information (ex: gigantamax). This is directly added into Pokémon Showdown's export format, so information can be copied from there, or simply written in the same format. Multiple spreads can also be listed.

##### One Spread:

```yaml
spread: |
  Gigantamax: Yes
  EVs: 252 Atk / 4 SpD / 252 Spe
  Jolly Nature
```

##### Multiple Spreads:

```yaml
spread:
  - |
    EVs: 252 HP / 252 Atk / 4 SpD
    Lonely Nature
    IVs: 17 Def / 0 Spe
  - |
    EVs: 252 HP / 252 Atk / 4 SpD
    Brave Nature
    IVs: 0 Spe
```

#### `moves`

This is a list of moves that should be in the moveset of the Pokémon. If more than four moves are provided, the generator will randomly select four moves. Each move slot can also be replaced with an array, and the generator will randomly pick a move for that slot. If a move is repeated in the random options more than once, the generator will ensure that the move is not selected twice.

##### Examples:

```yaml
moves:
  - [Rock Slide, Stone Edge]
  - Earthquake
  - Superpower
  - U-turn
  - Fly
```

```yaml
moves:
  - Icicle Crash
  - [Close Combat, High Horsepower, Heavy Slam]
  - [Close Combat, High Horsepower, Heavy Slam]
  - Protect
```

#### `roles`

This is a list of roles that a Pokémon can fill on a team. These roles help the generator create more viable teams. A Pokémon can have multiple roles, but please avoid giving a Pokémon a role if it already has a more specific one. For example, if a Pokémon already has the `[offense, trickroom]` role, do not give it the `[offense]` role.

##### `[restricted]`

This is a role given to restricted legendaries (allowed in Series 8, 10, 11, 12, 13).

##### `[mythical]`

This is a role given to mythicals (allowed in Series 13).

##### `[dynamax]`

This is a role given to any Pokémon that is consistently a good dynamax option. A team is guaranteed to have at least one Pokémon with this role.

###### `[dynamaxformat]`

This is a role given to Pokémon that do not function well in a non-dynamax format (i.e. Series 10).

##### `[nonmax]`

This is a role given to Pokémon that only perform well in non-dynamax formats (i.e. Series 10).

##### `[offense]`

This is a role given to any Pokémon whose primary function is dealing damage. While a team is meant to have a minimum of two offensive Pokémon, only one is determined by this tag (the other being determined by having the [dynamax tag](#dynamax))

###### `[offense, trickroom]`

This is a role given to any Pokémon that relies on Trick Room for speed control, in order to allow it to be paired with a Trick Room Setter.

###### `[offense, weather]`

This is a role given to Pokémon that are helped by the presence of weather. The type of weather should be specified as a third element (ex: `[offense, weather, sun]`). These Pokémon will be paired with a Pokémon capable of setting the weather.

###### `[offense, terrain]`

This is a role given to Pokémon that rely on terrain. The type of terrain should be specified as a third element (ex: `[offense, weather, grassy]`). These Pokémon will be paired with Pokémon that set that terrain.

**NOTE:** Do not add this tag to Pokémon that already set their own terrain (ex: Grassy Glide Rillaboom). However, they should have the [terrain setter tag](#setter-terrain)

###### `[offense, policy]`

This is a role given to Pokémon that rely on self-proccing a Weakness Policy. This tag should be repeated with every type the Pokémon is weak to (ex: `[offense, policy, fighting]`). Note that this tag should not be used with Pokémon that often use Weaknes Policy without a self-proccer, such as Moltres-Galar.

##### `[support]`

This is a role given to Pokémon that primarily play a supportive role. A team is guaranteed to have at least one Pokémon with this role

###### `[support, flinch]`

This role is given to users of Fake Out.

###### `[support, taunt]`

This role is given to users of Taunt.

###### `[support, redirection]`

This role is given to users of Follow Me and Rage Powder.

###### `[support, status]`

This role is given to Pokémon that can consistently spread status, through moves such as Nuzzle and Will-O-Wisp.

###### `[support, atkdrop]`

This role is given to Pokémon that can consistently lower the opponent's attacking stats, through moves such as Snarl and Charm.

###### `[support, defdrop]`

This role is given to Pokémon that can consistently lower the opponent's defense and special defense stats, through moves such as Tickle and Fake Tears.

###### `[support, atkup]`

This role is given to Pokémon that can raise their allies' damage output, either through stat boosting moves such as Follow Me, or through Helping Hand.

###### `[support, policy]`

This role is given to Pokémon that are weak users of certain moves, meant to activate Weakness Policy. The type of move should be specified as the third element (ex: `[support, policy, ground]`).

##### `[speed]`

This role is generally used for speed control. There will almost always be a subcategory you should be using. If there isn't, it is possible that it should be added.

###### `[speed, statdrop]`

This role is given to Pokémon that use moves such as Electroweb and Icy Wind for speed control.

###### `[speed, tailwind]`

This role is given to users of Tailwind.

###### `[speed, trickroom]`

This role is given to users of Trick Room

###### `[speed, weather]`

While not solely used for speed control, all weather setters should be given this role. The type of weather should be specified as the third element (ex: `[speed, weather, rain]`)

##### `[setter]`

This tag is intended for Pokémon that set up certain conditions, but is currently only used for terrains.

###### `[setter, terrain]`

All terrain setters should be given this role. The type of terrain should be specified as the third element (ex: `[setter, terrain, grassy]`)
