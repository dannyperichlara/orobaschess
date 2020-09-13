"use strict"

let Chess = require('./chess.js')

let AI = function() {

}

let TESTER = -1

//https://pdfs.semanticscholar.org/047f/6ee946c678c874029d8a3483c8a5f0f58666.pdf (Relación entre profundidad y ELO)
let totaldepth = 48
let secondspermove = 3
let n = 0
let nodes = 0
let qsnodes = 0
let enodes = 0
let mindepth = 6
let maxevaluation = 0
let random = 0
let fh, fhf = 0
let iteration
let stage = 1

// let pvtable = new Array(totaldepth + 1)

let htlength = 1e7

AI = function() {}

AI.createTables = function () {
  AI.history = [
          new Array(64).fill(new Array(64).fill(null)), //blancas
          new Array(64).fill(new Array(64).fill(null)) //negras
        ]
  AI.hashtable = new Array(htlength) //positions
}

AI.createTables()

AI.PIECE_VALUES = [100, 420, 450, 800, 1600, 20000]

AI.MATE = AI.PIECE_VALUES[Chess.Piece.KING]


console.log(AI.PIECE_VALUES)

AI.PSQT_POSITIONAL = [
    3, 5, 5, 9, 7, 3, 0, 1,
    8, 15, 11, 16, 13, 10, 6, 5,
    12, 17, 26, 28, 21, 24, 13, 11,
    19, 39, 35, 63, 58, 34, 37, 19,
    38, 32, 73, 100, 82, 58, 37, 34,
    22, 44, 81, 52, 68, 98, 48, 28,
    2, 15, 31, 57, 55, 26, 31, 10,
    5, 19, 37, 48, 38, 63, 46, 9,
]

AI.PSQT_OCCUPANCY = [
    1, 1, 1, 1, 0, 0, 0, 0,
    2, 2, 1, 1, 2, 2, 1, 1,
    3, 3, 2, 5, 3, 3, 1, 3,
    6, 9, 9, 14, 25, 6, 11, 7,
    19, 12, 22, 46, 51, 25, 14, 13,
    18, 27, 52, 23, 32, 58, 35, 26,
    77, 81, 58, 34, 35, 88, 100, 90,
    65, 33, 52, 63, 54, 59, 68, 46,
]

AI.PSQT_EMPTY = [
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,
]

AI.PSQT_PAWNS_KSC = [
    0,  0,  0,  0,  0,  0,  0,  0,
   50, 50, 50, 50,  0,  0,  0,  0,
   40, 40, 40, 40,  0,-50,-50,-50,
   30, 30, 30, 30,  0,-80,-80,-80,
   20, 20, 20, 40, 40,-50,-50,-50,
   10, 10, 10, 10, 50,  0,  0,  0,
    0,  0,  0,  0,  0, 20, 40, 20,
    0,  0,  0,  0,  0,  0,  0,  0,

]

AI.PSQT_PAWNS_QSC = [
    0,  0,  0,  0,  0,  0,  0,  0,
     0,  0,  0,  0, 50, 50, 50, 50,
     0,-50,-50,-50, 40, 40, 40, 40,
     0,-80,-80,-80, 30, 30, 30, 30,
     0,-50,-50, 40, 40, 20, 20, 20,
     0,  0, 50, 20, 10, 10, 10, 10,
    20, 40, 40,  0,  0,  0,  0,  0,
     0,  0,  0,  0,  0,  0,  0,  0,

]

AI.PSQT_KNIGHTS_KSC = [
    -50,-40,-30,-30,  0,  0,  0,  0,
    -40,-20,  0,  0,  0,  0,  0,  0,
    -30,-20, 10, 15, 15, 10,  0,  0,
    -30,-20, 15, 20, 20, 15,  5,  0,
    -30,-20, 15, 20, 20, 15,  0,  0,
    -30,-20,-20,-20,-20,-20,-20,-30,
    -40,-20,-20,-20,-20,-20,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ]


AI.PSQT_KNIGHTS_QSC = [
      0,  0,  0,-30,-30,-30,-40,-50,
      0,  0,  0,  0,  0,  0,-20,-40,
      0,  0, 10, 15, 15, 10,-20,-30,
      0,  5, 15, 20, 20, 15,-20,-30,
      0,  0, 15, 20, 20, 15,-20,-30,
    -30,-20,-20,-20, 15, 10,-20,-30,
    -40,-20,-20,-20,-20,-20,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
]


AI.PSQT_BISHOP_KSC = [
    -20,-20,-20,-20,-20,-20,-20,-20,
    -20,-20,-20,  0,  0,  0,  0,-20,
    -20,-20,  5, 20, 20,  5,  0,-20,
    -20,-20,  5, 20, 20,  5,  5,-20,
    -20,  0, 20, 20, 20, 20,-20,-20,
    -20, 20, 20, 20, 20,-20,-20,-20,
    -20, 20, 20,  0,  0,-20,-20,-20,
    -20,-20,-20,-20,-20,-20,-20,-20,
]

AI.PSQT_BISHOP_QSC = [
    -20,-20,-20,-20,-20,-20,-20,-20,
    -20,  0,  0,  0,  0,  0,  0,-20,
    -20,  0,  5, 20, 20,  5,  0,-20,
    -20,  5,  5, 20, 20,  5,  5,-20,
    -20,  0, 20, 20, 20, 20,  0,-20,
    -20,-20,-20, 20, 20,-20, 20,-20,
    -20,-20,-20,  0,  0, 20, 20,-20,
    -20,-20,-20,-20,-20,-20,-20,-20,
]

AI.PSQT_ROOK_KSC = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 50, 50, 50, 50, 50, 50, 50,
  0,  0,  0, 20, 50, 50, 50, 50,
  0,  0,  0, 20, 50, 50, 50, 50,
  0,  0, -50, 20, 50, 50, 50, 50,
  0, -50,-50, 20, 50, 50, 50, 50,
-50, -50,-50,20, 50, 50, 50, 50,
-50, -50,-80,0,0,-50,-100,50,
]
AI.PSQT_ROOK_QSC = [
  0,  0,  0,  0,  0,  0,  0,  0,
 50, 50, 50, 50, 50, 50, 50, 50,
 50, 50, 50, 50, 20,  0,  0,  0,
 50, 50, 50, 50, 20,  0,  0,  0,
 50, 50, 50, 50, 20,  0,  0,  0,
 50, 50, 50, 50, 20,  0,-50,  0,
 50, 50, 50, 50, 20,-50, -50,-50,
-50, -50,-80, 0,  0,-50,-100,-50,
]

AI.PSQT_ENEMY_KING = [
   50, 50, 20, 20, 20, 20, 50, 50,
   50, 50,-20,-20,-20,-20, 50, 50,
   20,-20,-20,-20,-20,-20,-20, 20,
   20,-20,-90,-90,-90,-90,-20, 20,
   20,-20,-90,-90,-90,-90,-20, 20,
   20,-20,-20,-20,-20,-20,-20, 20,
   50, 50,-20,-20,-20,-20, 50, 50,
   50, 50, 20, 20 ,20, 20, 50, 50,
]

AI.PIECE_SQUARE_TABLES_MIDGAME = [
// Pawn (Hans Berliner)
    [ 
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
   -10,  0,  0, 40, 40,  0,  0,-10,
     5, -5,-10,-20,-20,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
    ],

    // Knight
    [ 
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 20, 40, 40, 20,  5,-30,
    -30,  0, 15, 30, 30, 15,  0,-30,
    -80,  5, 20, 15, 15, 20,  5,-80,
    -40,-20,  0, 20, 20,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
    ],
    // Bishop
  [ 
  -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5, 10, 10, 10, 10,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10,-20,-20,-20,-20, 10,-10,
    -10, 20,  0,  0,  0,  0, 20,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  // Rook
  [ 
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 50, 50, 50, 50, 50, 50,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -50,  0,  0,  0,  0,  0,  0, -100,
  0, -20,-80,  5,  5,  0,-80, -50
  ],

  // Queen
  [ 
 -20,-10,-10, -5, -5,-10,-10,-20,
-10,  0,  0,  0,  0,  0,  0,-10,
-10,  0,  5,  5,  5,  5,  0,-10,
 -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
-10,  5,  5,  5,  5,  5,  0,-10,
-10,  0,  5, 20, 20,  0,  0,-10,
-20,-10,-10, -5, -5,-10,-10,-20
  ],

  // King
  [ 

  -30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-20,-30,-30,-40,-40,-30,-30,-20,
-10,-20,-20,-20,-20,-20,-20,-10,
 20, 20,-200,-200,-200,-200, 20, 20,
 20,100,50,-200,  0, -50,100, 20

  ]

  ]

AI.PIECE_SQUARE_TABLES_ENDGAME = [
    // pawn
    [
        1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 
       260,260,260,260,260,260,260,260,
       120,120,120,120,120,120,120,120,
        80, 80, 80, 80, 80, 80, 80, 80,
        50, 50, 50, 50, 50, 50, 50, 50,
        20, 20, 20, 20, 20, 20, 20, 20,
         0,  0,  0,  0,  0,  0,  0,  0,
         0,  0,  0,  0,  0,  0,  0,  0,
    ],
    // Knight
    [ 
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
    ],
        // Bishop
      [ 
      -20,-10,-10,-10,-10,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5, 10, 10,  5,  0,-10,
        -10,  5,  5, 10, 10,  5,  5,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10, 10, 10, 10, 10, 10, 10,-10,
        -10,  5,  0,  0,  0,  0,  5,-10,
        -20,-10,-10,-10,-10,-10,-10,-20,
      ],
      // Rook
      [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 40, 40, 40, 40, 40, 40,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0
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

AI.BISHOP_PAIR_VALUE = AI.PIECE_VALUES[Chess.Piece.PAWN] / 2

AI.bitCount = function(n) {
    n = n - ((n >> 1) & 0x55555555)
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

AI.kingSafety = function(chessPosition, color) {
    let safety = 0

    if (chessPosition.canCastle(color, true, true) || chessPosition.canCastle(color, false, true)) {
        // safety -=100
    } else {
        //Rey seguro (Concepto: ataca sus propias piezas)
        let pieces = chessPosition.getColorBitboard(color)
        let king = chessPosition.getPieceColorBitboard(5, color)
        let kingmask = Chess.Position.makeKingAttackMask(color, king)
        safety += AI.bitCount(kingmask.low & pieces.low) + AI.bitCount(kingmask.high & pieces.high)
    }

    return safety
}

AI.underthreat = function (chessPosition, color) {
    let attackedpieces = 0
    for (let i = 0; i < 5; i++) {
        attackedpieces += chessPosition.isAttacked(color, i)
    }

    return attackedpieces
} 

AI.undevelopedPieces = function(chessPosition, color) {
    let knights = chessPosition.getPieceColorBitboard(1, color)
    let bishops = chessPosition.getPieceColorBitboard(2, color)
    // let rooks = chessPosition.getPieceColorBitboard(3, color)
    let row, undeveloped

    if (color == 0) {
        row = 255
        undeveloped = AI.bitCount(knights.low & row) + AI.bitCount(bishops.low & row)

    } else {
        row = 4278190080
        undeveloped = AI.bitCount(knights.high & row) + AI.bitCount(bishops.high & row)

    }

    return undeveloped
}

AI.pawnstructure = function(chessPosition, color) {
    let score = 0

    let local = color == 0 ? 'low' : 'high'
    let foreign = color == 0 ? 'high' : 'low'
    let pawns = chessPosition.getPieceColorBitboard(0, color)
    let pawnsmask = Chess.Position.makePawnAttackMask(color, pawns)
    let structure = AI.bitCount(pawnsmask.low & pawns.low) + AI.bitCount(pawnsmask.high & pawns.high)

    return structure
}

AI.doubledPawns= function (chessPosition, color) {
    //Peones doblados
    let doubledPawns = (AI.bitCount(2155905152 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 1 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 1 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 2 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 2 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 3 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 3 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 4 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 4 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 5 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 5 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 6 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 6 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 7 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 7 & chessPosition.getPieceColorBitboard(0, color).high) > 1)
    return doubledPawns
}

AI.kingInOpenedColumns = function(chessPosition, color) {
    if (stage == 3) return 0
    //Rey en columnas semiabiertas
    let local = color == 0 ? 'low' : 'high'
    let occupied = chessPosition.getOccupiedBitboard()[local]
    let opencolumns = 0
    opencolumns += (AI.bitCount(occupied & 2155905152) == AI.bitCount(chessPosition.getPieceColorBitboard(5, 0)[local] & 2155905152)) && AI.bitCount(occupied & 2155905152) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 1) == AI.bitCount(chessPosition.getPieceColorBitboard(5, 0)[local] & 2155905152 >>> 1)) && AI.bitCount(occupied & 2155905152 >>> 1) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 2) == AI.bitCount(chessPosition.getPieceColorBitboard(5, 0)[local] & 2155905152 >>> 2)) && AI.bitCount(occupied & 2155905152 >>> 2) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 3) == AI.bitCount(chessPosition.getPieceColorBitboard(5, 0)[local] & 2155905152 >>> 3)) && AI.bitCount(occupied & 2155905152 >>> 3) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 4) == AI.bitCount(chessPosition.getPieceColorBitboard(5, 0)[local] & 2155905152 >>> 4)) && AI.bitCount(occupied & 2155905152 >>> 4) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 5) == AI.bitCount(chessPosition.getPieceColorBitboard(5, 0)[local] & 2155905152 >>> 5)) && AI.bitCount(occupied & 2155905152 >>> 5) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 6) == AI.bitCount(chessPosition.getPieceColorBitboard(5, 0)[local] & 2155905152 >>> 6)) && AI.bitCount(occupied & 2155905152 >>> 6) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 7) == AI.bitCount(chessPosition.getPieceColorBitboard(5, 0)[local] & 2155905152 >>> 7)) && AI.bitCount(occupied & 2155905152 >>> 7) == 1

    return opencolumns
},

AI.rookInOpenedColumns = function(chessPosition, color) {
    if (stage == 3) return 0
    //Torres en columnas semiabiertas
    let local = color == 0 ? 'low' : 'high'
    let occupied = chessPosition.getOccupiedBitboard()[local]
    let freerook = 0
    freerook += (AI.bitCount(occupied & 2155905152) == AI.bitCount(chessPosition.getPieceColorBitboard(3, 0)[local] & 2155905152)) && AI.bitCount(occupied & 2155905152) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 1) == AI.bitCount(chessPosition.getPieceColorBitboard(3, 0)[local] & 2155905152 >>> 1)) && AI.bitCount(occupied & 2155905152 >>> 1) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 2) == AI.bitCount(chessPosition.getPieceColorBitboard(3, 0)[local] & 2155905152 >>> 2)) && AI.bitCount(occupied & 2155905152 >>> 2) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 3) == AI.bitCount(chessPosition.getPieceColorBitboard(3, 0)[local] & 2155905152 >>> 3)) && AI.bitCount(occupied & 2155905152 >>> 3) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 4) == AI.bitCount(chessPosition.getPieceColorBitboard(3, 0)[local] & 2155905152 >>> 4)) && AI.bitCount(occupied & 2155905152 >>> 4) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 5) == AI.bitCount(chessPosition.getPieceColorBitboard(3, 0)[local] & 2155905152 >>> 5)) && AI.bitCount(occupied & 2155905152 >>> 5) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 6) == AI.bitCount(chessPosition.getPieceColorBitboard(3, 0)[local] & 2155905152 >>> 6)) && AI.bitCount(occupied & 2155905152 >>> 6) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 7) == AI.bitCount(chessPosition.getPieceColorBitboard(3, 0)[local] & 2155905152 >>> 7)) && AI.bitCount(occupied & 2155905152 >>> 7) == 1

    return freerook
},

AI.advancedpawns = function(chessPosition, color) {
    let white = color == 0
    let score = 0
    let local = white ? 'low' : 'high'
    let foreign = white ? 'high' : 'low'

    return (AI.bitCount(4294967295 & chessPosition.getPieceColorBitboard(0, color)[foreign]))
}



AI.getMaterialValue = function(chessPosition, color) {
    let value = 0

    for (let piece = 0, len = AI.PIECE_VALUES.length; piece < len; piece++) {
        value += chessPosition.getPieceColorBitboard(piece, color).popcnt() * AI.PIECE_VALUES[piece]
    }

    return value + Math.random() * random - random/2
}

AI.getPieceSquareValue = function(chessPosition, color) {
    let value = 0
    let extravalue = 0

    for (let piece = 0, len = AI.PIECE_SQUARE_TABLES.length; piece < len; piece++) {
        let pieces = chessPosition.getPieceColorBitboard(piece, color).dup()

        while (!pieces.isEmpty()) {
            let index = pieces.extractLowestBitPosition()
            value += AI.PIECE_SQUARE_TABLES[piece][color ? index : (56 ^ index)]
        }
    }

    //Rewards enemy king in the corner
    if (stage > 2) {
      let enemyking = chessPosition.getPieceColorBitboard(5, !color).dup()
      let ekindex = enemyking.extractLowestBitPosition()
      extravalue += AI.PSQT_ENEMY_KING[color ? ekindex : (56 ^ ekindex)]     
    }

    return value + extravalue
}

AI.getPositionalPSQTValue = function(chessPosition, color) {
    let value = 0
    let allpieces = [0,1,2,3] //K, B, R
    for (let piece = 0, len = allpieces.length; piece < len; piece++) {
        let pieces = chessPosition.getPieceColorBitboard(piece, color).dup()

        while (!pieces.isEmpty()) {
            let index = pieces.extractLowestBitPosition()
            value +=  AI.PSQT_POSITIONAL[color ? index : (56 ^ index)]
        }
    }

    return value
}

AI.getOccupationalPSQTValue = function(chessPosition, color) {
    let value = 0
    let pieces = chessPosition.getColorBitboard(color).dup()

    while (!pieces.isEmpty()) {
        let index = pieces.extractLowestBitPosition()
        value +=  AI.PSQT_OCCUPANCY[color ? index : (56 ^ index)]
    }

    return value
}

AI.makePawnPositionalMask = function(color, pawns, empty) {
    let white = (color === 0)
    let positional = pawns.dup().shiftLeft(white ? 8 : -8).and(empty)
    let doublePush = pawns.dup().and(Chess.Bitboard.RANKS[white ? 1 : 6]).shiftLeft(white ? 16 : -16).and(empty).and(empty.dup().shiftLeft(white ? 8 : -8))
    let mask = positional.or(doublePush)
    return mask
}

AI.mobility = function(chessPosition, color) {
    let us = chessPosition.getColorBitboard(color)
    let enemy = chessPosition.getColorBitboard(!color)
    let empty = chessPosition.getEmptyBitboard().dup()//.and(enemy)
    let knights = chessPosition.getPieceColorBitboard(Chess.Piece.KNIGHT, color).dup()
    let queens = chessPosition.getPieceColorBitboard(Chess.Piece.QUEEN, color)
    let bishopqueen = chessPosition.getPieceColorBitboard(Chess.Piece.BISHOP, color).dup().or(queens)
    let rookqueen = chessPosition.getPieceColorBitboard(Chess.Piece.ROOK, color).dup().or(queens)

    let mobility = 0

    while (!knights.isEmpty()) {
        mobility += Chess.Bitboard.KNIGHT_MOVEMENTS[knights.extractLowestBitPosition()].dup().popcnt()
    }

    mobility += Chess.Position.makeBishopAttackMask(bishopqueen, empty).dup().popcnt()
    mobility += Chess.Position.makeRookAttackMask(rookqueen, empty).dup().popcnt()

    return mobility
}

AI.xrays = function (chessPosition, color) {

    let fromBB = chessPosition.getPieceColorBitboard(Chess.Piece.BISHOP, color)
    let bishopslidingmask = chessPosition.makeBishopAttackMask(fromBB, false)

    let fromRR = chessPosition.getPieceColorBitboard(Chess.Piece.ROOK, color)
    let rookslidingmask = chessPosition.makeRookAttackMask(fromRR, false)

    let enemyrook = chessPosition.getPieceColorBitboard(Chess.Piece.ROOK, !color)
    let enemyqueen = chessPosition.getPieceColorBitboard(Chess.Piece.QUEEN, !color)
    let enemyking = chessPosition.getPieceColorBitboard(Chess.Piece.KING, !color)

    let opponentmajor = enemyrook.low | enemyqueen.low | enemyking.low | enemyrook.high | enemyqueen.high | enemyking.high

    let fromQQ = chessPosition.getPieceColorBitboard(Chess.Piece.QUEEN, color)
    let qbishopslidingmask = chessPosition.makeBishopAttackMask(fromQQ, false)
    let qrookslidingmask = chessPosition.makeRookAttackMask(fromQQ, false)

    let xrayed = AI.bitCount((bishopslidingmask.low | bishopslidingmask.high | rookslidingmask.low | rookslidingmask.high) & opponentmajor)
    xrayed += AI.bitCount((qbishopslidingmask.low | qbishopslidingmask.high | qrookslidingmask.low | qrookslidingmask.high) & (enemyking.low | enemyking.high | enemyqueen.low | enemyqueen.high))

    return xrayed
}

AI.openedColumns = function (chessPosition, color) {
  if (stage === 3) return 0
  //Columnas semiabiertas
  let local = color == 0 ? 'low' : 'high'
  let pawns = chessPosition.getPieceColorBitboard(0, color)[local]
  let openedColumns = 0
  openedColumns += (AI.bitCount(pawns & 2155905152) === 0)
  openedColumns += (AI.bitCount(pawns & 2155905152 >>> 1) === 0)
  openedColumns += (AI.bitCount(pawns & 2155905152 >>> 2) === 0)
  openedColumns += (AI.bitCount(pawns & 2155905152 >>> 3) === 0)
  openedColumns += (AI.bitCount(pawns & 2155905152 >>> 4) === 0)
  openedColumns += (AI.bitCount(pawns & 2155905152 >>> 5) === 0)
  openedColumns += (AI.bitCount(pawns & 2155905152 >>> 6) === 0)
  openedColumns += (AI.bitCount(pawns & 2155905152 >>> 7) === 0)

  return openedColumns
}

AI.getCenterControlValue = function (chessPosition, color) {
  let pawns = chessPosition.getPieceColorBitboard(0, color)
  let pawnsmask = Chess.Position.makePawnAttackMask(color, pawns)
  let mypieces = chessPosition.getColorBitboard(color)

  let bishops = chessPosition.getPieceColorBitboard(Chess.Piece.BISHOP, color)
  let bishopslidingmask = chessPosition.makeBishopAttackMask(bishops, mypieces)

  let rooks = chessPosition.getPieceColorBitboard(Chess.Piece.ROOK, color)
  let rookslidingmask = chessPosition.makeRookAttackMask(rooks, mypieces)

  let queen = chessPosition.getPieceColorBitboard(Chess.Piece.QUEEN, color)
  let qbishopslidingmask = chessPosition.makeBishopAttackMask(queen, mypieces)
  let qrookslidingmask = chessPosition.makeRookAttackMask(queen, mypieces)

  let clow = 402653184
  let chigh = 24

  let centercontrol = 0

  centercontrol += AI.bitCount((pawnsmask.low | pawnsmask.high) & (chigh | clow))
  centercontrol += AI.bitCount((pawns.low | pawns.high) & (chigh | clow))

  centercontrol += AI.bitCount((bishops.low | bishops.high) & (chigh | clow))
  centercontrol += AI.bitCount((bishopslidingmask.low | bishopslidingmask.high) & (chigh | clow))

  centercontrol += AI.bitCount((rooks.low | rooks.high) & (chigh | clow))
  centercontrol += AI.bitCount((rookslidingmask.low | rookslidingmask.high) & (chigh | clow))

  centercontrol += AI.bitCount((queen.low | queen.high) & (chigh | clow))
  centercontrol += AI.bitCount((qbishopslidingmask.low | qbishopslidingmask.high | qrookslidingmask.low | qrookslidingmask.high) & (chigh | clow))

  return centercontrol
}

AI.isKingCastled = function (chessPosition, color) {
  // 7 224
  let white = color === 0
  let ks = white? 224 : 3758096384
  let qs = white? 7 : 117440512
  let king = chessPosition.getPieceColorBitboard(5, color)[white? 'low' : 'high']

  if (king & ks) return 1
  if (king & qs) return 2

  return 0
}

AI.betas = [
  1 /*material*/,
  1 /*psqt*/,
  10 /*mobility*/,
  80 /*isKingCastled*/,
  80 /*doubledPawns*/,
  40 /*openedColumns*/,
  80 /*kinginopenedcolumn*/,
  80 /*rookinopenedcolumn*/,
  80 /*advancedpawns*/,
  50 /*pawnequality*/,
  80 /*undeveloped*/,
  30 /*pawnstructure*/,
  30 /*xrayed*/,
  20 /*center*/
]

AI.evaluate = function(chessPosition, pvNode) {
    let evaluation = 0
    let color = chessPosition.getTurnColor()
    let positional = 0

    let material = AI.getMaterialValue(chessPosition, color) - AI.getMaterialValue(chessPosition, !color)
    let psqt = 0
    psqt = AI.getPieceSquareValue(chessPosition, color) - AI.getPieceSquareValue(chessPosition,  !color)

    if (pvNode) {
      let centerControl = stage < 3? AI.getCenterControlValue(chessPosition, color) - AI.getCenterControlValue(chessPosition, !color) : 0
      let mobility =  AI.mobility(chessPosition, color) - AI.mobility(chessPosition, !color) // (CORRECTO)
      let pawnstructure = AI.pawnstructure(chessPosition, color) - AI.pawnstructure(chessPosition, !color) // (INCORRECTO)
      let xrayed = AI.xrays(chessPosition, color) - AI.xrays(chessPosition, !color)
      let pawnequality = (chessPosition.getPieceColorBitboard(0, color).dup().popcnt() - chessPosition.getPieceColorBitboard(0, !color).dup().popcnt()) //(CORRECTO)
      let advancedpawns = AI.advancedpawns(chessPosition, color) - AI.advancedpawns(chessPosition, !color) // (CORRECTO)
      let rookinopenedcolumn = AI.rookInOpenedColumns(chessPosition, color) - AI.rookInOpenedColumns(chessPosition, !color) //(CORRECTO)
      let isKingCastled = !!AI.isKingCastled(chessPosition, color) - !!AI.isKingCastled(chessPosition, !color)
      let doubledPawns = AI.doubledPawns(chessPosition, color) - AI.doubledPawns(chessPosition, !color)
      let openedColumns = AI.openedColumns(chessPosition, color) - AI.openedColumns(chessPosition, !color)

      let kinginopenedcolumn = stage < 3? AI.kingInOpenedColumns(chessPosition, color) - AI.kingInOpenedColumns(chessPosition, !color) : 0 // (CORRECTO)
      let undeveloped = AI.undevelopedPieces(chessPosition, color) - AI.undevelopedPieces(chessPosition, !color)
      positional += AI.betas[2]*mobility + AI.betas[3]*isKingCastled + AI.betas[7]*rookinopenedcolumn + AI.betas[13] * centerControl
      positional += AI.betas[8]*advancedpawns + AI.betas[9]*pawnequality + AI.betas[11]*pawnstructure + AI.betas[12] * xrayed
      positional += -AI.betas[4]*doubledPawns - AI.betas[5]*(openedColumns > 2? openedColumns : 0) - AI.betas[6]*kinginopenedcolumn - AI.betas[10]*undeveloped      
      
      positional = 200/(1 + Math.exp(-positional/50)) - 100
    }


    // console.log(positional)

    psqt = 200/(1 + Math.exp(-psqt/50)) - 100


    return material + 0.25 * psqt + 0.75 * positional | 0
}

AI.scoreMove = function(move, chessPosition) {
    let score = 0

    if (move.pv) {
      score += 1e9
    } else {
      if (chessPosition) {
          let hashKey = chessPosition.hashKey.getHashKey()
          let position = AI.hashtable[hashKey % htlength]
          if (position && position.move && position.move.value === move.value) {
              score += 1e7 + position.alpha
              move.hk = true
          }
      }

      if (move.isCapture()) {
        move.capture = true

        if (move.getCapturedPiece() > move.getPiece()) {
            score += 1e6 + (1 + move.getCapturedPiece()) / (1 + move.getPiece())
            move.greater=true
        } else if (move.getCapturedPiece() == move.getPiece()) {
            score += 1e5 + (1 + move.getCapturedPiece()) / (1 + move.getPiece())
            move.equal=true
        } else {
            score = 1e4 + (1 + move.getCapturedPiece()) / (1 + move.getPiece())
            move.lesser=true
        }

      }

      let hm = AI.history[chessPosition.getTurnColor()][move.getFrom()][move.getTo()]
      
      if (hm) {
        move.hm = true
        score += 1e3 + hm
      }      
    }

    move.score = score

    return score
}

AI.sortMoves = function(moves, pv, chessPosition) {


    
    for (let i = 0, len = moves.length; i < len; i++) {
        if (pv && moves[i].value === pv.value) moves[i].pv = true
    }

    moves.sort((a, b) => {
        return AI.scoreMove(b, chessPosition) - AI.scoreMove(a, chessPosition)
    })

    // console.log(moves)

    return moves
}

AI.sortMovesByScore = function(moves, chessPosition) {

    for (let i = 0, len=moves.length; i < len; i++) {
        if (chessPosition.makeMove(moves[i])) {
            moves[i].score = AI.evaluate(chessPosition)
            chessPosition.unmakeMove()            
        }
    }

    moves.sort((a, b) => {
        return b.score - a.score
    })


    return moves
}

AI.quiescenceSearch = function(chessPosition, alpha, beta, depth, ply, pvNode) {
    qsnodes++

    if (chessPosition.isDraw()) return 0 // always assume the draw will be claimed

    let turn = chessPosition.getTurnColor()

    let standPatValue = AI.evaluate(chessPosition, pvNode)

    if (standPatValue >= beta) return beta

    if( alpha < standPatValue ) alpha = standPatValue;

    let moves = AI.sortMoves(chessPosition.getMoves(false, !chessPosition.isKingInCheck()), AI.PV[iteration - 1][ply], chessPosition)

    let value = -Infinity
    let legal = 0

    for (let i = 0, len = moves.length; i < len; i++) {

        if (chessPosition.makeMove(moves[i])) {
          legal++
            value = Math.max(value, -AI.quiescenceSearch(chessPosition, -beta, -alpha, depth - 1, ply + 1, pvNode))
            chessPosition.unmakeMove()

            if (value >= beta) {
              AI.history[turn][moves[i].getFrom()][moves[i].getTo()] += Math.pow(2, depth)
              AI.PV[iteration][ply] = moves[i]

              if (legal == 1) fhf++
              fh++
              return value
            }
        }
    }

    
    if (chessPosition.isKingInCheck() && legal === 0) {
    
       return -AI.MATE + ply;
    }

    return alpha
}

AI.simulate = function (chessPosition, color, simulations) {

    let wins = 0

    for (let s = 0; s < simulations; s++) {
        let n = 0
        
        while (chessPosition.getStatus() == 0) {
            let moves = AI.sortMoves(chessPosition.getMoves(false, false), null, chessPosition)

            if (chessPosition.makeMove(moves[0])) {
                n++
            }
        }

        if (chessPosition.getStatus() > 0 && chessPosition.getTurnColor() != color) {
            wins++
        }

        for (let i = 0; i < n; i++) {
            chessPosition.unmakeMove()
        }        
    }

    return wins / simulations * 100

}



AI.transpositionTableStore = function (hashKey, ttEntry, chessPosition) {

    ttEntry.Zobrist = hashKey

    if (ttEntry.depth < 0) ttEntry.depth = 0

    let entry = AI.hashtable[hashKey % htlength]

    if (ttEntry.flag == 0 || (!entry)) {
      AI.hashtable[hashKey % htlength] = ttEntry
    }
}

AI.transpositionTableLookup = function(hashKey, chessPosition) {

  return AI.hashtable[hashKey % htlength]
}

AI.negascout = function(chessPosition, depth, alpha, beta, ply) {
    nodes++

    if ((new Date()).getTime() > AI.timer + 1000 * secondspermove && iteration > mindepth) AI.stop = true

    let alphaOrig = alpha
    let turn = chessPosition.getTurnColor()

    let pvNode = beta != (alpha + 1)
    let pvMove

    let bestMove
    let hashkey = chessPosition.hashKey.getHashKey()

    //(* Transposition Table Lookup; node is the lookup key for ttEntry *)
    let ttEntry = AI.transpositionTableLookup(hashkey, chessPosition)

    let hashMove = false

    if (ttEntry && hashkey == ttEntry.Zobrist) {
      hashMove = true
    } else {
      //IID
      // console.log('si')
      if (depth > 3 && pvNode) {
        AI.negascout(chessPosition, depth-2, alpha, beta, ply)
        ttEntry = AI.transpositionTableLookup(hashkey, chessPosition)
        if (ttEntry && chessPosition.hashKey.getHashKey() == ttEntry.Zobrist) {
          hashMove = true
        }
      }
    }

    if (hashMove) {
      if (ttEntry.turn == turn && ttEntry.depth >= depth) {
        if (ttEntry.flag == 0 ) {
            AI.PV[iteration][ply] = ttEntry.move
            return ttEntry.alpha
        } else if (ttEntry.flag == -1 ) {
            alpha = Math.max(alpha, ttEntry.alpha)
        } else if (ttEntry.flag == 1 ) {
            beta = Math.min(beta, ttEntry.alpha)
        }

        if (alpha >= beta) {
      // console.log('hm')
            AI.PV[iteration][ply] = ttEntry.move
            return ttEntry.alpha
        }        
      }
    }

    if (depth < 1) return AI.quiescenceSearch(chessPosition, alpha, beta, depth, ply, pvNode)

    let moves = chessPosition.getMoves(false, false)

    moves = AI.sortMoves(moves, AI.PV[iteration - 1][ply], chessPosition)

    if (!bestMove) bestMove = moves[0]

    // console.log(moves)

    let totalmoves = moves.length

    // console.log(moves)

    let legal = 0
    let a //= alpha
    let b = beta

    let saveTT = function (alpha, beta, depth, move, turn) {
      if (depth<0) depth = 0
      /*(* Transposition Table Store; node is the lookup key for ttEntry *)*/
      ttEntry = {
          alpha,
          depth,
          move,
          turn
      }

      if (alpha <= alphaOrig) {
          ttEntry.flag = 1
      } else if (alpha >= beta){
          ttEntry.flag = -1
      } else {
          ttEntry.flag = 0
      }

      AI.transpositionTableStore(chessPosition.hashKey.getHashKey(), ttEntry, chessPosition)      
    }


    for (let i = 0, len = moves.length; i < len; i++) {
        let reduction = 0
        let extension = 0

        if (chessPosition.makeMove(moves[i])) {
          legal++

          //LMP
          if (stage < 3 && !chessPosition.isKingInCheck() && depth >= 3 && legal > depth * 5) {  
           chessPosition.unmakeMove()
           continue
          }

             //Extensions
            if (chessPosition.isKingInCheck() && pvNode) extension = 1


            //Late Move Reductions
            if (depth >= 3 && !chessPosition.isKingInCheck()) { //CORRECTO
              reduction = 1 + depth/5 + legal/20
              // console.log(depth, depth - reduction)
            }
          
            //History prunning
            if (!pvNode && stage < 3 && legal > 1) {
                if (!chessPosition.isKingInCheck() && depth <= iteration/3 | 0) {
                    let score = AI.history[turn][moves[i].getFrom()][moves[i].getTo()] // history score
                    if (score && score <=128) {
                        reduction += 2
                        if (score <=64) {
                          chessPosition.unmakeMove()
                          continue; // History Leaf pruning
                        }
                    }
                }
            }

            if (legal == 1) {
              a = -AI.negascout(chessPosition, depth - 1 + extension, -b, -alpha, ply + 1)
            } else {
              a = -AI.negascout(chessPosition, depth - 1 - reduction + extension, -b, -alpha, ply + 1)

              if (a > alpha && reduction > 0) { // (CORRECTO)
                  a = -AI.negascout(chessPosition, depth - 1 + extension, -b, -alpha, ply + 1)
              }
            }
            
            chessPosition.unmakeMove()


            if (a > alpha) {
                alpha = a
                bestMove = moves[i]
                AI.PV[iteration][ply] = bestMove
                AI.history[turn][moves[i].getFrom()][moves[i].getTo()] += depth*depth
                saveTT(alpha, beta, depth, moves[i], turn)
            }
            
            
            if (alpha >= beta) {

                AI.history[turn][moves[i].getFrom()][moves[i].getTo()] += depth*depth

                if (legal == 1) fhf++
                fh++
                bestMove = moves[i]
                AI.PV[iteration][ply] = bestMove

                saveTT(alpha, beta, depth, moves[i], turn)
                return alpha
            }

            if (alpha >= b) {
                chessPosition.makeMove(moves[i])

                alpha = -AI.negascout(chessPosition, depth - 1, -beta, -alpha, ply + 1)

                chessPosition.unmakeMove()

                if (alpha >= beta) {
                    // AI.history[turn][moves[i].getFrom()][moves[i].getTo()] += Math.pow(2, depth)

                    if (legal == 1) fhf++
                    fh++
                    // bestMove = moves[i]
                    // AI.PV[iteration][ply] = bestMove

                    // saveTT(alpha, beta, depth, moves[i], turn)

                    return alpha
                }
            }

            if (Chess.AI.stop && legal > 1) return a
            
            b = alpha + 1
        }
    }

    

    if (legal === 0) {
        // stalemate, draw
        if (!chessPosition.isKingInCheck()) return 0

        return -AI.MATE
    }
    
    // always assume the draw will be claimed
    if (chessPosition.isDraw()) return 0
    
    AI.PV[iteration][ply]=bestMove

    // console.log(AI.PV[iteration].map(e=>e.getString()))

    if (!bestMove.isCapture()) AI.history[turn][bestMove.getFrom()][bestMove.getTo()] += depth*depth

    return alpha

}

AI.calcELO = function(chessPosition, color) {
    let valueO = 0, valueP = 0
    let nofpieces = chessPosition.getColorBitboard(color).popcnt()

    let pieces = chessPosition.getColorBitboard(color).dup()
    while (!pieces.isEmpty()) {
        let index = pieces.extractLowestBitPosition()
        valueO += AI.PSQT_OCCUPANCY[color ? index : (56 ^ index)]
    }

    let pieces2 = chessPosition.getColorBitboard(color).dup()
    while (!pieces2.isEmpty()) {
        let index = pieces2.extractLowestBitPosition()
        valueP += AI.PSQT_POSITIONAL[color ? index : (56 ^ index)]
    }

    // console.log(valueO, valueP)

    return 0.5*valueO * 1.8 * 16 / nofpieces    +     0.5*valueP * 1.5 * 16 / nofpieces
}

AI.search = function(chessPosition, options) {

  if (!chessPosition.madeMoves.length) AI.createTables()

    if (options.secondspermove) secondspermove = options.secondspermove
    if (options.totaldepth) totaldepth = options.totaldepth
    if (options.random) random = options.random

    if (chessPosition.madeMoves.length > 10) random = 0


    return new Promise((resolve, reject) => {
        let color = chessPosition.getTurnColor()
        let white = color == 0
      
        if (white) {
            TESTER = true
        } else {
            TESTER = false
        }
      
        stage = 1 //Apertura
        
        console.log('Doblados:'+ AI.doubledPawns(chessPosition, color), 'Abiertas:' + AI.openedColumns(chessPosition, color), 'ENROCADO:' + AI.isKingCastled(chessPosition, color))



        //ESTIMACIÓN DE ELO
        // let ELO = AI.calcELO(chessPosition, color)
        // console.log(ELO)

        AI.nofpieces = chessPosition.getColorBitboard(0).popcnt() + chessPosition.getColorBitboard(1).popcnt()

        nodes = 0
        qsnodes = 0
        enodes = 0

        // AI.PIECE_SQUARE_TABLES = apertures.london
        AI.PIECE_SQUARE_TABLES = AI.PIECE_SQUARE_TABLES_MIDGAME

        if (AI.nofpieces <= 28 || chessPosition.madeMoves.length >= 16) {
            AI.PIECE_SQUARE_TABLES = AI.PIECE_SQUARE_TABLES_MIDGAME
            stage = 2 //'midgame'
        }

        if (AI.nofpieces <= 16) {
            AI.PIECE_SQUARE_TABLES = AI.PIECE_SQUARE_TABLES_ENDGAME
            stage = 3 //endgame
        }

        if (AI.nofpieces < 6) {
          stage = 4
        }
        
        console.log('STAGE', stage)

        let castled = AI.isKingCastled(chessPosition, color)
        let enemycastled = AI.isKingCastled(chessPosition, color)
        let staticeval = AI.evaluate(chessPosition)

        if (stage < 3 && castled && castled == 1) AI.PIECE_SQUARE_TABLES[0] = AI.PSQT_PAWNS_KSC 
        if (stage < 3 && castled && castled == 2) AI.PIECE_SQUARE_TABLES[0] = AI.PSQT_PAWNS_QSC 


        if (stage === 3) AI.PIECE_SQUARE_TABLES = AI.PIECE_SQUARE_TABLES_ENDGAME
        

        if (stage == 2) {
            AI.PIECE_VALUES[0] = 120
        }

        if (stage == 3) {
            AI.PIECE_VALUES[0] = 180
        }

        console.log(AI.PIECE_VALUES)

/*        AI.history = [
          new Array(64).fill(new Array(64).fill(null)), //blancas
          new Array(64).fill(new Array(64).fill(null)) //negras
        ]*/

        let moves = chessPosition.getMoves(false, false)

        let value
        let scores = []
        let bestMove = moves[0]

        let howmanybests = 0

        AI.start = new Date().getTime()

        let status = 0

        //Posibles checkmates in 1-move
        for (let i = 0, len = moves.length; i < len; i++) {
            if (chessPosition.makeMove(moves[i])) {

                if (chessPosition.getStatus() == 1) {
                    bestMove = moves[i]
                    AI.bestMove = bestMove
                    status = 1
                    chessPosition.unmakeMove()
                    break
                } else {
                    chessPosition.unmakeMove()
                }

            }
        }


        // console.time()

        // pvtable = []


        n++

        iteration = 0

        AI.timer = (new Date()).getTime()

        AI.stop= false

        let score = 0, lastscore = 0



        if (status == 0) {
          AI.PV=new Array(totaldepth * 2).fill([])
            

            /*for (let depth = 0; depth <= 8; depth++) {
                iteration++
                lastscore = score

                fh = fhf = 1
                
                score = (white? 1 : -1) * AI.negascout(chessPosition, depth, -Infinity, Infinity, 1)

                // if (AI.stop && iteration > 1) {
                    // break
                // }

                AI.bestMove = AI.PV[iteration][1]
                let strmove = AI.bestMove? AI.bestMove.getString() : '----'
                console.info(chessPosition.madeMoves.length, white ? 'W' : 'B', strmove, 'Score:' + lastscore, 'Depth ' + depth + ` NPS: ${nodes}`, `QSNPS: ${qsnodes}`, `NODES: ${nodes+qsnodes}`, 'FHF ' + Math.round(fhf*100/fh) + '%' + (TESTER? ' (TESTER)' : ''))
                
            }
            

            // console.log(AI.PV.map(e=>{return e.map(f=>{return f.getString()})}))

            // console.log(AI.hashtable)*/

            for (let depth = 1; depth <= totaldepth; depth+=1) {
                iteration++
                lastscore = score

                fh = fhf = 1
                
                score = (white? 1 : -1) * AI.negascout(chessPosition, depth, -Infinity, Infinity, 1)

                if (AI.stop && iteration > 1) {
                    break
                }


                AI.bestMove = TESTER? AI.PV[iteration-1][1] : AI.PV[iteration][1]

                let strmove = AI.bestMove? AI.bestMove.getString() : '----'
                console.info(chessPosition.madeMoves.length, white ? 'W' : 'B', strmove, 'Score:' + lastscore, 'Depth ' + depth + ` NPS: ${nodes}`, `QSNPS: ${qsnodes}`, `NODES: ${nodes+qsnodes}`, 'FHF ' + Math.round(fhf*100/fh) + '%' + (TESTER? ' (TESTER)' : ''))
                
            }
                console.info('                ')

            
        }

        // console.log(AI.PV[iteration-1].map(e=>e.getString()))
        resolve({move: AI.bestMove, lastscore})
    })
}

module.exports = AI