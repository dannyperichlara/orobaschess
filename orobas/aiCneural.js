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
    random: 4,
    phase: 1,
    htlength: 1 << 24,
    pawntlength: 1e6,
    reduceHistoryFactor: 1, //1, actúa sólo en la actual búsqueda
    mindepth: [1, 1, 1, 1],
    secondspermove: 3,
    lastmove: null,
    f: 0
}

AI.search = (board, options, tf, model)=>{
    AI.tf = tf
    AI.model = model

    AI.searchfull(board, options)

    return new Promise((resolve, reject) => {
        resolve({score: 0})
    })
}

// ÍNDICES
const PAWN = 0
const KNIGHT = 1
const BISHOP = 2
const ROOK = 3
const QUEEN = 4
const KING = 5

const WHITE = 0
const BLACK = 1

const OPENING = 0
const MIDGAME = 1
const EARLY_ENDGAME = 2
const LATE_ENDGAME = 3

const LOWERBOUND = -1
const EXACT = 0
const UPPERBOUND = 1

///// VALOR RELATIVO DE LAS PIEZAS
const VPAWN = 100
const VPAWN2 = VPAWN / 2 | 0
const VPAWN3 = VPAWN / 3 | 0
const VPAWN4 = VPAWN / 4 | 0
const VPAWN5 = VPAWN / 5 | 0
const VPAWN10= VPAWN /10 | 0

AI.PIECE_VALUES = [
    [1, 2.88, 3, 4.8, 9.6, 200].map(e => e * VPAWN),
    [1, 2.88, 3, 4.8, 9.6, 200].map(e => e * VPAWN),
    [1, 2.88, 3, 4.8, 9.6, 200].map(e => e * VPAWN),
    [1, 2.88, 3, 4.8, 9.6, 200].map(e => e * VPAWN),
]

const BISHOP_PAIR = VPAWN2 | 0

AI.PIECE_VALUES_SUM = []

for (let i in [OPENING, MIDGAME, EARLY_ENDGAME, LATE_ENDGAME]) {
    AI.PIECE_VALUES_SUM[i] = []

    for (let piece = PAWN; piece <= KING; piece++) {
        AI.PIECE_VALUES_SUM[i][piece] = []

        for (let j=0; j<=8; j++) {
            AI.PIECE_VALUES_SUM[i][piece][j] = j * AI.PIECE_VALUES[i][piece] | 0
        }
    }
}

// CONSTANTES
const MATE = AI.PIECE_VALUES[OPENING][KING]
const DRAW = 0 //-AI.PIECE_VALUES[OPENING][KNIGHT]
const INFINITY = AI.PIECE_VALUES[OPENING][KING] * 2

AI.EMPTY = new Chess.Bitboard()

//VALORES POSICIONALES
const twm = -3  // El peor movimiento
const vbm = -2  // Muy mal movimiento
const abm = -1  // Un mal movimiento
const anm =  0  // Un movimiento neutral
const AGM =  1  // Un buen movimiento
const VGM =  2  // Muy buen movimiento
const TBM =  4  // El mejor movimiento

//CREA TABLA PARA REDUCCIONES
AI.LMR_TABLE = new Array(AI.totaldepth + 1)

for (let depth = 1; depth < AI.totaldepth + 1; ++depth) {

    AI.LMR_TABLE[depth] = new Array(218)

    for (let moves = 1; moves < 218; ++moves) {
        if (depth >= 2) {
            // AI.LMR_TABLE[depth][moves] = Math.log(depth)*Math.log(moves)/1.95 | 0
            AI.LMR_TABLE[depth][moves] = depth/5 + moves/5 + 1 | 0
        } else {
            AI.LMR_TABLE[depth][moves] = 0
        }
    }

}

// Max mobility score: 20
const MFACTOR = [null, 3.4, 2.1, 1.9, 1, null]
// const MFACTOR = [null, 1, 1, 1, 1, null]

// VALORES PARA VALORAR MOBILIDAD
// El valor se asigna dependiendo del número de movimientos por pieza, desde el caballo hasta la dama
AI.MOBILITY_VALUES = [
    [
        [],
        [0, 1, 2, 3, 4, 5, 6, 7, 8].map(e => e * MFACTOR[1] | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(e => e * MFACTOR[2] | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(e => e * 0 | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27].map(e => e * 0 | 0),
        []
    ],
    [
        [],
        [0, 1, 2, 3, 4, 5, 6, 7, 8].map(e => e * MFACTOR[1] | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(e => e * MFACTOR[2] | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(e => e * 0 | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27].map(e => e * 0 | 0),
        []
    ],
    [
        [],
        [0, 1, 2, 3, 4, 5, 6, 7, 8].map(e => e * MFACTOR[1] | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(e => e * MFACTOR[2] | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(e => e * 0 | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27].map(e => e * 0 | 0),
        []
    ],
    [
        [],
        [0, 1, 2, 3, 4, 5, 6, 7, 8].map(e => e * MFACTOR[1] | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(e => e * MFACTOR[2] | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(e => e * 0 | 0),
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27].map(e => e * 0 | 0),
        []
    ]
]

// SEGURIDAD DEL REY
// Valor se asigna dependiendo del número de piezas que rodea al rey
AI.SAFETY_VALUES = [0, 1, 3, 4, 5, 6, 7, 8, 9]//.map(e => VPAWN5 * e)

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
AI.DOUBLED_VALUES = [0, -1, -2, -3, -4, -5, -6, -7, -8].map(e => e * VPAWN10 | 0)

// ESTRUCTURA DE PEONES
// Se asigna un valor dependiendo del número de peones defendidos por otro peón en cada fase
AI.DEFENDED_PAWN_VALUES = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8].map(e=>10*e),
    [0, 1, 2, 3, 4, 5, 5, 5, 5],
    [0, 1, 2, 3, 4, 5, 5, 5, 5],
    [0, 1, 2, 3, 4, 5, 5, 5, 5],
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

AI.DISTANCE = new Array(64)

for (let i = 0; i<64; i++) {
    let subarray = []

    for (let j=0; j<64; j++) {
        subarray.push(AI.distance(i,j))
    }

    AI.DISTANCE[i] = subarray
}

// CREA TABLAS DE TRASPOSICIÓN / PEONES / HISTORIA
AI.createTables = function (tt, hh, pp) {
    console.log('Creating tables', tt, hh, pp)

    if (hh) {
        delete AI.history
        AI.history = [[], []]
        
        AI.history[WHITE] = [
            Array(64).fill(0),
            Array(64).fill(0),
            Array(64).fill(0),
            Array(64).fill(0),
            Array(64).fill(0),
            Array(64).fill(0),
        ]
        
        AI.history[BLACK] = [
            Array(64).fill(0),
            Array(64).fill(0),
            Array(64).fill(0),
            Array(64).fill(0),
            Array(64).fill(0),
            Array(64).fill(0),
        ]
    }
    
    if (tt) {
        delete AI.hashtable
        AI.hashtable = new Array(this.htlength) // new Map() //positions
    }
    if (pp) {
        delete AI.pawntable
        AI.pawntable = (new Array(this.pawntlength)).fill(null)
    }

}

//ESTABLECE VALORES ALEATORIAS EN LA APERTURA (PARA TESTEOS)
AI.randomizePSQT = function () {
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
AI.getPieces = function (board) {
    let Pw = board.getPieceColorBitboard(PAWN, WHITE)
    let Nw = board.getPieceColorBitboard(KNIGHT, WHITE)
    let Bw = board.getPieceColorBitboard(BISHOP, WHITE)
    let Rw = board.getPieceColorBitboard(ROOK, WHITE)
    let Qw = board.getPieceColorBitboard(QUEEN, WHITE)
    let Kw = board.getPieceColorBitboard(KING, WHITE)

    let Pb = board.getPieceColorBitboard(PAWN, BLACK)
    let Nb = board.getPieceColorBitboard(KNIGHT, BLACK)
    let Bb = board.getPieceColorBitboard(BISHOP, BLACK)
    let Rb = board.getPieceColorBitboard(ROOK, BLACK)
    let Qb = board.getPieceColorBitboard(QUEEN, BLACK)
    let Kb = board.getPieceColorBitboard(KING, BLACK)

    let white = board.getColorBitboard(WHITE)
    let black = board.getColorBitboard(BLACK)

    return { Pw, Nw, Bw, Rw, Qw, Kw, Pb, Nb, Bb, Rb, Qb, Kb, white, black }
}

// FUNCIÓN DE EVALUACIÓN DE LA POSICIÓN
AI.evaluate = function (board, ply, beta, pvNode) {
    let turn = board.getTurnColor()
    let notturn = ~turn & 1
    let pieces = AI.getPieces(board, turn, notturn)
    let score = 0
    let kingSafety = 0
    let sign = turn === 0? 1: -1
    
    // Valor material del tablero
    let material = AI.getMaterial(pieces) | 0

    let positional = AI.getNeuralValue(board, pieces)

    return sign * (material + positional)
}

AI.getNeuralValue = (board)=>{
    console.time()
    let position = Array(14).fill(0).map(x => Array(8).fill(0).map(x => Array(8).fill(0)))

    for (let i = 0; i <= 5; i++) {
        let pieceW = board.getPieceColorBitboard(i, WHITE).dup()
        while (!pieceW.isEmpty()) {
            let index = pieceW.extractLowestBitPosition()
            let rank = ((56^index)/8)|0
            let file = index % 8
            position[i][rank][file] = 1
        }

        let pieceB = board.getPieceColorBitboard(i, BLACK).dup()
        while (!pieceB.isEmpty()) {
            let index = pieceB.extractLowestBitPosition()
            let rank = ((56^index)/8)|0
            let file = index % 8
            position[i + 6][rank][file] = 1
        }
    }

    for (let i = 0; i < 64; i++) {
        let isAttackedW = board.isAttacked(WHITE, i) | 0
        let isAttackedB = board.isAttacked(BLACK, i) | 0
        
        let rank = ((56^i)/8)|0
        let file = i % 8
        position[12][rank][file] = isAttackedW
        position[13][rank][file] = isAttackedB
    }

    let tensor = AI.tf.tensor([position])

    
    let prediction = AI.model.predict(tensor)
    
    let score = (prediction.dataSync()[0]*2000) - 1000 | 0
    console.timeEnd()

    return score
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

AI.mopUpEval = (K, Kx, score)=>{
    let mscore = AI.forceKing2corner(K.dup(), Kx.dup(), score) - AI.forceKing2corner(Kx.dup(), K.dup(), score)
    return mscore
}

// Not well implemented
AI.forceKing2corner = (K, Kx, score)=>{
    return 0
    // if (score > AI.PIECE_VALUES[0][1]) {
    //     let kingposition = K.extractLowestBitPosition()
    //     let kingXposition = Kx.extractLowestBitPosition()
    //     let mscore = 10 * AI.manhattanCenterDistance(kingXposition)
    //                 + 4 * (14 - AI.manhattanDistance(kingposition, kingXposition)) | 0
    //     return mscore
    // } else {
    //     return 0
    // }
}

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
    let maskWhite = Chess.Position.makeKingDefenseMask(WHITE, pieces.Kw).and(pieces.Pw)
    let safetyWhite = AI.SAFETY_VALUES[maskWhite.popcnt()]

    let maskBlack = Chess.Position.makeKingDefenseMask(BLACK, pieces.Kb).and(pieces.Pb)
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
    let hashkey = (Pw.low ^ Pw.high ^ Pb.low ^ Pb.high) >>> 0

    let hashentry = AI.pawntable[hashkey % AI.pawntlength]

    AI.pnodes++

    if (hashentry !== null) {
        AI.phnodes++
        return hashentry
    }

    let doubled = AI.getDoubled(Pw, Pb)
    let defended = 0//AI.getDefended(Pw, Pb) // Afecta rendimiento +/- 3 depths
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

AI.getMaterial = function (pieces, us) {
    let whiteScore = 0
    let blackScore = 0
    let whiteBishops
    let blackBishops

    // Blancas
    whiteBishops = pieces.Bw.popcnt()

    whiteScore = AI.PIECE_VALUES_SUM[AI.phase][PAWN][pieces.Pw.popcnt()] +
    AI.PIECE_VALUES_SUM[AI.phase][KNIGHT][pieces.Nw.popcnt()] +
    AI.PIECE_VALUES_SUM[AI.phase][BISHOP][whiteBishops] +
    AI.PIECE_VALUES_SUM[AI.phase][ROOK][pieces.Rw.popcnt()] +
    AI.PIECE_VALUES_SUM[AI.phase][QUEEN][pieces.Qw.popcnt()]
    
    if (whiteBishops >= 2) whiteScore += BISHOP_PAIR
    
    // Negras
    blackBishops = pieces.Bb.popcnt()
    
    blackScore = AI.PIECE_VALUES_SUM[AI.phase][PAWN][pieces.Pb.popcnt()] +
    AI.PIECE_VALUES_SUM[AI.phase][KNIGHT][pieces.Nb.popcnt()] +
    AI.PIECE_VALUES_SUM[AI.phase][BISHOP][blackBishops] +
    AI.PIECE_VALUES_SUM[AI.phase][ROOK][pieces.Rb.popcnt()] +
    AI.PIECE_VALUES_SUM[AI.phase][QUEEN][pieces.Qb.popcnt()]
    
    if (blackBishops >= 2) blackScore += BISHOP_PAIR

    return whiteScore - blackScore | 0
}

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
        move.capture = false

        // CRITERIO 1: La jugada está en la Tabla de Trasposición
        if (ttEntry && ttEntry.flag !== UPPERBOUND && move.value === ttEntry.move.value) {
            move.tt = true
            move.score = 1e8
            continue
        }

        // CRITERIO 2: La jugada es una promoción de peón
        if (kind & 8) {
            move.promotion = kind
            move.score += 2e7
            continue
        }

        if (kind & 4) {
            move.mvvlva = AI.MVVLVASCORES[piece][move.getCapturedPiece()]
            move.capture = true
            
            if (move.mvvlva > 6000) {
                // CRITERIO 3: La jugada es una captura posiblemente ganadora
                move.score = 1e7 + move.mvvlva
            } else {
                // CRITERIO 5: La jugada es una captura probablemente perdedora
                move.score = 1e5 + move.mvvlva
            }

            continue
        }

        // CRITERIO 4: La jugada es un movimiento Killer
        // (Los killers son movimientos que anteriormente han generado Fail-Highs en el mismo ply)
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

        if (AI.phase <= MIDGAME && move.isCastle()) {
            move.score = 1e9
            continue
        }

        // CRITERIO 6: Movimientos históricos
        // Se da preferencia a movimientos posicionales que han tenido 
        // éxito en otras posiciones.
        let hvalue = AI.history[turn][piece][to]

        if (hvalue) {
            move.hvalue = hvalue
            move.score = 1000 + hvalue
            continue
        } else {
            // move.score = 0
            // continue
            // CRITERIO 7
            // Las jugadas restantes se orden de acuerdo a donde se estima sería
            // su mejor posición absoluta en el tablero
            move.psqtvalue = AI.PSQT[piece][turn === 0 ? 56 ^ to : to]
            move.score = move.psqtvalue
            continue
        }
    }

    // ORDENA LOS MOVIMIENTOS
    // El tiempo de esta función toma hasta unb 10% del total de cada búsqueda.
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
AI.quiescenceSearch = function (board, alpha, beta, depth, ply, pvNode) {
    AI.qsnodes++

    let mateScore = MATE - ply

    if (mateScore < beta) {
        beta = mateScore
        if (alpha >= mateScore) return mateScore
    }

    mateScore = -MATE + ply

    if (mateScore > alpha) {
        alpha = mateScore
        if (beta <= mateScore) return mateScore
    }

    let turn = board.getTurnColor()
    let legal = 0
    let standpat = AI.evaluate(board, ply, beta, pvNode)
    let hashkey = board.hashKey.getHashKey()

    if (standpat >= beta) {
        return standpat
    }

    if (standpat > alpha) alpha = standpat

    // delta pruning
    if (!board.isKingInCheck()) {
        let futilityMargin = AI.PIECE_VALUES[0][4]
    
        if (standpat + futilityMargin <= alpha) {
            return standpat
        }
    }
    
    let ttEntry = AI.ttGet(hashkey)
        
    if (!ttEntry || !ttEntry.move.capture) {
        ttEntry = null
    }
    
    let moves = board.getMoves(true, !board.isKingInCheck()) //+0 ELO
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

    return alpha
}

AI.ttSave = function (hashkey, score, flag, depth, move) {
    if (!move) console.log('no move')
    if (AI.stop || !move) return

    //Siempre guarda la posición en la Tabla de Trasposición.
    //Sería conveniente establecer criterios, como el depth a la hora
    //de guardar. Sin embargo, se ha intentado pero no se aprecian
    //diferencias debido a la merma en rendimiento.

    AI.hashtable[hashkey % AI.htlength] = {
        hashkey,
        score,
        flag,
        depth,
        move
    }
}

AI.ttGet = function (hashkey) {
    AI.ttnodes++
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

// PRINCIPAL VARIATION SEARCH
// El método PVS es Negamax + Ventana-Nula
AI.PVS = function (board, alpha, beta, depth, ply) {
    let pvNode = beta - alpha > 1 // PV-Node
    let cutNode = beta - alpha === 1 // Cut-Node

    AI.nodes++

    if ((new Date()).getTime() > AI.timer + 1000 * AI.secondspermove) {
        if (AI.iteration > AI.mindepth[AI.phase] && !pvNode) {
            AI.stop = true
        }
    }

    let turn = board.getTurnColor()
    let hashkey = board.hashKey.getHashKey()

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
        if (ttEntry.flag === EXACT && depth > 0) {
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

    let staticeval = AI.evaluate(board, ply, beta, pvNode)
    let incheck = board.isKingInCheck()

    //Razoring (idea from Strelka) //+34 ELO
    if (cutNode && !incheck) {
        let value = staticeval + AI.PAWN

        if (value < beta) {
            if (depth === 1) {
                let new_value = AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
                return Math.max(new_value, value)
            }
            value += 2*AI.PAWN

            if (value < beta && depth <= 3) {
                let new_value = AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
                if (new_value < beta)
                return Math.max(new_value, value)
            }
        }
      }

    //Búsqueda QS para evitar efecto horizonte

    if (depth <= 0) {
        return AI.quiescenceSearch(board, alpha, beta, depth, ply, pvNode)
    }

    //IID (si no hay entrada en ttEntry, busca una para mejorar el orden de movimientos)
    if (!ttEntry && depth > 2) {
        AI.PVS(board, alpha, beta, depth - 2, ply) //depth - 2 tested ok + 31 ELO
        ttEntry = AI.ttGet(hashkey)
    }

    let moves = board.getMoves(true, false)

    moves = AI.sortMoves(moves, turn, ply, board, ttEntry)

    let bestmove = moves[0]
    let legal = 0
    let bestscore = -INFINITY
    let score

    //Reverse Futility pruning (Static Null Move Pruning) TESTED OK
    let reverseval = staticeval - AI.PIECE_VALUES[0][1] * depth

    if (!incheck && reverseval > beta) {
        AI.ttSave(hashkey, beta, LOWERBOUND, depth, moves[0])
        return beta
    }

    // futility pruning
    if (!incheck) {
      let futilityMargin = depth * AI.PIECE_VALUES[0][1]

      if (staticeval + futilityMargin <= alpha) {
        AI.ttSave(hashkey, oAlpha, UPPERBOUND, depth, moves[0])
        return oAlpha
      }
    }

    for (let i = 0, len = moves.length; i < len; i++) {
        let move = moves[i]
        let piece = move.getPiece()

        let R = 0
        let E = 0

        //Absurd maneuvers reductions (AMR)
        if (legal >= 1 && AI.phase <= 1 && AI.absurd[turn][piece] >= 2) {
          R++
        }

        // Move count reductions
        if (depth >=3 && !move.capture && legal >= (3 + depth**2) / 2) {
            R++
        }

        if (board.makeMove(move)) {
            legal++

            AI.absurd[turn][piece]++

            //Reducciones
            if (AI.nofpieces <= 4) {
                R = 0
            } else {
                if (!incheck && depth >= 3) {
                    R += AI.LMR_TABLE[depth][legal]
                }
            }

            if (depth <= 2 && incheck) E++

            if (legal === 1) {
                // El primer movimiento se busca con ventana total y sin reducciones
                score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1)
            } else {
                if (AI.stop) return oAlpha

                score = -AI.PVS(board, -alpha - 1, -alpha, depth + E - R - 1, ply + 1)

                if (!AI.stop && score > alpha) {
                    score = -AI.PVS(board, -beta, -alpha, depth + E - 1, ply + 1)
                }
            }

            board.unmakeMove()

            AI.absurd[turn][piece]--

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
                        AI.killers[turn | 0][ply][0].value != move.value
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
            AI.ttSave(hashkey, DRAW + ply, EXACT, depth, bestmove)
            
            return DRAW
        }
        
        // Mate
        AI.ttSave(hashkey, -MATE + ply, EXACT, depth, bestmove)

        return -MATE + ply

    } else {
        // Tablas
        if (board.isDraw()) {
            AI.ttSave(hashkey, DRAW + ply, EXACT, depth, bestmove)
            return DRAW
        }

        if (bestscore > oAlpha) {
            // Mejor movimiento
            if (bestmove) {
                AI.ttSave(hashkey, bestscore + ply, EXACT, depth, bestmove)
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

AI.createPSQT = function (board) {

    AI.PSQT_OPENING = [
        // Pawn
        [
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	1,	1,	1,	1,	0,	0,
            0,	0,	3,	4,	4,	3,	0,	0,
            1,	2,	2,	1,	1,	2,	2,	1,
            2,	3,	2,	1,	1,	2,	3,	2,
            0,	0,	0,	0,	0,	0,	0,	0,
        ],

        // Knight
        [
            2,	3,	4,	4,	4,	4,	3,	2,
            3,	4,	6,	6,	6,	6,	4,	3,
            4,	6,	8,	8,	8,	8,	6,	4,
            4,	6,	8,	8,	8,	8,	6,	4,
            4,	6,	8,	8,	8,	8,	6,	4,
            4,	6,	8,	8,	8,	8,	6,	4,
            3,	4,	6,	6,	6,	6,	4,	3,
            2,	3,	4,	4,	4,	4,	3,	2,

        ],
        // Bishop
        [
            7,	7,	7,	7,	7,	7,	7,	7,
            7,	9,	9,	9,	9,	9,	9,	7,
            7,	9, 11, 11, 11, 11,	9,	7,
            7,	9, 11, 13, 13, 11,	9,	7,
            7,	9, 11, 13, 13, 11,	9,	7,
            7,	9, 11, 11, 11, 11,	9,	7,
            7,	9,	9,	9,	9,	9,	9,	7,
            7,	7,	7,	7,	7,	7,	7,	7,
        ],
        // Rook
        [
            5,	6,	7,	8,	8,	7,	6,	5,
            6,	7,	8,	9,	9,	8,	7,	6,
            5,	6,	7,	8,	8,	7,	6,	5,
            4,	5,	6,	7,	7,	6,	5,	4,
            3,	4,	5,	6,	6,	5,	4,	3,
            2,	3,	4,	5,	5,	4,	3,	2,
            0,	2,	3,	4,	4,	3,	2,	0,
            0,	1,	2,	3,	3,	2,	1,	0,
        ],

        // Queen
        [
            21,	21,	21,	21,	21,	21,	21,	21,
            21,	23,	23,	23,	23,	23,	23,	21,
            21,	23,	25,	25,	25,	25,	23,	21,
            21,	23,	25,	27,	27,	25,	23,	21,
            21,	23,	25,	27,	27,	25,	23,	21,
            21,	23,	25,	25,	25,	25,	23,	21,
            21,	23,	23,	23,	23,	23,	23,	21,
            21,	21,	21,	21,	21,	21,	21,	21,
        ],

        // King
        [
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            5,	6,	0,	0,	0,	0,	6,	5,
            9,	10,	2,	2,	2,	2,	10,	9,
            12,	13,	6,	4,	4,	6,	13,	12,

        ],
    ]

    AI.PSQT_MIDGAME = [
        // Pawn
        [
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	1,	1,	1,	1,	0,	0,
            0,	0,	3,	4,	4,	3,	0,	0,
            1,	2,	2,	1,	1,	2,	2,	1,
            2,	3,	2,	1,	1,	2,	3,	2,
            0,	0,	0,	0,	0,	0,	0,	0,
        ],

        // Knight
        [
            2,	3,	4,	4,	4,	4,	3,	2,
            3,	4,	6,	6,	6,	6,	4,	3,
            3,	4,	6,	6,	6,	6,	4,	3,
            2,	3,	4,	4,	4,	4,	3,	2,
            2,	3,	4,	4,	4,	4,	3,	2,
            1,	2,	2,	2,	2,	2,	2,	1,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
        ],
        // Bishop
        [
            3,	4,	5,	6,	6,	5,	4,	3,
            3,	5,	6,	6,	6,	6,	5,	3,
            3,	5,	6,	6,	6,	6,	5,	3,
            3,	4,	5,	6,	6,	5,	4,	3,
            4,	5,	6,	7,	7,	6,	5,	4,
            4,	4,	5,	5,	5,	5,	4,	4,
            4,	4,	3,	3,	3,	3,	4,	4,
            4,	3,	2,	1,	1,	2,	3,	4,
        ],
        // Rook
        [
            5,	6,	7,	8,	8,	7,	6,	5,
            6,	7,	8,	9,	9,	8,	7,	6,
            5,	6,	7,	8,	8,	7,	6,	5,
            4,	5,	6,	7,	7,	6,	5,	4,
            3,	4,	5,	6,	6,	5,	4,	3,
            2,	3,	4,	5,	5,	4,	3,	2,
            0,	2,	3,	4,	4,	3,	2,	0,
            0,	1,	2,	3,	3,	2,	1,	0,
        ],

        // Queen
        [
            13,	14,	15,	16,	16,	15,	14,	13,
            13,	15,	16,	16,	16,	16,	15,	13,
            13,	15,	16,	16,	16,	16,	15,	13,
            13,	14,	15,	16,	16,	15,	14,	13,
            8,	9,	10,	11,	11,	10,	9,	8,
            8,	8,	9,	9,	9,	9,	8,	8,
            8,	8,	3,	3,	3,	3,	8,	8,
            8,	7,	0,	1,	1,	0,	7,	8,
        ],

        // King
        [
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
            5,	6,	0,	0,	0,	0,	6,	5,
            9,	10,	2,	2,	2,	2,	10,	9,
            12,	13,	6,	4,	4,	6,	13,	12,
        ],
    ]

    AI.PSQT_EARLY_ENDGAME = [
        // Pawn
        [
            9,	9,	9,	9,	9,	9,	9,	9,
            8,	7,	6,	5,	5,	6,	7,	8,
            7,	6,	5,	4,	4,	5,	6,	7,
            6,	5,	4,	3,	3,	4,	5,	6,
            5,	4,	3,	2,	2,	3,	4,	5,
            4,	3,	2,	1,	1,	2,	3,	4,
            3,	2,	1,	0,	0,	1,	2,	3,
            0,	0,	0,	0,	0,	0,	0,	0,
        ],

        // Knight
        [
            2,	3,	4,	4,	4,	4,	3,	2,
            3,	4,	6,	6,	6,	6,	4,	3,
            3,	4,	6,	6,	6,	6,	4,	3,
            2,	3,	4,	4,	4,	4,	3,	2,
            2,	3,	4,	4,	4,	4,	3,	2,
            1,	2,	2,	2,	2,	2,	2,	1,
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
        ],
        // Bishop
        [
            3,	4,	5,	6,	6,	5,	4,	3,
            3,	5,	6,	6,	6,	6,	5,	3,
            3,	5,	6,	6,	6,	6,	5,	3,
            3,	4,	5,	6,	6,	5,	4,	3,
            4,	5,	6,	7,	7,	6,	5,	4,
            4,	4,	5,	5,	5,	5,	4,	4,
            4,	4,	3,	3,	3,	3,	4,	4,
            4,	3,	2,	1,	1,	2,	3,	4,

        ],
        // Rook
        [
            5,	6,	7,	8,	8,	7,	6,	5,
            6,	7,	8,	9,	9,	8,	7,	6,
            5,	6,	7,	8,	8,	7,	6,	5,
            4,	5,	6,	7,	7,	6,	5,	4,
            3,	4,	5,	6,	6,	5,	4,	3,
            2,	3,	4,	5,	5,	4,	3,	2,
            1,	2,	3,	4,	4,	3,	2,	1,
            0,	1,	2,	3,	3,	2,	1,	0,
        ],

        // Queen
        [
            13,	14,	15,	16,	16,	15,	14,	13,
            13,	15,	16,	16,	16,	16,	15,	13,
            13,	15,	16,	16,	16,	16,	15,	13,
            13,	14,	15,	16,	16,	15,	14,	13,
            8,	9,	10,	11,	11,	10,	9,	8,
            8,	8,	9,	9,	9,	9,	8,	8,
            8,	8,	3,	3,	3,	3,	8,	8,
            8,	7,	0,	1,	1,	0,	7,	8,
        ],

        // King
        [
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	1,	2,	4,	4,	2,	1,	0,
            0,	2,	3,	5,	5,	3,	2,	0,
            0,	4,	5,	6,	6,	5,	4,	0,
            0,	4,	5,	6,	6,	5,	4,	0,
            0,	2,	3,	5,	5,	3,	2,	0,
            0,	1,	2,	4,	4,	2,	1,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
        ],
    ]

    AI.PSQT_LATE_ENDGAME = [
        // Pawn
        [
            9,	9,	9,	9,	9,	9,	9,	9,
            8,	7,	6,	5,	5,	6,	7,	8,
            7,	6,	5,	4,	4,	5,	6,	7,
            6,	5,	4,	3,	3,	4,	5,	6,
            5,	4,	3,	2,	2,	3,	4,	5,
            4,	3,	2,	1,	1,	2,	3,	4,
            3,	2,	1,	0,	0,	1,	2,	3,
            0,	0,	0,	0,	0,	0,	0,	0,
        ],

        // Knight
        [
            2,	3,	4,	4,	4,	4,	3,	2,
            3,	4,	6,	6,	6,	6,	4,	3,
            4,	6,	8,	8,	8,	8,	6,	4,
            4,	6,	8,	8,	8,	8,	6,	4,
            4,	6,	8,	8,	8,	8,	6,	4,
            4,	6,	8,	8,	8,	8,	6,	4,
            3,	4,	6,	6,	6,	6,	4,	3,
            2,	3,	4,	4,	4,	4,	3,	2,

        ],
        // Bishop
        [
            7,	7,	7,	7,	7,	7,	7,	7,
            7,	9,	9,	9,	9,	9,	9,	7,
            7,	9, 11, 11, 11, 11,	9,	7,
            7,	9, 11, 13, 13, 11,	9,	7,
            7,	9, 11, 13, 13, 11,	9,	7,
            7,	9, 11, 11, 11, 11,	9,	7,
            7,	9,	9,	9,	9,	9,	9,	7,
            7,	7,	7,	7,	7,	7,	7,	7,
        ],
        // Rook
        [
            0,	0,	4,	4,	4,	4,	0,	0,
            0,	0,	4,	4,	4,	4,	0,	0,
            4,	4,	6,	6,	6,	6,	4,	4,
            4,	4,	6,	6,	6,	6,	4,	4,
            4,	4,	6,	6,	6,	6,	4,	4,
            4,	4,	6,	6,	6,	6,	4,	4,
            0,	0,	4,	4,	4,	4,	0,	0,
            0,	0,	4,	4,	4,	4,	0,	0,
        ],

        // Queen
        [
            21,	21,	21,	21,	21,	21,	21,	21,
            21,	23,	23,	23,	23,	23,	23,	21,
            21,	23,	25,	25,	25,	25,	23,	21,
            21,	23,	25,	27,	27,	25,	23,	21,
            21,	23,	25,	27,	27,	25,	23,	21,
            21,	23,	25,	25,	25,	25,	23,	21,
            21,	23,	23,	23,	23,	23,	23,	21,
            21,	21,	21,	21,	21,	21,	21,	21,
        ],

        // King
        [
            0,	0,	0,	0,	0,	0,	0,	0,
            0,	1,	2,	4,	4,	2,	1,	0,
            0,	2,	3,	5,	5,	3,	2,	0,
            0,	4,	5,	6,	6,	5,	4,	0,
            0,	4,	5,	6,	6,	5,	4,	0,
            0,	2,	3,	5,	5,	3,	2,	0,
            0,	1,	2,	4,	4,	2,	1,	0,
            0,	0,	0,	0,	0,	0,	0,	0,
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
    let color = board.getTurnColor()
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
        return e + (!pawnfiles[col] ? VGM : 0) + (!pawnXfiles[col] ? AGM : 0)
    })

    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => {
        let col = i % 8
        return e + (pawnfiles[col] ? abm : 0)
    })

    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => {
        let col = i % 8
        return e + (!pawnfiles[col] ? AGM : 0) + (!pawnXfiles[col] ? AGM : 0)
    })

    // Torres delante del rey enemigo ("torre en séptima")
    for (let i = 8; i < 16; i++) AI.PSQT_MIDGAME[3][i + sign * 8 * (kingXposition / 8 | 0)] += AGM

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
            AI.PSQT_MIDGAME[5][kingposition + 2] += VPAWN
        } else {
            AI.PSQT_MIDGAME[5][kingposition + 2] -= VPAWN
            AI.PSQT_OPENING[5][kingposition + 2] -= VPAWN //Evita enroque al vacío

        }
    }

    if (board.hasCastlingRight(color, false)) {
        // console.log('QUEENSIDE')

        if (pawnAttackMap[kingposition - 10 * sign] && pawnAttackMap[kingposition - 11 * sign]) {
            AI.PSQT_MIDGAME[5][kingposition - 2] += VPAWN2
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
        return e + (pawnfiles[col] ? abm : 0)
    })

    AI.PSQT_EARLY_ENDGAME[3] = AI.PSQT_EARLY_ENDGAME[3].map((e, i) => {
        let col = i % 8
        return e + (!pawnfiles[col] ? AGM : 0)
    })

    //Torres delante del rey enemigo ("torre en séptima")
    for (let i = 8; i < 16; i++) AI.PSQT_EARLY_ENDGAME[3][i + sign * 8 * (kingXposition / 8 | 0)] += AGM

    if (AI.phase === 3 && AI.lastscore >= AI.PIECE_VALUES[0][3]) {
        //Rey cerca del rey enemigo
        AI.PSQT_EARLY_ENDGAME[5] = AI.PSQT_EARLY_ENDGAME[5].map((e, i) => {
            return AGM * (8 - AI.manhattanDistance(kingXposition, i))
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
        return e + AGM * RBmap[i]
    })

    //Alfiles apuntando a dama
    AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => {
        return e + AGM * QBmap[i]
    })

    //Alfiles apuntando al rey
    AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => {
        return e + AGM * KBmap[i]
    })

    AI.PSQT_EARLY_ENDGAME[2] = AI.PSQT_EARLY_ENDGAME[2].map((e, i) => {
        return e + AGM * KBmap[i]
    })

    if (kingXposition % 8 < 7) {
        AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => {
            return e + AGM * (KBmap[i + 1] || 0)
        })
    }

    if (kingXposition % 8 < 7) {
        AI.PSQT_EARLY_ENDGAME[2] = AI.PSQT_EARLY_ENDGAME[2].map((e, i) => {
            return e + AGM * (KBmap[i + 1] || 0)
        })
    }

    if (kingXposition % 8 > 0) {
        AI.PSQT_MIDGAME[2] = AI.PSQT_MIDGAME[2].map((e, i) => {
            return e + AGM * (KBmap[i - 1] || 0)
        })
    }

    if (kingXposition % 8 > 0) {
        AI.PSQT_EARLY_ENDGAME[2] = AI.PSQT_EARLY_ENDGAME[2].map((e, i) => {
            return e + AGM * (KBmap[i - 1] || 0)
        })
    }

    //Torres apuntando a dama
    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => {
        return e + AGM * QRmap[i]
    })

    //Torres apuntando al rey
    AI.PSQT_MIDGAME[3] = AI.PSQT_MIDGAME[3].map((e, i) => {
        return e + AGM * KRmap[i]
    })

    AI.PSQT_EARLY_ENDGAME[3] = AI.PSQT_EARLY_ENDGAME[3].map((e, i) => {
        return e + AGM * KRmap[i]
    })

    //Dama apuntando al rey
    AI.PSQT_MIDGAME[4] = AI.PSQT_MIDGAME[4].map((e, i) => {
        return e + AGM * KBmap[i]
    })

    //Dama apuntando a alfiles enemigos
    AI.PSQT_MIDGAME[4] = AI.PSQT_MIDGAME[4].map((e, i) => {
        return e + vbm * BBmap[i]
    })

    //Dama apuntando a torres enemigas
    AI.PSQT_MIDGAME[4] = AI.PSQT_MIDGAME[4].map((e, i) => {
        return e + vbm * RRmapx[i]
    })

    //Rey apuntando a alfiles enemigos
    AI.PSQT_MIDGAME[5] = AI.PSQT_MIDGAME[5].map((e, i) => {
        return e + vbm * BBmap[i]
    })

    //Rey apuntando a torres enemigas
    AI.PSQT_MIDGAME[5] = AI.PSQT_MIDGAME[5].map((e, i) => {
        return e + vbm * RRmapx[i]
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

AI.setPhase = function (board) {
    //OPENING
    AI.phase = 0
    let color = board.getTurnColor()

    //MIDGAME
    if (AI.nofpieces <= 28 || (board.movenumber && board.movenumber > 8)) {
        AI.phase = 1
    }

    let queens = board.getPieceColorBitboard(4, color).popcnt() + board.getPieceColorBitboard(4, !color).popcnt()

    //EARLY ENDGAME (the king enters)
    if (AI.nofpieces <= 20 && queens === 0 || Math.abs(AI.lastscore) > AI.PIECE_VALUES[0][3]) {
        AI.phase = 2
    }

    //LATE ENDGAME
    if (AI.nofpieces <= 12 || Math.abs(AI.lastscore) >= AI.PIECE_VALUES[0][4]) {
        AI.phase = 3
    }

    AI.createPSQT(board)
    AI.randomizePSQT()
    // AI.softenPSQT()
    // AI.PSQT2Sigmoid()
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

        if (ttEntry) {
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

                        if (already.length < 3) {
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

    let upperBound =  INFINITY
    let lowerBound = -INFINITY

    //Esta línea permite que el algoritmo funcione como PVS normal
    return AI.PVS(board, lowerBound, upperBound, d, 1)
    // r1bqk2r/ppp1bppp/4p3/3pP3/3P2n1/2PQ1N1P/PP3PP1/RNB2RK1 b kq - 0 9
    // console.log('INICIO DE MTDF')
    let i = 0
    let beta

    while (lowerBound < upperBound && !AI.stop) {
        beta = Math.max(g, lowerBound + 1)

        g = AI.PVS(board, beta - 1, beta, d, 1)

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

AI.searchfull = function (board, options) {
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

    AI.setPhase(board)

    if (AI.lastphase !== AI.phase) changeofphase = true

    AI.lastphase = AI.phase

    if (board.movenumber && board.movenumber <= 1/* || changeofphase*/) {
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
        let color = board.getTurnColor()

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

        AI.killers = [
            (new Array(128)).fill([null, null]), //white
            (new Array(128)).fill([null, null]), //black
        ]

        AI.fh = AI.fhf = 0.001

        //Iterative Deepening
        for (let depth = 1; depth <= AI.totaldepth; depth+=1) {

            if (AI.stop && AI.iteration > AI.mindepth[AI.phase]) break

            AI.bestmove = [...AI.PV][1]
            AI.iteration++

            AI.f = AI.MTDF(board, AI.f, depth)

            score = (isWhite ? 1 : -1) * AI.f

            AI.PV = AI.getPV(board, depth)

            if ([...AI.PV][1] && AI.bestmove && [...AI.PV][1].value !== AI.bestmove.value) {
                AI.changeinPV = true
            } else {
                AI.changeinPV = false
            }

            fhfperc = Math.round(AI.fhf * 100 / AI.fh)

            if (!AI.stop) AI.lastscore = score

            if (AI.PV && !AI.stop) console.log(AI.iteration, depth, AI.PV.map(e => { return e && e.getString ? e.getString() : '---' }).join(' '), '|Fhf ' + fhfperc + '%',
                    'Pawn hit ' + (AI.phnodes / AI.pnodes * 100 | 0), score, AI.nodes.toString(), AI.qsnodes.toString(), AI.ttnodes.toString())
        }

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

        resolve({
            n: board.movenumber, phase: AI.phase, depth: AI.iteration - 1, from: AI.bestmove.getFrom(), to: AI.bestmove.getTo(), movestring: AI.bestmove.getString(),
            score: AI.lastscore | 0, sigmoid: (sigmoid * 100 | 0) / 100, nodes: AI.nodes, qsnodes: AI.qsnodes,
            FHF: fhfperc + '%'
        })
    })
}

AI.createTables(true, true, true)

AI.searchevonly = function (board, options) {
    AI.evaluate(board, 1, 0, 1)

    return new Promise((resolve, reject) => {
        resolve({score: 0})
    })
}

module.exports = AI
