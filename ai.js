"use strict"

let Chess = require('./chess.js')

let TESTER, nodes, qsnodes, enodes, iteration, status, fhf, fh
let totaldepth = 48
let random = 40
let phase = 1
let htlength = 2e7
let reduceHistoryFactor = 0.1
let secondspermove = 1
let mindepth = 2

let AI = function() {

}

//Carlsen, according to https://github.com/WinPooh/pgnlearn
// AI.MIDGAME_PIECE_VALUES = [141, 300, 342, 495, 1107, 20000]

//https://www.r-bloggers.com/2015/06/big-data-and-chess-what-are-the-predictive-point-values-of-chess-pieces/
// AI.MIDGAME_PIECE_VALUES = [140, 300, 330, 520, 850, 20000]

//128, 782, 830, 1289, and 2529 in the opening and 213, 865, 918, 1378, and 2687 in the endgame. (Stockfish)
AI.MIDGAME_PIECE_VALUES = [128, 782, 830, 1289, 2529, 20000]
AI.ENDGAME_PIECE_VALUES = [213, 865, 918, 1378, 2687, 20000]


AI.MATE = AI.MIDGAME_PIECE_VALUES[5]
AI.DRAW = 0
AI.INFINITY = AI.MIDGAME_PIECE_VALUES[5]*4

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

/*
  for (let color = 0; color < 2; color++) {
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
  if (phase === 1) {
    //Sólo de caballo a dama
    for (let i = 1; i < 5; i++) {
      AI.PIECE_SQUARE_TABLES[i] = AI.PIECE_SQUARE_TABLES[i].map(e=>{
        return e + Math.random() * random - random/2 | 0
      })
    }    
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
  let mobility = 0// AI.mobility(chessPosition, color) - AI.mobility(chessPosition,  !color)

  // console.log('EEEEEEEEEEEEEEEEEEEEE', psqt)

  // console.log(AI.PIECE_SQUARE_TABLES)

  // if (color === 0) material += 20 //Diminishes White effect

  //https://www.r-bloggers.com/2015/06/big-data-and-chess-what-are-the-predictive-point-values-of-chess-pieces/
  if (colorMaterial.P > notcolorMaterial.P) material += 60

  return material + psqt + mobility
}

AI.mobility = function(chessPosition, color) {
    let us = chessPosition.getColorBitboard(color)  
    let enemy = chessPosition.getColorBitboard(!color)  
    let empty = chessPosition.getEmptyBitboard().dup()//.or(enemy)  
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

AI.getMaterialValue = function(chessPosition, color) {
    let value = 0

    let P = chessPosition.getPieceColorBitboard(0, color).popcnt()
    let N = chessPosition.getPieceColorBitboard(1, color).popcnt()
    let B = chessPosition.getPieceColorBitboard(2, color).popcnt()
    let R = chessPosition.getPieceColorBitboard(3, color).popcnt()
    let Q = chessPosition.getPieceColorBitboard(4, color).popcnt()

    value = P*AI.PIECE_VALUES[0] + N*AI.PIECE_VALUES[1] + B*AI.PIECE_VALUES[2] + R*AI.PIECE_VALUES[3] + Q*AI.PIECE_VALUES[4]

    //Bishop pair: https://www.r-bloggers.com/2015/06/big-data-and-chess-what-are-the-predictive-point-values-of-chess-pieces/
    value += B > 1? 110 : 0

    return {value, P, N, B, R, Q}
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
  if (move.tt) {
    return 1e9
  } else if (move.pv) { 
    return 1e8
  } else if (move.mvvlva && move.mvvlva >= 1) {  
    move.capture = true 
    return 1e7 + move.mvvlva
  }else if (move.promotion) {
    return 1e6 + move.promotion
  } else if (move.killer) {
    return 1e5
  } else if (move.hvalue) { 
    move.hmove = true 
    return move.hvalue
  } else if (move.mvvlva && move.mvvlva < 1) {
    move.badcapture = true
    return -1e4 + move.mvvlva
  } else {  
    move.psqtvalue = AI.PIECE_SQUARE_TABLES[move.getPiece()][move.getTo()]
    return move.psqtvalue - 200
  } 
}


AI.sortMoves = function(moves, turn, ply, chessPosition, ttEntry, pvMoveValue) {

  for (let i = 0, len = moves.length; i < len; i++) {
    let move = moves[i]
    if (ttEntry && move.value === ttEntry.move.value) move.tt = true

    if (pvMoveValue === move.value) {
      move.pv = true
    }

    if (AI.killers[ply] && (AI.killers[ply].killer1.value === move.value || AI.killers[ply].killer2.value === move.value)) move.killer = true

    if (move.isCapture()) move.mvvlva = (move.getCapturedPiece() + 1)/(move.getPiece() + 1)

    let kind = move.getKind()
    if (kind >=8) move.promotion = kind

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

    let legal = 0
    let standpat
    let bestmove
    let bestscore
    let incheck

    qsnodes++

    standpat = AI.evaluate(chessPosition, pvNode)

    if (standpat >= beta ) {
      return beta
    }

    if (standpat > alpha) alpha = standpat

    let moves

    moves = chessPosition.getMoves(false, !chessPosition.isKingInCheck())

    moves = AI.sortMoves(moves, turn, ply, chessPosition, null, AI.PV[ply]? AI.PV[ply].value : null)

    for (let i=0, len=moves.length; i < len; i++) {

      let move = moves[i]

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

    if (bestmove) {
      let hashkey = chessPosition.hashKey.getHashKey()
      AI.ttSave(hashkey, bestscore, 0, 0, bestmove)
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
        AI.history[color][piece][to] = ((1 - reduceHistoryFactor) * AI.history[color][piece][to]) | 0
      }
    }
  }
}

AI.saveHistory = function(turn, move, depth) {
  AI.history[turn][move.getPiece()][move.getTo()] += Math.pow(depth, 2) | 0
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
    // AI.PVS(chessPosition, alpha, beta, 2, ply)
    ttEntry = AI.ttGet(hashkey)

  }

  if( depth <= 0 ) {
    if (ttEntry && ttEntry.depth <= 0) {
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
        AI.addKiller(ply, ttEntry.move)
        return ttEntry.score
      }
  }

  let pvMoveValue = AI.PV[ply]? AI.PV[ply].value : null

  if (AI.stop && iteration > mindepth) return alpha

  let moves = chessPosition.getMoves(false, false)

  moves = AI.sortMoves(moves, turn, ply, chessPosition, ttEntry, pvMoveValue)

  let legal = 0
  let bestscore = -Infinity
  let score



  let incheck = chessPosition.isKingInCheck()
  
  // let standpat = AI.evaluate(chessPosition)

  let hmoves = 0  


  for (let i=0, len=moves.length; i < len; i++) {
    let move = moves[i]
    let R = 0
    let E = 0
    // console.log('ssssssssssssssssssssssssss')

    if (chessPosition.makeMove(move)) {
      legal++

      let isCapture = move.isCapture()

      //EXTENSIONS
      if (incheck && depth < 3) {
        E = 1
      }

      if (legal === 1) {
        score = -AI.PVS(chessPosition, -beta, -alpha, depth+E-1, ply+1)
      } else {
        //REDUCTIONS (LMR)

        if (!incheck && depth >= 1) {
          // R += 0.22 * depth * (1 - Math.exp(-8.5/depth))
          R += Math.log(depth) * Math.log(legal) / 1.95
        }


        /*if (!incheck) {
          if (iteration <= 6 && !AI.stop) {
            //https://chess.ultimaiq.net/cc_in_detail.htm
            R += 0.22 * depth * (1 - Math.exp(-8.5/depth)) * Math.log(i)
            // R += Math.log(depth) * Math.log(i) / 1.95            
          } else {
            if (AI.stop) {
              R += 1 + depth/2 + i/5
            } else {
              R += Math.log(depth) * Math.log(i)
            }
          }

          if (R < 1) R = 1

          //Odd-Even effect. Prune more agressively on even plies
          // if (TESTER && depth % 2 === 0) R+=1
        }*/

        score = -AI.PVS(chessPosition, -alpha-1, -alpha, depth/*+E*/-R-1, ply+1)

        if (/*!AI.stop && */score > alpha /*&& score < beta*/) { //https://www.chessprogramming.org/Principal_Variation_Search
          // console.log('research')
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

            AI.addKiller(ply, move)

            //LOWERBOUND
            AI.ttSave(hashkey, score, -1, depth, move)
            if (!isCapture) AI.saveHistory(turn, move, depth)
            return score
          }
          
          AI.ttSave(hashkey, score, 1, depth, move) //??????????????????????
          
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
      // EXACT
      AI.ttSave(hashkey, bestscore, 0, depth, bestmove)
      AI.saveHistory(turn, bestmove, depth)
      return bestscore
    } else {
      //UPPERBOUND value <= alphaorig
      AI.ttSave(hashkey, alphaOrig, 1, depth, bestmove)
      return alphaOrig
    }
  }
  
}

AI.addKiller = function (ply, move) {
  let killers = AI.killers[ply]

  if (!killers) return

  if (killers.killer1.value === move.value || killers.killer2.value === move.value) {
    return
  }

  if (!killers.killer1) {
    killers.killer1 = move
    return
  }

  if (!killers.killer2) {
    killers.killer2 = move;
    return
  }

  let temp = killers.killer1
  killers.killer1 = move
  killers.killer2 = temp

  // console.log(ply, killers)
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
     20, 20, 30, 10, 10,-10, 20, 20, 
     20, 20,  0,-20,-20, 50, 50, 50,
      0,  0,  0,  0,  0,  0,  0,  0
      ],

      // Knight
      [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,-20, 20,  0,  0, 20,-20,  0,
    -80,  0,  0, 20, 20,  0,  0,-80,
    -40, 20, 40,  0,  0, 40, 40,-40,
      0,  0,  0, 40, 20,  0,  0,  0,
      0,-20,  0,-40,-40, 20,-20,  0,
      
      ],
      // Bishop
    [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,-40,  0,  0,  0,  0,-40,  0,
      0,  0, 40,  0,  0, 40,  0,  0,
    -40, 40,-20,-20,-20,-20, 20,-40,
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
      -50, 20,-50,-50,-20,-30,100, 50

    ]
  ]

  for (let i = 0; i < 6; i++) {
    AI.PIECE_SQUARE_TABLES_APERTURE[i] = AI.PIECE_SQUARE_TABLES_APERTURE[i].map(e=>e/2)
  }

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
  let RX = chessPosition.getPieceColorBitboard(3, !color)
  let QX = chessPosition.getPieceColorBitboard(4, !color)
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

    return 10*AI.manhattanDistance(kingposition, i) - 28
  })

  //Castiga captura y maniobras con peón frontal del rey
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 7] +=200
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 8] +=200
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 9] +=200

  AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 15] -=200
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 17] -=200
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 24] -=200

  //Peones al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][27]+=40
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][28]+=40
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][35]+=40
  AI.PIECE_SQUARE_TABLES_MIDGAME[0][36]+=40

  //Caballos al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
    return e + 40 - 16 * AI.distance(28, i)
  })

  //Caballos cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
    return e + 20 - 4 * AI.distance(kingXposition, i)
  })

  //Castiga caballos sin desarrollar
  AI.PIECE_SQUARE_TABLES_MIDGAME[1][57] -= 20
  AI.PIECE_SQUARE_TABLES_MIDGAME[1][62] -= 20

  //Alfiles al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
    return e + (4 - AI.manhattanDistance(28, i)) * 10
  })

  //Castiga alfiles sin desarrollar
  AI.PIECE_SQUARE_TABLES_MIDGAME[2][58] -= 40
  AI.PIECE_SQUARE_TABLES_MIDGAME[2][61] -= 40

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

  //Torres delante del rey enemigo ("torre en séptima")
  for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_MIDGAME[3][i + 8*(kingXposition/8 | 0)] += 27

  //Dama al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
    return e + (4 - AI.manhattanDistance(28, i)) * 10
  })

  //Rey en columnas abiertas
  let Kopencol

  for (let i = 0; i < 8; i++) {
      Kopencol = pawnmap[7 - i+32] + 
                pawnmap[7 - i+40] + 
                pawnmap[7 - i+48] + 
                pawnmap[7 - i+56]

    if (Kopencol == 0) {
      AI.PIECE_SQUARE_TABLES_MIDGAME[5] = AI.PIECE_SQUARE_TABLES_MIDGAME[5].map((e,j)=>{
        return e + (j % 8 == i % 8? -47 : 0)
      })
    }
  }

  AI.PIECE_SQUARE_TABLES_MIDGAME[5].reverse() //Revertir una sola vez

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

  let RB = chessPosition.makeBishopAttackMask(RX, false)
  let RBmap = AI.bin2map(RB, color)
  
  let QB = chessPosition.makeBishopAttackMask(QX, false)
  let QBmap = AI.bin2map(QB, color)

  let KR = chessPosition.makeRookAttackMask(KX, false)
  let KRmap = AI.bin2map(KR, color)

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

  if (kingXposition % 8 < 7) {
    AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
      return e + 20*(KBmap[i + 1] || 0)
    })    
  }

  if (kingXposition % 8 > 0) {
    AI.PIECE_SQUARE_TABLES_MIDGAME[2] = AI.PIECE_SQUARE_TABLES_MIDGAME[2].map((e,i)=>{
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

  //Dama apuntando al rey
  AI.PIECE_SQUARE_TABLES_MIDGAME[4] = AI.PIECE_SQUARE_TABLES_MIDGAME[4].map((e,i)=>{
    return e + 10*KBmap[i]
  })

  AI.PIECE_SQUARE_TABLES_MIDGAME[4] = AI.PIECE_SQUARE_TABLES_MIDGAME[4].map((e,i)=>{
    return e + 20*KRmap[i]
  })

  // console.log(AI.PIECE_SQUARE_TABLES_MIDGAME)

  ///////////////////////////// ENDGAME ////////////////////////

  AI.PIECE_SQUARE_TABLES_ENDGAME[0] = pawnstructure.map((e,i)=>{
    if (i === kingposition) return 0

    return (64 - i) * 4 - 100  | 0
  })
  
  //Caballos al centro
  AI.PIECE_SQUARE_TABLES_ENDGAME[1] = AI.PIECE_SQUARE_TABLES_ENDGAME[1].map((e,i)=>{
    return e + 40 - 16 * AI.distance(28, i)
  })

  //Caballos cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[1] = AI.PIECE_SQUARE_TABLES_ENDGAME[1].map((e,i)=>{
    return e + 40 - 8 * AI.distance(kingXposition, i)
  })

  //Alfiles al centro
  AI.PIECE_SQUARE_TABLES_ENDGAME[2] = AI.PIECE_SQUARE_TABLES_ENDGAME[2].map((e,i)=>{
    return e + (4 - AI.manhattanDistance(28, i)) * 10
  })

  //Torres en columnas abiertas

  for (let i = 0; i < 8; i++) {
      opencol = pawnmap[7 - i+32] + 
                pawnmap[7 - i+40] + 
                pawnmap[7 - i+48] + 
                pawnmap[7 - i+56]

    if (opencol == 0) {
      AI.PIECE_SQUARE_TABLES_ENDGAME[3] = AI.PIECE_SQUARE_TABLES_ENDGAME[3].map((e,j)=>{
        return e + (j % 8 == i % 8? 41 : 0)
      })
    }
  }

  AI.PIECE_SQUARE_TABLES_ENDGAME[3].reverse() //Revertir una sola vez

  //Torres delante del rey enemigo ("torre en séptima")
  for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_ENDGAME[3][i + 8*(kingXposition/8 | 0)] += 27

  //Dama cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[4] = AI.PIECE_SQUARE_TABLES_ENDGAME[4].map((e,i)=>{
    return 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

  //Rey cerca del centro
  AI.PIECE_SQUARE_TABLES_ENDGAME[5] = AI.PIECE_SQUARE_TABLES_ENDGAME[5].map((e,i)=>{
    return e + 50 - Math.pow(AI.manhattanDistance(28, i), 2) * 2
  })
}

AI.PSQT2Sigmoid = function () {
  /////////////////// PSQT a sigmoidea ///////////////////////

  let limit = 80

  for (let i = 0; i <= 5; i++) {
    AI.PIECE_SQUARE_TABLES[i] = AI.PIECE_SQUARE_TABLES[i].map(psqv=>{
      return (limit*2)/(1 + Math.exp(-psqv/(limit/2))) - limit | 0
    })
  }

  console.log(AI.PIECE_SQUARE_TABLES)
}

AI.setphase = function (chessPosition) {
  phase = 1 //Apertura
  let color = chessPosition.getTurnColor()


  if (AI.nofpieces < 28 || chessPosition.madeMoves.length > 20) {
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
      let moves = chessPosition.getMoves(false, false).filter(move=>{
        return move.value === ttEntry.move.value
      })

      if (moves.length) {
        if (chessPosition.makeMove(ttEntry.move)) {
          ttFound = true
          legal++
          PV.push(ttEntry.move)
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

  let nmoves = chessPosition.madeMoves.length

  if (nmoves <= 2) {
    AI.createTables()
  }

  AI.reduceHistory()

  if (!AI.PIECE_VALUES || nmoves < 2) {
    AI.PIECE_VALUES = AI.MIDGAME_PIECE_VALUES
  }

  return new Promise((resolve, reject) => {
    let color = chessPosition.getTurnColor()
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
    iteration = 0

    AI.nofpieces = chessPosition.getOccupiedBitboard().popcnt()

    let staticeval = AI.evaluate(chessPosition)

    AI.timer = (new Date()).getTime()
    AI.stop = false

    let score = 0, lastscore = 0

    let status = 0

    let fhfperc = 0

    AI.setphase(chessPosition)
  
    AI.PV = AI.getPV(chessPosition, 1)

    //Creates killers
    AI.killers = new Array(totaldepth)
    for (let i = 0; i < totaldepth;  i++) AI.killers[i] = {killer1: {value:0}, killer2: {value:0}}

    let alpha = -Infinity
    let beta = Infinity

    for (let depth = 1; depth <= totaldepth; depth+=1) {
        // console.log(AI.killers)
        AI.bestmove = [...AI.PV][1]

        if (AI.stop && iteration > mindepth) {
            break
        }

        lastscore = score

        iteration++

        fh = fhf = 0.001
        
        score = (white? 1 : -1) * AI.PVS(chessPosition, alpha, beta, depth, 1)


        AI.PV = AI.getPV(chessPosition, iteration + totaldepth)

        let strmove = AI.PV[1]? AI.PV[1].getString() : '----'
        
        
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

    resolve({move: AI.bestmove, score: lastscore | 0, sigmoid: (sigmoid * 100 | 0)/100, phase, iteration, nodes, qsnodes, FHF: fhfperc+'%'})
  })
}

module.exports = AI