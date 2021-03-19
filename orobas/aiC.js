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
  random: 5,
  phase: 1,
  htlength: 1 << 24,
  reduceHistoryFactor: 1, //1, actúa sólo en la actual búsqueda --> mejor ordenamiento, sube fhf
  mindepth: 2,
  secondspermove: 3,
  lastmove: null
}

// PIECE VALUES
// https://www.chessprogramming.org/Point_Value_by_Regression_Analysis
AI.PAWN = 271

AI.PIECE_VALUES_BY_PHASE = [
  [
    AI.PAWN,
    AI.PAWN*2.88 | 0,
    AI.PAWN*3.45 | 0,
    AI.PAWN*4.80 | 0,
    AI.PAWN*10.77 | 0,
    20000
  ],
  [
    AI.PAWN,
    AI.PAWN*2.88 | 0,
    AI.PAWN*3.45 | 0,
    AI.PAWN*4.80 | 0,
    AI.PAWN*10.77 | 0,
    20000
  ],
  [
    AI.PAWN,
    AI.PAWN*2.88 | 0,
    AI.PAWN*3.45 | 0,
    AI.PAWN*4.80 | 0,
    AI.PAWN*10.77 | 0,
    20000
  ],
  [
    AI.PAWN,
    AI.PAWN*2.88 | 0,
    AI.PAWN*3.45 | 0,
    AI.PAWN*4.80 | 0,
    AI.PAWN*10.77 | 0,
    20000
  ]
]

// OTHER VALUES

AI.FUTILITY_MARGIN = 2 * AI.PAWN
AI.BISHOP_PAIR = 0
AI.MATE = AI.PIECE_VALUES_BY_PHASE[0][5]
AI.DRAW = 0
AI.INFINITY = AI.PIECE_VALUES_BY_PHASE[0][5]*4

//PSQT VALUES
AI.PSQT_VALUES = [-3,-2,-1, 0, 1, 2, 3].map(e=>4*e) //Scalar 10 TESTED OK (20 with 2 softens??)

let wm = AI.PSQT_VALUES[0] // Worst move
let vbm = AI.PSQT_VALUES[0] // Very bad move
let bm  = AI.PSQT_VALUES[1] // Bad move
let nm  = AI.PSQT_VALUES[2] // Neutral move
let GM  = AI.PSQT_VALUES[3] // Good move
let VGM = AI.PSQT_VALUES[4] // Very good move
let BM = AI.PSQT_VALUES[4] // Best move

AI.QUIETSORT = [
  0, 1, 2, 3, 3, 2, 1, 0,
  1, 2, 4, 6, 6, 4, 2, 1,
  2, 4, 8,16,16, 8, 4, 2,
  3, 6,10,20,20,10, 6, 3,
  3, 6,10,20,20,10, 6, 3,
  2, 4, 8,16,16, 8, 4, 2,
  1, 2, 4, 6, 6, 4, 2, 1,
  0, 1, 2, 3, 3, 2, 1, 0,
]

//General idea from Stockfish. Not fully tested.
AI.MOBILITY_VALUES = [
  [
    [],
    [-8,-4,-2,-1,0,1,2,3,4].map(e=>e*8),
    [-6,-2,0,1,2,3,4,5,6,7,8,9,10,11].map(e=>e*8),
    [0,0,0,0,2,3,4,5,6,7,8,9,10,11,12].map(e=>e*5),
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
AI.PASSER_VALUES = [0, 1, 2, 3, 4, 5, 6, 6, 6].map(e=>400*e)

//Not fully tested
AI.STRUCTURE_VALUES = [0,1,2,2,3,1,-1,-2].map(e=>20*e)

//Not fully tested
AI.PAWN_IMBALANCE = [-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8].map(e=>20*e)

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

AI.evaluate = function(board, ply) {
  let turn = board.getTurnColor()
  let white = (turn === 0)

  let P = board.getPieceColorBitboard(0, turn)
  let N = board.getPieceColorBitboard(1, turn)
  let B = board.getPieceColorBitboard(2, turn)
  let R = board.getPieceColorBitboard(3, turn)
  let Q = board.getPieceColorBitboard(4, turn)
  let K = board.getPieceColorBitboard(5, turn)

  let Px = board.getPieceColorBitboard(0, ~turn & 1)
  let Nx = board.getPieceColorBitboard(1, ~turn & 1)
  let Bx = board.getPieceColorBitboard(2, ~turn & 1)
  let Rx = board.getPieceColorBitboard(3, ~turn & 1)
  let Qx = board.getPieceColorBitboard(4, ~turn & 1)
  let Kx = board.getPieceColorBitboard(5, ~turn & 1)

  let us = board.getColorBitboard(turn)
  let usx = board.getColorBitboard(~turn & 1)

  let colorMaterial = AI.getMaterialValue(P,N,B,R,Q)
  let notcolorMaterial = AI.getMaterialValue(Px,Nx,Bx,Rx,Qx)
  let material = colorMaterial - notcolorMaterial

  let pawnimbalance = 0//AI.PAWN_IMBALANCE[P.popcnt() - Px.popcnt() + 8]

  let psqt = 0
  let mobility = 0
  let structure = 0
  let safety = 0
  let passers = 0
  
  psqt = AI.getPSQT(P,N,B,R,Q,K, turn) - AI.getPSQT(Px,Nx,Bx,Rx,Qx,Kx, ~turn & 1)
  
  let doPositional = AI.phase > 1// && AI.iteration < 4
  let doPassers = AI.phase >= 3 || AI.iteration === 1 || AI.changeinPV
  
  if (doPassers) {
      passers = AI.getPassers(P, Px, white) - AI.getPassers(Px, P, !white)
    }
    
  if (doPositional) {
    mobility  = AI.getMOB(P,N,B,R,Q,K,Px,board, turn)
    mobility -= AI.getMOB(Px,Nx,Bx,Rx,Qx,Kx,P,board, ~turn & 1)
  
    structure = AI.getSTR(P, turn) - AI.getSTR(Px, ~turn & 1)
    
    if (AI.phase === 2) safety = AI.getKS(K, us, turn) - AI.getKS(Kx, usx, ~turn & 1)
  }
      
      
  let positional = psqt + mobility + structure + safety

  let score = material + pawnimbalance + positional | 0

  // if (score > 0) score /= Math.sqrt(ply) //54.1 win (not fully tested)
  
  return score | 0
}

AI.getPassers = function (_P, _Px, white) {
  let P = _P.dup()
  let Px = _Px.dup()

  let pawns = P.dup()
  let passers = 0
  let pxmask = Px.or(Chess.Position.makePawnAttackMask(!white, Px))

  while (!pawns.isEmpty()) {
    let index = pawns.extractLowestBitPosition()
    let pawn = (new Chess.Bitboard(0,0)).setBit(index)
    let advancemask = AI.pawnAdvanceMask(pawn, white)
    let adcnt = advancemask.popcnt()
    let encounters

    if (adcnt > 0) {
      encounters = advancemask.and(pxmask).popcnt()
      
      if (encounters === 0) passers++
    }
  }

  return AI.PASSER_VALUES[passers]
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


AI.getSTR = function(_P, color) {
  let P = _P.dup()

  let mask = Chess.Position.makePawnAttackMask(color, P).dup()
  let protectedpawns = mask.and(P).popcnt()

  return AI.STRUCTURE_VALUES[protectedpawns]
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

    value = P.popcnt()*AI.PIECE_VALUES[0] +
            N.popcnt()*AI.PIECE_VALUES[1] +
            B.popcnt()*AI.PIECE_VALUES[2] + 
            R.popcnt()*AI.PIECE_VALUES[3] + 
            Q.popcnt()*AI.PIECE_VALUES[4]

    value += B.popcnt() > 1? AI.BISHOP_PAIR : 0

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
    // move.psqtvalue = AI.QUIETSORT[turn === 0? 56^to : to]

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
    if (move.mvvlva>=6000) { //Good Captures
      return 1e7 + move.mvvlva
    } else {
      return -1e6 + move.mvvlva //Bad Captures
    }
  }
    
  if (move.hvalue) { //History Heuristic
    score += move.hvalue
    
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
  let standpat = AI.evaluate(board, ply)
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
        // AI.saveHistory(turn, move, 2)
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
    
  if (AI.stop && AI.iteration > AI.mindepth) return alpha
  
  let moves = board.getMoves(false, false)

  moves = AI.sortMoves(moves, turn, ply, board, ttEntry)
  
  let bestmove = moves[0]
  let legal = 0
  let bestscore = -Infinity
  let score
  let staticeval = AI.evaluate(board, ply)
  let incheck = board.isKingInCheck()

  // if (incheck) {
  //   let lastmove = board.getLastMove()

  //   if (lastmove) {
  //     if (AI.phase < 4) {
  //       AI.saveHistory(~turn & 1, lastmove, 2**depth) //check moves up in move ordering
  //     } else {
  //       // AI.saveHistory(~turn & 1, lastmove, -(2**depth)) //check down up in move ordering (phase 4)
  //     }
  //   }
  // }
  
  //Reverse Futility pruning
  if (!incheck && depth <= 3 && staticeval - AI.PIECE_VALUES[1] * depth > beta) {
    AI.ttSave(hashkey, beta, -1, depth, moves[0])
    return beta
  }

  // console.log(depth)
  
  let doFHR = staticeval - 200 * incheck > beta && alpha === beta - 1 && depth > 6
  let noncaptures = 0
  
  for (let i=0, len=moves.length; i < len; i++) {
    let move = moves[i]
    let piece = move.getPiece()

    //Absurd maneuvers pruning (AMP)
    if ((AI.phase === 1 && AI.absurd[turn][piece] >= 2) || AI.absurd[turn][piece] >= 4 ||
      AI.phase < 4 && legal >= 1 && depth > 2 && piece > 0 && AI.absurd[turn][piece] >= (depth / 2 | 0)
    ) {
      // console.log('Absurd maneuver pruning')
      continue
    }

    let near2mate = alpha > 2*AI.PIECE_VALUES[4] || beta < -2*AI.PIECE_VALUES[4]

    
    let R = 0
    let E = 0

    /*futility pruning */
    if (!near2mate && !incheck && 1 < depth && depth <= 3+R && legal >= 1) {
      if (staticeval + AI.FUTILITY_MARGIN*depth <= alpha)  continue
    }

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
        R += Math.log(depth+1)*Math.log(i+1)/1.95

        if (AI.phase === 4) R /= 2
    }

    if (doFHR) R+=4

   
    
    if (board.makeMove(move)) {
      legal++

      // console.log(turn, piece)

      AI.absurd[turn][piece]++

      // console.log(AI.absurd)

      //Late-Moves-Pruning (LMP)
      // let lmplimit = 811.41*depth**-1.788 | 0
      // if (!isCapture && legal > lmplimit) {
      //   board.unmakeMove()
      //   AI.absurd[turn][piece]--
      //   continue
      // }

      //Extensions
      if (incheck && depth < 3 && pvNode) {
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
            if (!isCapture) AI.saveHistory(turn, move, 2**depth)

            return score
          }
          
          // AI.ttSave(hashkey, score, 1, depth, move) //TESTED AT HIGH DEPTH
          // AI.saveHistory(turn, move, -1)

            
          alpha = score
        }       

        bestscore = score
        bestmove  = move
      } else {
        // AI.saveHistory(turn, move, -(2**depth))
        // AI.ttSave(hashkey, bestscore, 1, depth, bestmove) //TESTED AT HIGH DEPTH
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
      if (!bestmove.isCapture()) AI.saveHistory(turn, bestmove, 2**depth)
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
      nm, nm, GM, BM,VGM,  wm, wm, wm,
      nm,VGM, GM, nm, GM, vbm, nm, nm,
     VGM, GM,vbm,vbm,vbm, VGM,VGM,VGM,
       0,  0,  0,  0,  0,   0,  0,  0,
      ],

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
      
      ],
      // Bishop
    [ 
      vbm, bm, bm, bm, bm, bm, bm, vbm,
      vbm, bm, bm, bm, bm, bm, bm, vbm,
      vbm, bm, nm, nm, nm, nm, bm, vbm,
      vbm, nm, nm, nm, nm, nm, nm, vbm,
      vbm, bm, BM, nm, nm, BM, bm, vbm,
      vbm, bm, nm, nm, nm, nm, bm, vbm,
      vbm, bm, bm, bm, bm, bm, bm, vbm,
      vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,
    ],
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
    ],
    
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
    ],

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

    ]
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
        ],
  
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
        
        ],
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
      ],
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
      ],
      
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
      ],
  
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
  
      ]
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
        ],
  
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
        
        ],
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
           
           ],
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
      ],
      
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
      ],
  
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
      ]
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
        ],
        
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
      
        ],
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
      
        ],
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
        ],
        
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
        ],
    
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
        ]
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
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 7] += VGM
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 8] += GM
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 9] += VGM

    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 7] += VGM
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 8] += GM
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 9] += VGM

    //Bad
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 15] += bm
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 17] += bm
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 23] += vbm    
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 24] += vbm    
    AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 25] += vbm    

    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 15] += bm
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 17] += bm
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 23] += vbm    
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 24] += vbm    
    AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 25] += vbm    
  }

  //Caballos cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_PHASE2[1] = AI.PIECE_SQUARE_TABLES_PHASE2[1].map((e,i)=>{
    return e + 10 - 2 * AI.distance(kingXposition, i)
  })

  let outpostbonus = 0

  //Premia caballos en Outposts //??????? NOT FULLY TESTED
  AI.PIECE_SQUARE_TABLES_PHASE1[1] = AI.PIECE_SQUARE_TABLES_PHASE1[1].map((e,i)=>{
    let ranks456 = i >= 16 && i <= 39 ? 40 : 0
    return e + (pawnmap[i]? outpostbonus + ranks456 : -20)
  })

  //Torre
  //Premia enrocar
  if (board.hasCastlingRight(color, true) && 
    (
      (pawnmap[kingposition-5] && pawnmap[kingposition-6]) ||
      (pawnmap[kingposition-5] && pawnmap[kingposition-7] && pawnmap[kingposition-14])
    )
  ) {
      console.log('rook KINGSIDE')
        AI.PIECE_SQUARE_TABLES_PHASE2[3][63]  -= 20
        AI.PIECE_SQUARE_TABLES_PHASE2[3][62]  -= 20
        AI.PIECE_SQUARE_TABLES_PHASE2[3][61]  += 40
      }

    if (board.hasCastlingRight(color, false) && pawnmap[kingposition-10] && pawnmap[kingposition-11]) {
        console.log('rook QUEENSIDE')
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
    console.log('KINGSIDE')

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
    console.log('QUEENSIDE')

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

  //Caballos cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_PHASE3[1] = AI.PIECE_SQUARE_TABLES_PHASE3[1].map((e,i)=>{
    return e + 40 - 8 * AI.distance(kingXposition, i)
  })

  //Alfiles cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_PHASE3[2] = AI.PIECE_SQUARE_TABLES_PHASE3[2].map((e,i)=>{
    return e + 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

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

  //Torre cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_PHASE3[3] = AI.PIECE_SQUARE_TABLES_PHASE3[3].map((e,i)=>{
    return e + 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })

  //Dama cerca del rey enemigo
  AI.PIECE_SQUARE_TABLES_PHASE3[4] = AI.PIECE_SQUARE_TABLES_PHASE3[4].map((e,i)=>{
    return e + 4 * (8 - AI.manhattanDistance(kingXposition, i))
  })
  
  if (AI.phase === 4 && AI.lastscore >= AI.PIECE_VALUES_BY_PHASE[3][0]) {
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
  
  AI.createPSQT()

  AI.preprocessor(board)

  if (AI.phase == 1) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE1]
  if (AI.phase == 2) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE2]
  if (AI.phase == 3) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE3]
  if (AI.phase == 4) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE4]

  // AI.softenPSQT()

  AI.PIECE_VALUES = AI.PIECE_VALUES_BY_PHASE[AI.phase - 1]

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

  if (options && options.seconds) AI.secondspermove = options.seconds

  AI.nofpieces = board.getOccupiedBitboard().popcnt()

  let nmoves = board.madeMoves.length

  if (board.movenumber && board.movenumber === 1) {
    AI.createTables()
  }

  AI.reduceHistory()

  if (!AI.PIECE_VALUES || nmoves < 2) {
    AI.PIECE_VALUES = AI.PIECE_VALUES_BY_PHASE[0]
  }

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
