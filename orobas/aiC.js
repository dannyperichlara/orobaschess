"use strict"

/* Imports Move Generator */
const Chess = require('../chess/chess.js')

// Math.seedrandom((new Date()).toTimeString())

let AI = {
  totaldepth: 30,
  ttNodes: 0,
  iteration: 0,
  qsnodes: 0,
  nodes: 0,
  status: null,
  fhf: 0,
  fh: 0,
  random: 40,
  phase: 1,
  htlength: 1 << 24,
  reduceHistoryFactor: 1, //1, actúa sólo en la actual búsqueda --> mejor ordenamiento, sube fhf
  mindepth:  1,
  secondspermove: 3,
  lastmove: null
}

AI.MIDGAME_PIECE_VALUES = [124, 781, 825, 1276, 2538, 20000] // TESTEADO OK
AI.ENDGAME_PIECE_VALUES = [206, 854, 915, 1380, 2682, 20000] // TESTEADO OK
AI.FUTILITY_MARGIN = 2 * AI.MIDGAME_PIECE_VALUES[0]
AI.BISHOP_PAIR = 82
AI.MATE = AI.MIDGAME_PIECE_VALUES[5]
AI.DRAW = 0
AI.INFINITY = AI.MIDGAME_PIECE_VALUES[5]*4

//Idea and values from Stockfish. Not fully tested.
AI.MOBILITY_VALUES = [
  [
    [],
    [-62,-53,-12,-4,3,13,22,28,33],
    [-48,-20,16,26,38,51,55,63,63,68,81,81,91,98],
    [-60,-20,2,3,3,11,22,31,40,40,41,48,57,57,62],
    [-30,-12,-8,-9,20,23,23,35,38,53,64,65,65,66,67,67,72,72,77,79,93,108,108,108,110,114,114,116],
    []
  ],
  [
    [],
    [-81,-56,-31,-16,5,11,17,20,25],
    [-59,-23,-3,13,24,42,54,57,65,73,78,86,88,97],
    [-78,-17,23,39,70,99,103,121,134,139,158,164,168,169,172],
    [-48,-30,-7,19,40,55,59,75,78,96,96,100,121,127,131,133,136,141,147,150,151,168,168,171,182,182,192,219],
    []
  ]
]

//Values not full tested
AI.SAFETY_VALUES = [-20, -10,  0, 20, 20,-20,-40,-60]

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

AI.evaluate = function(board) {
  let turn = board.getTurnColor()
  let white = (turn === 0)

  let P = board.getPieceColorBitboard(0, turn).dup()
  let N = board.getPieceColorBitboard(1, turn).dup()
  let B = board.getPieceColorBitboard(2, turn).dup()
  let R = board.getPieceColorBitboard(3, turn).dup()
  let Q = board.getPieceColorBitboard(4, turn).dup()
  let K = board.getPieceColorBitboard(5, turn).dup()

  let Px = board.getPieceColorBitboard(0, !turn).dup()
  let Nx = board.getPieceColorBitboard(1, !turn).dup()
  let Bx = board.getPieceColorBitboard(2, !turn).dup()
  let Rx = board.getPieceColorBitboard(3, !turn).dup()
  let Qx = board.getPieceColorBitboard(4, !turn).dup()
  let Kx = board.getPieceColorBitboard(5, !turn).dup()

  let us = board.getColorBitboard(turn).dup()
  let usx = board.getColorBitboard(!turn).dup()

  let colorMaterial = AI.getMaterialValue(P,N,B,R,Q)
  let notcolorMaterial = AI.getMaterialValue(Px,Nx,Bx,Rx,Qx)
  let material = colorMaterial.value - notcolorMaterial.value

  let psqt = 0
  let mobility = 0
  let structure = 0
  let safety = 0
  
  psqt = AI.getPSQT(P,N,B,R,Q,K, turn) - AI.getPSQT(Px,Nx,Bx,Rx,Qx,Kx, !turn)

  if (AI.iteration < 4 || AI.changeinPV) {
    mobility = AI.getMOB(P,N,B,R,Q,K,Px,board, turn) - AI.getMOB(Px,Nx,Bx,Rx,Qx,Kx,P,board, !turn)
    structure = AI.getSTR(P, turn) - AI.getSTR(Px, !turn)
  }
  

  if (AI.phase === 2) safety = AI.getKS(K, us, turn) - AI.getKS(Kx, usx, !turn)

  let positional = psqt/5 + mobility/2 + structure + safety
    
  let score = material + positional | 0
  
  return score
}

AI.getPassed = function (P, Px) {
  
}

AI.getKS = function (K, us, turn) {
  let mask = Chess.Position.makeKingDefenseMask(turn, K).and(us)
  let safety = AI.SAFETY_VALUES[mask.popcnt()]
  
  return safety
}


AI.getSTR = function(P, color) {
  let mask = Chess.Position.makePawnAttackMask(color, P).dup()
  let protectedpawns = mask.and(P).popcnt()
  let protectedvalues = [0,20,40,40,-10,-20,-40,-80]

  return protectedvalues[protectedpawns]
}

AI.getMOB = function(P,N,B,R,Q,K,Px,board, color) {
  let us = board.getColorBitboard(color).dup()
  let them = board.getColorBitboard(!color).dup()
  let enemypawnattackmask = Chess.Position.makePawnAttackMask(!color, Px).dup()
  let space = P.dup().or(Q).or(K).or(enemypawnattackmask)
  // let space = them.or(us).or(enemypawnattackmask)
  let mobility = 0
  let phaseindex = AI.phase < 3? 0 : 1 //which values for mobility. 0: midgame. 1: endgame

  
  while (!N.isEmpty()) {
    mobility += AI.MOBILITY_VALUES[phaseindex][1][Chess.Bitboard.KNIGHT_MOVEMENTS[N.extractLowestBitPosition()].dup().and_not(enemypawnattackmask).and_not(us).popcnt()]
  }
  
  while (!B.isEmpty()) {
    let index = B.extractLowestBitPosition()
    let bishop = (new Chess.Bitboard).setBit(index)
    mobility += AI.MOBILITY_VALUES[phaseindex][2][board.makeBishopAttackMask(bishop, space).and_not(us).popcnt()]
  }
  
  while (!R.isEmpty()) {
    let index = R.extractLowestBitPosition()
    let rook = (new Chess.Bitboard).setBit(index)
    mobility += AI.MOBILITY_VALUES[phaseindex][3][board.makeRookAttackMask(rook, space).and_not(us).popcnt()]
  }
  
  while (!Q.isEmpty()) {
    let index = Q.extractLowestBitPosition()
    let queen = (new Chess.Bitboard).setBit(index)
    let qcount  = board.makeBishopAttackMask(queen, space).or(board.makeRookAttackMask(queen, space)).and_not(us).popcnt()
    
    mobility += AI.MOBILITY_VALUES[phaseindex][4][qcount]
  }
  
  if (isNaN(mobility)) return 0
  
  return mobility
}

AI.getMaterialValue = function(P,N,B,R,Q) {
    let value = 0

    value = P.popcnt()*AI.PIECE_VALUES[0] +
            N.popcnt()*AI.PIECE_VALUES[1] +
            B.popcnt()*AI.PIECE_VALUES[2] + 
            R.popcnt()*AI.PIECE_VALUES[3] + 
            Q.popcnt()*AI.PIECE_VALUES[4]

    value += B.popcnt() > 1? AI.BISHOP_PAIR : 0

    return {value, P, N, B, R, Q}
}

AI.getPSQT = function(P,B,N,R,Q,K,color) {
  
  let allpieces = [P,B,N,R,Q,K]

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
    }
    
    
    if (kind > 2) {
      move.special = kind
    }

    let hvalue = AI.history[turn][piece][to]
    let bvalue = AI.butterfly[turn][move.getFrom()][to]

    if (hvalue) {
      move.hvalue = hvalue
      move.bvalue = bvalue
    }

    move.psqtvalue = AI.PIECE_SQUARE_TABLES[piece][turn === 0? 56^to : to]

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
    return score
  }
  
  if (move.capture) {
    if (move.mvvlva>=20000) { //Goof Captures
      return 1e7 + move.mvvlva
    } else if (move.mvvlva >= 6000){ //Equal Captures
      return 1e5 + move.mvvlva
    } else {
      return -1e6 + move.mvvlva //Bad Captures
    }
  }
    
  if (move.hvalue) { //History Heuristic
    score += 1e3 + move.hvalue
    
    return score
  } 

  return move.psqtvalue - 10000 //Else, PSQT
}

AI.quiescenceSearch = function(board, alpha, beta, depth, ply, pvNode) {

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
  let standpat = AI.evaluate(board)
  let bestscore = -Infinity
  let incheck = board.isKingInCheck()
  let hashkey = board.hashKey.getHashKey()
  
  AI.qsnodes++
  
  if (standpat >= beta ) return beta
  
  /* delta pruning */ //Never worked. Why?
  // if (standpat + AI.PIECE_VALUES[4] < alpha) {
  //   // console.log(ply)
  //   return alpha
  // }

  if ( standpat > alpha) alpha = standpat;
  
  let moves = board.getMoves(false, !incheck)
  
  moves = AI.sortMoves(moves, turn, ply, board, null)
  
  let bestmove = moves[0]

  for (let i=0, len=moves.length; i < len; i++) {

    let move = moves[i]

    if (board.makeMove(move)) {
      legal++

      let score = -AI.quiescenceSearch(board, -beta, -alpha, depth-1, ply+1, pvNode)

      board.unmakeMove()

      if( score >= beta ) {
        AI.saveHistory(turn, move, 2)
        return beta
      }

      if( score > alpha ) {
        alpha = score
        bestscore = score
        bestmove = move

        AI.saveHistory(turn, move, 1)
      } else {
        AI.saveHistory(turn, move, -1)
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

  //Hash table lookup
  if (ttEntry && ttEntry.depth >= depth) {
    //testear estrictamente mayor 
    AI.ttnodes++
    
    if (ttEntry.flag === 0) {
      return ttEntry.score
      
      // alpha = ttEntry.score //No exact score because PSQTs change?
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
    
  if (AI.stop && AI.iteration > AI.mindepth) return alpha
  
  let moves = board.getMoves(false, false)

  moves = AI.sortMoves(moves, turn, ply, board, ttEntry)
  
  let bestmove = moves[0]
  let legal = 0
  let bestscore = -Infinity
  let score
  let staticeval = AI.evaluate(board)
  let incheck = board.isKingInCheck()

  if (incheck) {
    let lastmove = board.getLastMove()

    if (lastmove) {
      AI.saveHistory(!turn, lastmove, 20) //check moves up in move ordering
    }
  }
  
  //Reverse Futility pruning
  if (!incheck && depth <= 3 && staticeval - AI.PIECE_VALUES[1] * depth > beta) {
    AI.ttSave(hashkey, beta, -1, depth, moves[0])
    return beta
  }

  // console.log(depth)

  let doFHR = staticeval - 200 * incheck > beta && alpha === beta - 1
  let noncaptures = 0

  for (let i=0, len=moves.length; i < len; i++) {
    let move = moves[i]
    let R = 0
    let E = 0
    let piece = move.getPiece()
    let isCapture = move.isCapture()
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
      if (doFHR) {
        R += 1 + Math.sqrt(depth+1) + Math.sqrt(i+1) | 0
      } else {
        if (depth > 0 && i > 0) {
          R += Math.log(depth)*Math.log(i)/1.95 | 0 // | 0 + 66 ELO???
        }
      }
    }

    let near2mate = alpha > 2*AI.PIECE_VALUES[4] || beta < -2*AI.PIECE_VALUES[4]
   
    /*futility pruning */
    if (!near2mate && !incheck && 1 < depth && depth <= 3+R && legal >= 1) {
      if (staticeval + AI.FUTILITY_MARGIN*depth <= alpha)  continue
    }
    
    if (board.makeMove(move)) {
      legal++

      //Late-Moves-Pruning (LMP)    
      if (!isCapture && legal > 200/depth) {
        board.unmakeMove()
        continue
      }

      //Extensions
      if (incheck && depth < 3 && pvNode) {
        E = 1
      }

      if (legal === 1) {
        //Always search the first move at full depth
        score = -AI.PVS(board, -beta, -alpha, depth+E-1, ply+1)
      } else {

        //Next moves are searched with reductions
        score = -AI.PVS(board, -alpha-1, -alpha, depth+E-R-1, ply+1)

        //If the result looks promising, we do a research at full depth.
        //Remember we are trying to get the score at depth D, but we just get the score at depth D - R
        if (!AI.stop && score > alpha/* && score < beta*/) { //https://www.chessprogramming.org/Principal_Variation_Search
          score = -AI.PVS(board, -beta, -alpha, depth+E-1, ply+1)
        }
      }
      
      board.unmakeMove()
      
      AI.nodes++

      // if (AI.stop) return alpha
      if (AI.stop) return alphaOrig //tested ok

      if (score > bestscore) {
        if (score > alpha) {
          if (score >= beta) {
            if (legal === 1) {
              
              AI.fhf++
            }
            
            AI.fh++
            
            //LOWERBOUND
            AI.ttSave(hashkey, score, -1, depth, move)
            AI.saveHistory(turn, move, 2)

            return score
          }
          
          AI.ttSave(hashkey, score, 1, depth, move) //TESTED AT HIGH DEPTH
          AI.saveHistory(turn, move, 1)

            
          alpha = score
        }       

        bestscore = score
        bestmove  = move
      } else {
        AI.saveHistory(turn, move, -1)
        AI.ttSave(hashkey, bestscore, 1, depth, bestmove) //TESTED AT HIGH DEPTH
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

  AI.PIECE_SQUARE_TABLES_OPENING = [
  // Pawn
      [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,120,120,  0,  0,  0, 
      0,  0,  0,100,100,  0,  0,  0,
      0,  0,  0, 80, 80,  0,-80,-80,
      0,  0, 40, 60, 60,  0,-80,-80,
      0,  0, 20, 20, 20,-120,-80,  0,
      60, 60,-40,-40,-40, 60,120, 60,
      0,  0,  0,  0,  0,  0,  0,  0,
      ],

      // Knight
      [ 
    -100,-20,-20,-20,-20,-20,-20,-100,
    -100,-20,-20,-20,-20,-20,-20,-100,
    -100,-20,-20,-20,-20,-20,-20,-100,
    -100,-20,-20,-20,-20,-20,-20,-100,
    -100,-20,-20,-20,-20,-20,-20,-100,
    -100,-20, 60,-80,-80, 60, 20,-100,
    -100,-20,-20, 20, 20,-20,-20,-100,
    -100,-80,-80,-80,-80,-80,-80,-100,
      
      ],
      // Bishop
    [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0, 20,  0,  0,  0,  0, 20,  0,
      0,  0, 40,  0,  0, 40,  0,  0,
    -40, 40,-20,-20,-20,-20, 20,-40,
      0,120,  0, 20, 20,  0,120,  0,
      0,  0,-80,  0,  0,-80,  0,  0,
    ],
    // Rook
    [ 
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,  0,  0,  0,  0,  0,  0,
      0,  0,-20,-20,-20,-20,  0,  0,
      0,  0,-20,-20,-20,-20,  0,  0,
      0,  0,-20,-20,-20,-20,  0,  0,
    -80,  0,-20,-20,-20,-20,  0,  0,
    -40,-20, -20,-20,-20,-20,-20,-80,
    -20,-20, -20, 80, 80, 60,-80,-60,
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
      -60,-40,-20,-10,-20,-30,-40,-60,
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
      -50,-20,-40,-80,-20,-30,120, 50

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

  //Estructura básica peones
  AI.PIECE_SQUARE_TABLES_MIDGAME[0] = [
    0,  0,  0,  0,  0,  0,  0,  0,
  120,120, 80, 80, 80, 80,120,120,
   80, 60, 60, 60, 60, 60, 60, 80,
   60, 20, 50, 60, 60, 20, 10, 60,
  -20,  0, 40, 40, 40, 30,-20,-20,
    0, 20, 20,  0, 20, 20, 20,  0,
   60, 60, 20,-20,-20, 40, 60, 60,
    0,  0,  0,  0,  0,  0,  0,  0,
 ]

  //Castiga captura y maniobras con peón frontal del rey
  if (kingposition >= 61 || (kingposition>=56 && kingposition<=58)) {
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 7] +=160
    AI.PIECE_SQUARE_TABLES_OPENING[0][kingposition - 7] +=160
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 8] +=120
    AI.PIECE_SQUARE_TABLES_OPENING[0][kingposition - 8] +=120
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 9] +=160
    AI.PIECE_SQUARE_TABLES_OPENING[0][kingposition - 9] +=160

    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 15] -=100
    AI.PIECE_SQUARE_TABLES_OPENING[0][kingposition - 15] -=100
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 17] -=100
    AI.PIECE_SQUARE_TABLES_OPENING[0][kingposition - 17] -=100
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 23] -=200    
    AI.PIECE_SQUARE_TABLES_OPENING[0][kingposition - 23] -=200    
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 24] -=200    
    AI.PIECE_SQUARE_TABLES_OPENING[0][kingposition - 24] -=200    
    AI.PIECE_SQUARE_TABLES_MIDGAME[0][kingposition - 25] -=200    
    AI.PIECE_SQUARE_TABLES_OPENING[0][kingposition - 25] -=200    
  }

  //Caballos al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = [
    -100,-100,-100,-100,-100,-100,-100,-100,
    -100,   0,   0,   0,   0,   0,   0,-100,
    -100,   0,  40,  40,  40,  40,   0,-100,
    -100,   0,  40,  40,  40,  40,   0,-100,
    -100,   0,  40,  40,  40,  40,   0,-100,
    -100,   0,  40,  40,  40,  40,   0,-100,
    -100,   0,   0,   0,   0,   0,   0,-100,
    -100,-100,-100,-100,-100,-100,-100,-100,
  ]

  //Caballos cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
    return e + 10 - 2 * AI.distance(kingXposition, i)
  })

  let outpostbonus = 0

  //Premia caballos en Outposts //??????? NOT FULLY TESTED
  AI.PIECE_SQUARE_TABLES_OPENING[1] = AI.PIECE_SQUARE_TABLES_OPENING[1].map((e,i)=>{
    let ranks456 = i >= 16 && i <= 39 ? 40 : 0
    return e + (pawnmap[i]? outpostbonus + ranks456 : -20)
  })

  AI.PIECE_SQUARE_TABLES_MIDGAME[1] = AI.PIECE_SQUARE_TABLES_MIDGAME[1].map((e,i)=>{
    let ranks456 = pawnmap[i] >= 16 && pawnmap[i] <= 39 ? 40 : 0
    return e + (pawnmap[i]? outpostbonus + ranks456 : -20)
  })
  

  //Alfiles al centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[2] = [
    -100,-100,-100,-100,-100,-100,-100,-100,
    -100, -40, -40, -40, -40, -40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100, -40,  40,  60,  60,  40, -40,-100,
    -100, -40,  40,  60,  60,  40, -40,-100,
    -100, -40,  40,  40,  40,  40, -40,-100,
    -100,  40, -40,  40,  40, -40,  40,-100,
    -100,-100,-100,-100,-100,-100,-100,-100,
  ]

  //Torre
  //Premia enrocar
  if (board.hasCastlingRight(color, true) && 
    (
      (pawnmap[kingposition-5] && pawnmap[kingposition-6]) ||
      (pawnmap[kingposition-5] && pawnmap[kingposition-7] && pawnmap[kingposition-14])
    )
  ) {
      console.log('rook KINGSIDE')
        AI.PIECE_SQUARE_TABLES_MIDGAME[3][63]  -= 20
        AI.PIECE_SQUARE_TABLES_MIDGAME[3][62]  -= 20
        AI.PIECE_SQUARE_TABLES_MIDGAME[3][61]  += 40
      }

    if (board.hasCastlingRight(color, false) && pawnmap[kingposition-10] && pawnmap[kingposition-11]) {
        console.log('rook QUEENSIDE')
        AI.PIECE_SQUARE_TABLES_MIDGAME[3][56]  -= 20
        AI.PIECE_SQUARE_TABLES_MIDGAME[3][57]  -= 20
        AI.PIECE_SQUARE_TABLES_MIDGAME[3][58]  -= 20
        AI.PIECE_SQUARE_TABLES_MIDGAME[3][59]  += 40
      }

  //Torres en columnas abiertas
  
  // let pawnXfiles = [0,0,0,0,0,0,0,0]
  // let pawnfiles = [0,0,0,0,0,0,0,0]
  
  // for (let i = 0; i < 64; i++) {
  //   if (pawnmap[i]) {
  //     let col = i % 8

  //     pawnfiles[col]++
  //   }
  // }

  // for (let i = 0; i < 64; i++) {
  //   if (pawnXmap[i]) {
  //     let col = i % 8

  //     if (pawnfiles[col]) {
  //       //Si las columnas están abiertas en mi lado, cuento las del otro lado (antes no)
  //       pawnXfiles[col]++
  //     }

  //   }
  // }

  
  // AI.PIECE_SQUARE_TABLES_OPENING[3] = AI.PIECE_SQUARE_TABLES_OPENING[3].map((e,i)=>{
  //   let col = i%8
  //   return e + (pawnfiles[col]? -40 : 0)
  // })
  
  // AI.PIECE_SQUARE_TABLES_OPENING[3] = AI.PIECE_SQUARE_TABLES_OPENING[3].map((e,i)=>{
  //   let col = i%8
  //   return e + (!pawnfiles[col]? 80 : 0) + (!pawnXfiles[col]? 50 : 0)
  // })
  
  // AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,i)=>{
  //   let col = i%8
  //   return e + (pawnfiles[col]? -20 : 0)
  // })
  
  // AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,i)=>{
  //   let col = i%8
  //   return e + (!pawnfiles[col]? 50 : 0) + (!pawnXfiles[col]? 50 : 0)
  // })
  
  //Torres delante del rey enemigo ("torre en séptima")
  // for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_MIDGAME[3][i + 8*(kingXposition/8 | 0)] += 27

  // //Torres conectadas
  // let RR = board.makeRookAttackMask(R, P.or(PX))
  // let RRmap = AI.bin2map(RR, color)

  // AI.PIECE_SQUARE_TABLES_MIDGAME[3] = AI.PIECE_SQUARE_TABLES_MIDGAME[3].map((e,i)=>{
  //   return e + 10*RRmap[i]
  // })

  //Castiga torres sin desarrollar
  AI.PIECE_SQUARE_TABLES_MIDGAME[2][56] -= 40
  AI.PIECE_SQUARE_TABLES_MIDGAME[2][63] -=100

  //Dama
  AI.PIECE_SQUARE_TABLES_MIDGAME[4] = [
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,
  -90, -80, -40, -20, -20, -40, -80, -90,
  ]

  //Rey lejos del centro
  AI.PIECE_SQUARE_TABLES_MIDGAME[5] = [ 
    -95, -95, -95, -95, -95, -95, -95, -95,
    -95, -95, -95, -95, -95, -95, -95, -95,
    -95, -95, -95, -95, -95, -95, -95, -95,
    -95, -95, -95, -95, -95, -95, -95, -95,
    -95, -95, -95, -95, -95, -95, -95, -95, 
    -90, -90, -90, -90, -90, -90, -90, -90,
    -90, -80, -80, -80, -80, -80, -80, -90,
    -60,  20, -60, -60, -60, -60,  20, -60
 ]

  //Premia enrocar
  if (board.hasCastlingRight(color, true)) {
    console.log('KINGSIDE')

    if (
      (pawnmap[kingposition-5] && pawnmap[kingposition-6]) ||
      (pawnmap[kingposition-5] && pawnmap[kingposition-7] && pawnmap[kingposition-14])
    ) {
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][60]  -= 20
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][61]  -= 20
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][62]  +=120
    } else {
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][62]  -=200
      AI.PIECE_SQUARE_TABLES_OPENING[5][62]  -=200 //Evita enroque al vacío

    }
  }

  if (board.hasCastlingRight(color, false)) {
    console.log('QUEENSIDE')

    if (pawnmap[kingposition-10] && pawnmap[kingposition-11]) {
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][58]  += 40
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][59]  -= 40
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][60]  -= 20
    } else {
      AI.PIECE_SQUARE_TABLES_MIDGAME[5][58]  -=200
      AI.PIECE_SQUARE_TABLES_OPENING[5][58]  -=200 //Evita enroque al vacío
    }
  }

  //////////////// Rayos X ///////////////////////
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

  //***************** ENDGAME ***********************

  AI.PIECE_SQUARE_TABLES_ENDGAME[0] = [
    0,  0,  0,  0,  0,  0,  0,  0,
  320,320,320,260,260,320,320,320,
  200,160,160,200,200,160,160,200,
   80, 80, 80,100,100, 80, 80, 80,
   40,-20,-20,-20,-20,-20,-20, 40,
   40,-40,-40,-40,-40,-40,-40, 40,
  -80,-80,-80,-80,-80,-80,-80,-80,
    0,  0,  0,  0,  0,  0,  0,  0,
 ]

  //Castiga captura y maniobras con peón frontal del rey
  if (board.getMadeMoveCount()>12 && kingposition > 55) {
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

  //Alfiles cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[2] = AI.PIECE_SQUARE_TABLES_ENDGAME[2].map((e,i)=>{
    return e + 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

  //Torres en columnas abiertas

  // pawnfiles = [0,0,0,0,0,0,0,0]

  // for (let i = 0; i < 64; i++) {
  //   if (pawnmap[i]) {
  //     let col = i % 8

  //     pawnfiles[col]++
  //   }
  // }

  // AI.PIECE_SQUARE_TABLES_ENDGAME[3] = AI.PIECE_SQUARE_TABLES_ENDGAME[3].map((e,i)=>{
  //   let col = i%8
  //   return e + (pawnfiles[col]? -40 : 0)
  // })

  // AI.PIECE_SQUARE_TABLES_ENDGAME[3] = AI.PIECE_SQUARE_TABLES_ENDGAME[3].map((e,i)=>{
  //   let col = i%8
  //   return e + (!pawnfiles[col]? 40 : 0)
  // })

  // //Torres delante del rey enemigo ("torre en séptima")
  // for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_ENDGAME[3][i + 8*(kingXposition/8 | 0)] += 27

  //Torre cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[3] = AI.PIECE_SQUARE_TABLES_ENDGAME[3].map((e,i)=>{
    return e + 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

  //Dama cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_ENDGAME[4] = AI.PIECE_SQUARE_TABLES_ENDGAME[4].map((e,i)=>{
    return e + 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

  //Rey cerca del centro
  AI.PIECE_SQUARE_TABLES_ENDGAME[5] = [
    -200,-150,-100,-100,-100,-100,-150,-200,
    -150,  30,  30,  30,  30,  30,  30,-100,
    -100,  30,  80,  80,  80,  80,  30,-100,
    -100,  30,  80, 120, 120,  80,  30,-100,
    -100,  30,  80, 120, 120,  80,  30,-100,
    -100,  30,  80,  80,  80,  80,  30,-100,
    -150,  30,  30,  30,  30,  30,  30,-150,
    -200,-150,-100,-100,-100,-100,-150,-200,
  ]
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

  if (AI.phase == 1) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_OPENING]
  if (AI.phase == 2) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_MIDGAME]
  if (AI.phase >= 3) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_ENDGAME]

  if (AI.phase < 3) {
    AI.PIECE_VALUES = AI.MIDGAME_PIECE_VALUES
  } else {
    AI.PIECE_VALUES = AI.ENDGAME_PIECE_VALUES
  }

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

  while (lowerBound < upperBound && i < 100) {
    let beta = Math.max(g, lowerBound + 1)

    i++

    g = AI.PVS(board, beta - 1, beta, d, 1)

    if (g < beta) {
      upperBound = g
    } else {
      lowerBound = g
    }

    
    console.log('Pass ' + i)
  }

  return g
}

AI.search = function(board, options) {

  // if (AI.lastscore) AI.DRAW = 2*AI.lastscore

  if (options && options.seconds) AI.secondspermove = options.seconds

  AI.nofpieces = board.getOccupiedBitboard().popcnt()

  let nmoves = board.madeMoves.length

  if (board.movenumber && board.movenumber === 1) {
    AI.createTables()
  }

  AI.reduceHistory()

  if (!AI.PIECE_VALUES || nmoves < 2) {
    AI.PIECE_VALUES = AI.MIDGAME_PIECE_VALUES
  }
  
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
        console.log('CAMBIO!!!!!!!!!!!')
        AI.changeinPV = true
      } else {
        AI.changeinPV = false
      }

      let strmove = AI.PV[1]? AI.PV[1].getString() : '----'
      
      
      fhfperc = Math.round(AI.fhf*100/AI.fh)

      if (AI.PV) console.log(AI.iteration, depth, AI.PV.map(e=>{ return e && e.getString? e.getString() : '---'}).join(' '), '     |     AI.FHF ' + fhfperc + '%', score)
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
