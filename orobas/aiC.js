"use strict"

const {sort} = require('fast-sort')
require('fast-filter').install('filter')

// let seedrandom = require('seedrandom')
// let rnd = new seedrandom('orobas1234', {global: true})

console.log(Math.random())

let AI = {
    version: "2.1.5",
    totaldepth: 6,
    ttNodes: 0,
    collisions: 0,
    iteration: 0,
    qsnodes: 0,
    nodes: 0,
    pnodes: 0, //Pawn structure nodes
    phnodes: 0, //Pawn hash nodes
    pvnodes: 0, //Pawn attack hash nodes
    rnodes: 0, //Random pruned nodes
    evalhashnodes: 0,
    evalnodes: 0,
    evalTime: 0,
    genMovesTime: 0,
    moveTime: 0,
    status: null,
    fhf: 0,
    fh: 0,
    random: 0,
    phase: 0,
    htlength: 8e6,
    pawntlength: 5e5,
    // mindepth: [6,10,12,18],
    // mindepth: [18,20,22,24],
    mindepth: [6,6,6,6],
    secondspermove: 1,
    lastmove: null,
    f: 0,
    previousls: 0,
    lastscore: 0,
    nullWindowFactor: 12 // +132 ELO
}

// ÍNDICES
const PAWN = 1
const KNIGHT = 2
const BISHOP = 3
const ROOK = 4
const QUEEN = 5
const KING = 6

const K = KING
const Q = QUEEN
const R = ROOK
const B = BISHOP
const N = KNIGHT
const P = PAWN
const k = KING + 6
const q = QUEEN + 6
const r = ROOK + 6
const b = BISHOP + 6
const n = KNIGHT + 6
const p = PAWN + 6

const WHITE = 1
const BLACK = 2

const CENTER = [51,52,67,68]

const WIDECENTER = [50,51,52,53,66,67,68,69]

const WHITEINDEX = [1,2,3,4,5,6]
const BLACKINDEX = [7,8,9,10,11,12]
const ALLINDEX = [1,2,3,4,5,6,7,8,9,10,11,12]

const ABS = new Map()

ABS[0] = 0
ABS[k] = K
ABS[q] = Q
ABS[r] = R
ABS[b] = B
ABS[n] = N
ABS[p] = P
ABS[P] = P
ABS[N] = N
ABS[B] = B
ABS[R] = R
ABS[Q] = Q
ABS[K] = K

const OPENING = 0
const MIDGAME = 1
const EARLY_ENDGAME = 2
const LATE_ENDGAME = 3

const LOWERBOUND = -1
const EXACT = 0
const UPPERBOUND = 1

const VPAWN = 100
const VPAWN2 = VPAWN / 2 | 0
const VPAWN3 = VPAWN / 3 | 0
const VPAWN4 = VPAWN / 4 | 0
const VPAWN5 = VPAWN / 5 | 0
const VPAWN10= VPAWN /10 | 0
const VPAWNx2 = 2*VPAWN | 0

const MARGIN1 = VPAWN/AI.nullWindowFactor | 0
const MARGIN2 = VPAWN*2/AI.nullWindowFactor | 0
const MARGIN3 = VPAWN*3/AI.nullWindowFactor | 0
const MARGIN10 = VPAWN*10/AI.nullWindowFactor | 0
const SMALLMARGIN = (VPAWN/2)/AI.nullWindowFactor | 0
const VERYSMALLMARGIN = (VPAWN/4)/AI.nullWindowFactor | 0

AI.PIECE_VALUES = [
    new Map(),
    new Map(),
    new Map(),
    new Map(),
]

AI.PSQT_OPENING =  [null,[9,-3,9,5,-29,-7,3,-7,null,null,null,null,null,null,null,null,99,123,58,82,75,149,15,-14,null,null,null,null,null,null,null,null,13,-2,17,32,82,57,20,-17,null,null,null,null,null,null,null,null,-27,6,-7,32,14,35,30,-22,null,null,null,null,null,null,null,null,-44,-13,0,3,-4,7,9,-18,null,null,null,null,null,null,null,null,-25,-25,5,-15,8,2,10,-17,null,null,null,null,null,null,null,null,-32,36,-7,-22,-32,21,35,-29,null,null,null,null,null,null,null,null,23,-17,15,-23,35,33,-15,-11,null,null,null,null,null,null,null,null],[-162,-98,-17,-78,90,-90,-16,-118,null,null,null,null,null,null,null,null,-90,-38,67,17,6,21,8,-8,null,null,null,null,null,null,null,null,-42,83,44,50,71,154,100,43,null,null,null,null,null,null,null,null,-22,24,42,60,50,74,3,19,null,null,null,null,null,null,null,null,-18,3,15,2,31,26,22,-11,null,null,null,null,null,null,null,null,-38,-22,5,-1,-6,10,12,-17,null,null,null,null,null,null,null,null,-30,-58,1,-26,6,13,-33,-16,null,null,null,null,null,null,null,null,-92,14,-51,-2,2,-29,-32,-20,null,null,null,null,null,null,null,null],[-44,-1,-53,-56,-18,-29,-8,5,null,null,null,null,null,null,null,null,-25,-5,-15,-6,21,44,29,-52,null,null,null,null,null,null,null,null,-15,52,44,25,32,57,44,-33,null,null,null,null,null,null,null,null,-29,2,38,29,18,30,34,-5,null,null,null,null,null,null,null,null,-5,6,26,25,39,5,1,15,null,null,null,null,null,null,null,null,-23,30,36,22,13,26,25,33,null,null,null,null,null,null,null,null,-15,8,7,-7,22,20,22,-2,null,null,null,null,null,null,null,null,-44,-22,-17,-30,-18,9,-38,-10,null,null,null,null,null,null,null,null],[29,9,5,48,70,14,32,44,null,null,null,null,null,null,null,null,-4,29,55,57,97,64,15,41,null,null,null,null,null,null,null,null,-40,76,23,33,24,46,32,21,null,null,null,null,null,null,null,null,-9,-14,-4,23,23,14,1,-31,null,null,null,null,null,null,null,null,-21,-39,-13,-22,18,8,23,-48,null,null,null,null,null,null,null,null,-52,-14,-37,-20,-4,-1,4,-46,null,null,null,null,null,null,null,null,-49,-19,-15,-28,-10,10,-1,-56,null,null,null,null,null,null,null,null,0,-22,-24,14,17,4,-40,-11,null,null,null,null,null,null,null,null],[-11,5,40,13,94,31,70,68,null,null,null,null,null,null,null,null,-41,-40,-4,12,-27,54,31,35,null,null,null,null,null,null,null,null,-18,-20,12,19,40,43,64,56,null,null,null,null,null,null,null,null,-24,-12,-13,1,-8,-4,-21,-2,null,null,null,null,null,null,null,null,10,-21,-20,-25,-19,-13,16,-4,null,null,null,null,null,null,null,null,21,5,-16,-5,10,3,35,26,null,null,null,null,null,null,null,null,-32,1,-6,13,-13,14,4,18,null,null,null,null,null,null,null,null,-4,-33,-18,1,-36,-22,2,-77,null,null,null,null,null,null,null,null],[-40,38,9,-22,-69,-51,-31,-4,null,null,null,null,null,null,null,null,-4,-10,-25,0,-31,7,-27,-2,null,null,null,null,null,null,null,null,-6,27,9,-31,-7,3,7,-7,null,null,null,null,null,null,null,null,-10,-17,17,-22,-37,-34,-11,-21,null,null,null,null,null,null,null,null,-60,-10,-38,-24,-41,-19,-30,-64,null,null,null,null,null,null,null,null,-7,13,-49,-63,-45,-41,0,-18,null,null,null,null,null,null,null,null,22,46,-15,-61,-38,-1,-12,13,null,null,null,null,null,null,null,null,-12,53,9,-33,1,-53,15,1,null,null,null,null,null,null,null,null]]
AI.PSQT_LATE_ENDGAME =  [null,[-15,-43,5,-9,9,-5,23,5,null,null,null,null,null,null,null,null,195,164,151,117,164,147,190,186,null,null,null,null,null,null,null,null,89,115,94,70,63,54,113,59,null,null,null,null,null,null,null,null,37,35,-2,2,-5,-25,-6,22,null,null,null,null,null,null,null,null,4,-14,-18,4,-14,-7,8,-14,null,null,null,null,null,null,null,null,15,-2,-7,16,13,-28,8,23,null,null,null,null,null,null,null,null,28,13,13,19,22,7,17,-24,null,null,null,null,null,null,null,null,-1,11,-17,-23,-5,-13,3,21,null,null,null,null,null,null,null,null],[-53,-3,-12,-37,-32,-30,-60,-106,null,null,null,null,null,null,null,null,-42,-3,-30,-3,-14,-26,-37,-59,null,null,null,null,null,null,null,null,-13,-39,9,-8,10,-10,-34,-10,null,null,null,null,null,null,null,null,16,-8,31,-7,25,-4,15,-35,null,null,null,null,null,null,null,null,-33,-21,27,32,23,18,9,-9,null,null,null,null,null,null,null,null,-4,6,-12,6,13,6,-39,-27,null,null,null,null,null,null,null,null,-23,-31,-41,14,-13,-25,-42,-45,null,null,null,null,null,null,null,null,-50,-48,-6,-18,-13,-23,-49,-57,null,null,null,null,null,null,null,null],[-11,-12,-14,-27,-28,-32,2,-35,null,null,null,null,null,null,null,null,-19,-3,-14,-15,0,-4,25,-5,null,null,null,null,null,null,null,null,21,-25,-39,-4,7,-11,-37,1,null,null,null,null,null,null,null,null,0,-4,9,4,-1,31,0,-5,null,null,null,null,null,null,null,null,17,-2,16,42,16,-11,6,-24,null,null,null,null,null,null,null,null,-3,-6,-11,5,18,-8,14,12,null,null,null,null,null,null,null,null,-15,7,24,10,1,0,-18,-26,null,null,null,null,null,null,null,null,-46,-16,0,-8,2,-31,-4,4,null,null,null,null,null,null,null,null],[14,17,21,16,-19,-17,19,24,null,null,null,null,null,null,null,null,34,40,0,16,-8,-2,-1,-22,null,null,null,null,null,null,null,null,-22,4,-2,16,-17,-6,-12,-24,null,null,null,null,null,null,null,null,19,12,20,14,9,-16,-4,7,null,null,null,null,null,null,null,null,-6,10,-9,-9,-24,15,-17,8,null,null,null,null,null,null,null,null,-7,-19,22,-28,-16,-5,-3,-17,null,null,null,null,null,null,null,null,-21,-3,-17,-3,-16,10,-10,-8,null,null,null,null,null,null,null,null,-12,-7,4,6,4,-28,3,-1,null,null,null,null,null,null,null,null],[-10,15,23,26,32,24,-1,13,null,null,null,null,null,null,null,null,-12,31,33,26,55,24,31,-17,null,null,null,null,null,null,null,null,-29,-1,10,72,72,24,16,20,null,null,null,null,null,null,null,null,16,39,15,32,50,61,76,29,null,null,null,null,null,null,null,null,-33,13,0,56,30,35,50,36,null,null,null,null,null,null,null,null,-5,-4,14,15,26,24,-5,-12,null,null,null,null,null,null,null,null,-19,-4,-17,-17,-35,-58,-39,-23,null,null,null,null,null,null,null,null,-18,-49,-21,-52,-20,-35,-47,-12,null,null,null,null,null,null,null,null],[-71,-30,-25,-31,-8,-8,15,-16,null,null,null,null,null,null,null,null,-23,6,15,38,28,29,22,38,null,null,null,null,null,null,null,null,11,30,12,12,-9,62,57,8,null,null,null,null,null,null,null,null,7,17,35,22,7,38,45,10,null,null,null,null,null,null,null,null,-37,-1,26,23,36,34,10,2,null,null,null,null,null,null,null,null,0,-44,10,22,38,25,2,-26,null,null,null,null,null,null,null,null,-20,-2,5,2,9,31,-26,4,null,null,null,null,null,null,null,null,-56,-15,-28,-12,-41,-23,1,-8,null,null,null,null,null,null,null,null]]
AI.POV =  [402,432,556,1266]
AI.PEV =  [426,342,664,1204]
AI.BISHOP_PAIR =  [20,38,92,62]
AI.DEFENDED_VALUES =  [-2,11,10,29,30,51,-2,16,-22,-22,-64,-34,-60,-32,-48,-28,-60,-50,-46,-30,-50,-44,-62,-36,-34,-40]
AI.BLOCKEDPAWNBONUS =  [-6,-2,4,46,-4,-4,10,30,null,null,null,null,null,null,null,null,32,10,18,-10,-8,-6,4,20,null,null,null,null,null,null,null,null,7,20,4,36,36,40,26,19,null,null,null,null,null,null,null,null,13,19,15,21,53,15,13,-15,null,null,null,null,null,null,null,null,-2,4,-10,12,-18,2,14,-6,null,null,null,null,null,null,null,null,-4,-10,-18,-8,-6,-6,2,18,null,null,null,null,null,null,null,null,-2,-4,-14,-6,8,-12,-22,12,null,null,null,null,null,null,null,null,14,18,24,22,24,32,8,2,null,null,null,null,null,null,null,null]
AI.DEFENDEDPAWNBONUS =  [-2,26,-2,-12,6,24,-10,28,null,null,null,null,null,null,null,null,11,56,55,32,64,43,48,15,null,null,null,null,null,null,null,null,10,9,9,27,21,33,51,-10,null,null,null,null,null,null,null,null,7,21,29,7,5,11,-1,21,null,null,null,null,null,null,null,null,15,6,-26,-1,-7,20,30,5,null,null,null,null,null,null,null,null,4,3,-4,7,1,0,3,10,null,null,null,null,null,null,null,null,10,18,-20,12,-4,-12,-4,-6,null,null,null,null,null,null,null,null,-12,16,-18,6,10,8,16,6,null,null,null,null,null,null,null,null]
AI.ALIGNEDPAWNBONUS =  [-18,14,10,-2,10,2,12,6,null,null,null,null,null,null,null,null,34,37,41,47,43,63,71,52,null,null,null,null,null,null,null,null,33,48,39,36,36,71,26,53,null,null,null,null,null,null,null,null,0,43,39,25,-7,67,33,14,null,null,null,null,null,null,null,null,13,17,19,21,25,13,9,31,null,null,null,null,null,null,null,null,-3,2,-4,-3,3,36,14,13,null,null,null,null,null,null,null,null,-6,-5,4,-1,9,8,-1,-30,null,null,null,null,null,null,null,null,4,6,0,-22,10,20,14,-6,null,null,null,null,null,null,null,null]
AI.NEIGHBOURPAWNBONUS =  [-8,0,-4,2,36,-2,-2,-10,null,null,null,null,null,null,null,null,16,-3,14,11,19,-4,3,20,null,null,null,null,null,null,null,null,8,2,16,10,4,20,-4,-2,null,null,null,null,null,null,null,null,-10,2,20,5,-1,0,24,-14,null,null,null,null,null,null,null,null,20,-5,4,13,27,24,27,-4,null,null,null,null,null,null,null,null,16,12,-15,0,18,7,12,6,null,null,null,null,null,null,null,null,13,-8,-15,-4,-20,23,4,-1,null,null,null,null,null,null,null,null,-18,10,8,-14,-18,-18,-6,-8,null,null,null,null,null,null,null,null]
AI.LEVERPAWNBONUS =  [12,4,8,-20,10,16,0,2,null,null,null,null,null,null,null,null,2,-2,-26,18,-16,20,8,16,null,null,null,null,null,null,null,null,30,28,20,12,24,6,10,36,null,null,null,null,null,null,null,null,6,9,39,5,17,17,23,22,null,null,null,null,null,null,null,null,-16,-6,2,-24,14,-22,-12,-8,null,null,null,null,null,null,null,null,8,-10,0,4,2,-32,-10,12,null,null,null,null,null,null,null,null,6,6,-2,12,4,10,10,8,null,null,null,null,null,null,null,null,10,4,-4,-6,14,-18,38,16,null,null,null,null,null,null,null,null]
AI.PASSERSBONUS =  [-12,0,68,-48,8,36,-8,-40,null,null,null,null,null,null,null,null,86,101,127,94,102,87,81,70,null,null,null,null,null,null,null,null,150,24,60,88,28,56,20,38,null,null,null,null,null,null,null,null,70,40,40,32,60,72,68,18,null,null,null,null,null,null,null,null,16,14,70,38,10,70,54,16,null,null,null,null,null,null,null,null,33,38,76,24,44,28,-6,29,null,null,null,null,null,null,null,null,38,-48,56,30,30,29,28,-18,null,null,null,null,null,null,null,null,-12,32,-24,-24,-12,-24,20,4,null,null,null,null,null,null,null,null]
AI.DOUBLEDPENALTY =  [0,-4,-36,-4,32,-36,-24,12,null,null,null,null,null,null,null,null,46,50,-9,8,0,55,62,58,null,null,null,null,null,null,null,null,12,64,-3,18,38,9,-44,16,null,null,null,null,null,null,null,null,-62,2,51,-16,-8,7,-2,62,null,null,null,null,null,null,null,null,68,16,21,-2,-6,-7,-4,28,null,null,null,null,null,null,null,null,30,30,-61,-4,16,-25,70,10,null,null,null,null,null,null,null,null,-20,-20,80,-44,-36,-12,-16,-8,null,null,null,null,null,null,null,null,12,0,4,28,-60,0,-8,4,null,null,null,null,null,null,null,null]
AI.OUTPOSTBONUSKNIGHT =  [12,-12,24,-8,8,4,-40,-24,null,null,null,null,null,null,null,null,36,52,-8,8,-28,8,-8,-12,null,null,null,null,null,null,null,null,-4,29,84,34,78,60,21,40,null,null,null,null,null,null,null,null,55,16,47,27,27,35,52,11,null,null,null,null,null,null,null,null,-11,6,82,61,37,6,-6,9,null,null,null,null,null,null,null,null,29,15,-7,64,-36,-11,-13,17,null,null,null,null,null,null,null,null,40,4,20,-36,-48,24,-48,-36,null,null,null,null,null,null,null,null,20,-48,-44,-12,16,20,16,8,null,null,null,null,null,null,null,null]
AI.OUTPOSTBONUSBISHOP =  [-4,36,-12,-24,-24,28,-56,-80,null,null,null,null,null,null,null,null,4,32,-32,-32,36,16,36,32,null,null,null,null,null,null,null,null,48,37,96,58,50,72,29,44,null,null,null,null,null,null,null,null,-9,20,19,59,31,43,36,-25,null,null,null,null,null,null,null,null,0,-18,2,-3,-51,54,-2,68,null,null,null,null,null,null,null,null,29,39,1,28,24,1,15,-7,null,null,null,null,null,null,null,null,-28,-12,0,20,16,-12,-8,48,null,null,null,null,null,null,null,null,-24,56,-8,60,0,-8,-24,-32,null,null,null,null,null,null,null,null]// AI.ATTACKING_PIECES =  [null,null,33,57,77,120]
AI.PAWNSHIELD =  [30,30,20,10]
AI.PAR =  [
    43, 13,  6, 25,  9, 17, 55, 15, 25,
     9,  4, 15,  3, 23,  7,  3, 25, 17,
     5,  6,  4, 20,  1,  6, 13, 10, 11,
     3, 37, 30,  4, 27, 13, 93, 27
  ]
AI.MOB =  [ null, null, [ 20, 24 ], [ 22, 20 ], [ 28, 20 ], [ 18, 18 ] ]

// AI.PAR = [
//     40, //0 center control
//     20, //1 outer center lever
//     15, //2 outer center lever 2
//     40, //3 knight mobility blocker
//     20, //4 Blocks knight mobility
//     12, //5 Semi outpost
//     20, //6 bishop x-rays
//     10, //7 pawn in front of outpost bishop
//     20, //8 outpost bishop in rank 6
//     15, //9 knight semi outpost
//     10, //10 enemy pawn in front of outpost knight
//     20, //11 outpost knight in rank 6
//     20, //12 Rook x-rays
//     10, //13 defended rook in rank 5
//     20, //14 queen x-rays
//     20, //15 is king under attack1
//     20, //16 is king under attack2
//     20, //17 is king under attack3,
//     10, //18 pawns at same squares as bishops
//     10, //19 Expensive center control
//     10, //20 Occupied by 1
//     5,  //21 Occupied by 2
//     10, //22 incentive for keeping queens and rooks in advantage
//     10, //23 blocked pawns with knights
//     5,  //24 pawn span midgame
//     10, //25 pawn span endgame
//     10, //26 raking bishops
//     10, //27 Rook battery

//     //Shield
//     10, //28 King in center
//     15, //29 bishop in front of king

//     //Structure
//     20, //30 pawn imbalance
//     40, //31 backward pawns
//     10, //32 space

//      //Bishops
//     100, //33 in front of pawn at opening
//      40, //34 blocked by own pawn
// ]

AI.PIECE_VALUES[OPENING][0] = 0

AI.PIECE_VALUES[OPENING][p] = -VPAWN | 0
AI.PIECE_VALUES[OPENING][n] = -VPAWN*AI.POV[0]/100 | 0
AI.PIECE_VALUES[OPENING][b] = -VPAWN*AI.POV[1]/100 | 0
AI.PIECE_VALUES[OPENING][r] = -VPAWN*AI.POV[2]/100 | 0
AI.PIECE_VALUES[OPENING][q] = -VPAWN*AI.POV[3]/100 | 0
AI.PIECE_VALUES[OPENING][k] = 0

AI.PIECE_VALUES[OPENING][P] = VPAWN | 0
AI.PIECE_VALUES[OPENING][N] = VPAWN*AI.POV[0]/100 | 0
AI.PIECE_VALUES[OPENING][B] = VPAWN*AI.POV[1]/100 | 0
AI.PIECE_VALUES[OPENING][R] = VPAWN*AI.POV[2]/100 | 0
AI.PIECE_VALUES[OPENING][Q] = VPAWN*AI.POV[3]/100 | 0
AI.PIECE_VALUES[OPENING][K] = 0

AI.PIECE_VALUES[LATE_ENDGAME][p] = -VPAWN | 0
AI.PIECE_VALUES[LATE_ENDGAME][n] = -VPAWN*AI.PEV[0]/100 | 0
AI.PIECE_VALUES[LATE_ENDGAME][b] = -VPAWN*AI.PEV[1]/100 | 0
AI.PIECE_VALUES[LATE_ENDGAME][r] = -VPAWN*AI.PEV[2]/100 | 0
AI.PIECE_VALUES[LATE_ENDGAME][q] = -VPAWN*AI.PEV[3]/100 | 0
AI.PIECE_VALUES[LATE_ENDGAME][k] = 0

AI.PIECE_VALUES[LATE_ENDGAME][P] = VPAWN | 0
AI.PIECE_VALUES[LATE_ENDGAME][N] = VPAWN*AI.PEV[0]/100 | 0
AI.PIECE_VALUES[LATE_ENDGAME][B] = VPAWN*AI.PEV[1]/100 | 0
AI.PIECE_VALUES[LATE_ENDGAME][R] = VPAWN*AI.PEV[2]/100 | 0
AI.PIECE_VALUES[LATE_ENDGAME][Q] = VPAWN*AI.PEV[3]/100 | 0
AI.PIECE_VALUES[LATE_ENDGAME][K] = 0

// Total material value doesnt count pawns
AI.maxMaterialValue = 4 * AI.PIECE_VALUES[OPENING][N] +
                      4 * AI.PIECE_VALUES[OPENING][B] +
                      4 * AI.PIECE_VALUES[OPENING][R] +
                      2 * AI.PIECE_VALUES[OPENING][Q] +
                      2 * AI.PIECE_VALUES[OPENING][K]
                      
console.log('Max material value', AI.maxMaterialValue)

// CONSTANTES
const MATE = (AI.maxMaterialValue + 16*VPAWN) / AI.nullWindowFactor | 0
const DRAW = 0
const INFINITY = MATE + 1 | 0

AI.ZEROINDEX = new Map()

AI.ZEROINDEX[P] = 0
AI.ZEROINDEX[N] = 1
AI.ZEROINDEX[B] = 2
AI.ZEROINDEX[R] = 3
AI.ZEROINDEX[Q] = 4
AI.ZEROINDEX[K] = 5
AI.ZEROINDEX[p] = 0
AI.ZEROINDEX[n] = 1
AI.ZEROINDEX[b] = 2
AI.ZEROINDEX[r] = 3
AI.ZEROINDEX[q] = 4
AI.ZEROINDEX[k] = 5

//CREA TABLA PARA REDUCCIONES
AI.LMR_TABLE = new Array(AI.totaldepth + 1)

for (let depth = 1; depth < AI.totaldepth + 1; depth++) {

    AI.LMR_TABLE[depth] = new Array(218)

    for (let moves = 1; moves < 218; moves++) {
        AI.LMR_TABLE[depth][moves] = Math.log(depth)*Math.log(moves)/1.95 | 0
    }
}

AI.CENTERMANHATTAN = [
    6, 5, 4, 3, 3, 4, 5, 6,  null,  null,  null,  null,  null,  null,  null,  null,
    5, 4, 3, 2, 2, 3, 4, 5,  null,  null,  null,  null,  null,  null,  null,  null,
    4, 3, 2, 1, 1, 2, 3, 4,  null,  null,  null,  null,  null,  null,  null,  null,
    3, 2, 1, 0, 0, 1, 2, 3,  null,  null,  null,  null,  null,  null,  null,  null,
    3, 2, 1, 0, 0, 1, 2, 3,  null,  null,  null,  null,  null,  null,  null,  null,
    4, 3, 2, 1, 1, 2, 3, 4,  null,  null,  null,  null,  null,  null,  null,  null,
    5, 4, 3, 2, 2, 3, 4, 5,  null,  null,  null,  null,  null,  null,  null,  null,
    6, 5, 4, 3, 3, 4, 5, 6,  null,  null,  null,  null,  null,  null,  null,  null,
]

let manhattanDistance = (sq1, sq2)=> {
    let file1, file2, rank1, rank2;
    let rankDistance, fileDistance;
    file1 = sq1  & 7;
    file2 = sq2  & 7;
    rank1 = sq1 >> 3;
    rank2 = sq2 >> 3;
    rankDistance = Math.abs(rank2 - rank1);
    fileDistance = Math.abs(file2 - file1);
    return rankDistance + fileDistance;
 }

// MVV-LVA
// Valor para determinar orden de capturas,
// prefiriendo la víctima más valiosa con el atacante más débil
//https://open-chess.org/viewtopic.php?t=3058
// let mvvlvaScores = [
//     /* P      N      B      R      Q      K
// /*P*/[6002, 20225, 20250, 20400, 20800, 26900],
// /*N*/[4775,  6004, 20025, 20175, 20575, 26675],
// /*B*/[4750,  4975,  6006, 20150, 20550, 26650],
// /*R*/[4600,  4825,  4850,  6008, 20400, 26500],
// /*Q*/[4200,  4425,  4450,  4600,  6010, 26100],
// /*K*/[3100,  3325,  3350,  3500,  3900, 26000],
// ]

let mvvlvaScores = [
        /* P      N      B      R      Q      K
  /*P*/[6100, 20225, 20250, 20400, 20800, 26900],
  /*N*/[4775,  6004, 20025, 20175, 20575, 26675],
  /*B*/[4750,  4975,  6006, 20150, 20550, 26650],
  /*R*/[4600,  4825,  4850,  6008, 20400, 26500],
  /*Q*/[4200,  4425,  4450,  4600,  6010, 26100],
  /*K*/[3100,  3325,  3350,  3500,  3900, 26000],
]

AI.MVVLVASCORES = []
for (let e of ALLINDEX) {
    AI.MVVLVASCORES[e] = []
    for (let f of ALLINDEX) {
        let score = mvvlvaScores[AI.ZEROINDEX[e]][AI.ZEROINDEX[f]]

        AI.MVVLVASCORES[e][f] = score
    }
}

AI.PSQT = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
]

// CREA TABLAS DE TRASPOSICIÓN / PEONES / HISTORIA
AI.createTables = function (board, tt, ev, hh, pp) {
    // console.log('Creating tables', tt, ev, hh, pp)

    if (hh) {
        delete AI.history
        AI.history = new Map()

        AI.history[K] = Array(120).fill(0)
        AI.history[Q] = Array(120).fill(0)
        AI.history[R] = Array(120).fill(0)
        AI.history[B] = Array(120).fill(0)
        AI.history[N] = Array(120).fill(0)
        AI.history[P] = Array(120).fill(0)
        
        AI.history[k] = Array(120).fill(0)
        AI.history[q] = Array(120).fill(0)
        AI.history[r] = Array(120).fill(0)
        AI.history[b] = Array(120).fill(0)
        AI.history[n] = Array(120).fill(0)
        AI.history[p] = Array(120).fill(0)
    }

    
    if (tt) {
        delete AI.hashTable
        AI.hashTable = [null, new Array(this.htlength)/*.fill(null)*/, new Array(this.htlength)/*.fill(null)*/]

        
    }

    if (ev) {
        delete AI.evalTable
        AI.evalTable = (new Array(this.htlength)).fill(null)
    }

    if (pp) {
        delete AI.pawnTable
        AI.pawnTable = (new Array(this.pawntlength))//.fill(null)

        AI.phnodes = 0
        AI.pnodes = 0
    }
}

//ESTABLECE VALORES ALEATORIAS EN LA APERTURA (PARA TESTEOS)
AI.randomizePSQT = function () {
    if (AI.phase === OPENING) {
        //From Knight to Queen
        for (let i of WHITEINDEX) {
            AI.PSQT[i] = AI.PSQT[i].map(e => {
                return e + Math.random() * AI.random - AI.random / 2 | 0
            })
        }
    }
}

// FUNCIÓN DE EVALUACIÓN DE LA POSICIÓN
AI.evaluate = function (board, ply, alpha, beta, pvNode, incheck, illegalMovesSoFar) {
    // let t0 = Date.now()
    illegalMovesSoFar = illegalMovesSoFar | 0

    let evalEntry = AI.evalTable[board.hashkey % this.htlength]
    this.evalnodes++
    let turn = board.turn
    let sign = turn === WHITE? 1 : -1
    
    if (evalEntry && !pvNode && evalEntry.hashkey === board.hashkey) {
        this.evalhashnodes++
        return sign*evalEntry.score
    }

    alpha = alpha*this.nullWindowFactor | 0
    beta = alpha + VPAWN
        
    let score = AI.random? Math.random()*AI.random - AI.random/2 | 0 : 0

    score -= 2 * sign * illegalMovesSoFar

    // if (score < min) {
    //     min = score
    //     console.log(min)
    // }

    let pawnindexW = []
    let pawnindexB = []

    let knightsW = 0
    let knightsB = 0

    let bishopsW = 0
    let bishopsB = 0

    let rooksW = 0
    let rooksB = 0

    let bishopsindexW = []
    let bishopsindexB = []

    let rookscolumnsW = []
    let rookscolumnsB = []

    let queensW = 0
    let queensB = 0

    let material = 0
    let psqt = 0

    let tempTotalMaterial = 0

    let mgFactor = AI.totalmaterial / AI.maxMaterialValue
    let egFactor = 1 - mgFactor

    let lightSquaresWhitePawns = 0
    let lightSquaresBlackPawns = 0
    let darkSquaresWhitePawns = 0
    let darkSquaresBlackPawns = 0
    let blockedLightSquaresWhitePawns = 0
    let blockedDarkSquaresWhitePawns = 0
    let blockedLightSquaresBlackPawns = 0
    let blockedDarkSquaresBlackPawns = 0

    let lightSquaresWhiteBishop = 0
    let lightSquaresBlackBishop = 0
    let darkSquaresWhiteBishop = 0
    let darkSquaresBlackBishop = 0

    let positionalScore = 0

    for (let i = 0; i < 120; i++) {
        if (i & 0x88) {
            i+=7
            continue
        }

        let piece = board.board[i]
        
        if (!piece) {
            continue
        }

        let sumMaterial = true // Sum material only if piece is not a pawn

        if (piece === P) {
            pawnindexW.push(i)
            sumMaterial = false
        } else if (piece === p) {
            pawnindexB.push(i)
            sumMaterial = false
        }

        if (piece === B) {
            bishopsW++

            bishopsindexW.push(i)

            if (AI.phase === OPENING) {
                if ((i === 83 || i === 84) && board.board[i+16] === P) positionalScore -= AI.PAR[33]
    
                // Bishop blocked by own pawns
                if (board.board[i-15] === P) positionalScore -= AI.PAR[34]
                if (board.board[i-17] === P) positionalScore -= AI.PAR[34]
            }
        } else if (piece === b) {
            bishopsB++

            bishopsindexB.push(i)

            if (AI.phase === OPENING) {
                if ((i === 35 || i === 36) && board.board[i-16] === p) positionalScore += AI.PAR[33]
    
                // Bishop blocked by own pawns
                if (board.board[i+15] === p) positionalScore += AI.PAR[34]
                if (board.board[i+17] === p) positionalScore += AI.PAR[34]
            }
        }

        if (!incheck/* && pvNode*/) {
            if (piece === P) {
                // //Attacking pieces
                // if (board.board[i-15] === q || board.board[i-17] === q) positionalScore += AI.ATTACKING_PIECES[Q]
                // if (board.board[i-15] === r || board.board[i-17] === r) positionalScore += AI.ATTACKING_PIECES[R]
                // if (board.board[i-15] === b || board.board[i-17] === b) positionalScore += AI.ATTACKING_PIECES[B]
                // if (board.board[i-15] === n || board.board[i-17] === n) positionalScore += AI.ATTACKING_PIECES[N]

                //Defended
                if (board.board[i+15] === P || board.board[i+17] === P) {
                    positionalScore += AI.DEFENDEDPAWNBONUS[i]
                }

                //Aligned
                if (board.board[i+1] === P || board.board[i-1] === P) {
                    positionalScore = AI.ALIGNEDPAWNBONUS[i]
                }

                //Neighbour
                if (board.board[i+2] === P || board.board[i-2] === P) {
                    positionalScore += AI.NEIGHBOURPAWNBONUS[i]
                }

                //Levers
                if (board.board[i-15] === p || board.board[i-17] === p) {
                    positionalScore += AI.LEVERPAWNBONUS[i]
                }

                //Knight mobility blocker
                if (board.board[i-50] === n || board.board[i-46] === n) {
                    positionalScore += AI.PAR[3]
                }

                

                if (AI.phase <= MIDGAME) {
                    //Center control
                    if (i === 68 && board.board[51] === 0) positionalScore+=AI.PAR[0]
                    if (i === 67 && board.board[52] === 0) positionalScore+=AI.PAR[0]

                    //Outer central lever
                    if (i === 66 && (board.board[51] === p || board.board[51] === 0)) {
                        positionalScore+=AI.PAR[1]

                        if (board.board[81] === P || board.board[83] === P) positionalScore += AI.PAR[2]
                    } 
                    if (i === 69 && (board.board[52] === p || board.board[52] === 0)) {
                        positionalScore+=AI.PAR[1] 

                        if (board.board[84] === P || board.board[86] === P) positionalScore += AI.PAR[2]
                    }
                }

                if (board.colorOfSquare(i)) {
                    lightSquaresWhitePawns++

                    if (board.board[i-16] === p) {
                        blockedLightSquaresWhitePawns++
                        positionalScore += AI.BLOCKEDPAWNBONUS[i]
                    }
                } else {
                    darkSquaresWhitePawns++
                    if (board.board[i-16] === p) {
                        blockedDarkSquaresWhitePawns++
                        positionalScore += AI.BLOCKEDPAWNBONUS[i]
                    }
                }
            } else if (piece === p) {
                // //Attacking pieces
                // if (board.board[i+15] === Q || board.board[i+17] === Q) positionalScore -= AI.ATTACKING_PIECES[Q]
                // if (board.board[i+15] === R || board.board[i+17] === R) positionalScore -= AI.ATTACKING_PIECES[R]
                // if (board.board[i+15] === B || board.board[i+17] === B) positionalScore -= AI.ATTACKING_PIECES[B]
                // if (board.board[i+15] === N || board.board[i+17] === N) positionalScore -= AI.ATTACKING_PIECES[N]

                //Defended
                if (board.board[i-15] === p || board.board[i-17] === p) {
                    positionalScore -= AI.DEFENDEDPAWNBONUS[112^i]
                }

                //Aligned
                if (board.board[i+1] === p || board.board[i-1] === p) {
                    positionalScore -= AI.ALIGNEDPAWNBONUS[112^i]
                }

                //Neighbour
                if (board.board[i+2] === P || board.board[i-2] === P) {
                    positionalScore -= AI.NEIGHBOURPAWNBONUS[112^i]
                }

                //Levers
                if (board.board[i+15] === P || board.board[i+17] === P) {
                    positionalScore -= AI.LEVERPAWNBONUS[112^i]
                }

                //Knight mobility blocker
                if (board.board[i+50] === N || board.board[i+46] === N) {
                    positionalScore -= AI.PAR[3]
                }

                if (AI.phase <= MIDGAME) {
                    //Center control
                    if (i === 51 && board.board[68] === 0) positionalScore-=AI.PAR[0]
                    if (i === 52 && board.board[67] === 0) positionalScore-=AI.PAR[0]

                    //Outer central lever
                    if (i === 50 && (board.board[67] === P || board.board[67] === 0)) {
                        positionalScore-=AI.PAR[1]
                        if (board.board[33] === p || board.board[35] === p) positionalScore -= AI.PAR[2]
                    } 
                    if (i === 53 && (board.board[68] === P || board.board[68] === 0)) {
                        positionalScore-=AI.PAR[1]
                        if (board.board[36] === p || board.board[38] === p) positionalScore -= AI.PAR[2]
                    } 
                }

                if (board.colorOfSquare(i)) {
                    lightSquaresBlackPawns++
                    if (board.board[i+16] === P) {
                        blockedLightSquaresBlackPawns++
                        positionalScore -= AI.BLOCKEDPAWNBONUS[112^i]
                    }
                } else {
                    darkSquaresBlackPawns++
                    if (board.board[i+16] === P) {
                        blockedDarkSquaresBlackPawns++
                        positionalScore -= AI.BLOCKEDPAWNBONUS[112^i]
                    }
                }
            } else if (piece === B) {
                // Blocks knight mobility
                if (board.board[i-48] === n) positionalScore += AI.PAR[4]

                //Semi outpost
                if (AI.phase <= MIDGAME && board.ranksW[i] >= 3 && board.board[i-16] === P) positionalScore+=AI.PAR[5]
    
                //X-Rays
                if (board.diagonals1[i] === board.diagonals1[board.blackKingIndex]) {
                    positionalScore += AI.PAR[6]
                } else if (board.diagonals2[i] === board.diagonals2[board.blackKingIndex]) {
                    positionalScore += AI.PAR[6]
                }

                if (board.board[i + 15] === P || board.board[i + 17] === P) {
                    positionalScore += AI.OUTPOSTBONUSBISHOP[i]

                    //pawn in front of outpost bishop
                    if (board.board[i-16] === p) positionalScore += AI.PAR[7]

                    //outpost bishop in rank 6
                    if (board.ranksW[i] === 6) positionalScore += AI.PAR[8]
                }

                if (board.colorOfSquare(i)) {
                    lightSquaresWhiteBishop++
                } else {
                    darkSquaresWhiteBishop++
                }
            } else if (piece === b) {
                // Blocks knight mobility
                if (board.board[i+48] === N) positionalScore -= AI.PAR[4]

                //Semi outpost
                if (AI.phase <= MIDGAME && board.ranksB[i] >= 3 && board.board[i+16] === p) positionalScore-=AI.PAR[5]
    
                // X-Rays
                if (board.diagonals1[i] === board.diagonals1[board.whiteKingIndex]) {
                    positionalScore -= AI.PAR[6]
                } else if (board.diagonals2[i] === board.diagonals2[board.whiteKingIndex]) {
                    positionalScore -= AI.PAR[6]
                }

                if (board.board[i - 15] === p || board.board[i - 17] === p) {
                    positionalScore -= AI.OUTPOSTBONUSBISHOP[112^i]

                    //pawn in front of outpost bishop
                    if (board.board[i+16] === P) positionalScore -= AI.PAR[7]

                    //outpost bishop in rank 6
                    if (board.ranksB[i] === 6) positionalScore -= AI.PAR[8]
                }

                if (board.colorOfSquare(i)) {
                    lightSquaresBlackBishop++
                } else {
                    darkSquaresBlackBishop++
                }
            } else if (piece === N) {
                

                // Semi outpost
                if (AI.phase <= MIDGAME && board.ranksW[i] >= 3 && board.board[i-16] === P) positionalScore+=AI.PAR[9]
                
                knightsW++

                if (board.board[i + 15] === P || board.board[i + 17] === P) {
                    positionalScore += AI.OUTPOSTBONUSKNIGHT[i]

                    //enemy pawn in front of outpost knight
                    if (board.board[i-16] === p) positionalScore += AI.PAR[10]

                    //outpost knight in rank 6
                    if (board.ranksW[i] === 6) positionalScore += AI.PAR[11]
                }
                
            } else if (piece === n) {
                

                // Semi outpost
                if (AI.phase <= MIDGAME && board.ranksB[i] >= 3 && board.board[i+16] === p) positionalScore-=AI.PAR[9]
                knightsB++

                if (board.board[i - 15] === p || board.board[i - 17] === p) {
                    positionalScore -= AI.OUTPOSTBONUSKNIGHT[112^i]

                    if (board.board[i+16] === P) positionalScore -= AI.PAR[10]

                    if (board.ranksB[i] === 6) positionalScore -= AI.PAR[11]
                }
            } else if (piece === R) {
                rooksW++
    
                rookscolumnsW.push(board.columns[i])

                // X-Rays
                if (AI.phase <= MIDGAME) {
                    if (board.columns[i] === board.columns[board.blackKingIndex]) positionalScore += AI.PAR[12]
                    if (board.ranksW[i] === board.ranksW[board.blackKingIndex]) positionalScore += AI.PAR[12]
                }

                //defended rook in rank 5
                if (board.ranksW[i] === 5) {
                    if (board.board[i + 15] === P || board.board[i + 17] === P) positionalScore += AI.PAR[13]
                } 
            } else if (piece === r) {
                rooksB++
    
                rookscolumnsB.push(board.columns[i])
    
                // X-Rays
                if (AI.phase <= MIDGAME) {
                    if (board.columns[i] === board.columns[board.whiteKingIndex]) positionalScore -= AI.PAR[12]
                    if (board.ranksB[i] === board.ranksB[board.whiteKingIndex]) positionalScore -= AI.PAR[12]
                }

                //defended rook in rank 5
                if (board.ranksB[i] === 5) {
                    if (board.board[i - 15] === p || board.board[i - 17] === p) positionalScore -= AI.PAR[13]
                }
            } else if (piece === Q) {
                queensW++


    
                if (board.diagonals1[i] === board.diagonals1[board.blackKingIndex]) {
                    positionalScore += AI.PAR[14]
                } else if (board.diagonals2[i] === board.diagonals2[board.blackKingIndex]) {
                    positionalScore += AI.PAR[14]
                }

                if (board.columns[i] === board.columns[board.blackKingIndex]) {
                    positionalScore += AI.PAR[14]
                } else if (board.ranksW[i] === board.ranksW[board.blackKingIndex]) {
                    positionalScore += AI.PAR[14]
                }
            } else if (piece === q) {
                queensB++
                if (board.diagonals1[i] === board.diagonals1[board.whiteKingIndex]) {
                    positionalScore -= AI.PAR[14]
                } else if (board.diagonals2[i] === board.diagonals2[board.whiteKingIndex]) {
                    positionalScore -= AI.PAR[14]
                }

                if (board.columns[i] === board.columns[board.whiteKingIndex]) {
                    positionalScore -= AI.PAR[14]
                } else if (board.ranksB[i] === board.ranksB[board.whiteKingIndex]) {
                    positionalScore -= AI.PAR[14]
                }
            } else if (piece === K) {
                if (board.whiteKingIndex === 118 && board.board[119] === R) positionalScore -= VPAWN
            } else if (piece === k) {
                if (board.blackKingIndex === 6 && board.board[7] === r) positionalScore += VPAWN
            }
        }

        let turn = board.color(piece)
        let sign = turn === WHITE? 1 : -1

        let mgMaterial = mgFactor * AI.PIECE_VALUES[OPENING][piece] | 0
        let egMaterial = egFactor * AI.PIECE_VALUES[LATE_ENDGAME][piece] | 0

        material += (mgMaterial + egMaterial) //Material

        tempTotalMaterial += sumMaterial? AI.PIECE_VALUES[OPENING][ABS[piece]] : 0 //Not-pawn material

        let index = turn === WHITE? i : (112^i)
        let piecetype = ABS[piece]
        
        let mgPSQT = AI.PSQT_OPENING[piecetype][index] * mgFactor | 0
        let egPSQT = AI.PSQT_LATE_ENDGAME[piecetype][index] * egFactor | 0
        
        psqt += sign*(mgPSQT + egPSQT)
    }
    
    AI.totalmaterial = tempTotalMaterial

    // Material + PSQT
    score += material + psqt + positionalScore | 0

    // Bishop pair
    score += bishopsW >= 2? AI.BISHOP_PAIR[AI.phase] : 0
    score -= bishopsB >= 2? AI.BISHOP_PAIR[AI.phase] : 0

    // Pawn structure
    score += AI.getStructure(board, pawnindexW, pawnindexB)

    if (incheck) {
            
        let nullWindowScore = (score / AI.nullWindowFactor | 0)
        
        AI.evalTable[board.hashkey % this.htlength] = {
            hashkey: board.hashkey,
            score: nullWindowScore
        }
        return sign*nullWindowScore
    }



    if (AI.phase === LATE_ENDGAME && alpha > VPAWNx2) {
        let opponentKing = turn === WHITE? board.blackKingIndex : board.whiteKingIndex
        let kingToTheCorner = AI.CENTERMANHATTAN[opponentKing] - 3
        let distanceBetweenKings = 8 - manhattanDistance(board.whiteKingIndex, board.blackKingIndex)

        let mopup = 20*(kingToTheCorner + distanceBetweenKings)

        if (turn === WHITE) {
            score += mopup
        } else {
            score -= mopup
        }
    }

    
    if (AI.isLazyFutile(sign, score, alpha, beta)) {
        
        let nullWindowScore = (score / AI.nullWindowFactor | 0)
        
        AI.evalTable[board.hashkey % this.htlength] = {
            hashkey: board.hashkey,
            score: nullWindowScore
        }
        return sign*nullWindowScore
    }
    
    if (!incheck/* && pvNode*/) {
        

        // Is king under attack
        if (AI.phase >= MIDGAME) {
            score -= AI.PAR[15]*board.isSquareAttacked(board.whiteKingIndex-15, BLACK, false)
            score -= AI.PAR[16]*board.isSquareAttacked(board.whiteKingIndex-16, BLACK, false)
            score -= AI.PAR[17]*board.isSquareAttacked(board.whiteKingIndex-17, BLACK, false)       
            
            score += AI.PAR[15]*board.isSquareAttacked(board.blackKingIndex+15, WHITE, false)
            score += AI.PAR[16]*board.isSquareAttacked(board.blackKingIndex+16, WHITE, false)
            score += AI.PAR[17]*board.isSquareAttacked(board.blackKingIndex+17, WHITE, false)
        }

        if (AI.isLazyFutile(sign, score, alpha, beta)) {
            let nullWindowScore = (score / AI.nullWindowFactor | 0)
            
            AI.evalTable[board.hashkey % this.htlength] = {
                hashkey: board.hashkey,
                score: nullWindowScore
            }
    
            return sign*nullWindowScore
        }

        // Mobility
        score += AI.getMobility(board)

        // Pawns on same squares of bishops //8 for MG, 15 for EG
        let badPawns = 0
            badPawns+= (AI.PAR[18]*lightSquaresWhiteBishop*lightSquaresWhitePawns + AI.PAR[18]*darkSquaresWhiteBishop*darkSquaresWhitePawns)
            badPawns+= (AI.PAR[18]*lightSquaresWhiteBishop*blockedLightSquaresWhitePawns + AI.PAR[18]*darkSquaresWhiteBishop*blockedDarkSquaresWhitePawns)
            
            badPawns-= (AI.PAR[18]*lightSquaresBlackBishop*lightSquaresBlackPawns + AI.PAR[18]*darkSquaresBlackBishop*darkSquaresBlackPawns)
            badPawns-= (AI.PAR[18]*lightSquaresBlackBishop*blockedLightSquaresBlackPawns + AI.PAR[18]*darkSquaresBlackBishop*blockedDarkSquaresBlackPawns)
    
        score -= badPawns

        if (AI.isLazyFutile(sign, score, alpha, beta)) {
            
            let nullWindowScore = (alpha / AI.nullWindowFactor | 0) + 1
            
            AI.evalTable[board.hashkey % this.htlength] = {
                hashkey: board.hashkey,
                score: nullWindowScore
            }
            return sign*nullWindowScore
        }
    
        // Expensive center control
        if (AI.phase <= MIDGAME) {
            for (let i = 0, len=WIDECENTER.length; i < len; i++) {

                
                score += AI.PAR[19] * board.isSquareAttacked(WIDECENTER[i], WHITE, true)
                score -= AI.PAR[19] * board.isSquareAttacked(WIDECENTER[i], BLACK, true)
    
                let piece = board.board[WIDECENTER[i]]
                
                if (!piece) continue
                
                let occupiedBy = board.pieces[piece].color
                
                if (occupiedBy === WHITE) {
                    score += i < 64? AI.PAR[20] : AI.PAR[21]
                } else {
                    score -= i > 64? AI.PAR[20] : AI.PAR[21]
                }
            }
        }
    
        if (AI.isLazyFutile(sign, score, alpha, beta)) {
            
            let nullWindowScore = (alpha / AI.nullWindowFactor | 0) + 1
            
            AI.evalTable[board.hashkey % this.htlength] = {
                hashkey: board.hashkey,
                score: nullWindowScore
            }
            return sign*nullWindowScore
        }


    
        if (AI.phase >= EARLY_ENDGAME) {
            if (score > VPAWNx2) {
                if (queensW >= queensB) score += AI.PAR[22]
                if (rooksW >= rooksB) score += AI.PAR[22]
                
            }
                
            if (score < -VPAWNx2) {
                if (queensB >= queensW) score -= AI.PAR[22]
                if (rooksB >= rooksW) score -= AI.PAR[22]
            }
        }
    
        // Knights with blocked pawns
        let blockedWhitePawns = blockedLightSquaresWhitePawns + blockedDarkSquaresWhitePawns
        let blockedBlackPawns = blockedLightSquaresBlackPawns + blockedDarkSquaresBlackPawns


    
        score += AI.PAR[23]*blockedWhitePawns*knightsW
        score -= AI.PAR[23]*blockedBlackPawns*knightsB
    
        //Pawn span (distance between first and last pawn)
        let spanbonus = AI.phase <= MIDGAME? AI.PAR[24] : AI.PAR[25]
    
        if (pawnindexW.length > 1) {
            score += spanbonus*(board.columns[pawnindexW[pawnindexW.length - 1]] - board.columns[pawnindexW[0]])
        }
    
        if (pawnindexB.length > 1) {
            score -= spanbonus*(board.columns[pawnindexB[pawnindexB.length - 1]] - board.columns[pawnindexB[0]])
        }
    
        // Raking bishops
        if (bishopsW === 2) {
            if (Math.abs(bishopsindexW[0] - bishopsindexW[1]) === 1) score += AI.PAR[26]
            if (Math.abs(bishopsindexW[0] - bishopsindexW[1]) === 16) score += AI.PAR[26]
        }
    
        if (bishopsB === 2) {
            if (Math.abs(bishopsindexB[0] - bishopsindexB[1]) === 1) score -= AI.PAR[26]
            if (Math.abs(bishopsindexB[0] - bishopsindexB[1]) === 16) score -= AI.PAR[26]
        }
    
        //Rook battery
        if (AI.phase <= MIDGAME) {
            if (rookscolumnsW.length === 2) {
                if (rookscolumnsW[0] === rookscolumnsW[1]) score += AI.PAR[27]
            }
    
            if (rookscolumnsB.length === 2) {
                if (rookscolumnsB[0] === rookscolumnsB[1]) score -= AI.PAR[27]
            }
        }
    }


    let nullWindowScore = score / AI.nullWindowFactor | 0

    AI.evalTable[board.hashkey % this.htlength] = {
        hashkey: board.hashkey,
        score: nullWindowScore
    }

    // let t1 = Date.now()
    // AI.evalTime += t1 - t0

    return sign*nullWindowScore
}

AI.getPawnShield = (board, phase)=>{
    let score = 0
    let bonus = AI.PAWNSHIELD[AI.phase]

    if (phase <= MIDGAME && board.columns[board.whiteKingIndex] === 3 || board.columns[board.whiteKingIndex] === 4) score -= AI.PAR[28]
    
    if (board.whiteKingIndex !== 116) {
        score += board.board[board.whiteKingIndex-15] === P? bonus : 0
        score += board.board[board.whiteKingIndex-16] === P? bonus : 0
        score += board.board[board.whiteKingIndex-16] === B && phase <= MIDGAME? AI.PAR[29] : 0
        score += board.board[board.whiteKingIndex-17] === P? bonus : 0

        if (phase <= MIDGAME && board.board[board.whiteKingIndex-16] === 0) {
            score -= VPAWN
        }
        
        //TODO: Penalty for doubled pawns in king shelter (mg: 15, eg: 8)
    }
    
    if (phase <= MIDGAME && board.columns[board.blackKingIndex] === 3 || board.columns[board.blackKingIndex] === 4) score += AI.PAR[28]
    
    if (board.blackKingIndex !== 4) {
        score += board.board[board.blackKingIndex+15] === p? -bonus : 0
        score += board.board[board.blackKingIndex+16] === p? -bonus : 0
        score += board.board[board.blackKingIndex+16] === b && phase <= MIDGAME? -AI.PAR[29] : 0
        score += board.board[board.blackKingIndex+17] === p? -bonus : 0

        if (phase <= MIDGAME && board.board[board.blackKingIndex+16] === 0) {
            score += VPAWN
        }

        //TODO: Penalty for doubled pawns in king shelter (mg: 15, eg: 8)
    }

    return score
} 

AI.isLazyFutile = (sign, score, alpha, beta)=> {
    return false
    let signedScore = sign * score

    if (signedScore >= beta) {
        return true
    }
}

AI.getMobility = (board)=>{
    let score = 0
    let whiteMoves
    let blackMoves

    if (board.turn === WHITE) {
        whiteMoves = board.getMoves(true,false)
        board.changeTurn()
        blackMoves = board.getMoves(true,false)
        board.changeTurn()
    } else {
        blackMoves = board.getMoves(true,false)
        board.changeTurn()
        whiteMoves = board.getMoves(true,false)
        board.changeTurn()
    }

    score += (whiteMoves[N]? AI.MOB[N][0] * Math.log(whiteMoves[N]) - AI.MOB[N][1] | 0 : 0)
    score += (whiteMoves[B]? AI.MOB[B][0] * Math.log(whiteMoves[B]) - AI.MOB[B][1] | 0 : 0)
    score += (whiteMoves[R]? AI.MOB[R][0] * Math.log(whiteMoves[R]) - AI.MOB[R][1] | 0 : 0)
    score += (whiteMoves[Q]? AI.MOB[Q][0] * Math.log(whiteMoves[Q]) - AI.MOB[Q][1] | 0 : 0)
    
    score -= (blackMoves[n]? AI.MOB[N][0] * Math.log(blackMoves[n]) - AI.MOB[N][1] | 0 : 0)
    score -= (blackMoves[b]? AI.MOB[B][0] * Math.log(blackMoves[b]) - AI.MOB[B][1] | 0 : 0)
    score -= (blackMoves[r]? AI.MOB[R][0] * Math.log(blackMoves[r]) - AI.MOB[R][1] | 0 : 0)
    score -= (blackMoves[q]? AI.MOB[Q][0] * Math.log(blackMoves[q]) - AI.MOB[Q][1] | 0 : 0)

    return score
}

let max = 0
let min = 0
let total = 1

// IMPORTANTE: Esta función devuelve el valor de la estructura de peones.
// Dado que la estructura tiende a ser relativamente fija, el valor se guarda
// en una tabla hash y es devuelto en caso que se requiera evaluar la misma
// estructura. La tasa de acierto de las entradas hash es mayor al 95%, por lo
// que esta función es esencial para mantener un buen rendimiento.
AI.getStructure = (board, pawnindexW, pawnindexB)=> {
    let hashkey = board.pawnhashkey

    let hashentry = AI.pawnTable[hashkey % AI.pawntlength]

    AI.pnodes++

    if (hashentry) {
        if (hashentry.hashkey === hashkey) {
            AI.phnodes++
            return hashentry.score
        } else {
            AI.pawncollisions++
            // console.log('collision', total++)
        }
    }

    let pawnImbalance = AI.PAR[30]*(pawnindexW.length - pawnindexB.length)
    let doubled = AI.getDoubled(board, pawnindexW, pawnindexB)
    let defended = AI.getDefended(board, pawnindexW, pawnindexB)
    let passers = AI.getPassers(board, pawnindexW, pawnindexB)
    let space = AI.getSpace(board, pawnindexW, pawnindexB)
    let backward = AI.getBackwardPawns(board, pawnindexW, pawnindexB)
    let pawnShield = AI.getPawnShield(board, AI.phase)

    let score = pawnImbalance + doubled + defended + passers + space + backward + pawnShield

    AI.pawnTable[hashkey % AI.pawntlength] = {hashkey, score}
    return score

}

AI.getBackwardPawns = (board, pawnindexW, pawnindexB)=>{
    let whiteBackwardPawns = 0
    let blackBackwardPawns = 0

    for (let i = 0; i < pawnindexW.length; i++) {
        let square = pawnindexW[i]

        if (square >= 64 && square <= 87) {
            if (board.board[square + 15] !== P && board.board[square + 17] !== P && board.board[square + 33] !== P && board.board[square + 31] !== P) {
                whiteBackwardPawns++
            }
        }
    }

    for (let i = 0; i < pawnindexB.length; i++) {
        let square = pawnindexB[i]
        if (square >= 32 && square <= 55) {
            if (board.board[square - 15] !== p && board.board[square - 17] !== p && board.board[square - 33] !== p && board.board[square - 31] !== p) {
                blackBackwardPawns++
            }
        }
    }

    return -AI.PAR[31] * (whiteBackwardPawns - blackBackwardPawns)
}

AI.getSpace = (board, pawnindexW, pawnindexB)=>{
    let spaceW = 0
    let spaceB = 0

    for (let i = 0, len=pawnindexW.length; i < len; i++) {
        spaceW += board.ranksW[pawnindexW[i]] - 1
    }

    for (let i = 0, len=pawnindexB.length; i < len; i++) {
        spaceB += board.ranksB[pawnindexB[i]] - 1
    }

    let space = AI.PAR[32]*(spaceW - spaceB)

    return space
}

AI.getPassers = (board, pawnindexW, pawnindexB)=>{
    //De haberlos, estos arreglos almacenan la fila en que se encuentran los peones pasados
    let score = 0

    for (let i = 0, len=pawnindexW.length; i < len; i++) {
        let leftFile = pawnindexW[i] - 17
        let centerFile = pawnindexW[i] - 16
        let rightFile = pawnindexW[i] - 15

        let encounters = 0

        while (!encounters) {
            if ((centerFile & 0x88)) break
            if (board.board[centerFile] === p) encounters++
            if (encounters > 0) break
            centerFile -= 16
        }

        if (!encounters) {
            while (!encounters) {
                if ((leftFile & 0x88)) break
                if (board.board[leftFile] === p) encounters++
                if (encounters > 0) break
                leftFile -= 16
            }

            if (!encounters) {
                while (!encounters) {
                    if ((rightFile & 0x88)) break
                    if (board.board[rightFile] === p) encounters++
                    if (encounters > 0) break
                    rightFile -= 16
                }
            }
    
        }

        if (!encounters) {
            let bonus = AI.PASSERSBONUS[pawnindexW[i]]

            score += bonus

            //blocked passer
            let blockerindex = pawnindexW[i] - 16
            if (board.board[blockerindex] === n || board.board[blockerindex] === b) score-=20

            // Defended passer
            score += pawnindexB[i] + 15 === P? bonus/4 | 0 : 0
            score += pawnindexB[i] + 17 === P? bonus/4 | 0 : 0
            score += pawnindexB[i] -  1 === P? bonus/5 | 0 : 0
            score += pawnindexB[i] +  1 === P? bonus/5 | 0 : 0

            //TODO: passer protected by king
        }
    }
    
    for (let i = 0, len=pawnindexB.length; i < len; i++) {
        let leftFile = pawnindexB[i] + 17
        let centerFile = pawnindexB[i] + 16
        let rightFile = pawnindexB[i] + 15
        
        let encounters = 0
        
        while (!encounters) {
            if ((centerFile & 0x88)) break
            if (board.board[centerFile] === P) encounters++
            if (encounters > 0) break
            centerFile += 16
        }
        
        if (!encounters) {
            while (!encounters) {
                if ((leftFile & 0x88)) break
                if (board.board[leftFile] === P) encounters++
                if (encounters > 0) break
                leftFile += 16
            }
            
            if (!encounters) {
                while (!encounters) {
                    if ((rightFile & 0x88)) break
                    if (board.board[rightFile] === P) encounters++
                    if (encounters > 0) break
                    rightFile += 16
                }
            }
        }
        
        if (!encounters) {
            let bonus = AI.PASSERSBONUS[112^pawnindexB[i]]

            score -= bonus
            
            //blocked passer
            let blockerindex = pawnindexB[i] + 16
            if (board.board[blockerindex] === N || board.board[blockerindex] === B) score+=20

            // Defended passer
            score -= pawnindexB[i] - 15 === p? bonus/4 | 0 : 0
            score -= pawnindexB[i] - 17 === p? bonus/4 | 0 : 0
            score -= pawnindexB[i] -  1 === p? bonus/5 | 0 : 0
            score -= pawnindexB[i] +  1 === p? bonus/5 | 0 : 0
            
            //TODO: passer protected by king
        }
    }
    
    return score
}

AI.getDoubled = (board, pawnindexW, pawnindexB)=>{
    let score = 0

    if (pawnindexW.length > 2) {
        for (let i = 0, len=pawnindexW.length; i < len; i++) {
            let square = pawnindexW[i] - 16
            
            while (true) {
                let piece = board.board[square]
    
                if (piece) {
                    if (piece === P) score -= AI.DOUBLEDPENALTY[square]
                    break
                }
                square -= 16
    
                if ((square - 16) & 0x88) break
    
            }
        }
    }
    
    if (pawnindexB.length > 2) {
        for (let i = 0, len=pawnindexB.length; i < len; i++) {
            let square = pawnindexB[i] + 16
    
            while (true) {
                let piece = board.board[square]
    
                if (piece) {
                    if (piece === p) score += AI.DOUBLEDPENALTY[112^square]
                    break
                }
    
                square += 16
    
                if ((square + 16) & 0x88) break
            }
        }
    }

    return score
}

AI.getDefended = (board, pawnindexW, pawnindexB)=>{
    let defendedW = 0
    let defendedB = 0

    for (let i = 0, len=pawnindexW.length; i < len; i++) {
        if (board.board[pawnindexW[i] + 15] === P) {
            defendedW++
            continue
        }

        if (board.board[pawnindexW[i] + 17] === P) {
            defendedW++
            continue
        }

        if (board.board[pawnindexW[i] + 1] === P) {
            defendedW += 0.5
            continue
        }

        if (board.board[pawnindexW[i] - 1] === P) {
            defendedW += 0.5
            continue
        }
    }

    for (let i = 0, len=pawnindexB.length; i < len; i++) {
        if (board.board[pawnindexB[i] - 15] === p) {
            defendedB++
            continue
        }

        if (board.board[pawnindexB[i] - 17] === p) {
            defendedB++
            continue
        }

        if (board.board[pawnindexB[i] + 1] === p) {
            defendedB += 0.5
            continue
        }

        if (board.board[pawnindexB[i] - 1] === p) {
            defendedB += 0.5
            continue
        }
    }

    return AI.DEFENDED_VALUES[defendedW | 0] - AI.DEFENDED_VALUES[defendedB | 0]
}

// ORDENA LOS MOVIMIENTOS
// Esta función es fundamental para que la poda Alfa-Beta funcione de manera óptima
// El orden establecido permite que la primera jugada
// sea FAIL-HIGH en más de un 90% de los casos.
AI.sortMoves = function (moves, turn, ply, depth, ttEntry) {

    // let t0 = (new Date).getTime()
    let killer1, killer2

    if (AI.killers) {
        killer1 = AI.killers[turn][ply][0]
        killer2 = AI.killers[turn][ply][1]
    }

    let sortedMoves = []
    let unsortedMoves = []

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]

        move.mvvlva = 0
        move.hvalue = 0
        move.killer1 = 0
        move.killer2 = 0
        move.score = 0

        // CRITERIO 0: La jugada está en la Tabla de Trasposición
        if (ttEntry && ttEntry.flag < UPPERBOUND && move.key === ttEntry.move.key) {
            move.tt = true
            move.score += 2e9
            sortedMoves.push(move)
            continue
        }

        if (move.isCapture) {
            move.mvvlva = AI.MVVLVASCORES[move.piece][move.capturedPiece]
            
            if (move.mvvlva >= 6000) {
                // CRITERIO 3: La jugada es una captura posiblemente ganadora
                move.score += 1e7 + move.mvvlva
            } else {
                // CRITERIO 5: La jugada es una captura probablemente perdedora
                move.score += 4e6 + move.mvvlva
            }

            sortedMoves.push(move)

            continue
        }

        // CRITERIO: La jugada es un movimiento Killer
        // (Los killers son movimientos que anteriormente han generado Fail-Highs en el mismo ply)
        if (killer1 && killer1.key === move.key) {
            move.killer1 = true
            move.score += 6e6

            sortedMoves.push(move)

            continue
        }

        // CRITERIO: La jugada es el segundo movimiento Killer
        if (killer2 && killer2.key === move.key) {
            move.killer2 = true
            move.score += 5e6

            sortedMoves.push(move)

            continue
        }
        
        // CRITERIO: La jugada es una promoción
        if (move.promotingPiece) {
            move.score += 3e6

            sortedMoves.push(move)

            continue
        }

        // CRITERIO: Enroque
        if (move.castleSide && AI.phase <= MIDGAME) {
            move.score += 20000 // Enough to be over the history moves

            sortedMoves.push(move)

            continue
        }
        
        // CRITERIO 6: Movimientos históricos
        // Se da preferencia a movimientos posicionales que han tenido 
        // éxito en otras posiciones.

        let hvalue = AI.history[move.piece][move.to]

        if (hvalue) {
            move.score += hvalue

            sortedMoves.push(move)

            continue
        } else {
            unsortedMoves.push(move)
            // // y PSQT
            // if (turn === WHITE) {
            //     move.score += AI.PSQT[ABS[move.piece]][move.to] - AI.PSQT[ABS[move.piece]][move.from]
            // } else {
            //     move.score += AI.PSQT[ABS[move.piece]][112^move.to] - AI.PSQT[ABS[move.piece]][112^move.from]
            // }
        }

    }

    // ORDENA LOS MOVIMIENTOS
    // El tiempo de esta función toma hasta un 10% del total de cada búsqueda.
    // Sería conveniente utilizar un mejor método de ordenamiento.
    if (sortedMoves.length > 1) {
        sortedMoves.sort((a, b) => {
            return b.score - a.score
        })
    }

    moves = sortedMoves.concat(unsortedMoves)
    
    // let t1 = (new Date()).getTime()

    // AI.sortingTime += (t1 - t0)

    return moves
}

// BÚSQUEDA ¿EN CALMA?
// Para evitar el Efecto-Horizonte, la búqueda continua de manera forzosa hasta
// que se encuentra una posición "en calma" (donde ningún rey está en jaque ni
// donde la última jugada haya sido una captura). Cuando se logra esta posición
// "en calma", se evalúa la posición.
AI.quiescenceSearch = function (board, alpha, beta, depth, ply, pvNode, illegalMovesSoFar) {

    AI.qsnodes++

    let turn = board.turn
    let opponentTurn = turn === WHITE? BLACK : WHITE
    let legal = 0
    let incheck = board.isKingInCheck()
    let standpat = alpha // Only to prevent undefined values for standpat
    
    let hashkey = board.hashkey

    if (!incheck) {
        standpat = AI.evaluate(board, ply, alpha, beta, pvNode, incheck, illegalMovesSoFar) | 0

        if (standpat >= beta) {
            return standpat
        }

        if (standpat > alpha) alpha = standpat
    }

    let moves = board.getMoves(false, !incheck)

    if (moves.length === 0) {
        return alpha
    }
    
    let ttEntry = AI.ttGet(turn, hashkey)
    let score = -INFINITY
    
    moves = AI.sortMoves(moves, turn, ply, depth, ttEntry)

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]

        if (!incheck) {
            // Bad captures pruning (+34 ELO)
            if (move.mvvlva < 6000) {
                if (board.isSquareAttacked(move.to, opponentTurn, false, false)) continue
            }
            
            // delta pruning para cada movimiento
            if (standpat + AI.PIECE_VALUES[OPENING][ABS[move.capturedPiece]]/this.nullWindowFactor < alpha) {
                continue
            }
        }

        // let m0 = (new Date()).getTime()
        if (board.makeMove(move)) {
            // AI.moveTime += (new Date()).getTime() - m0
            legal++

            score = -AI.quiescenceSearch(board, -beta, -alpha, depth - 1, ply + 1, pvNode)

            board.unmakeMove(move)

            if (score >= beta) {
                AI.ttSave(turn, hashkey, score, LOWERBOUND, depth, move)
                return score
            }
            
            if (score > alpha) {
                alpha = score
            }
        }
    }

    if (incheck && legal === 0) {
        return -MATE + ply
    }

    return alpha

}

AI.ttSave = function (turn, hashkey, score, flag, depth, move) {
    if (AI.stop) {
        // console.log('stop')
        return
    }

    if (!move) {
        // console.log('no move')
        return
    }

    AI.hashTable[turn][hashkey % AI.htlength] = {
        hashkey,
        score,
        flag,
        depth,
        move
    }

    AI.totalTTnodes++
}

AI.ttGet = function (turn, hashkey) {
    AI.ttGets++
    let ttEntry = AI.hashTable[turn][hashkey % AI.htlength]
    
    if (ttEntry) {
        if (ttEntry.hashkey === hashkey) {
            AI.ttnodes++
            return ttEntry
        } else {
            AI.collisions++
            // console.log('Collision', AI.collisions)
            // AI.hashTable[turn][hashkey % AI.htlength] = null
            return null
        }
    } else {
        return null
    }
}

AI.saveHistory = function (turn, move, value) {
    AI.history[move.piece][move.to] += 32 * value - AI.history[move.piece][move.to]*Math.abs(value)/512 | 0
}

// PRINCIPAL VARIATION SEARCH
// El método PVS es Negamax + Ventana-Nula
AI.PVS = function (board, alpha, beta, depth, ply, allowNullMove, illegalMovesSoFar) {

    let mating_value = MATE - ply;

    if (mating_value < beta) {
        beta = mating_value
        if (alpha >= mating_value) return mating_value
    }

    mating_value = -MATE + ply;

    if (mating_value > alpha) {
        alpha = mating_value
        if (beta <= mating_value) return mating_value
    }

    let alphaOriginal = alpha
    let pvNode = beta - alpha > 1 // PV-Node
    
    let cutNode = beta - alpha === 1 // Cut-Node
    
    if (pvNode) AI.pvnodes++
    
    AI.nodes++
    
    if (AI.iteration > AI.mindepth[AI.phase]) {
        if (Date.now() > AI.timer + AI.milspermove) {
            AI.stop = true
        }
    }

    let turn = board.turn
    let opponentTurn = turn === WHITE? BLACK : WHITE
    let sign = turn === WHITE? 1 : -1
    let hashkey = board.hashkey

    let ttEntry = AI.ttGet(turn, hashkey)

    if (ttEntry && ttEntry.depth >= depth) {
        if (ttEntry.flag === EXACT) {
            return ttEntry.score
        } else if (ttEntry.flag === LOWERBOUND) {
            if (ttEntry.score > alpha) alpha = ttEntry.score
        } else if (ttEntry.flag === UPPERBOUND) {
            if (ttEntry.score < beta) beta = ttEntry.score
        }

        if (alpha >= beta) {
            if (depth > 0) {
                return ttEntry.score
            } 
        }
    }

    // if (!ttEntry) {
    //     let ttOppositeEntry = AI.ttGet(turn === WHITE? BLACK : WHITE, hashkey)
    
    //     if (ttOppositeEntry && ttOppositeEntry.depth >= depth) {
    //         AI.etcNodes++

    //         let ttScore = -ttOppositeEntry.score

    //         if (ttOppositeEntry.flag === LOWERBOUND) {
    //             if (ttScore < beta) {
    //                 beta = ttScore
    //             }
    //         } else if (ttOppositeEntry.flag === UPPERBOUND) {
                
    //             if (ttScore > alpha) {
    //                 alpha = ttScore
    //             }
    //         }
    //     }
    // }

    let incheck = board.isKingInCheck()
    
    //Búsqueda QS
    if (depth <= 0) {
        return AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode, illegalMovesSoFar)
    }
    
    if (AI.stop && AI.iteration > AI.mindepth[AI.phase]) return alpha
    
    let mateE = 0 // Mate threat extension
    
    let staticeval = AI.evaluate(board, ply, alpha, beta, pvNode, incheck) | 0

    // IID
    if (!ttEntry) depth--

    let prune = !incheck && ply > 2 && (depth < 9 || cutNode) && alpha < MATE - AI.totaldepth
    // let prune = !incheck && alpha < MATE - AI.totaldepth

    if (prune) {
        //Futility
        if (staticeval - MARGIN2*depth >= beta) {
            return staticeval
        }
    
        // Null move pruning
        if (allowNullMove && staticeval >= beta && AI.phase < LATE_ENDGAME) {
            if (!board.enPassantSquares[board.enPassantSquares.length - 1]) {
                board.changeTurn()
                let nullR = depth > 6? 4 : 3
                let nullScore = -AI.PVS(board, -beta, -beta + 1, depth - nullR - 1, ply, false)
                board.changeTurn()

                if (nullScore >= beta) {
                    return nullScore
                } else {
                    if (nullScore < -MATE + AI.totaldepth) {
                        mateE = 1
                    }
                }
            }
        }
    }

    // Razoring
    if (staticeval + MARGIN1 < beta) { // likely a fail-low node ?
        if (depth <= 3) {
            let score = AI.quiescenceSearch(board, alpha, beta, 0, ply, pvNode, illegalMovesSoFar)

            if (score < beta) return score
        } else {
            if (staticeval + MARGIN2 < beta) {
                depth -= 2
            } else {
                depth--
            }
        }
        
    }

    let moves = board.getMoves()

    moves = AI.sortMoves(moves, turn, ply, depth, ttEntry)

    let bestmove = moves[0]
    let legal = 0
    let illegalMoves = 0
    let bestscore = -INFINITY
    let score

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]
        let piece = move.piece

        // Extensiones
        let E = mateE && depth <= 2? 1 : 0

        if (pvNode && depth <= 2) {
            if (AI.phase === LATE_ENDGAME && (piece === P || piece === p)) E = 1
        }

        //Reducciones
        let R = 0

        if (prune && !E && !move.killer1 && legal >= 1) {
            // Futility Pruning
            if (depth <= 3) {
                if (move.isCapture) {
                    if (staticeval + AI.PIECE_VALUES[OPENING][ABS[move.capturedPiece]]/this.nullWindowFactor + depth*SMALLMARGIN < alpha) {
                        continue
                    }
                } else {
                    if (staticeval + depth*SMALLMARGIN < alpha) {
                        continue
                    }
                }
            }

            // if (cutNode && ply > 1 && i > 12 && !move.isCapture && staticeval > alpha - VERYSMALLMARGIN) {
            //     let limit = i > 20? 0.85 : 0.8
            //     if (Math.random() < limit) {
            //         AI.rnodes++
            //         continue
            //     }
            // }
        }

        // Enhanced Transposition Cut-Off actual position +12 ELO
        if (!ttEntry) {
            // total++
            
            let ttETC = AI.ttGet(turn, hashkey)
            
            if (ttETC && ttETC.hashkey === hashkey && ttETC.depth >= depth) {
                AI.etcNodes++
                // max++
                if (ttETC.flag === LOWERBOUND) {
                    if (ttETC.score > alpha) alpha = ttETC.score
                } else if (ttETC.flag === UPPERBOUND) {
                    if (ttETC.score < beta) beta = ttETC.score
                } else { // EXACT
                    if (ttETC.score >= beta) { // > beta?
                        return ttETC.score
                    }
                }
            }
        }

        if (cutNode && depth >= 3 && !mateE) {
            R += AI.LMR_TABLE[depth][legal]

            if (pvNode || incheck) {
                R--
            }

            if (cutNode && !move.killer1) R++

            // Reduce negative history
            if (AI.history[piece][move.to] < 0) R++
            
            if (!move.isCapture) {
                // Move count reductions
                if (legal >= (3 + depth*depth) / 2) {
                    R++
                }
                
                // Bad moves reductions
                if (AI.phase <= EARLY_ENDGAME) {
                    // console.log('no')
                    if (board.turn === WHITE && piece !== P && (board.board[move.to-17] === p || board.board[move.to-15] === p)) {
                        R+=4
                    }
                    
                    if (board.turn === BLACK && piece !== p && (board.board[move.to+17] === P || board.board[move.to+15] === P)) {
                        R+=4
                    }
                }
            } else {
                // if TT Move is a capture
                if (ttEntry && ttEntry.move.key === move.key) R++
            }

            // if (R < 0) R = 0

            // let rLimit = legal > 4 && !move.isCapture? 2 : 4

            // if (depth > 6 && Math.abs(alpha - staticeval) > MARGIN3) {
            //     R = Math.max(R, depth - rLimit)
            // }
        }

        // let m0 = (new Date()).getTime()
        if (board.makeMove(move)) {
            // AI.moveTime += (new Date()).getTime() - m0
            legal++

            // Enhanced Transposition Cut-Off +16 ELO
            let ttETC = AI.ttGet(board.turn, board.hashkey)

            if (!ttEntry && ttETC && ttETC.hashkey === board.hashkey && ttETC.depth >= depth) {
                AI.etcNodes++
                
                let scoreETC = -ttETC.score
                
                if (ttETC.flag === LOWERBOUND) {
                    if (scoreETC < beta) beta = ttETC.score
                    // console.log('beta')
                } else if (ttETC.flag === UPPERBOUND) {
                    if (scoreETC > alpha) alpha = ttETC.score
                    // console.log('alpha')
                }
            }

            if (legal === 1) {
                // El primer movimiento se busca con ventana total y sin reducciones
                // if (AI.stop) return alphaOriginal
                score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1, allowNullMove, illegalMoves)
            } else {
                if (AI.stop) {
                    board.unmakeMove(move)
                    return alphaOriginal
                }
                score = -AI.PVS(board, -alpha-1, -alpha, depth + E - R - 1, ply + 1, allowNullMove, illegalMoves)

                if (!AI.stop && score > alpha) {
                    R = 0
                    score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1, allowNullMove, illegalMoves)
                }
            }

            board.unmakeMove(move)

            if (AI.stop) return alphaOriginal //tested ok
            
            if (score > alpha) {
                bestscore = score
                bestmove = move
                alpha = score
                
                // Fail-high
                if (score >= beta) {
                    if (legal === 1) {
                        AI.fhf++
                    }
                    
                    AI.fh++
                    
                    //LOWERBOUND
                    
                    if (!move.isCapture) {
                        if (AI.killers[turn | 0][ply][0] && AI.killers[turn | 0][ply][0].key != move.key) {
                                AI.killers[turn | 0][ply][1] = AI.killers[turn | 0][ply][0]
                        }
                        
                        AI.killers[turn | 0][ply][0] = move
                        
                        AI.saveHistory(turn, move, depth*depth)
                    }
                    
                    AI.ttSave(turn, hashkey, score, LOWERBOUND, depth + E - R, move)
                    
                    return score
                }

                if (!move.isCapture) { AI.saveHistory(turn, move, depth) }

            } else {
                if (!move.isCapture) { AI.saveHistory(turn, move, -depth) }
            }
        } else {
            illegalMoves++
        }
    }

    if (legal === 0) {
        if (incheck) {
            // Mate
            // AI.ttSave(turn, hashkey, -MATE + ply, EXACT, depth, bestmove)
            // AI.ttSave(turn, hashkey, -MATE + ply, LOWERBOUND, depth, bestmove)
            
            return -MATE + ply
        } else {
            // Ahogado
            // AI.ttSave(turn, hashkey, DRAW, EXACT, depth, bestmove)
            // AI.ttSave(turn, hashkey, DRAW, LOWERBOUND, depth, bestmove)
            
            return DRAW
        }

    } else {

        if (bestscore > alphaOriginal) {
            // Mejor movimiento
            if (bestmove) {
                AI.ttSave(turn, hashkey, bestscore, EXACT, depth, bestmove)
                // AI.ttSave(turn, hashkey, bestscore, LOWERBOUND, depth, bestmove)
            }

            return bestscore
        } else {
            //Upperbound
            AI.ttSave(turn, hashkey, alphaOriginal, UPPERBOUND, depth, bestmove)

            return alphaOriginal
        }

    }
}

AI.setPhase = function (board) {
    //OPENING
    AI.phase = 0

    //MIDGAME
    if (AI.nofpieces <= 28 || (board.movenumber && board.movenumber > 8)) {
        AI.phase = 1
    }

    let queens = 0

    for (let e of board.board) {
        if (e === q || e === Q) queens++
    }

    //EARLY ENDGAME (the king enters)
    if (queens === 0 && AI.nofpieces > 12) {
        if (AI.nofpieces <= 24 || Math.abs(AI.lastscore) > AI.PIECE_VALUES[OPENING][ROOK]) {
            AI.phase = 2
        }
    }

    //LATE ENDGAME
    if (AI.nofpieces <= 12 || (queens === 0 && Math.abs(AI.lastscore) >= AI.PIECE_VALUES[OPENING][QUEEN])) {
        AI.phase = 3
    }

    // AI.randomizePSQT()
}

AI.getPV = function (board, length) {
    let PV = [null]
    let startinghashkey = board.hashkey
    let legal = 0

    let ttEntry
    let ttFound

    for (let i = 0; i < length; i++) {
        ttFound = false
        let hashkey = board.hashkey
        ttEntry = AI.ttGet(board.turn, hashkey)

        if (ttEntry) {
            let moves = board.getMoves().filter(move => {
                return move.key === ttEntry.move.key
            })


            if (moves.length > 0) {
                if (board.makeMove(ttEntry.move)) {
                    legal++
                    
                    PV.push(JSON.parse(JSON.stringify(ttEntry.move)))
                    
                    ttFound = true
                }
            }
        } else {
            // break
        }
    }
    
    for (let i = PV.length - 1; i > 0; i--) {
        board.unmakeMove(PV[i])
    }
    
    return PV
}

// https://www.chessprogramming.org/MTD(f) +188 ELO
AI.MTDF = function (board, f, d, lowerBound, upperBound) {
    //Esta línea permite que el algoritmo funcione como PVS normal
    // return AI.PVS(board, lowerBound, upperBound, d, 1, true)
    
    let bound = [lowerBound, upperBound] // lower, upper
    let lastIterationF = f

    do {
        let beta = f + (f === bound[0])
        f = AI.PVS(board, d < 10? beta - 2 : beta - 1, beta, d, 1, true)
        bound[(f < beta) | 0] = f
    } while (bound[0] < bound[1] && !AI.stop)

    if (AI.stop) {
        return lastIterationF
    } else {
        return f
    }
}
 

AI.search = function (board, options) {
    AI.sortingTime = 0
    AI.searchTime0 = Date.now()
    AI.collisions = 0
    AI.ttGets = 0.1
    AI.pawncollisions = 0

    if (board.movenumber && board.movenumber <= 1) {
        AI.lastscore = 0
        AI.bestmove = 0
        AI.bestscore = 0
        AI.f = 0
    }

    let isEnPassant = board.enPassantSquares

    // console.log(isEnPassant)

    if (options && options.seconds) AI.secondspermove = options.seconds

    AI.milspermove = 1000 * AI.secondspermove

    AI.nofpieces = 0

    for (let e of board.board) {
        if (e !== null && e !== 0) AI.nofpieces++
    }

    let nmoves = board.movenumber * 2
    let changeofphase = false

    AI.setPhase(board)

    if (AI.lastphase !== AI.phase) changeofphase = true

    AI.lastphase = AI.phase

    if (board.movenumber && board.movenumber <= 1) {
        AI.createTables(board, true, true, true, true)
        AI.lastscore = 0
        AI.f = 0
    } else {
        if (changeofphase) {
            AI.createTables(board, true, true, true, true)
        }

        AI.f = AI.lastscore / AI.nullWindowFactor | 0
    }

    if (!AI.f) AI.f = 0

    AI.absurd = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
    ]

    AI.RANDOMLIST = new Array(218)

    for (let i = 0; i < 218; i++) {
        AI.RANDOMLIST[i] = Math.sqrt(2) * Math.sqrt(Math.log(i) / (i - 1))
    }

    AI.RANDOMLIST[0] = 1
    AI.RANDOMLIST[1] = 1

    // console.log(AI.RANDOMLIST)

    // process.exit()

    return new Promise((resolve, reject) => {
        let color = board.turn

        AI.color = color

        let isWhite = color === 1

        if (isWhite) {
            AI.TESTER = true
        } else {
            AI.TESTER = false
        }

        AI.nodes = 0
        AI.qsnodes = 0
        AI.enodes = 0
        AI.pvnodes = 0
        AI.ttnodes = 0
        AI.etcNodes = 0
        AI.evalhashnodes = 0
        AI.evalnodes = 0
        AI.rnodes = 0
        AI.evalTime = 0
        AI.moveTime = 0
        AI.iteration = 0
        AI.timer = Date.now()
        AI.PV = AI.getPV(board, 1)
        AI.stop = false

        AI.changeinPV = true

        let score = 0
        AI.fhfperc = 0

        AI.killers = []

        AI.killers[WHITE] = (new Array(120)).fill([null, null])
        AI.killers[BLACK] = (new Array(120)).fill([null, null])

        AI.fh = AI.fhf = 0.001
        
        AI.previousls = AI.lastscore

        let depth = 0
        let alpha = -INFINITY
        let beta = INFINITY

        if (true) {
            //Iterative Deepening
            for (; depth <= AI.totaldepth; ) {
                // console.log(board.hashkey)
                if (AI.stop) break

                AI.bestmove = [...AI.PV][1]

                AI.iteration++

                let ttEntry = AI.ttGet(board.turn, board.hashkey)

                if (ttEntry && ttEntry.depth >= depth) {
                    AI.f = ttEntry.score
                } else {
                    AI.f = AI.MTDF(board, AI.f, depth, alpha, beta)
                }

                score = AI.nullWindowFactor * (isWhite ? 1 : -1) * AI.f

                
                if (!AI.stop) {
                    AI.PV = AI.getPV(board, AI.totaldepth)
                    AI.lastscore = score
                }

                if ([...AI.PV][1] && AI.bestmove && [...AI.PV][1].value !== AI.bestmove.value) {
                    AI.changeinPV = true
                } else {
                    AI.changeinPV = false
                }

                AI.fhfperc = Math.round(AI.fhf * 100 / AI.fh)

                // console.log(depth, `FHF: ${AI.fhfperc}%`)

                if (AI.PV && !AI.stop) {
                    // console.log('FHF', AI.fhfperc, 'Depth:', depth, 'Score:', score, 'Nodes:', AI.nodes+AI.qsnodes, 'PV Nodes', AI.pvnodes, 'Pawn Hit Rate:',(AI.phnodes / AI.pnodes * 100 | 0))
                }
            
                depth++
            }
        }

        // console.log(AI.previousls, AI.lastscore)

        // if (AI.TESTER) {
        //     console.info(`_ AI.TESTER ${AI.phase} _____________________________________`)
        // } else {
        //     console.info('________________________________________________________________________________')
        // }

        let score100 = AI.lastscore * (100/VPAWN)

        let sigmoid = 1 / (1 + Math.pow(10, -score100 / 500))

        AI.lastmove = AI.bestmove

        //zugzwang prevention
        if (!AI.bestmove) {
            // console.log('No bestmove')
            let moves = board.getMoves()

            AI.bestmove = moves[moves.length * Math.random() | 0]
        }

        AI.searchTime1 = Date.now()
        AI.searchTime = AI.searchTime1 - AI.searchTime0
        // console.log(AI.lastscore)
        // console.log('Sorting % time: ', (AI.sortingTime / AI.searchTime) * 100 | 0,
        //             'Evaluation % time: ', (AI.evalTime / AI.searchTime) * 100 | 0,
        //             'Random Nodes Pruned (%): ', (AI.rnodes / AI.nodes) * 100 | 0,
        //             'ETC (%): ', (AI.etcNodes/AI.nodes*1000 | 0) / 10,
        //             'Collisions (%): ', (AI.collisions/AI.ttGets*1000 | 0) / 10,
        //             'Pawn Collisions (%): ', (AI.pawncollisions/AI.evalnodes*1000 | 0) / 10,
        //             'NPS: ', (AI.nodes + AI.qsnodes) / options.seconds | 0,
        // )

        // console.log(AI.bestmove, (AI.moveTime / AI.searchTime) * 100 | 0)

        resolve({
            n: board.movenumber, phase: AI.phase, depth: AI.iteration - 1, from: board.board64[AI.bestmove.from],
            to: board.board64[AI.bestmove.to], fromto0x88: [AI.bestmove.from, AI.bestmove.to],
            score: AI.lastscore | 0, sigmoid, nodes: AI.nodes, qsnodes: AI.qsnodes,
            FHF: AI.fhfperc + '%', version: AI.version
        })

        // AI.createTables(board, AI.collisions/AI.ttGets > 0.005, AI.collisions/AI.ttGets > 0.005, true, AI.pawncollisions/AI.evalnodes > 0.005)
    })
}

AI.createTables(true, true, true, true)

module.exports = AI
