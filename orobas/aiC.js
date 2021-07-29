"use strict"

const Chess = require('chess.js')

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
    random: 4,
    phase: 1,
    htlength: 1 << 24,
    pawntlength: 1e6,
    reduceHistoryFactor: 1, //1, actúa sólo en la actual búsqueda
    mindepth: [3, 3, 3, 3],
    secondspermove: 3,
    lastmove: null,
    f: 0,
    previousls: 0,
    lastscore: 0,
    onlyMaterialTime: 0.4
}

// ÍNDICES
const PAWN = 1
const KNIGHT = 3
const BISHOP = 4
const ROOK = 5
const QUEEN = 9
const KING = 20
const K = KING
const Q = QUEEN
const R = ROOK
const B = BISHOP
const N = KNIGHT
const P = PAWN
const k = -KING
const q = -QUEEN
const r = -ROOK
const b = -BISHOP
const n = -KNIGHT
const p = -PAWN

const WHITE = 1
const BLACK = -1

const WHITEINDEX = [1,3,4,5,9,20]
const BLACKINDEX = [-1,-3,-4,-5,-9,-20]
const ALLINDEX = [-1,-3,-4,-5,-9,-20,1,3,4,5,9,20]

const OPENING = 0
const MIDGAME = 1
const EARLY_ENDGAME = 2
const LATE_ENDGAME = 3

const LOWERBOUND = -1
const EXACT = 0
const UPPERBOUND = 1

///// VALOR RELATIVO DE LAS PIEZAS
const VPAWN = 82
const VPAWN2 = VPAWN / 2 | 0
const VPAWN3 = VPAWN / 3 | 0
const VPAWN4 = VPAWN / 4 | 0
const VPAWN5 = VPAWN / 5 | 0
const VPAWN10= VPAWN /10 | 0

AI.PIECE_VALUES = [
    [],
    [],
    [],
    [],
]

AI.PIECE_VALUES[0][k] = -0
AI.PIECE_VALUES[0][q] = -900
AI.PIECE_VALUES[0][r] = -500
AI.PIECE_VALUES[0][b] = -325
AI.PIECE_VALUES[0][n] = -300
AI.PIECE_VALUES[0][p] = -100
AI.PIECE_VALUES[0][P] = 100
AI.PIECE_VALUES[0][N] = 300
AI.PIECE_VALUES[0][B] = 325
AI.PIECE_VALUES[0][R] = 500
AI.PIECE_VALUES[0][Q] = 900
AI.PIECE_VALUES[0][K] = 0

// AI.PIECE_ORDER = [
//     [ 4, 8, 16, 1, 0, 2],
//     [ 1, 8, 16, 4, 2, 0],
//     [ 8, 2,  4,16, 0, 1],
//     [ 8, 1,  2,16, 0, 8],
// ]

const BISHOP_PAIR = VPAWN2 | 0

// CONSTANTES
const MATE = 20000
const DRAW = 0 //-2*VPAWN
const INFINITY = 21000

//VALORES POSICIONALES
const twm = -40  // El peor movimiento
const vbm = -20  // Muy mal movimiento
const abm = -10  // Un mal movimiento
const anm =  0  // Un movimiento neutral
const AGM =  10  // Un buen movimiento
const VGM =  20  // Muy buen movimiento
const TBM =  30  // El mejor movimiento

//CREA TABLA PARA REDUCCIONES
AI.LMR_TABLE = new Array(AI.totaldepth + 1)

for (let depth = 1; depth < AI.totaldepth + 1; ++depth) {

    AI.LMR_TABLE[depth] = new Array(218)

    for (let moves = 1; moves < 218; ++moves) {
        if (depth >= 6) {
            AI.LMR_TABLE[depth][moves] = depth/5 + moves/5 + 1 | 0
        } else {
            AI.LMR_TABLE[depth][moves] = Math.log(depth)*Math.log(moves)/2 | 0
        }
    }

}

const PAWNFACTOR = VPAWN/127

// VALORES PARA VALORAR MOBILIDAD
// El valor se asigna dependiendo del número de movimientos por pieza, desde el caballo hasta la dama

AI.MOBILITY_VALUES = []

for (let phase = OPENING; phase <= LATE_ENDGAME; phase++) {
    AI.MOBILITY_VALUES.push([
        [],
        [...Array(9).keys()].map(e=>(PAWNFACTOR * (13*Math.log(e+1)-20) | 0)),
        [...Array(14).keys()].map(e=>(PAWNFACTOR * (16*Math.log(e+1)-15) | 0)),
        [...Array(15).keys()].map(e=>(PAWNFACTOR * (29*Math.log(e+1)-25) | 0)),
        [...Array(28).keys()].map(e=>(PAWNFACTOR * (12*Math.log(e+1)-13) | 0)),
        [],
    ])
}

// SEGURIDAD DEL REY
// Valor se asigna dependiendo del número de piezas que rodea al rey
AI.SAFETY_VALUES = [-4,-2, 0, 3, 3, 3, 3, 3, 3].map(e => VPAWN5 * e)

// PEONES PASADOS
// Al detectar un peón pasado, se asigna un valor extra al peón correspondiente
AI.PASSER_VALUES = [
    7,	7,	7,	7,	7,	7,	7,	7,
    6,	6,	6,	6,	6,	6,	6,	6,
    5,	5,	5,	5,	5,	5,	5,	5,
    4,	4,	4,	4,	4,	4,	4,	4,
    3,	3,	3,	3,	3,	3,	3,	3,
    2,	2,	2,	2,	2,	2,	2,	2,
    1,	1,	1,	1,	1,	1,	1,	1,
    0,	0,	0,	0,	0,	0,	0,	0,
].map(e=>e*VPAWN5)

// PEONES DOBLADOS
// Se asigna un valor negativo dependiendo del número de peones doblados
AI.DOUBLED_VALUES = [0, -1, -2, -3, -4, -5, -6, -7, -8].map(e => e * VPAWN2 | 0)

// ESTRUCTURA DE PEONES
// Se asigna un valor dependiendo del número de peones defendidos por otro peón en cada fase
AI.DEFENDED_PAWN_VALUES = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8].map(e=>VPAWN10*e),
    [0, 1, 2, 3, 4, 5, 5, 5, 5].map(e=>VPAWN10*e),
    [0, 1, 2, 3, 4, 5, 5, 5, 5].map(e=>VPAWN10*e),
    [0, 1, 2, 3, 4, 5, 5, 5, 5].map(e=>VPAWN10*e),
]

// MVV-LVA
// Valor para determinar orden de capturas,
// prefiriendo la víctima más valiosa con el atacante más débil
//https://open-chess.org/viewtopic.php?t=3058
AI.MVVLVASCORES = [
  /*P*/[6002, 20225, 20250, 20400, 20800, 26900],
  /*N*/[4775,  6004, 20025, 20175, 20575, 26675],
  /*B*/[4750,  4975,  6006, 20150, 20550, 26650],
  /*R*/[4600,  4825,  4850,  6008, 20400, 26500],
  /*Q*/[4200,  4425,  4450,  4600,  6010, 26100],
  /*K*/[3100,  3325,  3350,  3500,  3900, 26000],
]

AI.PSQT = [
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
    Array(64).fill(0),
]

// CREA TABLAS DE TRASPOSICIÓN / PEONES / HISTORIA
AI.createTables = function (tt, hh, pp) {
    console.log('Creating tables', tt, hh, pp)

    if (hh) {
        delete AI.history
        AI.history = new Map()

        AI.history[K] = Array(128).fill(0)
        AI.history[Q] = Array(128).fill(0)
        AI.history[R] = Array(128).fill(0)
        AI.history[B] = Array(128).fill(0)
        AI.history[N] = Array(128).fill(0)
        AI.history[P] = Array(128).fill(0)
        
        AI.history[k] = Array(128).fill(0)
        AI.history[q] = Array(128).fill(0)
        AI.history[r] = Array(128).fill(0)
        AI.history[b] = Array(128).fill(0)
        AI.history[n] = Array(128).fill(0)
        AI.history[p] = Array(128).fill(0)
    }

    if (tt) {
        delete AI.hashtable
        AI.hashtable = new Map()
    }
    if (pp) {
        delete AI.pawntable
        AI.pawntable = (new Array(this.pawntlength)).fill(null)
    }

}

//ESTABLECE VALORES ALEATORIAS EN LA APERTURA (PARA TESTEOS)
AI.randomizePSQT = function () {
    return
    if (AI.phase === OPENING) {
        //From Knight to Queen
        for (let i = KNIGHT; i <= QUEEN; i++) {
            AI.PSQT[i] = AI.PSQT[i].map(e => {
                return e + Math.random() * AI.random - AI.random / 2 | 0
            })
        }
    }
}

// FÓRMULA GENERAL PARA RECUPERAR INFORMACIÓN DE PIEZAS EN EL TABLERO
// El resultado se guarda en un objecto que será trasapasado
// a las distintas funciones de evaluación.
// Cuidar el hecho de que es un objeto y, por lo tanto,
// al pasarse como parámetro, los cambios en sus propiedades
// cambian el objeto original (no existe ámbito).
// AI.getPieces = function (board) {
//     let Pw = board.getPieceColorBitboard(PAWN, WHITE)
//     let Nw = board.getPieceColorBitboard(KNIGHT, WHITE)
//     let Bw = board.getPieceColorBitboard(BISHOP, WHITE)
//     let Rw = board.getPieceColorBitboard(ROOK, WHITE)
//     let Qw = board.getPieceColorBitboard(QUEEN, WHITE)
//     let Kw = board.getPieceColorBitboard(KING, WHITE)

//     let Pb = board.getPieceColorBitboard(PAWN, BLACK)
//     let Nb = board.getPieceColorBitboard(KNIGHT, BLACK)
//     let Bb = board.getPieceColorBitboard(BISHOP, BLACK)
//     let Rb = board.getPieceColorBitboard(ROOK, BLACK)
//     let Qb = board.getPieceColorBitboard(QUEEN, BLACK)
//     let Kb = board.getPieceColorBitboard(KING, BLACK)

//     let white = board.getColorBitboard(WHITE)
//     let black = board.getColorBitboard(BLACK)

//     return { Pw, Nw, Bw, Rw, Qw, Kw, Pb, Nb, Bb, Rb, Qb, Kb, white, black }
// }

// FUNCIÓN DE EVALUACIÓN DE LA POSICIÓN
AI.evaluate = function (board, ply, beta, pvNode, materialOnly) {
    // materialOnly = false
    let turn = board.turn
    let notturn = -turn
    // let pieces = AI.getPieces(board, turn, notturn)
    let score = 0
    
    // Valor material del tablero
    // let material = AI.getMaterial() | 0
    // // Structure: Valoración de la estructura de peones (defendidos/doblados/pasados)
    // let structure = AI.getStructure(pieces.Pw, pieces.Pb) | 0

    // // Valor posicional del tablero
    // // PSQT: Plusvalor o minusvalor por situar una pieza en determinada casilla
    // // Mobility: Valoración de la capacidad de las piezas de moverse en el tablero
    // let psqt = AI.getPSQT(pieces) | 0 // -4 a 6 depths
    // let kingSafety = (AI.phase > 0? AI.getKingSafety(pieces) : 0) | 0
    // let mobility = ply <= 2? (AI.getMobility(pieces, board) | 0) : 0

    for (let i = 0; i < 128; i++) {
        if (i & 0x88) {
            i+=7
            continue
        }

        let piece = board.board[i]

        if (piece === 0) continue

        let turn = Math.sign(piece)

        let material = AI.PIECE_VALUES[OPENING][piece] //Material
        let psqt = turn*AI.PSQT[turn*piece][turn === 1? i : (112^i)]

        score += material + psqt
    }


    // score += material// + structure + psqt + kingSafety + mobility

    return turn*score | 0
}

AI.cols = [
    0, 1, 2, 3, 4, 5, 6, 7,
    0, 1, 2, 3, 4, 5, 6, 7,
    0, 1, 2, 3, 4, 5, 6, 7,
    0, 1, 2, 3, 4, 5, 6, 7,
    0, 1, 2, 3, 4, 5, 6, 7,
    0, 1, 2, 3, 4, 5, 6, 7,
    0, 1, 2, 3, 4, 5, 6, 7,
]

AI.rows = [
    0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2,
    3, 3, 3, 3, 3, 3, 3, 3,
    4, 4, 4, 4, 4, 4, 4, 4,
    5, 5, 5, 5, 5, 5, 5, 5,
    6, 6, 6, 6, 6, 6, 6, 6,
    7, 7, 7, 7, 7, 7, 7, 7,
]

AI.getDoubled = function (Pw, Pb) {
    let pawnsWhite = Pw.dup()
    let pawnsBlack = Pb.dup()
    let doubledWhite = 0
    let doubledBlack = 0

    let scoreWhite = 0
    let scoreBlack = 0

    let pawnsWhiteDup = pawnsWhite.dup()

    while (!pawnsWhiteDup.isEmpty()) {
        let index = pawnsWhiteDup.extractLowestBitPosition()
        let pawn = (new Chess.Bitboard(0, 0)).setBit(index)
        let advancemask = AI.pawnAdvanceMask(pawn, true)
        let adcnt = advancemask.popcnt()
        let encounters = 0

        if (adcnt > 0) {
            encounters = advancemask.and(pawnsWhite).popcnt()

            if (encounters > 0) {
                doubledWhite++
                scoreWhite += AI.DOUBLED_VALUES[doubledWhite]
            }
        }
    }

    let pawnsBlackDup = pawnsBlack.dup()

    while (!pawnsBlackDup.isEmpty()) {
        let index = pawnsBlackDup.extractLowestBitPosition()
        let pawn = (new Chess.Bitboard(0, 0)).setBit(index)
        let advancemask = AI.pawnAdvanceMask(pawn, true)
        let adcnt = advancemask.popcnt()
        let encounters = 0

        if (adcnt > 0) {
            encounters = advancemask.and(pawnsBlack).popcnt()

            if (encounters > 0) {
                doubledBlack++
                scoreBlack += AI.DOUBLED_VALUES[doubledBlack]
            }
        }
    }

    return scoreWhite - scoreBlack
}

AI.getPassers = function (Pw, Pb) {
    let pawnsWhite = Pw.dup()
    let pawnsBlack = Pb.dup()

    let passersWhite = 0
    let passersBlack = 0
    let whiteMask = pawnsWhite.or(Chess.Position.makePawnAttackMask(WHITE, pawnsWhite))
    let blackMask = pawnsBlack.or(Chess.Position.makePawnAttackMask(BLACK, pawnsBlack))

    let scoreWhite = 0
    let scoreBlack = 0

    let pawnsWhiteDup = pawnsWhite.dup()

    while (!pawnsWhiteDup.isEmpty()) {
        let index = pawnsWhiteDup.extractLowestBitPosition()
        let pawn = (new Chess.Bitboard(0, 0)).setBit(index)
        let advancemask = AI.pawnAdvanceMask(pawn, true)
        let adcnt = advancemask.popcnt()
        let encounters = 0

        if (adcnt > 0) {
            encounters = advancemask.and(blackMask).popcnt()

            if (encounters === 0) {
                passersWhite++
                scoreWhite += AI.PASSER_VALUES[56 ^ index]
            }
        }
    }

    let pawnsBlackDup = pawnsBlack.dup()

    while (!pawnsBlackDup.isEmpty()) {
        let index = pawnsBlackDup.extractLowestBitPosition()
        let pawn = (new Chess.Bitboard(0, 0)).setBit(index)
        let advancemask = AI.pawnAdvanceMask(pawn, false)
        let adcnt = advancemask.popcnt()
        let encounters = 0

        if (adcnt > 0) {
            encounters = advancemask.and(whiteMask).popcnt()

            if (encounters === 0) {
                passersBlack++
                scoreBlack += AI.PASSER_VALUES[index]
            }
        }
    }

    return scoreWhite - scoreBlack
}

AI.pawnAdvanceMask = function (fromBB, white) {
    if (white) {
        return Chess.Position.makeSlidingAttackMask(fromBB.dup(), 
        AI.EMPTY, 1, 0)
    } else {
        return Chess.Position.makeSlidingAttackMask(fromBB.dup(), 
        AI.EMPTY, -1, 0)
    }
};

AI.getKingSafety = function (pieces) {
    let maskWhite = Chess.Position.makeKingDefenseMask(WHITE, pieces.Kw).and(pieces.white)
    let safetyWhite = AI.SAFETY_VALUES[maskWhite.popcnt()]

    let maskBlack = Chess.Position.makeKingDefenseMask(BLACK, pieces.Kb).and(pieces.black)
    let safetyBlack = AI.SAFETY_VALUES[maskBlack.popcnt()]

    return safetyWhite - safetyBlack
}

AI.getKingSafetyValue = function (K, us, turn) {
    

    return safety
}

// IMPORTANTE: Esta función devuelve el valor de la estructura de peones.
// Dado que la estructura tiende a ser relativamente fija, el valor se guarda
// en una tabla hash y es devuelto en caso que se requiera evaluar la misma
// estructura. La tasa de acierto de las entradas hash es mayor al 95%, por lo
// que esta función es esencial para mantener un buen rendimiento.
AI.getStructure = function (Pw, Pb) {
    let hashkey = ((Pw.low ^ Pw.high ^ Pb.low ^ Pb.high) >>> 0)

    // console.log(hashkey)

    let hashentry = AI.pawntable[hashkey % AI.pawntlength]

    AI.pnodes++

    if (hashentry !== null) {
        AI.phnodes++
        return hashentry
    }

    let doubled = AI.getDoubled(Pw, Pb)
    let defended = AI.getDefended(Pw, Pb)
    let passers = AI.getPassers(Pw, Pb)

    let score = doubled + defended + passers

    AI.pawntable[hashkey % AI.pawntlength] = score

    return score
}

AI.getDefended = function (Pw, Pb) {
    let pawnsWhite = Pw.dup()
    let pawnsBlack = Pb.dup()

    let maskWhite = Chess.Position.makePawnDefenseMask(0, pawnsWhite).dup()
    let maskBlack = Chess.Position.makePawnDefenseMask(1, pawnsBlack).dup()
    
    let defendedWhite = maskWhite.and(pawnsWhite).popcnt()
    let defendedBlack = maskBlack.and(pawnsBlack).popcnt()

    return AI.DEFENDED_PAWN_VALUES[AI.phase][defendedWhite] - AI.DEFENDED_PAWN_VALUES[AI.phase][defendedBlack]
}

AI.getMobility = function (pieces, board) {
    let white = AI.getMobilityValues(pieces.Pw, pieces.Nw, pieces.Bw, pieces.Rw, pieces.Qw, pieces.Kw, pieces.Pb, board, WHITE)
    let black = AI.getMobilityValues(pieces.Pb, pieces.Nb, pieces.Bb, pieces.Rb, pieces.Qb, pieces.Kb, pieces.Pw, board, BLACK)
    return white - black
}

AI.getMobilityValues = function (_P, _N, _B, _R, _Q, _K, _Px, board, color) {
    let P = _P.dup()
    let N = _N.dup()
    let B = _B.dup()
    let R = _R.dup()
    let Q = _Q.dup()
    let K = _K.dup()
    let Px = _Px.dup()
    let i = AI.phase

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

    if (isNaN(mobility)) {
        console.log('NaN')
        return 0
    }

    return mobility
}

// AI.getMaterial = function (pieces, us) {
//     let whiteScore = 0
//     let blackScore = 0
//     let whiteBishops
//     let blackBishops

//     // Blancas
//     whiteBishops = pieces.Bw.popcnt()

//     whiteScore = AI.PIECE_VALUES_SUM[AI.phase][PAWN][pieces.Pw.popcnt()] +
//     AI.PIECE_VALUES_SUM[AI.phase][KNIGHT][pieces.Nw.popcnt()] +
//     AI.PIECE_VALUES_SUM[AI.phase][BISHOP][whiteBishops] +
//     AI.PIECE_VALUES_SUM[AI.phase][ROOK][pieces.Rw.popcnt()] +
//     AI.PIECE_VALUES_SUM[AI.phase][QUEEN][pieces.Qw.popcnt()]
    
//     if (whiteBishops >= 2) whiteScore += BISHOP_PAIR
    
//     // Negras
//     blackBishops = pieces.Bb.popcnt()
    
//     blackScore = AI.PIECE_VALUES_SUM[AI.phase][PAWN][pieces.Pb.popcnt()] +
//     AI.PIECE_VALUES_SUM[AI.phase][KNIGHT][pieces.Nb.popcnt()] +
//     AI.PIECE_VALUES_SUM[AI.phase][BISHOP][blackBishops] +
//     AI.PIECE_VALUES_SUM[AI.phase][ROOK][pieces.Rb.popcnt()] +
//     AI.PIECE_VALUES_SUM[AI.phase][QUEEN][pieces.Qb.popcnt()]
    
//     if (blackBishops >= 2) blackScore += BISHOP_PAIR

//     return whiteScore - blackScore | 0
// }

// Limita el valor posicional
AI.limit = (value, limit) => {
    return (limit * 2) / (1 + Math.exp(-value / (limit / 2))) - limit | 0
}

AI.getPSQT = function (pieces) {
    let white = [
        pieces.Pw.dup(),
        pieces.Nw.dup(),
        pieces.Bw.dup(),
        pieces.Rw.dup(),
        pieces.Qw.dup(),
        pieces.Kw.dup(),
    ]
        
    let black = [
        pieces.Pb.dup(),
        pieces.Nb.dup(),
        pieces.Bb.dup(),
        pieces.Rb.dup(),
        pieces.Qb.dup(),
        pieces.Kb.dup(),
    ]

    let scoreWhite = 0
    let scoreBlack = 0

    for (let i = PAWN; i <= KING; i++) {
        let pieceWhite = white[i]
        let pieceBlack = black[i]

        do {
            let index = pieceWhite.extractLowestBitPosition()
            scoreWhite += AI.PSQT[i][56 ^ index]
        } while (!pieceWhite.isEmpty())
        
        do {
            let index = pieceBlack.extractLowestBitPosition()
            scoreBlack += AI.PSQT[i][index]
        } while (!pieceBlack.isEmpty())
    }

    return scoreWhite - scoreBlack
}

// ORDENA LOS MOVIMIENTOS
// Esta función es fundamental para que la poda Alfa-Beta funcione de manera óptima
// El orden establecido permite que la primera jugada
// sea FAIL-HIGH en más de un 90% de los casos.
AI.sortMoves = function (moves, turn, ply, board, ttEntry, isQS) {

    let t0 = (new Date).getTime()
    let killer1, killer2

    if (!isQS && AI.killers) {
        killer1 = AI.killers[turn][ply][0]
        killer2 = AI.killers[turn][ply][1]
    }

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]

        move.mvvlva = 0
        move.hvalue = 0
        move.psqtvalue = 0
        move.promotion = 0
        move.killer1 = 0
        move.killer2 = 0
        move.score = 0//AI.PIECE_ORDER[0][piece]

        move.capture = false
        
        // CRITERIO 0: La jugada está en la Tabla de Trasposición
        if (ttEntry && ttEntry.flag < UPPERBOUND && move.from === ttEntry.move.from && move.to === ttEntry.move.to) {
            move.tt = true
            move.score += 1e9
            continue
        }

        // CRITERIO 1: Enroque
        if (AI.phase <= MIDGAME && move.castleSide) {
            move.score += 1e8
            continue
        }

        // CRITERIO 2: La jugada es una promoción de peón
        // if (kind & 8) {
        //     move.promotion = kind
        //     move.score += 2e7
        //     continue
        // }

        if (move.capturedPiece) {
            move.mvvlva = -100 * (move.capturedPiece / move.piece) | 0
            move.capture = true
            
            if (move.mvvlva >= 100) {
                // CRITERIO 3: La jugada es una captura posiblemente ganadora
                move.score += 1e7 + move.mvvlva
            } else {
                // CRITERIO 5: La jugada es una captura probablemente perdedora
                move.score += 1e5 + move.mvvlva
            }

            continue
        }

        // CRITERIO 4: La jugada es un movimiento Killer
        // (Los killers son movimientos que anteriormente han generado Fail-Highs en el mismo ply)
        if (killer1 && killer1.from === move.from && killer1.to === move.to) {
            move.killer1 = true
            move.score += 2e6
            continue
        }
        
        if (killer2 && killer2.from === move.from && killer2.to === move.to) {
            move.killer2 = true
            move.score += 1e6
            continue
        }

        // CRITERIO 6: Movimientos históricos
        // Se da preferencia a movimientos posicionales que han tenido 
        // éxito en otras posiciones.
        let hvalue = AI.history[move.piece][move.to]

        if (hvalue > 0) {
            move.score += 1000 + hvalue
            continue
        } else {
            move.score = 0; continue
            // CRITERIO 7
            // Las jugadas restantes se orden de acuerdo a donde se estima sería
            // su mejor posición absoluta en el tablero
            move.psqtvalue = AI.PSQT[piece][turn === 0 ? 56 ^ to : to] - AI.PSQT[piece][turn === 0 ? 56 ^ from : from]
            move.score += move.psqtvalue
            continue
        }
    }

    // ORDENA LOS MOVIMIENTOS
    // El tiempo de esta función toma hasta un 10% del total de cada búsqueda.
    // Sería conveniente utilizar un mejor método de ordenamiento.
    moves.sort((a, b) => {
        return b.score - a.score
    })

    let t1 = (new Date()).getTime()

    AI.sortingTime += (t1 - t0)

    return moves
}

// BÚSQUEDA ¿EN CALMA?
// Para evitar el Efecto-Horizonte, la búqueda continua de manera forzosa hasta
// que se encuentra una posición "en calma" (donde ningún rey está en jaque ni
// donde la última jugada haya sido una captura). Cuando se logra esta posición
// "en calma", se evalúa la posición.
AI.quiescenceSearch = function (board, alpha, beta, depth, ply, pvNode, materialOnly) {
    let oAlpha = alpha

    AI.qsnodes++

    // let mateScore = MATE - ply

    // if (mateScore < beta) {
    //     beta = mateScore
    //     if (alpha >= mateScore) return mateScore
    // }
    
    // mateScore = -MATE + ply
    
    // if (mateScore > alpha) {
    //     alpha = mateScore
    //     if (beta <= mateScore) return mateScore
    // }

    let turn = board.turn
    let legal = 0
    let standpat = AI.evaluate(board, ply, beta, pvNode, materialOnly)
    let hashkey = board.hashkey
    let incheck = board.isKingInCheck()

    if (!incheck && standpat >= beta) {
        return standpat
    }

    // delta pruning
    // if (!incheck) {
    //     let futilityMargin = AI.PIECE_VALUES[OPENING][KNIGHT]
    
    //     if (standpat + futilityMargin <= alpha) {
    //         return standpat
    //     }
    // }

    if (standpat > alpha) alpha = standpat
    
    let ttEntry = AI.ttGet(hashkey)
        
    // if (!ttEntry || !ttEntry.move.capture || ttEntry.flag === UPPERBOUND) {
    //     ttEntry = null
    // }

    let score = -INFINITY
    
    // let moves = board.getMoves(true, !incheck) //+0 ELO
    let moves = board.getMoves(true, true) //+0 ELO

    moves = moves.filter(e=>{
        return e.capturedPiece !== 0
    })

    moves = AI.sortMoves(moves, turn, ply, board, ttEntry, true)

    if (moves.length === 0) {
        return alpha
    }

    let bestmove = moves[0]

    for (let i = 0, len = moves.length; i < len; i++) {

        let move = moves[i]
        // delta pruning para cada movimiento
        // if (!incheck && legal > 1) {
        //     if (standpat + AI.PIECE_VALUES[AI.phase][turn * move.capturedPiece] < alpha) {
        //         continue
        //     }
        // }

        if (board.makeMove(move)) {
            legal++

            score = -AI.quiescenceSearch(board, -beta, -alpha, depth - 1, ply + 1, pvNode, materialOnly)

            board.unmakeMove(move)

            if (score >= beta) {
                AI.ttSave(hashkey, score, LOWERBOUND, 0, move)
                return score
            }
            
            if (score > alpha) {
                alpha = score
                bestmove = move
            }
        }
    }

    if (legal === 0) {
        
        // Ahogado
        if (!board.isKingInCheck()) {
            // AI.ttSave(hashkey, DRAW, EXACT, 0, bestmove)
            
            return DRAW
        }
        
        // Mate
        // AI.ttSave(hashkey, -MATE + ply, EXACT, 0, bestmove)

        return -MATE + ply

    }
    
    if (alpha > oAlpha) {
        // Mejor movimiento
        return alpha
    } else {
        //Upperbound
        return oAlpha
    }
}

AI.ttSave = function (hashkey, score, flag, depth, move) {
    if (!move) {
        console.log('no move')
        return
    }

    let ttEntry = AI.hashtable[hashkey % AI.htlength]
    let save = false

    if (ttEntry) {
        if (hashkey === ttEntry.hashkey) {
            if (depth >= ttEntry.depth) {
                save = true
            } else {
                save = false
            }
        } else {
            save = true
        }
    } else {
        save = true
    }

    if (true) {
        AI.hashtable[hashkey % AI.htlength] = {
            hashkey,
            score,
            flag,
            depth,
            move
        }
    }
}

AI.ttGet = function (hashkey) {
    AI.ttnodes++
    return AI.hashtable[hashkey % AI.htlength]
}

AI.reduceHistory = function () {
    return
    for (let piece of ALLINDEX) {
        for (let to = 0; to < 64; to++) {
            AI.history[piece][to] = ((1 - AI.reduceHistoryFactor) * AI.history[piece][to]) | 0
        }
    }
}

AI.saveHistory = function (turn, move, value) {
    AI.history[move.piece][move.to] += value | 0
}

AI.givescheck = function (board, move) {

    if (board.makeMove(move)) {
        let incheck = board.isKingInCheck()

        board.unmakeMove(move)

        return incheck
    }

    return false
}

// PRINCIPAL VARIATION SEARCH
// El método PVS es Negamax + Ventana-Nula
AI.PVS = function (board, alpha, beta, depth, ply, materialOnly) {
    let pvNode = beta - alpha > 1 // PV-Node
    
    let cutNode = beta - alpha === 1 // Cut-Node
    // console.log(cutNode)

    AI.nodes++

    if ((new Date()).getTime() > AI.timer + (materialOnly? 0 : 1000) * AI.secondspermove) {
        if (AI.iteration > AI.mindepth[AI.phase]) {
            AI.stop = true
        }
    }

    //Búsqueda QS
    if (depth <= 0) {
        return AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode, materialOnly)
    }

    let turn = board.turn
    let hashkey = board.hashkey

    let mateScore = MATE - ply

    if (mateScore < beta) {
        beta = mateScore
        if (alpha >= mateScore) {
            return mateScore
        }
    }

    mateScore = -MATE + ply

    if (mateScore > alpha) {
        alpha = mateScore
        if (beta <= mateScore) {
            return mateScore
        }
    }

    let oAlpha = alpha

    if (AI.stop && AI.iteration > AI.mindepth[AI.phase]) return alpha

    // Busca la posición en la Tabla de Trasposición (lookup)

    let ttEntry = AI.ttGet(hashkey)

    if (ttEntry && ttEntry.depth >= depth) {
        if (ttEntry.flag === EXACT) {
            return ttEntry.score
        } else if (ttEntry.flag === LOWERBOUND) {
            if (ttEntry.score > alpha) alpha = ttEntry.score
        } else if (ttEntry.flag === UPPERBOUND) {
            if (ttEntry.score < beta) beta = ttEntry.score
        }

        if (alpha >= beta && depth > 0) {
            return ttEntry.score
        }
    }

    let staticeval = AI.evaluate(board, ply, beta, pvNode, materialOnly)
    let incheck = board.isKingInCheck()

    //Razoring (idea from Strelka) //+34 ELO
    if (cutNode && !incheck) {
        let score = staticeval + VPAWN

        if (score < beta) {
            if (depth === 1) {
                let new_score = AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode, materialOnly)
                return Math.max(new_score, score)
            }
            score += 2*VPAWN

            if (score < beta && depth <= 3) {
                let new_score = AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode, materialOnly)
                if (new_score < beta)
                return Math.max(new_score, score)
            }
        }
    }

    //IID (si no hay entrada en ttEntry, busca una para mejorar el orden de movimientos)
    if (!ttEntry && depth > 2) {
        AI.PVS(board, alpha, beta, depth - 2, ply, materialOnly) //depth - 2 tested ok + 31 ELO
        ttEntry = AI.ttGet(hashkey)
    }

    let moves = board.getMoves(true, false)

    moves = AI.sortMoves(moves, turn, ply, board, ttEntry, false)

    let bestmove = moves[0]
    let legal = 0
    let bestscore = -INFINITY
    let score

    //Reverse Futility pruning (Static Null Move Pruning) TESTED OK
    // let reverseval = staticeval - AI.PIECE_VALUES[OPENING][KNIGHT] * depth

    // if (!incheck && reverseval > beta) {
    //     AI.ttSave(hashkey, beta, LOWERBOUND, depth, moves[0])
    //     return staticeval
    // }

    // futility pruning
    // if (!incheck) {
    //   let futilityMargin = depth * AI.PIECE_VALUES[OPENING][KNIGHT]

    //   if (staticeval + futilityMargin <= alpha) {
    //     AI.ttSave(hashkey, oAlpha, UPPERBOUND, depth, moves[0])
    //     return oAlpha
    //   }
    // }

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]
        let piece = move.piece

        // futility pruning para cada movimiento
        // if (!incheck && legal >= 1) {
        //     if (staticeval + AI.PIECE_VALUES[AI.phase][turn*move.capturedPiece] + 2*depth*VPAWN < alpha) {
        //         continue
        //     }
        // }

        let R = 0
        let E = incheck && depth === 1? 1 : 0

        //Absurd maneuvers reductions (AMR)
        // if (legal >= 1 && AI.phase <= 1 && AI.absurd[turn][piece] >= 2) {
        //   R++
        // }

        // Move count reductions
        // if (depth >=3 && !move.capture && legal >= (3 + depth**2) / 2) {
        //     R++
        // }

        // if (ttEntry && move.piece === ttEntry.piece && ttEntry.move.capturedPiece) {
        //     R++
        // }

        // let historyScore = AI.history[piece][move.to]
        // if (historyScore < 64) {
        //     R++
        // }

        if (board.makeMove(move)) {
            legal++

            // AI.absurd[turn][piece]++

            //Reducciones
            if (!incheck && depth >= 3) {
                R += AI.LMR_TABLE[depth][legal]
            }

            if (legal === 1) {
                // El primer movimiento se busca con ventana total y sin reducciones
                if (AI.stop) return oAlpha
                score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1, materialOnly)
            } else {
                if (AI.stop) return oAlpha

                // (Null window left to MTDF)
                score = -AI.PVS(board, -beta, -alpha, depth + E - R - 1, ply + 1, materialOnly)

                if (!AI.stop && score > alpha) {
                    score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1, materialOnly)
                }
            }

            board.unmakeMove(move)

            // AI.absurd[turn][piece]--

            if (AI.stop) return oAlpha //tested ok

            // Fail-high
            if (score >= beta) {
                if (legal === 1) {
                    AI.fhf++
                }

                AI.fh++

                //LOWERBOUND
                AI.ttSave(hashkey, score, LOWERBOUND, depth, move)

                if (!move.capture) {
                    if (
                        AI.killers[turn | 0][ply][0] &&
                        AI.killers[turn | 0][ply][0].from != move.from &&
                        AI.killers[turn | 0][ply][0].to != move.to
                    ) {
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
            }
        }
    }

    if (legal === 0) {
        
        // Ahogado
        if (!board.isKingInCheck()) {
            // AI.ttSave(hashkey, DRAW, EXACT, depth, bestmove)
            
            return DRAW
        }
        
        // Mate
        // AI.ttSave(hashkey, -MATE + ply, EXACT, depth, bestmove)

        return -MATE + ply

    } else {
        // Tablas
        // if (board.isDraw()) {
        //     // AI.ttSave(hashkey, DRAW, EXACT, depth, bestmove)
        //     return DRAW
        // }

        if (bestscore > oAlpha) {
            // Mejor movimiento
            if (bestmove) {
                AI.ttSave(hashkey, bestscore, EXACT, depth, bestmove)
            }

            return bestscore
        } else {
            //Upperbound
            AI.ttSave(hashkey, oAlpha, UPPERBOUND, depth, bestmove)

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

// PIECE SQUARE TABLES BASED ON PESTO
AI.createPSQT = function (board) {

    AI.PSQT_OPENING = []

        // Pawn
    AI.PSQT_OPENING[PAWN] = [
            0,   0,   0,   0,   0,   0,  0,    0,    null,null,null,null,null,null,null,null,
            98, 134,  61,  95,  68, 126, 34, -11,    null,null,null,null,null,null,null,null,
            -6,   7,  26,  31,  65,  56, 25, -20,    null,null,null,null,null,null,null,null,
           -14,  13,   6,  21,  23,  12, 17, -23,    null,null,null,null,null,null,null,null,
           -27,  -2,  -5,  12,  17,   6, 10, -25,    null,null,null,null,null,null,null,null,
           -26,  -4,  -4, -10,   3,   3, 33, -12,    null,null,null,null,null,null,null,null,
           -35,  -1, -20, -23, -15,  24, 38, -22,    null,null,null,null,null,null,null,null,
             0,   0,   0,   0,   0,   0,  0,   0,    null,null,null,null,null,null,null,null,
        ]

        // Knight
    AI.PSQT_OPENING[KNIGHT] = [
           -167, -89, -34, -49,  61, -97, -15, -107,    null,null,null,null,null,null,null,null,
            -73, -41,  72,  36,  23,  62,   7,  -17,    null,null,null,null,null,null,null,null,
            -47,  60,  37,  65,  84, 129,  73,   44,    null,null,null,null,null,null,null,null,
             -9,  17,  19,  53,  37,  69,  18,   22,    null,null,null,null,null,null,null,null,
            -13,   4,  16,  13,  28,  19,  21,   -8,    null,null,null,null,null,null,null,null,
            -23,  -9,  12,  10,  19,  17,  25,  -16,    null,null,null,null,null,null,null,null,
            -29, -53, -12,  -3,  -1,  18, -14,  -19,    null,null,null,null,null,null,null,null,
           -105, -21, -58, -33, -17, -28, -19,  -23,    null,null,null,null,null,null,null,null,

        ]
        // Bishop
        AI.PSQT_OPENING[BISHOP] = [
            -29,   4, -82, -37, -25, -42,   7,  -8,    null,null,null,null,null,null,null,null,
            -26,  16, -18, -13,  30,  59,  18, -47,    null,null,null,null,null,null,null,null,
            -16,  37,  43,  40,  35,  50,  37,  -2,    null,null,null,null,null,null,null,null,
             -4,   5,  19,  50,  37,  37,   7,  -2,    null,null,null,null,null,null,null,null,
             -6,  13,  13,  26,  34,  12,  10,   4,    null,null,null,null,null,null,null,null,
              0,  15,  15,  15,  14,  27,  18,  10,    null,null,null,null,null,null,null,null,
              4,  15,  16,   0,   7,  21,  33,   1,    null,null,null,null,null,null,null,null,
            -33,  -3, -14, -21, -13, -12, -39, -21,    null,null,null,null,null,null,null,null,
        ]
        // Rook
        AI.PSQT_OPENING[ROOK] = [
            32,  42,  32,  51, 63,  9,  31,  43,    null,null,null,null,null,null,null,null,
            27,  32,  58,  62, 80, 67,  26,  44,    null,null,null,null,null,null,null,null,
            -5,  19,  26,  36, 17, 45,  61,  16,    null,null,null,null,null,null,null,null,
           -24, -11,   7,  26, 24, 35,  -8, -20,    null,null,null,null,null,null,null,null,
           -36, -26, -12,  -1,  9, -7,   6, -23,    null,null,null,null,null,null,null,null,
           -45, -25, -16, -17,  3,  0,  -5, -33,    null,null,null,null,null,null,null,null,
           -44, -16, -20,  -9, -1, 11,  -6, -71,    null,null,null,null,null,null,null,null,
           -19, -13,   1,  17, 16,  7, -37, -26,    null,null,null,null,null,null,null,null,
        ]

        // Queen
        AI.PSQT_OPENING[QUEEN] = [
            -28,   0,  29,  12,  59,  44,  43,  45,    null,null,null,null,null,null,null,null,
            -24, -39,  -5,   1, -16,  57,  28,  54,    null,null,null,null,null,null,null,null,
            -13, -17,   7,   8,  29,  56,  47,  57,    null,null,null,null,null,null,null,null,
            -27, -27, -16, -16,  -1,  17,  -2,   1,    null,null,null,null,null,null,null,null,
             -9, -26,  -9, -10,  -2,  -4,   3,  -3,    null,null,null,null,null,null,null,null,
            -14,   2, -11,  -2,  -5,   2,  14,   5,    null,null,null,null,null,null,null,null,
            -35,  -8,  11,   2,   8,  15,  -3,   1,    null,null,null,null,null,null,null,null,
             -1, -18,  -9,  10, -15, -25, -31, -50,    null,null,null,null,null,null,null,null,
        ]

        // King
        AI.PSQT_OPENING[KING] = [
           -65,  23,  16, -15, -56, -34,   2,  13,    null,null,null,null,null,null,null,null,
            29,  -1, -20,  -7,  -8,  -4, -38, -29,    null,null,null,null,null,null,null,null,
            -9,  24,   2, -16, -20,   6,  22, -22,    null,null,null,null,null,null,null,null,
           -17, -20, -12, -27, -30, -25, -14, -36,    null,null,null,null,null,null,null,null,
           -49,  -1, -27, -39, -46, -44, -33, -51,    null,null,null,null,null,null,null,null,
           -14, -14, -22, -46, -44, -30, -15, -27,    null,null,null,null,null,null,null,null,
             1,   7,  -8, -64, -43, -16,   9,   8,    null,null,null,null,null,null,null,null,
           -15,  36,  12, -54,   8, -28,  24,  14,    null,null,null,null,null,null,null,null,
        ]


    AI.PSQT_MIDGAME = [
        // Pawn
        [
            0,   0,   0,   0,   0,   0,  0,   0,
            98, 134,  61,  95,  68, 126, 34, -11,
            -6,   7,  26,  31,  65,  56, 25, -20,
           -14,  13,   6,  21,  23,  12, 17, -23,
           -27,  -2,  -5,  12,  17,   6, 10, -25,
           -26,  -4,  -4, -10,   3,   3, 33, -12,
           -35,  -1, -20, -23, -15,  24, 38, -22,
             0,   0,   0,   0,   0,   0,  0,   0,
        ],

        // Knight
        [
            -167, -89, -34, -49,  61, -97, -15, -107,
            -73, -41,  72,  36,  23,  62,   7,  -17,
            -47,  60,  37,  65,  84, 129,  73,   44,
             -9,  17,  19,  53,  37,  69,  18,   22,
            -13,   4,  16,  13,  28,  19,  21,   -8,
            -23,  -9,  12,  10,  19,  17,  25,  -16,
            -29, -53, -12,  -3,  -1,  18, -14,  -19,
           -105, -21, -58, -33, -17, -28, -19,  -23,

        ],
        // Bishop
        [
            -29,   4, -82, -37, -25, -42,   7,  -8,
            -26,  16, -18, -13,  30,  59,  18, -47,
            -16,  37,  43,  40,  35,  50,  37,  -2,
             -4,   5,  19,  50,  37,  37,   7,  -2,
             -6,  13,  13,  26,  34,  12,  10,   4,
              0,  15,  15,  15,  14,  27,  18,  10,
              4,  15,  16,   0,   7,  21,  33,   1,
            -33,  -3, -14, -21, -13, -12, -39, -21,
        ],
        // Rook
        [
            32,  42,  32,  51, 63,  9,  31,  43,
            27,  32,  58,  62, 80, 67,  26,  44,
            -5,  19,  26,  36, 17, 45,  61,  16,
           -24, -11,   7,  26, 24, 35,  -8, -20,
           -36, -26, -12,  -1,  9, -7,   6, -23,
           -45, -25, -16, -17,  3,  0,  -5, -33,
           -44, -16, -20,  -9, -1, 11,  -6, -71,
           -19, -13,   1,  17, 16,  7, -37, -26,
        ],

        // Queen
        [
            -28,   0,  29,  12,  59,  44,  43,  45,
            -24, -39,  -5,   1, -16,  57,  28,  54,
            -13, -17,   7,   8,  29,  56,  47,  57,
            -27, -27, -16, -16,  -1,  17,  -2,   1,
             -9, -26,  -9, -10,  -2,  -4,   3,  -3,
            -14,   2, -11,  -2,  -5,   2,  14,   5,
            -35,  -8,  11,   2,   8,  15,  -3,   1,
             -1, -18,  -9,  10, -15, -25, -31, -50,
        ],

        // King
        [
            -65,  23,  16, -15, -56, -34,   2,  13,
            29,  -1, -20,  -7,  -8,  -4, -38, -29,
            -9,  24,   2, -16, -20,   6,  22, -22,
           -17, -20, -12, -27, -30, -25, -14, -36,
           -49,  -1, -27, -39, -46, -44, -33, -51,
           -14, -14, -22, -46, -44, -30, -15, -27,
             1,   7,  -8, -64, -43, -16,   9,   8,
           -15,  36,  12, -54,   8, -28,  24,  14,
        ],
    ]

    AI.PSQT_EARLY_ENDGAME = [
        // Pawn
        [
            0,   0,   0,   0,   0,   0,   0,   0,
            178, 173, 158, 134, 147, 132, 165, 187,
             94, 100,  85,  67,  56,  53,  82,  84,
             32,  24,  13,   5,  -2,   4,  17,  17,
             13,   9,  -3,  -7,  -7,  -8,   3,  -1,
              4,   7,  -6,   1,   0,  -5,  -1,  -8,
             13,   8,   8,  10,  13,   0,   2,  -7,
              0,   0,   0,   0,   0,   0,   0,   0,
        ],

        // Knight
        [
            -58, -38, -13, -28, -31, -27, -63, -99,
            -25,  -8, -25,  -2,  -9, -25, -24, -52,
            -24, -20,  10,   9,  -1,  -9, -19, -41,
            -17,   3,  22,  22,  22,  11,   8, -18,
            -18,  -6,  16,  25,  16,  17,   4, -18,
            -23,  -3,  -1,  15,  10,  -3, -20, -22,
            -42, -20, -10,  -5,  -2, -20, -23, -44,
            -29, -51, -23, -15, -22, -18, -50, -64,
        ],
        // Bishop
        [
            -14, -21, -11,  -8, -7,  -9, -17, -24,
            -8,  -4,   7, -12, -3, -13,  -4, -14,
             2,  -8,   0,  -1, -2,   6,   0,   4,
            -3,   9,  12,   9, 14,  10,   3,   2,
            -6,   3,  13,  19,  7,  10,  -3,  -9,
           -12,  -3,   8,  10, 13,   3,  -7, -15,
           -14, -18,  -7,  -1,  4,  -9, -15, -27,
           -23,  -9, -23,  -5, -9, -16,  -5, -17,
        ],
        // Rook
        [
            13, 10, 18, 15, 12,  12,   8,   5,
            11, 13, 13, 11, -3,   3,   8,   3,
             7,  7,  7,  5,  4,  -3,  -5,  -3,
             4,  3, 13,  1,  2,   1,  -1,   2,
             3,  5,  8,  4, -5,  -6,  -8, -11,
            -4,  0, -5, -1, -7, -12,  -8, -16,
            -6, -6,  0,  2, -9,  -9, -11,  -3,
            -9,  2,  3, -1, -5, -13,   4, -20,
        ],

        // Queen
        [
            -9,  22,  22,  27,  27,  19,  10,  20,
            -17,  20,  32,  41,  58,  25,  30,   0,
            -20,   6,   9,  49,  47,  35,  19,   9,
              3,  22,  24,  45,  57,  40,  57,  36,
            -18,  28,  19,  47,  31,  34,  39,  23,
            -16, -27,  15,   6,   9,  17,  10,   5,
            -22, -23, -30, -16, -16, -23, -36, -32,
            -33, -28, -22, -43,  -5, -32, -20, -41,
        ],

        // King
        [
            -74, -35, -18, -18, -11,  15,   4, -17,
            -12,  17,  14,  17,  17,  38,  23,  11,
             10,  17,  23,  15,  20,  45,  44,  13,
             -8,  22,  24,  27,  26,  33,  26,   3,
            -18,  -4,  21,  24,  27,  23,   9, -11,
            -19,  -3,  11,  21,  23,  16,   7,  -9,
            -27, -11,   4,  13,  14,   4,  -5, -17,
            -53, -34, -21, -11, -28, -14, -24, -43
        ],
    ]

    AI.PSQT_LATE_ENDGAME = [
        // Pawn
        [
            0,   0,   0,   0,   0,   0,   0,   0,
            178, 173, 158, 134, 147, 132, 165, 187,
             94, 100,  85,  67,  56,  53,  82,  84,
             32,  24,  13,   5,  -2,   4,  17,  17,
             13,   9,  -3,  -7,  -7,  -8,   3,  -1,
              4,   7,  -6,   1,   0,  -5,  -1,  -8,
             13,   8,   8,  10,  13,   0,   2,  -7,
              0,   0,   0,   0,   0,   0,   0,   0,
        ],

        // Knight
        [
            -58, -38, -13, -28, -31, -27, -63, -99,
            -25,  -8, -25,  -2,  -9, -25, -24, -52,
            -24, -20,  10,   9,  -1,  -9, -19, -41,
            -17,   3,  22,  22,  22,  11,   8, -18,
            -18,  -6,  16,  25,  16,  17,   4, -18,
            -23,  -3,  -1,  15,  10,  -3, -20, -22,
            -42, -20, -10,  -5,  -2, -20, -23, -44,
            -29, -51, -23, -15, -22, -18, -50, -64,
        ],
        // Bishop
        [
            -14, -21, -11,  -8, -7,  -9, -17, -24,
            -8,  -4,   7, -12, -3, -13,  -4, -14,
             2,  -8,   0,  -1, -2,   6,   0,   4,
            -3,   9,  12,   9, 14,  10,   3,   2,
            -6,   3,  13,  19,  7,  10,  -3,  -9,
           -12,  -3,   8,  10, 13,   3,  -7, -15,
           -14, -18,  -7,  -1,  4,  -9, -15, -27,
           -23,  -9, -23,  -5, -9, -16,  -5, -17,
        ],
        // Rook
        [
            13, 10, 18, 15, 12,  12,   8,   5,
            11, 13, 13, 11, -3,   3,   8,   3,
             7,  7,  7,  5,  4,  -3,  -5,  -3,
             4,  3, 13,  1,  2,   1,  -1,   2,
             3,  5,  8,  4, -5,  -6,  -8, -11,
            -4,  0, -5, -1, -7, -12,  -8, -16,
            -6, -6,  0,  2, -9,  -9, -11,  -3,
            -9,  2,  3, -1, -5, -13,   4, -20,
        ],

        // Queen
        [
            -9,  22,  22,  27,  27,  19,  10,  20,
            -17,  20,  32,  41,  58,  25,  30,   0,
            -20,   6,   9,  49,  47,  35,  19,   9,
              3,  22,  24,  45,  57,  40,  57,  36,
            -18,  28,  19,  47,  31,  34,  39,  23,
            -16, -27,  15,   6,   9,  17,  10,   5,
            -22, -23, -30, -16, -16, -23, -36, -32,
            -33, -28, -22, -43,  -5, -32, -20, -41,
        ],

        // King
        [
            -74, -35, -18, -18, -11,  15,   4, -17,
            -12,  17,  14,  17,  17,  38,  23,  11,
             10,  17,  23,  15,  20,  45,  44,  13,
             -8,  22,  24,  27,  26,  33,  26,   3,
            -18,  -4,  21,  24,  27,  23,   9, -11,
            -19,  -3,  11,  21,  23,  16,   7,  -9,
            -27, -11,   4,  13,  14,   4,  -5, -17,
            -53, -34, -21, -11, -28, -14, -24, -43
        ],
    ]

    // AI.preprocessor(board)

    if (AI.phase === 0) AI.PSQT = [...AI.PSQT_OPENING]
    if (AI.phase === 1) AI.PSQT = [...AI.PSQT_MIDGAME]
    if (AI.phase === 2) AI.PSQT = [...AI.PSQT_EARLY_ENDGAME]
    if (AI.phase === 3) AI.PSQT = [...AI.PSQT_LATE_ENDGAME]
}

AI.PSQT2Sigmoid = function () {
    let upperlimit = VPAWN5
    let lowerlimit = VPAWN

    for (let i = 1; i <= 4; i++) {
        AI.PSQT[i] = AI.PSQT[i].map(psqv => {
            if (psqv > 0) {
                return (upperlimit * 2) / (1 + Math.exp(-psqv / (upperlimit / 2))) - upperlimit | 0
            } else {
                return (lowerlimit * 2) / (1 + Math.exp(-psqv / (lowerlimit / 2))) - lowerlimit | 0
            }
        })
    }
}

AI.softenPSQT = function () {
    for (let p = 1; p <= 4; p++) {
        AI.PSQT[p] = AI.PSQT[p].map((e, i) => {
            if (e) return e

            let N = [...AI.PSQT[p]]
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
    let color = board.turn
    let sign = color === 0 ? 1 : -1


    let P  = board.getPieceColorBitboard(PAWN,  color).dup()
    let N  = board.getPieceColorBitboard(KNIGHT,  color).dup()
    let B  = board.getPieceColorBitboard(BISHOP,  color).dup()
    let R  = board.getPieceColorBitboard(ROOK,  color).dup()
    let Q  = board.getPieceColorBitboard(QUEEN,  color).dup()
    let K  = board.getPieceColorBitboard(KING,  color).dup()
    let PX = board.getPieceColorBitboard(PAWN, !color).dup()
    let NX = board.getPieceColorBitboard(KNIGHT, !color).dup()
    let BX = board.getPieceColorBitboard(BISHOP, !color).dup()
    let RX = board.getPieceColorBitboard(ROOK, !color).dup()
    let QX = board.getPieceColorBitboard(QUEEN, !color).dup()
    let KX = board.getPieceColorBitboard(KING, !color).dup()

    let pawnmask = Chess.Position.makePawnAttackMask(color, P)
    let pawnAttackMap = AI.bin2map(P, color)
    let pawnstructure = AI.bin2map({ high: P.high | pawnmask.high, low: P.low | pawnmask.low }, color)

    let pawnmaskX = Chess.Position.makePawnAttackMask(!color, PX).not(PX)
    let pawnXAttackMap = AI.bin2map(PX, color)

    let kingmap = AI.bin2map(K, color)
    let kingXmap = AI.bin2map(KX, color)

    let kingposition = kingmap.indexOf(1)
    let kingXposition = kingXmap.indexOf(1)

    //Castiga captura y maniobras con peón frontal del rey
    if (
        (color === WHITE && (
            kingposition >= 61 ||
            (kingposition >= 56 && kingposition <= 58)
        )
        ) ||
        (color === BLACK && (
            kingposition <= 2 ||
            (kingposition >= 5 && kingposition <= 7)
        )
        )
    ) {
        //Good
        AI.PSQT_OPENING[0][kingposition - 7 * sign] += VGM
        AI.PSQT_OPENING[0][kingposition - 8 * sign] += AGM
        AI.PSQT_OPENING[0][kingposition - 9 * sign] += VGM

        AI.PSQT_MIDGAME[0][kingposition - 7 * sign] += VGM
        AI.PSQT_MIDGAME[0][kingposition - 8 * sign] += AGM
        AI.PSQT_MIDGAME[0][kingposition - 9 * sign] += VGM

        //Bad
        AI.PSQT_OPENING[0][kingposition - 15 * sign] += twm
        AI.PSQT_OPENING[0][kingposition - 17 * sign] += twm
        AI.PSQT_OPENING[0][kingposition - 23 * sign] += twm
        AI.PSQT_OPENING[0][kingposition - 24 * sign] += twm
        AI.PSQT_OPENING[0][kingposition - 25 * sign] += twm

        AI.PSQT_MIDGAME[0][kingposition - 15 * sign] += abm
        AI.PSQT_MIDGAME[0][kingposition - 17 * sign] += abm
        AI.PSQT_MIDGAME[0][kingposition - 23 * sign] += vbm
        AI.PSQT_MIDGAME[0][kingposition - 24 * sign] += vbm
        AI.PSQT_MIDGAME[0][kingposition - 25 * sign] += vbm
    }

    //Torre
    //Premia enrocar
    if (board.hasCastlingRight(color, true) &&
        (
            (pawnAttackMap[kingposition - 5 * sign] && pawnAttackMap[kingposition - 6 * sign]) ||
            (pawnAttackMap[kingposition - 5 * sign] && pawnAttackMap[kingposition - 7 * sign] && pawnAttackMap[kingposition - 14 * sign])
        )
    ) {
        // white
        AI.PSQT_MIDGAME[3][kingposition + 3] -= VPAWN4
        AI.PSQT_MIDGAME[3][kingposition + 2] -= VPAWN3
        AI.PSQT_MIDGAME[3][kingposition + 1] += VPAWN2
    }

    if (board.hasCastlingRight(color, false) && pawnAttackMap[kingposition - 10 * sign] && pawnAttackMap[kingposition - 11 * sign]) {
        // console.log('rook QUEENSIDE')
        AI.PSQT_MIDGAME[3][kingposition - 4] -= VPAWN4
        AI.PSQT_MIDGAME[3][kingposition - 3] -= VPAWN4
        AI.PSQT_MIDGAME[3][kingposition - 2] -= VPAWN4
        AI.PSQT_MIDGAME[3][kingposition - 1] += VPAWN2
    }

    //Torres en columnas abiertas

    let pawnXfiles = [0, 0, 0, 0, 0, 0, 0, 0]
    let pawnfiles = [0, 0, 0, 0, 0, 0, 0, 0]

    for (let i = 0; i < 64; i++) {
        if (pawnAttackMap[i]) {
            let col = i % 8

            pawnfiles[col]++
        }
    }

    for (let i = 0; i < 64; i++) {
        if (pawnXAttackMap[i]) {
            let col = i % 8

            if (pawnfiles[col]) {
                //Si las columnas están abiertas en mi lado, cuento las del otro lado (antes no)
                pawnXfiles[col]++
            }

        }
    }

    AI.PSQT_OPENING[3] = AI.PSQT_OPENING[3].map((e, i) => {
        let col = i % 8
        return e + (pawnfiles[col] ? abm : 0)
    })

    AI.PSQT_OPENING[3] = AI.PSQT_OPENING[3].map((e, i) => {
        let col = i % 8
        return e + (!pawnfiles[col] ? TBM : 0) + (!pawnXfiles[col] ? VGM : 0)
    })

    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => {
        let col = i % 8
        return e + (pawnfiles[col] ? abm : 0)
    })

    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => {
        let col = i % 8
        return e + (!pawnfiles[col] ? TBM : 0) + (!pawnXfiles[col] ? TBM : 0)
    })

    // Torres delante del rey enemigo ("torre en séptima")
    for (let i = 8; i < 16; i++) AI.PSQT_MIDGAME[3][i + sign * 8 * (kingXposition / 8 | 0)] += TBM

    //Torres conectadas
    let RR = board.makeRookAttackMask(R, P.or(PX))
    let RRmap = AI.bin2map(RR, color)

    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => {
        return e + AGM * RRmap[i]
    })

    //Premia enrocar
    if (board.hasCastlingRight(color, true)) {
        // console.log('KINGSIDE')

        if (
            (pawnAttackMap[kingposition - 5 * sign] && pawnAttackMap[kingposition - 6 * sign]) ||
            (pawnAttackMap[kingposition - 5 * sign] && pawnAttackMap[kingposition - 7 * sign] && pawnAttackMap[kingposition - 14 * sign])
        ) {
            AI.PSQT_MIDGAME[5][kingposition] -= VPAWN2
            AI.PSQT_MIDGAME[5][kingposition + 1] -= VPAWN4
            AI.PSQT_MIDGAME[5][kingposition + 2] += 2*VPAWN
        } else {
            AI.PSQT_MIDGAME[5][kingposition + 2] -= VPAWN
            AI.PSQT_OPENING[5][kingposition + 2] -= VPAWN //Evita enroque al vacío

        }
    }

    if (board.hasCastlingRight(color, false)) {
        // console.log('QUEENSIDE')

        if (pawnAttackMap[kingposition - 10 * sign] && pawnAttackMap[kingposition - 11 * sign]) {
            AI.PSQT_MIDGAME[5][kingposition - 2] += 2*VPAWN2
            AI.PSQT_MIDGAME[5][kingposition - 1] -= VPAWN2
            AI.PSQT_MIDGAME[5][kingposition] -= VPAWN4
        } else {
            AI.PSQT_MIDGAME[5][kingposition - 2] -= VPAWN
            AI.PSQT_OPENING[5][kingposition - 2] -= VPAWN //Evita enroque al vacío
        }
    }

    //***************** ENDGAME ***********************
    //***************** ENDGAME ***********************
    //***************** ENDGAME ***********************
    //***************** ENDGAME ***********************

    //Torres en columnas abiertas

    pawnfiles = [0, 0, 0, 0, 0, 0, 0, 0]

    for (let i = 0; i < 64; i++) {
        if (pawnAttackMap[i]) {
            let col = i % 8

            pawnfiles[col]++
        }
    }

    AI.PSQT_EARLY_ENDGAME[3] = AI.PSQT_EARLY_ENDGAME[3].map((e, i) => {
        let col = i % 8
        return e + (pawnfiles[col] ? vbm : 0)
    })

    AI.PSQT_EARLY_ENDGAME[3] = AI.PSQT_EARLY_ENDGAME[3].map((e, i) => {
        let col = i % 8
        return e + (!pawnfiles[col] ? TBM : 0)
    })

    //Torres delante del rey enemigo ("torre en séptima")
    for (let i = 8; i < 16; i++) AI.PSQT_EARLY_ENDGAME[3][i + sign * 8 * (kingXposition / 8 | 0)] += TBM

    //Rey cerca del rey enemigo
    if (AI.phase === 3 && AI.lastscore >= AI.PIECE_VALUES[OPENING][ROOK]) {
        AI.PSQT_EARLY_ENDGAME[5] = AI.PSQT_EARLY_ENDGAME[5].map((e, i) => {
            return TBM * (8 - AI.manhattanDistance(kingXposition, i))
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
    AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => {
        return e + TBM * RBmap[i]
    })

    //Alfiles apuntando a dama
    AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => {
        return e + TBM * QBmap[i]
    })

    //Alfiles apuntando al rey
    AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => {
        return e + TBM * KBmap[i]
    })

    AI.PSQT_EARLY_ENDGAME[2] = AI.PSQT_EARLY_ENDGAME[2].map((e, i) => {
        return e + TBM * KBmap[i]
    })

    if (kingXposition % 8 < 7) {
        AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => {
            return e + TBM * (KBmap[i + 1] || 0)
        })
    }

    if (kingXposition % 8 < 7) {
        AI.PSQT_EARLY_ENDGAME[2] = AI.PSQT_EARLY_ENDGAME[2].map((e, i) => {
            return e + TBM * (KBmap[i + 1] || 0)
        })
    }

    if (kingXposition % 8 > 0) {
        AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => {
            return e + TBM * (KBmap[i - 1] || 0)
        })
    }

    if (kingXposition % 8 > 0) {
        AI.PSQT_EARLY_ENDGAME[2] = AI.PSQT_EARLY_ENDGAME[2].map((e, i) => {
            return e + TBM * (KBmap[i - 1] || 0)
        })
    }

    //Torres apuntando a dama
    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => {
        return e + TBM * QRmap[i]
    })

    //Torres apuntando al rey
    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => {
        return e + TBM * KRmap[i]
    })

    AI.PSQT_EARLY_ENDGAME[3] = AI.PSQT_EARLY_ENDGAME[3].map((e, i) => {
        return e + TBM * KRmap[i]
    })

    //Dama apuntando al rey
    AI.PSQT_MIDGAME[4] = AI.PSQT_MIDGAME[4].map((e, i) => {
        return e + TBM * KBmap[i]
    })

    //Dama apuntando a alfiles enemigos
    AI.PSQT_MIDGAME[4] = AI.PSQT_MIDGAME[4].map((e, i) => {
        return e + twm * BBmap[i]
    })

    //Dama apuntando a torres enemigas
    AI.PSQT_MIDGAME[4] = AI.PSQT_MIDGAME[4].map((e, i) => {
        return e + twm * RRmapx[i]
    })

    //Rey apuntando a alfiles enemigos
    AI.PSQT_MIDGAME[5] = AI.PSQT_MIDGAME[5].map((e, i) => {
        return e + twm * BBmap[i]
    })

    //Rey apuntando a torres enemigas
    AI.PSQT_MIDGAME[5] = AI.PSQT_MIDGAME[5].map((e, i) => {
        return e + twm * RRmapx[i]
    })

    /************* ABSURD MOVES *****************/

    AI.PSQT_OPENING[1] = AI.PSQT_OPENING[1].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_OPENING[2] = AI.PSQT_OPENING[2].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_OPENING[3] = AI.PSQT_OPENING[3].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_OPENING[4] = AI.PSQT_OPENING[4].map((e, i) => { return e + twm * pawnXAttackMap[i] })

    AI.PSQT_MIDGAME[1] = AI.PSQT_MIDGAME[1].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_MIDGAME[4] = AI.PSQT_MIDGAME[4].map((e, i) => { return e + twm * pawnXAttackMap[i] })

    AI.PSQT_EARLY_ENDGAME[1] = AI.PSQT_EARLY_ENDGAME[1].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_EARLY_ENDGAME[2] = AI.PSQT_EARLY_ENDGAME[2].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_EARLY_ENDGAME[3] = AI.PSQT_EARLY_ENDGAME[3].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_EARLY_ENDGAME[4] = AI.PSQT_EARLY_ENDGAME[4].map((e, i) => { return e + twm * pawnXAttackMap[i] })

    AI.PSQT_LATE_ENDGAME[1] = AI.PSQT_LATE_ENDGAME[1].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_LATE_ENDGAME[2] = AI.PSQT_LATE_ENDGAME[2].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_LATE_ENDGAME[3] = AI.PSQT_LATE_ENDGAME[3].map((e, i) => { return e + twm * pawnXAttackMap[i] })
    AI.PSQT_LATE_ENDGAME[4] = AI.PSQT_LATE_ENDGAME[4].map((e, i) => { return e + twm * pawnXAttackMap[i] })
}

AI.setPhase = function () {
    //OPENING
    AI.phase = 0
    let color = Chess.turn

    // //MIDGAME
    // if (AI.nofpieces <= 28 || (board.movenumber && board.movenumber > 8)) {
    //     AI.phase = 1
    // }

    // let queens = board.getPieceColorBitboard(4, color).popcnt() + board.getPieceColorBitboard(4, !color).popcnt()

    // //EARLY ENDGAME (the king enters)
    // if (AI.nofpieces <= 20 && queens === 0 || Math.abs(AI.lastscore) > AI.PIECE_VALUES[OPENING][ROOK]) {
    //     AI.phase = 2
    // }

    // //LATE ENDGAME
    // if (AI.nofpieces <= 12 || Math.abs(AI.lastscore) >= AI.PIECE_VALUES[OPENING][QUEEN]) {
    //     AI.phase = 3
    // }

    AI.createPSQT()
    AI.randomizePSQT()
    // AI.softenPSQT()
    // AI.PSQT2Sigmoid()
}

AI.getPV = function (board, length) {
    let PV = [null]
    let legal = 0

    let ttEntry
    let ttFound

    // console.log('inicio', board.hashkey)
    
    for (let i = 0; i < length; i++) {
        ttFound = false
        let hashkey = board.hashkey
        ttEntry = AI.ttGet(hashkey)
        
        if (ttEntry) {
            let moves = board.getMoves().filter(move => {
                return move.from === ttEntry.move.from && move.to === ttEntry.move.to
            })
            
            if (moves.length) {
                if (board.makeMove(ttEntry.move)) {
                    legal++
                    
                    PV.push(ttEntry.move)
                    
                    ttFound = true
                }
            }
        } else {
            break
        }
    }
    
    for (let i = PV.length - 1; i > 0; i--) {
        board.unmakeMove(PV[i])
    }
    
    // console.log('fin', board.hashkey)
    return PV
}

AI.MTDF = function (board, f, d, materialOnly, lowerBound, upperBound) {
    let g = f
    
    // let upperBound =  INFINITY
    // let lowerBound = -INFINITY

    //Esta línea permite que el algoritmo funcione como PVS normal
    return AI.PVS(board, lowerBound, upperBound, d, 1, materialOnly)
    // r1bqk2r/ppp1bppp/4p3/3pP3/3P2n1/2PQ1N1P/PP3PP1/RNB2RK1 b kq - 0 9
    // console.log('INICIO DE MTDF')
    let i = 0
    let beta

    while (lowerBound < upperBound && !AI.stop) {
        beta = Math.max(g, lowerBound + 1)

        g = AI.PVS(board, beta - 1, beta, d, 1, materialOnly)

        if (g < beta) {
            upperBound = g
        } else {
            lowerBound = g
        }

        // AI.PV = AI.getPV(board, d)
        // AI.bestmove = [...AI.PV][1]
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

    AI.nofpieces = 32

    let nmoves = 0//board.madeMoves.length
    let changeofphase = false

    AI.setPhase(board)

    if (AI.lastphase !== AI.phase) changeofphase = true

    AI.lastphase = AI.phase

    if (board.movenumber && board.movenumber <= 1 || changeofphase) {
        AI.createTables(true, true, true)
        AI.lastscore = 0
        AI.f = 0
    } else {
        AI.createTables(true, true, false)
        AI.f = AI.lastscore
    }

    if (!AI.f) AI.f = 0

    AI.reduceHistory()
    
    AI.absurd = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
    ]

    return new Promise((resolve, reject) => {
        let color = board.turn

        AI.color = color

        let isWhite = color == 0

        if (isWhite) {
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

        AI.killers = []

        AI.killers[WHITE] = (new Array(128)).fill([null, null])
        AI.killers[BLACK] = (new Array(128)).fill([null, null])

        AI.fh = AI.fhf = 0.001
        
        AI.previousls = AI.lastscore

        // AI.MTDF(board, 0, 1, false, -INFINITY, INFINITY)

        let depth = 1
        let alpha = -INFINITY
        let beta = INFINITY

        if (true) {

            //Iterative Deepening
            for (; depth <= AI.totaldepth; ) {

                if (AI.stop) break

                AI.bestmove = [...AI.PV][1]
                AI.iteration++

                // AI.f = AI.MTDF(board, AI.f, depth, false, -INFINITY, INFINITY)
                AI.f = AI.MTDF(board, AI.f, depth, false, alpha, beta)

                if (AI.f < alpha) {
                    alpha = -INFINITY
                    continue
                }

                if (AI.f > beta) {
                    beta = INFINITY
                    continue
                }

                alpha -= VPAWN2
                beta += VPAWN2

                score = AI.f//(isWhite ? 1 : -1) * AI.f

                AI.PV = AI.getPV(board, depth)

                // if ([...AI.PV][1] && AI.bestmove && [...AI.PV][1].value !== AI.bestmove.value) {
                //     AI.changeinPV = true
                // } else {
                //     AI.changeinPV = false
                // }

                fhfperc = Math.round(AI.fhf * 100 / AI.fh)

                if (!AI.stop) AI.lastscore = score

                if (AI.PV && !AI.stop) console.log(AI.iteration, depth, AI.PV.map(e => { return e && e.getString ? e.getString() : '---' }).join(' '), '|Fhf ' + fhfperc + '%',
                        'Pawn hit ' + (AI.phnodes / AI.pnodes * 100 | 0), score, AI.nodes.toString(), AI.qsnodes.toString(), AI.ttnodes.toString())
            
                depth++
            }
        }

        // console.log(AI.previousls, AI.lastscore)

        if (AI.TESTER) {
            console.info(`_ AI.TESTER ${AI.phase} _____________________________________`)
        } else {
            console.info('________________________________________________________________________________')
        }

        let score100 = AI.lastscore * (100/VPAWN)

        let sigmoid = 1 / (1 + Math.pow(10, -score100 / 400))

        AI.lastmove = AI.bestmove

        //zugzwang prevention
        if (!AI.bestmove) {
            let moves = board.getMoves(false, false)

            AI.bestmove = moves[moves.length * Math.random() | 0]
        }

        AI.searchTime1 = (new Date()).getTime()
        AI.searchTime = AI.searchTime1 - AI.searchTime0
        console.log('Sorting % time: ', (AI.sortingTime / AI.searchTime) * 100 | 0, '%')

        console.log(AI.PV.map(e=>{
            if (e) {
                return [e.from,e.to]
            } else {
                return e
            }
        }), AI.bestmove.from, AI.bestmove.to)

        resolve({
            n: board.movenumber, phase: AI.phase, depth: AI.iteration - 1, from: board.board64[AI.bestmove.from],
            to: board.board64[AI.bestmove.to], fromto0x88: [AI.bestmove.from, AI.bestmove.to],
            score: AI.lastscore | 0, sigmoid: (sigmoid * 100 | 0) / 100, nodes: AI.nodes, qsnodes: AI.qsnodes,
            FHF: fhfperc + '%'
        })
    })
}

AI.createTables(true, true, true)

module.exports = AI
