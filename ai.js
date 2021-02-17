"use strict"

const { assignIn } = require('lodash')
let Chess = require('./chess.js')
const { Position } = require('./zobrist.js')
    Chess.Bitboard = require('./bitboard.js')
    Chess.Zobrist = require('./zobrist.js')
    Chess.Move = require('./move.js')
    Chess.Position = require('./position.js')

let TESTER, nodes, qsnodes, enodes, ttnodes, iteration, status, fhf, fh
let totaldepth = 20


// Math.seedrandom((new Date()).toTimeString())
let random = 50

let phase = 1
let htlength = 1 << 26
let reduceHistoryFactor = 1 //1, actúa sólo en la actual búsqueda --> mejor ordenamiento, sube fhf
let mindepth =  2
let secondspermove = 0.5

let AI = function() {

}

let pawnstructures = [[
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,1,0,1,0,0,0,
0,0,0,0,0,0,0,0,
0,0,0,1,0,0,0,0,
0,0,0,0,0,0,0,0,
1,1,1,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,1,0,1,0,0,0,
0,0,0,0,0,0,0,0,
0,0,0,1,0,0,0,0,
0,0,0,0,1,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,1,1,0,0,0,
0,0,0,0,0,0,0,0,
0,0,0,0,1,0,0,0,
0,0,0,0,0,0,0,0,
1,1,1,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,1,1,0,1,
0,0,0,1,0,0,1,0,
0,0,0,0,0,0,0,0,
0,0,0,0,1,0,0,0,
0,0,0,0,0,0,0,0,
1,1,1,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,1,0,0,0,0,
0,0,0,0,1,0,0,0,
0,0,0,0,1,0,0,0,
0,0,0,0,0,0,0,0,
1,1,1,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,1,1,1,1,1,
0,0,0,1,1,0,0,0,
0,0,0,0,0,0,0,0,
0,0,1,0,1,0,0,0,
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
0,0,0,0,0,1,1,1,
1,1,0,1,1,0,0,0,
0,0,0,0,0,0,0,0,
0,0,1,0,1,0,0,0,
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,1,0,0,0,0,0,
0,0,0,0,1,0,0,0,
0,0,1,0,1,0,0,0,
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,1,1,0,0,0,0,
0,0,0,0,0,0,0,0,
0,0,1,0,1,0,0,0,
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,1,0,0,1,1,1,
0,0,0,1,0,0,0,0,
0,0,0,1,1,0,0,0,
0,0,0,0,1,0,0,0,
0,0,0,0,0,0,0,0,
1,1,1,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,1,0,0,0,0,
0,0,1,1,0,0,0,0,
0,0,0,0,1,0,0,0,
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,1,0,0,0,0,0,
0,0,0,1,0,0,0,0,
0,0,0,1,0,0,0,0,
0,0,0,0,1,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,1,0,0,0,1,1,
0,0,0,0,1,0,0,0,
0,0,0,1,0,1,0,0,
0,0,0,1,0,1,0,0,
0,0,0,0,1,0,0,0,
1,1,1,0,0,0,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,1,0,0,0,0,
0,0,1,0,1,0,0,0,
0,0,1,0,1,0,0,0,
0,0,0,1,0,0,0,0,
1,1,0,0,0,1,1,1,
0,0,0,0,0,0,0,0,
],
[
0,0,0,0,0,0,0,0,
1,1,0,0,1,1,1,1,
0,0,0,1,0,0,0,0,
0,0,1,0,0,0,0,0,
0,0,0,0,1,0,0,0,
0,0,0,1,0,0,0,0,
1,1,1,0,0,1,1,1,
0,0,0,0,0,0,0,0,
]]

AI.pawnstructure = (new Array(64)).fill(0)

for (let i in pawnstructures) {
  AI.pawnstructure = AI.pawnstructure.map((e,j)=>{
    return e + pawnstructures[i][j]
  })
}

AI.lastmove = null

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

//Carlsen, according to https://github.com/WinPooh/pgnlearn
// AI.MIDGAME_PIECE_VALUES = [141, 300, 342, 495, 1107, 20000]

//https://www.r-bloggers.com/2015/06/big-data-and-chess-what-are-the-predictive-point-values-of-chess-pieces/
// AI.MIDGAME_PIECE_VALUES = [140, 300, 330, 520, 850, 20000]

//128, 782, 830, 1289, and 2529 in the opening and 213, 865, 918, 1378, and 2687 in the endgame. (Stockfish)
AI.MIDGAME_PIECE_VALUES = [128, 782, 830,  1289, 2529, 20000]
AI.ENDGAME_PIECE_VALUES = [213, 865, 918,  1378, 2687, 20000]

AI.MOBILITY_VALUES = [
  [],
  [-75, -56,  -9,  -2,   6,  15,  22,  30,  36],
  [-48, -21,  16,  26,  37,  51,  54,  63,  65,  71,  79,  81,  92,  97],
  [-56, -25, -11,  -5,  -4,  -1,   8,  14,  21,  23,  31,  32,  43,  49,  59],
  [-40, -25,   2,   4,  14,  24,  25,  40,  43,  47,  54,  56,  60,  70,  72,  73,  75,  77,  85,  94,  99, 108, 112, 113, 118, 119, 123, 128],
  []
]

AI.MATE = AI.MIDGAME_PIECE_VALUES[5]

//Contempt factor of 1 knight
AI.DRAW = 0
// AI.DRAW = -AI.MIDGAME_PIECE_VALUES[1] //avoids draw
// AI.DRAW = +AI.MIDGAME_PIECE_VALUES[1] //prefers draw


AI.INFINITY = AI.MIDGAME_PIECE_VALUES[5]*4

AI.PIECE_SQUARE_TABLES = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0)
  ]

AI.ENEMY_PSQT = [
// Pawn
    [ 
    0,  0,  0,  0,  0,  0,  0,  0,
  200,200,200,200,200,200,200,200, 
  100,200,200,200,200,200,200,100, 
   80,100, 40, 20, 20, 80,100, 80, 
  -20, 30, 20, 10, 10, 20, 30,-20,
  -10,  0,  0,  0,  0,  0,  0,-10, 
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0
    ],

    // Knight
    [ 
  -100,-20,-20,-20,-20,-20,-20,-100,
  -100,  0,  0,  0,  0,  0,  0,-100,
  -100, 60, 80, 80, 80, 80, 60,-100,
  -100, 80, 80, 40, 40, 80, 80,-100,
  -100,  0, 40, 40, 40, 40,  0,-100,
  -100,  0, 20, 20, 20, 20,  0,-100,
  -100,  0,  0, 20, 20,  0,  0,-100,
  -100,-20,-20,-40,-40,-20,-20,-100,
    
    ],
    // Bishop
  [ 
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0, 40,  0,  0,  0,  0, 40,  0,
    0,  0, 40, 40, 40, 40,  0,  0,
    0,  0, 40, 40, 40, 40,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0, 80,  0, 20, 20,  0, 80,  0,
    0,  0,-20,  0,  0,-20,  0,  0,
  ],
  // Rook
  [ 
   80, 80, 80, 80, 80, 80, 80, 80,
   80, 80, 80, 80, 80, 80, 80, 80,
    0,  0,  0, 40, 40,  0,  0,  0,
    0,  0,  0, 40, 40,  0,  0,  0,
    0,  0,  0, 40, 40,  0,  0,  0,
  -80,  0,  0, 40, 40,  0,  0,  0,
  -40,  0,  0, 40, 40,  0,  0,  0,
 -100,-60,-20, 80, 80, 20,-80,-200,
  ],

  // Queen
  [ 
  200,200,200,200,200,200,200,200, 
  150,150,150,150,150,150,150,150, 
  120,120,120,120,120,120,120,120, 
  120,100, 80, 40, 40, 80,100,120,
   40, 30, 20, 10, 10, 20, 30, 40, 
    0,  0,  0,  0,  0,  0,  0,  0, 
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0
  ],

  // King
  [ 
    0,  0,  0,-200,-100,  0,  0,  0,
    0,  0,  0,-100,-100,  0,  0,  0,
    0,  0,  0, -80, -80,  0,  0,  0,
    0,  0,  0, -20, -20,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,

  ]
]

AI.createTables = function () {
  console.log('Creating tables.......................................................................')

  delete AI.history
  delete AI.butterfly
  delete AI.hashtable
  delete AI.evaltable

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

  AI.hashtable = new Array(htlength) //positions
  AI.evaltable = new Array(htlength) //evaluations
}

AI.createTables()

//Randomize
AI.randomizePSQT = function () {
  Math.seedrandom((new Date()).getTime().toString())

  if (phase === 1) {
    //Sólo de caballo a dama
    for (let i = 1; i < 5; i++) {
      AI.PIECE_SQUARE_TABLES[i] = AI.PIECE_SQUARE_TABLES[i].map(e=>{
        return e + Math.random() * random - random/2 | 0
      })
    }  
  }
}

AI.evaluate = function(chessPosition, hashkey, pvNode) {
  // if (hashkey) {
  //   let evalentry = AI.evaltable[hashkey % htlength]

  //   if (evalentry) {
  //     if (chessPosition.movenumber - evalentry.n < 5) {
  //       return evalentry.score
  //     }
  //   }
  // }

  let color = chessPosition.getTurnColor()

  let colorMaterial = AI.getMaterialValue(chessPosition, color)
  let notcolorMaterial = AI.getMaterialValue(chessPosition, !color)
  let material = colorMaterial.value - notcolorMaterial.value
  let psqt = 0
  let pawnsqt = 0
  let mobility = 0
  let badbishops = 0



  if (phase > 1 && iteration < 4) {
      mobility = AI.getMobility(chessPosition, color) - AI.getMobility(chessPosition, !color)
  }

  psqt = AI.getPieceSquareValue(chessPosition, color) - AI.getPieceSquareValue(chessPosition,  !color)
  //badbishops = AI.getBadBishops(chessPosition, color) - AI.getBadBishops(chessPosition,  !color)

  //pawnsqt = phase < 2? AI.getPawnSquareValue(chessPosition, color) - AI.getPawnSquareValue(chessPosition,  !color) : 0

  //https://www.r-bloggers.com/2015/06/big-data-and-chess-what-are-the-predictive-point-values-of-chess-pieces/
  //material += 60 * (colorMaterial.P - notcolorMaterial.P)

  let score = material + psqt + mobility// + (phase === 1? 120 : 80) * pawnsqt - 10 * badbishops

  // AI.evaltable[hashkey % htlength] = {score, n: chessPosition.movenumber}
  
  return score

}

AI.getBadBishops = function(chessPosition, color) {
  let pawns = chessPosition.getPieceColorBitboard(Chess.Piece.PAWN, color).dup()
  let enemypawns = chessPosition.getPieceColorBitboard(0, !color).dup()
  let bishops = chessPosition.getPieceColorBitboard(Chess.Piece.BISHOP, color).dup()
  let bishopmask = chessPosition.makeBishopAttackMask(bishops, 0).dup()

  return (bishops.or(bishopmask)).and(pawns.or(enemypawns)).dup().popcnt()
}


AI.getMobility = function(chessPosition, color) {
  let us = chessPosition.getColorBitboard(color).dup()
  let pawns = chessPosition.getPieceColorBitboard(Chess.Piece.PAWN, color).dup()
  let knights = chessPosition.getPieceColorBitboard(Chess.Piece.KNIGHT, color).dup()
  let bishops = chessPosition.getPieceColorBitboard(Chess.Piece.BISHOP, color).dup()
  let rooks = chessPosition.getPieceColorBitboard(Chess.Piece.ROOK, color).dup()
  let queens = chessPosition.getPieceColorBitboard(Chess.Piece.QUEEN, color).dup()
  
  let enemypawns = chessPosition.getPieceColorBitboard(0, !color).dup()
  let enemypawnattackmask = Chess.Position.makePawnAttackMask(!color, enemypawns).dup()

  let mobility = 0

  while (!knights.isEmpty()) {
      mobility += AI.MOBILITY_VALUES[1][Chess.Bitboard.KNIGHT_MOVEMENTS[knights.extractLowestBitPosition()].dup().and_not(enemypawnattackmask).and_not(pawns).popcnt()]
  }

  let space = enemypawnattackmask.or(enemypawns).or(pawns)

  mobility += AI.MOBILITY_VALUES[2][chessPosition.makeBishopAttackMask(bishops, space).dup().popcnt() / bishops.popcnt() | 0]
  mobility += AI.MOBILITY_VALUES[3][chessPosition.makeRookAttackMask(rooks, space).dup().popcnt() / rooks.popcnt() | 0]
  
  mobility += AI.MOBILITY_VALUES[4][(chessPosition.makeBishopAttackMask(queens, space).dup().popcnt() + chessPosition.makeRookAttackMask(queens, space).dup().popcnt()) / rooks.popcnt() | 0]

  return mobility
}

AI.getMaterialValue = function(chessPosition, color) {
    let value = 0

    let P = chessPosition.getPieceColorBitboard(0, color).dup().popcnt()
    let N = chessPosition.getPieceColorBitboard(1, color).dup().popcnt()
    let B = chessPosition.getPieceColorBitboard(2, color).dup().popcnt()
    let R = chessPosition.getPieceColorBitboard(3, color).dup().popcnt()
    let Q = chessPosition.getPieceColorBitboard(4, color).dup().popcnt()

    value = P*AI.PIECE_VALUES[0] + N*AI.PIECE_VALUES[1] + B*AI.PIECE_VALUES[2] + R*AI.PIECE_VALUES[3] + Q*AI.PIECE_VALUES[4]

    //Bishop pair: https://www.r-bloggers.com/2015/06/big-data-and-chess-what-are-the-predictive-point-values-of-chess-pieces/
    value += B > 1? 60 : 0
    //value += R > 1? -20 : 0

    return {value, P, N, B, R, Q}
}

AI.getPieceSquareValue = function(chessPosition, color) {
  
  let P = chessPosition.getPieceColorBitboard(0, color).dup()
  let pawnmask = Chess.Position.makePawnAttackMask(color, P)

  let value = 0

  for (let piece = 0; piece < 6; piece++) {
      let pieces = chessPosition.getPieceColorBitboard(piece, color).dup()

      while (!pieces.isEmpty()) {
          let index = pieces.extractLowestBitPosition()
          let sqvalue

          sqvalue = AI.PIECE_SQUARE_TABLES[piece][color ? index : (56 ^ index)]
          
          // if (color === AI.color) {
          //   sqvalue = AI.PIECE_SQUARE_TABLES[piece][color ? index : (56 ^ index)]
          // } else {
          //   if (phase === 1) {
          //     sqvalue = AI.PIECE_SQUARE_TABLES_APERTURE[piece][color ? index : (56 ^ index)]
          //   } else {
          //     sqvalue = AI.ENEMY_PSQT[piece][color ? index : (56 ^ index)]

          //   }
          // }

          value += sqvalue
      }
  }

  return value
}

AI.getPawnSquareValue = function(chessPosition, color) {
  let PSQT = AI.pawnstructure

  let value = 0

  let pawns = chessPosition.getPieceColorBitboard(0, color).dup()

  while (!pawns.isEmpty()) {
      let index = pawns.extractLowestBitPosition()

      if (color === 0 && index > 31) value += PSQT[index]

      if (color === 1 && index <= 31) value += PSQT[index]
  }
  

  return value
}

AI.scoreMove = function(move) {
  let score = 0

  // if (move.pv) { //Se evalúa mejor con tt --> baja fhf
  //   score += 1e9
  //   return score
  // } 
  
  if (move.tt) { 
    score += 1e8
    return score
  }
  
  if (move.capture) {
    if (move.mvvlva>=20000) { //testeado!! OK
      return 1e7 + move.mvvlva
    } else if (move.mvvlva >= 6000){
      return 1e5 + move.mvvlva
    } else {
      return -1e6 + move.mvvlva //Perfecto para fhf
    }
  }
    
  if (move.hvalue) { 
    score += 1e3 + move.hvalue
    
    return score
  } 

  return move.psqtvalue - 10000
  
}

// let mvvlvascores = [
//   [6002,20225,20250,20400,20800,26900],
//   [4775,6004,20025,20175,20575,26675],
//   [4750,4975,6006,20150,20550,26650],
//   [4600,4825,4850,6008,20400,26500],
//   [4200,4425,4450,4600,6010,26100],
//   [3100,3325,3350,3500,3900,26000],
//   [3100,3325,3350,3500,3900,26000],
// ]

let mvvlvascores = [
  [6002,20225,20250,20400,20800,26900],
  [4775,6004,20025,20175,20575,26675],
  [4750,4975,6006,20150,20550,26650],
  [4600,4825,4850,6008,20400,26500],
  [4200,4425,4450,4600,6010,26100],
  [3100,3325,3350,3500,3900,26000],
  [0,1,2,3,4,26000],
]

AI.sortMoves = function(moves, turn, ply, chessPosition, ttEntry, pvMoveValue) {

  for (let i = 0, len = moves.length; i < len; i++) {
    let move = moves[i]
    let piece = move.getPiece()
    let to = move.getTo()
    
    if (pvMoveValue === move.value) {
      move.pv = true
    }
    
    if (ttEntry && move.value === ttEntry.move.value) {
      move.tt = true
    }

    if (move.isCapture()) {

      move.mvvlva = mvvlvascores[piece][move.getCapturedPiece()]
      move.capture = true
    }
    
    let kind = move.getKind()
    
    if (kind > 2) {
      move.special = kind
    }

    let hvalue = AI.history[turn][piece][to]
    let bvalue = AI.butterfly[turn][move.getFrom()][to]

    if (hvalue) {
      move.hvalue = hvalue
      move.bvalue = bvalue
    }

    move.psqtvalue = AI.PIECE_SQUARE_TABLES[piece][to]

  }

  moves.sort((a, b) => {
      return AI.scoreMove(b, chessPosition) - AI.scoreMove(a, chessPosition)
  })

  // console.log(moves)

  return moves
}

AI.quiescenceSearch = function(chessPosition, alpha, beta, depth, ply, pvNode) {

    var matingValue = -AI.MATE + ply
  
    if (matingValue > alpha) {
       alpha = matingValue;
       if (beta <= matingValue)
         return matingValue;
    }

    let turn = chessPosition.getTurnColor()

    let legal = 0
    let standpat
    let bestmove
    let bestscore = -Infinity
    let incheck
    let hashkey = chessPosition.hashKey.getHashKey()

    qsnodes++

    standpat = AI.evaluate(chessPosition, hashkey, pvNode)

    if (standpat >= beta ) {
      return beta
    }

    if ( standpat > alpha) alpha = standpat;

    let moves

    moves = chessPosition.getMoves(false, !chessPosition.isKingInCheck())

    moves = AI.sortMoves(moves, turn, ply, chessPosition, null, null)

    for (let i=0, len=moves.length; i < len; i++) {

      let move = moves[i]
      
      /* delta pruning */
      if (standpat + AI.PIECE_VALUES[4] < alpha) {
        // console.log(ply)
        return alpha
      }

      if (chessPosition.makeMove(move)) {
        legal++

        let score = -AI.quiescenceSearch(chessPosition, -beta, -alpha, depth-1, ply+1, pvNode)

        chessPosition.unmakeMove()

        if( score >= beta ) {
          return beta
        }

        if( score > alpha ) {
          alpha = score

          bestscore = score
          bestmove = move
        }
      }
    }

    if (chessPosition.isKingInCheck() && legal === 0) {
       return -AI.MATE + ply;
    }

    if (bestmove) AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
    return alpha
}

AI.ttSave = function (hashkey, score, flag, depth, move) {
  AI.hashtable[hashkey % htlength] = {
    hashkey,
    score,
    flag,
    depth,
    move
  }
}

AI.ttGet = function (hashkey) {
  let ttEntry = AI.hashtable[hashkey % htlength] 

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
        AI.history[color][piece][to] = ((1 - reduceHistoryFactor) * AI.history[color][piece][to]) | 0
      }
    }
  }
}

AI.saveHistory = function(turn, move, value) {
  //according to The_Relative_History_Heuristic.pdf, no much difference if it's 1 or 1 << depth
  if (move.isCapture()) return

  let to = move.getTo()
  
  AI.history[turn][move.getPiece()][to] += value | 0
  AI.butterfly[turn][move.getFrom()][to] += value | 0
  
}

//History-ADS
// AI.saveHistory = function(turn, move, depth) {
//   let piece = AI.history[turn][move.getPiece()]
//   let max = Math.max(...piece)
//   // console.log(max)
//   piece[move.getTo()] = max + 1 | 0
  
// }

AI.PVS = function(chessPosition, alpha, beta, depth, ply) {
  let doTheTrick = false

  let pvNode = beta - alpha > 1

  if ((new Date()).getTime() > AI.timer + 1000 * secondspermove) {
    if (iteration > mindepth && !pvNode) {
      AI.stop = true
    }
  }

  let turn = chessPosition.getTurnColor()
  
  let matingValue

  matingValue = AI.MATE - ply

  if (matingValue < beta) {
      beta = matingValue
      if (alpha >= matingValue)
        return matingValue
  }
  
  matingValue = -AI.MATE + ply
  
  if (matingValue > alpha) {
      alpha = matingValue
      if (beta <= matingValue)
        return matingValue
  }

  let alphaOrig = alpha
  let hashkey = chessPosition.hashKey.getHashKey()
  let ttEntry = AI.ttGet(hashkey)

  if( depth <= 0 ) {
    return AI.quiescenceSearch(chessPosition, alpha, beta, depth, ply, pvNode)
  }

  //Hash table lookup
  if (ttEntry && ttEntry.depth >= depth) {
    //testear estrictamente mayor 
    ttnodes++
    
    if (ttEntry.flag === 0) {
      //No exact score because PSQTs change
      // return ttEntry.score
      alpha = ttEntry.score
    } else if (ttEntry.flag === -1) {
      if (ttEntry.score > alpha) alpha = ttEntry.score
    } else if (ttEntry.flag === 1) {
      if (ttEntry.score < beta) beta = ttEntry.score
    }

    if (alpha >= beta) {
      return alpha
    }
  }

  
  //IID (for ordering moves)
  if (!ttEntry && depth >= 4) {
    AI.PVS(chessPosition, alpha, beta, depth - 2, ply)
    ttEntry = AI.ttGet(hashkey)
  }
  
  let bestmove = {value: 2080,  getString() {return '-'}}

  let pvMoveValue = AI.PV[ply]? AI.PV[ply].value : null

  if (AI.stop && iteration > mindepth) return alpha

  let moves = chessPosition.getMoves(false, false)

  moves = AI.sortMoves(moves, turn, ply, chessPosition, ttEntry, pvMoveValue)

  let legal = 0
  let bestscore = -Infinity
  let score



  let incheck = chessPosition.isKingInCheck()
  
  let staticeval = AI.evaluate(chessPosition, hashkey, pvNode)

  //Reverse Futility pruning ????????
  // if (!incheck && depth <= 3 && staticeval - 200 >= beta) {
  //   return eval - 200
  // }

  let initialR = 0
  //FHR
  // if (iteration > 6 && staticeval - 200 * incheck > beta && alpha === beta - 1 && depth > 4) {
  //   initialR = 1
  // }

  let noncaptures = 0

  for (let i=0, len=moves.length; i < len; i++) {
    let move = moves[i]
    let R = initialR
    let E = 0

    let isCapture = move.isCapture()

    if (!isCapture) noncaptures++

    //REDUCTIONS (LMR)

    if (!incheck) {
      R += Math.log(depth+1) * Math.log(i + 1) / 1.95
    }

    //History pruning & reduction (no funciona, ralentiza)
    // if (!incheck && !pvNode && noncaptures > 5) {
    //   let hscore = AI.history[turn][move.getPiece()][move.getTo()]
    //   if (hscore < 500 && depth > R) {
    //     R++
    //   }
      
    //   if (hscore < 0 && noncaptures > 10) {
    //     // console.log(hscore)
    //     continue
    //   }
    // }

    /*futility pruning */
    if (!incheck && 1 < depth && depth <= 3+R && i >= 1) {
      if (staticeval + 600*depth <= alpha) {
        continue
      }
    }
    
    if (chessPosition.makeMove(move)) {
      legal++


      //LMP      
      // if (!isCapture && i > 400/depth && iteration > 4) {
      //   chessPosition.unmakeMove()
      //   continue
      // }

      //EXTENSIONS
      if (incheck && depth < 3 && pvNode) {
        E = 1
      }

      if (legal === 1) {
        score = -AI.PVS(chessPosition, -beta, -alpha, depth+E-1, ply+1)
      } else {

        score = -AI.PVS(chessPosition, -alpha-1, -alpha, depth-R-1, ply+1)

        if (score > alpha && score < beta) { //https://www.chessprogramming.org/Principal_Variation_Search
          score = -AI.PVS(chessPosition, -beta, -alpha, depth+E-1, ply+1)
        }
      }
      
      chessPosition.unmakeMove()
      nodes++

      if (AI.stop) return alpha
      // if (AI.stop) return alphaOrig



      if (score > bestscore) {
        if (score > alpha) {
          if (score >= beta) {
            if (legal === 1) {
              
              fhf++
            }
            
            fh++
            
            //LOWERBOUND
            AI.ttSave(hashkey, score, -1, depth, move)
            AI.saveHistory(turn, move, 2)

            return score
          }
          
          AI.ttSave(hashkey, score, 1, depth, move) //Sí, probado
          AI.saveHistory(turn, move, 1)

            
          alpha = score
          //AI.PV[ply] = move //No aporta
        }       

        bestscore = score
        bestmove  = move
      } else {
        AI.saveHistory(turn, move, -1)
      }
    }
  }

  if (ply === 1 && legal === 1) AI.stop = true

  if (legal === 0) {
      // stalemate, draw
      if (!chessPosition.isKingInCheck()) {
        AI.ttSave(hashkey, AI.DRAW + ply, 0, depth, bestmove)
        return AI.DRAW + ply

      }
      
      AI.ttSave(hashkey, -AI.MATE + ply, 0, depth, bestmove)
      return -AI.MATE + ply
      
  } else {

    if (chessPosition.isDraw()) {
      AI.ttSave(hashkey, AI.DRAW + ply, 1, depth, bestmove)   
      return AI.DRAW + ply

    }

    if (bestscore > alphaOrig) {
      // EXACT
      AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
      AI.saveHistory(turn, bestmove, 2)
      return bestscore
    } else {
      //UPPERBOUND value <= alphaorig
      AI.ttSave(hashkey, alphaOrig, 1, depth, bestmove)
      AI.saveHistory(turn, bestmove, -1)
      return alphaOrig
    }
  }
  
}

// AI.addKiller = function (ply, move) {
//   let killers = AI.killers[ply]

//   if (!killers) return

//   if (killers.killer1.value === move.value || killers.killer2.value === move.value) {
//     return
//   }

//   if (!killers.killer1) {
//     killers.killer1 = move
//     return
//   }

//   if (!killers.killer2) {
//     killers.killer2 = move;
//     return
//   }

//   let temp = killers.killer1
//   killers.killer1 = move
//   killers.killer2 = temp
// }

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

AI.createPSQT = function (chessPosition) {
  console.log('CREATE PSQT')

  AI.PIECE_SQUARE_TABLES_APERTURE = [
  // Pawn
      [ 
      0,  0,  0,  0,  0,  0,  0,  0,
     80, 80, 80, 80, 80, 80, 80, 80, 
     60, 40, 20, 50, 50, 20, 40, 60, 
     10,  0,  0, 40, 40,  0,  0, 20, 
    -20,-20, 10, 30, 30, 10,-40,-20, 
     20, 20, 10, 10, 10,-10, 20, 20, 
     20, 20,  0,-20,-20, 50, 50, 20,
      0,  0,  0,  0,  0,  0,  0,  0
      ],

      // Knight
      [ 
    -100,-20,-20,-20,-20,-20,-20,-100,
    -100,  0,  0,  0,  0,  0,  0,-100,
    -100,  0, 20, 20, 20, 20,  0,-100,
    -100,  0, 40, 40, 40, 40,  0,-100,
    -100,  0, 40, 40, 40, 40,  0,-100,
    -100,  0, 20, 20, 20, 20,  0,-100,
    -100,  0,  0, 20, 20,  0,  0,-100,
    -100,-80,-20,-40,-40,-20,-80,-100,
      
      ],
      // Bishop
    [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0, 40, 40,  0,  0,  0,
      0,  0, 40, 40, 40, 40,  0,  0,
    -40, 40,-20,-20,-20,-20, 20,-40,
      0, 40,  0, 20, 20,  0, 40,  0,
      0,  0,-80,  0,  0,-80,  0,  0,
    ],
    // Rook
    [ 
     40, 40, 40, 40, 40, 40, 40, 40,
     30, 30, 30, 30, 30, 30, 30, 30,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
    -80,  0,  0,  0,  0,  0,  0,-80,
    -40,  0,  0,  0,  0,  0,  0,-40,
    -20,-20, -20, 40, 40, 20,-60,-20,
    ],

    // Queen
    [ 
      -20,-20,-20,-20,-20,-20,-20,-20,
      -20,-20,-20,-20,-20,-20,-20,-20,
      -20,-20,-20,-20,-20,-20,-20,-20,
      -20,-20,-20,-20,-20,-20,-20,-20,
      -20,-20,-20,-20,-20,-20,-20,-20,
      -20,-20,-20, 10, 10,-20,-20,-20,
        0,  0, 10, 10,-10,  0,  0,  0,
        0,  0,  0,-10,  0,  0,  0,  0,
    ],

    // King
    [ 
      -90,-90,-90,-90,-90,-90,-90,-90,
      -90,-90,-90,-90,-90,-90,-90,-90,
      -90,-90,-90,-90,-90,-90,-90,-90,
      -90,-90,-90,-90,-90,-90,-90,-90,
      -90,-90,-90,-90,-90,-90,-90,-90, 
      -90,-90,-90,-90,-90,-90,-90,-90,
      -50,-50,-50,-50,-50,-80, 20,  0,
      -50,-20,-40,-80,-20,-30,100, 50

    ]
  ]

  // for (let i = 0; i < 6; i++) {
  //   AI.PIECE_SQUARE_TABLES_APERTURE[i] = AI.PIECE_SQUARE_TABLES_APERTURE[i].map(e=>e/2)
  // }

  AI.PIECE_SQUARE_TABLES_MIDGAME = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
  ]

  AI.PIECE_SQUARE_TABLES_ENDGAME = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
  ]

  // AI.PIECE_SQUARE_TABLES_MIDGAME = [...AI.PIECE_SQUARE_TABLES_APERTURE]
  // AI.PIECE_SQUARE_TABLES_ENDGAME = [...AI.PIECE_SQUARE_TABLES_APERTURE]

  let color = chessPosition.getTurnColor()

  let P = chessPosition.getPieceColorBitboard(0, color).dup()
  let N = chessPosition.getPieceColorBitboard(1, color).dup()
  let B = chessPosition.getPieceColorBitboard(2, color).dup()
  let R = chessPosition.getPieceColorBitboard(3, color).dup()
  let Q = chessPosition.getPieceColorBitboard(4, color).dup()
  let K = chessPosition.getPieceColorBitboard(5, color).dup()
  let PX = chessPosition.getPieceColorBitboard(0, !color).dup()
  let BX = chessPosition.getPieceColorBitboard(2, !color).dup()
  let RX = chessPosition.getPieceColorBitboard(3, !color).dup()
  let QX = chessPosition.getPieceColorBitboard(4, !color).dup()
  let KX = chessPosition.getPieceColorBitboard(5, !color).dup()

  let pawnmask = Chess.Position.makePawnAttackMask(color, P)
  let pawnmap = AI.bin2map(P, color)
  let pawnstructure  = AI.bin2map({high: P.high | pawnmask.high, low: P.low | pawnmask.low}, color)

  
  let pawnmaskX = Chess.Position.makePawnAttackMask(!color, PX)//.not(PX)
  let pawnXmap = AI.bin2map(PX, color)

  let kingmap = AI.bin2map(K, color)
  let kingXmap = AI.bin2map(KX, color)

  let kingposition = kingmap.indexOf(1)

  let kingXposition = kingXmap.indexOf(1)

  //Estructura básica peones
  AI.PIECE_SQUARE_TABLES_MIDGAME[0] = [
    50, 80, 80, 80, 80, 80, 80, 50,
    40, 70, 70, 70, 70, 70, 70, 40,
    30, 50, 50, 50, 50, 50, 50, 30,
    20, 30, 40, 50, 50, 40, 30, 20,
    10, 30, 30, 30, 30, 30, 30, 10,
    20, 20, 20, 20, 20, 20, 20, 20,
    10, 10, 10, 10, 10, 10, 10, 10,
     0,  0,  0,  0,  0,  0,  0,  0,
  ]

  //Castiga captura y maniobras con peón frontal del rey
  if (kingposition >= 61 || (kingposition>=56 && kingposition<=58)) {
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 7] +=200
    AI.PIECE_SQUARE_TABLES_APERTURE[0][kingposition - 7] +=200
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 8] +=40
    AI.PIECE_SQUARE_TABLES_APERTURE[0][kingposition - 8] +=40
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 9] +=200
    AI.PIECE_SQUARE_TABLES_APERTURE[0][kingposition - 9] +=200

    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 15] -=100
    AI.PIECE_SQUARE_TABLES_APERTURE[0][kingposition - 15] -=100
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 17] -=100
    AI.PIECE_SQUARE_TABLES_APERTURE[0][kingposition - 17] -=100
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 23] -=200    
    AI.PIECE_SQUARE_TABLES_APERTURE[0][kingposition - 23] -=200    
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 24] -=200    
    AI.PIECE_SQUARE_TABLES_APERTURE[0][kingposition - 24] -=200    
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 25] -=200    
    AI.PIECE_SQUARE_TABLES_APERTURE[0][kingposition - 25] -=200    
  }

  //Caballos al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = [
    -100,-100,-100,-100,-100,-100,-100,-100,
    -100, -40, -40, -40, -40, -40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40, -40, -40, -40, -40, -40,-100,
    -100,-100,-100,-100,-100,-100,-100,-100,
  ]

  //Caballos cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
    return e + 10 - 2 * AI.distance(kingXposition, i)
  })

  //Castiga caballos en las orillas (Arriba)
  // AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
  //   let mod = i % 8
  //   return e - (mod === 0 || mod === 7? 80 : 0)
  // })

  //Castiga caballos sin desarrollar
  // AI.PIECE_SQUARE_TABLES_MIDGAME[1][57] -= 40
  // AI.PIECE_SQUARE_TABLES_MIDGAME[1][62] -= 40

  //Premia caballos en Outposts
  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
    return e + pawnmask[i]? 60 : -20
  })

  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
    return e + pawnmask[i]? 20 : -20
  })
  

  //Alfiles al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = [
    -100,-100,-100,-100,-100,-100,-100,-100,
    -100, -40, -40, -40, -40, -40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100,  40, -40, -40, -40, -40,  40,-100,
    -100,-100,-100,-100,-100,-100,-100,-100,
  ]

  //Castiga alfiles sin desarrollar (arriba)
  // AI.PIECE_SQUARE_TABLES_MIDGAME[2][58] -= 100
  // AI.PIECE_SQUARE_TABLES_MIDGAME[2][61] -= 100

  //Premia alfiles en Outposts
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
    return e + pawnmask[i]? 40 : -20
  })

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

      pawnXfiles[col]++
    }
  }

  AI.PIECE_SQUARE_TABLES_APERTURE[3] = AI.PIECE_SQUARE_TABLES_APERTURE[3].map((e,i)=>{
    let col = i%8
    return e + (pawnfiles[col]? -40 : 0)
  })

  AI.PIECE_SQUARE_TABLES_APERTURE[3] = AI.PIECE_SQUARE_TABLES_APERTURE[3].map((e,i)=>{
    let col = i%8
    return e + (!pawnfiles[col]? 80 : 0) + (!pawnXfiles[col]? 50 : 0)
  })

  AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,i)=>{
    let col = i%8
    return e + (pawnfiles[col]? -20 : 0)
  })

  AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,i)=>{
    let col = i%8
    return e + (!pawnfiles[col]? 50 : 0) + (!pawnXfiles[col]? 50 : 0)
  })

  //Torres delante del rey enemigo ("torre en séptima")
  for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_MIDGAME[3][i + 8*(kingXposition/8 | 0)] += 27

  //Torres conectadas
  let RR = chessPosition.makeRookAttackMask(R, P.or(PX))
  let RRmap = AI.bin2map(RR, color)

  AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,i)=>{
    return e + 10*RRmap[i]
  })

  //Castiga torres sin desarrollar
  AI.PIECE_SQUARE_TABLES_MIDGAME[2][56] -= 40
  AI.PIECE_SQUARE_TABLES_MIDGAME[2][63] -=100

  //Dama al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = [
   -20, -20, -20, -20, -20, -20, -20, -20,
   -20,   0,   0,   0,   0,   0,   0, -20,
   -20,   0,  20,  20,  20,  20,   0, -20,
   -20,   0,  20,  20,  20,  20,   0, -20,
   -20,   0,  20,  20,  20,  20,   0, -20,
   -20,   0,  20,  20,  20,  20,   0, -20,
   -20,   0,   0,   0,   0,   0,   0, -20,
   -20, -20, -20, -20, -20, -20, -20, -20,
]

  //Rey lejos del centro
    AI.PIECE_SQUARE_TABLES_MIDGAME[5] = [ 
       -90, -90, -90, -90, -90, -90, -90, -90,
       -90, -90, -90, -90, -90, -90, -90, -90,
       -90, -90, -90, -90, -90, -90, -90, -90,
       -90, -90, -90, -90, -90, -90, -90, -90,
       -90, -90, -90, -90, -90, -90, -90, -90, 
       -90, -90, -90, -90, -90, -90, -90, -90,
      -50,-50,-80,-80,-80,-80,-50,-90,
     -120,  0,-20,-20,-20,-20,  0,-120
    ]

  //Premia enrocar
    if (chessPosition.hasCastlingRight(color, true) && 
          (
            (pawnmap[kingposition-5] && pawnmap[kingposition-6]) ||
            (pawnmap[kingposition-5] && pawnmap[kingposition-7] && pawnmap[kingposition-14])
          )
      ) {
      console.log('KINGSIDE')
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][60]  -= 20
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][61]  -= 20
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][62]  +=120
    }

    if (chessPosition.hasCastlingRight(color, false) && pawnmap[kingposition-10] && pawnmap[kingposition-11]) {
      console.log('QUEENSIDE')
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][58]  += 40
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][59]  -= 40
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][60]  -= 20
    }

  //Rey fuera de las esquinas por poca movilidad y riesgo de mate de pasillo (arriba)
    // AI.PIECE_SQUARE_TABLES_MIDGAME[5][0]  -= 100
    // AI.PIECE_SQUARE_TABLES_MIDGAME[5][7]  -= 100
    // AI.PIECE_SQUARE_TABLES_MIDGAME[5][56] -= 100
    // AI.PIECE_SQUARE_TABLES_MIDGAME[5][63] -= 100

  //////////////// Rayos X ///////////////////////
  let KB = chessPosition.makeBishopAttackMask(KX, false)
  let KBmap = AI.bin2map(KB, color)

  let BB = chessPosition.makeBishopAttackMask(BX, false)
  let BBmap = AI.bin2map(BB, color)

  let RB = chessPosition.makeBishopAttackMask(RX, false)
  let RBmap = AI.bin2map(RB, color)
  
  let QB = chessPosition.makeBishopAttackMask(QX, false)
  let QBmap = AI.bin2map(QB, color)

  let KR = chessPosition.makeRookAttackMask(KX, false)
  let KRmap = AI.bin2map(KR, color)

  let RRx = chessPosition.makeRookAttackMask(RX, false)
  let RRmapx = AI.bin2map(RRx, color)

  let QR = chessPosition.makeRookAttackMask(KX, false)
  let QRmap = AI.bin2map(QR, color)


  //Alfiles apuntando a torres
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
    return e + 20*RBmap[i]
  })

  //Alfiles apuntando a dama
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
    return e + 20*QBmap[i]
  })
  
  //Alfiles apuntando al rey
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
    return e + 20*KBmap[i]
  })

  AI.PIECE_SQUARE_TABLES_ENDGAME[2] = AI.PIECE_SQUARE_TABLES_ENDGAME[2].map((e,i)=>{
    return e + 20*KBmap[i]
  })

  if (kingXposition % 8 < 7) {
    AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
      return e + 20*(KBmap[i + 1] || 0)
    })    
  }

  if (kingXposition % 8 < 7) {
    AI.PIECE_SQUARE_TABLES_ENDGAME[2] = AI.PIECE_SQUARE_TABLES_ENDGAME[2].map((e,i)=>{
      return e + 20*(KBmap[i + 1] || 0)
    })    
  }

  if (kingXposition % 8 > 0) {
    AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
      return e + 20*(KBmap[i - 1] || 0)
    })
  }

  if (kingXposition % 8 > 0) {
    AI.PIECE_SQUARE_TABLES_ENDGAME[2] = AI.PIECE_SQUARE_TABLES_ENDGAME[2].map((e,i)=>{
      return e + 20*(KBmap[i - 1] || 0)
    })
  }

  //Torres apuntando a dama
  AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,i)=>{
    return e + 10*QRmap[i]
  })

  //Torres apuntando al rey
  AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,i)=>{
    return e + 10*KRmap[i]
  })

  AI.PIECE_SQUARE_TABLES_ENDGAME[3] = AI.PIECE_SQUARE_TABLES_ENDGAME[3].map((e,i)=>{
    return e + 10*KRmap[i]
  })

  //Dama apuntando al rey
  AI.PIECE_SQUARE_TABLES_MIDGAME[4] = AI.PIECE_SQUARE_TABLES_MIDGAME[4].map((e,i)=>{
    return e + 10*KBmap[i]
  })

  //Dama apuntando a alfiles enemigos
  AI.PIECE_SQUARE_TABLES_MIDGAME[4] = AI.PIECE_SQUARE_TABLES_MIDGAME[4].map((e,i)=>{
    return e - 60*BBmap[i]
  })

  //Dama apuntando a torres enemigas
  AI.PIECE_SQUARE_TABLES_MIDGAME[4] = AI.PIECE_SQUARE_TABLES_MIDGAME[4].map((e,i)=>{
    return e - 20*RRmapx[i]
  })

  //Rey apuntando a alfiles enemigos
  AI.PIECE_SQUARE_TABLES_MIDGAME[5] = AI.PIECE_SQUARE_TABLES_MIDGAME[5].map((e,i)=>{
    return e - 60*BBmap[i]
  })

  //Rey apuntando a torres enemigas
  AI.PIECE_SQUARE_TABLES_MIDGAME[5] = AI.PIECE_SQUARE_TABLES_MIDGAME[5].map((e,i)=>{
    return e - 20*RRmapx[i]
  })

  ////////////////////// pawn structure ////////////////////

    //Peones a casillas defendidas por otro peón
      AI.PIECE_SQUARE_TABLES_APERTURE[0] = AI.PIECE_SQUARE_TABLES_APERTURE[0].map((e,i)=>{
        let defended = pawnmask[i]
        return e + (defended? 40 : -20)
      })

      AI.PIECE_SQUARE_TABLES_MIDGAME[0] = AI.PIECE_SQUARE_TABLES_MIDGAME[0].map((e,i)=>{
        let defended = pawnmask[i]
        return e + (defended? 40 : -10)
      })

      AI.PIECE_SQUARE_TABLES_ENDGAME[0] = AI.PIECE_SQUARE_TABLES_ENDGAME[0].map((e,i)=>{
        let defended = pawnmask[i]
        return e + (defended? 20 : 0)
      })

  ///////////////////////////// ENDGAME ////////////////////////

  AI.PIECE_SQUARE_TABLES_ENDGAME[0] = [
     0,  0,  0,  0,  0,  0,  0,  0,
   600,600,600,400,400,600,600,600,
   400,400,400,200,200,400,400,400,
   200,200,200,100,100,200,200,200,
    40,-20,-20,-20,-20,-20,-20, 40,
   -40,-40,-40,-40,-40,-40,-40,-40,
   -80,-80,-80,-80,-80,-80,-80,-80,
     0,  0,  0,  0,  0,  0,  0,  0,
  ]

  //Castiga captura y maniobras con peón frontal del rey
  if (chessPosition.getMadeMoveCount()>12 && kingposition > 55) {
    AI.PIECE_SQUARE_TABLES_ENDGAME[0][kingposition - 8] +=50 
  }

  //Caballos al centro
  AI.PIECE_SQUARE_TABLES_ENDGAME[1] = [
    -100,-100,-100,-100,-100,-100,-100,-100,
    -100, -40, -40, -40, -40, -40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40, -40, -40, -40, -40, -40,-100,
    -100,-100,-100,-100,-100,-100,-100,-100,
  ]

  //Caballos cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[1] = AI.PIECE_SQUARE_TABLES_ENDGAME[1].map((e,i)=>{
    return e + 40 - 8 * AI.distance(kingXposition, i)
  })

  //Premia caballos en Outposts
  AI.PIECE_SQUARE_TABLES_ENDGAME[2] = AI.PIECE_SQUARE_TABLES_ENDGAME[2].map((e,i)=>{
    return e + pawnmask[i]? 40 : -20
  })

  //Alfiles al centro
  AI.PIECE_SQUARE_TABLES_ENDGAME[2] = [
    -200,-150,-100,-100,-100,-100,-150,-200,
    -150, -40, -40, -40, -40, -40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -150, -40, -40, -40, -40, -40, -40,-150,
    -200,-150,-100,-100,-100,-100,-150,-200,
  ]

  //Premia alfiles en Outposts
  AI.PIECE_SQUARE_TABLES_ENDGAME[2] = AI.PIECE_SQUARE_TABLES_ENDGAME[2].map((e,i)=>{
    return e + pawnmask[i]? 20 : -20
  })

  //Torres en columnas abiertas

  pawnfiles = [0,0,0,0,0,0,0,0]

  for (let i = 0; i < 64; i++) {
    if (pawnmap[i]) {
      let col = i % 8

      pawnfiles[col]++
    }
  }

  AI.PIECE_SQUARE_TABLES_ENDGAME[3] = AI.PIECE_SQUARE_TABLES_ENDGAME[3].map((e,i)=>{
    let col = i%8
    return e + (pawnfiles[col]? -40 : 0)
  })

  AI.PIECE_SQUARE_TABLES_ENDGAME[3] = AI.PIECE_SQUARE_TABLES_ENDGAME[3].map((e,i)=>{
    let col = i%8
    return e + (!pawnfiles[col]? 40 : 0)
  })

  //Torres delante del rey enemigo ("torre en séptima")
  for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_ENDGAME[3][i + 8*(kingXposition/8 | 0)] += 27

  //Torre cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[3] = AI.PIECE_SQUARE_TABLES_ENDGAME[3].map((e,i)=>{
    return 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

  //Rey cerca del centro
  AI.PIECE_SQUARE_TABLES_ENDGAME[5] = [
    -200,-150,-100,-100,-100,-100,-150,-200,
    -150, -40, -40, -40, -40, -40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -150, -40, -40, -40, -40, -40, -40,-150,
    -200,-150,-100,-100,-100,-100,-150,-200,
  ]
}

AI.PSQT2Sigmoid = function () {
  // console.log(AI.PIECE_SQUARE_TABLES[5])
  /////////////////// PSQT a sigmoidea ///////////////////////
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

  // console.log(AI.PIECE_SQUARE_TABLES)
}

AI.setphase = function (chessPosition) {
  phase = 1 //Apertura
  let color = chessPosition.getTurnColor()

  if (AI.nofpieces <= 28 || (chessPosition.movenumber && chessPosition.movenumber > 9)) {
      phase = 2 //'midgame'
  }

  let queens = chessPosition.getPieceColorBitboard(4, color).popcnt() + chessPosition.getPieceColorBitboard(4, !color).popcnt()

  if (AI.nofpieces <= 20 && queens === 0) {
    phase = 3 //endgame
  }
  
  AI.createPSQT(chessPosition)

  if (phase == 1) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_APERTURE]

  if (phase == 2) {
    AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_MIDGAME]
  }

  if (phase >= 3) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_ENDGAME]

  if (phase < 3) {
    AI.PIECE_VALUES = AI.MIDGAME_PIECE_VALUES
  } else {
    AI.PIECE_VALUES = AI.ENDGAME_PIECE_VALUES
  }

  AI.randomizePSQT()
  AI.PSQT2Sigmoid()

  //console.log(AI.PIECE_SQUARE_TABLES)
}

AI.getPV = function (chessPosition, length) {
  let PV = [chessPosition.getLastMove() || {}]
  let legal = 0

  let ttEntry
  let ttFound

  for (let i = 0; i < length; i++) {
    ttFound = false
    let hashkey = chessPosition.hashKey.getHashKey()
    ttEntry = AI.ttGet(hashkey)

    if (ttEntry/* && ttEntry.depth > 0*/) {
      let moves = chessPosition.getMoves(false, false).filter(move=>{
        return move.value === ttEntry.move.value
      })

      if (moves.length) {
        if (chessPosition.makeMove(ttEntry.move)) {
          legal++
          
          if (chessPosition.isDraw() && legal > 1) {
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
    chessPosition.unmakeMove()
  }

  return PV
}

AI.search = function(chessPosition, options) {

  if (options && options.seconds) secondspermove = options.seconds

  let nmoves = chessPosition.madeMoves.length

  //let mindepth = 2.4 * Math.log(secondspermove) + 8

  if (chessPosition.movenumber && chessPosition.movenumber === 1) {
    AI.createTables()
  }

  AI.reduceHistory()

  if (!AI.PIECE_VALUES || nmoves < 2) {
    AI.PIECE_VALUES = AI.MIDGAME_PIECE_VALUES
  }

  //Creates killers
  //AI.killers = new Array(totaldepth)
  //for (let i = 0; i < totaldepth;  i++) AI.killers[i] = {killer1: {value:0}, killer2: {value:0}}

  return new Promise((resolve, reject) => {
    let color = chessPosition.getTurnColor()

    AI.color = color

    // AI.DRAW = AI.evaluate(chessPosition, color) + AI.PIECE_VALUES[0]

    // console.log(AI.history[0])

    let white = color == 0
  
    if (white) {
        TESTER = true
    } else {
        TESTER = false
    }

    phase = 1 //Apertura

    nodes = 0
    qsnodes = 0
    enodes = 0
    ttnodes = 0
    iteration = 0

    AI.nofpieces = chessPosition.getOccupiedBitboard().popcnt()

    AI.timer = (new Date()).getTime()
    AI.stop = false

    let score = 0, lastscore = 0

    let fhfperc = 0

    AI.setphase(chessPosition)

    console.log('PHASE', phase)
  
    AI.PV = AI.getPV(chessPosition, totaldepth+1)

    let alpha = -AI.INFINITY
    let beta = AI.INFINITY

    for (let depth = 1; depth <= totaldepth; depth+=1) {
        

        if (AI.stop && iteration > mindepth) {
            break
        }

        if (!AI.stop) lastscore = score

        AI.bestmove = [...AI.PV][1]

        iteration++

        fh = fhf = 0.001
        
        score = (white? 1 : -1) * AI.PVS(chessPosition, alpha, beta, depth, 1)

        AI.PV = AI.getPV(chessPosition, totaldepth+1)

        let strmove = AI.PV[1]? AI.PV[1].getString() : '----'
        
        
        fhfperc = Math.round(fhf*100/fh)

        if (AI.PV) console.log(iteration, depth, AI.PV.map(e=>{ return e && e.getString? e.getString() : '---'}).join(' '), '     |     FHF ' + fhfperc + '%', score)
      }
    
    // if (!AI.bestmove) {      
    //     AI.search(chessPosition, options)
    // }

    // console.info('                ')
    console.log(nodes, qsnodes, ttnodes)
    if (TESTER) {
      console.info('___________________________________ TESTER _____________________________________')
    } else {
      console.info('________________________________________________________________________________')
    }

    console.log(AI.bestmove)

    let sigmoid = 1/(1+Math.pow(10, -lastscore/400))

    AI.lastmove = AI.bestmove

    resolve({n: chessPosition.movenumber, phase, depth: iteration-1, from: AI.bestmove.getFrom(), to: AI.bestmove.getTo(), movestring: AI.bestmove.getString(),
            score: lastscore | 0, sigmoid: (sigmoid * 100 | 0)/100, phase,
            nodes, qsnodes, FHF: fhfperc+'%',
            pieces: chessPosition.pieces})
  })
}

module.exports = AI