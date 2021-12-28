"use strict"

const {sort} = require('fast-sort')
require('fast-filter').install('filter')

let seedrandom = require('seedrandom')
let rnd = new seedrandom('orobas1234', {global: true})

console.log(Math.random())

let AI = {
    version: "2.1.5",
    totaldepth: 48,
    ttNodes: 0,
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
    pawntlength: 1e6,
    // mindepth: [6,10,12,18],
    // mindepth: [18,20,22,24],
    mindepth: [1,1,1,1],
    secondspermove: 1,
    lastmove: null,
    f: 0,
    previousls: 0,
    lastscore: 0,
    nullWindowFactor: 20 // +132 ELO
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

AI.PIECE_VALUES[OPENING][p] = -VPAWN | 0
AI.PIECE_VALUES[OPENING][n] = -VPAWN*4.10 | 0
AI.PIECE_VALUES[OPENING][b] = -VPAWN*4.45 | 0
AI.PIECE_VALUES[OPENING][r] = -VPAWN*5.80 | 0
AI.PIECE_VALUES[OPENING][q] = -VPAWN*12.50 | 0
AI.PIECE_VALUES[OPENING][k] = 0

AI.PIECE_VALUES[OPENING][P] = VPAWN | 0
AI.PIECE_VALUES[OPENING][N] = VPAWN*4.10 | 0
AI.PIECE_VALUES[OPENING][B] = VPAWN*4.45 | 0
AI.PIECE_VALUES[OPENING][R] = VPAWN*5.80 | 0
AI.PIECE_VALUES[OPENING][Q] = VPAWN*12.50 | 0
AI.PIECE_VALUES[OPENING][K] = 0

AI.PIECE_VALUES[LATE_ENDGAME][p] = -VPAWN*1.14 | 0
AI.PIECE_VALUES[LATE_ENDGAME][n] = -VPAWN*3.42 | 0
AI.PIECE_VALUES[LATE_ENDGAME][b] = -VPAWN*3.62 | 0
AI.PIECE_VALUES[LATE_ENDGAME][r] = -VPAWN*6.24 | 0
AI.PIECE_VALUES[LATE_ENDGAME][q] = -VPAWN*11.40 | 0
AI.PIECE_VALUES[LATE_ENDGAME][k] = 0

AI.PIECE_VALUES[LATE_ENDGAME][P] = VPAWN*1.14 | 0
AI.PIECE_VALUES[LATE_ENDGAME][N] = VPAWN*3.42 | 0
AI.PIECE_VALUES[LATE_ENDGAME][B] = VPAWN*3.62 | 0
AI.PIECE_VALUES[LATE_ENDGAME][R] = VPAWN*6.24 | 0
AI.PIECE_VALUES[LATE_ENDGAME][Q] = VPAWN*11.40 | 0
AI.PIECE_VALUES[LATE_ENDGAME][K] = 0

// Total material value doesnt count pawns
AI.maxMaterialValue = 4 * AI.PIECE_VALUES[OPENING][N] +
                      4 * AI.PIECE_VALUES[OPENING][B] +
                      4 * AI.PIECE_VALUES[OPENING][R] +
                      2 * AI.PIECE_VALUES[OPENING][Q] +
                      2 * AI.PIECE_VALUES[OPENING][K]
                      
console.log('Max material value', AI.maxMaterialValue)

AI.BISHOP_PAIR = [50, 50, 80, 80]

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

AI.DEFENDED_VALUES = [0, 5, 10, 15, 20, 25, 30, 10,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40]

AI.BLOCKEDPAWNBONUS = [
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
   15, 18, 22, 30, 30, 22, 18, 15,  null,  null,  null,  null,  null,  null,  null,  null, 
    7,  9, 11, 13, 13, 11,  9,  7,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
]

AI.DEFENDEDPAWNBONUS = [
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
   35, 36, 37, 38, 38, 37, 36, 35,  null,  null,  null,  null,  null,  null,  null,  null, 
   20, 21, 23, 25, 25, 23, 21, 20,  null,  null,  null,  null,  null,  null,  null,  null, 
   11, 13, 15, 17, 17, 15, 13, 11,  null,  null,  null,  null,  null,  null,  null,  null, 
    5,  6,  8,  9,  9,  8,  6,  5,  null,  null,  null,  null,  null,  null,  null,  null, 
    2,  3,  4,  5,  5,  4,  3,  2,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null,
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null,
]

AI.ALIGNEDPAWNBONUS = [
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
   44, 45, 47, 49, 49, 47, 45, 44,  null,  null,  null,  null,  null,  null,  null,  null, 
   35, 36, 37, 38, 38, 37, 36, 35,  null,  null,  null,  null,  null,  null,  null,  null, 
   20, 21, 23, 25, 25, 23, 21, 20,  null,  null,  null,  null,  null,  null,  null,  null, 
   11, 13, 15, 17, 17, 15, 13, 11,  null,  null,  null,  null,  null,  null,  null,  null, 
    5,  6,  8,  9,  9,  8,  6,  5,  null,  null,  null,  null,  null,  null,  null,  null, 
    2,  3,  4,  5,  5,  4,  3,  2,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null,
]

AI.NEIGHBOURPAWNBONUS = [
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
   10, 15, 20, 25, 25, 20, 15, 10,  null,  null,  null,  null,  null,  null,  null,  null, 
    6,  8, 12, 16, 16, 12,  8,  6,  null,  null,  null,  null,  null,  null,  null,  null, 
    4,  6,  8, 11, 11,  8,  6,  4,  null,  null,  null,  null,  null,  null,  null,  null, 
    2,  3,  4,  5,  5,  4,  3,  2,  null,  null,  null,  null,  null,  null,  null,  null, 
    2,  2,  3,  4,  4,  3,  2,  2,  null,  null,  null,  null,  null,  null,  null,  null, 
    1,  2,  3,  4,  4,  3,  2,  1,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null,
]

AI.LEVERPAWNBONUS = [
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
   16, 18, 22, 24, 24, 22, 18, 16,  null,  null,  null,  null,  null,  null,  null,  null, 
    8,  9, 11, 13, 13, 11,  9,  8,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
]

AI.PASSERSBONUS = [
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
   70, 85, 95,110,110, 95, 85, 70,  null,  null,  null,  null,  null,  null,  null,  null, 
   50, 60, 68, 76, 76, 68, 60, 50,  null,  null,  null,  null,  null,  null,  null,  null, 
   30, 40, 48, 56, 56, 48, 40, 30,  null,  null,  null,  null,  null,  null,  null,  null, 
   20, 30, 38, 46, 46, 38, 30, 20,  null,  null,  null,  null,  null,  null,  null,  null, 
   13, 18, 24, 32, 32, 24, 18, 13,  null,  null,  null,  null,  null,  null,  null,  null, 
    6,  8, 12, 14, 14, 13,  8,  6,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
]

AI.DOUBLEDPENALTY = [
     0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    38, 18, 23, 28, 28, 23, 18, 38,  null,  null,  null,  null,  null,  null,  null,  null, 
    36, 16, 21, 26, 26, 21, 16, 36,  null,  null,  null,  null,  null,  null,  null,  null, 
    34, 14, 19, 24, 24, 19, 14, 34,  null,  null,  null,  null,  null,  null,  null,  null, 
    32, 12, 17, 22, 22, 17, 12, 32,  null,  null,  null,  null,  null,  null,  null,  null, 
    30, 10, 15, 20, 20, 15, 10, 30,  null,  null,  null,  null,  null,  null,  null,  null, 
     0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
     0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
]

AI.NMOBILITY = [
    10, 11, 12, 13, 13, 12, 11, 10,  null,  null,  null,  null,  null,  null,  null,  null,
    12, 13, 14, 15, 15, 14, 13, 12,  null,  null,  null,  null,  null,  null,  null,  null,
    12, 17, 22, 24, 24, 22, 17, 12,  null,  null,  null,  null,  null,  null,  null,  null,
    16, 24, 28, 30, 30, 28, 24, 16,  null,  null,  null,  null,  null,  null,  null,  null,
    16, 24, 28, 30, 30, 28, 24, 16,  null,  null,  null,  null,  null,  null,  null,  null,
    12, 17, 22, 24, 24, 22, 17, 12,  null,  null,  null,  null,  null,  null,  null,  null,
    12, 13, 14, 15, 15, 14, 13, 12,  null,  null,  null,  null,  null,  null,  null,  null,
    10, 11, 12, 13, 13, 12, 11, 10,  null,  null,  null,  null,  null,  null,  null,  null,
]

AI.BMOBILITY = [
     8,  9, 10, 11, 11, 10,  9,  8,  null,  null,  null,  null,  null,  null,  null,  null,
    10, 11, 12, 13, 13, 12, 11, 10,  null,  null,  null,  null,  null,  null,  null,  null,
    12, 17, 18, 21, 21, 18, 17, 12,  null,  null,  null,  null,  null,  null,  null,  null,
    15, 22, 25, 26, 26, 25, 22, 15,  null,  null,  null,  null,  null,  null,  null,  null,
    15, 22, 25, 26, 26, 25, 22, 15,  null,  null,  null,  null,  null,  null,  null,  null,
    12, 17, 18, 21, 21, 18, 17, 12,  null,  null,  null,  null,  null,  null,  null,  null,
    10, 11, 12, 13, 13, 12, 11, 10,  null,  null,  null,  null,  null,  null,  null,  null,
     8,  9, 10, 11, 11, 10,  9,  8,  null,  null,  null,  null,  null,  null,  null,  null,
]

AI.RMOBILITY = [
     6,  7,  8,  9,  9,  8,  7,  6,  null,  null,  null,  null,  null,  null,  null,  null,
    10, 11, 12, 13, 13, 12, 11, 10,  null,  null,  null,  null,  null,  null,  null,  null,
     9, 10, 11, 12, 12, 11, 10,  9,  null,  null,  null,  null,  null,  null,  null,  null,
    11, 12, 13, 14, 13, 13, 12, 11,  null,  null,  null,  null,  null,  null,  null,  null,
     9, 10, 11, 12, 12, 11, 10,  9,  null,  null,  null,  null,  null,  null,  null,  null,
     7,  8,  9, 10, 10,  9,  8,  7,  null,  null,  null,  null,  null,  null,  null,  null,
     5,  6,  7,  8,  8,  7,  6,  5,  null,  null,  null,  null,  null,  null,  null,  null,
     4,  5,  6,  7,  7,  6,  5,  4,  null,  null,  null,  null,  null,  null,  null,  null,
]

AI.QMOBILITY = [
     2,  3,  3,  4,  4,  3,  3,  2,  null,  null,  null,  null,  null,  null,  null,  null,
     3,  3,  3,  4,  4,  3,  3,  3,  null,  null,  null,  null,  null,  null,  null,  null,
     6,  6,  6,  7,  7,  6,  6,  6,  null,  null,  null,  null,  null,  null,  null,  null,
     5,  6,  6,  7,  7,  6,  6,  5,  null,  null,  null,  null,  null,  null,  null,  null,
     4,  5,  5,  6,  6,  5,  5,  4,  null,  null,  null,  null,  null,  null,  null,  null,
     3,  4,  5,  5,  5,  5,  4,  3,  null,  null,  null,  null,  null,  null,  null,  null,
     2,  3,  3,  4,  4,  3,  3,  2,  null,  null,  null,  null,  null,  null,  null,  null,
     2,  3,  3,  4,  4,  3,  3,  2,  null,  null,  null,  null,  null,  null,  null,  null,
]

AI.OUTPOSTBONUSKNIGHT= [
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
   28, 45, 60, 70, 70, 60, 45, 28,  null,  null,  null,  null,  null,  null,  null,  null,
   15, 28, 35, 55, 55, 35, 28, 15,  null,  null,  null,  null,  null,  null,  null,  null,
    9, 14, 18, 25, 25, 18, 14,  9,  null,  null,  null,  null,  null,  null,  null,  null,
    5,  7,  9, 12, 12,  9,  7,  5,  null,  null,  null,  null,  null,  null,  null,  null,
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 

]

AI.OUTPOSTBONUSBISHOP= [
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
   28, 45, 60, 70, 70, 60, 45, 28,  null,  null,  null,  null,  null,  null,  null,  null,
   15, 28, 35, 55, 55, 35, 28, 15,  null,  null,  null,  null,  null,  null,  null,  null,
    8, 14, 18, 25, 25, 18, 14,  8,  null,  null,  null,  null,  null,  null,  null,  null,
    5,  7,  9, 12, 12,  9,  7,  5,  null,  null,  null,  null,  null,  null,  null,  null,
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
    0,  0,  0,  0,  0,  0,  0,  0,  null,  null,  null,  null,  null,  null,  null,  null, 
]

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
let mvvlvaScores = [
        /* P      N      B      R      Q      K
  /*P*/[6002, 20225, 20250, 20400, 20800, 26900],
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
    console.log('Creating tables', tt, ev, hh, pp)

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
AI.evaluate = function (board, ply, alpha, beta, pvNode, incheck) {
    // let t0 = Date.now()

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

    // if (Math.random()>0.999) console.log(mgFactor, egFactor)

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

        if (AI.phase === OPENING) {
            if (piece === B) {
                if ((i === 83 || i === 84) && board.board[i+16] === P) score -= 100

                // Bishop blocked by own pawns
                if (board.board[i-15] === P) score -= 40
                if (board.board[i-17] === P) score -= 40

            } else if (piece === b) {
                if ((i === 35 || i === 36) && board.board[i-16] === p) score += 100

                // Bishop blocked by own pawns
                if (board.board[i+15] === p) score += 40
                if (board.board[i+17] === p) score += 40
            }
        }
        
        if (!incheck && pvNode) {
            // if (board.color(piece) === WHITE) {
            //     if (piece !== P) score -= board.isSquareAttacked(i, BLACK, true)*AI.PIECE_VALUES[OPENING][ABS[piece]]/4
            // } else {
            //     if (piece !== p) score += board.isSquareAttacked(i, WHITE, true)*AI.PIECE_VALUES[OPENING][ABS[piece]]/4
            // }

            if (piece === P) {
                // //Attacking pieces
                // if (board.board[i-15] === q || board.board[i-17] === q) score += 100
                // if (board.board[i-15] === r || board.board[i-17] === r) score += 65
                // if (board.board[i-15] === b || board.board[i-17] === b) score += 45
                // if (board.board[i-15] === n || board.board[i-17] === n) score += 45

                //Defended
                if (board.board[i+15] === P || board.board[i+17] === P) {
                    score += AI.DEFENDEDPAWNBONUS[i]
                }

                //Aligned
                if (board.board[i+1] === P || board.board[i-1] === P) {
                    score = AI.ALIGNEDPAWNBONUS[i]
                }

                //Neighbour
                if (board.board[i+2] === P || board.board[i-2] === P) {
                    score += AI.NEIGHBOURPAWNBONUS[i]
                }

                //Levers
                if (board.board[i-15] === p || board.board[i-17] === p) {
                    score += AI.LEVERPAWNBONUS[i]
                }

                //Knight mobility blocker
                if (board.board[i-50] === n || board.board[i-46] === n) {
                    score += 40
                }

                if (AI.phase <= MIDGAME) {
                    //Center control
                    if (i === 68 && board.board[51] === 0) score+=10
                    if (i === 67 && board.board[52] === 0) score+=10

                    //Outer central lever
                    if (i === 66 && (board.board[51] === p || board.board[51] === 0)) {
                        score+=20

                        if (board.board[81] === P || board.board[83] === P) score += 15
                    } 
                    if (i === 69 && (board.board[52] === p || board.board[52] === 0)) {
                        score+=20 

                        if (board.board[84] === P || board.board[86] === P) score += 15
                    }
                }

                if (board.colorOfSquare(i)) {
                    lightSquaresWhitePawns++

                    if (board.board[i-16] === p) {
                        blockedLightSquaresWhitePawns++
                        score += AI.BLOCKEDPAWNBONUS[i]
                    }
                } else {
                    darkSquaresWhitePawns++
                    if (board.board[i-16] === p) {
                        blockedDarkSquaresWhitePawns++
                        score += AI.BLOCKEDPAWNBONUS[i]
                    }
                }
            } else if (piece === p) {
                // //Attacking pieces
                // if (board.board[i+15] === Q || board.board[i+17] === Q) score -= 100
                // if (board.board[i+15] === R || board.board[i+17] === R) score -= 65
                // if (board.board[i+15] === B || board.board[i+17] === B) score -= 45
                // if (board.board[i+15] === N || board.board[i+17] === N) score -= 45

                //Defended
                if (board.board[i-15] === p || board.board[i-17] === p) {
                    score -= AI.DEFENDEDPAWNBONUS[112^i]
                }

                //Aligned
                if (board.board[i+1] === p || board.board[i-1] === p) {
                    score -= AI.ALIGNEDPAWNBONUS[112^i]
                }

                //Neighbour
                if (board.board[i+2] === P || board.board[i-2] === P) {
                    score -= AI.NEIGHBOURPAWNBONUS[112^i]
                }

                //Levers
                if (board.board[i+15] === P || board.board[i+17] === P) {
                    score -= AI.LEVERPAWNBONUS[112^i]
                }

                //Knight mobility blocker
                if (board.board[i+50] === N || board.board[i+46] === N) {
                    score -= 40
                }

                if (AI.phase <= MIDGAME) {
                    //Center control
                    if (i === 51 && board.board[68] === 0) score-=10
                    if (i === 52 && board.board[67] === 0) score-=10

                    //Outer central lever
                    if (i === 50 && (board.board[67] === P || board.board[67] === 0)) {
                        score-=20
                        if (board.board[33] === p || board.board[35] === p) score -= 15
                    } 
                    if (i === 53 && (board.board[68] === P || board.board[68] === 0)) {
                        score-=20
                        if (board.board[36] === p || board.board[38] === p) score -= 15
                    } 
                }

                if (board.colorOfSquare(i)) {
                    lightSquaresBlackPawns++
                    if (board.board[i+16] === P) {
                        blockedLightSquaresBlackPawns++
                        score -= AI.BLOCKEDPAWNBONUS[112^i]
                    }
                } else {
                    darkSquaresBlackPawns++
                    if (board.board[i+16] === P) {
                        blockedDarkSquaresBlackPawns++
                        score -= AI.BLOCKEDPAWNBONUS[112^i]
                    }
                }
            } else if (piece === B) {
                bishopsW++

                bishopsindexW.push(i)

                // Blocks knight mobility
                if (board.board[i-48] === n) score += 20

                //Semi outpost
                if (AI.phase <= MIDGAME && board.ranksW[i] >= 3 && board.board[i-16] === P) score+=12
    
                //X-Rays
                if (board.diagonals1[i] === board.diagonals1[board.blackKingIndex]) {
                    score += 20
                } else if (board.diagonals2[i] === board.diagonals2[board.blackKingIndex]) {
                    score += 20
                }

                if (board.board[i + 15] === P || board.board[i + 17] === P) {
                    score += AI.OUTPOSTBONUSBISHOP[i]

                    if (board.board[i-16] === p) score += 10

                    if (board.ranksW[i] === 6) score += AI.phase <= MIDGAME? 30 : 15
                }

                if (board.colorOfSquare(i)) {
                    lightSquaresWhiteBishop++
                } else {
                    darkSquaresWhiteBishop++
                }
            } else if (piece === b) {
                bishopsB++

                bishopsindexB.push(i)

                // Blocks knight mobility
                if (board.board[i+48] === N) score -= 20

                //Semi outpost
                if (AI.phase <= MIDGAME && board.ranksB[i] >= 3 && board.board[i+16] === p) score-=12
    
                // X-Rays
                if (board.diagonals1[i] === board.diagonals1[board.whiteKingIndex]) {
                    score -= 20
                } else if (board.diagonals2[i] === board.diagonals2[board.whiteKingIndex]) {
                    score -= 20
                }

                if (board.board[i - 15] === p || board.board[i - 17] === p) {
                    score -= AI.OUTPOSTBONUSBISHOP[112^i]

                    if (board.board[i+16] === P) score -= 10

                    if (board.ranksB[i] === 6) score -= AI.phase <= MIDGAME? 30 : 15
                }

                if (board.colorOfSquare(i)) {
                    lightSquaresBlackBishop++
                } else {
                    darkSquaresBlackBishop++
                }
            } else if (piece === N) {
                // Semi outpost
                if (AI.phase <= MIDGAME && board.ranksW[i] >= 3 && board.board[i-16] === P) score+=15
                
                knightsW++

                if (board.board[i + 15] === P || board.board[i + 17] === P) {
                    score += AI.OUTPOSTBONUSKNIGHT[i]

                    if (board.board[i-16] === p) score += 10

                    if (board.ranksW[i] === 6) score += AI.phase <= MIDGAME? 30 : 15
                }
                
            } else if (piece === n) {
                // Semi outpost
                if (AI.phase <= MIDGAME && board.ranksB[i] >= 3 && board.board[i+16] === p) score-=15
                knightsB++

                if (board.board[i - 15] === p || board.board[i - 17] === p) {
                    score -= AI.OUTPOSTBONUSKNIGHT[112^i]

                    if (board.board[i+16] === P) score -= 10

                    if (board.ranksB[i] === 6) score -= AI.phase <= MIDGAME? 30 : 15
                }
            } else if (piece === R) {
                rooksW++
    
                rookscolumnsW.push(board.columns[i])
    
                // X-Rays
                if (AI.phase <= MIDGAME) {
                    if (board.columns[i] === board.columns[board.blackKingIndex]) score += 20
                    if (board.ranksW[i] === board.ranksW[board.blackKingIndex]) score += 20
                }

                if (board.ranksW[i] === 5) {
                    if (board.board[i + 15] === P || board.board[i + 17] === P) score += 10
                } 
            } else if (piece === r) {
                rooksB++
    
                rookscolumnsB.push(board.columns[i])
    
                // X-Rays
                if (AI.phase <= MIDGAME) {
                    if (board.columns[i] === board.columns[board.whiteKingIndex]) score -= 20
                    if (board.ranksB[i] === board.ranksB[board.whiteKingIndex]) score -= 20
                }

                if (board.ranksB[i] === 5) {
                    if (board.board[i - 15] === p || board.board[i - 17] === p) score -= 10
                }
            } else if (piece === Q) {
                queensW++
    
                if (board.diagonals1[i] === board.diagonals1[board.blackKingIndex]) {
                    score += 20
                } else if (board.diagonals2[i] === board.diagonals2[board.blackKingIndex]) {
                    score += 20
                }

                if (board.columns[i] === board.columns[board.blackKingIndex]) {
                    score += 20
                } else if (board.ranksW[i] === board.ranksW[board.blackKingIndex]) {
                    score += 20
                }
            } else if (piece === q) {
                queensB++
                if (board.diagonals1[i] === board.diagonals1[board.whiteKingIndex]) {
                    score -= 20
                } else if (board.diagonals2[i] === board.diagonals2[board.whiteKingIndex]) {
                    score -= 20
                }

                if (board.columns[i] === board.columns[board.whiteKingIndex]) {
                    score -= 20
                } else if (board.ranksB[i] === board.ranksB[board.whiteKingIndex]) {
                    score -= 20
                }
            } else if (piece === K) {
                if (board.whiteKingIndex === 118 && board.board[119] === R) score -= VPAWN
            } else if (piece === k) {
                if (board.blackKingIndex === 6 && board.board[7] === r) score += VPAWN
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
    score += material + psqt

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
    
    if (pvNode) {
        // Mobility
        score += AI.getMobility(board)
    
        if (AI.isLazyFutile(sign, score, alpha, beta)) {
            
            let nullWindowScore = (score / AI.nullWindowFactor | 0)
            
            AI.evalTable[board.hashkey % this.htlength] = {
                hashkey: board.hashkey,
                score: nullWindowScore
            }
    
            return sign*nullWindowScore
        }

        // Bishop pair
        score += bishopsW === 2? AI.BISHOP_PAIR[AI.phase] : 0
        score -= bishopsB === 2? AI.BISHOP_PAIR[AI.phase] : 0
    
        // Pawns on same squares of bishops //8 for MG, 15 for EG
        let badPawns = 0
            badPawns+= (8*lightSquaresWhiteBishop*lightSquaresWhitePawns + 8*darkSquaresWhiteBishop*darkSquaresWhitePawns)
            badPawns+= (8*lightSquaresWhiteBishop*blockedLightSquaresWhitePawns + 8*darkSquaresWhiteBishop*blockedDarkSquaresWhitePawns)
            
            badPawns-= (8*lightSquaresBlackBishop*lightSquaresBlackPawns + 8*darkSquaresBlackBishop*darkSquaresBlackPawns)
            badPawns-= (8*lightSquaresBlackBishop*blockedLightSquaresBlackPawns + 8*darkSquaresBlackBishop*blockedDarkSquaresBlackPawns)
    
        score -= badPawns

        // if (AI.isLazyFutile(sign, score, alpha, beta)) {
            
        //     let nullWindowScore = (alpha / AI.nullWindowFactor | 0) + 1
            
        //     AI.evalTable[board.hashkey % this.htlength] = {
        //         hashkey: board.hashkey,
        //         score: nullWindowScore
        //     }
        //     return sign*nullWindowScore
        // }
    
        // Is king under attack
    
        if (AI.phase >= MIDGAME) {
            score -= 30*board.isSquareAttacked(board.whiteKingIndex-15, BLACK, false)
            score -= 30*board.isSquareAttacked(board.whiteKingIndex-16, BLACK, false)
            score -= 30*board.isSquareAttacked(board.whiteKingIndex-17, BLACK, false)       
            
            score += 30*board.isSquareAttacked(board.blackKingIndex+15, WHITE, false)
            score += 30*board.isSquareAttacked(board.blackKingIndex+16, WHITE, false)
            score += 30*board.isSquareAttacked(board.blackKingIndex+17, WHITE, false)
        
        }

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
                
                score += 10 * board.isSquareAttacked(WIDECENTER[i], WHITE, true)
                score -= 10 * board.isSquareAttacked(WIDECENTER[i], BLACK, true)
    
                let piece = board.board[WIDECENTER[i]]
                
                if (!piece) continue
                
                let occupiedBy = board.pieces[piece].color
                
                if (occupiedBy === WHITE) {
                    score += i < 64? 10 : 5
                } else {
                    score -= i > 64? 10 : 5
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
                if (queensW >= queensB) score += 10
                if (rooksW >= rooksB) score += 10
                
            }
                
            if (score < -VPAWNx2) {
                if (queensB >= queensW) score -= 10
                if (rooksB >= rooksW) score -= 10
            }
        }
    
        // Knights with blocked pawns
        let blockedWhitePawns = blockedLightSquaresWhitePawns + blockedDarkSquaresWhitePawns
        let blockedBlackPawns = blockedLightSquaresBlackPawns + blockedDarkSquaresBlackPawns
    
        score += 8*blockedWhitePawns*knightsW
        score -= 8*blockedBlackPawns*knightsB
    
        //Pawn span (distance between first and last pawn)
        let spanbonus = AI.phase <= MIDGAME? 5 : 10
    
        if (pawnindexW.length > 1) {
            score += spanbonus*(board.columns[pawnindexW[pawnindexW.length - 1]] - board.columns[pawnindexW[0]])
        }
    
        if (pawnindexB.length > 1) {
            score -= spanbonus*(board.columns[pawnindexB[pawnindexB.length - 1]] - board.columns[pawnindexB[0]])
        }
    
        // Raking bishops
        if (bishopsW === 2) {
            if (Math.abs(bishopsindexW[0] - bishopsindexW[1]) === 1) score += 10
            if (Math.abs(bishopsindexW[0] - bishopsindexW[1]) === 16) score += 10
        }
    
        if (bishopsB === 2) {
            if (Math.abs(bishopsindexB[0] - bishopsindexB[1]) === 1) score -= 10
            if (Math.abs(bishopsindexB[0] - bishopsindexB[1]) === 16) score -= 10
        }
    
        //Rook battery
        if (AI.phase <= MIDGAME) {
            if (rookscolumnsW.length === 2) {
                if (rookscolumnsW[0] === rookscolumnsW[1]) score += 10
            }
    
            if (rookscolumnsB.length === 2) {
                if (rookscolumnsB[0] === rookscolumnsB[1]) score -= 10
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
    let bonus = 8 * (4 - phase)

    if (phase <= MIDGAME && board.columns[board.whiteKingIndex] === 3 || board.columns[board.whiteKingIndex] === 4) score -= 10
    
    if (board.whiteKingIndex !== 116) {
        score += board.board[board.whiteKingIndex-15] === P? bonus : 0
        score += board.board[board.whiteKingIndex-16] === P? bonus : 0
        score += board.board[board.whiteKingIndex-16] === B && phase <= MIDGAME? 15 : 0
        score += board.board[board.whiteKingIndex-17] === P? bonus : 0

        if (phase <= MIDGAME && board.board[board.whiteKingIndex-16] === 0) {
            score -= VPAWN
        }
        
        //TODO: Penalty for doubled pawns in king shelter (mg: 15, eg: 8)
    }
    
    if (phase <= MIDGAME && board.columns[board.blackKingIndex] === 3 || board.columns[board.blackKingIndex] === 4) score += 10
    
    if (board.blackKingIndex !== 4) {
        score += board.board[board.blackKingIndex+15] === p? -bonus : 0
        score += board.board[board.blackKingIndex+16] === p? -bonus : 0
        score += board.board[board.blackKingIndex+16] === b && phase <= MIDGAME? -15 : 0
        score += board.board[board.blackKingIndex+17] === p? -bonus : 0

        if (phase <= MIDGAME && board.board[board.blackKingIndex+16] === 0) {
            score += VPAWN
        }

        //TODO: Penalty for doubled pawns in king shelter (mg: 15, eg: 8)
    }

    return score
} 

AI.isLazyFutile = (sign, score, alpha, beta)=> {
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

    score += (whiteMoves[N]? 23 * Math.log(whiteMoves[N]) - 35 | 0 : 0)
    score += (whiteMoves[B]? 26 * Math.log(whiteMoves[B]) - 25 | 0 : 0)
    score += (whiteMoves[R]? 21 * Math.log(whiteMoves[R]) - 28 | 0 : 0)
    score += (whiteMoves[Q]? 24 * Math.log(whiteMoves[Q]) - 29 | 0 : 0)
    
    score -= (blackMoves[n]? 23 * Math.log(blackMoves[n]) - 35 | 0 : 0)
    score -= (blackMoves[b]? 26 * Math.log(blackMoves[b]) - 25 | 0 : 0)
    score -= (blackMoves[r]? 21 * Math.log(blackMoves[r]) - 28 | 0 : 0)
    score -= (blackMoves[q]? 24 * Math.log(blackMoves[q]) - 29 | 0 : 0)

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

    let pawnImbalance = 20*(pawnindexW.length - pawnindexB.length)
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

    return -40 * (whiteBackwardPawns - blackBackwardPawns)
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

    let space = 2*(spaceW - spaceB)

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
            score += AI.PASSERSBONUS[pawnindexW[i]]

            //blocked passer
            let blockerindex = pawnindexW[i] - 16
            if (board.board[blockerindex] === n || board.board[blockerindex] === b) score-=20

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
            score -= AI.PASSERSBONUS[112^pawnindexB[i]]
            
            //blocked passer
            let blockerindex = pawnindexW[i] + 16
            if (board.board[blockerindex] === N || board.board[blockerindex] === B) score+=20
            
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

            continue
        }

        // CRITERIO: La jugada es un movimiento Killer
        // (Los killers son movimientos que anteriormente han generado Fail-Highs en el mismo ply)
        if (killer1 && killer1.key === move.key) {
            move.killer1 = true
            move.score += 6e6
            continue
        }

        // CRITERIO: La jugada es el segundo movimiento Killer
        if (killer2 && killer2.key === move.key) {
            move.killer2 = true
            move.score += 5e6
            continue
        }
        
        // CRITERIO: La jugada es una promoción
        if (move.promotingPiece) {
            move.score += 3e6
            continue
        }

        // CRITERIO: Enroque
        if (AI.phase <= MIDGAME && move.castleSide) {
            move.score += 2e6
            continue
        }
        
        // CRITERIO 6: Movimientos históricos
        // Se da preferencia a movimientos posicionales que han tenido 
        // éxito en otras posiciones.
        let hvalue = AI.history[move.piece][move.to]
        move.score += hvalue

        // y PSQT
        if (turn === WHITE) {
            move.score += AI.PSQT[ABS[move.piece]][move.to] - AI.PSQT[ABS[move.piece]][move.from]
        } else {
            move.score += AI.PSQT[ABS[move.piece]][112^move.to] - AI.PSQT[ABS[move.piece]][112^move.from]
        }
    }

    // ORDENA LOS MOVIMIENTOS
    // El tiempo de esta función toma hasta un 10% del total de cada búsqueda.
    // Sería conveniente utilizar un mejor método de ordenamiento.
    // moves.sort((a, b) => {
    //     return b.score - a.score
    // })

    moves = sort(moves).by([
        { desc: u => u.score }
      ]);

    // let t1 = (new Date()).getTime()

    // AI.sortingTime += (t1 - t0)

    return moves
}

// BÚSQUEDA ¿EN CALMA?
// Para evitar el Efecto-Horizonte, la búqueda continua de manera forzosa hasta
// que se encuentra una posición "en calma" (donde ningún rey está en jaque ni
// donde la última jugada haya sido una captura). Cuando se logra esta posición
// "en calma", se evalúa la posición.
AI.quiescenceSearch = function (board, alpha, beta, depth, ply, pvNode) {
    let alphaOriginal = alpha

    AI.qsnodes++

    let turn = board.turn
    let opponentTurn = turn === WHITE? BLACK : WHITE
    let legal = 0
    let incheck = board.isKingInCheck()
    let standpat = alpha // Only to prevent undefined values for standpat
    
    let hashkey = board.hashkey

    if (!incheck) {
        standpat = AI.evaluate(board, ply, alpha, beta, pvNode, incheck) | 0
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

    let bestmove = moves[0]

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]

        
        // Bad captures pruning (+34 ELO)
        if (move.mvvlva < 6000) {
            let attackers = board.isSquareAttacked(move.to, opponentTurn, false, false)

            if (attackers) {
                continue
            }
        }
        
        // delta pruning para cada movimiento
        if (!incheck && standpat + AI.PIECE_VALUES[OPENING][ABS[move.capturedPiece]]/this.nullWindowFactor < alpha) {
            continue
        }

        // let m0 = (new Date()).getTime()
        if (board.makeMove(move)) {
            // AI.moveTime += (new Date()).getTime() - m0
            legal++

            score = -AI.quiescenceSearch(board, -beta, -alpha, depth - 1, ply + 1, pvNode)

            board.unmakeMove(move)

            if (score >= beta) {
                // AI.ttSave(turn, hashkey, score, LOWERBOUND, depth, move)
                return score
            }
            
            if (score > alpha) {
                alpha = score
                bestmove = move
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
    // AI.history[move.piece][move.to] += value | 0
    AI.history[move.piece][move.to] += 32 * value - AI.history[move.piece][move.to]*Math.abs(value)/512 | 0

    if (AI.history[move.piece][move.to] < min) min = AI.history[move.piece][move.to]

    //HistoryTableEntry += 32 * bonus - HistoryTableEntry * abs(bonus) / 512;
}

// PRINCIPAL VARIATION SEARCH
// El método PVS es Negamax + Ventana-Nula
AI.PVS = function (board, alpha, beta, depth, ply, allowNullMove) {

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
    if (/*!incheck && */depth <= 0) {
        return AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
    }
    
    if (AI.stop && AI.iteration > AI.mindepth[AI.phase]) return alpha
    
    let mateE = 0 // Mate threat extension
    
    let staticeval = AI.evaluate(board, ply, alpha, beta, pvNode, incheck) | 0
    let prune = !incheck/* && cutNode*/ && alpha < MATE - AI.totaldepth

    //Futility
    if (prune && depth < 9 && staticeval - MARGIN1*depth >= beta && Math.abs(alpha) < MARGIN10) {
        return staticeval
    }

    // Null move pruning
    if (prune && allowNullMove && staticeval >= beta && AI.phase < LATE_ENDGAME) {
        board.changeTurn()
        let nullR = depth > 6? 3 : 2
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

    // Razoring
    if (prune && depth <= 3) {
        if (staticeval + MARGIN1 < beta) { // likely a fail-low node ?
            let score = AI.quiescenceSearch(board, alpha, beta, 0, ply, pvNode)
            if (score < beta) return score
        }
    }

    // IID
    if (!ttEntry && depth >= 6) depth-=2

    let moves = board.getMoves()

    moves = AI.sortMoves(moves, turn, ply, depth, ttEntry)

    let bestmove = moves[0]
    let legal = 0
    let bestscore = -INFINITY
    let score

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]
        let piece = move.piece

        // Extensiones
        let E = mateE && depth <= 2? 1 : 0

        if (pvNode && AI.phase === LATE_ENDGAME && (piece === P || piece === p)) E++

        //Reducciones
        let R = 0

        if (prune && !move.killer1 && legal >= 1) {
            // Futility Pruning
            if (depth <= 3) {
                if (move.isCapture) {
                    if (staticeval + AI.PIECE_VALUES[OPENING][ABS[move.capturedPiece]]/this.nullWindowFactor + SMALLMARGIN < alpha) {
                        continue
                    }
                } else {
                    if (staticeval + SMALLMARGIN < alpha) {
                        continue
                    }
                }
            }

            if (cutNode && ply > 1 && i > 12 && !move.isCapture && staticeval > alpha - VERYSMALLMARGIN) {
                let limit = i > 20? 0.85 : 0.8
                if (Math.random() < limit) {
                    AI.rnodes++
                    continue
                }
            }
        }

        // // Enhanced Transposition Cut-Off actual position +12 ELO
        // if (!ttEntry) {
        //     // total++
            
        //     let ttETC = AI.ttGet(turn, hashkey)
            
        //     if (ttETC && ttETC.hashkey === hashkey && ttETC.depth >= depth) {
        //         AI.etcNodes++
        //         // max++
        //         if (ttETC.flag === LOWERBOUND) {
        //             if (ttETC.score > alpha) alpha = ttETC.score
        //         } else if (ttETC.flag === UPPERBOUND) {
        //             if (ttETC.score < beta) beta = ttETC.score
        //         } else { // EXACT
        //             if (ttETC.score >= beta) { // > beta?
        //                 return ttETC.score
        //             }
        //         }
        //     }
        // }

        if (prune && depth >= 3 && legal >= 1 && !mateE) {
            R += AI.LMR_TABLE[depth][legal]

            if (pvNode) {
                R--
            }

            if (incheck) R--

            if (cutNode && !move.killer1) R += 2

            // Reduce negative history
            if (AI.history[piece][move.to] < 0) R += 2
            
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

            if (R < 0) R = 0

            let rLimit = legal > 4 && !move.isCapture? 2 : 4

            if (depth > 6 && Math.abs(alpha - staticeval) > MARGIN3) {
                R = Math.max(R, depth - rLimit)
            }
        }

        // let m0 = (new Date()).getTime()
        if (board.makeMove(move)) {
            // AI.moveTime += (new Date()).getTime() - m0
            legal++

            // // Enhanced Transposition Cut-Off +16 ELO
            // let ttETC = AI.ttGet(board.turn, board.hashkey)

            // if (!ttEntry && ttETC && ttETC.hashkey === board.hashkey && ttETC.depth >= depth) {
            //     AI.etcNodes++
                
            //     let scoreETC = -ttETC.score
                
            //     if (ttETC.flag === LOWERBOUND) {
            //         if (scoreETC < beta) beta = ttETC.score
            //         // console.log('beta')
            //     } else if (ttETC.flag === UPPERBOUND) {
            //         if (scoreETC > alpha) alpha = ttETC.score
            //         // console.log('alpha')
            //     }/* else if (ttETC.flag === EXACT) {
            //         console.log('ETC exact')
            //         bestmove = ttETC.move
            //         beta = ttETC.score
            //     }*/
            // }

            if (legal === 1) {
                // El primer movimiento se busca con ventana total y sin reducciones
                // if (AI.stop) return alphaOriginal
                score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1, allowNullMove)
            } else {
                if (AI.stop) {
                    board.unmakeMove(move)
                    return alphaOriginal
                }
                score = -AI.PVS(board, -alpha-1, -alpha, depth + E - R - 1, ply + 1, allowNullMove)

                if (!AI.stop && score > alpha) {
                    R = 0
                    score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1, allowNullMove)
                }
            }

            board.unmakeMove(move)

            if (AI.stop) return alphaOriginal //tested ok
            
            if (score > alpha) {
                
                // Fail-high
                if (score >= beta) {
                    if (legal === 1) {
                        AI.fhf++
                    }
                    
                    AI.fh++
                    
                    //LOWERBOUND
                    
                    if (!move.isCapture) {
                        if (
                            AI.killers[turn | 0][ply][0] &&
                            AI.killers[turn | 0][ply][0].key != move.key
                            ) {
                                AI.killers[turn | 0][ply][1] = AI.killers[turn | 0][ply][0]
                            }
                            
                            AI.killers[turn | 0][ply][0] = move
                            
                            AI.saveHistory(turn, move, depth*depth)
                        }
                        
                        AI.ttSave(turn, hashkey, score, LOWERBOUND, depth + E - R + Math.round(Math.random()), move)
                        
                        return score
                    }
                    
                // score > alpha continuation
                bestscore = score
                bestmove = move
                alpha = score

                if (!move.isCapture) { AI.saveHistory(turn, move, depth) }

            } else {
                if (!move.isCapture) { AI.saveHistory(turn, move, -depth) }
            }
        }
    }

    if (legal === 0) {
        // Ahogado
        if (incheck) {
            // Mate
            // AI.ttSave(turn, hashkey, -MATE + ply, EXACT, depth, bestmove)
            // AI.ttSave(turn, hashkey, -MATE + ply, LOWERBOUND, depth, bestmove)
    
            return -MATE + ply
        } else {
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

// PIECE SQUARE TABLES basadas en PESTO
AI.createPSQT = function (board) {

    AI.PSQT_OPENING = []

    AI.PSQT_OPENING[PAWN] = [
         0,   0,   0,   0,   0,   0,  0,   0,    null,null,null,null,null,null,null,null,
        98, 134,  61,  95,  68, 126, 34, -11,    null,null,null,null,null,null,null,null,
        -6,   7,  26,  31,  65,  56, 25, -20,    null,null,null,null,null,null,null,null,
       -14,  13,   6,  21,  23,  12, 17, -23,    null,null,null,null,null,null,null,null,
       -27,  -2,  -5,  12,  17,   6, 10, -25,    null,null,null,null,null,null,null,null,
       -26,  -4,  -4, -10,   3,   3, 33, -12,    null,null,null,null,null,null,null,null,
       -35,  -1, -20, -23, -15,  24, 38, -22,    null,null,null,null,null,null,null,null,
         0,   0,   0,   0,   0,   0,  0,   0,    null,null,null,null,null,null,null,null,
    ]

    AI.PSQT_OPENING[KNIGHT] = [
       -167, -89, -34, -49,  61, -97, -15, -107,    null,null,null,null,null,null,null,null,
        -73, -41,  72,  36,  23,  62,   7,  -17,    null,null,null,null,null,null,null,null,
        -47,  60,  37,  65,  84, 129,  73,   44,    null,null,null,null,null,null,null,null,
         -9,  17,  19,  53,  37,  69,  18,   22,    null,null,null,null,null,null,null,null,
        -13,   4,  16,  13,  28,  19,  21,   -8,    null,null,null,null,null,null,null,null,
        -23,  -9,  12,  10,  19,  17,  25,  -16,    null,null,null,null,null,null,null,null,
        -29, -53, -12,  -3,  -1,  18, -14,  -19,    null,null,null,null,null,null,null,null,
       -105, -21, -58, -33, -17, -28, -19,  -23,    null,null,null,null,null,null,null,null,

    ]

    AI.PSQT_OPENING[BISHOP] = [
        -29,   4, -82, -37, -25, -42,   7,  -8,    null,null,null,null,null,null,null,null,
        -26,  16, -18, -13,  30,  59,  18, -47,    null,null,null,null,null,null,null,null,
        -16,  37,  43,  40,  35,  50,  37,  -2,    null,null,null,null,null,null,null,null,
         -4,   5,  19,  50,  37,  37,   7,  -2,    null,null,null,null,null,null,null,null,
         -6,  13,  13,  26,  34,  12,  10,   4,    null,null,null,null,null,null,null,null,
          0,  15,  15,  15,  14,  27,  18,  10,    null,null,null,null,null,null,null,null,
          4,  15,  16,   0,   7,  21,  33,   1,    null,null,null,null,null,null,null,null,
        -33,  -3, -14, -21, -13, -12, -39, -21,    null,null,null,null,null,null,null,null,
    ]

    AI.PSQT_OPENING[ROOK] = [
         32,  42,  32,  51, 63,  9,  31,  43,    null,null,null,null,null,null,null,null,
         27,  32,  58,  62, 80, 67,  26,  44,    null,null,null,null,null,null,null,null,
         -5,  19,  26,  36, 17, 45,  61,  16,    null,null,null,null,null,null,null,null,
        -24, -11,   7,  26, 24, 35,  -8, -20,    null,null,null,null,null,null,null,null,
        -36, -26, -12,  -1,  9, -7,   6, -23,    null,null,null,null,null,null,null,null,
        -45, -25, -16, -17,  3,  0,  -5, -33,    null,null,null,null,null,null,null,null,
        -44, -16, -20,  -9, -1, 11,  -6, -71,    null,null,null,null,null,null,null,null,
        -19, -13,   1,  17, 16,  7, -37, -26,    null,null,null,null,null,null,null,null,
    ]

    AI.PSQT_OPENING[QUEEN] = [
        -28,   0,  29,  12,  59,  44,  43,  45,    null,null,null,null,null,null,null,null,
        -24, -39,  -5,   1, -16,  57,  28,  54,    null,null,null,null,null,null,null,null,
        -13, -17,   7,   8,  29,  56,  47,  57,    null,null,null,null,null,null,null,null,
        -27, -27, -16, -16,  -1,  17,  -2,   1,    null,null,null,null,null,null,null,null,
         -9, -26,  -9, -10,  -2,  -4,   3,  -3,    null,null,null,null,null,null,null,null,
        -14,   2, -11,  -2,  -5,   2,  14,   5,    null,null,null,null,null,null,null,null,
        -35,  -8,  11,   2,   8,  15,  -3,   1,    null,null,null,null,null,null,null,null,
         -1, -18,  -9,  10, -15, -25, -31, -50,    null,null,null,null,null,null,null,null,
    ]

    AI.PSQT_OPENING[KING] = [
        -65,  23,  16, -15, -56, -34,   2,  13,    null,null,null,null,null,null,null,null,
         29,  -1, -20,  -7,  -8,  -4, -38, -29,    null,null,null,null,null,null,null,null,
         -9,  24,   2, -16, -20,   6,  22, -22,    null,null,null,null,null,null,null,null,
        -17, -20, -12, -27, -30, -25, -14, -36,    null,null,null,null,null,null,null,null,
        -49,  -1, -27, -39, -46, -44, -33, -51,    null,null,null,null,null,null,null,null,
        -14, -14, -22, -46, -44, -30, -15, -27,    null,null,null,null,null,null,null,null,
          1,   7,  -8, -64, -43, -16,   9,   8,    null,null,null,null,null,null,null,null,
        -15,  36,  12, -54,   8, -28,  24,  14,    null,null,null,null,null,null,null,null,
    ]


    AI.PSQT_MIDGAME = []

    AI.PSQT_MIDGAME[PAWN] = [
        0,   0,   0,   0,   0,   0,  0,   0,    null,null,null,null,null,null,null,null,
       98, 134,  61,  95,  68, 126, 34, -11,    null,null,null,null,null,null,null,null,
       -6,   7,  26,  31,  65,  56, 25, -20,    null,null,null,null,null,null,null,null,
      -14,  13,   6,  21,  23,  12, 17, -23,    null,null,null,null,null,null,null,null,
      -27,  -2,  -5,  12,  17,   6, 10, -25,    null,null,null,null,null,null,null,null,
      -26,  -4,  -4, -10,   3,   3, 33, -12,    null,null,null,null,null,null,null,null,
      -35,  -1, -20, -23, -15,  24, 38, -22,    null,null,null,null,null,null,null,null,
        0,   0,   0,   0,   0,   0,  0,   0,    null,null,null,null,null,null,null,null,
   ]

    AI.PSQT_MIDGAME[KNIGHT] = [
        -167, -89, -34, -49,  61, -97, -15, -107,    null,null,null,null,null,null,null,null,
        -73, -41,  72,  36,  23,  62,   7,  -17,    null,null,null,null,null,null,null,null,
        -47,  60,  37,  65,  84, 129,  73,   44,    null,null,null,null,null,null,null,null,
            -9,  17,  19,  53,  37,  69,  18,   22,    null,null,null,null,null,null,null,null,
        -13,   4,  16,  13,  28,  19,  21,   -8,    null,null,null,null,null,null,null,null,
        -23,  -9,  12,  10,  19,  17,  25,  -16,    null,null,null,null,null,null,null,null,
        -29, -53, -12,  -3,  -1,  18, -14,  -19,    null,null,null,null,null,null,null,null,
        -105, -21, -58, -33, -17, -28, -19,  -23,    null,null,null,null,null,null,null,null,

    ]

    AI.PSQT_MIDGAME[BISHOP] = [
        -29,   4, -82, -37, -25, -42,   7,  -8,    null,null,null,null,null,null,null,null,
        -26,  16, -18, -13,  30,  59,  18, -47,    null,null,null,null,null,null,null,null,
        -16,  37,  43,  40,  35,  50,  37,  -2,    null,null,null,null,null,null,null,null,
            -4,   5,  19,  50,  37,  37,   7,  -2,    null,null,null,null,null,null,null,null,
            -6,  13,  13,  26,  34,  12,  10,   4,    null,null,null,null,null,null,null,null,
            0,  15,  15,  15,  14,  27,  18,  10,    null,null,null,null,null,null,null,null,
            4,  15,  16,   0,   7,  21,  33,   1,    null,null,null,null,null,null,null,null,
        -33,  -3, -14, -21, -13, -12, -39, -21,    null,null,null,null,null,null,null,null,
    ]

    AI.PSQT_MIDGAME[ROOK] = [
        32,  42,  32,  51, 63,  9,  31,  43,    null,null,null,null,null,null,null,null,
        27,  32,  58,  62, 80, 67,  26,  44,    null,null,null,null,null,null,null,null,
        -5,  19,  26,  36, 17, 45,  61,  16,    null,null,null,null,null,null,null,null,
        -24, -11,   7,  26, 24, 35,  -8, -20,    null,null,null,null,null,null,null,null,
        -36, -26, -12,  -1,  9, -7,   6, -23,    null,null,null,null,null,null,null,null,
        -45, -25, -16, -17,  3,  0,  -5, -33,    null,null,null,null,null,null,null,null,
        -44, -16, -20,  -9, -1, 11,  -6, -71,    null,null,null,null,null,null,null,null,
        -19, -13,   1,  17, 16,  7, -37, -26,    null,null,null,null,null,null,null,null,
    ]

    AI.PSQT_MIDGAME[QUEEN] = [
        -28,   0,  29,  12,  59,  44,  43,  45,    null,null,null,null,null,null,null,null,
        -24, -39,  -5,   1, -16,  57,  28,  54,    null,null,null,null,null,null,null,null,
        -13, -17,   7,   8,  29,  56,  47,  57,    null,null,null,null,null,null,null,null,
        -27, -27, -16, -16,  -1,  17,  -2,   1,    null,null,null,null,null,null,null,null,
            -9, -26,  -9, -10,  -2,  -4,   3,  -3,    null,null,null,null,null,null,null,null,
        -14,   2, -11,  -2,  -5,   2,  14,   5,    null,null,null,null,null,null,null,null,
        -35,  -8,  11,   2,   8,  15,  -3,   1,    null,null,null,null,null,null,null,null,
            -1, -18,  -9,  10, -15, -25, -31, -50,    null,null,null,null,null,null,null,null,
    ]

    AI.PSQT_MIDGAME[KING] = [
        -65,  23,  16, -15, -56, -34,   2,  13,    null,null,null,null,null,null,null,null,
        29,  -1, -20,  -7,  -8,  -4, -38, -29,    null,null,null,null,null,null,null,null,
        -9,  24,   2, -16, -20,   6,  22, -22,    null,null,null,null,null,null,null,null,
        -17, -20, -12, -27, -30, -25, -14, -36,    null,null,null,null,null,null,null,null,
        -49,  -1, -27, -39, -46, -44, -33, -51,    null,null,null,null,null,null,null,null,
        -14, -14, -22, -46, -44, -30, -15, -27,    null,null,null,null,null,null,null,null,
            1,   7,  -8, -64, -43, -16,   9,   8,    null,null,null,null,null,null,null,null,
        -15,  36,  12, -54,   8, -28,  24,  14,    null,null,null,null,null,null,null,null,
    ]

    AI.PSQT_EARLY_ENDGAME = []

        // Pawn
        AI.PSQT_EARLY_ENDGAME[PAWN] = [
            0,   0,   0,   0,   0,   0,   0,   0,    null,null,null,null,null,null,null,null,
            178, 173, 158, 134, 147, 132, 165, 187,    null,null,null,null,null,null,null,null,
             94, 100,  85,  67,  56,  53,  82,  84,    null,null,null,null,null,null,null,null,
             32,  24,  13,   5,  -2,   4,  17,  17,    null,null,null,null,null,null,null,null,
             13,   9,  -3,  -7,  -7,  -8,   3,  -1,    null,null,null,null,null,null,null,null,
              4,   7,  -6,   1,   0,  -5,  -1,  -8,    null,null,null,null,null,null,null,null,
             13,   8,   8,  10,  13,   0,   2,  -7,    null,null,null,null,null,null,null,null,
              0,   0,   0,   0,   0,   0,   0,   0,    null,null,null,null,null,null,null,null,
        ]

        // Knight
        AI.PSQT_EARLY_ENDGAME[KNIGHT] = [
            -58, -38, -13, -28, -31, -27, -63, -99,    null,null,null,null,null,null,null,null,
            -25,  -8, -25,  -2,  -9, -25, -24, -52,    null,null,null,null,null,null,null,null,
            -24, -20,  10,   9,  -1,  -9, -19, -41,    null,null,null,null,null,null,null,null,
            -17,   3,  22,  22,  22,  11,   8, -18,    null,null,null,null,null,null,null,null,
            -18,  -6,  16,  25,  16,  17,   4, -18,    null,null,null,null,null,null,null,null,
            -23,  -3,  -1,  15,  10,  -3, -20, -22,    null,null,null,null,null,null,null,null,
            -42, -20, -10,  -5,  -2, -20, -23, -44,    null,null,null,null,null,null,null,null,
            -29, -51, -23, -15, -22, -18, -50, -64,    null,null,null,null,null,null,null,null,
        ]

        // Bishop
        AI.PSQT_EARLY_ENDGAME[BISHOP] = [
            -14, -21, -11,  -8, -7,  -9, -17, -24,    null,null,null,null,null,null,null,null,
            -8,  -4,   7, -12, -3, -13,  -4, -14,    null,null,null,null,null,null,null,null,
             2,  -8,   0,  -1, -2,   6,   0,   4,    null,null,null,null,null,null,null,null,
            -3,   9,  12,   9, 14,  10,   3,   2,    null,null,null,null,null,null,null,null,
            -6,   3,  13,  19,  7,  10,  -3,  -9,    null,null,null,null,null,null,null,null,
           -12,  -3,   8,  10, 13,   3,  -7, -15,    null,null,null,null,null,null,null,null,
           -14, -18,  -7,  -1,  4,  -9, -15, -27,    null,null,null,null,null,null,null,null,
           -23,  -9, -23,  -5, -9, -16,  -5, -17,    null,null,null,null,null,null,null,null,
        ]
        // Rook
        AI.PSQT_EARLY_ENDGAME[ROOK] = [
            13, 10, 18, 15, 12,  12,   8,   5,    null,null,null,null,null,null,null,null,
            11, 13, 13, 11, -3,   3,   8,   3,    null,null,null,null,null,null,null,null,
             7,  7,  7,  5,  4,  -3,  -5,  -3,    null,null,null,null,null,null,null,null,
             4,  3, 13,  1,  2,   1,  -1,   2,    null,null,null,null,null,null,null,null,
             3,  5,  8,  4, -5,  -6,  -8, -11,    null,null,null,null,null,null,null,null,
            -4,  0, -5, -1, -7, -12,  -8, -16,    null,null,null,null,null,null,null,null,
            -6, -6,  0,  2, -9,  -9, -11,  -3,    null,null,null,null,null,null,null,null,
            -9,  2,  3, -1, -5, -13,   4, -20,    null,null,null,null,null,null,null,null,
        ]

        // Queen
        AI.PSQT_EARLY_ENDGAME[QUEEN] = [
            -9,  22,  22,  27,  27,  19,  10,  20,    null,null,null,null,null,null,null,null,
            -17,  20,  32,  41,  58,  25,  30,   0,    null,null,null,null,null,null,null,null,
            -20,   6,   9,  49,  47,  35,  19,   9,    null,null,null,null,null,null,null,null,
              3,  22,  24,  45,  57,  40,  57,  36,    null,null,null,null,null,null,null,null,
            -18,  28,  19,  47,  31,  34,  39,  23,    null,null,null,null,null,null,null,null,
            -16, -27,  15,   6,   9,  17,  10,   5,    null,null,null,null,null,null,null,null,
            -22, -23, -30, -16, -16, -23, -36, -32,    null,null,null,null,null,null,null,null,
            -33, -28, -22, -43,  -5, -32, -20, -41,    null,null,null,null,null,null,null,null,
        ]

        // King
        AI.PSQT_EARLY_ENDGAME[KING] = [
            -74, -35, -18, -18, -11,  15,   4, -17,    null,null,null,null,null,null,null,null,
            -12,  17,  14,  17,  17,  38,  23,  11,    null,null,null,null,null,null,null,null,
             10,  17,  23,  15,  20,  45,  44,  13,    null,null,null,null,null,null,null,null,
             -8,  22,  24,  27,  26,  33,  26,   3,    null,null,null,null,null,null,null,null,
            -18,  -4,  21,  24,  27,  23,   9, -11,    null,null,null,null,null,null,null,null,
            -19,  -3,  11,  21,  23,  16,   7,  -9,    null,null,null,null,null,null,null,null,
            -27, -11,   4,  13,  14,   4,  -5, -17,    null,null,null,null,null,null,null,null,
            -53, -34, -21, -11, -28, -14, -24, -43,    null,null,null,null,null,null,null,null,
        ]

        AI.PSQT_LATE_ENDGAME = []

        // Pawn
        AI.PSQT_LATE_ENDGAME[PAWN] = [
            0,   0,   0,   0,   0,   0,   0,   0,    null,null,null,null,null,null,null,null,
            178, 173, 158, 134, 147, 132, 165, 187,    null,null,null,null,null,null,null,null,
             94, 100,  85,  67,  56,  53,  82,  84,    null,null,null,null,null,null,null,null,
             32,  24,  13,   5,  -2,   4,  17,  17,    null,null,null,null,null,null,null,null,
             13,   9,  -3,  -7,  -7,  -8,   3,  -1,    null,null,null,null,null,null,null,null,
              4,   7,  -6,   1,   0,  -5,  -1,  -8,    null,null,null,null,null,null,null,null,
             13,   8,   8,  10,  13,   0,   2,  -7,    null,null,null,null,null,null,null,null,
              0,   0,   0,   0,   0,   0,   0,   0,    null,null,null,null,null,null,null,null,
        ]

        // Knight
        AI.PSQT_LATE_ENDGAME[KNIGHT] = [
            -58, -38, -13, -28, -31, -27, -63, -99,    null,null,null,null,null,null,null,null,
            -25,  -8, -25,  -2,  -9, -25, -24, -52,    null,null,null,null,null,null,null,null,
            -24, -20,  10,   9,  -1,  -9, -19, -41,    null,null,null,null,null,null,null,null,
            -17,   3,  22,  22,  22,  11,   8, -18,    null,null,null,null,null,null,null,null,
            -18,  -6,  16,  25,  16,  17,   4, -18,    null,null,null,null,null,null,null,null,
            -23,  -3,  -1,  15,  10,  -3, -20, -22,    null,null,null,null,null,null,null,null,
            -42, -20, -10,  -5,  -2, -20, -23, -44,    null,null,null,null,null,null,null,null,
            -29, -51, -23, -15, -22, -18, -50, -64,    null,null,null,null,null,null,null,null,
        ]

        // Bishop
        AI.PSQT_LATE_ENDGAME[BISHOP] = [
            -14, -21, -11,  -8, -7,  -9, -17, -24,    null,null,null,null,null,null,null,null,
            -8,  -4,   7, -12, -3, -13,  -4, -14,    null,null,null,null,null,null,null,null,
             2,  -8,   0,  -1, -2,   6,   0,   4,    null,null,null,null,null,null,null,null,
            -3,   9,  12,   9, 14,  10,   3,   2,    null,null,null,null,null,null,null,null,
            -6,   3,  13,  19,  7,  10,  -3,  -9,    null,null,null,null,null,null,null,null,
           -12,  -3,   8,  10, 13,   3,  -7, -15,    null,null,null,null,null,null,null,null,
           -14, -18,  -7,  -1,  4,  -9, -15, -27,    null,null,null,null,null,null,null,null,
           -23,  -9, -23,  -5, -9, -16,  -5, -17,    null,null,null,null,null,null,null,null,
        ]
        // Rook
        AI.PSQT_LATE_ENDGAME[ROOK] = [
            13, 10, 18, 15, 12,  12,   8,   5,    null,null,null,null,null,null,null,null,
            11, 13, 13, 11, -3,   3,   8,   3,    null,null,null,null,null,null,null,null,
             7,  7,  7,  5,  4,  -3,  -5,  -3,    null,null,null,null,null,null,null,null,
             4,  3, 13,  1,  2,   1,  -1,   2,    null,null,null,null,null,null,null,null,
             3,  5,  8,  4, -5,  -6,  -8, -11,    null,null,null,null,null,null,null,null,
            -4,  0, -5, -1, -7, -12,  -8, -16,    null,null,null,null,null,null,null,null,
            -6, -6,  0,  2, -9,  -9, -11,  -3,    null,null,null,null,null,null,null,null,
            -9,  2,  3, -1, -5, -13,   4, -20,    null,null,null,null,null,null,null,null,
        ]

        // Queen
        AI.PSQT_LATE_ENDGAME[QUEEN] = [
            -9,  22,  22,  27,  27,  19,  10,  20,    null,null,null,null,null,null,null,null,
            -17,  20,  32,  41,  58,  25,  30,   0,    null,null,null,null,null,null,null,null,
            -20,   6,   9,  49,  47,  35,  19,   9,    null,null,null,null,null,null,null,null,
              3,  22,  24,  45,  57,  40,  57,  36,    null,null,null,null,null,null,null,null,
            -18,  28,  19,  47,  31,  34,  39,  23,    null,null,null,null,null,null,null,null,
            -16, -27,  15,   6,   9,  17,  10,   5,    null,null,null,null,null,null,null,null,
            -22, -23, -30, -16, -16, -23, -36, -32,    null,null,null,null,null,null,null,null,
            -33, -28, -22, -43,  -5, -32, -20, -41,    null,null,null,null,null,null,null,null,
        ]

        // King
        AI.PSQT_LATE_ENDGAME[KING] = [
            -74, -35, -18, -18, -11,  15,   4, -17,    null,null,null,null,null,null,null,null,
            -12,  17,  14,  17,  17,  38,  23,  11,    null,null,null,null,null,null,null,null,
             10,  17,  23,  15,  20,  45,  44,  13,    null,null,null,null,null,null,null,null,
             -8,  22,  24,  27,  26,  33,  26,   3,    null,null,null,null,null,null,null,null,
            -18,  -4,  21,  24,  27,  23,   9, -11,    null,null,null,null,null,null,null,null,
            -19,  -3,  11,  21,  23,  16,   7,  -9,    null,null,null,null,null,null,null,null,
            -27, -11,   4,  13,  14,   4,  -5, -17,    null,null,null,null,null,null,null,null,
            -53, -34, -21, -11, -28, -14, -24, -43,    null,null,null,null,null,null,null,null,
        ]

    if (AI.phase === 0) AI.PSQT = [...AI.PSQT_OPENING]
    if (AI.phase === 1) AI.PSQT = [...AI.PSQT_MIDGAME]
    if (AI.phase === 2) AI.PSQT = [...AI.PSQT_EARLY_ENDGAME]
    if (AI.phase === 3) AI.PSQT = [...AI.PSQT_LATE_ENDGAME]
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

    AI.createPSQT()
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
        f = AI.PVS(board, beta - 2, beta, d, 1, true)
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

    if (board.movenumber && board.movenumber <= 1) {
        AI.lastscore = 0
        AI.bestmove = 0
        AI.bestscore = 0
        AI.f = 0
    }

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

                AI.f = AI.MTDF(board, AI.f, depth, alpha, beta)

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
                    console.log('FHF', AI.fhfperc, 'Depth:', depth, 'Score:', score, 'Nodes:', AI.nodes+AI.qsnodes, 'PV Nodes', AI.pvnodes, 'Pawn Hit Rate:',(AI.phnodes / AI.pnodes * 100 | 0))
                    // console.log(`Static Eval Hit Rate: ${((100*this.evalhashnodes/(this.evalnodes)) | 0)}`,
                    // 'PV Nodes: ' + (AI.pvnodes| 0), 'FHF ' + AI.fhfperc + '%',
                    // 'Pawn Hit Rate: ' + (AI.phnodes / AI.pnodes * 100 | 0))
                    // console.log(' ')
                }
            
                depth++
            }
        }

        // console.log(AI.previousls, AI.lastscore)

        if (AI.TESTER) {
            console.info(`_ AI.TESTER ${AI.phase} _____________________________________`)
        } else {
            console.info('________________________________________________________________________________')
        }

        let score100 = AI.lastscore * (100/VPAWN)

        let sigmoid = 1 / (1 + Math.pow(10, -score100 / 500))

        AI.lastmove = AI.bestmove

        //zugzwang prevention
        if (!AI.bestmove) {
            console.log('No bestmove')
            let moves = board.getMoves()

            AI.bestmove = moves[moves.length * Math.random() | 0]
        }

        AI.searchTime1 = Date.now()
        AI.searchTime = AI.searchTime1 - AI.searchTime0
        console.log('Sorting % time: ', (AI.sortingTime / AI.searchTime) * 100 | 0,
                    'Evaluation % time: ', (AI.evalTime / AI.searchTime) * 100 | 0,
                    'Random Nodes Pruned (%): ', (AI.rnodes / AI.nodes) * 100 | 0,
                    'ETC (%): ', (AI.etcNodes/AI.nodes*1000 | 0) / 10,
                    'Collisions (%): ', (AI.collisions/AI.ttGets*1000 | 0) / 10,
                    'Pawn Collisions (%): ', (AI.pawncollisions/AI.evalnodes*1000 | 0) / 10,
                    'NPS: ', (AI.nodes + AI.qsnodes) / options.seconds | 0,
        )

        // console.log(AI.bestmove, (AI.moveTime / AI.searchTime) * 100 | 0)

        resolve({
            n: board.movenumber, phase: AI.phase, depth: AI.iteration - 1, from: board.board64[AI.bestmove.from],
            to: board.board64[AI.bestmove.to], fromto0x88: [AI.bestmove.from, AI.bestmove.to],
            score: AI.lastscore | 0, sigmoid: (sigmoid * 100 | 0) / 100, nodes: AI.nodes, qsnodes: AI.qsnodes,
            FHF: AI.fhfperc + '%', version: AI.version
        })

        AI.createTables(board, AI.collisions/AI.ttGets > 0.005, AI.collisions/AI.ttGets > 0.005, true, AI.pawncollisions/AI.evalnodes > 0.005)
    })
}

AI.createTables(true, true, true)

module.exports = AI
