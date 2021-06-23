"use strict"

const Chess = require('../chess/chess.js')


let AI = {
    totaldepth: 48,
    ttNodes: 0,
    iteration: 0,
    qsnodes: 0,
    nodes: 0,
    pnodes: 0,
    phnodes: 0,
    status: null,
    fhf: 0,
    fh: 0,
    random: 120,
    phase: 1,
    htlength: 1 << 24,
    pawntlength: 5e5,
    reduceHistoryFactor: 1, //1, actúa sólo en la actual búsqueda --> mejor ordenamiento, sube fhf
    mindepth: [1, 1, 1, 1],
    secondspermove: 3,
    lastmove: null,
    f: 0
}

// PIECE VALUES
AI.PAWN = 270
AI.PAWN2 = AI.PAWN / 2 | 0
AI.PAWN3 = AI.PAWN / 3 | 0
AI.PAWN4 = AI.PAWN / 4 | 0
AI.PAWN5 = AI.PAWN / 5 | 0

AI.PIECE_VALUES = [
    // Stockfish values: 1 / 2.88 / 3.00 / 4.70 / 9.36 !!!

    //Obtenidos mediante TDL
    [1.00, 2.88, 3.00, 4.80, 9.60, 200].map(e => e * AI.PAWN),
    [1.22, 2.88, 3.00, 4.80, 9.60, 200].map(e => e * AI.PAWN),
    [1.44, 2.88, 3.00, 4.80, 9.60, 200].map(e => e * AI.PAWN),
    [1.66, 2.88, 3.00, 4.80, 9.60, 200].map(e => e * AI.PAWN),
]

AI.BISHOP_PAIR = AI.PAWN | 0 //For stockfish is something like 0.62 pawns
AI.MATE = AI.PIECE_VALUES[0][5]
AI.DRAW = 0
AI.INFINITY = AI.PIECE_VALUES[0][5] * 2

let wm = -AI.PAWN // Worst move
let vbm = -AI.PAWN2 // Very bad move
let bm = -AI.PAWN3 // Bad move
let nm = 0 // Neutral move
let GM = AI.PAWN4 // Good move
let VGM = AI.PAWN3 // Very good move
let BM = AI.PAWN2 // Best move

AI.LMR_TABLE = new Array(AI.totaldepth + 1)

for (let depth = 1; depth < AI.totaldepth + 1; ++depth) {

    AI.LMR_TABLE[depth] = new Array(218)

    for (let moves = 1; moves < 218; ++moves) {
        // AI.LMR_TABLE[depth][moves] = Math.log(depth) * Math.log(moves) / 2 | 0
        if (depth >= 3) {
            AI.LMR_TABLE[depth][moves] = depth/5 + moves/5 + 1 | 0
        } else {
            AI.LMR_TABLE[depth][moves] = 0
        }
    }
}

AI.MOBILITY_VALUES = [
    [
        [],
        [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(e => e * 8 | 0),
        [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(e => e * 13 | 0),
        [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(e => e * 5 | 0),
        [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(e => e * 5 | 0),
        []
    ],
    [
        [],
        [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(e => e * 7.5 | 0),
        [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(e => e * 11 | 0),
        [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(e => e * 8 | 0),
        [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(e => e * 6.5 | 0),
        []
    ],
    [
        [],
        [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(e => e * 7 | 0),
        [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(e => e * 9 | 0),
        [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(e => e * 11 | 0),
        [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(e => e * 8 | 0),
        []
    ],
    [
        [],
        [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(e => e * 6.5 | 0),
        [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(e => e * 9 | 0),
        [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(e => e * 14 | 0),
        [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(e => e * 9.5 | 0),
        []
    ]
]

//Not fully tested(
AI.SAFETY_VALUES = [-2, -1,  0, 1, 2,-1,-2,-3,-3].map(e=>AI.PAWN5*e)

//Not fully tested
AI.PASSER_VALUES = [
    0, 0, 0, 0, 0, 0, 0, 0,
    2*AI.PAWN, 2*AI.PAWN, 2*AI.PAWN, 2*AI.PAWN, 2*AI.PAWN, 2*AI.PAWN, 2*AI.PAWN, 2*AI.PAWN,
    AI.PAWN, AI.PAWN, AI.PAWN, AI.PAWN, AI.PAWN, AI.PAWN, AI.PAWN, AI.PAWN,
    AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2,
    AI.PAWN3, AI.PAWN3, AI.PAWN3, AI.PAWN3, AI.PAWN3, AI.PAWN3, AI.PAWN3, AI.PAWN3,
    AI.PAWN4, AI.PAWN4, AI.PAWN4, AI.PAWN4, AI.PAWN4, AI.PAWN4, AI.PAWN4, AI.PAWN4,
    AI.PAWN5, AI.PAWN5, AI.PAWN5, AI.PAWN5, AI.PAWN5, AI.PAWN5, AI.PAWN5, AI.PAWN5,
    0, 0, 0, 0, 0, 0, 0, 0,
]

AI.DOUBLED_VALUES = [0, -1, -2, -4, -8, -9, -10, -11, -12].map(e => e * AI.PAWN2 | 0)

//Not fully tested
AI.DEFENDED_PAWN_VALUES = [
    [0,  0,  0,  0,  0,  0,  0,  0,  0], //phase 1
    [0, AI.PAWN5, AI.PAWN4, AI.PAWN4, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2], //phase 2
    [0, AI.PAWN5, AI.PAWN4, AI.PAWN4, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2], //phase 3
    [0, AI.PAWN5, AI.PAWN4, AI.PAWN4, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2, AI.PAWN2], //phase 4
]

//https://open-chess.org/viewtopic.php?t=3058
AI.MVVLVASCORES = [
  /*P*/[6002,20225, 20250, 20400, 20800, 26900],
  /*N*/[4775, 6004, 20025, 20175, 20575, 26675],
  /*B*/[4750, 4975,  6006, 20150, 20550, 26650],
  /*R*/[4600, 4825,  4850,  6008, 20400, 26500],
  /*Q*/[4200, 4425,  4450,  4600,  6010, 26100],
  /*K*/[3100, 3325,  3350,  3500,  3900, 26000],
]

AI.PIECE_SQUARE_TABLES = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0)
]

AI.bitCount = function (n) {
    n = n - ((n >> 1) & 0x55555555)
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

AI.manhattanDistance = function (sq1, sq2) {
    let file1, file2, rank1, rank2;
    let rankDistance, fileDistance;
    file1 = sq1 & 7;
    file2 = sq2 & 7;
    rank1 = sq1 >> 3;
    rank2 = sq2 >> 3;
    rankDistance = Math.abs(rank2 - rank1);
    fileDistance = Math.abs(file2 - file1);
    return rankDistance + fileDistance;
}

AI.manhattanCenterDistance = function (sq) {
    let file, rank;
    file = sq & 7;
    rank = sq >> 3;
    file ^= (file - 4) >> 8;
    rank ^= (rank - 4) >> 8;
    return (file + rank) & 7;
}

AI.distance = function (sq1, sq2) {
    let file1, file2, rank1, rank2;
    let rankDistance, fileDistance;
    file1 = sq1 & 7;
    file2 = sq2 & 7;
    rank1 = sq1 >> 3;
    rank2 = sq2 >> 3;
    rankDistance = Math.abs(rank2 - rank1);
    fileDistance = Math.abs(file2 - file1);
    return Math.max(rankDistance, fileDistance);
}

AI.createTables = function () {
    console.log('Creating tables.................')

    delete AI.history
    delete AI.hashtable
    delete AI.pawntable

    AI.history = [[], []]

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

    AI.hashtable = new Array(this.htlength) // new Map() //positions
    AI.pawntable = [(new Array(this.pawntlength)).fill(null), (new Array(this.pawntlength)).fill(null)] // [new Map(), new Map()] //positions
}

//Randomize Piece Square Tables
AI.randomizePSQT = function () {
    if (AI.phase === 1) {
        //From Knight to Queen
        for (let i = 1; i <= 4; i++) {
            AI.PIECE_SQUARE_TABLES[i] = AI.PIECE_SQUARE_TABLES[i].map(e => {
                return e + Math.random() * AI.random - AI.random / 2 | 0
            })
        }
    }
}

AI.getPieces = function (board, turn, notturn) {
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

    return { P, N, B, R, Q, K, Px, Nx, Bx, Rx, Qx, Kx, us, usx }
}

AI.getMaterial = function (pieces) {
    return AI.getMaterialValue(pieces, true) - AI.getMaterialValue(pieces, false)
}

AI.evaluate = function (board, ply, beta) {
    let turn = board.getTurnColor()
    let notturn = ~turn & 1
    let pieces = AI.getPieces(board, turn, notturn)
    let score = 0
    let positional = 0

    score += AI.getMaterial(pieces)

    positional += AI.getPSQT(pieces, turn, notturn)
    positional += AI.getStructure(pieces.P, pieces.Px, turn, notturn)
    positional += AI.getMobility(pieces, board, turn, notturn)
    
    if (AI.phase > 1) {
        positional += AI.getKingSafety(pieces, turn, notturn)
    }

    score += AI.limit(positional)

    return score | 0
}

AI.getDoubled = function (_P, white) {
    let pawns = _P.dup()
    let doubled = 0

    let score = 0

    while (!pawns.isEmpty()) {
        let index = pawns.extractLowestBitPosition()
        let pawn = (new Chess.Bitboard(0, 0)).setBit(index)
        let advancemask = AI.pawnAdvanceMask(pawn, white)
        let adcnt = advancemask.popcnt()
        let encounters = 0

        if (adcnt > 0) {
            encounters = advancemask.and(pawns).popcnt()

            if (encounters > 0) {
                doubled++
                score += AI.DOUBLED_VALUES[doubled]
            }
        }
    }

    return score
}

AI.getPassers = function (_P, _Px, white) {
    let P = _P.dup()
    let Px = _Px.dup()

    let passers = 0
    let pxmask = Px.or(Chess.Position.makePawnAttackMask(!white, Px))

    let score = 0

    while (!P.isEmpty()) {
        let index = P.extractLowestBitPosition()
        let pawn = (new Chess.Bitboard(0, 0)).setBit(index)
        let advancemask = AI.pawnAdvanceMask(pawn, white)
        let adcnt = advancemask.popcnt()
        let encounters

        if (adcnt > 0) {
            encounters = advancemask.and(pxmask).popcnt()

            if (encounters === 0) {
                passers++
                score += AI.PASSER_VALUES[white ? 56 ^ index : index]
            }
        }
    }

    return score
}

AI.empty = new Chess.Bitboard()

AI.pawnAdvanceMask = function (fromBB, white) {
    if (white) {
        return Chess.Position.makeSlidingAttackMask(fromBB.dup(), AI.empty, 1, 0)
    } else {
        return Chess.Position.makeSlidingAttackMask(fromBB.dup(), AI.empty, -1, 0)
    }
};

AI.getKingSafety = function (pieces, turn, notturn) {
    return AI.getKingSafetyValue(pieces.K, pieces.us, turn) - AI.getKingSafetyValue(pieces.Kx, pieces.usx, notturn)
}

AI.getKingSafetyValue = function (K, us, turn) {
    let mask = Chess.Position.makeKingDefenseMask(turn, K).and(us)
    let safety = AI.SAFETY_VALUES[mask.popcnt()]

    return safety
}

AI.getStructure = function (P, Px, turn, notturn) {
    return AI.getStructureValue(turn, P, Px) - AI.getStructureValue(notturn, Px, P)
}

AI.getStructureValue = function (turn, P, Px) {
    let hashkey = (P.low ^ P.high) >>> 0

    let hashentry = AI.pawntable[turn][hashkey % AI.pawntlength]

    AI.pnodes++

    if (hashentry !== null) {
        AI.phnodes++
        return hashentry
    }

    let white = turn === 0

    let score = 0
    let doubled = AI.getDoubled(P, white)
    let defended = AI.getDefended(P, turn)
    let passers = AI.getPassers(P, Px, white)

    score = defended + doubled + passers

    AI.pawntable[turn][hashkey % AI.pawntlength] = score

    return score
}


AI.getDefended = function (_P, color) {
    let P = _P.dup()

    let mask = Chess.Position.makePawnAttackMask(color, P).dup()
    let defendedpawns = mask.and(P).popcnt()

    return AI.DEFENDED_PAWN_VALUES[AI.phase - 1][defendedpawns]
}

AI.getMobility = function (pieces, board, turn, notturn) {
    let us = AI.getMobilityValues(pieces.P, pieces.N, pieces.B, pieces.R, pieces.Q, pieces.K, pieces.Px, board, turn)
    let them = AI.getMobilityValues(pieces.Px, pieces.Nx, pieces.Bx, pieces.Rx, pieces.Qx, pieces.Kx, pieces.P, board, notturn)
    return us - them
}

AI.getMobilityValues = function (_P, _N, _B, _R, _Q, _K, _Px, board, color) {
    let P = _P.dup()
    let N = _N.dup()
    let B = _B.dup()
    let R = _R.dup()
    let Q = _Q.dup()
    let K = _K.dup()
    let Px = _Px.dup()
    let i = AI.phase - 1

    let us = board.getColorBitboard(color).dup()
    let enemypawnattackmask = Chess.Position.makePawnAttackMask(!color, Px).dup()
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
        let qcount = board.makeBishopAttackMask(queen, space).or(board.makeRookAttackMask(queen, space)).and_not(us).popcnt()

        mobility += AI.MOBILITY_VALUES[i][4][qcount]
    }

    if (isNaN(mobility)) return 0

    return mobility
}

AI.getMaterialValue = function (pieces, us) {
    let value = 0
    let bishops

    if (us) {
        bishops = pieces.B.popcnt()

        value = AI.PIECE_VALUES[AI.phase - 1][0] * pieces.P.popcnt() +
                AI.PIECE_VALUES[AI.phase - 1][1] * pieces.N.popcnt() +
                AI.PIECE_VALUES[AI.phase - 1][2] * bishops +
                AI.PIECE_VALUES[AI.phase - 1][3] * pieces.R.popcnt() +
                AI.PIECE_VALUES[AI.phase - 1][4] * pieces.Q.popcnt()
    } else {
        bishops = pieces.Bx.popcnt()

        value = AI.PIECE_VALUES[AI.phase - 1][0] * pieces.Px.popcnt() +
                AI.PIECE_VALUES[AI.phase - 1][1] * pieces.Nx.popcnt() +
                AI.PIECE_VALUES[AI.phase - 1][2] * bishops +
                AI.PIECE_VALUES[AI.phase - 1][3] * pieces.Rx.popcnt() +
                AI.PIECE_VALUES[AI.phase - 1][4] * pieces.Qx.popcnt()
    }

    if (bishops >= 2) value += AI.BISHOP_PAIR

    return value | 0
}

AI.limit = (value)=>{
    return (AI.PAWN * 2) / (1 + Math.exp(-value / (AI.PAWN / 2))) - AI.PAWN | 0
}

AI.getPSQT = function (pieces, turn, notturn) {
    let psqt = AI.getPSQTvalue(pieces, turn, true) - AI.getPSQTvalue(pieces, notturn, false)
    return psqt
}

AI.getPSQTvalue = function (pieces, turn, us) {

    let allpieces

    if (us) {
        allpieces = [
            pieces.P.dup(),
            pieces.N.dup(),
            pieces.B.dup(),
            pieces.R.dup(),
            pieces.Q.dup(),
            pieces.K.dup()
        ]
    } else {
        allpieces = [
            pieces.Px.dup(),
            pieces.Nx.dup(),
            pieces.Bx.dup(),
            pieces.Rx.dup(),
            pieces.Qx.dup(),
            pieces.Kx.dup()
        ]
    }


    let value = 0

    let whatpieces

    if (AI.phase === 1) whatpieces = [0,1,2,3,4,5]
    if (AI.phase === 2) whatpieces = [0,3,5]
    if (AI.phase === 3) whatpieces = [0,3,5]
    if (AI.phase === 4) whatpieces = [0,5]

    for (let i=0, len=whatpieces.length; i < len; i++) {
        let pieces = allpieces[i]

        while (!pieces.isEmpty()) {
            let index = pieces.extractLowestBitPosition()
            // white: 56^index // black: index
            let sqvalue = AI.PIECE_SQUARE_TABLES[i][turn ? index : (56 ^ index)]

            value += sqvalue
        }
    }

    return value
}

AI.sortMoves = function (moves, turn, ply, board, ttEntry) {

    let t0 = (new Date).getTime()
    let killer1, killer2

    if (AI.killers) {
        killer1 = AI.killers[turn][ply][0]
        killer2 = AI.killers[turn][ply][1]
    }

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]
        let piece = move.getPiece()
        let to = move.getTo()
        let from = move.getFrom()
        let kind = move.getKind()

        move.mvvlva = 0
        move.hvalue = 0
        move.psqtvalue = 0
        move.promotion = 0
        move.killer1 = 0
        move.killer2 = 0
        move.score = 0

        if (ttEntry && move.value === ttEntry.move.value) {
            move.tt = true
            move.score = 1e8
            continue
        }

        if (kind & 8) {
            move.promotion = kind
            move.score += 2e7
            continue
        }

        if (kind & 4) {
            move.mvvlva = AI.MVVLVASCORES[piece][move.getCapturedPiece()]
            move.capture = true

            if (move.mvvlva > 6000) {
                move.score = 1e7 + move.mvvlva
            } else {
                move.score = 1e5 + move.mvvlva
            }

            continue
        }

        if (killer1 && killer1.value === move.value) {
            move.killer1 = true
            move.score = 2e6
            continue
        }

        if (killer2 && killer2.value === move.value) {
            move.killer2 = true
            move.score = 1e6
            continue
        }

        let hvalue = AI.history[turn][piece][to]

        if (hvalue) {
            move.hvalue = hvalue
            move.score = 1000 + hvalue
            continue
        } else {
            move.score = 0
            move.psqtvalue = AI.PIECE_SQUARE_TABLES[piece][turn === 0 ? 56 ^ to : to]
            move.score = move.psqtvalue
            continue
        }
    }

    moves.sort((a, b) => {
        return b.score - a.score
    })

    let t1 = (new Date()).getTime()

    AI.sortingTime += (t1 - t0)

    return moves
}

AI.quiescenceSearch = function (board, alpha, beta, depth, ply, pvNode) {
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
    let standpat = AI.evaluate(board, ply, beta)
    let hashkey = board.hashKey.getHashKey()

    if (standpat >= beta) {
        return standpat
    }

    if (standpat > alpha) alpha = standpat

    let moves = board.getMoves(true, !board.isKingInCheck()) //+0 ELO

    let ttEntry = AI.ttGet(hashkey)

    moves = AI.sortMoves(moves, turn, ply, board, ttEntry)

    for (let i = 0, len = moves.length; i < len; i++) {

        let move = moves[i]

        if (board.makeMove(move)) {
            legal++

            let score = -AI.quiescenceSearch(board, -beta, -alpha, depth - 1, ply + 1, pvNode)

            board.unmakeMove()

            if (score >= beta) {
                return score
            }

            if (score > alpha) {
                alpha = score
            }
        }
    }

    // if (legal === 0) {
    //     return -AI.MATE + ply;
    // }

    return alpha
}

AI.ttSave = function (hashkey, score, flag, depth, move) {
    if (!move) console.log('no move')
    if (AI.stop || !move) return

    AI.hashtable[hashkey % AI.htlength] = {
        hashkey,
        score,
        flag,
        depth,
        move
    }
}

AI.ttGet = function (hashkey) {
    return AI.hashtable[hashkey % AI.htlength]
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

AI.saveHistory = function (turn, move, value) {
    turn = turn | 0

    AI.history[turn][move.getPiece()][move.getTo()] += value | 0
}

AI.givescheck = function (board, move) {

    if (board.makeMove(move)) {
        let incheck = board.isKingInCheck()

        board.unmakeMove()

        return incheck
    }

    return false

}

AI.PVS = function (board, alpha, beta, depth, ply) {
    let pvNode = beta - alpha > 1 // PV-Node

    AI.nodes++

    if ((new Date()).getTime() > AI.timer + 1000 * AI.secondspermove) {
        if (AI.iteration > AI.mindepth[AI.phase - 1] && !pvNode) {
            AI.stop = true
        }
    }

    let turn = board.getTurnColor()
    let hashkey = board.hashKey.getHashKey()

    let mateScore = AI.MATE - ply

    if (mateScore < beta) {
        beta = mateScore
        if (alpha >= mateScore) {
            return mateScore
        }
    }

    mateScore = -AI.MATE + ply

    if (mateScore > alpha) {
        alpha = mateScore
        if (beta <= mateScore) {
            return mateScore
        }
    }

    let oAlpha = alpha
    
    if (AI.stop && AI.iteration > AI.mindepth[AI.phase - 1]) return alpha
    
    let ttEntry = AI.ttGet(hashkey)
    
    //Hash table lookup
    if (ttEntry && ttEntry.depth >= depth) {
        AI.ttnodes++
        
        if (ttEntry.flag === 0) {
            return ttEntry.score
        } else if (ttEntry.flag === -1) {
            if (ttEntry.score > alpha) alpha = ttEntry.score
        } else if (ttEntry.flag === 1) {
            if (ttEntry.score < beta) beta = ttEntry.score
        }
        
        if (alpha >= beta) {
            return ttEntry.score
        }
    }
    
    if (depth <= 0) {
        return AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
    }
    
    //IID (if there's no ttEntry, get one for ordering moves)
    if (pvNode && !ttEntry && depth > 2) {
        AI.PVS(board, alpha, beta, depth - 2, ply) //depth - 2 tested ok + 31 ELO
        ttEntry = AI.ttGet(hashkey)
    }
    
    let staticeval = AI.evaluate(board, ply, beta)
    let incheck = board.isKingInCheck()
    let moves = board.getMoves(true, false)

    moves = AI.sortMoves(moves, turn, ply, board, ttEntry)

    let bestmove = moves[0]
    let legal = 0
    let bestscore = -AI.INFINITY
    let score

    //Reverse Futility pruning (Static Null Move Pruning) TESTED OK
    let margin = AI.PIECE_VALUES[0][1] * depth
    let reverseval = staticeval - margin

    if (!incheck && depth <= 3 && reverseval > beta) {
        AI.ttSave(hashkey, reverseval, -1, depth, moves[0])
        return reverseval
    }

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]

        let R = 0
        let E = 0

        if (board.makeMove(move)) {
            legal++

            //Reductions (legal)
            if (AI.nofpieces <= 4) {
                R = 0
            } else {
                if (!incheck && depth >= 3) {
                    R += AI.LMR_TABLE[depth][legal]
        
                    if (AI.phase === 4) {
                        R = R/2 | 0
                    }
                }
            }

            //Extensions
            if (pvNode && depth <= 3) {
                if (incheck) {
                    E = 1
                }
            }

            if (legal === 1) {
                score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1)
            } else {
                if (AI.stop) return score
                
                score = -AI.PVS(board, -alpha - 1, -alpha, depth + E - R - 1, ply + 1)
            
                if (!AI.stop && score > alpha) {
                    score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1)
                }
            }

            board.unmakeMove()

            if (AI.stop) return oAlpha //tested ok

            //Beta cut-off
            if (score >= beta) {
                if (legal === 1) {
                    AI.fhf++
                }

                AI.fh++

                //LOWERBOUND
                AI.ttSave(hashkey, score, -1, depth, move)

                if (!move.capture) {
                    if (AI.killers[turn | 0][ply][0] && AI.killers[turn | 0][ply][0].value != move.value) {
                        AI.killers[turn | 0][ply][1] = AI.killers[turn | 0][ply][0]
                    }

                    AI.killers[turn | 0][ply][0] = move

                    AI.saveHistory(turn, move, 2 ** depth)
                }

                return score
            }

            if (score > alpha) {
                bestscore = score
                bestmove = move
                alpha = score

                if (!move.capture) { AI.saveHistory(turn, move, 1) }
            } else {
                if (!move.capture) { AI.saveHistory(turn, move, -1) }
            }
        }
    }

    if (legal === 0) {
        // Stalemate
        if (!board.isKingInCheck()) {
            AI.ttSave(hashkey, AI.DRAW + ply, 0, depth, bestmove)
            return AI.DRAW
        }

        // Checkmate
        AI.ttSave(hashkey, -AI.MATE + ply, 0, depth, bestmove)
        return -AI.MATE + ply

    } else {

        if (board.isDraw()) {
            AI.ttSave(hashkey, AI.DRAW + ply, 1, depth, bestmove)
            return AI.DRAW
        }

        if (bestscore > oAlpha) {
            // Exact
            if (bestmove) {
                AI.ttSave(hashkey, bestscore + ply, 0, depth, bestmove)
            }

            return bestscore
        } else {
            //Upperbound
            AI.ttSave(hashkey, oAlpha, 1, depth, bestmove)

            return oAlpha
        }
    }
}

AI.bin2map = function (bin, color) {
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

    map.push(reverse(dec.slice( 0,  8), color))
    map.push(reverse(dec.slice( 8, 16), color))
    map.push(reverse(dec.slice(16, 24), color))
    map.push(reverse(dec.slice(24, 32), color))
    map.push(reverse(dec.slice(32, 40), color))
    map.push(reverse(dec.slice(40, 48), color))
    map.push(reverse(dec.slice(48, 56), color))
    map.push(reverse(dec.slice(56, 64), color))

    let arraymap = map.join().split(',').map(e => { return parseInt(e) })

    return arraymap
}

AI.createPSQT = function (board) {

    AI.PIECE_SQUARE_TABLES_PHASE1 = [
        // Pawn
        [
             0,  0,  0,  0,  0,   0,   0,   0,
            wm, wm, wm, wm, wm, vbm, vbm, vbm,
            wm,vbm, bm, bm, bm, vbm, vbm, vbm,
           vbm, bm, nm,VGM,VGM, vbm, vbm, vbm,
            wm, nm, nm, BM, BM,  wm,  wm,  wm,
            nm, GM, GM, nm, wm, vbm,  GM,  nm,
            GM, GM, GM, bm, bm,  GM,  BM,  BM,
             0,  0,  0,  0,  0,   0,   0,   0,
        ],

        // Knight
        [
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, bm, nm, nm, nm, nm, bm, vbm,
             wm, bm, nm, GM, GM, nm, bm, wm,
             wm, bm, wm, BM, BM, wm, bm, wm,
             wm, bm, GM, nm, nm, GM, bm, wm,
            vbm, bm, bm, GM, nm, bm, bm, vbm,
            vbm,vbm,vbm,vbm,vbm,vbm,vbm, vbm,

        ],
        // Bishop
        [
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, bm, nm, nm, nm, nm, bm, vbm,
            vbm,vbm, nm, GM, GM, nm, wm, vbm,
            vbm, bm, BM, GM, GM, BM, bm, vbm,
             wm, bm, nm, bm, bm, nm, bm, wm,
            vbm, BM, bm, nm, nm, bm, BM, vbm,
            vbm,vbm, wm,vbm,vbm, wm,vbm, vbm,
        ],
        // Rook
        [
            nm, nm, nm, nm, nm, nm, nm, nm,
            GM, GM, GM, BM, BM, GM, GM, GM,
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            nm, nm, nm, nm, nm, nm, nm, nm,
            nm, nm, nm, nm, nm, nm, nm, nm,
            nm, nm, nm, nm, nm, nm, nm, nm,
            nm, nm, nm, BM, BM, GM, nm, nm,
        ],

        // Queen
        [
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            bm, bm, bm, bm, bm, bm, bm, bm,
            bm, bm, bm, vbm, bm, bm, bm, bm,
            bm, bm, GM, GM, GM, bm, bm, bm,
            wm, vbm, wm, nm, wm, vbm, vbm, wm,
        ],

        // King
        [
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            vbm, vbm, vbm, wm, wm, vbm, vbm, vbm,
            bm, bm, bm, vbm, vbm, vbm, nm, nm,
            bm, bm, BM, wm, bm, vbm, BM, nm

        ],
    ]

    AI.PIECE_SQUARE_TABLES_PHASE2 = [
        // Pawn
        [
            0, 0, 0, 0, 0, 0, 0, 0,
            nm, nm, nm, nm, nm, nm, nm, vbm,
            nm, nm, nm, nm, nm, nm, nm, vbm,
            nm, nm, GM, GM, GM, GM, vbm, vbm,
            nm, GM, GM, GM, GM, vbm, vbm, vbm,
            GM, GM, GM, nm, GM, vbm, nm, nm,
            VGM, GM, vbm, vbm, vbm, VGM, VGM, VGM,
            0, 0, 0, 0, 0, 0, 0, 0,
        ],

        // Knight
        [
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, bm, VGM, VGM, VGM, VGM, bm, vbm,
            vbm, bm, VGM, BM, BM, VGM, bm, vbm,
            vbm, bm, GM, BM, BM, GM, bm, vbm,
            vbm, bm, nm, nm, nm, nm, bm, vbm,
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, wm, vbm, vbm, vbm, vbm, wm, vbm,

        ],
        // Bishop
        [
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, bm, nm, nm, nm, nm, bm, vbm,
            vbm, GM, BM, BM, BM, BM, GM, vbm,
            vbm, GM, GM, GM, GM, GM, GM, vbm,
             wm, GM, GM, GM, GM, GM, GM,  wm,
            vbm, GM, bm, bm, bm, bm, GM, vbm,
            vbm,vbm, wm,vbm,vbm, wm,vbm, vbm,
        ],
        // Rook
        [
            nm, nm, nm, nm, nm, nm, nm, nm,
            GM, VGM, VGM, BM, BM, VGM, VGM, GM,
            nm, nm, nm, nm, nm, nm, nm, nm,
            nm, nm, nm, nm, nm, nm, nm, nm,
            nm, nm, nm, nm, nm, nm, nm, nm,
            nm, nm, nm, nm, nm, nm, nm, nm,
            nm, nm, nm, GM, GM, nm, nm, nm,
            wm, nm, nm, GM, GM, GM, nm, wm,
        ],

        // Queen
        [
            bm, bm, bm, nm, nm, nm, nm, nm,
            bm, wm, bm, nm, nm, nm, nm, nm,
            bm, bm, bm, nm, nm, nm, nm, nm,
            nm, nm, nm, wm, wm, nm, nm, nm,
            nm, nm, nm, wm, wm, nm, nm, nm,
            nm, nm, nm, nm, nm, nm, nm, nm,
            bm, bm, GM, GM, GM, bm, bm, bm,
            vbm, vbm, vbm, wm, bm, vbm, vbm, vbm,
        ],

        // King
        [
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,
             bm,  bm,  bm,  wm,  wm, vbm,  nm,  nm,
             bm,  GM,  GM,  wm, vbm, vbm,  BM,  nm,

        ],
    ]

    AI.PIECE_SQUARE_TABLES_PHASE3 = [
        // Pawn
        [
            0, 0, 0, 0, 0, 0, 0, 0,
            BM, BM, BM, BM, BM, BM, BM, BM,
           VGM,VGM,VGM,VGM,VGM,VGM,VGM,VGM,
            GM, GM, GM, GM, GM, GM, GM, GM,
            bm, bm, bm, bm, bm, bm, bm, bm,
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            0, 0, 0, 0, 0, 0, 0, 0,
        ],

        // Knight
        [
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, nm, nm, nm, nm, nm, nm, vbm,
            vbm, nm, GM, GM, GM, GM, nm, vbm,
            vbm, nm, GM, BM, BM, GM, nm, vbm,
            vbm, nm, GM, BM, BM, GM, nm, vbm,
            vbm, nm, GM, GM, GM, GM, nm, vbm,
            vbm, nm, nm, nm, nm, nm, nm, vbm,
            vbm, wm, vbm, vbm, vbm, vbm, wm, vbm,

        ],
        // Bishop
        [
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            bm, nm, nm, nm, nm, nm, nm, bm,
            nm, nm, GM, GM, GM, GM, nm, nm,
            nm, nm, GM, BM, BM, GM, nm, nm,
            nm, nm, GM, BM, BM, GM, nm, nm,
            nm, nm, GM, GM, GM, GM, nm, nm,
            bm, nm, nm, nm, nm, nm, nm, bm,
            vbm, vbm, wm, vbm, vbm, wm, vbm, vbm,

        ],
        // Rook
        [
            VGM, VGM, VGM, VGM, VGM, VGM, VGM, VGM,
            GM, GM, GM, BM, BM, GM, GM, GM,
            nm, nm, nm, GM, GM, nm, nm, nm,
            nm, nm, nm, GM, GM, nm, nm, nm,
            nm, nm, nm, GM, GM, nm, nm, nm,
            nm, nm, nm, GM, GM, nm, nm, nm,
            nm, nm, nm, GM, GM, nm, nm, nm,
            wm, wm, wm, GM, GM, wm, wm, wm,
        ],

        // Queen
        [
            nm, nm, nm, nm, nm, nm, nm, nm,
            nm, GM, GM, GM, GM, GM, GM, nm,
            nm, GM, GM, GM, GM, GM, GM, nm,
            nm, GM, GM, BM, BM, GM, GM, nm,
            nm, GM, GM, BM, BM, GM, GM, nm,
            nm, GM, GM, GM, GM, GM, GM, nm,
            nm, GM, GM, GM, GM, GM, GM, nm,
            nm, nm, nm, nm, nm, nm, nm, nm,
        ],

        // King
        [
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, bm, bm, bm, bm, bm, bm, wm,
            wm, bm, GM, VGM, VGM, GM, bm, wm,
            wm, GM, VGM, BM, BM, VGM, GM, wm,
            wm, GM, VGM, BM, BM, VGM, GM, wm,
            wm, bm, GM, VGM, VGM, GM, bm, wm,
            wm, bm, bm, bm, bm, bm, bm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
        ],
    ]

    AI.PIECE_SQUARE_TABLES_PHASE4 = [
        // Pawn
        [
            0, 0, 0, 0, 0, 0, 0, 0,
            BM, BM, BM, BM, BM, BM, BM, BM,
            VGM, VGM, VGM, VGM, VGM, VGM, VGM, VGM,
            GM, GM, GM, GM, GM, GM, GM, GM,
            bm, bm, bm, bm, bm, bm, bm, bm,
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,
            wm, wm, wm, wm, wm, wm, wm, wm,
            0, 0, 0, 0, 0, 0, 0, 0,
        ],

        // Knight
        [
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            vbm, nm, nm, nm, nm, nm, nm, vbm,
            vbm, nm, GM, GM, GM, GM, nm, vbm,
            vbm, nm, GM, BM, BM, GM, nm, vbm,
            vbm, nm, GM, BM, BM, GM, nm, vbm,
            vbm, nm, GM, GM, GM, GM, nm, vbm,
            vbm, nm, nm, nm, nm, nm, nm, vbm,
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,

        ],
        // Bishop
        [
            vbm, bm, bm, bm, bm, bm, bm, vbm,
            bm, nm, nm, nm, nm, nm, nm, bm,
            nm, nm, GM, GM, GM, GM, nm, nm,
            nm, nm, GM, BM, BM, GM, nm, nm,
            nm, nm, GM, BM, BM, GM, nm, nm,
            nm, nm, GM, GM, GM, GM, nm, nm,
            bm, nm, nm, nm, nm, nm, nm, bm,
            vbm, vbm, vbm, vbm, vbm, vbm, vbm, vbm,

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
            wm, wm, wm, nm, nm, wm, wm, wm,
        ],

        // Queen
        [
            nm, nm, nm, nm, nm, nm, nm, nm,
            nm, GM, GM, GM, GM, GM, GM, nm,
            nm, GM, GM, GM, GM, GM, GM, nm,
            nm, GM, GM, BM, BM, GM, GM, nm,
            nm, GM, GM, BM, BM, GM, GM, nm,
            nm, GM, GM, GM, GM, GM, GM, nm,
            nm, GM, GM, GM, GM, GM, GM, nm,
            nm, nm, nm, nm, nm, nm, nm, nm,
        ],

        // King
        [
            wm, wm, wm, wm, wm, wm, wm, wm,
            wm, bm, bm, bm, bm, bm, bm, wm,
            wm, bm, GM, VGM, VGM, GM, bm, wm,
            wm, GM, VGM, BM, BM, VGM, GM, wm,
            wm, GM, VGM, BM, BM, VGM, GM, wm,
            wm, bm, GM, VGM, VGM, GM, bm, wm,
            wm, bm, bm, bm, bm, bm, bm, wm,
            wm, wm, wm, wm, wm, wm, wm, wm,
        ],
    ]

    AI.preprocessor(board)

    if (AI.phase === 1) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE1]
    if (AI.phase === 2) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE2]
    if (AI.phase === 3) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE3]
    if (AI.phase === 4) AI.PIECE_SQUARE_TABLES = [...AI.PIECE_SQUARE_TABLES_PHASE4]
}

AI.PSQT2Sigmoid = function () {
    let upperlimit = 120
    let lowerlimit = 120

    for (let i = 1; i <= 4; i++) {
        AI.PIECE_SQUARE_TABLES[i] = AI.PIECE_SQUARE_TABLES[i].map(psqv => {
            if (psqv > 0) {
                return (upperlimit * 2) / (1 + Math.exp(-psqv / (upperlimit / 2))) - upperlimit | 0
            } else {
                return (lowerlimit * 2) / (1 + Math.exp(-psqv / (lowerlimit / 2))) - lowerlimit | 0
            }

        })
    }
}

AI.softenPSQT = function () {
    for (let p = 0; p <= 5; p++) {
        AI.PIECE_SQUARE_TABLES[p] = AI.PIECE_SQUARE_TABLES[p].map((e, i) => {
            if (e) return e

            let N = [...AI.PIECE_SQUARE_TABLES[p]]
            let sum = N[i]
            let total = 1

            if (i % 8 != 0 && N[i - 9]) { sum += N[i - 9]; total++ }
            if ((i + 1) % 8 != 0 && N[i - 7]) { sum += N[i - 7]; total++ }

            if (i % 8 != 0 && N[i + 7]) { sum += N[i + 7]; total++ }
            if ((i + 1) % 8 != 0 && N[i + 9]) { sum += N[i + 9]; total++ }

            if (i % 8 != 0 && N[i - 1]) { sum += N[i - 1]; total++ }
            if ((i + 1) % 8 != 0 && N[i + 1]) { sum += N[i + 1]; total++ }

            if (N[i - 8]) { sum += N[i - 8]; total++ }
            if (N[i + 8]) { sum += N[i + 8]; total++ }

            let average = sum / total

            return average / 2 | 0
        })
    }
}

AI.preprocessor = function (board) {
    let color = board.getTurnColor()
    let sign = color === 0? 1 : -1

    let P = board.getPieceColorBitboard(0, color).dup()
    let N = board.getPieceColorBitboard(1, color).dup()
    let B = board.getPieceColorBitboard(2, color).dup()
    let R = board.getPieceColorBitboard(3, color).dup()
    let Q = board.getPieceColorBitboard(4, color).dup()
    let K = board.getPieceColorBitboard(5, color).dup()
    let PX = board.getPieceColorBitboard(0, !color).dup()
    let NX = board.getPieceColorBitboard(1, !color).dup()
    let BX = board.getPieceColorBitboard(2, !color).dup()
    let RX = board.getPieceColorBitboard(3, !color).dup()
    let QX = board.getPieceColorBitboard(4, !color).dup()
    let KX = board.getPieceColorBitboard(5, !color).dup()

    let pawnmask = Chess.Position.makePawnAttackMask(color, P)
    let pawnmap = AI.bin2map(P, color)
    let pawnstructure = AI.bin2map({ high: P.high | pawnmask.high, low: P.low | pawnmask.low }, color)

    let pawnmaskX = Chess.Position.makePawnAttackMask(!color, PX).not(PX)
    let pawnXmap = AI.bin2map(PX, color)

    let kingmap = AI.bin2map(K, color)
    let kingXmap = AI.bin2map(KX, color)

    let kingposition = kingmap.indexOf(1)

    let kingXposition = kingXmap.indexOf(1)

    //Castiga captura y maniobras con peón frontal del rey
    if (
        (color === 0 && (
            kingposition >= 61 ||
            (kingposition >= 56 && kingposition <= 58)
            )
        ) ||
        (color === 1 && (
            kingposition <= 2 ||
            (kingposition >=5 && kingposition <=7)
            )
        )
    ) {
        //Good
        AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 7*sign] += VGM
        AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 8*sign] += GM
        AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 9*sign] += VGM

        AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 7*sign] += VGM
        AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 8*sign] += GM
        AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 9*sign] += VGM

        //Bad
        AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 15*sign] += wm
        AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 17*sign] += wm
        AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 23*sign] += wm
        AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 24*sign] += wm
        AI.PIECE_SQUARE_TABLES_PHASE1[0][kingposition - 25*sign] += wm

        AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 15*sign] += bm
        AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 17*sign] += bm
        AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 23*sign] += vbm
        AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 24*sign] += vbm
        AI.PIECE_SQUARE_TABLES_PHASE2[0][kingposition - 25*sign] += vbm
    }

    //Torre
    //Premia enrocar
    if (board.hasCastlingRight(color, true) &&
        (
            (pawnmap[kingposition - 5*sign] && pawnmap[kingposition - 6*sign]) ||
            (pawnmap[kingposition - 5*sign] && pawnmap[kingposition - 7*sign] && pawnmap[kingposition - 14*sign])
        )
    ) {
        // white
        AI.PIECE_SQUARE_TABLES_PHASE2[3][kingposition+3] -= AI.PAWN4
        AI.PIECE_SQUARE_TABLES_PHASE2[3][kingposition+2] -= AI.PAWN3
        AI.PIECE_SQUARE_TABLES_PHASE2[3][kingposition+1] += AI.PAWN2
    }

    if (board.hasCastlingRight(color, false) && pawnmap[kingposition - 10*sign] && pawnmap[kingposition - 11*sign]) {
        // console.log('rook QUEENSIDE')
        AI.PIECE_SQUARE_TABLES_PHASE2[3][kingposition-4] -= AI.PAWN4
        AI.PIECE_SQUARE_TABLES_PHASE2[3][kingposition-3] -= AI.PAWN4
        AI.PIECE_SQUARE_TABLES_PHASE2[3][kingposition-2] -= AI.PAWN4
        AI.PIECE_SQUARE_TABLES_PHASE2[3][kingposition-1] += AI.PAWN2
    }

    //Torres en columnas abiertas

    let pawnXfiles = [0, 0, 0, 0, 0, 0, 0, 0]
    let pawnfiles = [0, 0, 0, 0, 0, 0, 0, 0]

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


    AI.PIECE_SQUARE_TABLES_PHASE1[3] = AI.PIECE_SQUARE_TABLES_PHASE1[3].map((e, i) => {
        let col = i % 8
        return e + (pawnfiles[col] ? -40 : 0)
    })

    AI.PIECE_SQUARE_TABLES_PHASE1[3] = AI.PIECE_SQUARE_TABLES_PHASE1[3].map((e, i) => {
        let col = i % 8
        return e + (!pawnfiles[col] ? 80 : 0) + (!pawnXfiles[col] ? 50 : 0)
    })

    AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e, i) => {
        let col = i % 8
        return e + (pawnfiles[col] ? -20 : 0)
    })

    AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e, i) => {
        let col = i % 8
        return e + (!pawnfiles[col] ? 50 : 0) + (!pawnXfiles[col] ? 50 : 0)
    })

    // Torres delante del rey enemigo ("torre en séptima")
    for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_PHASE2[3][i + sign*8 * (kingXposition / 8 | 0)] += 27

    //Torres conectadas
    let RR = board.makeRookAttackMask(R, P.or(PX))
    let RRmap = AI.bin2map(RR, color)

    AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e, i) => {
        return e + 10 * RRmap[i]
    })

    //Premia enrocar
    if (board.hasCastlingRight(color, true)) {
        // console.log('KINGSIDE')

        if (
            (pawnmap[kingposition - 5*sign] && pawnmap[kingposition - 6*sign]) ||
            (pawnmap[kingposition - 5*sign] && pawnmap[kingposition - 7*sign] && pawnmap[kingposition - 14*sign])
        ) {
            AI.PIECE_SQUARE_TABLES_PHASE2[5][kingposition] -= AI.PAWN2
            AI.PIECE_SQUARE_TABLES_PHASE2[5][kingposition+1] -= AI.PAWN4
            AI.PIECE_SQUARE_TABLES_PHASE2[5][kingposition+2] += AI.PAWN
        } else {
            AI.PIECE_SQUARE_TABLES_PHASE2[5][kingposition+2] -= AI.PAWN*2
            AI.PIECE_SQUARE_TABLES_PHASE1[5][kingposition+2] -= AI.PAWN*2 //Evita enroque al vacío

        }
    }

    if (board.hasCastlingRight(color, false)) {
        // console.log('QUEENSIDE')

        if (pawnmap[kingposition - 10*sign] && pawnmap[kingposition - 11*sign]) {
            AI.PIECE_SQUARE_TABLES_PHASE2[5][kingposition-2] += AI.PAWN2
            AI.PIECE_SQUARE_TABLES_PHASE2[5][kingposition-1] -= AI.PAWN2
            AI.PIECE_SQUARE_TABLES_PHASE2[5][kingposition] -= AI.PAWN4
        } else {
            AI.PIECE_SQUARE_TABLES_PHASE2[5][kingposition-2] -= AI.PAWN*2
            AI.PIECE_SQUARE_TABLES_PHASE1[5][kingposition-2] -= AI.PAWN*2 //Evita enroque al vacío
        }
    }

    //***************** ENDGAME ***********************
    //***************** ENDGAME ***********************
    //***************** ENDGAME ***********************
    //***************** ENDGAME ***********************

    //Torres en columnas abiertas

    pawnfiles = [0, 0, 0, 0, 0, 0, 0, 0]

    for (let i = 0; i < 64; i++) {
        if (pawnmap[i]) {
            let col = i % 8

            pawnfiles[col]++
        }
    }

    AI.PIECE_SQUARE_TABLES_PHASE3[3] = AI.PIECE_SQUARE_TABLES_PHASE3[3].map((e, i) => {
        let col = i % 8
        return e + (pawnfiles[col] ? -40 : 0)
    })

    AI.PIECE_SQUARE_TABLES_PHASE3[3] = AI.PIECE_SQUARE_TABLES_PHASE3[3].map((e, i) => {
        let col = i % 8
        return e + (!pawnfiles[col] ? 40 : 0)
    })

    //Torres delante del rey enemigo ("torre en séptima")
    for (let i = 8; i < 16; i++) AI.PIECE_SQUARE_TABLES_PHASE3[3][i + sign*8 * (kingXposition / 8 | 0)] += 27

    if (AI.phase === 4 && AI.lastscore >= AI.PIECE_VALUES[0][3]) {
        //Rey cerca del rey enemigo
        AI.PIECE_SQUARE_TABLES_PHASE3[5] = AI.PIECE_SQUARE_TABLES_PHASE3[5].map((e, i) => {
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
    AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e, i) => {
        return e + 20 * RBmap[i]
    })

    //Alfiles apuntando a dama
    AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e, i) => {
        return e + 20 * QBmap[i]
    })

    //Alfiles apuntando al rey
    AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e, i) => {
        return e + 20 * KBmap[i]
    })

    AI.PIECE_SQUARE_TABLES_PHASE3[2] = AI.PIECE_SQUARE_TABLES_PHASE3[2].map((e, i) => {
        return e + 20 * KBmap[i]
    })

    if (kingXposition % 8 < 7) {
        AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e, i) => {
            return e + 20 * (KBmap[i + 1] || 0)
        })
    }

    if (kingXposition % 8 < 7) {
        AI.PIECE_SQUARE_TABLES_PHASE3[2] = AI.PIECE_SQUARE_TABLES_PHASE3[2].map((e, i) => {
            return e + 20 * (KBmap[i + 1] || 0)
        })
    }

    if (kingXposition % 8 > 0) {
        AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e, i) => {
            return e + 20 * (KBmap[i - 1] || 0)
        })
    }

    if (kingXposition % 8 > 0) {
        AI.PIECE_SQUARE_TABLES_PHASE3[2] = AI.PIECE_SQUARE_TABLES_PHASE3[2].map((e, i) => {
            return e + 20 * (KBmap[i - 1] || 0)
        })
    }

    //Torres apuntando a dama
    AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e, i) => {
        return e + 10 * QRmap[i]
    })

    //Torres apuntando al rey
    AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e, i) => {
        return e + 10 * KRmap[i]
    })

    AI.PIECE_SQUARE_TABLES_PHASE3[3] = AI.PIECE_SQUARE_TABLES_PHASE3[3].map((e, i) => {
        return e + 10 * KRmap[i]
    })

    //Dama apuntando al rey
    AI.PIECE_SQUARE_TABLES_PHASE2[4] = AI.PIECE_SQUARE_TABLES_PHASE2[4].map((e, i) => {
        return e + 10 * KBmap[i]
    })

    //Dama apuntando a alfiles enemigos
    AI.PIECE_SQUARE_TABLES_PHASE2[4] = AI.PIECE_SQUARE_TABLES_PHASE2[4].map((e, i) => {
        return e - 60 * BBmap[i]
    })

    //Dama apuntando a torres enemigas
    AI.PIECE_SQUARE_TABLES_PHASE2[4] = AI.PIECE_SQUARE_TABLES_PHASE2[4].map((e, i) => {
        return e - 20 * RRmapx[i]
    })

    //Rey apuntando a alfiles enemigos
    AI.PIECE_SQUARE_TABLES_PHASE2[5] = AI.PIECE_SQUARE_TABLES_PHASE2[5].map((e, i) => {
        return e - 60 * BBmap[i]
    })

    //Rey apuntando a torres enemigas
    AI.PIECE_SQUARE_TABLES_PHASE2[5] = AI.PIECE_SQUARE_TABLES_PHASE2[5].map((e, i) => {
        return e - 20 * RRmapx[i]
    })

    /************* ABSURD MOVES *****************/

    AI.PIECE_SQUARE_TABLES_PHASE1[1] = AI.PIECE_SQUARE_TABLES_PHASE1[1].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE1[2] = AI.PIECE_SQUARE_TABLES_PHASE1[2].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE1[3] = AI.PIECE_SQUARE_TABLES_PHASE1[3].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE1[4] = AI.PIECE_SQUARE_TABLES_PHASE1[4].map((e, i) => { return e - 20 * pawnXmap[i] })

    AI.PIECE_SQUARE_TABLES_PHASE2[1] = AI.PIECE_SQUARE_TABLES_PHASE2[1].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE2[2] = AI.PIECE_SQUARE_TABLES_PHASE2[2].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE2[3] = AI.PIECE_SQUARE_TABLES_PHASE2[3].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE2[4] = AI.PIECE_SQUARE_TABLES_PHASE2[4].map((e, i) => { return e - 20 * pawnXmap[i] })

    AI.PIECE_SQUARE_TABLES_PHASE3[1] = AI.PIECE_SQUARE_TABLES_PHASE3[1].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE3[2] = AI.PIECE_SQUARE_TABLES_PHASE3[2].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE3[3] = AI.PIECE_SQUARE_TABLES_PHASE3[3].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE3[4] = AI.PIECE_SQUARE_TABLES_PHASE3[4].map((e, i) => { return e - 20 * pawnXmap[i] })

    AI.PIECE_SQUARE_TABLES_PHASE4[1] = AI.PIECE_SQUARE_TABLES_PHASE4[1].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE4[2] = AI.PIECE_SQUARE_TABLES_PHASE4[2].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE4[3] = AI.PIECE_SQUARE_TABLES_PHASE4[3].map((e, i) => { return e - 20 * pawnXmap[i] })
    AI.PIECE_SQUARE_TABLES_PHASE4[4] = AI.PIECE_SQUARE_TABLES_PHASE4[4].map((e, i) => { return e - 20 * pawnXmap[i] })
}

AI.setphase = function (board) {
    AI.phase = 1 //OPENING
    let color = board.getTurnColor()

    if (AI.nofpieces <= 28 || (board.movenumber && board.movenumber > 10)) {
        AI.phase = 2 //MIDGAME
    }

    let queens = board.getPieceColorBitboard(4, color).popcnt() + board.getPieceColorBitboard(4, !color).popcnt()

    if (AI.nofpieces <= 20 && queens === 0 || Math.abs(AI.lastscore) > AI.PAWN*3) { // ¿Debería ser queens < 2? Hay que testearlo
        AI.phase = 3 //ENDGAME (the king enters)
    }

    if (AI.nofpieces <= 12 || Math.abs(AI.lastscore) > AI.PIECE_VALUES[0][3]) AI.phase = 4 //LATE ENGDAME

    AI.createPSQT(board)
    AI.randomizePSQT()
    AI.softenPSQT()
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

        if (ttEntry && ttEntry.flag <= 0) {
            let moves = board.getMoves(false, false).filter(move => {
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
                        let already = PV.filter(e => {
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

    let upperBound = AI.INFINITY
    let lowerBound = -AI.INFINITY

    //Esta línea permite que el algoritmo funcione como PVS normal
    return AI.PVS(board, lowerBound, upperBound, d, 1)
    // console.log('INICIO DE MTDF')
    let i = 0
    let beta

    while (lowerBound < upperBound && !AI.stop) {
        g === lowerBound? beta = g + 1 : beta = g

        g = AI.PVS(board, beta - 1, beta, d, 1)

        g < beta? upperBound = g : lowerBound = g
    }


    return g
}

AI.search = function (board, options) {
    AI.sortingTime = 0
    AI.searchTime0 = (new Date()).getTime()

    if (board.movenumber && board.movenumber <= 1) {
        AI.lastscore = 0
        AI.bestmove = 0
        AI.bestscore = 0
        AI.f = 0
    }
    
    if (options && options.seconds) AI.secondspermove = options.seconds
    
    AI.nofpieces = board.getOccupiedBitboard().popcnt()
    
    let nmoves = board.madeMoves.length
    let changeofphase = false
    
    AI.setphase(board)
    
    if (AI.lastphase !== AI.phase) changeofphase = true
    
    AI.lastphase = AI.phase
    
    if (board.movenumber && board.movenumber <= 1/* || changeofphase*/) {
        AI.createTables()
    }
    
    AI.reduceHistory()
    
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
        AI.PV = AI.getPV(board, 1)
        AI.changeinPV = true
        
        let score = 0
        let fhfperc = 0
        
        AI.killers = [
            (new Array(128)).fill([null, null]), //white
            (new Array(128)).fill([null, null]), //black
        ]
        
        AI.fh = AI.fhf = 0.001

        AI.f = 0
        
        //Iterative Deepening
        for (let depth = 1; depth <= AI.totaldepth; depth += 1) {
            
            if (AI.stop && AI.iteration > AI.mindepth[AI.phase - 1]) break

            AI.bestmove = [...AI.PV][1]
            AI.iteration++
            AI.f = AI.MTDF(board, AI.f, depth)
            
            score = (white ? 1 : -1) * AI.f
            
            AI.PV = AI.getPV(board, depth)
            
            if ([...AI.PV][1] && AI.bestmove && [...AI.PV][1].value !== AI.bestmove.value) {
                AI.changeinPV = true
            } else {
                AI.changeinPV = false
            }
            
            fhfperc = Math.round(AI.fhf * 100 / AI.fh)
            
            if (!AI.stop) AI.lastscore = score
            
            if (AI.PV && !AI.stop) console.log(AI.iteration, depth, AI.PV.map(e => { return e && e.getString ? e.getString() : '---' }).join(' '), '|Fhf ' + fhfperc + '%', 'Pawn hit ' + (AI.phnodes / AI.pnodes * 100 | 0), score, AI.nodes.toString(), AI.qsnodes.toString())
        }

        if (AI.TESTER) {
          console.info('___________________________________ AI.TESTER _____________________________________')
        } else {
          console.info('________________________________________________________________________________')
        }

        let sigmoid = 1 / (1 + Math.pow(10, -AI.lastscore / (4 * AI.PAWN)))

        AI.lastmove = AI.bestmove

        //zugzwang prevention
        if (!AI.bestmove) {
            let moves = board.getMoves(false, false)

            AI.bestmove = moves[moves.length * Math.random() | 0]
        }

        AI.searchTime1 = (new Date()).getTime()
        AI.searchTime = AI.searchTime1 - AI.searchTime0
        console.log('Sorting % time: ', (AI.sortingTime / AI.searchTime) * 100 | 0, '%')

        resolve({
            n: board.movenumber, phase: AI.phase, depth: AI.iteration - 1, from: AI.bestmove.getFrom(), to: AI.bestmove.getTo(), movestring: AI.bestmove.getString(),
            score: AI.lastscore | 0, sigmoid: (sigmoid * 100 | 0) / 100, nodes: AI.nodes, qsnodes: AI.qsnodes,
            FHF: fhfperc + '%'
        })
    })
}

AI.createTables()

module.exports = AI
