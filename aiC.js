"use strict"

let Chess = require('./chess.js')

let TESTER, nodes, qsnodes, enodes, iteration, status, fhf, fh
let totaldepth = 23
let random = 0
let stage = 1
let htlength = 1 << 24
let secondspermove = 1
let mindepth = 2

let AI = function() {

}


AI.HST_POSITIONAL = [
    3, 5, 5, 9, 7, 3, 0, 1,
    8, 15, 11, 16, 13, 10, 6, 5,
    12, 17, 26, 28, 21, 24, 13, 11,
    19, 39, 35, 63, 58, 34, 37, 19,
    38, 32, 73, 100, 82, 58, 37, 34,
    22, 44, 81, 52, 68, 98, 48, 28,
    2, 15, 31, 57, 55, 26, 31, 10,
    5, 19, 37, 48, 38, 63, 46, 9,
]

AI.createTables = function () {
  console.log('Creating tables.......................................................................')
  AI.history = [
    new Array(64).fill(new Array(64).fill(0)), //blancas
    new Array(64).fill(new Array(64).fill(0)) //negras
  ]

  AI.history = [[],[]]

  AI.history[0] = [
       0,       0,      0,     0,     0,     0,
       0,       0,      0,     0,     0,     0,
       0,       0,      0,     0,  6792, 52304,
  222240,    6202,  17716, 26564, 28930,  6210,
    1776,  247226,  15924, 37936, 93642,  9774,
   13746,     904,   7546, 46074, 47906, 63392,
   68556,   14108,   7410, 10380,  1174,  2316,
    9686,    1730,   7746, 24828,  7996,   248,
      16,     308,   1882,  7168,   516,  7580,
     330,     506,    876,     2,   196,    16,
      12,       0,      0,     0
],
[
       0,    386,    30,    14,    258,    28,   394,
       0,     22,    80,    80, 312574,  5300,    44,
     374,    150,   180,  3104,  14676,  3462,  1882,
  327599,   4558,   170,   284,    178, 10448, 44532,
   66736,   3260,  5990,  4942,   4554,  4966, 13448,
   30120, 131288, 19150, 66258,   2228,     8,  2842,
    7522,   2602,  4326, 15228,   1266,   256,   826,
   10042,   2822, 21338,  2578,  12976,  2632, 27078,
       8,     58,    12,   388,    100,  1290,    50,
     376
],
[
       16,  1078,    264,   192,     4,   284,
        0,    58,     44, 13238,   812,  5180,
     6230,   200,  48646,     4,   608,  1882,
      852, 12736,   7914,  2486, 13426,  1562,
      250,  2182,  23102,  1228, 22088, 32662,
     5074,   800,    174, 23794,  2372, 16518,
    63096,  2382, 152833,  1154,  5178,  4738,
    13692,  1736,   3480, 26656,  5040,  6034,
     5430,  9698,  20248,  5914,  6732,  7430,
     4642, 11764,    134, 11098,   156,  2400,
      244,   466,   2684,   546
],
[
   2390, 7204, 2360, 283068, 51414, 4823,   326,
    376, 3608,  622,   1440,  3024, 2130,   766,
      4,  976,  122,   1876,  6422,  984,  3414,
    334,  716, 1660,    272,  1224,  852,  6974,
  15230,  428, 1462,   1178,  4998, 3566,   950,
   5336, 1932, 3154,   1232,  6272, 7508,  2072,
   1742, 5642, 2992,   3892,   172,  332, 13246,
   5928, 3982, 4788,    962,  6430, 1402,  6100,
    280, 1094,  966,   3026,  1234,  232,     2,
     12
],
[
        0,   266,   164,   442,   362,    56,
       16,    72,  2396,   180, 17078,  9859,
    13016,   590,   306,    22,  1084, 10704,
     4968,  4186,  3194,  5530,  1726,   138,
     4396,  1870, 20356,  7318, 23794,  2370,
     4986,   582,  2122, 10422,  6214, 17258,
     4552,  4862,  3264,  6558,  2050,  2066,
     8602,   826,  3010,  1168,   290,   282,
    10456, 30764, 15092,   954,   408,  2584,
      412,  3340,   878,   100,    32,  2998,
      792,    40,     6,    32
],
[
        4,    1777,   34055,     428,     142,     680,
   134017,     272,      68,    3982,     104,    3890,
      836,   25242,    1240,     796,       4,       6,
      166,      72,     320,      64,     540,      60,
        0,       0,       0,       0,      24,      20,
        0,       2,       0,       0,       0,       0,
        0,       0,       0,       0,       0,       0,
        0,       0,       0,       0,       0,       0,
        0,       0,       0,       0,       0,       0,
        0,       0,       0,       0,       0,       0,
        0,       0,       0,       0
]


AI.history[1][0] = [
       2,       0,      4,       0,       0,     6,
       0,      40,    578,     664,     200,  3244,
    4424,    1012,   1310,    4528,    1740,  1178,
   20908,    4296,   4340,   35988,    3950,  3728,
    7624,   15458,  34982,   73860,   56866, 33702,
   14296,    6950,    974,   66544,    8356, 49806,
   61356,   27758, 146522,     572,    3524,  4456,
  220574,    2100,  33160,   15992,  187372,  5300,
       0,       0,      0,       0,       0,     0,
       0,       0,      0,       0,       0,     0,
       0,       0,      0,       0
]
AI.history[1][1] = [
     16,   766,     30,   2468,    32,   444,     4,
    538,  2590,   4042,   1302, 16348,  2452,  9022,
    276,   672,    358,   6800, 21306,  1438, 15416,
   8324,  6432,   1356,   1770, 10802, 13734, 12244,
  97852,  3090,  12322,    262,   168,   414,  5080,
  22906, 53910,    868,   9178,  4404,   214,  5370,
  10456,  1182,   2898, 258323,   682,    92,     4,
     36,   618, 355043,   2510,  1216,    10, 11316,
     12,  1176,     62,     24,    30,   102,   308,
     30
]
AI.history[1][2] = [
     92,  4486,      2, 2446,   102,   780,    14,
    272,  4282,   4286, 7754,  4790,  4640,  5466,
  10314,  7036,   3886, 1788, 13800,  2640,  3566,
  47866,  2458,  11940, 5472, 52010, 36006, 17084,
  69368,  3184, 127872, 4010,   308,  2654, 16360,
   7070, 37740,  23484, 2810,  1088,  1936,  2082,
   4636, 32976,   9754, 2044,  3776,  1816,    56,
   3656,  1040,  13288, 4004,   512, 12666,   136,
     82,   198,    218,  700,    46,   228,    22,
     20
]
AI.history[1][3] = [
     1646,   62,   170, 2216, 3540,    24,
        0,   18, 28132, 9920, 6978,  2232,
    11112, 3564,  2800, 7330,  906,   700,
     2002, 1536,  2778,  270,  234,   920,
     1968, 4110,  2136, 3604, 2880,  4540,
     1548, 1132,  2076,  990,  948,  3810,
    12316, 1918,   454,  746,  250,  2804,
    16238,  382,  6268,  154,  362,   174,
      950,  178,  2618, 1308, 3762, 29156,
       42, 4014,  9506, 1338, 7970, 70272,
   220183, 2387,   298, 1812
]
AI.history[1][4] = [
      706,    68,    18,   494,   240,    32,
        0,    22,  6046, 25136,  8950,   828,
      586,  1378,   696,  3712,   370,   466,
     2538,  1124,   766,   594,   210,   350,
     1394, 10834,  1318, 16070,  5626,  4076,
      518,  2448,  2516,  1042,   530, 14578,
     8664,  1428,  4432,   252,    48, 26354,
     1102,   910,  4172,   630,   148,     6,
       72,   430, 16264,  8470, 26500,   694,
      230,   140,    42,   206,   210,   803,
      288,   380,     8,     2
]
AI.history[1][5] = [
        0,       0,       0,       0,       0,       0,
        0,       0,       0,       0,       0,       0,
        0,       0,       0,       0,       0,       0,
        0,       0,       0,       0,       0,       0,
        0,       0,       0,       0,       0,       0,
        0,       0,       0,      18,       0,       0,
       56,       0,       2,       0,       0,      20,
      154,     272,    1446,      52,     132,       0,
        0,    2470,      10,    1552,    1268,    8032,
     1282,    1434,       0,     743,   18845,     784,
      542,    5842,  139833,     206
]


  for (let color = 0; color < 2; color++) {
    for (let piece = 0; piece < 6; piece++) {
      for (let to = 0; to < 64; to++) {
        AI.history[color][piece] = AI.HST_POSITIONAL
      }
    }
  }

  AI.hashtable = new Array(htlength) //positions

  AI.evaltable = [
    new Array(htlength), //blancas
    new Array(htlength) //negras
  ]
}

AI.createTables()

AI.PIECE_VALUES = [100, 325, 350, 500, 950, 20000]

AI.BISHOP_PAIR_VALUE = 50

AI.MATE = AI.PIECE_VALUES[5]
AI.INFINITY = AI.PIECE_VALUES[5]*4

AI.PSQT_KNIGHTS_KSC = [ 
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0, 40, 40, 40, 40,-40,
  -30,-20,  0, 15, 15, 10, 10,-30,
  -30,-20,  0, 20, 20, 20, 10,-30,
  -30,-20,  0, 30, 30, 15, 10,-30,
  -80,-20,  0,  0,  0,  0,  0,-80,
  -40,-20,-20,-20,-20,-20,-20,-40,
  -50,-20,-30,-30,-30,-30,-20,-50,
]

AI.PSQT_KNIGHTS_QSC = [ 
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40, 40, 40, 40, 40,  0,-20,-40,
  -30, 10, 10, 15, 15,  0,-20,-30,
  -30, 10, 20, 20, 20,  0,-20,-30,
  -30, 10, 15, 30, 30,  0,-20,-30,
  -80,  0,  0,  0,  0,  0,-20,-80,
  -40,-20,-20,-20,-20,-20,-20,-40,
  -50,-20,-30,-30,-30,-30,-20,-50,
]

AI.PSQT_BISHOPS_KSC = [ 
  -30, -30, -30, -30, -30, 20, 10, 0,
-30, -30, -30, -30,40, 40, 40, 10,
-30, -30, -30, 0, 20, 30, 20, 20,
-30, -30, 0, 20, 30, 20, 0, -30,
-30, 0, 20, 30, 20, 0, -30, -30,
0, 20, 30, 20, 0, -30, -30, -30,
0, 20, 20, 0, -30, -30, -30, -30,
-30, 0, 0, -30, -30, -30, -30, -999,
]

AI.PSQT_BISHOPS_QSC = [ 
  0, 10, 20, -30, -30, -30, -30, -30,
 10, 40, 40, 40, -30, -30, -30, -30,
 20, 20, 30, 20, 0, -30, -30, -30,
-30,  0, 20, 30, 20, 0, -30, -30,
-30, -30, 0, 20, 30, 20, 0, -30,
-30, -30, -30, 0, 20, 30, 20, 0,
-30, -30, -30, -30, 0, 20, 20, 0,
-998, -30, -30, -30, -30, 0, 0, -30,
]

AI.PSQT_PAWNS_KSC = [
    0,  0,  0,  0,  0,  0,  0,  0,
   40, 50, 50, 50,  0,  0,  0,  0,
   30, 40, 40, 40,  0,-50,-50,-50,
   20, 30, 30, 30,  0,-80,-80,-80,
   20, 20, 20, 40, 40,-50,-50,-50,
   30, 10, 10, 10, 50,  0,  0,  0,
   30,  0,  0,  0,  0, 20, 30, 20,
    0,  0,  0,  0,  0,  0,  0,-1000,

]

AI.PSQT_PAWNS_QSC = [
    0,  0,  0,  0,  0,  0,  0,  0,
     0,  0,  0,  0, 50, 50, 50, 40,
     0,-50,-50,-50, 40, 40, 40, 30,
     0,-80,-80,-80, 30, 30, 30, 20,
     0,-50,-50, 40, 40, 20, 20, 20,
     0,  0, 50, 20, 10, 10, 10, 30,
    20, 30, 30,  0,  0,  0,  0, 30,
     0,  0,  0,  0,  0,  0,  0,-1001,

]

AI.PIECE_SQUARE_TABLES_MIDGAME = [
// Pawn
    [ 
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 30, 20, 20, 30, 10, 10,
     5,  5, 30, 20, 20, 30,  5,  5,
   -20,  0,  0, 30, 30,  0,  0,-20,
     5, 10, 20,-20,-20,-20, 10,  5,
    20, 10, 10,-20,-20, 10, 10, 20,
     0,  0,  0,  0,  0,  0,  0,  0
    ],

    // Knight
    [ 
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40, 30, 30, 30, 30, 30, 30,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  0, 15, 30, 30, 15,  0,-30,
    -30,  0, 15, 30, 30, 15,  0,-30,
    -80,  5, 20, 15, 15, 20,  5,-80,
    -40,-20,  0, 10, 10,  0,-20,-40,
    -50,-20,-30,-30,-30,-30,-20,-50,
    ],
    // Bishop
  [ 
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10, 20, 20, 20, 20, 20, 20,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10, 15, 10, 20, 20, 10, 15,-10,
    -40, 20, 10, 20, 20, 10, 20,-40,
    -10, 20,-50,-40,-40,-50, 20,-10,
    -10, 20,  0,  0,  0,  0, 20,-10,
    -20,-10,-20,-10,-10,-20,-10,-20,
  ],
  // Rook
  [ 
  0,  30, 30, 30, 30, 30, 30,   0,
 -15, 20, 40, 50, 50, 40, 20, -15,
 -15,  0,  0,  0,  0,  0,  0, -15,
 -15,  0,  0,  0,  0,  0,  0, -15,
 -25,  0,  0,  0,  0,  0,  0, -25,
 -15,  0,  0,  0,  0,  0,  0, -15,
 -80,-50,  0, 10, 10,  0,-80,-100,
-50, -80,-80, 40, 40,  0,-80, -50
  ],

  // Queen
  [ 
-20, 30, 30, 30, 30, 30, 30,-20,
-10, 40, 40, 40, 40, 40, 40,-10,
-10,  0,  0,  0,  0,  0,  0,-10,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  0,  0,  0,  0, -5,
-10,  0,  0,  0,  0,  0,  0,-10,
-10,  0,  0,  0,  0, 10,  0,-10,
-20,-20,-20,-20,-20,-20,-20,-20
  ],

  // King
  [ 

    -10,-20,-20,-30,-30,-20,-20,-10,
    -10,-20,-20,-30,-30,-20,-20,-10,
    -10,-20,-20,-30,-30,-20,-20,-10,
    -10,-20,-20,-30,-30,-20,-20,-10,
    -20,-10,-10,-20,-20,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,-50,-50,-50,-50, 20, 20,
     20, 40, 30,-50,-20,-30,100, 20

  ]
]

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
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
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

AI.PSQT_ENEMY_KING = [
    0, 0, 0, 0, 5,10,20,20,
    0, 0, 0, 0, 5,10,20,20,
    0, 0, 0, 0, 5, 8,10,10,
    0, 0, 0, 0, 5, 5, 5, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
  ]

AI.bitCount = function(n) {
    n = n - ((n >> 1) & 0x55555555)
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

AI.kingSafety = function(chessPosition, color) {
    let safety = 0

    /*if (chessPosition.canCastle(color, true, true) || chessPosition.canCastle(color, false, true)) {
        // safety -=100
    } else {
    }*/
    //Rey seguro (Concepto: ataca sus propias piezas)
    let pawns = chessPosition.getPieceColorBitboard(0, color)
    let king = chessPosition.getPieceColorBitboard(5, color)
    let kingmask = Chess.Position.makeKingAttackMask(color, king)
    safety += AI.bitCount(kingmask.low & pawns.low) + AI.bitCount(kingmask.high & pawns.high)

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
    let rooks = chessPosition.getPieceColorBitboard(3, color)
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
    opencolumns += (AI.bitCount(occupied & 2155905152) == AI.bitCount(chessPosition.getPieceColorBitboard(5, color)[local] & 2155905152)) && AI.bitCount(occupied & 2155905152) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 1) == AI.bitCount(chessPosition.getPieceColorBitboard(5, color)[local] & 2155905152 >>> 1)) && AI.bitCount(occupied & 2155905152 >>> 1) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 2) == AI.bitCount(chessPosition.getPieceColorBitboard(5, color)[local] & 2155905152 >>> 2)) && AI.bitCount(occupied & 2155905152 >>> 2) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 3) == AI.bitCount(chessPosition.getPieceColorBitboard(5, color)[local] & 2155905152 >>> 3)) && AI.bitCount(occupied & 2155905152 >>> 3) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 4) == AI.bitCount(chessPosition.getPieceColorBitboard(5, color)[local] & 2155905152 >>> 4)) && AI.bitCount(occupied & 2155905152 >>> 4) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 5) == AI.bitCount(chessPosition.getPieceColorBitboard(5, color)[local] & 2155905152 >>> 5)) && AI.bitCount(occupied & 2155905152 >>> 5) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 6) == AI.bitCount(chessPosition.getPieceColorBitboard(5, color)[local] & 2155905152 >>> 6)) && AI.bitCount(occupied & 2155905152 >>> 6) == 1
    opencolumns += (AI.bitCount(occupied & 2155905152 >>> 7) == AI.bitCount(chessPosition.getPieceColorBitboard(5, color)[local] & 2155905152 >>> 7)) && AI.bitCount(occupied & 2155905152 >>> 7) == 1

    return opencolumns
},

AI.rookInOpenedColumns = function(chessPosition, color) {
    if (stage == 3) return 0
    //Torres en columnas semiabiertas
    let local = color == 0 ? 'low' : 'high'
    let occupied = chessPosition.getOccupiedBitboard(0, color)[local]
    let freerook = 0
    freerook += (AI.bitCount(occupied & 2155905152) == AI.bitCount(chessPosition.getPieceColorBitboard(3, color)[local] & 2155905152)) && AI.bitCount(occupied & 2155905152) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 1) == AI.bitCount(chessPosition.getPieceColorBitboard(3, color)[local] & 2155905152 >>> 1)) && AI.bitCount(occupied & 2155905152 >>> 1) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 2) == AI.bitCount(chessPosition.getPieceColorBitboard(3, color)[local] & 2155905152 >>> 2)) && AI.bitCount(occupied & 2155905152 >>> 2) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 3) == AI.bitCount(chessPosition.getPieceColorBitboard(3, color)[local] & 2155905152 >>> 3)) && AI.bitCount(occupied & 2155905152 >>> 3) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 4) == AI.bitCount(chessPosition.getPieceColorBitboard(3, color)[local] & 2155905152 >>> 4)) && AI.bitCount(occupied & 2155905152 >>> 4) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 5) == AI.bitCount(chessPosition.getPieceColorBitboard(3, color)[local] & 2155905152 >>> 5)) && AI.bitCount(occupied & 2155905152 >>> 5) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 6) == AI.bitCount(chessPosition.getPieceColorBitboard(3, color)[local] & 2155905152 >>> 6)) && AI.bitCount(occupied & 2155905152 >>> 6) == 1
    freerook += (AI.bitCount(occupied & 2155905152 >>> 7) == AI.bitCount(chessPosition.getPieceColorBitboard(3, color)[local] & 2155905152 >>> 7)) && AI.bitCount(occupied & 2155905152 >>> 7) == 1

    return freerook
},

AI.advancedpawns = function(chessPosition, color) {
    let white = color == 0
    let score = 0
    let local = white ? 'low' : 'high'
    let foreign = white ? 'high' : 'low'

    return (AI.bitCount(4294967295 & chessPosition.getPieceColorBitboard(0, color)[foreign]))
}

AI.getPositionalPSQTValue = function(chessPosition, color) {
    let value = 0
    let allpieces = [0,1,2,3] //K, B, R
    for (let piece = 0, len = allpieces.length; piece < len; piece++) {
        let pieces = chessPosition.getPieceColorBitboard(piece, color).dup()

        while (!pieces.isEmpty()) {
            let index = pieces.extractLowestBitPosition()
            value +=  AI.HST_POSITIONAL[color ? index : (56 ^ index)]
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
    let empty = chessPosition.getEmptyBitboard().dup().and(enemy)
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

AI.pawnequality = function(chessPosition, color) {
  return chessPosition.getPieceColorBitboard(0, color).dup().popcnt() - chessPosition.getPieceColorBitboard(0, !color).dup().popcnt()
}

AI.betas = [
  1 /*material*/,
  1 /*psqt*/,
 30 /*mobility*/,
 10 /*isKingCastled*/,
 50 /*doubledPawns*/,
 50 /*openedColumns*/,
 50 /*kinginopenedcolumn*/,
 50 /*rookinopenedcolumn*/,
 10 /*advancedpawns*/,
 10 /*pawnequality*/,
 10 /*undeveloped*/,
 10 /*pawnstructure*/,
 10 /*xrayed*/,
 10 /*center*/,
]

AI.positionEvaluate = function (chessPosition, color) {
  let positionValue = 0
  let centerControl = stage < 3? AI.getCenterControlValue(chessPosition, color) : 0
  let mobility =  AI.mobility(chessPosition, color)
  let pawnstructure = AI.pawnstructure(chessPosition, color)
  let xrayed = AI.xrays(chessPosition, color)
  let advancedpawns = AI.advancedpawns(chessPosition, color)
  let rookinopenedcolumn = AI.rookInOpenedColumns(chessPosition, color)
  let isKingCastled = !!AI.isKingCastled(chessPosition, color)
  let doubledPawns = AI.doubledPawns(chessPosition, color)
  let openedColumns = AI.openedColumns(chessPosition, color)
  let kinginopenedcolumn = stage < 3? AI.kingInOpenedColumns(chessPosition, color) : 0 // (CORRECTO)

  let undeveloped = AI.undevelopedPieces(chessPosition, color)

  positionValue += AI.betas[2]*mobility + AI.betas[3]*isKingCastled + AI.betas[7]*rookinopenedcolumn + AI.betas[13] * centerControl
  positionValue += AI.betas[8]*advancedpawns + AI.betas[11]*pawnstructure + AI.betas[12] * xrayed
  positionValue += -AI.betas[4]*doubledPawns - AI.betas[5]*(openedColumns > 1? openedColumns : 0) - AI.betas[6]*kinginopenedcolumn - AI.betas[10]*undeveloped

  return positionValue
}

AI.evaluate = function(chessPosition, pvNode) {
    let color = chessPosition.getTurnColor()
    let material = AI.getMaterialValue(chessPosition, color) - AI.getMaterialValue(chessPosition, !color)

    // if (Math.abs(material) <= AI.PIECE_VALUES[0] && AI.pawnequality(chessPosition, color) > 0) {
    //   material += AI.PIECE_VALUES[0] / 2 //medio peón
    // }


    let positional = 0
    let psqt = 0

    /*if (pvNode) {
      positional = AI.positionEvaluate(chessPosition, color) - AI.positionEvaluate(chessPosition, !color)
      positional = 200/(1 + Math.exp(-psqt/50)) - 100
    }     */ 

    psqt = AI.getPieceSquareValue(chessPosition, color) - AI.getPieceSquareValue(chessPosition,  !color)
    psqt = 200/(1 + Math.exp(-psqt/50)) - 100

    return material + psqt + positional
}

AI.getMaterialValue = function(chessPosition, color) {
    let value = 0

    for (let piece = 0, len = AI.PIECE_VALUES.length; piece < len; piece++) {
        value += chessPosition.getPieceColorBitboard(piece, color).popcnt() * AI.PIECE_VALUES[piece]
    }

    return value // + Math.random()*random - random/2
}

AI.getPawnsValue = function(chessPosition, color) {
    let value = 0

    value += chessPosition.getPieceColorBitboard(0, color).popcnt() * AI.PIECE_VALUES[0]

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
  let policyValue = move.policyValue

  if (move.isCastle()) {
    return 1e8 + 1e6
  } else if (move.tt) {
    return 1e8
  } else if (move.pv) {
    return 1e6
  } else if (move.isCapture()) {
    move.capture = true
    let mvvlva = 1e4* (move.getCapturedPiece() + 1)/(move.getPiece() + 1)
    return mvvlva
  } else if (move.hvalue) {
    return move.hvalue
  } else {
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
    let inCheck

    qsnodes++

    stand_pat = AI.evaluate(chessPosition, pvNode)

    if (depth > -2) {
      inCheck = chessPosition.isKingInCheck()
    } else {
      inCheck = 0;
    }

    if (!inCheck && stand_pat >= beta) {
      return stand_pat
    }

    if (!inCheck && stand_pat > alpha) {
      alpha = stand_pat
    }

    let moves = chessPosition.getMoves(false, !chessPosition.isKingInCheck())
    moves = AI.setPoliciyValues(chessPosition, moves)
    moves = AI.sortMoves(moves, turn, ply, chessPosition, null, AI.PV[ply]? AI.PV[ply].value : null)


    for (let i=0, len=moves.length; i < len; i++) {
      if (chessPosition.makeMove(moves[i])) {
        legal++

        let score = -AI.quiescenceSearch(chessPosition, -beta, -alpha, depth-1, ply+1, pvNode)

        chessPosition.unmakeMove()

        if( score >= beta ) {
          AI.PV[ply] = moves[i]
          AI.ttSave(hashkey, bestscore, -1, 0, moves[i])
          return beta
        }

        if( score > alpha ) {
          alpha = score
          bestmove = moves[i]
          bestscore = score
        }
      }
    }

    if (bestmove) {
      AI.PV[ply] = bestmove
      AI.ttSave(hashkey, bestscore, 0, 0, bestmove)
    }

    if (chessPosition.isKingInCheck() && legal === 0) {
       return -AI.MATE + ply;
    }

    return alpha


}

AI.ttSave = function (hashkey, score, flag, depth, move) {
  let oldEntry = AI.hashtable[hashkey % htlength]
  let save = false


  if (oldEntry) {
    if (oldEntry.hashkey === hashkey) {
      if (oldEntry.depth < depth) {
        save = true
      } else if (flag === 0) {
        save = true
      }
    } else {
      save = true
    }
  } else {
    save = true
  }
  
  if (save) {
    AI.hashtable[hashkey % htlength] = {
      hashkey,
      score,
      flag,
      depth,
      move
    }
  } else {
    return
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

AI.setPoliciyValues = function (chessPosition, moves) {
  /*let color = chessPosition.getTurnColor()
  let actual = AI.policyEvaluate(chessPosition, color)

  for (let i = 0; i < moves.length; i++) {
    if (chessPosition.makeMove(moves[i])) {
      moves[i].policyValue = AI.policyEvaluate(chessPosition, color) - actual
      chessPosition.unmakeMove()
    }
  }*/

  return moves
}

AI.reduceHistory = function () {
  for (let color = 0; color < 2; color++) {
    for (let piece = 0; piece < 6; piece++) {
      for (let to = 0; to < 64; to++) {
        AI.history[color][piece][to] = AI.history[color][piece][to] * 0.95
      }
    }
  }
}

AI.saveHistory = function(turn, move, depth) {
  AI.history[turn][move.getPiece()][move.getTo()] = AI.history[turn][move.getPiece()][move.getTo()] + (1 << depth)
}

AI.PVS = function(chessPosition, alpha, beta, depth, ply) {  
  if ((new Date()).getTime() > AI.timer + 1000 * secondspermove /*&& iteration > 1*/) {
    AI.stop = true
  }

  nodes++

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



  if( depth <=0 ) {
    if (ttEntry && ttEntry.depth <= 0) {
      return ttEntry.score
    } else {
      return AI.quiescenceSearch(chessPosition, alpha, beta, depth, ply, pvNode)
    }
  }

  let bestmove = {value: 2080,  getString() {return '-'}} // iteration > 1? AI.PV[iteration-1][1] : moves[0]


  if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === 0) {
        return ttEntry.score          
      } else if (ttEntry.flag === -1) {
        if (ttEntry.score > alpha) alpha = ttEntry.score
      } else if (ttEntry.flag === 1) {
        if (ttEntry.score < beta) beta = ttEntry.score
      }

      if (alpha >= beta) {
        AI.saveHistory(turn, ttEntry.move, depth)
        return ttEntry.score
      }
      
  }
  
  if (pvNode && depth > 3 && !ttEntry) {
    AI.PVS(chessPosition, alpha, beta, depth-2, ply)
  }

  let pvMoveValue = AI.PV[ply]? AI.PV[ply].value : null

  let moves = chessPosition.getMoves()
  moves = AI.setPoliciyValues(chessPosition, moves)
  moves = AI.sortMoves(moves, turn, ply, chessPosition, ttEntry? ttEntry.move.value : null, pvMoveValue)

  let legal = 0
  let bestscore = -Infinity
  let score

  if (AI.stop) return alpha
  
  if (!AI.PV[ply]) {
    let hashkey = chessPosition.hashKey.getHashKey()
    let ttEntry = AI.ttGet(hashkey)

    if (ttEntry && ttEntry.depth >= depth) {
      AI.PV[ply] = ttEntry.move
    }
  } 

  let stand_pat = AI.evaluate(chessPosition)

  //Prune
  if (!pvNode && !chessPosition.isKingInCheck() && depth <= 2 && (stand_pat - depth * 200) >= beta) {
    // console.log('prune')
    return beta;
  }

  for (let i=0, len=moves.length; i < len; i++) {
    if (chessPosition.makeMove(moves[i])) {
      legal++


      let R = 0
      let E = 0
      //History reduction
      if (!moves[i].isCapture() && !chessPosition.isKingInCheck() && !pvNode && legal > 4) {
        let hscore = AI.history[turn][moves[i].getPiece()][moves[i].getTo()] // history hscore
        if (!hscore) {
          R += 1
        }
        
        if (hscore < 0.5 * Math.max(...AI.history[turn][moves[i].getPiece()])) {
          R += 0.5
        }
      }

      //EXTENSIONS
      if (chessPosition.isKingInCheck() && depth < 5) {
        E = 1
      } else {
        //LMP
        if (iteration > 4 && stage < 3 && !chessPosition.isKingInCheck() && depth <= 2 && i > depth * 5) {
         chessPosition.unmakeMove()
         continue
        }
        


        //Futility
        if (!chessPosition.isKingInCheck() && depth <= 4 && (stand_pat + depth * 120) < alpha) {
          chessPosition.unmakeMove()
          continue
        }

        //LMR
        if (depth >= 3 && !chessPosition.isKingInCheck()) {
          R += 1 + depth/3 + i/20 | 0
        }        
      }

      if (legal === 1) {
        score = -AI.PVS(chessPosition, -beta, -alpha, depth+E-1, ply+1)
      } else {
        score = -AI.PVS(chessPosition, -alpha-1, -alpha, depth+E-R-1, ply+1)
        if (!AI.stop && score > alpha) {
          score = -AI.PVS(chessPosition, -beta, -alpha, depth+E-1, ply+1)
        }
      }
      
      chessPosition.unmakeMove()

      if (AI.stop) return alpha

      if (score > bestscore) {
        if (score > alpha) {
          if (score >= beta) {
            if (legal === 1) {
              fhf++
            }

            fh++
            // AI.addKiller(score, move)
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

  if (legal === 0) {
      // stalemate, draw
      if (!chessPosition.isKingInCheck()) {
        AI.ttSave(hashkey, 0, 0, depth, bestmove)
        return 0
      }
      
      AI.ttSave(hashkey, -AI.MATE + ply, 0, depth, bestmove)
      return -AI.MATE + ply
      
  } else {

    // always assume the draw will be claimed
    if (chessPosition.isDraw()) {
      AI.ttSave(hashkey, 0, 0, depth, bestmove)
      
      return 0
    }

/*    if (legal === 1) {
      AI.stop = true
    }*/



    if (bestscore > alphaOrig) {
      AI.PV[ply] = bestmove
      AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
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

  let nofpieces = chessPosition.getColorBitboard(0).popcnt() + chessPosition.getColorBitboard(1).popcnt()

  if (nofpieces <= 28 || chessPosition.madeMoves.length > 18) {
      stage = 2 //'midgame'
  }

  if (nofpieces <= 18) {
      stage = 3 //endgame
  }

  if (nofpieces <= 8) {
    stage = 4 //mate
  }

  if (stage < 3 || simple) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_MIDGAME]

  if (stage >= 3) {
    AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_ENDGAME]
  }

}

AI.getPV = function (chessPosition) {
  let PV = [chessPosition.getLastMove()]
  let legal = 0

  let ttEntry
  let ttFound

  for (let i = 0; i < totaldepth; i++) {
    ttFound = false
    let hashkey = chessPosition.hashKey.getHashKey()
    ttEntry = AI.ttGet(hashkey)

    if (ttEntry && ttEntry.flag != 1) {
      if (chessPosition.makeMove(ttEntry.move)) {
        ttFound = true
        legal++
        PV.push(ttEntry.move)
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

    nodes = 0
    qsnodes = 0
    enodes = 0
    iteration = 0

    AI.nofpieces = chessPosition.getColorBitboard(0).popcnt() + chessPosition.getColorBitboard(1).popcnt()

    let staticeval = AI.evaluate(chessPosition)

    AI.timer = (new Date()).getTime()
    AI.stop= false

    let score = 0, lastscore = 0

    let status = 0


    AI.setStage(chessPosition)

    AI.PV = AI.getPV(chessPosition)
    AI.bestmove = AI.PV[1]

    if (TESTER) console.log('+++++++++++++++++++++++++++++++ TESTER +++++++++++++++++++++++++++++++++')

    console.log('Last Principal Variation', AI.PV.map(e=>{ return e? e.getString() : '---'}).join(' '))

    for (let depth = 1; depth <= totaldepth; depth+=1) {
        AI.bestmove = [...AI.PV][1]
        lastscore = score

        iteration++

        fh = fhf = 1
        
        score = (white? 1 : -1) * AI.PVS(chessPosition, -Infinity, Infinity, depth, 1)
        
        AI.PV = AI.getPV(chessPosition).slice(0, iteration)

        console.log(depth, AI.PV.map(e=>{ return e? e.getString() : '---'}).join(' '), 'FHF ' + Math.round(fhf*100/fh) + '%', score, nodes, qsnodes)
        
        if (AI.stop && iteration > 1 && AI.bestmove !== null) {
            break
        }

    }
    
    console.info('                ')
    console.log(AI.bestmove.getString(), lastscore)
    console.info('__________________________________________________________________________________________')
    console.info('                ')

    resolve({move: AI.bestmove, score: lastscore})
  })
}

module.exports = AI