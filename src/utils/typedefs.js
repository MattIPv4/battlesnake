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
 * @property {{x: number, y: number}[]} body
 * @property {string} latency
 * @property {{x: number, y: number}} head
 * @property {number} length
 * @property {string} shout
 * @property {string} squad
 * @property {Customizations} customizations
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
 * @property {{x: number, y: number}[]} food
 * @property {{x: number, y: number}[]} hazards
 * @property {Battlesnake[]} snakes
 */

/**
 * Battlesnake API : POST (/start|/move|/end)
 *
 * @typedef {Object} Turn
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
 * @property {{x: number, y: number}} [hazard]
 * @property {{x: number, y: number}} [food]
 */

/**
 * Internal : Grid
 *
 * @typedef {GridCell[][]} Grid
 */
