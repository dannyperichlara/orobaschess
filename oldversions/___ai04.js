"use strict"

let Chess = require('./chess.js')

let TESTER, nodes, qsnodes, enodes, iteration, status, fhf, fh
let totaldepth = 10
let random = 10
let stage = 1
let htlength = 1 << 24
let secondspermove = 1
let mindepth = 6

let AI = function() {

}

AI.createTables = function () {
  console.log('Creating tables.......................................................................')
  AI.history = [
    new Array(64).fill(new Array(64).fill(0)), //blancas
    new Array(64).fill(new Array(64).fill(0)) //negras
  ]

  AI.history = [[],[]]

  AI.history[0] = [[
260,210,230,370,350,440,250,450,
710,520,660,790,570,500,670,570,
7440,12610,11120,11310,11370,9660,13350,6830,
14480,13770,18240,20280,20320,19400,13030,13240,
13710,14590,19030,23440,22430,20500,12540,13250,
6330,12220,9040,8010,8160,8140,12110,6670,
520,700,400,500,450,330,650,430,
290,210,200,280,290,360,270,430,
  ],

  [
280,660,1320,1760,1700,1200,740,190,
960,1640,4650,6930,7800,4460,1590,780,
1590,8550,10970,10300,10710,11620,9590,1780,
2180,4600,8420,11290,11670,9330,4830,3030,
2580,4240,8090,10340,11340,8610,4270,2920,
1820,7230,10570,10510,11520,11140,8570,1620,
850,1630,4180,6740,7510,3870,1440,620,
180,660,1520,1180,1680,1460,440,230,
  ],

  [
1160,1290,2600,2470,2380,2550,1220,930,
1270,5530,5560,6610,6630,5740,5050,1330,
2980,3730,7360,7080,7000,7210,4340,2550,
2790,4120,6100,7550,7590,5560,4470,2880,
2530,4770,5730,8760,7970,5720,4530,2420,
2710,3860,8190,7870,6820,7680,4160,2470,
1700,5170,6410,6720,6720,5320,4970,1430,
1280,1220,2320,2910,2820,2690,1170,870,
  ],

  [
7680,7430,9390,10230,11860,9270,7620,5920,
5330,4570,5210,6210,5980,6480,5050,4830,
4420,3810,4060,4620,4610,5020,4670,4460,
4130,3980,4120,4380,4640,4340,3600,3910,
3930,3590,4580,4670,4420,4850,4030,3990,
4640,3660,4350,4660,4980,4640,4640,4310,
5060,4500,5630,6140,6840,6930,5180,4310,
8000,7340,9950,18520,13100,22850,7090,5760,
  ],

  [
1880,2100,3050,3990,4020,3710,2050,1770,
2380,3500,4910,6400,7070,5610,3680,2350,
2840,3350,4120,5430,5110,4580,4050,3300,
2850,3070,4400,4500,4840,3950,3270,3160,
3130,3120,4090,5100,5000,4270,3460,3660,
2660,3290,4730,5630,5220,4770,3500,2710,
2330,3660,5350,6520,7200,5580,4010,1950,
1610,2260,3060,3800,3700,2890,2060,1420,
  ],

  [
181,584,345,264,259,389,436,341,
292,541,549,611,507,605,560,353,
141,320,483,489,464,499,374,168,
95,229,294,344,376,345,306,146,
99,238,377,395,354,401,304,149,
163,368,434,482,567,521,360,216,
298,575,589,537,608,653,692,369,
186,590,1066,267,249,358,1810,356,
  ]]

  AI.history[1] = [[
260,210,230,370,350,440,250,450,
710,520,660,790,570,500,670,570,
7440,12610,11120,11310,11370,9660,13350,6830,
14480,13770,18240,20280,20320,19400,13030,13240,
13710,14590,19030,23440,22430,20500,12540,13250,
6330,12220,9040,8010,8160,8140,12110,6670,
520,700,400,500,450,330,650,430,
290,210,200,280,290,360,270,430,
  ],

  [
280,660,1320,1760,1700,1200,740,190,
960,1640,4650,6930,7800,4460,1590,780,
1590,8550,10970,10300,10710,11620,9590,1780,
2180,4600,8420,11290,11670,9330,4830,3030,
2580,4240,8090,10340,11340,8610,4270,2920,
1820,7230,10570,10510,11520,11140,8570,1620,
850,1630,4180,6740,7510,3870,1440,620,
180,660,1520,1180,1680,1460,440,230,
  ],

  [
1160,1290,2600,2470,2380,2550,1220,930,
1270,5530,5560,6610,6630,5740,5050,1330,
2980,3730,7360,7080,7000,7210,4340,2550,
2790,4120,6100,7550,7590,5560,4470,2880,
2530,4770,5730,8760,7970,5720,4530,2420,
2710,3860,8190,7870,6820,7680,4160,2470,
1700,5170,6410,6720,6720,5320,4970,1430,
1280,1220,2320,2910,2820,2690,1170,870,
  ],

  [
7680,7430,9390,10230,11860,9270,7620,5920,
5330,4570,5210,6210,5980,6480,5050,4830,
4420,3810,4060,4620,4610,5020,4670,4460,
4130,3980,4120,4380,4640,4340,3600,3910,
3930,3590,4580,4670,4420,4850,4030,3990,
4640,3660,4350,4660,4980,4640,4640,4310,
5060,4500,5630,6140,6840,6930,5180,4310,
8000,7340,9950,18520,13100,22850,7090,5760,
  ],

  [
1880,2100,3050,3990,4020,3710,2050,1770,
2380,3500,4910,6400,7070,5610,3680,2350,
2840,3350,4120,5430,5110,4580,4050,3300,
2850,3070,4400,4500,4840,3950,3270,3160,
3130,3120,4090,5100,5000,4270,3460,3660,
2660,3290,4730,5630,5220,4770,3500,2710,
2330,3660,5350,6520,7200,5580,4010,1950,
1610,2260,3060,3800,3700,2890,2060,1420,
  ],

  [
1810,5840,3450,2640,2590,3890,4360,3410,
2920,5410,5490,6110,5070,6050,5600,3530,
1410,3200,4830,4890,4640,4990,3740,1680,
950,2290,2940,3440,3760,3450,3060,1460,
990,2380,3770,3950,3540,4010,3040,1490,
1630,3680,4340,4820,5670,5210,3600,2160,
2980,5750,5890,5370,6080,6530,6920,3690,
1860,5900,10660,2670,2490,3580,18100,3560,
  ]]

  /*for (let color = 0; color < 2; color++) {
    for (let piece = 0; piece < 6; piece++) {
      for (let to = 0; to < 64; to++) {
        AI.history[color][piece][to] = 0
      }
    }
  }*/

  AI.hashtable = new Array(htlength) //positions
}

AI.createTables()

AI.PIECE_VALUES = [100, 325, 350, 500, 900, 20000]

AI.MATE = AI.PIECE_VALUES[5]
AI.INFINITY = AI.PIECE_VALUES[5]*4

AI.PIECE_SQUARE_TABLES_MIDGAME = [
// Pawn
    [ 
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 60, 60, 50, 50, 50,
    20, 30, 30, 50, 50, 20,-20,-20,
    10, 20, 30, 40, 40, 20,-20,-20,
    10,-20, 30, 40, 30,  0,-20,-20,
    10, 20, 30,-20, 20,-20, 20,  5,
    20, 20, 20,-20,-20, 50,100, 50,
     0,  0,  0,  0,  0,  0,  0,  0
    ],

    // Knight
    [ 
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40, 30, 30, 30, 30, 30, 30,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  0, 20, 30, 30, 20,  0,-30,
    -30,  0, 15, 30, 30, 15,  0,-30,
    -80,  5, 20, 15, 15,-20,  5,-80,
    -40,-20,  0, 20, 20,  0,-20,-40,
    -50,-20,-30,-30,-30,-30,-20,-50,
    ],
    // Bishop
  [ 
  -50, -30, -30, -30, -30, -30, -30, -50,
  -30, -10, -10, -10, -10, -10, -10, -30,
  -30, -10, -10, -10, -10, -10, -10, -30,
  -30, -20,  20,  30,  30,  20, -10, -30,
  -30, -10,  20,  30,  30,  20, -10, -30,
  -30,  20,  20, -20, -20,  20,  20, -30,
  -30,  20,   0, -10, -10,   0,  20, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
  ],
  // Rook
  [ 
  0, 30, 30, 30, 30, 30, 30,  0,
  5, 40, 40, 50, 50, 40, 40,  5,
 -5,  0,  0, 10, 10,  0,  0, -5,
 -5,  0,  0, 10, 10,  0,  0, -5,
 -25,  0,  0, 10, 10,  0,  0, -25,
 -15,  0,  0, 10, 10,  0,  0, -15,
 -80,-50,  0, 20, 20,  0,-80,-100,
-50, -80,-80, 40, 40,  0,-80, -50
  ],

  // Queen
  [ 
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0,20,20, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
  ],

  // King
  [ 
    -90,-90,-90,-90,-90,-90,-90,-90,
    -90,-90,-90,-90,-90,-90,-90,-90,
    -90,-90,-90,-90,-90,-90,-90,-90,
    -90,-90,-90,-90,-90,-90,-90,-90,
    -90,-90,-90,-90,-90,-90,-90,-90,
    -90,-90,-90,-90,-90,-90,-90,-90,
    -50,-50,-50,-50,-50,-50, 20,  0,
    -50,-50,-50,-50,-20,-30, 80, 50

  ]
]

for (let i in AI.PIECE_SQUARE_TABLES_MIDGAME) {
  for (let j in AI.PIECE_SQUARE_TABLES_MIDGAME[i]) {
    AI.PIECE_SQUARE_TABLES_MIDGAME[i][j] = AI.PIECE_SQUARE_TABLES_MIDGAME[i][j] / 4 + Math.random() * random - random / 2
  }
}

AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_MIDGAME]

AI.PIECE_SQUARE_TABLES_ENDGAME = [
    // pawn
    [
       0,  0,  0,  0,  0,  0,  0,  0, 
      80, 80, 80, 80, 80, 80, 80, 80,
      60, 60, 60, 60, 60, 60, 60, 60,
      40, 40, 40, 40, 40, 40, 40, 40,
      30, 30, 30, 30, 30, 30, 30, 30,
      20, 20, 20, 20, 20, 20, 20, 20,
       0,  0,  0,  0,  0,  0,  0,  0,
       0,  0,  0,  0,  0,  0,  0,  0,
    ],
    // Knight
    [ 
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -10, 10, 10, 15, 15, 10, 10,-10,
    -10, 15, 15, 20, 20, 15, 15,-10,
    -10, 10, 15, 20, 20, 15, 10,-10,
    -10, 15, 10, 15, 15, 10, 15,-10,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
    ],
        // Bishop
      [ 
        -20,-10,-10,-10,-10,-10,-10,-20,
        -10, 10, 10,  0,  0, 10, 10,-10,
        -10, 10, 10, 10, 10, 10, 10,-10,
        -10,  0, 10, 20, 20, 10,  0,-10,
        -10,  0, 10, 20, 20, 10,  0,-10,
         10, 10, 10, 10, 10, 10, 10,-10,
         10, 10, 10,  0,  0, 10, 10, 10,
        -20, 10, 10,-10,-10,-10, 10,-20,
      ],
      // Rook
      [ 
        50, 50, 50, 50, 50, 50, 50, 50, 
        50, 50, 50, 50, 50, 50, 50, 50,
        40, 40, 40, 40, 40, 40, 40, 40,
        40, 40, 40, 40, 40, 40, 40, 40,
        30, 30, 30, 30, 30, 30, 30, 30,
        20, 20, 20, 20, 20, 20, 20, 20,
         0,  0,  0,  0,  0,  0,  0,  0,
         0,  0,  0,  0,  0,  0,  0,  0,
      ],

      // Queen
      [ 
      -20,-10,-10, -5, -5,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5,  5,  5,  5,  0,-10,
       -5,  0,  5,  5,  5,  5,  0, -5,
        0,  0,  5,  5,  5,  5,  0, -5,
      -10,  5,  5,  5,  5,  5,  0,-10,
      -10,  0,  5,  0,  0,  0,  0,-10,
      -20,-10,-10, -5, -5,-10,-10,-20
      ],
    // king
    [
         0, 24, 36, 48, 48, 36, 24,  0,
        24, 48, 60, 72, 72, 60, 48, 24,
        48, 72, 84, 72, 72, 84, 72, 48,
        48, 72, 84,100,100, 84, 72, 48,
        48, 72, 84,100,100, 84, 72, 48,
        48, 72, 84, 72, 72, 84, 72, 48,
        24, 48, 60, 72, 72, 60, 48, 24,
         0, 24, 36, 48, 48, 36, 24,  0,
 
    ]

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

let ___max = -100

AI.evaluate = function(chessPosition, pvNode) {
  let color = chessPosition.getTurnColor()
  let material = AI.getMaterialValue(chessPosition, color) - AI.getMaterialValue(chessPosition, !color) | 0
  let psqt = AI.getPieceSquareValue(chessPosition, color) - AI.getPieceSquareValue(chessPosition,  !color)

  return material + psqt
}

AI.mobility = function(chessPosition, color) {
    let us = chessPosition.getColorBitboard(color)  
    let enemy = chessPosition.getColorBitboard(!color)  
    let empty = chessPosition.getEmptyBitboard().dup().or(enemy)  
    let knights = chessPosition.getPieceColorBitboard(Chess.Piece.KNIGHT, color).dup()  
    let queens = chessPosition.getPieceColorBitboard(Chess.Piece.QUEEN, color)  
    let bishopqueen = chessPosition.getPieceColorBitboard(Chess.Piece.BISHOP, color).dup().or(queens) 
    let rookqueen = chessPosition.getPieceColorBitboard(Chess.Piece.ROOK, color).dup().or(queens)

    let mobility = 0

    while (!knights.isEmpty()) {
        mobility += Chess.Bitboard.KNIGHT_MOVEMENTS[knights.extractLowestBitPosition()].dup().popcnt()
    }

    mobility += Chess.Position.makeBishopAttackMask(bishop, empty).dup().popcnt()
    mobility += Chess.Position.makeRookAttackMask(rook, empty).dup().popcnt()

    return mobility
}

AI.getMaterialValue = function(chessPosition, color) {
    let value = 0

    let P = chessPosition.getPieceColorBitboard(0, color).popcnt()
    let N = chessPosition.getPieceColorBitboard(1, color).popcnt()
    let B = chessPosition.getPieceColorBitboard(2, color).popcnt()
    let R = chessPosition.getPieceColorBitboard(3, color).popcnt()
    let Q = chessPosition.getPieceColorBitboard(4, color).popcnt()
    let K = chessPosition.getPieceColorBitboard(5, color).popcnt()

    value = P*AI.PIECE_VALUES[0] + N*AI.PIECE_VALUES[1] + B*AI.PIECE_VALUES[2] + R*AI.PIECE_VALUES[3] + Q*AI.PIECE_VALUES[4] + K*AI.PIECE_VALUES[5]

    value += B > 1?   AI.PIECE_VALUES[0]/2 : 0
    value += P == 0? -AI.PIECE_VALUES[0]/2 : 0

    return value
}

AI.getPieceSquareValue = function(chessPosition, color) {
    let value = 0

    for (let piece = 0, len = AI.PIECE_SQUARE_TABLES.length; piece < len; piece++) {
        let pieces = chessPosition.getPieceColorBitboard(piece, color).dup()

        while (!pieces.isEmpty()) {
            let index = pieces.extractLowestBitPosition()
            value += AI.PIECE_SQUARE_TABLES[piece][color ? index : (56 ^ index)]
        }
    }

    return value
}

AI.scoreMove = function(move) {
  if (move.pv) {
    return 1e9  
  } else if (move.tt) { 
    return 1e8  
  } else if (move.isCapture()) {  
    move.capture = true 
    let mvvlva = 1e7 + (move.getCapturedPiece() + 1)/(move.getPiece() + 1)  
    return mvvlva 
  } else if (move.hvalue) { 
    move.hmove = true 
    return move.hvalue  
  } else {  
    move.vmove = true 
    return Math.log(move.value)/20  
  } 
}


AI.sortMoves = function(moves, turn, ply, chessPosition, ttHash, pvMoveValue) {

  for (let i = 0, len = moves.length; i < len; i++) {
    let move = moves[i]
    if (ttHash && move.value === ttHash) move.tt = true

    if (pvMoveValue === move.value) {
      move.pv = true
    }

    // if (AI.PV[ply-2] && AI.PV[ply-2].getPiece() === move.getPiece()) move.samepiece = true

    move.hvalue = AI.history[turn][move.getPiece()][move.getTo()]

  }

  moves.sort((a, b) => {
      return AI.scoreMove(b, chessPosition) - AI.scoreMove(a, chessPosition)
  })

  return moves
}

AI.quiescenceSearch = function(chessPosition, alpha, beta, depth, ply, pvNode) {

    let turn = chessPosition.getTurnColor()
    let hashkey = chessPosition.hashKey.getHashKey()
    let legal = 0
    let stand_pat
    let bestmove
    let bestscore

    qsnodes++

    stand_pat = AI.evaluate(chessPosition, pvNode)

    if( stand_pat >= beta ) {
      return beta;
    }
    if( alpha < stand_pat ) alpha = stand_pat;

    // let moves = chessPosition.getMoves(false, !chessPosition.isKingInCheck())
    let moves = chessPosition.getMoves(false, true)

    moves = AI.sortMoves(moves, turn, ply, chessPosition, null, AI.PV[ply]? AI.PV[ply].value : null)

    for (let i=0, len=moves.length; i < len; i++) {
      if (chessPosition.makeMove(moves[i])) {
        legal++

        let score = -AI.quiescenceSearch(chessPosition, -beta, -alpha, depth-1, ply+1, pvNode)

        chessPosition.unmakeMove()

        if( score >= beta ) {
          AI.saveHistory(turn, moves[i], depth)
          return beta;
        }

        if( score > alpha ) {
          AI.saveHistory(turn, moves[i], depth)
          alpha = score
          bestmove = moves[i]
          bestscore = score
        }
      }
    }

    if (bestmove) {
      AI.PV[ply] = bestmove
      AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
    }

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

  let cutfactor = 0.1


  for (let color = 0; color < 2; color++) {
    for (let piece = 0; piece < 6; piece++) {
      let min = Math.min(...AI.history[color][piece])
      
      for (let to = 0; to < 64; to++) {
        AI.history[color][piece][to] = cutfactor*min + ((1 - cutfactor) * AI.history[color][piece][to]) | 0
      }
    }
  }
}

AI.saveHistory = function(turn, move, depth) {
  AI.history[turn][move.getPiece()][move.getTo()] += depth * depth
}

AI.PVS = function(chessPosition, alpha, beta, depth, ply) {
  let doTheTrick = false

  if ((new Date()).getTime() > AI.timer + 1000 * secondspermove) {
    if (iteration > mindepth) {
      AI.stop = true
    } else {
      doTheTrick = true
    }
  }


  let turn = chessPosition.getTurnColor()
  let pvNode = beta != (alpha + 1)

  var matingValue = AI.MATE - ply
  
  if (matingValue < beta) {
     beta = matingValue;
     if (alpha >= matingValue)
       return matingValue;
  }
  
  var matingValue = -AI.MATE + ply
  
  if (matingValue > alpha) {
     alpha = matingValue;
     if (beta <= matingValue)
       return matingValue;
  }


  let alphaOrig = alpha
  let hashkey = chessPosition.hashKey.getHashKey()
  let ttEntry = AI.ttGet(hashkey)

  //IID
  if (!ttEntry && depth > 2) {
    AI.PVS(chessPosition, alpha, beta, depth-2, ply)
    ttEntry = AI.ttGet(hashkey)
  }

  if( depth < 1 ) {
    if (ttEntry && ttEntry.depth < 1) {
      AI.saveHistory(turn, ttEntry.move, depth)
      return ttEntry.score
    } else {
      return AI.quiescenceSearch(chessPosition, alpha, beta, depth, ply, pvNode)
    }
  }

  let bestmove = {value: 2080,  getString() {return '-'}}

  if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === 0) {
        AI.PV[ply] = ttEntry.move
        return ttEntry.score          
      } else if (ttEntry.flag === -1) {
        if (ttEntry.score > alpha) alpha = ttEntry.score
      } else if (ttEntry.flag === 1) {
        if (ttEntry.score < beta) beta = ttEntry.score
      }

      if (alpha >= beta) {
        // fhf++; fh++
        AI.saveHistory(turn, ttEntry.move, depth)
        return ttEntry.score
      }
  }


  if (!AI.PV[ply] && ttEntry) {
    AI.PV[ply] = ttEntry.move
  } 

  let pvMoveValue = AI.PV[ply]? AI.PV[ply].value : null

  let moves = chessPosition.getMoves()
  moves = AI.sortMoves(moves, turn, ply, chessPosition, ttEntry? ttEntry.move.value : null, pvMoveValue)

  let legal = 0
  let bestscore = -Infinity
  let score

  if (AI.stop && iteration > mindepth) return alpha

  let incheck = chessPosition.isKingInCheck()
  
  let hmoves = 0
  
  for (let i=0, len=moves.length; i < len; i++) {
    let move = moves[i]
    let getPiece = AI.history[turn][move.getPiece()]
    let maxh = Math.max(...getPiece)
    let hmove = !!move.hmove
    let R = 0
    let E = 0    

    if (chessPosition.makeMove(move)) {
      legal++

      //EXTENSIONS
      if (incheck && depth < 3) {
        E = 1
      }

      //REDUCTIONS
      if (move.isCapture() || move.isPromotion() || move.isCastle()) {
        R += depth > 6? depth - 6 : 0
      } else {
        R += pvNode? (1 + depth/5 + i/20 | 0) : (1 + depth/3 + i/10 | 0)
      }

      if (legal === 1) {
        score = -AI.PVS(chessPosition, -beta, -alpha, depth+E-1, ply+1)
      }
      else {

        score = -AI.PVS(chessPosition, -alpha-1, -alpha, depth+E-R-1, ply+1)

        if (!AI.stop && score > alpha) {
          score = -AI.PVS(chessPosition, -beta, -alpha, depth+E-1, ply+1)
        }
      }
      
      chessPosition.unmakeMove()
      nodes++

      if (AI.stop) return alpha

      if (score > bestscore) {
        if (score > alpha) {
          if (score >= beta) {
            if (legal === 1) {
              fhf++
            }

            fh++
            AI.PV[ply] = moves[i]
            AI.ttSave(hashkey, score, -1, depth, moves[i])
            AI.saveHistory(turn, moves[i], depth)
            return score
          }
          
          AI.saveHistory(turn, moves[i], depth)
          alpha = score
        }

        bestscore = score
        bestmove  = moves[i]
      }
    }
  }

  if (ply === 1 && legal === 1) AI.stop = true

  if (legal === 0) {
      // stalemate, draw
      if (!chessPosition.isKingInCheck()) {
        AI.ttSave(hashkey, 0, 0, depth, bestmove)
        return 0
      }
      
      AI.ttSave(hashkey, -AI.MATE + ply, 0, depth, bestmove)
      return -AI.MATE + ply
      
  } else {

    if (chessPosition.isDraw()) {
      AI.ttSave(hashkey, 0, 0, depth, bestmove)
      
      return 0
    }

    if (bestscore > alphaOrig) {
      AI.PV[ply] = bestmove
      AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
      AI.saveHistory(turn, bestmove, depth)
      return bestscore
    } else {
      AI.ttSave(hashkey, alphaOrig, 1, depth, bestmove)
      return alphaOrig
    }
  }
  
}

AI.setStage = function (chessPosition, simple) {
  stage = 1
  let color = chessPosition.getTurnColor()

  if (AI.nofpieces <= 28 || chessPosition.madeMoves.length > 18) {
      stage = 2 //'midgame'
  }

  if (AI.nofpieces <= 18) {
    stage = 3 //endgame
  }

  if (stage < 3 || simple) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_MIDGAME]

  if (stage >= 3) {
    AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_ENDGAME]
  }
}

AI.getPV = function (chessPosition, length) {
  let PV = [chessPosition.getLastMove()]
  let legal = 0

  let ttEntry
  let ttFound

  for (let i = 0; i < length; i++) {
    ttFound = false
    let hashkey = chessPosition.hashKey.getHashKey()
    ttEntry = AI.ttGet(hashkey)

    if (ttEntry) {
      try {
        if (chessPosition.makeMove(ttEntry.move)) {
          ttFound = true
          legal++
          PV.push(ttEntry.move)
        }        
      } catch (err) {
        console.log('Illegal move')
        break
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

  if (chessPosition.madeMoves.length < 2) AI.createTables()

  AI.reduceHistory()

  return new Promise((resolve, reject) => {
    let color = chessPosition.getTurnColor()
    let white = color == 0
  
    if (white) {
        TESTER = true
    } else {
        TESTER = false
    }

    stage = 1 //Apertura

    nodes = 0
    qsnodes = 0
    enodes = 0
    iteration = 0

    AI.nofpieces = chessPosition.getOccupiedBitboard().popcnt()

    let staticeval = AI.evaluate(chessPosition)

    AI.timer = (new Date()).getTime()
    AI.stop = false

    let score = 0, lastscore = 0

    let status = 0

    AI.setStage(chessPosition)
  
    AI.PV = AI.getPV(chessPosition, 1)
    
    console.log('Last Principal Variation', AI.PV.map(e=>{ return e? e.getString() : '---'}).join(' '))
    console.info('                ')

    for (let depth = 1; depth <= (Math.max(totaldepth, AI.PV.length + 1)); depth+=1) {
        AI.bestmove = [...AI.PV][1]
        lastscore = score

        iteration++

        fh = fhf = 1
        
        score = (white? 1 : -1) * AI.PVS(chessPosition, -Infinity, Infinity, depth, 1)
        
        AI.PV = AI.getPV(chessPosition, iteration + 6)

        console.log(iteration, depth, AI.PV.map(e=>{ return e? e.getString() : '---'}).join(' '), '     |     FHF ' + Math.round(fhf*100/fh) + '%', score)

        if (!AI.PV[1]) continue

        let strmove = AI.PV[1]? AI.PV[1].getString() : '----'
        
        if (AI.stop && iteration > mindepth && AI.bestmove) {
            break
        }

    }
    
    if (!AI.bestmove) AI.bestmove = AI.PV[1]

    console.info('                ')
    console.log(nodes, ' nodes |', qsnodes,' QS nodes|')
    if (TESTER) {
      console.info('___________________________________ TESTER _____________________________________')
    } else {
      console.info('________________________________________________________________________________')
    }

    console.info('                ')

    resolve({move: AI.bestmove, score: lastscore})
  })
}

module.exports = AI