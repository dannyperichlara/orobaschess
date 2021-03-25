"use strict"

const { mapValues } = require('lodash')
/* Imports Move Generator */
const Chess = require('../chess/chess.js')
const Zobrist = require('../chess/zobrist.js')

// Math.seedrandom((new Date()).toTimeString())

let AI = {
  totaldepth: 30,
  ttNodes: 0,
  iteration: 0,
  qsnodes: 0,
  nodes: 0,
  pnodes: 0,
  phnodes: 0,
  status: null,
  fhf: 0,
  fh: 0,
  random: 5,
  phase: 1,
  htlength: 1 << 24,
  pawntlength: 1e6,
  reduceHistoryFactor: 1, //1, actúa sólo en la actual búsqueda --> mejor ordenamiento, sube fhf
  mindepth: 2,
  secondspermove: 3,
  lastmove: null
}

// PIECE VALUES
// https://www.chessprogramming.org/Point_Value_by_Regression_Analysis
AI.PAWN = 271

AI.PIECE_VALUES = [
  [0,465,888,1272,1621,1939,2228,2491,2729],
  [0,780,1560,2341,3121,3902,4682,5463,6243],
  [0,934,1969,2804,3739,4674,5609,6544,7479],
  [0,1600,2900,3902,5203,6504,7804,9105,10406],
  [0,2918,5837,8756,11674,14593,17512,20430,23349],
  [20000, 20000],
]

// OTHER VALUES

AI.FUTILITY_MARGIN = 2 * AI.PIECE_VALUES[0][1]
AI.BISHOP_PAIR = 0
AI.MATE = AI.PIECE_VALUES[5][1]
AI.DRAW = 0//-AI.PIECE_VALUES[1][1]
AI.INFINITY = AI.PIECE_VALUES[5][1]*4

//PSQT VALUES
AI.PSQT_VALUES = [-3,-2,-1, 0, 1, 2, 3]
AI.PSQT_SCALAR = [5, 10, 10, 10, 10, 20]

AI.KDISTANCE = [0,160,80,40, 20, 0,-10, -30, -60]

let wm  = AI.PSQT_VALUES[0] // Worst move
let vbm = AI.PSQT_VALUES[1] // Very bad move
let bm  = AI.PSQT_VALUES[2] // Bad move
let nm  = AI.PSQT_VALUES[3] // Neutral move
let GM  = AI.PSQT_VALUES[4] // Good move
let VGM = AI.PSQT_VALUES[5] // Very good move
let BM  = AI.PSQT_VALUES[6] // Best move

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
      AI.LMR_TABLE[depth][moves] = 0.75 + Math.log(depth) * Math.log(moves) / 2.25 | 0

      //Stockfish
      // AI.LMR_TABLE[depth][moves] = Math.log(depth) * Math.log(moves) / 1.95 | 0

      //http://talkchess.com/forum3/viewtopic.php?t=65273 (Evert)
      // AI.LMR_TABLE[depth][moves] = Math.log(depth*(moves**2)) | 0
  }
}
//General idea from Stockfish. Not fully tested.
AI.MOBILITY_VALUES = [
  [
    [],
    [-8,-4,-2,-1,0,1,2,3,4].map(e=>e*4),
    [-6,-2,0,1,2,3,4,5,6,7,8,9,10,11].map(e=>e*8),
    [0,0,0,0,2,3,4,5,6,7,8,9,10,11,12].map(e=>e*3),
    [0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(e=>e*2),
    []
  ],
  [
    [],
    [-8,-4,-2,-1,0,1,2,3,4].map(e=>e*16),
    [-6,-2,0,1,2,3,4,5,6,7,8,9,10,11].map(e=>e*16),
    [-8,-4,0,1,2,3,4,5,6,7,8,9,10,11,12].map(e=>e*16),
    [-6,-4,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(e=>e*5),
    []
  ],
  [
    [],
    [-8,-4,-2,-1,0,1,2,3,4].map(e=>e*12),
    [-6,-2,0,1,2,3,4,5,6,7,8,9,10,11].map(e=>e*20),
    [-6,-2,0,1,2,3,4,5,6,7,8,9,10,11,12].map(e=>e*24),
    [-6,-4,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(e=>e*5),
    []
  ],
  [
    [],
    [-8,-4,-2,-1,0,0,0,0,0].map(e=>e*16),
    [-6,-2,0,0,0,0,0,0,0,0,0,0,0,0].map(e=>e*26),
    [-6,-2,0,0,0,0,0,0,0,0,0,0,0,0,0].map(e=>e*20),
    [-6,-4,-2,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0].map(e=>e*10),
    []
  ]
]

//Not full tested(
AI.SAFETY_VALUES = [-2, -1,  0, 1, 2,-1,-2,-3].map(e=>20*e)

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

AI.DOUBLED_VALUES = [0,-200,-400,-600,-800,-1000,-1200,-1400,-1600]

//Not fully tested
AI.STRUCTURE_VALUES = [0,1,2,2,3,1,-1,-2].map(e=>20*e)

//Not fully tested
AI.PAWN_IMBALANCE = [-160,-160,-160,-160,-160,-150,-140,-100,0,100,140,150,160,160,160,160,160]

//https://open-chess.org/viewtopic.php?t=3058
AI.MVVLVASCORES = [
  [6002,20225,20250,20400,20800,26900],
  [4775,6004,20025,20175,20575,26675],
  [4750,4975,6006,20150,20550,26650],
  [4600,4825,4850,6008,20400,26500],
  [4200,4425,4450,4600,6010,26100],
  [3100,3325,3350,3500,3900,26000],
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

  AI.hashtable = new Array(AI.htlength) //positions
  AI.pawntable = [new Array(AI.pawntlength), new Array(AI.pawntlength)] //positions
}

//Randomize Piece Square Tables
AI.randomizePSQT = function () {
  Math.seedrandom((new Date()).getTime().toString())
  
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

AI.evaluate = function(board, ply) {
  let turn = board.getTurnColor()
  let notturn =  ~turn & 1
  let hashkey = board.hashKey.getHashKey()

  let white = (turn === 0)

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

  let colorMaterial = AI.getMaterialValue(P,N,B,R,Q)
  let notcolorMaterial = AI.getMaterialValue(Px,Nx,Bx,Rx,Qx)
  let material = colorMaterial - notcolorMaterial

  let pawnimbalance = 0// AI.PAWN_IMBALANCE[P.popcnt() - Px.popcnt() + 8]

  let psqt = 0
  let mobility = 0
  let structure = 0
  let safety = 0
  let passers = 0
  let threat = 0
  
  psqt = AI.getPSQT(P,N,B,R,Q,K, turn) - AI.getPSQT(Px,Nx,Bx,Rx,Qx,Kx, notturn)
  
  threat = AI.getThreat(P,N,B,R,Q,Kx,turn) - AI.getThreat(Px,Nx,Bx,Rx,Qx,K,notturn)
  
  mobility  = AI.getMOB(P,N,B,R,Q,K,Px,board, turn) - AI.getMOB(Px,Nx,Bx,Rx,Qx,Kx,P,board, notturn)
  safety = AI.getKS(K, us, turn) - AI.getKS(Kx, usx, notturn)
  // passers = AI.getPassers(P, Px, white) - AI.getPassers(Px, P, !white)

  // console.log(passers)

  structure = AI.getStructure(turn, P, Px) - AI.getStructure(notturn, Px, P)
      
  let positional = psqt + mobility + structure + safety + passers

  let score = material + pawnimbalance + positional | 0

  // if (score > 0) score /= Math.sqrt(ply) //54.1 win (not fully tested)
  
  return score | 0
}

AI.getThreat = function (P,N,B,R,Q,Kx,turn) {
  let allpieces = [P.dup(),B.dup(),N.dup(),R.dup(),Q.dup()]

  let score = 0
  let kindex = Kx.extractLowestBitPosition()

  for (let i = 0; i <= 4; i++) {
      let pieces = allpieces[i].dup()

      while (!pieces.isEmpty()) {
          let index = pieces.extractLowestBitPosition()
          // white: 56^index // black: index
          // let tscore = AI.PIECE_SQUARE_TABLES[i][color ? index : (56 ^ index)]
          let distance = AI.distance(turn? index : (56 ^ index), kindex) 

          score += AI.KDISTANCE[distance]
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
      
      if (encounters > 1) {
        doubled++
        // console.log(doubled)
        score += AI.DOUBLED_VALUES[doubled]
      }
    }
  }

  return score
}

AI.getPassers = function (_P, _Px, white) {
  let P = _P.dup()
  let Px = _Px.dup()

  let pawns = P.dup()
  let passers = 0
  let pxmask = Px.or(Chess.Position.makePawnAttackMask(!white, Px))

  let score = 0

  while (!pawns.isEmpty()) {
    let index = pawns.extractLowestBitPosition()
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

AI.getKS = function (_K, us, turn) {
  let K = _K.dup()

  let mask = Chess.Position.makeKingDefenseMask(turn, K).and(us)
  let safety = AI.SAFETY_VALUES[mask.popcnt()]
  
  return safety
}

AI.getStructure = function (turn, P, Px) {
  let hashkey = (P.low ^ P.high) >>> 0

  let hashentry = AI.pawntable[turn][hashkey%AI.pawntlength]

  AI.pnodes++
  
  if (hashentry) {
    AI.phnodes++
    return hashentry
  }

  let white = turn === 0

  let structure = 0

  let passers = AI.getPassers(P, Px, white)
  let doubled = AI.getDoubled(P, white)

  structure = AI.getSTR(P, turn)

  structure += passers
  structure += doubled

  AI.pawntable[turn][hashkey%AI.pawntlength] = structure

  return structure
}


AI.getSTR = function(_P, color) {
  let P = _P.dup()

  let mask = Chess.Position.makePawnAttackMask(color, P).dup()
  let protectedpawns = mask.and(P).popcnt()
  // let parkingvalue

  // while (!P.isEmpty()) {
  //   let index = P.extractLowestBitPosition()
  //   // white: 56^index // black: index
  //   parkingvalue = AI.FISCHER_PARKING[color ? index : (56 ^ index)]
  // }

  return AI.STRUCTURE_VALUES[protectedpawns]// + parkingvalue
}

AI.getMOB = function(_P,_N,_B,_R,_Q,_K,_Px,board, color) {
  let P = _P.dup()
  let N = _N.dup()
  let B = _B.dup()
  let R = _R.dup()
  let Q = _Q.dup()
  let K = _K.dup()
  let Px = _Px.dup()
  let i = AI.phase - 1

  let us = board.getColorBitboard(color).dup()
  let them = board.getColorBitboard(!color).dup()
  let enemypawnattackmask = Chess.Position.makePawnAttackMask(!color, Px).dup()
  // let space = P.dup().or(Q).or(K).or(enemypawnattackmask)
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

AI.getMaterialValue = function(P,N,B,R,Q) {
    let value = 0

    value = AI.PIECE_VALUES[0][P.popcnt()] +
            AI.PIECE_VALUES[1][N.popcnt()] +
            AI.PIECE_VALUES[2][B.popcnt()] + 
            AI.PIECE_VALUES[3][R.popcnt()] + 
            AI.PIECE_VALUES[4][Q.popcnt()]

    return value
}

AI.getPSQT = function(P,B,N,R,Q,K,color) {
  
  let allpieces = [P.dup(),B.dup(),N.dup(),R.dup(),Q.dup(),K.dup()]

  let value = 0

  for (let i = 0; i <= 5; i++) {
      let pieces = allpieces[i].dup()

      while (!pieces.isEmpty()) {
          let index = pieces.extractLowestBitPosition()
          // white: 56^index // black: index
          let sqvalue = AI.PIECE_SQUARE_TABLES[i][color ? index : (56 ^ index)]

          value += sqvalue
      }
  }

  return value
}

AI.sortMoves = function(moves, turn, ply, board, ttEntry) {

  for (let i = 0, len = moves.length; i < len; i++) {
    let move = moves[i]
    let piece = move.getPiece()
    let to = move.getTo()
    let kind = move.getKind()
    let lastmove = board.getLastMove()

    move.mvvlva = 0
    move.hvalue = 0
    move.bvalue = 0
    move.psqtvalue = 0
    move.promotion = 0

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
    
    
    if (kind & 8) {
      move.promotion = kind
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
    score += 1e8
  }
  
  if (move.capture || move.promotion) {
    let recapturebonus = (move.recapture|0) * 5e5
    // console.log(recapturebonus)
    if (move.mvvlva>=6000) { //Good Captures
      score += 1e7 + move.mvvlva + move.psqtvalue + recapturebonus
    } else {
      score += -1e6 + move.mvvlva + move.psqtvalue + recapturebonus //Bad Captures
    }
  }
    
  if (move.hvalue) { //History Heuristic
    score += move.hvalue
  } 

  score += move.psqtvalue

  return score
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
  let bestscore = -Infinity
  let incheck = board.isKingInCheck()
  let hashkey = board.hashKey.getHashKey()

  if (!incheck) {
    // we can return the stand pat score (fail-soft) or beta (fail-hard) as a lower bound
    // if (standpat >= beta ) return beta
    if (standpat >= beta ) return standpat
    
    /* delta pruning */ //Not fully tested
    if (standpat + AI.PIECE_VALUES[4][1] < alpha) {
      // console.log(ply)
      return alpha
    }
  
    if ( standpat > alpha) alpha = standpat
  }

  let moves
  
  if (incheck && depth >= -3) {
    moves = board.getMoves(false, false)
  } else {
    moves = board.getMoves(false, true)
  }

  
  moves = AI.sortMoves(moves, turn, ply, board, null)
  
  let bestmove = moves[0]

  for (let i=0, len=moves.length; i < len; i++) {

    let move = moves[i]

    //Bad captures pruning TESTED OK +82 ELO 174 games (-4)
    if (depth < -4 && move.mvvlva < 6000) {
      continue
    }

    if (board.makeMove(move)) {
      legal++

      let score = -AI.quiescenceSearch(board, -beta, -alpha, depth-1, ply+1, pvNode)

      board.unmakeMove()

      if( score >= beta ) {
        // AI.saveHistory(turn, move, 2)
        return score
        // return beta
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

  if (board.isKingInCheck() && legal === 0) {
      AI.ttSave(hashkey, -AI.MATE + ply, 0, Infinity, bestmove)
      return -AI.MATE + ply;
  }

  if (bestmove) AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
  return alpha
}

AI.ttSave = function (hashkey, score, flag, depth, move) {
  if (!move) return

  AI.hashtable[hashkey % AI.htlength] = {
    hashkey,
    score,
    flag,
    depth,
    move
  }
}

AI.ttGet = function (hashkey) {
  let ttEntry = AI.hashtable[hashkey % AI.htlength] 

  if (ttEntry && hashkey === ttEntry.hashkey) {
    return ttEntry
  } else {
    return null
  }
}

AI.reduceHistory = function () {
  for (let color = 0; color < 2; color++) {
    for (let piece = 0; piece < 6; piece++) {      
      for (let to = 0; to < 64; to++) {
        AI.history[color][piece][to] = ((1 - AI.reduceHistoryFactor) * AI.history[color][piece][to]) | 0
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

AI.PVS = function(board, alpha, beta, depth, ply) {
  let pvNode = beta - alpha > 1 //https://www.chessprogramming.org/Node_Types

  AI.nodes++


  if ((new Date()).getTime() > AI.timer + 1000 * AI.secondspermove) {
    if (AI.iteration > AI.mindepth && !pvNode) {
      AI.stop = true
    }
  }

  let turn = board.getTurnColor()
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

  if (AI.stop && AI.iteration > AI.mindepth) return alpha
  
  //Hash table lookup
  if (ttEntry && ttEntry.depth > depth) {
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
  if (!ttEntry && depth > 2) {
    AI.PVS(board, alpha, beta, depth - 2, ply) //depth - 2 tested ok + 31 ELO
    ttEntry = AI.ttGet(hashkey)
  }
    
  
  let moves = board.getMoves(false, false)

  moves = AI.sortMoves(moves, turn, ply, board, ttEntry)
  
  let bestmove = moves[0]
  let legal = 0
  let bestscore = -Infinity
  let score
  let staticeval = AI.evaluate(board, ply)

  let incheck = board.isKingInCheck()

  //Razoring (idea from Strelka)
  if (alpha === beta - 1 && !incheck) {
    let value = staticeval + AI.PAWN;
    if (value < beta) {
      if (depth === 1) {
        let new_value = AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
        // console.log('razoring1')
        return Math.max(new_value, value);
      }
      value += 2*AI.PAWN;
      if (value < beta && depth <= 3) {
        let new_value = AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
        if (new_value < beta)
          // console.log('razoring2')
          return Math.max(new_value, value);
      }
    }
  }



  // if (incheck) {
  //   let lastmove = board.getLastMove()

  //   if (lastmove) {
  //     if (AI.phase < 4) {
  //       AI.saveHistory(notturn, lastmove, 2**depth) //check moves up in move ordering
  //     } else {
  //       // AI.saveHistory(notturn, lastmove, -(2**depth)) //check down up in move ordering (phase 4)
  //     }
  //   }
  // }
  
  //Reverse Futility pruning
  let reverseval = staticeval - AI.PIECE_VALUES[1][1] * depth

  if (!incheck && depth <= 3 && reverseval > beta) {
    // AI.ttSave(hashkey, reverseval, -1, depth, moves[0])
    // return beta
    return reverseval
  }

  // console.log(depth)
  
  let doFHR = staticeval - 200 * incheck > beta && alpha === beta - 1 && depth > 6
  let noncaptures = 0
  
  for (let i=0, len=moves.length; i < len; i++) {
    let move = moves[i]
    let piece = move.getPiece()

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
    //   // console.log('Absurd maneuver pruning')
    //   continue
    // }

    let near2mate = alpha > 2*AI.PIECE_VALUES[4][1] || beta < -2*AI.PIECE_VALUES[4][1]

    
    let R = 0
    let E = 0

    /*futility pruning */
    if (!near2mate && !incheck && 1 < depth && depth <= 3+R && legal >= 1) {
      if (staticeval + AI.FUTILITY_MARGIN*depth <= alpha)  continue
    }

    let isCapture = !!move.capture

    let isPositional = move.getKind() < 4 && !incheck

    if (isPositional && AI.phase < 4 && piece > 0 && piece < 5) noncaptures++

    // Bad-Captures-Pruning (BCP)
    if (AI.phase < 4 && isCapture && depth > 8 && move.mvvlva < 6000 && legal > 4) {
      continue
    }

    // Late-Moves-Pruning (LMP)
    if (AI.phase < 4 && depth > 6 && isPositional && noncaptures > 4) {
      continue
    }

    // if (board.movenumber == 1 && i > 0) continue // CHEQUEA ORDEN PSQT

    //Reductions (LMR)
    if (!incheck) {
      R += AI.LMR_TABLE[depth][i+1]
      
      if (AI.phase === 4) R = R/2 | 0
    }
    
    if (doFHR) R+=4
            
    if (board.makeMove(move)) {
      legal++

      // console.log(turn, piece)

      AI.absurd[turn][piece]++

      // console.log(AI.absurd)

      //Late-Moves-Pruning (LMP)
      let lmplimit = 800*depth**(-1.8) | 0
      if (!isCapture && legal > lmplimit) {
        board.unmakeMove()
        AI.absurd[turn][piece]--
        continue
      }

      //Extensions
      if ((incheck || (move.mvvlva && move.mvvlva > 20000)) && depth < 3 && pvNode) {
        E = 1
      }

      if (legal === 1) {
        //Always search the first move at full depth
        score = -AI.PVS(board, -beta, -alpha, depth+E-R-1, ply+1)
      } else {

        //Next moves are searched with reductions
        score = -AI.PVS(board, -alpha-1, -alpha, depth+E-R-1, ply+1)

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

      if (score > alpha) {
        if (score >= beta) {
          if (legal === 1) {
            AI.fhf++
          }

          AI.fh++
          
          
          //LOWERBOUND
          AI.ttSave(hashkey, score, -1, depth, move)
          AI.saveHistory(turn, move, 2**depth)

          return score
        } else {
          AI.saveHistory(turn, move, -(2**depth))
        }

        alpha = score
      } else {
        // AI.saveHistory(turn, move, -(2**depth))
        AI.ttSave(hashkey, score, 1, depth, move) //TESTED AT HIGH DEPTH
      }

      if (score > bestscore) {
        bestscore = score
        bestmove  = move
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
      
      AI.ttSave(hashkey, -AI.MATE + ply, 0, Infinity, bestmove)
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
        AI.saveHistory(turn, bestmove, 2**depth)
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
  console.log('CREATE PSQT')

  AI.PIECE_SQUARE_TABLES_PHASE1 = [
  // Pawn
      [ 
       0,  0,  0,  0,  0,   0,  0,  0,
      nm, nm, nm, nm, nm, vbm,vbm,vbm, 
      nm, nm, nm, nm, nm, vbm,vbm,vbm,
      nm, nm, nm, nm, nm, vbm,vbm,vbm,
      nm, nm, GM, BM, BM,  wm, wm, wm,
      nm,VGM, GM, nm, GM, vbm, nm, nm,
     VGM, GM,vbm,vbm,vbm, VGM,VGM,VGM,
       0,  0,  0,  0,  0,   0,  0,  0,
      ].map(e=>e*AI.PSQT_SCALAR[0]*2),

      // Knight
      [ 
     vbm, bm, bm, bm, bm, bm, bm, vbm,
     vbm, bm, bm, bm, bm, bm, bm, vbm,
     vbm, bm, nm, nm, nm, nm, bm, vbm,
     vbm, bm, nm, nm, nm, nm, bm, vbm,
     vbm, bm, nm, nm, nm, nm, bm, vbm,
      wm, bm, BM, nm, nm, BM, bm,  wm,
     vbm, bm, bm, bm, bm, bm, bm, vbm,
     vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
      
      ].map(e=>e*AI.PSQT_SCALAR[1]),
      // Bishop
    [ 
      vbm, bm, bm, bm, bm, bm, bm, vbm,
      vbm, bm, bm, bm, bm, bm, bm, vbm,
      vbm, bm, nm, nm, nm, nm, bm, vbm,
      vbm, nm, nm, nm, nm, nm, nm, vbm,
      vbm, bm, BM, nm, nm, BM, bm, vbm,
       wm, bm, nm, nm, nm, nm, bm,  wm,
      vbm, BM, bm, GM, GM, bm, BM, vbm,
      vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
    ].map(e=>e*AI.PSQT_SCALAR[2]),
    // Rook
    [ 
      nm, nm, nm, nm, nm, nm, nm, nm,
      GM, GM, GM, BM, BM, GM, GM, GM,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, GM, GM, nm, nm, nm,
    ].map(e=>e*AI.PSQT_SCALAR[3]),
    
    // Queen
    [ 
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      nm, nm, nm, nm, nm, nm, nm, nm,
      wm,vbm,vbm, nm, nm,vbm,vbm, wm,
    ].map(e=>e*AI.PSQT_SCALAR[4]),

    // King
    [ 
      vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
      vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
      vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
      vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
      vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm, 
      vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
       bm, bm, bm,vbm,vbm,vbm, nm, nm,
       bm, bm, GM, wm, bm,vbm, BM,nm

    ].map(e=>e*AI.PSQT_SCALAR[5])
  ]

  AI.PIECE_SQUARE_TABLES_PHASE2 = [
    // Pawn
        [ 
         0,  0,  0,  0,  0,   0,  0,  0,
       VGM,VGM,VGM,VGM,VGM,VGM,VGM,vbm, 
       VGM,VGM,VGM,VGM,VGM,VGM,VGM,vbm,
        nm, GM, GM, GM, GM, GM,vbm,vbm,
        nm, nm, GM, GM, GM,vbm,vbm,vbm,
        GM,VGM, GM, nm, GM,vbm, nm, nm,
       VGM, GM,vbm,vbm,vbm,VGM,VGM,VGM,
         0,  0,  0,  0,  0,  0,  0,  0,
        ].map(e=>e*AI.PSQT_SCALAR[0]),
  
        // Knight
        [ 
       vbm, bm, bm, bm, bm, bm, bm, vbm,
       vbm, bm, bm, bm, bm, bm, bm, vbm,
       vbm, bm,VGM,VGM,VGM,VGM, bm, vbm,
       vbm, bm,VGM,VGM,VGM,VGM, bm, vbm,
       vbm, bm, GM, GM, GM, GM, bm, vbm,
       vbm, bm, nm, nm, nm, nm, bm, vbm,
       vbm, bm, bm, bm, bm, bm, bm, vbm,
       vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
        
        ].map(e=>e*AI.PSQT_SCALAR[1]),
        // Bishop
      [ 
        vbm, bm, bm, bm, bm, bm, bm, vbm,
        vbm, bm, bm, bm, bm, bm, bm, vbm,
        vbm, bm, nm, nm, nm, nm, bm, vbm,
        vbm, GM, GM, GM, GM, GM, GM, vbm,
        vbm, GM, GM, GM, GM, GM, GM, vbm,
        vbm, GM, GM, nm, nm, GM, GM, vbm,
        vbm, GM, bm, bm, bm, bm, GM, vbm,
        vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
      ].map(e=>e*AI.PSQT_SCALAR[2]),
      // Rook
      [ 
        nm, nm, nm, nm, nm, nm, nm, nm,
       VGM,VGM,VGM,VGM,VGM,VGM,VGM,VGM,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
      ].map(e=>e*AI.PSQT_SCALAR[3]),
      
      // Queen
      [ 
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        bm, bm, bm, bm, bm, bm, bm, bm,
       vbm,vbm,vbm, bm, bm,vbm,vbm,vbm,
      ].map(e=>e*AI.PSQT_SCALAR[4]),
  
      // King
      [ 
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm, 
        vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
         bm, bm, bm,vbm,vbm,vbm, nm, nm,
         bm, bm, nm,vbm, bm,vbm,VGM, nm
  
      ].map(e=>e*AI.PSQT_SCALAR[5])
    ]

  AI.PIECE_SQUARE_TABLES_PHASE3 = [
    // Pawn
        [ 
         0,  0,  0,  0,  0,   0,  0,  0,
        nm, nm, nm, nm, nm, nm, nm, nm, 
        nm, nm, nm, nm, nm, nm, nm, nm, 
       VGM,VGM,VGM,VGM,VGM,VGM,VGM,VGM, 
        nm, nm, nm, nm, nm, nm, nm, nm, 
        nm, nm, nm, nm, nm, nm, nm, nm, 
        nm, nm, nm, nm, nm, nm, nm, nm, 
         0,  0,  0,  0,  0,   0,  0,  0,
        ].map(e=>e*AI.PSQT_SCALAR[0]),
  
        // Knight
        [ 
       vbm, bm, bm, bm, bm, bm, bm, vbm,
       vbm, nm, nm, nm, nm, nm, nm, vbm,
       vbm, nm, nm, nm, nm, nm, nm, vbm,
       vbm, nm, nm, nm, nm, nm, nm, vbm,
       vbm, nm, nm, nm, nm, nm, nm, vbm,
       vbm, nm, nm, nm, nm, nm, nm, vbm,
       vbm, nm, nm, nm, nm, nm, nm, vbm,
       vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
        
        ].map(e=>e*AI.PSQT_SCALAR[1]),
        // Bishop
        [ 
          vbm, bm, bm, bm, bm, bm, bm, vbm,
           bm, nm, nm, nm, nm, nm, nm,  bm,
           nm, nm, nm, nm, nm, nm, nm,  nm,
           nm, nm, nm, nm, nm, nm, nm,  nm,
           nm, nm, nm, nm, nm, nm, nm,  nm,
           nm, nm, nm, nm, nm, nm, nm,  nm,
           bm, nm, nm, nm, nm, nm, nm,  bm,
          vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
           
           ].map(e=>e*AI.PSQT_SCALAR[2]),
      // Rook
      [ 
       VGM,VGM,VGM,VGM,VGM,VGM,VGM,VGM,
        GM, GM, GM, GM, GM, GM, GM, GM,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
      ].map(e=>e*AI.PSQT_SCALAR[3]),
      
      // Queen
      [ 
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
        nm, nm, nm, nm, nm, nm, nm, nm,
      ].map(e=>e*AI.PSQT_SCALAR[4]),
  
      // King
      [ 
        bm, bm, bm, bm, bm, bm, bm, bm,
        bm, nm, nm, nm, nm, nm, nm, bm,
        bm, nm, nm, nm, nm, nm, nm, bm,
        bm, nm, nm, nm, nm, nm, nm, bm,
        bm, nm, nm, nm, nm, nm, nm, bm,
        bm, nm, nm, nm, nm, nm, nm, bm,
        bm, nm, nm, nm, nm, nm, nm, bm,
        bm, bm, bm, bm, bm, bm, bm, bm,
      ].map(e=>e*AI.PSQT_SCALAR[5])
    ]

    AI.PIECE_SQUARE_TABLES_PHASE4 = [
      // Pawn
          [ 
           0,  0,  0,  0,  0,   0,  0,  0,
         VGM,VGM,VGM,VGM,VGM,VGM,VGM,VGM,
          GM, GM, GM, GM, GM, GM, GM, GM,
          nm, nm, nm, nm, nm, nm, nm, nm,
          bm, bm, bm, bm, bm, bm, bm, bm,
         vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
         vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
          0,  0,  0,  0,  0,   0,  0,  0,
        ].map(e=>e*AI.PSQT_SCALAR[0]),
        
        // Knight
        [ 
          bm, bm, nm, nm, nm, nm, bm, bm,
          bm, nm, nm, nm, nm, nm, nm, bm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          bm, nm, nm, nm, nm, nm, nm, bm,
          bm, bm, nm, nm, nm, nm, bm, bm,
      
        ].map(e=>e*AI.PSQT_SCALAR[1]),
        // Bishop
        [ 
          bm, bm, nm, nm, nm, nm, bm, bm,
          bm, nm, nm, nm, nm, nm, nm, bm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          bm, nm, nm, nm, nm, nm, nm, bm,
          bm, bm, nm, nm, nm, nm, bm, bm,
      
        ].map(e=>e*AI.PSQT_SCALAR[2]),
        // Rook
        [ 
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
        ].map(e=>e*AI.PSQT_SCALAR[3]),
        
        // Queen
        [ 
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
          nm, nm, nm, nm, nm, nm, nm, nm,
        ].map(e=>e*AI.PSQT_SCALAR[4]),
    
        // King
        [ 
         vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
         vbm, nm, bm, bm, bm, bm, nm,vbm,
         vbm, bm, nm, GM, GM, nm, bm,vbm,
         vbm, bm, GM,VGM,VGM, GM, bm,vbm,
         vbm, bm, GM,VGM,VGM, GM, bm,vbm,
         vbm, bm, nm, GM, GM, nm, bm,vbm,
         vbm, nm, bm, bm, bm, bm, nm,vbm,
         vbm,vbm,vbm,vbm,vbm,vbm,vbm,vbm,
        ].map(e=>e*AI.PSQT_SCALAR[5])
      ]

    AI.preprocessor(board)
    
    if (AI.phase == 1) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE1]
    if (AI.phase == 2) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE2]
    if (AI.phase == 3) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE3]
    if (AI.phase == 4) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE4]
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
      let N = [...AI.PIECE_SQUARE_TABLES[p]]
      let sum = 4*N[i]
      let total = 4
      
      if (i%8!=0 && N[i-9]) {sum += N[i-9]; total++}
      if ((i+1)%8!=0 && N[i-7]) {sum += N[i-7]; total++}
      
      if (i%8!=0 && N[i+7]) {sum += N[i+7]; total++}
      if ((i+1)%8!=0 && N[i+9]) {sum += N[i+9]; total++}
      
      if (i%8!=0 && N[i-1]) {sum += N[i-1]; total++}
      if ((i+1)%8!=0 && N[i+1]) {sum += N[i+1]; total++}
      
      if (N[i-8]) {sum += N[i-8]; total++}
      if (N[i+8]) {sum += N[i+8]; total++}
    
      return 1.3*sum/total | 0
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

  
  let pawnmaskX = Chess.Position.makePawnAttackMask(!color, PX)//.not(PX)
  let pawnXmap = AI.bin2map(PX, color)

  let kingmap = AI.bin2map(K, color)
  let kingXmap = AI.bin2map(KX, color)

  let kingposition = kingmap.indexOf(1)

  let kingXposition = kingXmap.indexOf(1)

  //Castiga captura y maniobras con peón frontal del rey
  if (kingposition >= 61 || (kingposition>=56 && kingposition<=58)) {
    //Good
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 7] += VGM*20
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 8] += GM*20
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 9] += VGM*20

    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 7] += VGM*20
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 8] += GM*20
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 9] += VGM*20

    //Bad
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 15] += bm*20
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 17] += bm*20
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 23] += vbm  *20  
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 24] += vbm *20   
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 25] += vbm *20   

    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 15] += bm*20
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 17] += bm*20
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 23] += vbm *20   
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 24] += vbm *20   
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 25] += vbm *20   
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
  
  if (AI.phase === 4 && AI.lastscore >= AI.PIECE_VALUES[3][1]) {
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
}

AI.setphase = function (board) {
  AI.phase = 1 //OPENING
  let color = board.getTurnColor()

  if (AI.nofpieces <= 28 || (board.movenumber && board.movenumber > 9)) {
      AI.phase = 2 //MIDGAME
  }

  let queens = board.getPieceColorBitboard(4, color).popcnt() + board.getPieceColorBitboard(4, !color).popcnt()

  if (AI.nofpieces <= 20 && queens === 0) { // ¿Debería ser queens < 2? Hay que testearlo
    AI.phase = 3 //ENDGAME (the king enters)
  }

  if (AI.nofpieces <= 12) AI.phase = 4 //LATE ENGDAME
  
  AI.createPSQT(board)
  
  // AI.softenPSQT()

  AI.randomizePSQT()
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

  let upperBound =  Infinity
  let lowerBound = -Infinity

  //Esta línea permite que el algoritmo funcione como PVS normal
  return AI.PVS(board, lowerBound, upperBound, d, 1) 
  console.log('INICIO DE MTDF')
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

    
    // console.log('Pass ' + i)
  }

  return g
}

AI.search = function(board, options) {

  if (options && options.seconds) AI.secondspermove = options.seconds

  AI.nofpieces = board.getOccupiedBitboard().popcnt()

  let nmoves = board.madeMoves.length

  if (board.movenumber && board.movenumber === 1) {
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
    } else {
      AI.TESTER = false
    }
        
    AI.nodes = 0
    AI.qsnodes = 0
    AI.enodes = 0
    AI.ttnodes = 0
    AI.iteration = 0
    AI.timer = (new Date()).getTime()
    AI.stop = false
    AI.setphase(board)
    AI.PV = AI.getPV(board, AI.totaldepth+1)
    AI.changeinPV = true
    
    let score = 0
    let fhfperc = 0
    let alpha = -AI.INFINITY
    let beta = AI.INFINITY
    let f =  AI.PVS(board, alpha, beta, 1, 1) //for MTD(f)

    //Iterative Deepening
    for (let depth = 1; depth <= AI.totaldepth; depth+=1) {
      if (AI.stop && AI.iteration > AI.mindepth) break

      if (!AI.stop) AI.lastscore = score

      AI.bestmove = [...AI.PV][1]
      AI.iteration++
      AI.fh = AI.fhf = 0.001
      f = AI.lastscore
      
      score = (white? 1 : -1) * AI.MTDF(board, f, depth)

      AI.PV = AI.getPV(board, AI.totaldepth+1)

      if ([...AI.PV][1] && AI.bestmove && [...AI.PV][1].value !== AI.bestmove.value) {
        // console.log('CAMBIO!!!!!!!!!!!')
        AI.changeinPV = true
      } else {
        AI.changeinPV = false
      }

      let strmove = AI.PV[1]? AI.PV[1].getString() : '----'
      
      
      fhfperc = Math.round(AI.fhf*100/AI.fh)

      if (AI.PV) console.log(AI.iteration, depth, AI.PV.map(e=>{ return e && e.getString? e.getString() : '---'}).join(' '), '|Fhf ' + fhfperc + '%', 'Pawn hit ' + (AI.phnodes/AI.pnodes*100 | 0),  score)
    }

    if (AI.TESTER) {
      console.info('___________________________________ AI.TESTER _____________________________________')
    } else {
      console.info('________________________________________________________________________________')
    }

    console.log('BEST MOVE', AI.bestmove)

    let sigmoid = 1/(1+Math.pow(10, -AI.lastscore/400))

    AI.lastmove = AI.bestmove

    resolve({n: board.movenumber, phase: AI.phase, depth: AI.iteration-1, from: AI.bestmove.getFrom(), to: AI.bestmove.getTo(), movestring: AI.bestmove.getString(),
            score: AI.lastscore | 0, sigmoid: (sigmoid * 100 | 0)/100, nodes: AI.nodes, qsnodes: AI.qsnodes,
            FHF: fhfperc+'%', pieces: board.pieces})
  })
}

AI.createTables()

module.exports = AI
