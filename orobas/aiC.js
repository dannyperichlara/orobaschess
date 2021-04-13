"use strict"

// const { mapValues } = require('lodash')
/* Imports Move Generator */
const Chess = require('../chess/chess.js')
// const Zobrist = require('../chess/zobrist.js')

// Math.seedrandom('orobas')

let wpieces = [1,2,2,2,2]

let AI = {
  totaldepth: 48,
  ttNodes: 0,
  iteration: 0,
  qsnodes: 0,
  nodes: 0,
  pnodes: 0,
  phnodes: 0,
  status: null,
  fhf: 0,
  fh: 0,
  random: 0,
  phase: 1,
  htlength: 1 << 24,
  pawntlength: 5e5,
  reduceHistoryFactor: 0.5, //1, actúa sólo en la actual búsqueda --> mejor ordenamiento, sube fhf
  mindepth: [3,3,3,3],
  secondspermove: 3,
  lastmove: null
}

// PIECE VALUES
AI.PAWN = 271
AI.PAWN2 = AI.PAWN/2 | 0
AI.PAWN4 = AI.PAWN/4 | 0

AI.PIECE_VALUES = [
  // Stockfish values: 1 / 2.88 / 3.00 / 4.70 / 9.36
  
  // From TD
  [1.00, 3.02, 3.63, 4.64, 8.93, 200].map(e=>e*AI.PAWN|0),
  [1.00, 3.02, 3.63, 4.64, 8.93, 200].map(e=>e*AI.PAWN|0),
  [1.00, 3.02, 3.63, 4.64, 8.93, 200].map(e=>e*AI.PAWN|0),
  [1.00, 3.02, 3.63, 4.64, 8.93, 200].map(e=>e*AI.PAWN|0),
]

AI.PARAMETERS = [
  1, //PSQT weight
  1, //Mobility weight
  1, //King safety weight
  1, //Pawn structure weight
]

// OTHER VALUES

AI.BISHOP_PAIR = 0.5 * AI.PAWN //For stockfish is something like 0.62 pawns
AI.MATE = AI.PIECE_VALUES[0][5]
AI.DRAW = 0//-AI.PIECE_VALUES[1][1]
AI.INFINITY = AI.PIECE_VALUES[0][5]*2

let wm  = -4 // Worst move
let vbm = -2 // Very bad move
let bm  = -1 // Bad move
let nm  =  0 // Neutral move
let GM  =  1 // Good move
let VGM =  2 // Very good move
let BM  =  4 // Best move

AI.PSQT_SCALAR = [
  [10,10,10,10,10,10],
  [10,10,10,10,10,10],
  [10,10,10,10,10,10],
  [10,10,10,10,10,10],
]

AI.KDISTANCE = [
  [0,16, 8, 4, 0, 0, 0,  0, 0],
  [0, 0,16, 4, 2, 0, 0, -4,-8],
  [0, 0, 2, 4, 8, 8, 4, -1,-2],
  [0, 0, 8, 8, 2, 0, 0, -1,-2],
  [0, 8, 8, 8, 2, 0, 0, -1,-2],
  [0, 0,16,-8, 0, 0, 0,  4, 8],
]


AI.QUIETSORT = [
  //Pawn
  [
    25,21,29,25,9,16,20,20,
    94,104,112,115,76,82,75,71,
    275,309,371,401,367,372,318,241,
    656,895,1092,2091,1541,859,776,743,
    1577,1559,2657,3584,2983,1696,1486,1536,
    1215,1337,1548,735,1198,1259,1798,1474,
    5,4,6,6,6,3,6,4,
    2,1,1,1,0,0,0,1,
  ],
  //Knight
  [
    18,27,62,51,57,52,11,7,
    52,104,149,181,204,140,56,37,
    67,195,495,386,332,331,163,85,
    174,563,523,1096,1261,530,510,127,
    307,191,740,1656,1115,423,263,288,
    248,509,3002,486,647,3979,430,96,
    49,72,280,1646,762,155,89,122,
    10,105,91,136,214,382,48,12,
  ],
  //Bishop
  [
    38,53,56,76,74,93,34,12,
    74,193,143,207,228,150,210,79,
    172,196,529,325,315,551,161,220,
    128,1069,400,535,499,284,1112,115,
    428,255,1119,649,600,1074,222,342,
    193,666,504,1391,1660,616,378,184,
    125,568,523,914,1135,278,975,60,
    58,107,239,197,169,438,31,17,
  ],
  //Rook
  [
    449,294,400,518,365,219,128,172,
    537,457,511,516,364,279,217,236,
    465,365,435,479,329,216,188,180,
    393,331,420,483,393,261,157,205,
    323,297,414,507,399,287,192,188,
    279,258,412,522,458,333,205,159,
    265,262,487,668,485,329,141,98,
    527,954,1881,2810,2214,3382,404,242,
  ],
//Queen
  [
    108,111,143,273,158,88,70,86,
    169,223,199,208,186,162,92,93,
    167,214,253,272,231,241,166,165,
    175,232,257,420,380,315,237,323,
    391,261,473,675,548,423,421,219,
    178,667,490,767,655,771,349,149,
    88,231,1074,1030,1080,299,113,47,
    112,158,263,356,283,109,18,43,
  ],
  // king
  [
    11,12,15,27,21,30,27,20,
    20,46,52,47,58,69,51,35,
    33,74,105,125,111,116,112,51,
    34,111,159,215,251,211,172,83,
    43,148,242,344,468,442,330,156,
    56,192,324,639,802,905,721,341,
    99,203,373,521,929,1097,1373,885,
    83,289,498,231,300,797,3399,572,
  ]
]

AI.SORT_FACTOR = [3,5,6,4,2,1]

AI.FISCHER_PARKING = [
  0,0,0,0,0,0,0,0,
  86,113,155,150,51,124,99,82,
  240,167,464,313,288,334,194,524,
  1200,927,1107,2916,4453,2695,1868,1133,
  3268,2663,3782,7732,16967,3869,2945,3356,
  3741,4174,9045,2893,769,3435,7533,9758,
  25093,24912,19376,4790,667,24942,25957,22804,
  0,0,0,0,0,0,0,0,
]

AI.LMR_TABLE = new Array(AI.totaldepth+1)

//Great idea from Igel!
for (let depth = 1; depth < AI.totaldepth+1; ++depth){

  AI.LMR_TABLE[depth] = new Array(218)

  for (let moves = 1; moves < 218; ++moves){
      //Igel
      //AI.LMR_TABLE[depth][moves] = 0.75 + Math.log(depth) * Math.log(moves) / 2.25 | 0

      //Stockfish
      AI.LMR_TABLE[depth][moves] = Math.log(depth) * Math.log(moves) / 1.95 | 0

      //http://talkchess.com/forum3/viewtopic.php?t=65273 (Evert)
      // AI.LMR_TABLE[depth][moves] = Math.log(depth*(moves**2)) | 0
  }
}
//General idea from Stockfish. Not fully tested.
AI.MOBILITY_VALUES = [
  [
    [],
    [-8,-4,-2,-1,0,1,2,3,4].map(e=>e*3),
    [-6,-2,0,1,2,3,4,5,6,7,8,9,10,11].map(e=>e*5),
    [0,0,0,0,2,3,4,5,6,7,8,9,10,11,12].map(e=>e*2),
    [0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(e=>e*2),
    []
  ],
  [
    [],
    [-8,-4,-2,-1,0,1,2,3,4].map(e=>e*5),
    [-6,-2,0,1,2,3,4,5,6,7,8,9,10,11].map(e=>e*7),
    [-8,-4,0,1,2,3,4,5,6,7,8,9,10,11,12].map(e=>e*5),
    [-6,-4,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(e=>e*5),
    []
  ],
  [
    [],
    [-8,-4,-2,-1,0,1,2,3,4].map(e=>e*5),
    [-6,-2,0,1,2,3,4,5,6,7,8,9,10,11].map(e=>e*7),
    [-6,-2,0,1,2,3,4,5,6,7,8,9,10,11,12].map(e=>e*7),
    [-6,-4,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(e=>e*7),
    []
  ],
  [
    [],
    [-8,-4,-2,-1,0,0,0,0,0].map(e=>e*5),
    [-6,-2,0,0,0,0,0,0,0,0,0,0,0,0].map(e=>e*7),
    [-6,-2,0,0,0,0,0,0,0,0,0,0,0,0,0].map(e=>e*7),
    [-6,-4,-2,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0].map(e=>e*7),
    []
  ]
]

//Not full tested(
  AI.SAFETY_VALUES = [-2, -1,  0, 1, 2,-1,-2,-3,-3].map(e=>20*e)

//Not full tested
AI.PASSER_VALUES = [
  0,0,0,0,0,0,0,0,
  240,240,240,240,240,240,240,240,
  120,120,120,120,120,120,120,120,
  60,60,60,60,60,60,60,60,
  30,30,30,30,30,30,30,30,
  15,15,15,15,15,15,15,15,
  10,10,10,10,10,10,10,10,
  0,0,0,0,0,0,0,0,
]

AI.DOUBLED_VALUES = [0,-1,-2,-3,-4,-5,-6,-7,-8].map(e=>e*AI.PAWN2/2|0)

//Not fully tested
AI.DEFENDED_PAWN_VALUES = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], //phase 1
  [0,20,40,40,80,80,80,80,80], //phase 2
  [0,20,40,40,80,80,80,80,80], //phase 3
  [0,20,40,40,80,80,80,80,80], //phase 4
]

//Not fully tested
AI.PAWN_IMBALANCE = [-160,-160,-160,-160,-160,-150,-140,-100,0,100,140,150,160,160,160,160,160]

//https://open-chess.org/viewtopic.php?t=3058
AI.MVVLVASCORES = [
  /*P*/[6002,20225,20250,20400,20800,26900],
  /*N*/[4775, 6004,20025,20175,20575,26675],
  /*B*/[4750, 4975, 6006,20150,20550,26650],
  /*R*/[4600, 4825, 4850, 6008,20400,26500],
  /*Q*/[4200, 4425, 4450, 4600, 6010,26100],
  /*K*/[3100, 3325, 3350, 3500, 3900,26000],
]

AI.PIECE_SQUARE_TABLES = [
  Array(64).fill(0),
  Array(64).fill(0),
  Array(64).fill(0),
  Array(64).fill(0),
  Array(64).fill(0),
  Array(64).fill(0)
]

AI.bitCount = function(n) {
    n = n - ((n >> 1) & 0x55555555)
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

AI.manhattanDistance = function(sq1,sq2) {
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

AI.manhattanCenterDistance = function (sq) {
   let file, rank;
   file  = sq  & 7;
   rank  = sq >> 3;
   file ^= (file-4) >> 8;
   rank ^= (rank-4) >> 8;
   return (file + rank) & 7;
}

AI.distance = function (sq1,sq2) {
   let file1, file2, rank1, rank2;
   let rankDistance, fileDistance;
   file1 = sq1  & 7;
   file2 = sq2  & 7;
   rank1 = sq1 >> 3;
   rank2 = sq2 >> 3;
   rankDistance = Math.abs(rank2 - rank1);
   fileDistance = Math.abs(file2 - file1);
   return Math.max(rankDistance, fileDistance);
}


AI.createTables = function () {
  console.log('Creating tables.................')

  delete AI.history
  delete AI.butterfly
  delete AI.hashtable
  delete AI.pawntable

  AI.history = [[],[]]
  AI.butterfly = [[],[]]
  AI.countermove = [[],[]]

  AI.history[0] = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
  ]

  AI.history[1] = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
  ]

  for (let i = 0; i < 64; i++) {
    AI.butterfly[0][i] = Array(64).fill(0)
    AI.butterfly[1][i] = Array(64).fill(0)
  }

  AI.countermove[0] = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
  ]

  AI.countermove[1] = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
  ]

  // AI.hashtable = new Array(AI.htlength) //positions
  AI.hashtable = new Map() //positions
  AI.pawntable = [new Map(), new Map()] //positions
}

//Randomize Piece Square Tables
AI.randomizePSQT = function () {
  // Math.seedrandom((new Date()).getTime().toString())
  
  if (AI.phase < 3) {
    //From Knight to Queen
    for (let i = 1; i < 5; i++) {
      AI.PIECE_SQUARE_TABLES[i] = AI.PIECE_SQUARE_TABLES[i].map(e=>{
        return e + Math.random() * AI.random - AI.random/2 | 0
      })
    }  
  }
}

let minpositional = Infinity //Used for tests

AI.getPieces = function (board, turn, notturn) {
  let P = board.getPieceColorBitboard(0, turn)
  let N = board.getPieceColorBitboard(1, turn)
  let B = board.getPieceColorBitboard(2, turn)
  let R = board.getPieceColorBitboard(3, turn)
  let Q = board.getPieceColorBitboard(4, turn)
  let K = board.getPieceColorBitboard(5, turn)

  let Px = board.getPieceColorBitboard(0, notturn)
  let Nx = board.getPieceColorBitboard(1, notturn)
  let Bx = board.getPieceColorBitboard(2, notturn)
  let Rx = board.getPieceColorBitboard(3, notturn)
  let Qx = board.getPieceColorBitboard(4, notturn)
  let Kx = board.getPieceColorBitboard(5, notturn)

  let us = board.getColorBitboard(turn)
  let usx = board.getColorBitboard(notturn)

  return {P,N,B,R,Q,K,Px,Nx,Bx,Rx,Qx,Kx,us,usx}
}

AI.getMaterial = function (pieces) {
  return AI.getMaterialValue(pieces,true) - AI.getMaterialValue(pieces,false)
}

AI.evaluate = function(board, ply) {
  let turn = board.getTurnColor()
  let notturn =  ~turn & 1
  let pieces = AI.getPieces(board, turn, notturn)
  let material = AI.getMaterial(pieces)

  // AI.PARAMETERS = [
  //   1, //PSQT weight
  //   1, //Mobility weight
  //   1, //King safety weight
  //   1, //Pawn structure weight
  // ]

  let psqt = /*AI.PARAMETERS[0] * */ AI.getPSQT(pieces, turn, notturn)
  let mobility  = /*AI.PARAMETERS[1] * */ AI.getMobility(pieces, board, turn, notturn)
  let safety = /*AI.PARAMETERS[2] * */ AI.getKingSafety(pieces,turn,notturn)
  let structure = /*AI.PARAMETERS[3] * */ AI.getStructure(pieces.P, pieces.Px, turn, notturn)
  
  let positional = psqt + mobility + structure + safety

  let score = material + positional  | 0

  // console.log('material '+material, 'psqt '+psqt, 'mobility '+mobility, 'safety '+safety, 'structure '+structure, 'threat '+threat, 'passers '+passers)

  return score | 0
}

// let maxdistance = -1

AI.getThreat = function (P,N,B,R,Q,K,Kx,turn) {
  let allpieces = [P.dup(),N.dup(),B.dup(),R.dup(),Q.dup(),K.dup()]

  let score = 0
  let kindex = Kx.extractLowestBitPosition()

  for (let i = 0; i <= 5; i++) {
      let pieces = allpieces[i].dup()

      while (!pieces.isEmpty()) {
          let index = pieces.extractLowestBitPosition()

          //Here we dont use 56^index
          let distance = AI.distance(index, kindex) 

          // if (distance>maxdistance) maxdistance = distance

          score += AI.KDISTANCE[i][distance]
      }
  }

  return score
}

AI.getDoubled = function (_P, white) {
  let pawns = _P.dup()
  let doubled = 0

  let score = 0

  while (!pawns.isEmpty()) {
    let index = pawns.extractLowestBitPosition()
    let pawn = (new Chess.Bitboard(0,0)).setBit(index)
    let advancemask = AI.pawnAdvanceMask(pawn, white)
    let adcnt = advancemask.popcnt()
    let encounters = 0

    if (adcnt > 0) {
      encounters = advancemask.and(pawns).popcnt()
      
      if (encounters > 0) {
        doubled++
        score += AI.DOUBLED_VALUES[doubled]
      }
    }
  }

  return score
}

AI.getPassers = function (_P, _Px, white) {
  let P = _P.dup()
  let Px = _Px.dup()

  let passers = 0
  let pxmask = Px.or(Chess.Position.makePawnAttackMask(!white, Px))

  let score = 0

  while (!P.isEmpty()) {
    let index = P.extractLowestBitPosition()
    let pawn = (new Chess.Bitboard(0,0)).setBit(index)
    let advancemask = AI.pawnAdvanceMask(pawn, white)
    let adcnt = advancemask.popcnt()
    let encounters

    if (adcnt > 0) {
      encounters = advancemask.and(pxmask).popcnt()
      
      if (encounters === 0) {
        passers++
        score += AI.PASSER_VALUES[white? 56^index : index]
      }
    }
  }

  return score
}

AI.empty = new Chess.Bitboard()

AI.pawnAdvanceMask = function(fromBB, white) {
  if (white) {
    return Chess.Position.makeSlidingAttackMask(fromBB.dup(), AI.empty, 1, 0)
  } else {
    return Chess.Position.makeSlidingAttackMask(fromBB.dup(), AI.empty,-1, 0)
  }
};

AI.getKingSafety = function (pieces,turn,notturn) {
  return AI.getKingSafetyValue(pieces.K, pieces.us, turn) - AI.getKingSafetyValue(pieces.Kx, pieces.usx, notturn)
}

AI.getKingSafetyValue = function (K, us, turn) {
  let mask = Chess.Position.makeKingDefenseMask(turn, K).and(us)
  let safety = AI.SAFETY_VALUES[mask.popcnt()]
  
  return safety
}

AI.getStructure = function (P, Px, turn, notturn) {
  return AI.getStructureValue(turn, P, Px) - AI.getStructureValue(notturn, Px, P)
}

AI.getStructureValue = function (turn, P, Px) {
  let hashkey = (P.low ^ P.high) >>> 0

  let hashentry = AI.pawntable[turn].get(hashkey % AI.pawntlength)

  AI.pnodes++
  
  if (hashentry) {
    AI.phnodes++
    return hashentry
  }

  let white = turn === 0

  let score = 0
  let doubled = AI.getDoubled(P, white)
  let defended = AI.getDefended(P, turn)
  let passers = AI.getPassers(P, Px, white)

  score = defended + doubled + passers

  AI.pawntable[turn].set(hashkey % AI.pawntlength, score)

  return score
}


AI.getDefended = function(_P, color) {
  let P = _P.dup()

  let mask = Chess.Position.makePawnAttackMask(color, P).dup()
  let defendedpawns = mask.and(P).popcnt()
  // let parkingvalue

  // while (!P.isEmpty()) {
  //   let index = P.extractLowestBitPosition()
  //   // white: 56^index // black: index
  //   parkingvalue = 5*Math.log(AI.FISCHER_PARKING[color ? index : (56 ^ index)])
  // }

  return AI.DEFENDED_PAWN_VALUES[AI.phase-1][defendedpawns]// + parkingvalue
}

AI.getMobility = function (pieces, board, turn, notturn) {
  let us = AI.getMobilityValues(pieces.P,pieces.N,pieces.B,pieces.R,pieces.Q,pieces.K,pieces.Px,board, turn)
  let them = AI.getMobilityValues(pieces.Px,pieces.Nx,pieces.Bx,pieces.Rx,pieces.Qx,pieces.Kx,pieces.P,board, notturn)
  return us - them
}

AI.getMobilityValues = function(_P,_N,_B,_R,_Q,_K,_Px,board, color) {
  let P = _P.dup()
  let N = _N.dup()
  let B = _B.dup()
  let R = _R.dup()
  let Q = _Q.dup()
  let K = _K.dup()
  let Px = _Px.dup()
  let i = AI.phase - 1

  let us = board.getColorBitboard(color).dup()
  let enemypawnattackmask = Chess.Position.makePawnAttackMask(!color, Px).dup()
  let space = P.dup().or(K).or(enemypawnattackmask)
  let mobility = 0
  
  while (!N.isEmpty()) {
    mobility += AI.MOBILITY_VALUES[i][1][Chess.Bitboard.KNIGHT_MOVEMENTS[N.extractLowestBitPosition()].dup().and_not(enemypawnattackmask).and_not(us).popcnt()]
  }
  
  while (!B.isEmpty()) {
    let index = B.extractLowestBitPosition()
    let bishop = (new Chess.Bitboard).setBit(index)
    mobility += AI.MOBILITY_VALUES[i][2][board.makeBishopAttackMask(bishop, space).and_not(us).popcnt()]
  }
  
  while (!R.isEmpty()) {
    let index = R.extractLowestBitPosition()
    let rook = (new Chess.Bitboard).setBit(index)
    mobility += AI.MOBILITY_VALUES[i][3][board.makeRookAttackMask(rook, space).and_not(us).popcnt()]
  }
  
  while (!Q.isEmpty()) {
    let index = Q.extractLowestBitPosition()
    let queen = (new Chess.Bitboard).setBit(index)
    let qcount  = board.makeBishopAttackMask(queen, space).or(board.makeRookAttackMask(queen, space)).and_not(us).popcnt()
    
    mobility += AI.MOBILITY_VALUES[i][4][qcount]
  }
  
  if (isNaN(mobility)) return 0
  
  return mobility
}

AI.getMaterialValue = function(pieces, us) {
    let value = 0

    if (us) {
      value = AI.PIECE_VALUES[AI.phase-1][0]*pieces.P.popcnt() +
              AI.PIECE_VALUES[AI.phase-1][1]*pieces.N.popcnt() +
              AI.PIECE_VALUES[AI.phase-1][2]*pieces.B.popcnt() + 
              AI.PIECE_VALUES[AI.phase-1][3]*pieces.R.popcnt() + 
              AI.PIECE_VALUES[AI.phase-1][4]*pieces.Q.popcnt()
    } else {
      value = AI.PIECE_VALUES[AI.phase-1][0]*pieces.Px.popcnt() +
              AI.PIECE_VALUES[AI.phase-1][1]*pieces.Nx.popcnt() +
              AI.PIECE_VALUES[AI.phase-1][2]*pieces.Bx.popcnt() + 
              AI.PIECE_VALUES[AI.phase-1][3]*pieces.Rx.popcnt() + 
              AI.PIECE_VALUES[AI.phase-1][4]*pieces.Qx.popcnt()
    }


    return value | 0
}

AI.getPSQT = function (pieces, turn, notturn) {
  return AI.getPSQTvalue(pieces, turn, true) - AI.getPSQTvalue(pieces, notturn, false)
}

AI.getPSQTvalue = function(pieces, turn, us) {

  let allpieces
  
  if (us) {
    allpieces = [
      pieces.P.dup(),
      pieces.N.dup(),
      pieces.B.dup(),
      pieces.R.dup(),
      pieces.Q.dup(),
      pieces.K.dup()
    ]
  } else {
    allpieces = [
      pieces.Px.dup(),
      pieces.Nx.dup(),
      pieces.Bx.dup(),
      pieces.Rx.dup(),
      pieces.Qx.dup(),
      pieces.Kx.dup()
    ]
  }
  

  let value = 0

  for (let i = 0; i <= 5; i++) {
      let pieces = allpieces[i]

      while (!pieces.isEmpty()) {
          let index = pieces.extractLowestBitPosition()
          // white: 56^index // black: index
          let sqvalue = AI.PIECE_SQUARE_TABLES[i][turn ? index : (56 ^ index)]

          value += sqvalue
      }
  }

  return value
}

AI.sortMoves = function(moves, turn, ply, board, ttEntry) {
  let killer1, killer2
  
  if (AI.killers) {
    killer1 = AI.killers[turn][ply][0]
    killer1 = AI.killers[turn][ply][1]
  }

  for (let i = 0, len = moves.length; i < len; i++) {
    let move = moves[i]
    let piece = move.getPiece()
    let to = move.getTo()
    let kind = move.getKind()
    let lastmove = board.getLastMove()

    move.mvvlva = 0
    move.hvalue = 0
    move.bvalue = 0
    move.countermove = 0
    move.psqtvalue = 0
    move.promotion = 0
    move.killer1 = 0
    move.killer2 = 0

    if (piece === 5) {
      if (kind === 2 || kind === 3) {
        move.castle = true
      } else {
        move.kingmove = true
      }
    }
    
    if (ttEntry && move.value === ttEntry.move.value) {
      move.tt = true
    }

    if (move.isCapture()) {
      move.mvvlva = AI.MVVLVASCORES[piece][move.getCapturedPiece()]
      move.capture = true

      if (lastmove && lastmove.getTo() === move.getTo()) {
        move.recapture = true
      }
    }

    if (killer1 && killer1.value === move.value) move.killer1 = true
    if (killer2 && killer2.value === move.value) move.killer2 = true


    if (kind & 8) {
      move.promotion = kind
    }

    if (lastmove) {
      let countermove = AI.countermove[turn][lastmove.getPiece()][lastmove.getTo()]
      
      if (countermove.value === move.value) move.countermove = true
    }

    
    let hvalue = AI.history[turn][piece][to]
    let bvalue = AI.butterfly[turn][move.getFrom()][to]

    if (hvalue) {
      move.hvalue = hvalue
      move.bvalue = bvalue
    } else {
      move.hvalue = move.bvalue = 0
    }

    move.psqtvalue = AI.PIECE_SQUARE_TABLES[piece][turn === 0? 56^to : to]
    // move.psqtvalue = AI.QUIETSORT[piece][turn === 0? 56^to : to]

  }

  moves.sort((a, b) => {
      return AI.scoreMove(b, board) - AI.scoreMove(a, board)
  })

  return moves
}

AI.scoreMove = function(move) {
  let score = 0
  
  if (move.tt) { 
    return score += 1e8
  }
  
  if (move.capture || move.promotion) {
    // let recapturebonus = (move.recapture|0) * 1e7
    return score += 1e7 + move.mvvlva// + recapturebonus
  }

  if (move.killer1) return score+=1e6 + 100
  if (move.killer2) return score+=1e6

  if (move.countermove) {
    return score += 1e5*move.countermove
  }

  if (move.hvalue) { //History Heuristic
    return score += move.hvalue
  } 

  return move.psqtvalue - 1000
}

AI.quiescenceSearch = function(board, alpha, beta, depth, ply, pvNode) {
  AI.qsnodes++

  let mateScore = AI.MATE - ply

  if (mateScore < beta) {
      beta = mateScore
      if (alpha >= mateScore) return mateScore
  }
  
  mateScore = -AI.MATE + ply
  
  if (mateScore > alpha) {
      alpha = mateScore
      if (beta <= mateScore) return mateScore
  }

  let turn = board.getTurnColor()
  let legal = 0
  let standpat = AI.evaluate(board, ply)
  let bestscore = -AI.INFINITY
  let incheck = board.isKingInCheck()
  let hashkey = board.hashKey.getHashKey()

  if (!incheck) {
    // we can return the stand pat score (fail-soft) or beta (fail-hard) as a lower bound
    // if (standpat >= beta ) return beta
    if (standpat >= beta ) {
      // return standpat
      return beta
    }
    
    /* delta pruning */ //Not fully tested
    // if (standpat + AI.PIECE_VALUES[0][4] < alpha) {
    //   return alpha
    // }
  
    if ( standpat > alpha) alpha = standpat
  }

  let moves
  
  if (incheck && depth >= -4) {
    moves = board.getMoves(true, false)
  } else {
    moves = board.getMoves(true, true)
  }

  
  moves = AI.sortMoves(moves, turn, ply, board, null)
  
  let bestmove = moves[0]

  for (let i=0, len=moves.length; i < len; i++) {

    let move = moves[i]

    //Bad captures pruning TESTED OK +82 ELO 174 games (-4)
    // if (depth < -4 && move.mvvlva < 6000) {
    //   continue
    // }

    if (board.makeMove(move)) {
      legal++

      let score = -AI.quiescenceSearch(board, -beta, -alpha, depth-1, ply+1, pvNode)

      board.unmakeMove()

      if( score >= beta ) {
        // AI.saveHistory(turn, move, 2)
        // return score
        return beta
      }

      if( score > alpha ) {
        alpha = score
        bestscore = score
        bestmove = move

        // AI.saveHistory(turn, move, -1)
      } else {
        // AI.saveHistory(turn, move, -64)
      }
    }
  }

  if (incheck && legal === 0) {
      // AI.ttSave(hashkey, -AI.MATE + ply, 0, AI.INFINITY, bestmove)
      return -AI.MATE + ply;
  }

  if (bestmove) AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
  return alpha
}

AI.ttSave = function (hashkey, score, flag, depth, move) {
  if (!move) console.log('no move')
  if (AI.stop || !move) return

  // AI.hashtable[hashkey % AI.htlength] = {
  //   hashkey,
  //   score,
  //   flag,
  //   depth,
  //   move
  // }

  AI.hashtable.set(hashkey % AI.htlength, {
    hashkey,
    score,
    flag,
    depth,
    move
  })

  // console.log(AI.hashtable)
}

AI.ttGet = function (hashkey) {
  // let ttEntry = AI.hashtable[hashkey % AI.htlength] 

  // if (ttEntry && hashkey === ttEntry.hashkey) {
  //   return ttEntry
  // } else {
  //   return null
  // }
  return AI.hashtable.get(hashkey % AI.htlength)
}

AI.reduceHistory = function () {
  for (let color = 0; color < 2; color++) {
    for (let piece = 0; piece < 6; piece++) {      
      for (let to = 0; to < 64; to++) {
        AI.history[color][piece][to] = ((1 - AI.reduceHistoryFactor) * AI.history[color][piece][to]) | 0
      }
    }
  }

  for (let color = 0; color < 2; color++) {
    for (let piece = 0; piece < 6; piece++) {      
      for (let to = 0; to < 64; to++) {
        AI.countermove[color][piece][to] = 0
      }
    }
  }
}

AI.saveHistory = function(turn, move, value) {
  //according to The_Relative_History_Heuristic.pdf, no much difference if it's 1 or 1 << depth
  turn = turn | 0

  let to

  if (move.isCapture()) { 
    to = move.getFrom() //TESTING
  } else {
    to = move.getTo()
    AI.butterfly[turn][move.getFrom()][to] += value | 0
  }

  AI.history[turn][move.getPiece()][to] += value | 0
   
}

AI.givescheck = function (board, move) {

  if (board.makeMove(move)) {
    let incheck = board.isKingInCheck()
  
    board.unmakeMove()
  
    return incheck
  }
  
  return false

}

AI.PVS = function(board, alpha, beta, depth, ply) {
  let pvNode = beta - alpha > 1 //https://www.chessprogramming.org/Node_Types
  let cutNode = beta - alpha === 1

  AI.nodes++


  if ((new Date()).getTime() > AI.timer + 1000 * AI.secondspermove) {
    if (AI.iteration > AI.mindepth[AI.phase-1] && !pvNode) {
      AI.stop = true
    }
  }

  let turn = board.getTurnColor()
  let notturn = ~turn & 1
  let hashkey = board.hashKey.getHashKey()
  
  let mateScore = AI.MATE - ply

  if (mateScore < beta) {
      beta = mateScore
      if (alpha >= mateScore){
        return mateScore
      }
  }
  
  mateScore = -AI.MATE + ply
  
  if (mateScore > alpha) {
      alpha = mateScore
      if (beta <= mateScore){
        return mateScore
      }
  }

  let alphaOrig = alpha
  let ttEntry = AI.ttGet(hashkey)

  if (depth <= 0) {
    return AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
  }

  if (AI.stop && AI.iteration > AI.mindepth[AI.phase-1]) return alpha
  
  //Hash table lookup
  if (ttEntry && ttEntry.depth >= depth) {
    //testear estrictamente mayor 
    AI.ttnodes++
    
    if (ttEntry.flag === 0) {
      return ttEntry.score
      
      alpha = ttEntry.score //No exact score because PSQTs change?
    } else if (ttEntry.flag === -1) {
      if (ttEntry.score > alpha) alpha = ttEntry.score
    } else if (ttEntry.flag === 1) {
      if (ttEntry.score < beta) beta = ttEntry.score
    }

    if (alpha >= beta) {
      return ttEntry.score
    }
  }
  
  //IID (if there's no ttEntry, get one for ordering moves)
  if (pvNode && !ttEntry && depth > 2) {
    AI.PVS(board, alpha, beta, depth-2, ply) //depth - 2 tested ok + 31 ELO
    ttEntry = AI.ttGet(hashkey)
  }
    
  
  let moves = board.getMoves(true, false)

  moves = AI.sortMoves(moves, turn, ply, board, ttEntry)
  
  let bestmove = moves[0]
  let lastmove = board.getLastMove()
  let legal = 0
  let bestscore = -AI.INFINITY
  let score
  let staticeval = AI.evaluate(board, ply) //Apparently doesnt affect performance at low depths

  let incheck = board.isKingInCheck()

  //Razoring (idea from Strelka) //THIS IS A COMPLETE BULLSHIT
  // if (alpha === beta - 1 && !incheck) {
  //   let value = staticeval + AI.PAWN;
  //   if (value < beta) {
  //     if (depth === 1) {
  //       let new_value = AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
  //       return Math.max(new_value, value);
  //     }
  //     value += 2*AI.PAWN;
  //     if (value < beta && depth <= 3) {
  //       let new_value = AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
  //       if (new_value < beta)
  //         return Math.max(new_value, value);
  //     }
  //   }
  // }

  // if (incheck) {
  //   if (lastmove) {
  //     if (AI.phase < 4) {
  //       AI.saveHistory(notturn, lastmove, 2**depth) //check moves up in move ordering
  //     } else {
  //       // AI.saveHistory(notturn, lastmove, -(2**depth)) //check down up in move ordering (phase 4)
  //     }
  //   }
  // }
  
  //Reverse Futility pruning (Static Null Move Pruning)
  let margin = AI.PIECE_VALUES[0][1] * depth

  if (!incheck && depth <= 3 && staticeval - margin > beta) {
    // AI.ttSave(hashkey, reverseval, -1, depth, moves[0])
    return beta
    // return staticeval - margin
  }

  let threateval = 200 * incheck

  let FHR = 0//staticeval - threateval > beta && cutNode? 3 : 0
  let noncaptures = 0
  
  for (let i=0, len=moves.length; i < len; i++) {
    let move = moves[i]
    let piece = move.getPiece()
    let to = move.getTo()

    let givescheck = AI.givescheck(board, move)

    //Absurd maneuvers pruning (AMP)
    // let doAMP

    // if (AI.phase === 1 && AI.absurd[turn][piece] >= 2) doAMP = true

    // if (AI.phase === 2 || AI.phase === 3) {
    //   if (
    //     (depth >= 2 && AI.absurd[turn][piece] >= (depth/2 | 0)) ||
    //     AI.absurd[turn][0] >= 8 ||
    //     AI.absurd[turn][1] >= 4 ||
    //     AI.absurd[turn][2] >= 4 ||
    //     AI.absurd[turn][3] >= 4 ||
    //     AI.absurd[turn][4] >= 4 ||
    //     AI.absurd[turn][5] >= 4
    //   ) {
    //     doAMP = true
    //   }
    // }
    
    // if (doAMP) {
    //   continue
    // }

    let near2mate = alpha > 2*AI.PIECE_VALUES[0][4] || beta < -2*AI.PIECE_VALUES[0][4]

    let isCapture = !!move.capture
    
    let R = 0
    let E = 0

    /*futility pruning */
    // if (!near2mate && !incheck && 1 < depth && depth <= 3+R && legal >= 1) {
    //   let futilityMargin = 2*AI.PIECE_VALUES[0][1]

    //   if (staticeval + futilityMargin * depth <= alpha)  continue

    // }


    let isPositional = move.getKind() < 4 && !incheck

    if (isPositional && AI.phase < 4 && piece > 0 && piece < 5) noncaptures++

    // Bad-Captures-Pruning (BCP) //NOT FULLY TESTED
    // if (AI.phase < 4 && isCapture && depth >= 3 && move.mvvlva < 6000 && legal > 1) {
    //   R++
    // }

    // // Late-Moves-Pruning (LMP)
    // if (AI.phase < 4 && depth > 6 && isPositional && noncaptures > 4) {
    //   continue
    // }

    // if (board.movenumber == 1 && i > 0) continue // CHEQUEA ORDEN PSQT

    // if (ttEntry && ttEntry.move.isCapture()) R++

    // if (cutNode && !isCapture && !move.promotion && depth>=3 && legal>1+2*ply) R+=2 //Not fully tested

    // let moveCountPruning = legal >= (3 + depth * depth) / 2 // tested with i and failed

    // if (moveCountPruning && depth >=3 && !isCapture) R++

    // if (!isCapture && cutNode && AI.history[turn][piece][to] < -20) {
    //   // console.log('prune')
    //   R++
    // }

    //Reductions (LMR)
    if (!incheck) {
      R += AI.LMR_TABLE[depth][i+1]

      // if (AI.phase === 4) R = R/2 | 0
    }

    if (R<0) R=0
                
    if (board.makeMove(move)) {
      legal++

      AI.absurd[turn][piece]++

      //Late-Moves-Pruning (LMP)
      // let lmplimit = 800*depth**(-1.8) | 0
      // if (!isCapture && legal > lmplimit) {
      //   board.unmakeMove()
      //   AI.absurd[turn][piece]--
      //   continue
      // }

      //Extensions
      if (pvNode && depth < 3) {
        if (incheck) {
          E = 1
        }
      }

      if (legal === 1) {
        // score = -AI.PVS(board, -beta, -alpha, depth-R-FHR-1, ply+1)

        // if (score > alpha && !AI.stop) {
          score = -AI.PVS(board, -beta, -alpha, depth+E-1, ply+1)
        // }
        
      } else {
        if (AI.stop) return alpha

        //Next moves are searched with null window
        score = -AI.PVS(board, -alpha-1, -alpha, depth-R-FHR-1, ply+1)

        //If the result looks promising, we do a research at full depth.
        //Remember we are trying to get the score at depth D, but we just get the score at depth D - R

        if (!AI.stop && score > alpha && score < beta) { //https://www.chessprogramming.org/Principal_Variation_Search
          score = -AI.PVS(board, -beta, -alpha, depth+E-1, ply+1)
        }
      }
      
      board.unmakeMove()
      AI.absurd[turn][piece]--
      
      // if (AI.stop) return alpha
      if (AI.stop) return alphaOrig //tested ok
      
      //Betsmove so far
      if (score > alpha) {
        bestscore = score
        bestmove  = move

        //Beta cut-off
        if (score >= beta) {
          if (legal === 1) {
            AI.fhf++
          }

          AI.fh++
          
          
          //LOWERBOUND
          AI.ttSave(hashkey, score, -1, depth, move)

          if (!isCapture) {
            AI.killers[turn|0][ply][1] = AI.killers[turn|0][ply][0]
            AI.killers[turn|0][ply][0] = move

            // AI.saveHistory(turn, move, depth**3)
            if (lastmove) AI.countermove[turn][lastmove.getPiece()][lastmove.getTo()] = move

            //Negative plausibility (http://www.aifactory.co.uk/newsletter/2007_01_neg_plausibility.htm)
            // for (let j=0; j < i; j++) {
              //   if (!moves[j].capture) AI.saveHistory(turn, moves[j], (j-i)*depth)
              // }
              
            }
            
            return beta
            // return score
          }
          
          if (!isCapture) {AI.saveHistory(turn, move, depth**2)}
          AI.ttSave(hashkey, score, -1, depth, move)
        
        alpha = score
      } else {
        // AI.ttSave(hashkey, score, 1, depth, move) //TESTED AT HIGH DEPTH
      }
    }
  }

  if (ply === 1 && legal === 1) AI.stop = true

  if (legal === 0) {
      // stalemate, draw
      if (!board.isKingInCheck()) {
        AI.ttSave(hashkey, AI.DRAW + ply, 0, depth, bestmove)
        return AI.DRAW + ply
      }
      
      AI.ttSave(hashkey, -AI.MATE + ply, 0, depth, bestmove)
      return -AI.MATE + ply
      
  } else {

    if (board.isDraw()) {
      AI.ttSave(hashkey, AI.DRAW + ply, 1, depth, bestmove)   
      return AI.DRAW + ply
    }

    if (bestscore > alphaOrig) {
      // EXACT
      if (bestmove) {
        AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
        if (!bestmove.isCapture()) AI.saveHistory(turn, bestmove, 1)
      }
      return bestscore
    } else {
      //UPPERBOUND value <= alphaorig
      AI.ttSave(hashkey, alphaOrig, 1, depth, bestmove)
      return alphaOrig
    }
  }
  
}

AI.bin2map = function(bin, color) {
  let dec = Array(32).fill('0').concat((bin.high >>> 0).toString(2).split('')).slice(-32)
      dec = dec.concat(Array(32).fill('0').concat((bin.low >>> 0).toString(2).split('')).slice(-32))

  if (color) dec.reverse()

  let map = []

  let reverse = function (array, color) {
    if (color === 0) {
      return array.reverse()
    } else {
      return array
    }
  }

  map.push(reverse(dec.slice(0, 8), color))
  map.push(reverse(dec.slice(8, 16), color))
  map.push(reverse(dec.slice(16, 24), color))
  map.push(reverse(dec.slice(24, 32), color))
  map.push(reverse(dec.slice(32, 40), color))
  map.push(reverse(dec.slice(40, 48), color))
  map.push(reverse(dec.slice(48, 56), color))
  map.push(reverse(dec.slice(56, 64), color))

  let arraymap = map.join().split(',').map(e=>{return parseInt(e)})

  return arraymap
}

AI.createPSQT = function (board) {

  AI.PIECE_SQUARE_TABLES_PHASE1 = [
  // Pawn
      [ 
       0,  0,  0,  0,  0,   0,  0,  0,
      wm, wm, wm, wm, wm, vbm,vbm,vbm, 
      wm,vbm, bm, bm, bm, vbm,vbm,vbm,
     vbm, bm, nm,VGM,VGM, vbm,vbm,vbm,
      wm, nm, nm, BM, BM,  wm, wm, wm,
      nm, GM, GM, wm, wm, vbm, GM, nm,
      GM, GM, GM, wm, wm,  BM, BM, BM,
       0,  0,  0,  0,  0,   0,  0,  0,
      ],

      // Knight
      [ 
     vbm, bm, bm, bm, bm, bm, bm, vbm,
     vbm, bm, bm, bm, bm, bm, bm, vbm,
     vbm, bm, nm, nm, nm, nm, bm, vbm,
      wm, bm, nm, GM, GM, nm, bm,  wm,
      wm, bm, wm, GM, GM, wm, bm,  wm,
      wm, bm, BM, nm, nm, BM, bm,  wm,
     vbm, bm, bm, nm, nm, bm, bm, vbm,
     vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
      
      ],
      // Bishop
    [ 
      vbm, bm, bm, bm, bm, bm, bm, vbm,
      vbm, bm, bm, bm, bm, bm, bm, vbm,
      vbm, bm, nm, nm, nm, nm, bm, vbm,
      vbm,vbm, nm, GM, GM, nm, bm, vbm,
      vbm, bm, BM, GM, GM, BM, bm, vbm,
       wm, bm, nm, nm, nm, nm, bm,  wm,
      vbm, BM, bm, nm, nm, bm, BM, vbm,
      vbm,vbm, wm,vbm,vbm, wm,vbm, vbm,
    ],
    // Rook
    [ 
      nm, nm, nm, nm, nm, nm, nm, nm,
      GM, GM, GM, BM, BM, GM, GM, GM,
      wm, wm, wm, wm, wm, wm, wm, wm,
      wm, wm, wm, wm, wm, wm, wm, wm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, BM, GM, GM, nm, nm,
    ],
    
    // Queen
    [ 
      wm, wm, wm, wm, wm, wm, wm, wm,
      wm, wm, wm, wm, wm, wm, wm, wm,
      wm, wm, wm, wm, wm, wm, wm, wm,
      wm, wm, wm, wm, wm, wm, wm, wm,
      bm, bm, bm, bm, bm, bm, bm, bm,
      bm, bm, bm,vbm, bm, bm, bm, bm,
      bm, bm, GM, GM, GM, bm, bm, bm,
      wm,vbm, wm, BM, wm,vbm,vbm, wm,
    ],

    // King
    [ 
       wm, wm, wm, wm, wm, wm, wm, wm,
       wm, wm, wm, wm, wm, wm, wm, wm,
       wm, wm, wm, wm, wm, wm, wm, wm,
       wm, wm, wm, wm, wm, wm, wm, wm,
       wm, wm, wm, wm, wm, wm, wm, wm, 
      vbm,vbm,vbm, wm, wm,vbm,vbm,vbm,
       bm, bm, bm,vbm,vbm,vbm, nm, nm,
       bm, bm, GM, wm, bm,vbm, BM,nm

    ],
  ]

  AI.PIECE_SQUARE_TABLES_PHASE2 = [
    // Pawn
        [ 
         0,  0,  0,  0,  0,   0,  0,  0,
        nm, nm, nm, nm, nm, nm, nm,vbm, 
        nm, nm, nm, nm, nm, nm, nm,vbm,
        nm, nm, GM, GM, GM, GM,vbm,vbm,
        nm, GM, GM, GM, GM,vbm,vbm,vbm,
        GM, GM, GM, nm, GM,vbm, nm, nm,
       VGM, GM,vbm,vbm,vbm,VGM,VGM,VGM,
         0,  0,  0,  0,  0,  0,  0,  0,
        ],
  
        // Knight
        [ 
       vbm, bm, bm, bm, bm, bm, bm, vbm,
       vbm, bm, bm, bm, bm, bm, bm, vbm,
       vbm, bm,VGM,VGM,VGM,VGM, bm, vbm,
       vbm, bm,VGM, BM, BM,VGM, bm, vbm,
       vbm, bm, GM, BM, BM, GM, bm, vbm,
       vbm, bm, nm, nm, nm, nm, bm, vbm,
       vbm, bm, bm, bm, bm, bm, bm, vbm,
       vbm, wm,vbm,vbm,vbm,vbm, wm, vbm,
        
        ],
        // Bishop
      [ 
        vbm, bm, bm, bm, bm, bm, bm, vbm,
        vbm, bm, bm, bm, bm, bm, bm, vbm,
        vbm, bm, nm, nm, nm, nm, bm, vbm,
        vbm, GM, BM, BM, BM, BM, GM, vbm,
        vbm, GM, GM,VGM,VGM, GM, GM, vbm,
         wm, GM, GM, GM, GM, GM, GM,  wm,
        vbm, GM, bm, bm, bm, bm, GM, vbm,
        vbm,vbm, wm,vbm,vbm, wm,vbm, vbm,
      ],
      // Rook
      [ 
        nm, nm, nm, nm, nm, nm, nm, nm,
        GM,VGM,VGM, BM, BM,VGM,VGM, GM,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, GM, GM, nm, nm, nm,
        wm, nm, nm, GM, GM, nm, nm, wm,
      ],
      
      // Queen
      [ 
        bm, bm, bm, nm, nm, nm, nm, nm,
        bm, wm, bm, nm, nm, nm, nm, nm,
        bm, bm, bm, nm, nm, nm, nm, nm,
        nm, nm, nm, wm, wm, nm, nm, nm,
        nm, nm, nm, wm, wm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        bm, bm, GM, GM, GM, bm, bm, bm,
       vbm,vbm,vbm, wm, bm,vbm,vbm,vbm,
      ],
  
      // King
      [ 
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm, 
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
         bm, bm, bm,wm, wm,vbm, nm, nm,
         bm, GM, nm,wm,vbm,vbm, BM, nm
  
      ],
    ]

  AI.PIECE_SQUARE_TABLES_PHASE3 = [
    // Pawn
        [ 
         0,  0,  0,  0,  0,   0,  0,  0,
        nm, nm, nm, nm, nm, nm, nm, nm, 
        BM, BM, BM, BM, BM, BM, BM, BM, 
       VGM,VGM,VGM,VGM,VGM,VGM,VGM,VGM, 
        GM, GM, GM, GM, GM, GM, GM, GM, 
        GM, GM, GM, GM, GM, GM, GM, GM, 
        nm, nm, nm, nm, nm, nm, nm, nm, 
         0,  0,  0,  0,  0,   0,  0,  0,
        ],
  
        // Knight
        [ 
       vbm, bm, bm, bm, bm, bm, bm, vbm,
       vbm, nm, nm, nm, nm, nm, nm, vbm,
       vbm, nm, GM, GM, GM, GM, nm, vbm,
       vbm, nm, GM, BM, BM, GM, nm, vbm,
       vbm, nm, GM, BM, BM, GM, nm, vbm,
       vbm, nm, GM, GM, GM, GM, nm, vbm,
       vbm, nm, nm, nm, nm, nm, nm, vbm,
       vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
        
        ],
        // Bishop
        [ 
          vbm, bm, bm, bm, bm, bm, bm, vbm,
           bm, nm, nm, nm, nm, nm, nm,  bm,
           nm, nm, GM, GM, GM, GM, nm,  nm,
           nm, nm, GM, BM, BM, GM, nm,  nm,
           nm, nm, GM, BM, BM, GM, nm,  nm,
           nm, nm, GM, GM, GM, GM, nm,  nm,
           bm, nm, nm, nm, nm, nm, nm,  bm,
          vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
           
           ],
      // Rook
      [ 
       VGM,VGM,VGM,VGM,VGM,VGM,VGM,VGM,
        GM, GM, GM, BM, BM, GM, GM, GM,
        nm, nm, nm, GM, GM, nm, nm, nm,
        nm, nm, nm, GM, GM, nm, nm, nm,
        nm, nm, nm, GM, GM, nm, nm, nm,
        nm, nm, nm, GM, GM, nm, nm, nm,
        nm, nm, nm, GM, GM, nm, nm, nm,
        wm, wm, wm, GM, GM, wm, wm, wm,
      ],
      
      // Queen
      [ 
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, GM, GM, GM, GM, GM, GM, nm,
        nm, GM, GM, GM, GM, GM, GM, nm,
        nm, GM, GM, BM, BM, GM, GM, nm,
        nm, GM, GM, BM, BM, GM, GM, nm,
        nm, GM, GM, GM, GM, GM, GM, nm,
        nm, GM, GM, GM, GM, GM, GM, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
      ],
  
      // King
      [ 
        wm, wm, wm, wm, wm, wm, wm, wm,
        wm, bm, bm, bm, bm, bm, bm, wm,
        wm, bm, GM,VGM,VGM, GM, bm, wm,
        wm, GM,VGM, BM, BM,VGM, GM, wm,
        wm, GM,VGM, BM, BM,VGM, GM, wm,
        wm, bm, GM,VGM,VGM, GM, bm, wm,
        wm, bm, bm, bm, bm, bm, bm, wm,
        wm, wm, wm, wm, wm, wm, wm, wm,
      ],
    ]

    AI.PIECE_SQUARE_TABLES_PHASE4 = [
      // Pawn
          [ 
           0,  0,  0,  0,  0,  0,  0,  0,
          BM, BM, BM, BM, BM, BM, BM, BM,
         VGM,VGM,VGM,VGM,VGM,VGM,VGM,VGM,
          GM, GM, GM, GM, GM, GM, GM, GM,
          bm, bm, bm, bm, bm, bm, bm, bm,
         vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
          wm, wm, wm, wm, wm, wm, wm, wm,
          0,  0,  0,  0,  0,   0,  0,  0,
        ],
        
        // Knight
        [ 
          vbm, bm, bm, bm, bm, bm, bm, vbm,
          vbm, nm, nm, nm, nm, nm, nm, vbm,
          vbm, nm, GM, GM, GM, GM, nm, vbm,
          vbm, nm, GM, BM, BM, GM, nm, vbm,
          vbm, nm, GM, BM, BM, GM, nm, vbm,
          vbm, nm, GM, GM, GM, GM, nm, vbm,
          vbm, nm, nm, nm, nm, nm, nm, vbm,
          vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
           
           ],
           // Bishop
           [ 
             vbm, bm, bm, bm, bm, bm, bm, vbm,
              bm, nm, nm, nm, nm, nm, nm,  bm,
              nm, nm, GM, GM, GM, GM, nm,  nm,
              nm, nm, GM, BM, BM, GM, nm,  nm,
              nm, nm, GM, BM, BM, GM, nm,  nm,
              nm, nm, GM, GM, GM, GM, nm,  nm,
              bm, nm, nm, nm, nm, nm, nm,  bm,
             vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
              
              ],
         // Rook
         [ 
          VGM,VGM,VGM,VGM,VGM,VGM,VGM,VGM,
           GM, GM, GM, BM, BM, GM, GM, GM,
           nm, nm, nm, GM, GM, nm, nm, nm,
           nm, nm, nm, GM, GM, nm, nm, nm,
           nm, nm, nm, GM, GM, nm, nm, nm,
           nm, nm, nm, GM, GM, nm, nm, nm,
           nm, nm, nm, GM, GM, nm, nm, nm,
           wm, wm, wm, GM, GM, wm, wm, wm,
         ],
         
         // Queen
         [ 
           nm, nm, nm, nm, nm, nm, nm, nm,
           nm, GM, GM, GM, GM, GM, GM, nm,
           nm, GM, GM, GM, GM, GM, GM, nm,
           nm, GM, GM, BM, BM, GM, GM, nm,
           nm, GM, GM, BM, BM, GM, GM, nm,
           nm, GM, GM, GM, GM, GM, GM, nm,
           nm, GM, GM, GM, GM, GM, GM, nm,
           nm, nm, nm, nm, nm, nm, nm, nm,
         ],
     
         // King
         [ 
          wm, wm, wm, wm, wm, wm, wm, wm,
          wm, bm, bm, bm, bm, bm, bm, wm,
          wm, bm, GM,VGM,VGM, GM, bm, wm,
          wm, GM,VGM, BM, BM,VGM, GM, wm,
          wm, GM,VGM, BM, BM,VGM, GM, wm,
          wm, bm, GM,VGM,VGM, GM, bm, wm,
          wm, bm, bm, bm, bm, bm, bm, wm,
          wm, wm, wm, wm, wm, wm, wm, wm,
        ],
      ]

    AI.PIECE_SQUARE_TABLES_PHASE1 = AI.PIECE_SQUARE_TABLES_PHASE1.map((table, piece)=>{
      return table.map(values=>values*AI.PSQT_SCALAR[0][piece])
    })

    AI.PIECE_SQUARE_TABLES_PHASE2 = AI.PIECE_SQUARE_TABLES_PHASE2.map((table, piece)=>{
      return table.map(values=>values*AI.PSQT_SCALAR[1][piece])
    })

    AI.PIECE_SQUARE_TABLES_PHASE3 = AI.PIECE_SQUARE_TABLES_PHASE3.map((table, piece)=>{
      return table.map(values=>values*AI.PSQT_SCALAR[2][piece])
    })

    AI.PIECE_SQUARE_TABLES_PHASE4 = AI.PIECE_SQUARE_TABLES_PHASE4.map((table, piece)=>{
      return table.map(values=>values*AI.PSQT_SCALAR[3][piece])
    })

    AI.preprocessor(board)
    
    if (AI.phase === 1) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE1]
    if (AI.phase === 2) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE2]
    if (AI.phase === 3) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE3]
    if (AI.phase === 4) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE4]
}

AI.PSQT2Sigmoid = function () {
  /***************** PSQT a sigmoidea *****************/
  let upperlimit = 120
  let lowerlimit = 120

  for (let i = 1; i <= 4; i++) {
    AI.PIECE_SQUARE_TABLES[i] = AI.PIECE_SQUARE_TABLES[i].map(psqv=>{
      if (psqv > 0) {
        return (upperlimit*2)/(1 + Math.exp(-psqv/(upperlimit/2))) - upperlimit | 0
      } else {
        return (lowerlimit*2)/(1 + Math.exp(-psqv/(lowerlimit/2))) - lowerlimit | 0
      }
      
    })
  }
}

AI.softenPSQT = function () {
  for (let p = 0; p <= 5; p++) {
    AI.PIECE_SQUARE_TABLES[p] = AI.PIECE_SQUARE_TABLES[p].map((e,i)=>{
      if (e) return e

      let N = [...AI.PIECE_SQUARE_TABLES[p]]
      let sum = N[i]
      let total = 1
      
      if (i%8!=0 && N[i-9]) {sum += N[i-9]; total++}
      if ((i+1)%8!=0 && N[i-7]) {sum += N[i-7]; total++}
      
      if (i%8!=0 && N[i+7]) {sum += N[i+7]; total++}
      if ((i+1)%8!=0 && N[i+9]) {sum += N[i+9]; total++}
      
      if (i%8!=0 && N[i-1]) {sum += N[i-1]; total++}
      if ((i+1)%8!=0 && N[i+1]) {sum += N[i+1]; total++}
      
      if (N[i-8]) {sum += N[i-8]; total++}
      if (N[i+8]) {sum += N[i+8]; total++}

      let average = sum/total
    
      return average/2 | 0
    })
  }
}

AI.preprocessor = function (board) {
  // return
  let color = board.getTurnColor()

  let P = board.getPieceColorBitboard(0, color).dup()
  let N = board.getPieceColorBitboard(1, color).dup()
  let B = board.getPieceColorBitboard(2, color).dup()
  let R = board.getPieceColorBitboard(3, color).dup()
  let Q = board.getPieceColorBitboard(4, color).dup()
  let K = board.getPieceColorBitboard(5, color).dup()
  let PX = board.getPieceColorBitboard(0, !color).dup()
  let BX = board.getPieceColorBitboard(2, !color).dup()
  let RX = board.getPieceColorBitboard(3, !color).dup()
  let QX = board.getPieceColorBitboard(4, !color).dup()
  let KX = board.getPieceColorBitboard(5, !color).dup()

  let pawnmask = Chess.Position.makePawnAttackMask(color, P)
  let pawnmap = AI.bin2map(P, color)
  let pawnstructure  = AI.bin2map({high: P.high | pawnmask.high, low: P.low | pawnmask.low}, color)

  
  let pawnmaskX = Chess.Position.makePawnAttackMask(!color, PX).not(PX)
  let pawnXmap = AI.bin2map(PX, color)

  let kingmap = AI.bin2map(K, color)
  let kingXmap = AI.bin2map(KX, color)

  let kingposition = kingmap.indexOf(1)

  let kingXposition = kingXmap.indexOf(1)

  //Castiga captura y maniobras con peón frontal del rey
  if (kingposition >= 61 || (kingposition>=56 && kingposition<=58)) {
    //Good
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 7] += VGM * 20
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 8] += GM * 20
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 9] += VGM * 20

    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 7] += VGM * 20
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 8] += GM * 20
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 9] += VGM * 20

    //Bad
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 15] += wm * 20
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 17] += wm * 20
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 23] += wm * 20  
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 24] += wm * 20   
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 25] += wm * 20   

    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 15] += bm * 20
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 17] += bm * 20
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 23] += vbm  * 20   
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 24] += vbm  * 20   
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 25] += vbm  * 20   
  }

  //Torre
  //Premia enrocar
  if (board.hasCastlingRight(color, true) && 
    (
      (pawnmap[kingposition-5] && pawnmap[kingposition-6]) ||
      (pawnmap[kingposition-5] && pawnmap[kingposition-7] && pawnmap[kingposition-14])
    )
  ) {
      // console.log('rook KINGSIDE')
        AI.PIECE_SQUARE_TABLES_PHASE2[3][63]  -= 20
        AI.PIECE_SQUARE_TABLES_PHASE2[3][62]  -= 20
        AI.PIECE_SQUARE_TABLES_PHASE2[3][61]  += 40
      }

    if (board.hasCastlingRight(color, false) && pawnmap[kingposition-10] && pawnmap[kingposition-11]) {
        // console.log('rook QUEENSIDE')
        AI.PIECE_SQUARE_TABLES_PHASE2[3][56]  -= 20
        AI.PIECE_SQUARE_TABLES_PHASE2[3][57]  -= 20
        AI.PIECE_SQUARE_TABLES_PHASE2[3][58]  -= 20
        AI.PIECE_SQUARE_TABLES_PHASE2[3][59]  += 40
      }

  //Torres en columnas abiertas
  
  let pawnXfiles = [0,0,0,0,0,0,0,0]
  let pawnfiles = [0,0,0,0,0,0,0,0]
  
  for (let i = 0; i < 64; i++) {
    if (pawnmap[i]) {
      let col = i % 8

      pawnfiles[col]++
    }
  }

  for (let i = 0; i < 64; i++) {
    if (pawnXmap[i]) {
      let col = i % 8

      if (pawnfiles[col]) {
        //Si las columnas están abiertas en mi lado, cuento las del otro lado (antes no)
        pawnXfiles[col]++
      }

    }
  }

  
  AI.PIECE_SQUARE_TABLES_PHASE1[3] = AI.PIECE_SQUARE_TABLES_PHASE1[3].map((e,i)=>{
    let col = i%8
    return e + (pawnfiles[col]? -40 : 0)
  })
  
  AI.PIECE_SQUARE_TABLES_PHASE1[3] = AI.PIECE_SQUARE_TABLES_PHASE1[3].map((e,i)=>{
    let col = i%8
    return e + (!pawnfiles[col]? 80 : 0) + (!pawnXfiles[col]? 50 : 0)
  })
  
  AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e,i)=>{
    let col = i%8
    return e + (pawnfiles[col]? -20 : 0)
  })
  
  AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e,i)=>{
    let col = i%8
    return e + (!pawnfiles[col]? 50 : 0) + (!pawnXfiles[col]? 50 : 0)
  })
  
  // Torres delante del rey enemigo ("torre en séptima")
  for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_PHASE2[3][i + 8*(kingXposition/8 | 0)] += 27

  //Torres conectadas
  let RR = board.makeRookAttackMask(R, P.or(PX))
  let RRmap = AI.bin2map(RR, color)

  AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e,i)=>{
    return e + 10*RRmap[i]
  })

  //Castiga torres sin desarrollar
  AI.PIECE_SQUARE_TABLES_PHASE2[2][56] -= 40
  AI.PIECE_SQUARE_TABLES_PHASE2[2][63] -=100

  //Premia enrocar
  if (board.hasCastlingRight(color, true)) {
    // console.log('KINGSIDE')

    if (
      (pawnmap[kingposition-5] && pawnmap[kingposition-6]) ||
      (pawnmap[kingposition-5] && pawnmap[kingposition-7] && pawnmap[kingposition-14])
    ) {
      AI.PIECE_SQUARE_TABLES_PHASE2[5][60]  -= 20
      AI.PIECE_SQUARE_TABLES_PHASE2[5][61]  -= 20
      AI.PIECE_SQUARE_TABLES_PHASE2[5][62]  +=120
    } else {
      AI.PIECE_SQUARE_TABLES_PHASE2[5][62]  -=200
      AI.PIECE_SQUARE_TABLES_PHASE1[5][62]  -=200 //Evita enroque al vacío

    }
  }

  if (board.hasCastlingRight(color, false)) {
    // console.log('QUEENSIDE')

    if (pawnmap[kingposition-10] && pawnmap[kingposition-11]) {
      AI.PIECE_SQUARE_TABLES_PHASE2[5][58]  += 40
      AI.PIECE_SQUARE_TABLES_PHASE2[5][59]  -= 40
      AI.PIECE_SQUARE_TABLES_PHASE2[5][60]  -= 20
    } else {
      AI.PIECE_SQUARE_TABLES_PHASE2[5][58]  -=200
      AI.PIECE_SQUARE_TABLES_PHASE1[5][58]  -=200 //Evita enroque al vacío
    }
  }

//***************** ENDGAME ***********************
//***************** ENDGAME ***********************
//***************** ENDGAME ***********************
//***************** ENDGAME ***********************

  //Castiga captura y maniobras con peón frontal del rey
  if (board.getMadeMoveCount()>12 && kingposition > 55) {
    AI.PIECE_SQUARE_TABLES_PHASE3[0][kingposition - 8] +=50 
  }

  //Torres en columnas abiertas

  pawnfiles = [0,0,0,0,0,0,0,0]

  for (let i = 0; i < 64; i++) {
    if (pawnmap[i]) {
      let col = i % 8

      pawnfiles[col]++
    }
  }

  AI.PIECE_SQUARE_TABLES_PHASE3[3] = AI.PIECE_SQUARE_TABLES_PHASE3[3].map((e,i)=>{
    let col = i%8
    return e + (pawnfiles[col]? -40 : 0)
  })

  AI.PIECE_SQUARE_TABLES_PHASE3[3] = AI.PIECE_SQUARE_TABLES_PHASE3[3].map((e,i)=>{
    let col = i%8
    return e + (!pawnfiles[col]? 40 : 0)
  })

  //Torres delante del rey enemigo ("torre en séptima")
  for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_PHASE3[3][i + 8*(kingXposition/8 | 0)] += 27
  
  if (AI.phase === 4 && AI.lastscore >= AI.PIECE_VALUES[0][3]) {
    //Rey cerca del rey enemigo
    AI.PIECE_SQUARE_TABLES_PHASE3[5] = AI.PIECE_SQUARE_TABLES_PHASE3[5].map((e,i)=>{
      return 4 * (8 - AI.manhattanDistance(kingXposition, i))
    })
  }

  //////////////// X RAYS ///////////////////////
  //////////////// X RAYS ///////////////////////
  //////////////// X RAYS ///////////////////////
  //////////////// X RAYS ///////////////////////
  let KB = board.makeBishopAttackMask(KX, false)
  let KBmap = AI.bin2map(KB, color)

  let BB = board.makeBishopAttackMask(BX, false)
  let BBmap = AI.bin2map(BB, color)

  let RB = board.makeBishopAttackMask(RX, false)
  let RBmap = AI.bin2map(RB, color)
  
  let QB = board.makeBishopAttackMask(QX, false)
  let QBmap = AI.bin2map(QB, color)

  let KR = board.makeRookAttackMask(KX, false)
  let KRmap = AI.bin2map(KR, color)

  let RRx = board.makeRookAttackMask(RX, false)
  let RRmapx = AI.bin2map(RRx, color)

  let QR = board.makeRookAttackMask(KX, false)
  let QRmap = AI.bin2map(QR, color)

  //Alfiles apuntando a torres
  AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e,i)=>{
    return e + 20*RBmap[i]
  })

  //Alfiles apuntando a dama
  AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e,i)=>{
    return e + 20*QBmap[i]
  })
  
  //Alfiles apuntando al rey
  AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e,i)=>{
    return e + 20*KBmap[i]
  })

  AI.PIECE_SQUARE_TABLES_PHASE3[2] = AI.PIECE_SQUARE_TABLES_PHASE3[2].map((e,i)=>{
    return e + 20*KBmap[i]
  })

  if (kingXposition % 8 < 7) {
    AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e,i)=>{
      return e + 20*(KBmap[i + 1] || 0)
    })    
  }

  if (kingXposition % 8 < 7) {
    AI.PIECE_SQUARE_TABLES_PHASE3[2] = AI.PIECE_SQUARE_TABLES_PHASE3[2].map((e,i)=>{
      return e + 20*(KBmap[i + 1] || 0)
    })    
  }

  if (kingXposition % 8 > 0) {
    AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e,i)=>{
      return e + 20*(KBmap[i - 1] || 0)
    })
  }

  if (kingXposition % 8 > 0) {
    AI.PIECE_SQUARE_TABLES_PHASE3[2] = AI.PIECE_SQUARE_TABLES_PHASE3[2].map((e,i)=>{
      return e + 20*(KBmap[i - 1] || 0)
    })
  }

  //Torres apuntando a dama
  AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e,i)=>{
    return e + 10*QRmap[i]
  })

  //Torres apuntando al rey
  AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e,i)=>{
    return e + 10*KRmap[i]
  })

  AI.PIECE_SQUARE_TABLES_PHASE3[3] = AI.PIECE_SQUARE_TABLES_PHASE3[3].map((e,i)=>{
    return e + 10*KRmap[i]
  })

  //Dama apuntando al rey
  AI.PIECE_SQUARE_TABLES_PHASE2[4] = AI.PIECE_SQUARE_TABLES_PHASE2[4].map((e,i)=>{
    return e + 10*KBmap[i]
  })

  //Dama apuntando a alfiles enemigos
  AI.PIECE_SQUARE_TABLES_PHASE2[4] = AI.PIECE_SQUARE_TABLES_PHASE2[4].map((e,i)=>{
    return e - 60*BBmap[i]
  })

  //Dama apuntando a torres enemigas
  AI.PIECE_SQUARE_TABLES_PHASE2[4] = AI.PIECE_SQUARE_TABLES_PHASE2[4].map((e,i)=>{
    return e - 20*RRmapx[i]
  })

  //Rey apuntando a alfiles enemigos
  AI.PIECE_SQUARE_TABLES_PHASE2[5] = AI.PIECE_SQUARE_TABLES_PHASE2[5].map((e,i)=>{
    return e - 60*BBmap[i]
  })

  //Rey apuntando a torres enemigas
  AI.PIECE_SQUARE_TABLES_PHASE2[5] = AI.PIECE_SQUARE_TABLES_PHASE2[5].map((e,i)=>{
    return e - 20*RRmapx[i]
  })

  /************* ABSURD MOVES *****************/

  AI.PIECE_SQUARE_TABLES_PHASE1[1] = AI.PIECE_SQUARE_TABLES_PHASE1[1].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE1[2] = AI.PIECE_SQUARE_TABLES_PHASE1[2].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE1[3] = AI.PIECE_SQUARE_TABLES_PHASE1[3].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE1[4] = AI.PIECE_SQUARE_TABLES_PHASE1[4].map((e,i)=>{return e-20*pawnXmap[i]})

  AI.PIECE_SQUARE_TABLES_PHASE2[1] = AI.PIECE_SQUARE_TABLES_PHASE2[1].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE2[4] = AI.PIECE_SQUARE_TABLES_PHASE2[4].map((e,i)=>{return e-20*pawnXmap[i]})

  AI.PIECE_SQUARE_TABLES_PHASE3[1] = AI.PIECE_SQUARE_TABLES_PHASE3[1].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE3[2] = AI.PIECE_SQUARE_TABLES_PHASE3[2].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE3[3] = AI.PIECE_SQUARE_TABLES_PHASE3[3].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE3[4] = AI.PIECE_SQUARE_TABLES_PHASE3[4].map((e,i)=>{return e-20*pawnXmap[i]})

  AI.PIECE_SQUARE_TABLES_PHASE4[1] = AI.PIECE_SQUARE_TABLES_PHASE4[1].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE4[2] = AI.PIECE_SQUARE_TABLES_PHASE4[2].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE4[3] = AI.PIECE_SQUARE_TABLES_PHASE4[3].map((e,i)=>{return e-20*pawnXmap[i]})
  AI.PIECE_SQUARE_TABLES_PHASE4[4] = AI.PIECE_SQUARE_TABLES_PHASE4[4].map((e,i)=>{return e-20*pawnXmap[i]})
}

AI.setphase = function (board) {
  AI.phase = 1 //OPENING
  let color = board.getTurnColor()

  if (AI.nofpieces <= 28 || (board.movenumber && board.movenumber > 9)) {
      AI.phase = 2 //MIDGAME
  }

  let queens = board.getPieceColorBitboard(4, color).popcnt() + board.getPieceColorBitboard(4, !color).popcnt()

  if (AI.nofpieces <= 20 && queens === 0 || Math.abs(AI.lastscore) > AI.PAWN) { // ¿Debería ser queens < 2? Hay que testearlo
    AI.phase = 3 //ENDGAME (the king enters)
  }

  if (AI.nofpieces <= 12 || Math.abs(AI.lastscore) > AI.PIECE_VALUES[0][1]) AI.phase = 4 //LATE ENGDAME
  
  AI.createPSQT(board)
  AI.randomizePSQT()
  
  AI.softenPSQT()

  AI.PSQT2Sigmoid()
}

AI.getPV = function (board, length) {
  let PV = [board.getLastMove() || {}]
  let legal = 0

  let ttEntry
  let ttFound

  for (let i = 0; i < length; i++) {
    ttFound = false
    let hashkey = board.hashKey.getHashKey()
    ttEntry = AI.ttGet(hashkey)

    if (ttEntry /*&& ttEntry.depth > 0*/) {
      let moves = board.getMoves(false, false).filter(move=>{
        return move.value === ttEntry.move.value
      })

      if (moves.length) {
        if (board.makeMove(ttEntry.move)) {
          legal++
          
          if (board.isDraw() && legal > 1) {
            break
          } else {
            ttFound = true

            //Checks if the move is already in the PV line
            let already = PV.filter(e=>{
              return e.value === ttEntry.move.value
            })

            if (already.length === 0) {
              PV.push(ttEntry.move)
            } else {
              break
            }

            
          }
          
        }
      }      
    } else {
      break
    }
  }

  for (let i = 0; i < legal; i++) {
    board.unmakeMove()
  }
  
  return PV
}

AI.MTDF = function (board, f, d) {
  let g = f

  let upperBound =  AI.INFINITY
  let lowerBound = -AI.INFINITY

  //Esta línea permite que el algoritmo funcione como PVS normal
  return AI.PVS(board, lowerBound, upperBound, d, 1) 
  // console.log('INICIO DE MTDF')
  let i = 0

  while (lowerBound < upperBound && !AI.stop) {
    let beta = Math.max(g, lowerBound + 1)

    i++

    g = AI.PVS(board, beta - 1, beta, d, 1)

    if (g < beta) {
      upperBound = g
    } else {
      lowerBound = g
    }
  }

  return g
}

AI.weightAdjustmentsPieces = [[0],[0],[0],[0],[0],[0]]

AI.search = function(board, options) {

  if (board.movenumber && board.movenumber <= 1) {
    AI.lastscore = 0
    AI.bestmove = 0
    AI.bestscore = 0
  }

  if (options && options.seconds) AI.secondspermove = options.seconds

  AI.nofpieces = board.getOccupiedBitboard().popcnt()

  let nmoves = board.madeMoves.length
  let changeofphase = false
  
  AI.setphase(board)

  if (AI.lastphase !== AI.phase) changeofphase = true

  AI.lastphase = AI.phase

  if (board.movenumber && board.movenumber <= 1 || changeofphase) {
    AI.createTables()
  }
  
  AI.reduceHistory()

  AI.absurd = [
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
  ]
  
  return new Promise((resolve, reject) => {
    let color = board.getTurnColor()
    
    AI.color = color
    
    let white = color == 0
    
    if (white) {
      AI.TESTER = true

      // if (AI.lastscore) {
      //   if (AI.lastscore > AI.PIECE_VALUES[0][1]) {
      //     AI.DRAW = -2*AI.PIECE_VALUES[0][0]
      //   } else if (AI.lastscore > AI.PIECE_VALUES[0][1]) {
      //     AI.DRAW = 2*AI.PIECE_VALUES[0][0]
      //   } else {
      //     AI.DRAW = 0
      //   }
      // } 
    } else {
      AI.TESTER = false

      // if (AI.lastscore) {
      //   if (-AI.lastscore > AI.PIECE_VALUES[0][1]) {
      //     AI.DRAW = -2*AI.PIECE_VALUES[0][0]
      //   } else if (-AI.lastscore > AI.PIECE_VALUES[0][1]) {
      //     AI.DRAW = 2*AI.PIECE_VALUES[0][0]
      //   } else {
      //     AI.DRAW = 0
      //   }
      // } 
    }
        
    AI.nodes = 0
    AI.qsnodes = 0
    AI.enodes = 0
    AI.ttnodes = 0
    AI.iteration = 0
    AI.timer = (new Date()).getTime()
    AI.stop = false
    AI.PV = AI.getPV(board, AI.totaldepth+1)
    AI.changeinPV = true
    
    let score = 0
    let fhfperc = 0
    let alpha = -AI.INFINITY
    let beta = AI.INFINITY
    
    AI.killers = [
      (new Array(128)).fill([null,null]), //white
      (new Array(128)).fill([null,null]), //black
    ]
    
    AI.fh = AI.fhf = 0.001
    
    let f =  AI.PVS(board, alpha, beta, 1, 1) //for MTD(f)

    //Iterative Deepening
    for (let depth = 1; depth <= AI.totaldepth; depth+=1) {
      if (AI.stop && AI.iteration > AI.mindepth[AI.phase-1]) break

      if (!AI.stop) AI.lastscore = score

      AI.bestmove = [...AI.PV][1]
      AI.iteration++
      f = AI.lastscore
      
      score = (white? 1 : -1) * AI.MTDF(board, f, depth)

      AI.PV = AI.getPV(board, AI.totaldepth+1)

      if ([...AI.PV][1] && AI.bestmove && [...AI.PV][1].value !== AI.bestmove.value) {
        AI.changeinPV = true
      } else {
        AI.changeinPV = false
      }

      let strmove = AI.PV[1]? AI.PV[1].getString() : '----'
      
      
      fhfperc = Math.round(AI.fhf*100/AI.fh)

      // if (AI.PV) console.log(AI.iteration, depth, AI.PV.map(e=>{ return e && e.getString? e.getString() : '---'}).join(' '), '|Fhf ' + fhfperc + '%', 'Pawn hit ' + (AI.phnodes/AI.pnodes*100 | 0),  score, AI.nodes, AI.qsnodes)
      // console.log(fhfperc)
    }

    if (AI.TESTER) {
      console.info('___________________________________ AI.TESTER _____________________________________')
    } else {
      console.info('________________________________________________________________________________')
    }

    // console.log('BEST MOVE', AI.bestmove)

    
    /************* TD LEARNING ***************/
    let sigmoid = AI.getSigmoid(AI.lastscore)

    let alphaTD = 0.01
    
    if (board.movenumber && board.movenumber <= 1) {
      for (let i = 0; i < 5; i++) {
        AI.PIECE_VALUES[0][i] += (AI.weightAdjustmentsPieces[i].reduce((a,b)=>(a+b),0)*AI.PAWN | 0)
        AI.PIECE_VALUES[1][i] += (AI.weightAdjustmentsPieces[i].reduce((a,b)=>(a+b),0)*AI.PAWN | 0)
        AI.PIECE_VALUES[2][i] += (AI.weightAdjustmentsPieces[i].reduce((a,b)=>(a+b),0)*AI.PAWN | 0)
        AI.PIECE_VALUES[3][i] += (AI.weightAdjustmentsPieces[i].reduce((a,b)=>(a+b),0)*AI.PAWN | 0)
      }

      AI.P = [0.5]
      AI.sigmoidGradientsPieces = [[0],[0],[0],[0],[0],[0]]
      AI.weightAdjustmentsPieces = [[0],[0],[0],[0],[0],[0]]
      
      AI.sigmoidGradientsParameters = (new Array(10)).fill(0).map((e,i)=>{return [0]})
      AI.weightAdjustmentsParameters = (new Array(10)).fill(0).map((e,i)=>{return [0]})
      
      AI.i = 1


    }

    AI.P.push(sigmoid)

    let pieces = AI.getPieces(board, color, !color)
    let material = AI.getMaterial(pieces)

    // AI.PARAMETERS = [
    //   1, //PSQT weight
    //   1, //Mobility weight
    //   1, //King safety weight
    //   1, //Pawn structure weight
    // ]

    for (let i in AI.PARAMETERS) {
      let term = 1
      AI.sigmoidGradientsParameters[i].push(sigmoid*(1-sigmoid)*term)

      let sumS = 0

      //This function is arbitrary. The idea is to give more weight to recent moves than past moves
      let gammaweights = Array.from(Array(AI.sigmoidGradientsParameters[i].length).keys()).reverse().map(e=>{
        return 1-(e/AI.sigmoidGradientsParameters[i].length)
      })

      for (let j in AI.sigmoidGradientsParameters[i]) {
        sumS += gammaweights[j]*AI.sigmoidGradientsParameters[i][j]
      }
  
      AI.weightAdjustmentsParameters[i].push(
        alphaTD*(AI.P[AI.i] - AI.P[AI.i-1])*sumS
      )

      AI.PARAMETERS[i] += AI.weightAdjustmentsParameters[i].reduce((a,b)=>(a+b),0)
    }
    
    for (let i = 1; i <=4; i++) {
      let npieces = board.getPieceColorBitboard(i, color).popcnt() - board.getPieceColorBitboard(i, !color).popcnt()
      
      AI.sigmoidGradientsPieces[i].push(sigmoid*(1-sigmoid)*npieces)
  
      let sumS = 0

      //This function is arbitrary. The idea is to give more weight to recent moves than past moves
      let gammaweights = Array.from(Array(AI.sigmoidGradientsPieces[i].length).keys()).reverse().map(e=>{
        return 1-(e/AI.sigmoidGradientsPieces[i].length)
      })

      // console.log(gammaweights)

      for (let j in AI.sigmoidGradientsPieces[i]) {
        sumS += gammaweights[j]*AI.sigmoidGradientsPieces[i][j]
      }
  
      AI.weightAdjustmentsPieces[i].push(
        alphaTD*(AI.P[AI.i] - AI.P[AI.i-1])*sumS
      )
      
    }


    // console.log(AI.weightAdjustmentsPieces[i].length,AI.sigmoidGradientsPieces[i].length,AI.P.length)
    console.table(AI.PIECE_VALUES)

    /************* END OF TD LEARNING */


    AI.i++

    AI.lastmove = AI.bestmove

    //zugzwang prevention
    if (!AI.bestmove) {
      let moves = board.getMoves()

      AI.bestmove = moves[moves.length*Math.random()|0]
    }

    resolve({n: board.movenumber, phase: AI.phase, depth: AI.iteration-1, from: AI.bestmove.getFrom(), to: AI.bestmove.getTo(), movestring: AI.bestmove.getString(),
            score: AI.lastscore | 0, sigmoid: (sigmoid * 100 | 0)/100, nodes: AI.nodes, qsnodes: AI.qsnodes,
            FHF: fhfperc+'%'})
  })
}

AI.getSigmoid = function (score) {
  // return 1 / (1 + 10**(-score/(4*AI.PAWN)))

  //https://cse.buffalo.edu/~regan/papers/pdf/RBZ14aaai.pdf
  return 0.9837 / (1 + 1.03457*Math.exp(-score/AI.PAWN))
}

AI.P = [0.5]
AI.sigmoidGradientsPieces = [0]

AI.createTables()

module.exports = AI
