/**
 * Battlesnake API : Game
 *
 * @typedef {Object} Game
 * @property {string} id
 * @property {Ruleset} ruleset
 * @property {number} timeout
 * @property {string} source
 */

/**
 * Battlesnake API : Ruleset
 *
 * @typedef {Object} Ruleset
 * @property {string} name
 * @property {string} version
 * @property {RulesetSettings} settings
 */

/**
 * Battlesnake API : RulesetSettings
 *
 * @typedef {Object} RulesetSettings
 * @property {number} foodSpawnChance
 * @property {number} minimumFood
 * @property {number} hazardDamagePerTurn
 * @property {string} map
 * @property {Object} royale
 * @property {number} royale.shrinkEveryNTurns
 * @property {Object} squad
 * @property {boolean} squad.allowBodyCollisions
 * @property {boolean} squad.sharedElimination
 * @property {boolean} squad.sharedHealth
 * @property {boolean} squad.sharedLength
 */

/**
 * Battlesnake API : Battlesnake
 *
 * @typedef {Object} Battlesnake
 * @property {string} id
 * @property {string} name
 * @property {number} health
 * @property {Coordinate[]} body
 * @property {string} latency
 * @property {Coordinate} head
 * @property {number} length
 * @property {string} shout
 * @property {string} squad
 * @property {Customizations} customizations
 */

/**
 * Battlesnake API : Coordinate
 *
 * @typedef {Object} Coordinate
 * @property {number} x
 * @property {number} y
 */

/**
 * Battlesnake API : Customizations
 *
 * @typedef {Object} Customizations
 * @property {string} apiversion
 * @property {string} [author]
 * @property {string} [color]
 * @property {string} [head]
 * @property {string} [tail]
 * @property {string} [version]
 */

/**
 * Battlesnake API : Board
 *
 * @typedef {Object} Board
 * @property {number} height
 * @property {number} width
 * @property {Coordinate[]} food
 * @property {Coordinate[]} hazards
 * @property {Battlesnake[]} snakes
 */

/**
 * Battlesnake API : GameState
 *
 * @typedef {Object} GameState
 * @property {Game} game
 * @property {number} turn
 * @property {Board} board
 * @property {Battlesnake} you
 */

/**
 * Internal : GridCell
 *
 * @typedef {Object} GridCell
 * @property {Battlesnake} [snake]
 * @property {Coordinate} [hazard]
 * @property {Coordinate} [food]
 */

/**
 * Internal : Grid
 *
 * @typedef {GridCell[][]} Grid
 */

/**
 * Internal : ScoreFunction
 *
 * @callback ScoreFunction
 * @param {GameState} data
 * @param {Grid} grid
 * @param {Movement} pos
 * @param {boolean} wrap
 * @param {boolean} constrict
 * @return {Score}
 */

/**
 * Internal : Score
 *
 * @typedef {Object} Score
 * @property {number} score
 * @property {Object} data
 */

/**
 * Internal : Movement
 *
 * @typedef {Object} Movement
 * @property {number} x
 * @property {number} y
 * @property {string} move
 */
