"use strict"

let Chess = require('./chess.js')

let TESTER, nodes, qsnodes, enodes, iteration, status, fhf, fh
let totaldepth = 48
let random = 40
let stage = 1
let htlength = 1 << 24
let reduceHistoryFactor = 0.2
let secondspermove = 1
let mindepth = 4

let AI = function() {

}

//Carlsen, according to https://github.com/WinPooh/pgnlearn
// AI.INITIAL_PIECE_VALUES = [141, 300, 342, 495, 1107, 20000]

//https://www.r-bloggers.com/2015/06/big-data-and-chess-what-are-the-predictive-point-values-of-chess-pieces/
AI.INITIAL_PIECE_VALUES = [100, 300, 330, 520, 850, 20000]


AI.MATE = AI.INITIAL_PIECE_VALUES[5]
AI.DRAW = 0
AI.INFINITY = AI.INITIAL_PIECE_VALUES[5]*4

AI.PIECE_SQUARE_TABLES = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0)
  ]

AI.createTables = function () {
  console.log('Creating tables.......................................................................')
  AI.history = [
    new Array(64).fill(new Array(64).fill(0)), //blancas
    new Array(64).fill(new Array(64).fill(0)) //negras
  ]

  AI.history = [[],[]]

  AI.history[0] = [[
103,118,89,64,76,103,64,89,
397,282,216,244,282,282,302,234,
7791,6774,6548,5093,5968,8030,8241,9104,
13896,13323,14440,18283,13896,11721,14587,15475,
13752,14113,12202,19360,21283,12934,13394,14222,
6802,7002,6325,2217,3263,6745,7791,7732,
234,148,207,190,110,89,173,133,
76,58,52,47,47,23,52,15,
  ],

  [
52,743,1534,1076,1604,2178,955,133,
453,430,2005,15550,8669,1364,586,1015,
1138,3241,13394,4486,4990,19481,4024,586,
1586,4289,8607,12653,14368,5405,2557,2275,
2081,2850,5859,12236,11147,6548,2871,1948,
798,2217,13896,5591,5327,13824,2024,598,
110,430,1499,4964,5041,1282,488,408,
5,216,465,637,868,743,244,27,
  ],

  [
263,611,1764,1986,3065,3153,716,181,
1015,3219,2598,9073,11450,2335,5300,729,
1657,2081,4888,8393,7791,8515,2978,2197,
1586,4635,5968,4939,7320,7088,7495,1233,
2295,5886,7002,5751,7791,7320,3131,1657,
2024,3534,6945,13788,11789,7291,2640,1015,
561,3109,4837,9356,9705,2375,3953,465,
375,1348,2395,2850,2295,2295,488,216,
  ],

  [
12167,13716,21784,26462,17693,10913,7320,6132,
9293,7970,8393,11180,6632,7880,4736,4241,
6604,5248,5751,7378,6576,3330,2598,2807,
4964,3353,5778,5432,3175,3087,2158,2455,
5300,4585,5458,4888,3695,3977,2640,3197,
6464,5751,6464,5968,5196,4120,4338,3718,
9451,6717,9578,10813,6802,5751,5015,4192,
12305,11619,18085,29838,23783,50265,7643,6214,
  ],

  [
1061,1967,2871,7584,4536,2197,637,882,
1569,2744,8824,8948,11619,3906,1986,624,
1674,4786,5485,5995,5353,6576,3153,1185,
3219,2957,3511,4990,5485,4536,3626,1874,
2375,1948,4265,6325,4486,4096,3557,1967,
1604,4761,5778,7970,6380,7910,3511,1800,
1586,3241,8855,10681,11755,3043,1499,548,
1465,2295,3420,4964,4289,1482,784,430,
  ],

  [
548,2578,2335,3000,4217,10222,14077,6916,
1639,4486,8272,10385,13288,16994,28774,15851,
1217,3929,7761,9167,13501,16039,12969,6408,
840,4837,5485,6214,8332,8120,7002,2828,
1315,4511,5591,7408,7970,6831,6689,2598,
1298,4811,6186,10092,12723,13644,9898,5093,
1249,3375,5067,8211,11315,12899,21868,14258,
386,2335,4144,2598,2598,8120,53679,5538,
  ]]

  AI.history[1] = [
    [
0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,
4685,3906,4412,2598,3308,4610,4964,6269,
7146,6604,6831,6464,4888,5353,6297,7761,
2619,3511,3398,4585,3087,2197,2598,2236,
882,882,784,663,465,663,756,561,
234,148,207,190,110,89,173,133,
76,58,52,47,47,23,52,15,
      ],
      [
27,650,985,826,1217,2005,840,133,
140,253,1249,12863,6916,811,302,854,
854,1948,8762,2178,2537,15438,3065,408,
811,676,4241,4585,4338,1819,453,1431,
512,1154,1569,2850,4635,2395,1249,272,
64,598,729,1414,897,548,488,133,
11,181,207,343,282,263,64,42,
0,3,58,96,140,96,8,8,
      ],
      [
190,263,1414,1448,2275,2455,375,118,
465,2178,1364,6520,9451,1431,3953,312,
770,743,2415,4560,4862,4660,1639,689,
225,854,3153,1728,2598,4241,926,442,
716,2619,1107,1856,1710,611,1534,419,
408,784,1586,784,743,1414,408,207,
156,663,611,322,573,386,322,76,
83,216,133,784,207,164,118,42,
      ],
      [
6576,9642,16917,21617,13288,25794,4761,3353,
3175,3109,4000,6049,3398,5015,2455,2139,
2395,1517,1819,2355,2640,1414,1107,1266,
1819,1061,1967,1551,1000,1233,911,970,
2395,1710,1837,1764,868,1414,1185,1465,
2455,1621,1604,1169,1061,882,1061,1431,
4736,2217,2375,1448,911,1249,1710,1764,
3626,1551,1499,1692,1710,1107,1499,1499,
      ],
      [
375,926,1604,4585,2619,926,272,333,
624,1076,6380,5458,8272,2557,1169,173,
536,3021,3175,2537,2557,3929,1692,333,
1782,1249,1517,2062,1621,2005,1431,548,
702,663,1482,1431,1315,1266,1169,756,
573,1076,1107,1015,882,1298,663,419,
798,1000,1282,840,1381,598,225,89,
624,811,1122,1298,1185,488,263,173,
      ],
      [
453,2005,2516,2024,3465,9387,13609,6689,
1000,3398,5778,7940,10124,14660,26686,14918,
488,1465,4660,5511,9261,12098,10027,5222,
244,1569,1045,2476,3511,3835,3511,1154,
302,1201,1364,1298,1517,1122,1169,611,
156,756,1138,811,826,911,386,198,
47,190,408,598,637,408,244,140,
8,52,89,207,118,103,11824,19,
      ]
  ]


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

//Randomize
AI.randomizePSQT = function () {
  for (let i = 0; i < 6; i++) {
    AI.PIECE_SQUARE_TABLES[i] = AI.PIECE_SQUARE_TABLES[i].map(e=>{
      return e + Math.random() * random - random/2 | 0
    })
  }
}

// AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_APERTURE]

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

AI.evaluate = function(chessPosition, pvNode) {
  let color = chessPosition.getTurnColor()
  let colorMaterial = AI.getMaterialValue(chessPosition, color)
  let notcolorMaterial = AI.getMaterialValue(chessPosition, !color)
  let material = colorMaterial.value - notcolorMaterial.value
  let psqt = AI.getPieceSquareValue(chessPosition, color) - AI.getPieceSquareValue(chessPosition,  !color)

  // if (color === 0) material += 20 //Diminishes White effect

  // if (TESTER && colorMaterial.P > notcolorMaterial.P) material += 120

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
    // let K = chessPosition.getPieceColorBitboard(5, color).popcnt()

    value = P*AI.PIECE_VALUES[0] + N*AI.PIECE_VALUES[1] + B*AI.PIECE_VALUES[2] + R*AI.PIECE_VALUES[3] + Q*AI.PIECE_VALUES[4]// + K*AI.PIECE_VALUES[5]

    // if (TESTER) {
      // value += B > 1?   60 : 0
      // value += color === 0? 40 : 0
    // } else {
      value += B > 1?   AI.PIECE_VALUES[0]/2 : 0
      value += P == 0? -AI.PIECE_VALUES[0]/2 : 0      
    // }


    return {value, P, B}
}

AI.getPieceSquareValue = function(chessPosition, color) {
    let value = 0

    for (let piece = 0; piece < 6; piece++) {
        let pieces = chessPosition.getPieceColorBitboard(piece, color).dup()

        while (!pieces.isEmpty()) {
            let index = pieces.extractLowestBitPosition()
            value += AI.PIECE_SQUARE_TABLES[piece][color ? index : (56 ^ index)]
        }
    }

    return value
}

AI.scoreMove = function(move) {
  let mvvlva = 1e7 + (move.getCapturedPiece() + 1)/(move.getPiece() + 1)

  if (move.pv) {
    return 1e9
  } else if (move.tt) { 
    return 1e8 + move.tt
  } else if (move.isCapture() && mvvlva >= 0) {  
    move.capture = true 
    return mvvlva
  } else if (move.hvalue) { 
    move.hmove = true 
    return move.hvalue
  } else if (move.isCapture() && mvvlva < 0) {
    return 0
  } else {  
    move.vmove = true 
    return Math.log(move.value) - 1000
  } 
}


AI.sortMoves = function(moves, turn, ply, chessPosition, ttEntry, pvMoveValue) {

  for (let i = 0, len = moves.length; i < len; i++) {
    let move = moves[i]
    if (ttEntry && move.value === ttEntry.move.value) move.tt = ttEntry.score

    if (pvMoveValue === move.value) {
      move.pv = true
    }

    // if (AI.PV[ply-2] && AI.PV[ply-2].getPiece() === move.getPiece()) move.samepiece = true

    move.hvalue = AI.history[turn][move.getPiece()][move.getTo()]

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

    // let legal = 0
    let stand_pat
    let bestmove
    let bestscore

    qsnodes++

    stand_pat = AI.evaluate(chessPosition, pvNode)

    if( stand_pat >= beta ) {
      return beta;
    }
    if( alpha < stand_pat ) alpha = stand_pat;

    let moves

    moves = chessPosition.getMoves(false, !chessPosition.isKingInCheck())
    // moves = chessPosition.getMoves(false, true)


    moves = AI.sortMoves(moves, turn, ply, chessPosition, null, AI.PV[ply]? AI.PV[ply].value : null)

    for (let i=0, len=moves.length; i < len; i++) {

      let move = moves[i]

      if (chessPosition.makeMove(move)) {
        // legal++

        let score = -AI.quiescenceSearch(chessPosition, -beta, -alpha, depth-1, ply+1, pvNode)

        chessPosition.unmakeMove()

        if( score >= beta ) {
          AI.saveHistory(turn, move, 0)
          AI.ttSave(chessPosition.hashKey.getHashKey(), bestscore, -1, 0, move) //?????????????????
          return beta;
        }

        if( score > alpha ) {
          AI.saveHistory(turn, move, 0)
          alpha = score
          bestscore = score
          bestmove = move
        }
      }
    }

    if (bestmove) {
      AI.ttSave(chessPosition.hashKey.getHashKey(), bestscore, 0, 0, bestmove)
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
  for (let color = 0; color < 2; color++) {
    for (let piece = 0; piece < 6; piece++) {
      // let min = Math.min(...AI.history[color][piece])
      
      for (let to = 0; to < 64; to++) {
        AI.history[color][piece][to] = (/*reduceHistoryFactor*min + */((1 - reduceHistoryFactor) * AI.history[color][piece][to])) | 0
      }
    }
  }
}

AI.saveHistory = function(turn, move, depth) {
  AI.history[turn][move.getPiece()][move.getTo()] += depth * depth | 0
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
    // console.log('IID')
    AI.PVS(chessPosition, alpha, beta, depth - 2, ply)
    ttEntry = AI.ttGet(hashkey)

    // console.log(!!ttEntry)

    AI.PV = AI.getPV(chessPosition, depth + 1)
  }

  if( depth <= 0 ) {
    if (ttEntry && ttEntry.depth === 0 && ttEntry.flag === 0) {
      // console.log('dsfdsf')
      return ttEntry.score
    } else {
      return AI.quiescenceSearch(chessPosition, alpha, beta, depth, ply, pvNode)
    }
    
  }

  let bestmove = {value: 2080,  getString() {return '-'}}

  if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === 0) {
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

  let pvMoveValue = AI.PV[ply]? AI.PV[ply].value : null

  // if (!pvMoveValue) console.log('no')

  let moves = chessPosition.getMoves(false, false)
  moves = AI.sortMoves(moves, turn, ply, chessPosition, ttEntry, pvMoveValue)

  let legal = 0
  let bestscore = -Infinity
  let score

  if (AI.stop && iteration > mindepth) return alpha

  let incheck = chessPosition.isKingInCheck()
  
  let hmoves = 0  
  
  for (let i=0, len=moves.length; i < len; i++) {
    let move = moves[i]
    let R = 0
    let E = 0


    //LMP
    // let lmp_limit = Math.max(40 - 4*iteration, 10)
    // if (depth <= 3 && piece < 5 && legal > lmp_limit) continue

    if (chessPosition.makeMove(move)) {
      legal++

      //EXTENSIONS
      if (incheck && depth < 3) {
        E = 1
      }

      if (legal === 1) {
        score = -AI.PVS(chessPosition, -beta, -alpha, depth+E-1, ply+1)
      } else {
        //REDUCTIONS
        if (!incheck && legal > 2) {
            //https://chess.ultimaiq.net/cc_in_detail.htm
            R += 0.22 * depth * (1 - Math.exp(-8.5/depth)) * Math.log(i)
            
            //Odd-Even effect. Prune more agressively on even plies
            // if (TESTER && depth % 2 === 0) R+=1
        }

        score = -AI.PVS(chessPosition, -alpha-1, -alpha, depth+E-R-1, ply+1)

        if (!AI.stop && score > alpha && score < beta) { //https://www.chessprogramming.org/Principal_Variation_Search
          score = -AI.PVS(chessPosition, -beta, -alpha, depth+E-1, ply+1)
        }
      }
      
      chessPosition.unmakeMove()
      nodes++

      if (AI.stop) return alpha
      // if (AI.stop) return alphaOrig

      //Mate in 1
      if (iteration == 1) {
        if (chessPosition.getStatus() === 1) {
          AI.ttSave(hashkey, -AI.MATE + ply, 0, depth, move)
          bestmove  = move
          return -AI.MATE + ply
        }
      }

      if (score > bestscore) {
        if (score > alpha) {
          if (score >= beta) {
            if (legal === 1) {
              fhf++
            }

            fh++

            // console.log(legal, move.getPiece())

            // AI.PV[ply] = move
            AI.ttSave(hashkey, score, -1, depth, move)
            AI.saveHistory(turn, move, depth)
            return score
          }
          
          AI.saveHistory(turn, move, depth)
          alpha = score
        }       

        bestscore = score
        bestmove  = move
      }
    }
  }

  if (ply === 1 && legal === 1) AI.stop = true

  if (legal === 0) {
      // stalemate, draw
      if (!chessPosition.isKingInCheck()) {
        AI.ttSave(hashkey, 0, 0, depth, bestmove)
        return AI.DRAW

      }
      
      AI.ttSave(hashkey, -AI.MATE + ply, 0, depth, bestmove)
      return -AI.MATE + ply
      
  } else {

    if (chessPosition.isDraw()) {
      // AI.createTables()
      AI.ttSave(hashkey, 0, 0, depth, bestmove)
      
      return AI.DRAW

    }

    if (bestscore > alphaOrig) {
      // AI.PV[ply] = bestmove
      AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
      AI.saveHistory(turn, bestmove, depth)
      return bestscore
    } else {
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

AI.createPSQT = function (chessPosition) {

  AI.PIECE_SQUARE_TABLES_APERTURE = [
  // Pawn
      [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0, 
      0,  0,  0,  0,  0,  0,  0,  0, 
      0,  0,  0, 40, 40,  0,  0,  0, 
    -20,-20, 10, 40, 40, 10,-20,-20, 
     20, 20, 20, 10, 10,-10, 20, 20, 
     20, 20, 20,-20,-20, 50, 50, 50,
      0,  0,  0,  0,  0,  0,  0,  0
      ],

      // Knight
      [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,-20,  0,  0,  0,  0,-20,  0,
    -20,  0,  0,  0,  0,  0,  0,-20,
    -40,  0, 40,  0,  0, 40,  0,-40,
      0,  0,  0, 20, 20,  0,  0,  0,
      0,-20,  0,  0,  0,  0,-20,  0,
      
      ],
      // Bishop
    [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,-40,  0,  0,  0,  0,-40,  0,
      0,  0, 20,  0,  0, 20,  0,  0,
    -40,  0,  0,-20,-20,  0,  0,-40,
      0, 40,  0, 20, 20,  0, 40,  0,
      0,  0,-20,  0,  0,-20,  0,  0,
    ],
    // Rook
    [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,-10,-20, 30, 40, 20,-10,  0,
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
       0, 0, 0,10,10, 0, 0, 0,
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
      -50,-50,-50,-50,-20,-30,100, 50

    ]
  ]

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

  let color = chessPosition.getTurnColor()

  let P = chessPosition.getPieceColorBitboard(0, color)
  let N = chessPosition.getPieceColorBitboard(1, color)
  let B = chessPosition.getPieceColorBitboard(2, color)
  let R = chessPosition.getPieceColorBitboard(3, color)
  let Q = chessPosition.getPieceColorBitboard(4, color)
  let K = chessPosition.getPieceColorBitboard(5, color)
  let KX = chessPosition.getPieceColorBitboard(5, !color)

  let pawnmask = Chess.Position.makePawnAttackMask(color, P)

  let pawnmap = AI.bin2map(P, color)
  let pawnstructure  = AI.bin2map({high: P.high | pawnmask.high, low: P.low | pawnmask.low}, color)

  let kingmap = AI.bin2map(K, color)
  let kingXmap = AI.bin2map(KX, color)

  let kingposition = kingmap.indexOf(1)

  let kingXposition = kingXmap.indexOf(1)

  //Estructura básica peones
  AI.PIECE_SQUARE_TABLES_MIDGAME[0] = pawnstructure.map((e,i)=>{
    if (i === kingposition) return 0

    let kingsafety = 100/(1+Math.pow(AI.distance(kingposition, i), 2)) | 0

    return kingsafety
  })

  //Castiga captura y maniobras con peón frontal del rey
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 15] -=20
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 17] -=20
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 24] -=20 //Bug: Si peós`

  //Peones al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[0] = AI.PIECE_SQUARE_TABLES_MIDGAME[0].map((e,i)=>{
    return e + (20 - AI.manhattanDistance(28, i) * 4) | 0
  })

  AI.PIECE_SQUARE_TABLES_MIDGAME[0][27]+=50
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][28]+=50
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][35]+=50
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][36]+=50

  //Caballos al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
    return e + (4 - AI.manhattanDistance(28, i)) * 10
  })

  //Caballos cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
    return e + 14 - AI.manhattanDistance(kingXposition, i)
  })

  //Alfiles al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
    return e + (4 - AI.manhattanDistance(28, i)) * 10
  })

  //Torres en columnas abiertas
  let opencol

  for (let i = 0; i < 8; i++) {
      opencol = pawnmap[7 - i+32] + 
                pawnmap[7 - i+40] + 
                pawnmap[7 - i+48] + 
                pawnmap[7 - i+56]

    if (opencol == 0) {
      AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,j)=>{
        return e + (j % 8 == i % 8? 41 : 0)
      })
    }
  }

  AI.PIECE_SQUARE_TABLES_MIDGAME[3].reverse() //Revertir una sola vez

  //Torres en séptima
  for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_MIDGAME[3][i] += 20

  //Dama cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_MIDGAME[4] = AI.PIECE_SQUARE_TABLES_MIDGAME[4].map((e,i)=>{
    return 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

  //Rey lejos del centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[5] = AI.PIECE_SQUARE_TABLES_MIDGAME[5].map((e,i)=>{
    return e + Math.pow(AI.manhattanDistance(28, i), 2) * 4 - 50
  })

  //Rey fuera de las esquinas por poca movilidad y riesgo de mate de pasillo
  AI.PIECE_SQUARE_TABLES_MIDGAME[5][0]  -= 100
  AI.PIECE_SQUARE_TABLES_MIDGAME[5][7]  -= 100
  AI.PIECE_SQUARE_TABLES_MIDGAME[5][56] -= 100
  AI.PIECE_SQUARE_TABLES_MIDGAME[5][63] -= 100

  //////////////// Rayos X ///////////////////////
  let KB = chessPosition.makeBishopAttackMask(KX, false)
  let KBmap = AI.bin2map(KB, color)

  let KR = chessPosition.makeRookAttackMask(KX, false)
  let KRmap = AI.bin2map(KR, color)

  //Alfiles apuntando al rey
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
    return e + 20*KBmap[i]
  })

  //Torres apuntando al rey
  AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,i)=>{
    return e + 20*KRmap[i]
  })

  //Dama apuntando al rey
  AI.PIECE_SQUARE_TABLES_MIDGAME[4] = AI.PIECE_SQUARE_TABLES_MIDGAME[4].map((e,i)=>{
    return e + 20*KBmap[i]
  })

  AI.PIECE_SQUARE_TABLES_MIDGAME[4] = AI.PIECE_SQUARE_TABLES_MIDGAME[4].map((e,i)=>{
    return e + 20*KRmap[i]
  })

  // console.log(AI.PIECE_SQUARE_TABLES_MIDGAME)

  ///////////////////////////// ENDGAME ////////////////////////

  AI.PIECE_SQUARE_TABLES_ENDGAME[0] = pawnstructure.map((e,i)=>{
    if (i === kingposition) return 0

    let positional = 50 - 2*i

    return positional | 0
  })
  
  //Caballos cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[1] = AI.PIECE_SQUARE_TABLES_ENDGAME[1].map((e,i)=>{
    return 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

  //Alfiles al centro
  AI.PIECE_SQUARE_TABLES_ENDGAME[2] = AI.PIECE_SQUARE_TABLES_ENDGAME[2].map((e,i)=>{
    return e + (4 - AI.manhattanDistance(28, i)) * 10
  })

  //Dama cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[4] = AI.PIECE_SQUARE_TABLES_ENDGAME[4].map((e,i)=>{
    return 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

  //Peones lejos del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[0] = AI.PIECE_SQUARE_TABLES_ENDGAME[0].map((e,i)=>{
    return 4 * AI.manhattanDistance(kingXposition, i)
  })

  //Rey cerca del centro
  AI.PIECE_SQUARE_TABLES_ENDGAME[5] = AI.PIECE_SQUARE_TABLES_ENDGAME[5].map((e,i)=>{
    return e + 50 - Math.pow(AI.manhattanDistance(28, i), 2) * 2
  })

  /////////////////// PSQT a sigmoidea ///////////////////////

  for (let i = 0; i < 6; i++) {
    AI.PIECE_SQUARE_TABLES_MIDGAME[i] = AI.PIECE_SQUARE_TABLES_MIDGAME[i].map(psqv=>{
      return 40/(1 + Math.exp(-psqv/10)) - 20
    })
  }

  for (let i = 0; i < 6; i++) {
    AI.PIECE_SQUARE_TABLES_ENDGAME[i] = AI.PIECE_SQUARE_TABLES_ENDGAME[i].map(psqv=>{
      return 40/(1 + Math.exp(-psqv/10)) - 20
    })
  }
}

AI.setStage = function (chessPosition) {
  stage = 1 //Apertura
  let color = chessPosition.getTurnColor()

  if (AI.nofpieces <= 28 || chessPosition.madeMoves.length > 20) {
      stage = 2 //'midgame'
  }

  let queens = chessPosition.getPieceColorBitboard(4, color).popcnt() + chessPosition.getPieceColorBitboard(4, !color).popcnt()

  if (AI.nofpieces <= 18 && queens === 0) {
    stage = 3 //endgame
  }
  
  AI.createPSQT(chessPosition)


  if (stage == 1) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_APERTURE]

  if (stage == 2) {
    AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_MIDGAME]
  }

  if (stage >= 3) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_ENDGAME]

  AI.randomizePSQT()
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

  let nmoves = chessPosition.madeMoves.length

  if (nmoves <= 2) {
    AI.createTables()
  }

  console.log(AI.history[0])

  AI.reduceHistory()

  if (!AI.PIECE_VALUES || nmoves < 2) {
    AI.PIECE_VALUES = AI.INITIAL_PIECE_VALUES
  }

  console.log(AI.PIECE_VALUES)

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

    let fhfperc = 0

    AI.setStage(chessPosition)
  
    AI.PV = AI.getPV(chessPosition, 1)
    

    for (let depth = 1; depth <= (Math.max(totaldepth, AI.PV.length + 1)); depth+=1) {
        AI.bestmove = [...AI.PV][1]
        lastscore = score

        iteration++

        fh = fhf = 0.01
        
        score = (white? 1 : -1) * AI.PVS(chessPosition, -Infinity, Infinity, depth, 1)
        
        AI.PV = AI.getPV(chessPosition, iteration + 6)

        let strmove = AI.PV[1]? AI.PV[1].getString() : '----'
        
        if (AI.stop && iteration > mindepth && AI.bestmove) {
            break
        }
        
        fhfperc = Math.round(fhf*100/fh)

        console.log(iteration, depth, AI.PV.map(e=>{ return e? e.getString() : '---'}).join(' '), '     |     FHF ' + fhfperc + '%', score)

    }
    
    if (!AI.bestmove) {      
        AI.search(chessPosition, options)
    }

    // console.info('                ')
    console.log(nodes, ' nodes |', qsnodes,' QS nodes|')
    if (TESTER) {
      console.info('___________________________________ TESTER _____________________________________')
    } else {
      console.info('________________________________________________________________________________')
    }

    console.log(AI.bestmove)

    let sigmoid = 1/(1+Math.pow(10, -lastscore/400))

    resolve({move: AI.bestmove, score: lastscore | 0, sigmoid: (sigmoid * 100 | 0)/100, stage, iteration, nodes, qsnodes, FHF: fhfperc+'%'})
  })
}

module.exports = AI