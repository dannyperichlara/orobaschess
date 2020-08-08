"use strict"

let Chess = require('./chess.js')

let AI = function() {

}

//https://pdfs.semanticscholar.org/047f/6ee946c678c874029d8a3483c8a5f0f58666.pdf (Relación entre profundidad y ELO)
let totaldepth = 10
let seconds = 3
let n = 0
let nodes = 0
let qsnodes = 0
let mindepth = 0
let maxevaluation = 0
let random = 4
let fh, fhf = 0
let iteration
let stage = 1

let pvtable = new Array(totaldepth)
let killers = []

let htlength = 1e9

AI = function() {}

AI.PIECE_VALUES_APERTURE = [100, 420, 450, 610, 1250, 200000]
AI.PIECE_VALUES_MIDGAME =  [100, 420, 450, 610, 1250, 200000]
AI.PIECE_VALUES_ENDGAME =  [120, 420, 450, 620, 1275, 200000]
AI.PIECE_VALUES = AI.PIECE_VALUES_APERTURE

console.log(AI.PIECE_VALUES)

let apertures = {
    london: [
        // pawn
        [
            0, 0, 0, 0, 0, 0, 0, 0,
            50, 50, 50, 50, 50, 50, 50, 50,
            30, 30, 30, 30, 30, 30, 30, 30,
            0, 0, 0, 0, 30, 0, 0, 0,
            0, 0, 0, 50, 0, 20, 0, 0,
            0, 20, 40, 0, 40,  0, 0, 20,
            20, 0, 0, 0, 0,   0, 20, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ],
        // knight
        [
            -20, 0, 0, 0, 0, 0, 0, -20,
            -20, 0, 0, 0, 0, 0, 0, -20,
            -20, 0, 0, 0, 0, 0, 0, -20,
            -20, 20, 30, 20, 40, 30, 20, -20,
            -100, 0, 20, 40, 40, 20, 0, -100,
            -100, 0,-20, 0, 20, 30, 0, -100,
            -20,  0, 0, 40, 0, 0, 0, -20,
            -60, -50, 0, 0, 0, 0, -50, -60,
        ],
        // bishop
        [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 20, 20, 30, 0, 0,
            0, 0, 0, 0, 0, 40, 0, 0,
            0, 30, 10, 30, -30, 10, 30, 0,
            10, 20, 0, 0, 0, 0, 30, 10,
            0, 0, -50, 0, 0, -50, 0, 0,
        ],
        // rook
        [
            0, 0, 0, 0, 0, 0, 0, 0,
            40, 40, 40, 40, 40, 40, 40, 40,
            0, 0, 0, 20, 20, 0, 0, 0,
            0, 0, 0, 20, 20, 0, 0, 0,
            0, 0, 0, 20, 20, 0, 0, 0,
            -40, 40, 40, 20, 20, 40, 40, -40,
            -90, 0, 0, 20, 20, 0, 0, -90,
            0, -20, -30, 40, 40, 20, -20, 0,
        ],
        // queen
        [
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -50,
            -50, -20, -20, -20, -20, -20, -40, -20,
            -20, -40, -20, -20, -20, -30, -20, -20,
            0, 0, -30, 20, 20, 0, 0, 0,
            -50, -40, -30, -20, -20, -30, -40, -50,
        ],
        // king
        [
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, 60, 50, -30, -20, -50, 100, -20,
        ]
    ],

    indiandefense: [
        // pawn
        [
            0, 0, 0, 0, 0, 0, 0, 0,
            50, 50, 50, 50, 50, 50, 50, 50,
            30, 30, 30, 30, 30, 30, 30, 30,
            0, 0, 0, 0, 30, 0, 0, 0,
            0, 0, 50, 0, 0, 0, 0, 0,
            0, 0, 0, 40, 0, 0, 50, 0,
            20, 20, 0, 0, 40, 40, 0, 40,
            0, 0, 0, 0, 0, 0, 0, 0,
        ],
        // knight
        [
            -20, 0, 0, 0, 0, 0, 0, -20,
            -20, 0, 0, 0, 0, 0, 0, -20,
            -20, 0, 0, 0, 0, 0, 0, -20,
            -20, 20, 30, 20, 20, 30, 20, -20,
            -20, 0, 20, 40, 40, 20, 0, -20,
            -100, 0, 0, 0, 0, 40, 0, -100,
            -20, 0, 0, 50, 0, 0, 0, -20,
            -60, -50, 0, 0, 0, 0, -50, -60,
        ],
        // bishop
        [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 30, 20, 20, 30, 0, 0,
            0, 0, 20, 20, 0, 20, 0, 0,
            0, 30, 10, -30, -30, 10, 30, 0,
            10, 20, 0, 10, 10, 0, 30, 10,
            0, 0, -50, 0, 0, -50, 0, 0,
        ],
        // rook
        [
            0, 0, 0, 0, 0, 0, 0, 0,
            40, 40, 40, 40, 40, 40, 40, 40,
            0, 0, 0, 20, 20, 0, 0, 0,
            0, 0, 0, 20, 20, 0, 0, 0,
            0, 0, 0, 20, 20, 0, 0, 0,
            -40, 40, 40, 20, 20, 40, 40, -40,
            -90, 0, 0, 20, 20, 0, 0, -90,
            -30, -50, 0, 40, 50, 20, -50, -30,
        ],
        // queen
        [
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -50,
            -50, -20, -20, -20, -20, -20, -40, -20,
            -20, -40, -20, -20, -20, -30, -20, -20,
            0, 0, -30, 20, 20, 0, 0, 0,
            -50, -40, -30, -20, -20, -30, -40, -50,
        ],
        // king
        [
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, -20, -20, -20, -20, -20, -20, -20,
            -20, 100, 50, -30, -20, -50, 100, -20,
        ]
    ]
}

AI.PIECE_SQUARE_TABLES_MIDGAME = [
    // pawn
    [0, 0, 0, 0, 0, 0, 0, 0,
        7, 11, 23, 39, 39, 23, 11, 7,
        -5, 1, 14, 29, 29, 14, 1, -5,
        -14, -8, 6, 17, 17, 6, -8, -14,
        -21, -16, -1, 9, 9, -1, -16, -21,
        -21, -16, -6, 4, 4, -6, -16, -21,
        -21, -16, 0, -1, -1, -6, 0, -21,
        0, 0, 0, 0, 0, 0, 0, 0
    ],
    // knight
    [-59, -39, -29, -29, -29, -29, -39, -59,
        -39, 21, 41, 41, 41, 41, 21, -39,
        -39, 46, 61, 71, 71, 61, 46, -39,
        -39, 41, 51, 51, 51, 51, 41, -39,
        -39, 11, 41, 36, 36, 41, 11, -39,
        -39, 1, 31, 21, 21, 31, 1, -39,
        -54, -39, -9, 11, 11, -9, -39, -54,
        -69, -19, -24, -14, -14, -24, -19, -69
    ],

    // bishop
    [-20, -18, -16, -14, -14, -16, -18, -20,
        -10, 11, 1, 1, 1, 1, 11, -10,
        1, 11, 21, 26, 26, 21, 11, 1,
        1, 21, 21, 26, 26, 21, 21, 1,
        1, 1, 16, 21, 21, 16, 1, 1,
        -25, 6, 16, 11, 11, 16, 6, -25,
        -28, 11, 6, 1, 1, 6, 11, -28,
        -30, -25, -20, -20, -20, -20, -25, -30
    ],
    // rook
    [-8, -6, 2, 7, 7, 2, -6, -8,
        2, 2, 7, 12, 12, 7, 2, 2,
        -8, -6, 6, 10, 10, 6, -6, -8,
        -8, -6, 6, 8, 8, 6, -6, -8,
        -8, -6, 6, 7, 7, 6, -6, -8,
        -8, -6, 6, 7, 7, 6, -6, -8,
        -8, -6, 2, 7, 7, 2, -6, -8,
        -8, -6, 2, 7, 7, 2, -6, -8
    ],
    // queen
    [4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 4, 4, 4, 4, 4, 4,
        -6, -6, -1, 4, 4, -1, -6, -6,
        -16, -11, -1, 4, 4, -1, -11, -16,
        -26, -16, -6, 4, 4, -6, -16, -26
    ],
    // king
    [-55, -55, -60, -70, -70, -60, -55, -55,
        -55, -55, -60, -70, -70, -60, -55, -55,
        -55, -55, -60, -70, -70, -60, -55, -55,
        -55, -55, -60, -70, -70, -60, -55, -55,
        -50, -50, -55, -60, -60, -55, -50, -50,
        -40, -40, -45, -50, -50, -45, -40, -40,
        -30, -30, -30, -35, -35, -30, -30, -30,
        -20, 50, -20, -10, -10, -20, 50, -20
    ]
]

AI.PIECE_SQUARE_TABLES_ENDGAME = [
    /*// pawn
    [0, 0, 0, 0, 0, 0, 0, 0, 
    45, 30, 16, 5, 5, 16, 30, 45, 
    30, 14, 1, -10, -10, 1, 14, 30, 
    18, 2, -8, -15, -15, -8, 2, 18, 
    10, -5, -15, -20, -20, -15, -5, 10, 
    5, -10, -20, -25, -25, -20, -10, 5, 
    5, -10, -20, -25, -25, -20, -10, 5, 
    0, 0, 0, 0, 0, 0, 0, 0], */
    // pawn
    [
        0, 0, 0, 0, 0, 0, 0, 0,
        50, 50, 50, 50, 50, 50, 50, 50,
        40, 40, 40, 40, 40, 40, 40, 40,
        30, 30, 30, 30, 30, 30, 30, 30,
        20, 20, 20, 20, 20, 20, 20, 20,
        10, 10, 10, 10, 10, 10, 10, 10,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0
    ],
    // knight
    [-63, -53, -43, -43, -43, -43, -53, -63,
        -53, -43, 38, 48, 48, 38, -43, -53,
        -43, 28, 78, 73, 73, 78, 28, -43,
        -43, 38, 73, 78, 78, 73, 38, -43,
        -43, 38, 58, 68, 68, 58, 38, -43,
        -43, 18, 48, 38, 38, 48, 18, -43,
        -53, -43, 18, 28, 28, 18, -43, -53,
        -63, -53, -43, -43, -43, -43, -53, -63
    ],
    // bishop
    [-38, -18, -8, 2, 2, -8, -18, -38,
        -18, -8, 0, 12, 12, 0, -8, -18,
        -8, 2, 20, 22, 22, 20, 2, -8,
        2, 12, 17, 22, 22, 17, 12, 2,
        2, 12, 16, 20, 20, 16, 12, 2,
        -8, 2, 10, 12, 12, 10, 2, -8,
        -18, -8, 2, 7, 7, 2, -8, -18,
        -38, -18, -8, 2, 2, -8, -18, -38
    ],
    // rook
    [0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0
    ],
    // queen
    [-26, -6, -1, 4, 4, -1, -6, -26,
        -16, 4, 19, 29, 29, 19, 4, -16,
        -6, 9, 24, 34, 34, 24, 9, -6,
        -6, 9, 24, 34, 34, 24, 9, -6,
        -6, 9, 24, 34, 34, 24, 9, -6,
        -16, -1, 14, 24, 24, 14, -1, -16,
        -31, -26, -16, -6, -6, -16, -26, -31,
        -46, -41, -31, -26, -26, -31, -41, -46
    ],
    // king
    [-10, 10, 15, 20, 20, 15, 10, -10,
        0, 20, 35, 45, 45, 35, 20, 0,
        10, 25, 40, 50, 50, 40, 25, 10,
        10, 25, 40, 50, 50, 40, 25, 10,
        10, 25, 40, 50, 50, 40, 25, 10,
        0, 15, 30, 40, 40, 30, 15, 0,
        -15, -10, 0, 10, 10, 0, -10, -15,
        -30, -25, -15, -10, -10, -15, -25, -30
    ]

]

AI.BISHOP_PAIR_VALUE = AI.PIECE_VALUES[Chess.Piece.PAWN] / 2

AI.bitCount = function(n) {
    n = n - ((n >> 1) & 0x55555555)
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

AI.kingSafety = function(chessPosition, color) {
    //Rey seguro (Concepto: ataca sus propios peones)
    let pawns = chessPosition.getPieceColorBitboard(0, color)
    let king = chessPosition.getPieceColorBitboard(5, color)
    let kingmask = Chess.Position.makeKingAttackMask(color, king)
    let kingsafety = AI.bitCount(kingmask.low & pawns.low) + AI.bitCount(kingmask.high & pawns.high) + AI.bitCount(kingmask.high & pawns.low) + AI.bitCount(kingmask.low & pawns.high)
    return kingsafety * 50
}

/*AI.isCastled = function(chessPosition, color) {
    if (chessPosition.castlingRights == 0) return 0

    if (color === 0 && chessPosition.castlingRights === 10 && chessPosition.getColorBitboard(0).popcnt() > 12) {
        return 50
    }
    if (color === 1 && chessPosition.castlingRights === 5 && chessPosition.getColorBitboard(1).popcnt() > 12) {
        return 50
    }

    return 0
}
*/
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



    return undeveloped * 10
}

AI.pawnstructure = function(chessPosition, color) {
    let score = 0

    let local = color == 0 ? 'low' : 'high'
    let foreign = color == 0 ? 'high' : 'low'
    let pawns = chessPosition.getPieceColorBitboard(0, color)
    let pawnsmask = Chess.Position.makePawnAttackMask(color, pawns)
    let structure = AI.bitCount(pawnsmask.low & pawns.low) + AI.bitCount(pawnsmask.high & pawns.high) + AI.bitCount(pawnsmask.low & pawns.high) + AI.bitCount(pawnsmask.high & pawns.low)

    score += structure * 20

    //Peones doblados
    let doubledpawns = (AI.bitCount(2155905152 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 1 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 1 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 2 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 2 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 3 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 3 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 4 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 4 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 5 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 5 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 6 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 6 & chessPosition.getPieceColorBitboard(0, color).high) > 1) +
        (AI.bitCount(2155905152 >>> 7 & chessPosition.getPieceColorBitboard(0, color).low) > 1) + (AI.bitCount(2155905152 >>> 7 & chessPosition.getPieceColorBitboard(0, color).high) > 1)
    score -= doubledpawns * 40

    return score
}

AI.rookInOpenFiles = function(chessPosition, color) {
        if (stage != 2) return 0
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

        return freerook * 100
    },

    AI.invasion = function(chessPosition, color) {
        let white = color == 0
        let score = 0
        let local = white ? 'low' : 'high'
        let foreign = white ? 'high' : 'low'

        //Peones avanzados
        score += (AI.bitCount(4294967295 & chessPosition.getPieceColorBitboard(0, color)[foreign])) * 100


        //Atacantes en flanco enemigo
        let queenside = 252645135
        let kingside = 4042322160
        let side = null

        if (AI.bitCount(kingside & chessPosition.getPieceColorBitboard(5, !color).low) + AI.bitCount(kingside & chessPosition.getPieceColorBitboard(5, !color).high)) { //kingside
            side = kingside
        } else {
            side = queenside
        }

        let k = AI.bitCount(side & chessPosition.getPieceColorBitboard(1, color).low) + AI.bitCount(side & chessPosition.getPieceColorBitboard(1, color).high)
        let b = AI.bitCount(side & chessPosition.getPieceColorBitboard(2, color).low) + AI.bitCount(side & chessPosition.getPieceColorBitboard(2, color).high)
        let r = AI.bitCount(side & chessPosition.getPieceColorBitboard(3, color).low) + AI.bitCount(side & chessPosition.getPieceColorBitboard(3, color).high)
        let enemies = k + b + r //+q

        score += enemies * 10

        return score
    }



AI.getMaterialValue = function(chessPosition, color) {
    let value = 0

    for (let piece = 0, len = AI.PIECE_VALUES.length; piece < len; piece++) {
        value += chessPosition.getPieceColorBitboard(piece, color).popcnt() * AI.PIECE_VALUES[piece]
    }

    if (chessPosition.getPieceColorBitboard(Chess.Piece.BISHOP, color).popcnt() > 1) value += AI.BISHOP_PAIR_VALUE

    return value + Math.random() * random - random/2 
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

AI.makePawnPositionalMask = function(color, pawns, empty) {
    let white = (color === 0)
    let positional = pawns.dup().shiftLeft(white ? 8 : -8).and(empty)
    let doublePush = pawns.dup().and(Chess.Bitboard.RANKS[white ? 1 : 6]).shiftLeft(white ? 16 : -16).and(empty).and(empty.dup().shiftLeft(white ? 8 : -8))
    let mask = positional.or(doublePush)
    return mask
}

AI.mobility = function(chessPosition, color) {
        let us = chessPosition.getColorBitboard(color)
        let empty = chessPosition.getEmptyBitboard()
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

        mobility = Math.floor(20 / (1 + Math.exp(-mobility / 5)) - 10)


        return mobility
    }

    AI.scoreMove = function(move, chessPosition) {
        let score = 0

        if (move.pv) score+= 100

        if (move.isCapture()) {
                score+= 10 * score + (1 + move.getCapturedPiece()) / (1 + (move.getPiece() < 5? move.getPiece() : 0))
        }

        if (move.killer) score = 10 * score + 10

        score = 10 * score + (move.getPiece() < 4? move.getPiece() : 0)
        // score = 10 * score + move.getPiece()
        score = 10 * score + move.getKind()
        score = 10 * score + move.getFrom()
        score = 10 * score + move.getTo()
        return score
    }

AI.sortMoves = function(moves, killers, pv, chessPosition) {

    if (pv && chessPosition) {
        for (let i = 0, len = moves.length; i < len; i++) {
            if (moves[i].value == pv.value) moves[i].pv = true
        }
    }

    if (killers) {
        for (let i = 0, len = moves.length; i < len; i++) {
            if (killers.find(e => {
                    return e.value == moves[i].value
                })) {

                moves[i].killer = true
            }
        }
    }

    moves.sort((a, b) => {
        return AI.scoreMove(b, chessPosition) - AI.scoreMove(a, chessPosition)
    })

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

AI.quiescenceSearch = function(chessPosition, alpha, beta, depth) {
    if (chessPosition.isDraw()) return 0 // always assume the draw will be claimed

    let alphaOrig = alpha
    let ttEntry
    //(* Transposition Table Lookup; node is the lookup key for ttEntry *)
    ttEntry = AI.transpositionTableLookup(chessPosition.hashKey.getHashKey())

    if (ttEntry && chessPosition.hashKey.getHashKey() == ttEntry.Zobrist && ttEntry.depth >= depth) {
        if (ttEntry.flag == 0 ) {
            return ttEntry.alpha
        } else if (ttEntry.flag == -1 ) {
            alpha = Math.max(alpha, ttEntry.alpha)
        } else if (ttEntry.flag == 1 ) {
            beta = Math.min(beta, ttEntry.alpha)
        }

        if (alpha >= beta) return ttEntry.alpha
    }


    let standPatValue = AI.evaluate(chessPosition)

    if (standPatValue >= beta) return beta

    if( alpha < standPatValue ) alpha = standPatValue;

    let moves = AI.sortMoves(chessPosition.getMoves(false, !chessPosition.isKingInCheck()))

    let value = -Infinity

    for (let i = 0, len = moves.length; i < len; i++) {

        if (chessPosition.makeMove(moves[i])) {
            value = Math.max(value, -AI.quiescenceSearch(chessPosition, -beta, -alpha, depth - 1))
            chessPosition.unmakeMove()

            if (value >= beta) { return value }

            if (value > alpha) {
                alpha = value
            }
        }
    }

    /*(* Transposition Table Store; node is the lookup key for ttEntry *)*/
    ttEntry = {
        alpha,
        depth
    }

    if (alpha === Infinity) console.log('Infinity')

    if (alpha <= alphaOrig) {
        ttEntry.flag = 1
    } else if (alpha >= beta){
        ttEntry.flag = -1
    } else {
        ttEntry.flag = 0
    }

    AI.transpositionTableStore(chessPosition.hashKey.getHashKey(), ttEntry)
    
    qsnodes++

    return alpha
}

AI.evaluate = function(chessPosition) {
    let evaluation = 0
    let color = chessPosition.getTurnColor()   

    if (stage == 1) {
        evaluation += AI.invasion(chessPosition, 0) - AI.invasion(chessPosition, 1)
        evaluation += AI.mobility(chessPosition, 0) - AI.mobility(chessPosition, 1)
    } else if (stage == 2) {
        evaluation += -AI.undevelopedPieces(chessPosition, 0) + AI.undevelopedPieces(chessPosition, 1) //Se castiga falta de desarrollo en mediojuego
        evaluation += AI.invasion(chessPosition, 0) - AI.invasion(chessPosition, 1)
        evaluation += AI.rookInOpenFiles(chessPosition, 0) - AI.rookInOpenFiles(chessPosition, 1)
        evaluation += AI.kingSafety(chessPosition, 0) - AI.kingSafety(chessPosition, 1)
    }

    //Posicional
    evaluation += AI.pawnstructure(chessPosition, 0) - AI.pawnstructure(chessPosition, 1)

    //Material
    evaluation += AI.getPieceSquareValue(chessPosition, 0) - AI.getPieceSquareValue(chessPosition,  1)
    evaluation += AI.getMaterialValue(chessPosition, 0) - AI.getMaterialValue(chessPosition, 1)

    return evaluation * (color == 0? 1: -1)
}

AI.hashtable = new Array(htlength)

AI.transpositionTableStore = function (hashKey, ttEntry) {
    ttEntry.Zobrist = hashKey
    AI.hashtable[hashKey % htlength] = ttEntry
}

AI.transpositionTableLookup = function(hashKey) {
    return AI.hashtable[hashKey % htlength]
}

AI.negascout = function(chessPosition, depth, alpha, beta, ply) {
    let alphaOrig = alpha
    let turn = chessPosition.getTurnColor()
    let moves = chessPosition.getMoves(true, false)
    let bestMove = moves[0]

    //(* Transposition Table Lookup; node is the lookup key for ttEntry *)
    let ttEntry = AI.transpositionTableLookup(chessPosition.hashKey.getHashKey())

    if (ttEntry && chessPosition.hashKey.getHashKey() == ttEntry.Zobrist && ttEntry.depth >= depth) {
        if (ttEntry.flag == 0 ) {
            if (ply === 1) AI.bestMove = ttEntry.move
            return ttEntry.alpha
        } else if (ttEntry.flag == -1 ) {
            alpha = Math.max(alpha, ttEntry.alpha)
        } else if (ttEntry.flag == 1 ) {
            beta = Math.min(beta, ttEntry.alpha)
        }

        if (alpha >= beta) {
            if (ply === 1) AI.bestMove = ttEntry.move
            return ttEntry.alpha
        }
    }

    if (depth < 1) return AI.quiescenceSearch(chessPosition, alpha, beta, depth)


    // if (ply === 1) {
    // //     moves = AI.sortMovesByScore(moves, chessPosition)
    // } else {
        moves = AI.sortMoves(moves, killers[ply], AI.PV[iteration-1][ply], chessPosition)
    // }

    let legal = 0
    let a //= alpha
    let b = beta

    let reduction = 0
    let extension = 0

    for (let i = 0, len = moves.length; i < len; i++) {

        if (chessPosition.makeMove(moves[i])) {
            legal++

            if (moves[i].getKind() < 4 && !chessPosition.isKingInCheck()) {

                if (i >= 10) {
                    reduction = depth / 2
                } else if (i > 4) {
                    reduction=depth/3
                } else {
                    reduction=1
                }
            }                
            

            a = -AI.negascout(chessPosition, depth - 1 - reduction, -b, -alpha, ply + 1)
            chessPosition.unmakeMove()

            if (a > alpha) {
                alpha = a
                bestMove = moves[i]
                AI.PV[iteration][ply]=bestMove
                AI.bestMove = bestMove
            }

            if (alpha >= beta) {

                if (moves[i].getKind() < 4) {
                    killers[ply].push(moves[i])
                    if (killers[ply].length > 2) killers[ply] = killers[ply].slice(-2)
                }

                if (legal === 1) fhf++
                fh++

                return alpha
            }

            if (alpha >= b) {
                chessPosition.makeMove(moves[i])
                alpha = -AI.negascout(chessPosition, depth - 1, -beta, -alpha, ply + 1)
                chessPosition.unmakeMove()

                if (alpha >= beta) {

                    if (moves[i].getKind() < 4) {
                        killers[ply].push(moves[i])
                        if (killers[ply].length > 2) killers[ply] = killers[ply].slice(-2)
                    }

                    if (legal == 1) fhf++
                    fh++
                    return alpha
                }
            }

            b = alpha + 1
        }
    }
    /*(* Transposition Table Store; node is the lookup key for ttEntry *)*/
    ttEntry = {
        alpha,
        depth,
        move: bestMove
    }

    if (alpha <= alphaOrig) {
        ttEntry.flag = 1
    } else if (alpha >= beta){
        ttEntry.flag = -1
    } else {
        ttEntry.flag = 0
    }

    AI.transpositionTableStore(chessPosition.hashKey.getHashKey(), ttEntry)

    if (ply == 1) AI.bestMove = bestMove

    if (legal === 0) {
        // stalemate, draw
        if (!chessPosition.isKingInCheck()) return 0

        let mate = AI.PIECE_VALUES[Chess.Piece.KING] * (turn === 0? -1 : 1)

        // console.log(ply, bestMove, mate, alpha, 'mate',chessPosition.getTurnColor())

        return mate
    }
    
    // always assume the draw will be claimed
    if (chessPosition.isDraw()) return 0


    nodes++

    return alpha        

}

AI.search = function(chessPosition) {
    return new Promise((resolve, reject) => {
        let turn = chessPosition.getTurnColor()
        stage = 1 //Apertura

        AI.nofpieces = chessPosition.getColorBitboard(0).popcnt() + chessPosition.getColorBitboard(1).popcnt()


        nodes = 0
        qsnodes = 0

        AI.PIECE_SQUARE_TABLES = apertures.london
        // AI.PIECE_SQUARE_TABLES = AI.PIECE_SQUARE_TABLES_MIDGAME

        if (AI.nofpieces <= 28 || chessPosition.madeMoves.length >= 16) {
            AI.PIECE_SQUARE_TABLES = AI.PIECE_SQUARE_TABLES_MIDGAME
            stage = 2 //'midgame'
        }
        if (AI.nofpieces <= 18) {
            AI.PIECE_SQUARE_TABLES = AI.PIECE_SQUARE_TABLES_ENDGAME
            stage = 3 //endgame
        }

        AI.PIECE_VALUES = AI.PIECE_VALUES_APERTURE

        if (AI.nofpieces > 18 && AI.nofpieces <= 28) {
            AI.PIECE_VALUES = AI.PIECE_VALUES_MIDGAME
        }

        if (AI.nofpieces <= 18) {
            AI.PIECE_VALUES = AI.PIECE_VALUES_ENDGAME
        }

        let moves = AI.sortMoves(chessPosition.getMoves(true, false))

        let value
        let scores = []
        let bestMove = moves[0]

        let howmanybests = 0

        AI.start = new Date().getTime()

        let status = 0

        //Posibles checkmates
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

        console.time()

        pvtable = []


        n++

        killers = new Array(20).fill([])
        iteration = 1
        
        if (status == 0) {
            
            AI.PV=new Array(20).fill([])

            for (let depth = 1; depth <= totaldepth; depth ++) {

                fh = fhf = 0
                
                let score = AI.negascout(chessPosition, depth, -Infinity, Infinity, 1)

                console.log(AI.PV[iteration].map(e=>{return e.getString()}).join(' '))
                console.info(n, turn == 0 ? 'Blancas' : 'Negras' , depth, score, `Nodes: ${nodes}`, `QS Nodes: ${qsnodes}`, Math.round(fhf*100/fh) + '%')
                
                iteration++
            }

            
        }



        // console.info(killers)
        console.timeEnd()


        resolve(AI.bestMove)
    })
}

module.exports = AI