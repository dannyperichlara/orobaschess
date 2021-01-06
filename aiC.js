"use strict"

let Chess = require('./chess.js')

let TESTER, nodes, qsnodes, enodes, iteration, status, fhf, fh
let totaldepth = 48
let random = 40
let stage = 1
let htlength = 1 << 24
let reduceHistoryFactor = 0.2
let secondspermove = 0.5
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
1,1,0,8,8,8,27,216,
125,125,8,512,1000,512,729,2744,
5832,4096,1331,4096,8000,13824,10648,32768,
54872,59319,19683,531441,328509,68921,54872,226981,
405224,250047,1295029,1404928,912673,421875,262144,704969,
226981,117649,64000,21952,157464,117649,456533,125000,
0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,
  ],

  [
0,0,8,1,1,216,27,0,
8,8,27,4096,216,512,1,1000,
8,64,729,729,1728,10648,2744,512,
1331,42875,42875,32768,357911,4096,64000,1331,
1000,5832,35937,85184,97336,54872,4096,4096,
1000,10648,2248091,117649,46656,5088448,5832,12167,
729,512,2744,226981,54872,5832,1000,2744,
0,1331,3375,1000,4096,8000,1000,0,
  ],

  [
24389,512,27,1331,6859,2744,0,1,
125,8000,3375,2197,3375,64,729,512,
4913,1000,132651,15625,8000,103823,729,4913,
6859,185193,13824,35937,250047,12167,166375,1000,
2197,39304,29791,19683,157464,941192,6859,15625,
4913,3375,238328,681472,328509,125000,59319,9261,
512,42875,59319,1225043,389017,4096,405224,4913,
2744,17576,32768,32768,35937,68921,64,54872,
  ],

  [
68921,97336,4913,17576,39304,54872,12167,46656,
85184,46656,15625,21952,32768,74088,35937,74088,
35937,85184,15625,46656,17576,195112,17576,24389,
74088,125000,10648,24389,74088,35937,24389,12167,
15625,79507,13824,32768,17576,35937,19683,6859,
32768,166375,110592,91125,32768,91125,132651,17576,
79507,226981,357911,357911,250047,238328,97336,110592,
970299,2985984,3652264,2248091,2000376,4410944,343000,157464,
  ],

  [
8000,79507,15625,132651,19683,24389,32768,5832,
64000,50653,132651,32768,27000,24389,8000,4096,
6859,125000,79507,103823,15625,157464,97336,8000,
29791,103823,91125,110592,74088,35937,85184,32768,
42875,68921,68921,110592,64000,132651,132651,39304,
5832,140608,226981,238328,343000,148877,42875,21952,
17576,74088,1481544,125000,636056,29791,5832,5832,
10648,54872,54872,274625,97336,6859,2197,1000,
  ],

  [
343,4913,50653,39304,4913,5832,140608,2744,
10648,68921,110592,68921,27000,110592,274625,12167,
21952,32768,85184,91125,74088,117649,125000,17576,
6859,68921,74088,50653,175616,205379,125000,13824,
2197,74088,97336,287496,474552,300763,195112,35937,
12167,97336,314432,531441,1295029,2000376,1771561,753571,
117649,175616,287496,2197000,1685159,2048383,8615125,3241792,
42875,238328,614125,551368,830584,2197000,13997521,389017,
  ]]

  AI.history[1] = [
    [
      0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,
42875,551368,438976,35937,658503,117649,300763,226981,
493039,405224,405224,1860867,438976,314432,195112,373248,
64000,166375,140608,59319,79507,24389,27000,50653,
3375,13824,15625,216,2197,4913,5832,2197,
343,2197,512,27,512,125,125,125,
27,125,27,1,64,8,1,27,
      ],
      [
        0,1331,1000,729,9261,6859,1000,1,
64,125,5832,884736,117649,729,4096,64,
4913,13824,1061208,91125,21952,3307949,15625,4096,
19683,1331,68921,79507,54872,125000,1728,9261,
343,13824,24389,32768,226981,8000,1331,3375,
512,1728,10648,5832,512,2744,125,1,
1,27,216,1728,125,8,1,0,
1,8,1,0,125,1,0,0,
      ],
      [
        1331,125,27000,117649,17576,97336,343,27,
1331,658503,8000,216000,2299968,13824,5832,64,
132651,3375,79507,110592,157464,103823,17576,2744,
729,21952,35937,54872,2197,8000,10648,8000,
4096,389017,64000,74088,29791,4913,15625,3375,
19683,1000,79507,54872,8000,27000,3375,512,
216,74088,29791,1331,2197,15625,343,8,
39304,1728,8000,24389,1000,1728,512,1,
      ],
      [
        274625,830584,970299,1157625,1953125,3241792,314432,110592,
175616,140608,175616,300763,373248,117649,125000,85184,
68921,32768,29791,15625,50653,19683,8000,12167,
68921,24389,32768,64000,32768,10648,4913,21952,
91125,46656,9261,2744,5832,512,10648,4913,
314432,262144,54872,50653,9261,5832,15625,8000,
274625,125000,68921,15625,54872,32768,19683,46656,
1124864,729000,512000,175616,140608,205379,97336,262144,
      ],
      [
        17576,27000,157464,287496,216000,343000,8000,512,
50653,85184,1092727,1124864,2985984,287496,54872,4913,
1728,74088,103823,205379,185193,250047,54872,13824,
27000,32768,35937,166375,39304,438976,658503,110592,
64000,74088,19683,74088,132651,250047,195112,110592,
110592,148877,110592,15625,195112,205379,117649,35937,
39304,125000,103823,125000,91125,140608,85184,15625,
85184,148877,148877,195112,50653,74088,46656,79507,
      ],
      [
        6859,39304,148877,1061208,2197000,1953125,2299968,405224,
19683,226981,314432,4826809,4826809,2985984,5639752,1643032,
64000,103823,1030301,1259712,2248091,1331000,551368,238328,
46656,46656,238328,389017,250047,59319,27000,4096,
5832,12167,157464,74088,140608,42875,15625,2744,
512,29791,59319,39304,9261,32768,42875,4913,
32768,27000,17576,1331,27000,59319,9261,4913,
91125,110592,343,343,6859,24389,2299968,9261,
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
  if (move.pv) {
    return 1e9
  } else if (move.tt) { 
    return 1e8 + move.tt
  } else if (move.isCapture()) {  
    move.capture = true 
    let mvvlva = 1e7 + (move.getCapturedPiece() + 1)/(move.getPiece() + 1)  
    return mvvlva
  } else if (move.hvalue) { 
    move.hmove = true 
    return move.hvalue
  } else {  
    move.vmove = true 
    return Math.log(move.value)
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
    let hashkey = chessPosition.hashKey.getHashKey()
    let ttEntry = AI.ttGet(hashkey)

    if (ttEntry && ttEntry.flag === 0) {
        return ttEntry.score          
    }

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
          return beta;
        }

        if( score > alpha ) {
          AI.saveHistory(turn, move, 0)
          alpha = score
          bestscore = score
        }
      }
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
      let min = Math.min(...AI.history[color][piece])
      
      for (let to = 0; to < 64; to++) {
        AI.history[color][piece][to] = (reduceHistoryFactor*min + ((1 - reduceHistoryFactor) * AI.history[color][piece][to])) | 0
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
    AI.PVS(chessPosition, alpha, beta, depth-2, ply)
    ttEntry = AI.ttGet(hashkey)
  }

  if( depth <= 0 ) {
    if (ttEntry && ttEntry.flag === 0) {
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

  let moves = chessPosition.getMoves(false, false)
  moves = AI.sortMoves(moves, turn, ply, chessPosition, ttEntry, pvMoveValue)

  let legal = 0
  let bestscore = -Infinity
  let score

  if (AI.stop && iteration > mindepth) return alpha

  let incheck = chessPosition.isKingInCheck()
  
  let hmoves = 0

  let halfmax = [
    Math.max(...AI.history[turn][0]) * 0.5,
    Math.max(...AI.history[turn][1]) * 0.5,
    Math.max(...AI.history[turn][2]) * 0.5,
    Math.max(...AI.history[turn][3]) * 0.5,
    Math.max(...AI.history[turn][4]) * 0.5,
    Math.max(...AI.history[turn][5]) * 0.5,
  ]

  
  
  for (let i=0, len=moves.length; i < len; i++) {
    let move = moves[i]
    let piece = move.getPiece()
    let to = move.getTo()
    let hmove = !!move.hmove
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
        if (!incheck) {
            //https://chess.ultimaiq.net/cc_in_detail.htm
            R += 0.22 * depth * (1 - Math.exp(-8.5/depth)) * Math.log(i)
            
            //History reduction
            if (AI.history[turn][piece][to] < halfmax[piece]) R += 1

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
          AI.ttSave(hashkey, -AI.MATE + ply, 0, depth, moves[i])
          bestmove  = moves[i]
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

            // AI.PV[ply] = moves[i]
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

        fh = fhf = 1
        
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