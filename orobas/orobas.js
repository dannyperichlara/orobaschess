var seedrandom = require('seedrandom')
const { totaldepth } = require('./aiC')

let rnd = new seedrandom('orobas1234', {global: true})

const P =   1
const N =   2
const B =   3
const R =   4
const Q =   5
const K =   6
const p =   7
const n =   8
const b =   9
const r =  10
const q =  11
const k =  12

const WHITE =  1
const BLACK =  2


module.exports = orobas = {
    pieces: new Map(),
    pieceList: {
        pieces: new Map(),
        [k]: 0,
        [q]: 0,
        [r]: 0,
        [b]: 0,
        [n]: 0,
        [p]: 0,
        [P]: 0,
        [N]: 0,
        [B]: 0,
        [R]: 0,
        [Q]: 0,
        [K]: 0,
    },
    coords: [
        "a8","b8","c8","d8","e8","f8","g8","h8",    0,0,0,0,0,0,0,0,
        "a7","b7","c7","d7","e7","f7","g7","h7",    0,0,0,0,0,0,0,0,
        "a6","b6","c6","d6","e6","f6","g6","h6",    0,0,0,0,0,0,0,0,
        "a5","b5","c5","d5","e5","f5","g5","h5",    0,0,0,0,0,0,0,0,
        "a4","b4","c4","d4","e4","f4","g4","h4",    0,0,0,0,0,0,0,0,
        "a3","b3","c3","d3","e3","f3","g3","h3",    0,0,0,0,0,0,0,0,
        "a2","b2","c2","d2","e2","f2","g2","h2",    0,0,0,0,0,0,0,0,
        "a1","b1","c1","d1","e1","f1","g1","h1",    0,0,0,0,0,0,0,0,
    ],
    board: new Uint8Array(128),
    
    boardbits: [
        31,	30,	29,	28,	27,	26,	25,	24,	null,	null,	null,	null,	null,	null,	null,	null,
        23,	22,	21,	20,	19,	18,	17,	16,	null,	null,	null,	null,	null,	null,	null,	null,
        15,	14,	13,	12,	11,	10,	9,	8,	null,	null,	null,	null,	null,	null,	null,	null,
        7,	6,	5,	4,	3,	2,	1,	0,	null,	null,	null,	null,	null,	null,	null,	null,
        31,	30,	29,	28,	27,	26,	25,	24,	null,	null,	null,	null,	null,	null,	null,	null,
        23,	22,	21,	20,	19,	18,	17,	16,	null,	null,	null,	null,	null,	null,	null,	null,
        15,	14,	13,	12,	11,	10,	9,	8,	null,	null,	null,	null,	null,	null,	null,	null,
        7,	6,	5,	4,	3,	2,	1,	0,	null,	null,	null,	null,	null,	null,	null,	null,
    ],

    board64: [
        56,	57,	58,	59,	60,	61,	62,	63,	null,	null,	null,	null,	null,	null,	null,	null,
        48,	49,	50,	51,	52,	53,	54,	55,	null,	null,	null,	null,	null,	null,	null,	null,
        40,	41,	42,	43,	44,	45,	46,	47,	null,	null,	null,	null,	null,	null,	null,	null,
        32,	33,	34,	35,	36,	37,	38,	39,	null,	null,	null,	null,	null,	null,	null,	null,
        24,	25,	26,	27,	28,	29,	30,	31,	null,	null,	null,	null,	null,	null,	null,	null,
        16,	17,	18,	19,	20,	21,	22,	23,	null,	null,	null,	null,	null,	null,	null,	null,
        8,	9,	10,	11,	12,	13,	14,	15,	null,	null,	null,	null,	null,	null,	null,	null,
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
    ],

    board0x88: [
        112,113,114,115,116,117,118,119,
        96,	97,	98,	99,	100,101,102,103,
        80,	81,	82,	83,	84,	85,	86,	87,
        64,	65,	66,	67,	68,	69,	70,	71,
        48,	49,	50,	51,	52,	53,	54,	55,
        32,	33,	34,	35,	36,	37,	38,	39,
        16,	17,	18,	19,	20,	21,	22,	23,
        0,	1,	2,	3,	4,	5,	6,	7,
    ],

    ranksW: [
        7,	7,	7,	7,	7,	7,	7,	7,	null,	null,	null,	null,	null,	null,	null,	null,
        6,	6,	6,	6,	6,	6,	6,	6,	null,	null,	null,	null,	null,	null,	null,	null,
        5,	5,	5,	5,	5,	5,	5,	5,	null,	null,	null,	null,	null,	null,	null,	null,
        4,	4,	4,	4,	4,	4,	4,	4,	null,	null,	null,	null,	null,	null,	null,	null,
        3,	3,	3,	3,	3,	3,	3,	3,	null,	null,	null,	null,	null,	null,	null,	null,
        2,	2,	2,	2,	2,	2,	2,	2,	null,	null,	null,	null,	null,	null,	null,	null,
        1,	1,	1,	1,	1,	1,	1,	1,	null,	null,	null,	null,	null,	null,	null,	null,
        0,	0,	0,	0,	0,	0,	0,	0,	null,	null,	null,	null,	null,	null,	null,	null,
    ],

    ranksB: [
        0,	0,	0,	0,	0,	0,	0,	0,	null,	null,	null,	null,	null,	null,	null,	null,
        1,	1,	1,	1,	1,	1,	1,	1,	null,	null,	null,	null,	null,	null,	null,	null,
        2,	2,	2,	2,	2,	2,	2,	2,	null,	null,	null,	null,	null,	null,	null,	null,
        3,	3,	3,	3,	3,	3,	3,	3,	null,	null,	null,	null,	null,	null,	null,	null,
        4,	4,	4,	4,	4,	4,	4,	4,	null,	null,	null,	null,	null,	null,	null,	null,
        5,	5,	5,	5,	5,	5,	5,	5,	null,	null,	null,	null,	null,	null,	null,	null,
        6,	6,	6,	6,	6,	6,	6,	6,	null,	null,	null,	null,	null,	null,	null,	null,
        7,	7,	7,	7,	7,	7,	7,	7,	null,	null,	null,	null,	null,	null,	null,	null,
    ],

    columns: [
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
    ],

    diagonals1: [
        0,	1,	2,	3,	4,	5,	6,	7,	null,	null,	null,	null,	null,	null,	null,	null,
        1,	2,	3,	4,	5,	6,	7,	8,	null,	null,	null,	null,	null,	null,	null,	null,
        2,	3,	4,	5,	6,	7,	8,	9,	null,	null,	null,	null,	null,	null,	null,	null,
        3,	4,	5,	6,	7,	8,	9,	10,	null,	null,	null,	null,	null,	null,	null,	null,
        4,	5,	6,	7,	8,	9,	10,	11,	null,	null,	null,	null,	null,	null,	null,	null,
        5,	6,	7,	8,	9,	10,	11,	12,	null,	null,	null,	null,	null,	null,	null,	null,
        6,	7,	8,	9,	10,	11,	12,	13,	null,	null,	null,	null,	null,	null,	null,	null,
        7,	8,	9,	10,	11,	12,	13,	14,	null,	null,	null,	null,	null,	null,	null,	null,
    ],

    diagonals2: [
        7,	6,	5,	4,	3,	2,	1,	0,	null,	null,	null,	null,	null,	null,	null,	null,
        8,	7,	6,	5,	4,	3,	2,	1,	null,	null,	null,	null,	null,	null,	null,	null,
        9,	8,	7,	6,	5,	4,	3,	2,	null,	null,	null,	null,	null,	null,	null,	null,
        10,	9,	8,	7,	6,	5,	4,	3,	null,	null,	null,	null,	null,	null,	null,	null,
        11,	10,	9,	8,	7,	6,	5,	4,	null,	null,	null,	null,	null,	null,	null,	null,
        12,	11,	10,	9,	8,	7,	6,	5,	null,	null,	null,	null,	null,	null,	null,	null,
        13,	12,	11,	10,	9,	8,	7,	6,	null,	null,	null,	null,	null,	null,	null,	null,
        14,	13,	12,	11,	10,	9,	8,	7,	null,	null,	null,	null,	null,	null,	null,	null,
    ],

    occupiedTop: 0,
    occupiedBottom: 0,

    ply: 0,

    turn: WHITE,
    castlingRights: [15], //8: wks, 4:wqs, 2:bks, 1: bqs
    lastMove: {},
    enPassantSquares: [null],

    hashkey: 0,
    pawnhashkey: 0,

    zobristKeys: {
        positions: new Map(),
        castlingRights: new Map(),
        turn: new Map(),
        enPassantSquares: new Map()
    },

    loadFen(fen) {
        fen = fen.split(' ')
        let board = fen[0]
        let turn = fen[1] === 'w'? 1 : 2
        let castling = fen[2]
        let enpassantsquare = fen[3]
        let movenumber = fen[5]

        this.movenumber = movenumber
    
        let castlingRights = 0

        if (castling.indexOf('K') > -1) castlingRights ^= 8
        if (castling.indexOf('Q') > -1) castlingRights ^= 4
        if (castling.indexOf('k') > -1) castlingRights ^= 2
        if (castling.indexOf('q') > -1) castlingRights ^= 1
        
        this.castlingRights = [castlingRights]

        this.board = this.fen2board(board)

        this.whiteKingIndex = this.board.indexOf(K)
        this.blackKingIndex = this.board.indexOf(k)

        this.changeTurn(turn)
        
        if (enpassantsquare !== '-') {
            this.enPassantSquares = [this.coords.indexOf(enpassantsquare)]
            console.log('En Passant Square', this.enPassantSquares)
        }
    },

    fen2board (fen) {
        let board = fen.replace(/1/g, '0')
                    .replace(/2/g, '00')
                    .replace(/3/g, '000')
                    .replace(/4/g, '0000')
                    .replace(/5/g, '00000')
                    .replace(/6/g, '000000')
                    .replace(/7/g, '0000000')
                    .replace(/8/g, '00000000')
    
        board = board.replace(/\//g, '').split('')
    
        board = board.map(e=>{
          let piece = 0
    
          if (e === 'k') piece = 12
          if (e === 'q') piece = 11
          if (e === 'r') piece = 10
          if (e === 'b') piece =  9
          if (e === 'n') piece =  8
          if (e === 'p') piece =  7
          if (e === 'K') piece =  6
          if (e === 'Q') piece =  5
          if (e === 'R') piece =  4
          if (e === 'B') piece =  3
          if (e === 'N') piece =  2
          if (e === 'P') piece =  1
    
          return piece 
        })
    
        let board0x88 = []
    
        for (let i in board) {
          if (i % 8 === 0 && i>0) board0x88 = [...board0x88, null, null, null, null, null, null, null, null]
          board0x88.push(board[i])
        }
    
        board0x88 = [...board0x88, null, null, null, null, null, null, null, null]
    
      return board0x88
    },

    createBoard() {
        //r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 
        let board = [
            r,  n,  b,  q,  k,  b,  n,  r,     null, null, null, null, null, null, null, null,
            p,  p,  p,  p,  p,  p,  p,  p,     null, null, null, null, null, null, null, null,
            0,  0,  0,  0,  0,  0,  0,  0,     null, null, null, null, null, null, null, null,
            0,  0,  0,  0,  0,  0,  0,  0,     null, null, null, null, null, null, null, null,
            0,  0,  0,  0,  0,  0,  0,  0,     null, null, null, null, null, null, null, null,
            0,  0,  0,  0,  0,  0,  0,  0,     null, null, null, null, null, null, null, null,
            P,  P,  P,  P,  P,  P,  P,  P,     null, null, null, null, null, null, null, null,
            R,  N,  B,  Q,  K,  B,  N,  R,     null, null, null, null, null, null, null, null,
        ]

        for (let i = 0; i < 128; i++) {
            this.board[i] = board[i]
        }

        // this.board = [
        //     r,  n,  b,  q,  k,  b,  n,  r,     -8, -4, -4, -2, -2, -4, -4, -8,
        //     p,  p,  p,  p,  p,  p,  p,  p,     -1,  0,  1, -1, -1,  1,  0, -1,
        //     0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        //     0,  0,  0,  0,  0,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
        //     0,  0,  0,  0,  0,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
        //     0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        //     P,  P,  P,  P,  P,  P,  P,  P,     -1,  0,  1, -1, -1,  1,  0, -1,
        //     R,  N,  B,  Q,  K,  B,  N,  R,     -8, -4, -4, -2, -2, -4, -4, -8,
        // ]
        this.whiteKingIndex = this.board.indexOf(K)
        this.blackKingIndex = this.board.indexOf(k)

        this.turn = WHITE
    },

    boardToBits(draw) {
        let top = ""
        let bottom = ""
        for (let i = 0; i < 120; i++) {
            if (i & 0x88) {
                i+=7; continue
            }

            if (this.board[i]) {
                if (i<=55) {
                    top+="1"
                } else {
                    bottom+="1"
                }
            } else {
                if (i<=55) {
                    top+="0"
                } else {
                    bottom+="0"
                }
            }
        }

        this.occupiedTop = parseInt(top, 2)
        this.occupiedBottom = parseInt(bottom, 2)

        if (draw) {
            this.drawBitboard()
        }
    },

    drawBitboard() {
        console.log(this.occupiedTop.toString(2))
        console.log(this.occupiedBottom.toString(2))
        
    },

    initZobrist() {
        // Inicializa keys Pieza/Casilla
        for (let piece of [k, q, r, b, n, p, P, N, B, R, Q, K]) {
            this.zobristKeys.positions[piece] = new Map()

            for (let i = 0; i < 128; i++) {
                if (i & 0x88) {
                    i += 7
                    continue
                }

                this.zobristKeys.positions[piece][i] = (Math.random()*0xFFFFFFFF) >>> 0
            }
        }

        // Inicializa keys de Turno
        this.zobristKeys.turn[WHITE] = (Math.random()*0xFFFFFFFF) >>> 0
        this.zobristKeys.turn[BLACK] = (Math.random()*0xFFFFFFFF) >>> 0

        // Inicializa keys de Derechos de Enroque
        this.zobristKeys.castlingRights[8] = (Math.random()*0xFFFFFFFF) >>> 0
        this.zobristKeys.castlingRights[4] = (Math.random()*0xFFFFFFFF) >>> 0
        this.zobristKeys.castlingRights[2] = (Math.random()*0xFFFFFFFF) >>> 0
        this.zobristKeys.castlingRights[1] = (Math.random()*0xFFFFFFFF) >>> 0

        // Inicializa keys de Casillas En Passant (negras)
        for (let i=32; i<=39; i++) {
            this.zobristKeys.enPassantSquares[i] = (Math.random()*0xFFFFFFFF) >>> 0
        }
        
        // Inicializa keys de Casillas En Passant (blancas)
        for (let i=80; i<=87; i++) {
            this.zobristKeys.enPassantSquares[i] = (Math.random()*0xFFFFFFFF) >>> 0
        }

        // Inicializa hashkey con piezas del tablero
        for (let i = 0; i < 128; i++) {
            if (i & 0x88) {
                i += 7
                continue
            }

            let piece = this.board[i]

            if (piece === 0) continue

            this.updateHashkey(this.zobristKeys.positions[piece][i])

            if (piece === P || piece === p) {
                this.updatePawnHashkey(this.zobristKeys.positions[piece][i])
            }
        }
        
        // Actualiza hashkey con turno
        this.updateHashkey(this.zobristKeys.turn[this.turn])
    },

    updateHashkey(value) {
        this.hashkey = ((this.hashkey ^ value) >>> 0)
    },

    updatePawnHashkey(value) {
        this.pawnhashkey = ((this.pawnhashkey ^ value) >>> 0)
    },

    createAttackRays() {
        let attackBoards = new Array(128)
        for (i = 0; i < 128; i++) {
            if (i & 0x88) { i+= 7; continue}

            let board = new Array(128).fill(0)
        }

        console.log(attackBoards[2])
        console.log(attackBoards[51])
        console.log(attackBoards[81])
    },

    changeTurn(turn) {
        if (turn) {
            this.turn = turn
            this.updateHashkey(this.zobristKeys.turn[turn])
        } else {
            this.turn = this.turn === WHITE? BLACK : WHITE // Esto es 35% más rápido que ~turn o -turn o cualquier otra cosa
            this.updateHashkey(this.zobristKeys.turn[WHITE])
        }
    },

    createPieces() {
        this.pieces[0] = {symbol: '.', color: 0, offsets: []}

        //Blancas
        this.pieces[P] = {symbol: 'P', color: WHITE, offsets: [-16, -17, -15]}
        this.pieces[N] = {symbol: 'N', color: WHITE, offsets: [-33, -31, -18, -14, 18, 14, 33, 31]}
        this.pieces[B] = {symbol: 'B', color: WHITE, offsets: [-17, -15, 17, 15]}
        this.pieces[R] = {symbol: 'R', color: WHITE, offsets: [-16, -1, 1, 16]}
        this.pieces[Q] = {symbol: 'Q', color: WHITE, offsets: [-17, -15, -16, -1, 1, 17, 15, 16]}
        this.pieces[K] = {symbol: 'K', color: WHITE, offsets: [-17, -15, -16, -1, 1, 17, 15, 16]}
        
        //Negras
        this.pieces[p] = {symbol: 'p', color: BLACK, offsets: [16, 17, 15]}
        this.pieces[n] = {symbol: 'n', color: BLACK, offsets: [33, 31, 18, 14, -18, -14, -33, -31]}
        this.pieces[b] = {symbol: 'b', color: BLACK, offsets: [17, 15, -17, -15]}
        this.pieces[r] = {symbol: 'r', color: BLACK, offsets: [16, 1, -1, -16]}
        this.pieces[q] = {symbol: 'q', color: BLACK, offsets: [17, 15, 16, 1, -1, -17, -15, -16]}
        this.pieces[k] = {symbol: 'k', color: BLACK, offsets: [17, 15, 16, 1, -1, -17, -15, -16]}
    },

    createPieceList() {
        this.pieceList = {
            pieces: new Map(),
            [k]: 0,
            [q]: 0,
            [r]: 0,
            [b]: 0,
            [n]: 0,
            [p]: 0,
            [P]: 0,
            [N]: 0,
            [B]: 0,
            [R]: 0,
            [Q]: 0,
            [K]: 0,
        }

        for (let i = 0; i < 128; i++) {
            if (i & 0x88) {
                i += 7
                continue
            }

            let piece = this.board[i]

            if (piece) {
                this.pieceList.pieces[piece*10 + this.pieceList[piece]] = i
                this.pieceList[piece]++
            }
        }

    },

    isSlidingPiece(piece) {
        return piece === B || piece === R || piece === Q || piece === b || piece === r || piece === q
    },

    //Parameters: piece, from, to, isCapture, capturedPiece, castleSide, enPassantSquares, promotingPiece
    createMove(m) {
        m.key = m.piece + 100*m.from + 100000*m.to

        return m
    },

    isSquareAttacked(square, attackerSide, count, xrays) {
        if (square & 0x88) return count? 0 : false

        if (attackerSide === BLACK) {
            pFrom = P
            nFrom = N
            bFrom = B
            rFrom = R
            qFrom = Q
            kFrom = K
            pTo   = p
            nTo   = n
            bTo   = b
            rTo   = r
            qTo   = q
            kTo   = k
        } else {
            pFrom = p
            nFrom = n
            bFrom = b
            rFrom = r
            qFrom = q
            kFrom = k
            pTo   = P
            nTo   = N
            bTo   = B
            rTo   = R
            qTo   = Q
            kTo   = K
        }

        let attacks = 0

        //Peones
        for (let i = 1; i <= 2; i++) {
            let to = square + this.pieces[pFrom].offsets[i]

            if (to & 0x88) continue

            if (this.board[to] === pTo) {
                if (count) {attacks++} else {return true}
            }
        }

        // Alfiles
        for (let i = 0; i < 4; i++) {
            let to = square
            let blocked = false
            let outofbounds = false

            while (!blocked && !outofbounds) {
                to = to + this.pieces[bFrom].offsets[i]

                if (to & 0x88) {
                    outofbounds = true
                } else {
                    if (this.board[to]) {
                        if (this.board[to] === bTo || this.board[to] === qTo) {
                            if (count) {
                                attacks++
                                blocked = true
                            } else {
                                return true
                            }
                        } else {
                            if (!xrays) blocked = true
                        }
                    }
                }
            }
        }

        //Torres
        for (let i = 0; i < 4; i++) {
            let to = square
            let blocked = false
            let outofbounds = false

            while (!blocked && !outofbounds) {
                to = to + this.pieces[rFrom].offsets[i]

                if (to & 0x88) {
                    outofbounds = true
                } else {
                    if (this.board[to]) {
                        if (this.board[to] === rTo || this.board[to] === qTo) {
                            if (count) {
                                attacks++
                                blocked = true
                            } else {
                                return true
                            }
                        } else {
                            if (!xrays) blocked = true
                        }
                    }
                }
            }
        }

        // Caballos
        for (let i = 0; i < 8; i++) {
            let to = square + this.pieces[nFrom].offsets[i]

            if (to & 0x88) continue

            if (this.board[to] === nTo) {
                if (count) {attacks++} else {return true}
            }
        }

        //Rey
        for (let i = 0; i <= 7; i++) {
            let to = square + this.pieces[kFrom].offsets[i]

            if (to & 0x88) continue

            if (this.board[to] === kTo) {
                if (count) {attacks++} else {return true}
            }
        }

        return attacks
    },

    getAttackZone(color) {
        let attackZone = Array(128).fill(0)

        for (let square = 0; square < 128; square++) {
            if (square & 0x88) continue
            let attacks = this.isSquareAttacked(square, color, true)

            attackZone[square] += attacks
        }

        return attackZone
    },

    drawAttackZone(attackZone) {
        let attackString = ''

        for (let i = 0; i < 128; i++) {
            if (i & 0x88) {
                i += 7
                continue
            }

            attackString += attackZone[i]? attackZone[i] + ' ' : '. '

            if (i % 16 === 7) attackString += '\n'
        }

        console.log(attackString)
    },

    getCastlingRights() {
        return this.castlingRights[this.castlingRights.length - 1]
    },

    getMoves(forMobility, onlyCaptures) {
        forMobility = !!forMobility
        let moves = []
        let moveindex = 0

        let occupied = []//(new Array(32)).fill(0)
        let occupiedIndex = 0
        let isWhite = this.turn === WHITE

        for (let i = 0; i < 120; i++) {
            if (i & 0x88) {
                i+=7; continue
            }

            let piece = this.board[i]

            if (!piece) continue

            if (isWhite) {
                if (piece < 7) {
                    occupied[occupiedIndex] = i
                    occupiedIndex++
                }
            } else {
                if (piece >= 7) {
                    occupied[occupiedIndex] = i
                    occupiedIndex++
                }
            }
        }

        for (let oindex = 0; oindex < 16; oindex++) {
            let i = occupied[oindex]

            let piece = this.board[i]

            if (!piece) break

            let from = i

            if (this.color(piece) !== this.turn) continue

            if (!forMobility) {
                if (piece === K && i === 116) {
                    moves[moveindex++]=(this.createMove({piece: K, from:116, to:118, isCapture:false, capturedPiece:0, castleSide:8, enPassantSquares:null}))
                    moves[moveindex++]=(this.createMove({piece: K, from:116, to:114, isCapture:false, capturedPiece:0, castleSide:4, enPassantSquares:null}))
                }
    
                if (piece === k && i === 4) {
                    moves[moveindex++]=(this.createMove({piece: k, from:4, to:6, isCapture:false, capturedPiece:0, castleSide:2, enPassantSquares:null}))
                    moves[moveindex++]=(this.createMove({piece: k, from:4, to:2, isCapture:false, capturedPiece:0, castleSide:1, enPassantSquares:null}))
                }
            }


            //Peones
            if (!forMobility) {
                if (piece === P || piece === p) {
                    for (j = 0, len=this.pieces[piece].offsets.length; j < len; j++) {
                        let to = from + this.pieces[piece].offsets[j]
    
                        if (to & 0x88) continue
    
                        //Offsets 1 & 2 corresponden a capturas
                        if (j >= 1) {
                            let isCapture = false
        
                            let capturedPiece = this.board[to]
        
                            if (capturedPiece) {
                                if (this.color(capturedPiece) === this.turn) {
                                    continue
                                } else {
                                    isCapture = true
    
                                    if (to>=0 && to <= 7) {
                                        promotingPiece = Q
                                    }
                                    
                                    if (to>=112 && to <= 119) {
                                        promotingPiece = q
                                    }
    
                                    moves[moveindex++]=(this.createMove({piece, from, to, isCapture, capturedPiece, castleSide:0, enPassantSquares:null}))
                                }
                            } else {
                                let lastEP = this.enPassantSquares[this.enPassantSquares.length - 1]
                                if (to === lastEP) {
                                    isCapture = false
                                    //En passant move
                                    // moves[moveindex++]=(this.createMove({piece, from, to, isCapture, capturedPiece:0, castleSide:0, enPassantSquares:null, enPassant: true}))
                                    epnodes++
                                }
                            }
                            
                        } else {
                            // let to = from + this.pieces[piece].offsets[0]
                            
                            // if (to & 0x88) continue
                            
                            let blockingPiece = this.board[to]
                            let promotingPiece = null
                            
                            if (blockingPiece) {
                                continue
                            }
                            
                            if (to>=0 && to <= 7) {
                                promotingPiece = Q
                            }
                            
                            if (to>=112 && to <= 119) {
                                promotingPiece = q
                            }

                            if (onlyCaptures && !promotingPiece) continue
    
                            moves[moveindex++]=(this.createMove({piece, from, to, isCapture:false, capturedPiece:0, castleSide:0, enPassantSquares:null, promotingPiece}))
    
                            let whitePawns = this.turn === WHITE && from >= 96 && from <= 103
                            let blackPawns = this.turn === BLACK && from >= 16 && from <= 23
    
                            if (whitePawns || blackPawns) {
                                let enPassantSquares = to
                                
                                to = to + this.pieces[piece].offsets[0]
    
                                if (to & 0x88) continue
    
                                if (this.board[to]) continue
                                //Doble push
                                let doublePushMove = this.createMove({piece, from, to, isCapture:false, capturedPiece:0, castleSide:0, enPassantSquares})
                                moves[moveindex++]=(doublePushMove)
                            }
                        }
                    }
    
                    continue
                }
            }
            
            //Caballos y rey
            if (piece === N || piece === n || (!forMobility && (piece === K || piece === k))) {
                for (j=0, len=this.pieces[piece].offsets.length; j < len; j++) {
                    let to = from + this.pieces[piece].offsets[j]

                    if (to & 0x88) continue

                    let isCapture = false

                    let capturedPiece = this.board[to]

                    if (capturedPiece) {
                        if (this.color(capturedPiece) === this.turn) {
                            continue
                        }
                        
                        isCapture = true
                    } else {
                        if (onlyCaptures) continue
                    }

                    moves[moveindex++]=(this.createMove({piece, from, to, isCapture, capturedPiece, castleSide:0, enPassantSquares:null}))
                }

                continue
            }
            
            //Alfiles, Torres y Dama
            if (this.isSlidingPiece(piece)) {
                for (j=0, len = this.pieces[piece].offsets.length; j < len; j++) {
                    let to = i
                    
                    while (true) {
                        to += this.pieces[piece].offsets[j]
                        
                        if (to & 0x88) break
                        
                        let isCapture = false

                        let capturedPiece = this.board[to]

                        if (capturedPiece) {
                            if (this.color(capturedPiece) === this.turn) {
                                break
                            } else {
                                isCapture = true
                            }
                        } else {
                            if (onlyCaptures) continue
                        }

                        moves[moveindex++]=(this.createMove({piece, from, to, isCapture, capturedPiece, castleSide:0, enPassantSquares:null}))

                        if (isCapture) break
                    }
                }
            }
        }

        return moves
    },

    evaluate() {
        let material = 0
        let psqt = 0
        
        for (let i = 0; i < 128; i++) {
            if (i & 0x88) {
                i+=7; continue
            }
            let piece = this.board[i]
            if (!piece) continue
            material += 100*piece
            psqt += this.board[i+8] * this.color(piece)
        }

        let score = orobas.color(orobas.turn) * (material + psqt)

        return  score
    },

    draw() {
        let board = ''
        for (i = 0; i < 128; i++) {
            if (i & 0x88) {
                i += 7
                continue
            }

            let piece = this.board[i]

            board += this.pieces[piece].symbol + ' '

            if (i % 16 === 7) board += '\n'
        }
        console.log(board)
    },

    makeMove(move, illegal) {
        let me = this.turn
        let enemy = this.turn === WHITE? BLACK : WHITE

        if (move.castleSide) {
            let canCastle = move.castleSide & this.getCastlingRights()

            if (!canCastle) {
                return false
            }
            
            let from
            let square1
            let to

            if (move.castleSide === 8)  {
                if (this.board[117] || this.board[118]) return false

                if (!this.board[119]) return false

                from = 116; square1 = 117; to = 118
            } else if (move.castleSide === 4)  {
                if (this.board[115] || this.board[114] || this.board[113]) return false

                if (!this.board[112]) return false
                
                from = 116; square1 = 115; to = 114
            } else if (move.castleSide === 2)  {
                if (this.board[5] || this.board[6]) return false
                if (!this.board[7]) return false
                
                from = 4; square1 = 5; to = 6
            } else {
                if (this.board[3] || this.board[2] || this.board[1]) return false
                if (!this.board[0]) return false

                from = 4; square1 = 3; to = 2
            }
            
            if (this.isSquareAttacked(from, enemy)) {
                return false
            }
            if (this.isSquareAttacked(square1, enemy)) {
                return false
            }
            if (this.isSquareAttacked(to, enemy)) {
                return false
            }
        }
        
        this.makeEffectiveMove(move)

        //Chequea legalidad
        if (!illegal) {
            this.changeTurn()
            if (this.isKingInCheck()) {
                this.unmakeMove(move)
                this.changeTurn()
                return false
            }
            this.changeTurn()
        }

        return true
    },

    makeEffectiveMove(move) {
        this.ply++

        // Mueve la pieza de from a to
        this.updateHashkey(this.zobristKeys.positions[move.piece][move.from]) //Quita pieza del hashkey de su casilla original
        
        if (move.piece === P || move.piece === p) {
            this.updatePawnHashkey(this.zobristKeys.positions[move.piece][move.from]) //Quita pieza del hashkey de su casilla original
        }
        
        if (move.isCapture) {
            this.updateHashkey(this.zobristKeys.positions[move.capturedPiece][move.to]) // Remueve pieza capturada del hashkey

            if (move.capturedPiece === P || move.capturedPiece === p) {
                this.updatePawnHashkey(this.zobristKeys.positions[move.capturedPiece][move.to]) // Remueve pieza capturada del hashkey
            }
        }
        
        this.updateHashkey(this.zobristKeys.positions[move.piece][move.to]) //Agrega pieza al hashkey en casilla de destino

        if (move.piece === P || move.piece === p) {
            this.updatePawnHashkey(this.zobristKeys.positions[move.piece][move.to]) //Agrega pieza al hashkey en casilla de destino
        }

        if (move.promotingPiece) {
            this.board[move.to] = move.promotingPiece
        } else {
            this.board[move.to] = this.board[move.from]
        }
        this.board[move.from] = 0

        if (move.piece === K) this.setKingPosition(WHITE, move.to)
        if (move.piece === k) this.setKingPosition(BLACK, move.to)

        if (move.enPassant) {
            if (this.turn === WHITE) {
                this.board[move.to+16] = 0
                this.updateHashkey(this.zobristKeys.positions[p][move.to+16])
            } else {
                this.board[move.to-16] = 0
                this.updateHashkey(this.zobristKeys.positions[P][move.to-16])
            }
        }
        
        if (move.enPassantSquares) {
            let lastEnPassantSquare = this.enPassantSquares[this.enPassantSquares.length - 1]
            this.updateHashkey(this.zobristKeys.enPassantSquares[lastEnPassantSquare]) // Quita última casilla e.p.
            this.updateHashkey(this.zobristKeys.enPassantSquares[move.enPassantSquares]) // Agrega nuevo e.p.
        }
        
        this.enPassantSquares.push(move.enPassantSquares)

        let castlingRights = this.getCastlingRights()

        if (move.castleSide) {
            if (move.castleSide === 8) {
                this.board[119] = 0
                this.board[117] = R
                
                this.updateHashkey(this.zobristKeys.positions[R][119]) //Agrega torre al hashkey
                this.updateHashkey(this.zobristKeys.positions[R][117]) //Quita torre del hashkey
                
                castlingRights = castlingRights ^ 8 ^ 4
            }
            
            if (move.castleSide === 4) {
                this.board[112] = 0
                this.board[115] = R
                
                this.updateHashkey(this.zobristKeys.positions[R][112]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[R][115]) //Agrega torre al hashkey
                
                castlingRights = castlingRights ^ 8 ^ 4
            }

            if (move.castleSide === 2) {
                this.board[7] = 0
                this.board[5] = r

                this.updateHashkey(this.zobristKeys.positions[r][7]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[r][5]) //Agrega torre al hashkey

                castlingRights = castlingRights ^ 2 ^ 1
            }


            if (move.castleSide === 1) {
                this.board[0] = 0
                this.board[3] = r

                this.updateHashkey(this.zobristKeys.positions[r][0]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[r][3]) //Agrega torre al hashkey

                castlingRights = castlingRights ^ 2 ^ 1
            }
        } else {
            if ((castlingRights & 8) && (move.piece === K || (move.piece === R && move.from === 119) || move.to === 119)) {
                castlingRights = castlingRights ^ 8
            }

            if ((castlingRights & 4) && (move.piece === K || (move.piece === R && move.from === 112) || move.to === 112)) {
                castlingRights = castlingRights ^ 4
            
            }

            if ((castlingRights & 2) && (move.piece === k || (move.piece === r && move.from === 7) || move.to === 7)) {
                castlingRights = castlingRights ^ 2
            }

            if ((castlingRights & 1) && (move.piece === k || (move.piece === r && move.from === 0) || move.to === 0)) {
                castlingRights = castlingRights ^ 1
            }

        }
        
        this.castlingRights.push(castlingRights)
        this.changeTurn()
    },

    unmakeMove(move) {
        this.ply--

        this.updateHashkey(this.zobristKeys.positions[move.piece][move.to]) //Quita pieza al hashkey en casilla de destino
        
        if (move.piece === P || move.piece === p) {
            this.updatePawnHashkey(this.zobristKeys.positions[move.piece][move.to]) //Quita pieza al hashkey en casilla de destino
        }
        
        if (move.capturedPiece) {
            this.updateHashkey(this.zobristKeys.positions[move.capturedPiece][move.to]) // Agrega pieza capturada al hashkey
            
            if (move.capturedPiece === P || move.capturedPiece === p) {
                this.updatePawnHashkey(this.zobristKeys.positions[move.capturedPiece][move.to]) // Agrega pieza capturada al hashkey
            }
        }
        
        this.updateHashkey(this.zobristKeys.positions[move.piece][move.from]) //Agrega pieza del hashkey de su casilla original
        
        if (move.piece === P || move.piece === p) {
            this.updatePawnHashkey(this.zobristKeys.positions[move.piece][move.from]) //Agrega pieza del hashkey de su casilla original
        }

        this.board[move.to] = move.capturedPiece 
        this.board[move.from] = move.piece

        if (move.piece === K) this.setKingPosition(WHITE, move.from)
        if (move.piece === k) this.setKingPosition(BLACK, move.from)

        if (move.enPassant) {
            if (this.turn === BLACK) {
                this.board[move.to+16] = p
                this.updateHashkey(this.zobristKeys.positions[p][move.to+16])

            } else {
                this.board[move.to-16] = P
                this.updateHashkey(this.zobristKeys.positions[P][move.to-16])
            }
        }

        if (move.castleSide) {
            if (move.castleSide === 8) {
                this.board[117] = 0
                this.board[119] = R
                
                this.updateHashkey(this.zobristKeys.positions[R][117]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[R][119]) //Agrega torre al hashkey
            }
            
            if (move.castleSide === 4) {
                this.board[115] = 0
                this.board[112] = R
                
                this.updateHashkey(this.zobristKeys.positions[R][115]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[R][112]) //Agrega torre al hashkey
            }
            
            if (move.castleSide === 2) {
                this.board[5] = 0
                this.board[7] = r

                this.updateHashkey(this.zobristKeys.positions[r][5]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[r][7]) //Agrega torre al hashkey
            }

            if (move.castleSide === 1) {
                this.board[3] = 0
                this.board[0] = r

                this.updateHashkey(this.zobristKeys.positions[r][3]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[r][0]) //Agrega torre al hashkey
            }
        }

        this.castlingRights.pop()
        this.enPassantSquares.pop()

        if (move.enPassantSquares) {
            let lastEnPassantSquare = this.enPassantSquares[this.enPassantSquares.length - 1] // El penúltimo
            this.updateHashkey(this.zobristKeys.enPassantSquares[move.enPassantSquares]) // Quita e.p.
            this.updateHashkey(this.zobristKeys.enPassantSquares[lastEnPassantSquare]) // Agrega e.p. anterior
        }
        

        this.changeTurn()

    },

    setKingPosition(turn, square) {
        if (turn === WHITE) {
            this.whiteKingIndex = square
        } else {
            this.blackKingIndex = square
        }
    },
 
    color(n) {
        return n > 6? BLACK : WHITE
    },

    perftData: {
        nodes: 0,
        castles: 0,
        captures: 0,
        enpassant: 0,
        checkmates: 0,
        checks: 0
    },

    isKingInCheck() {
        let kingIndex = this.turn === WHITE? this.board.indexOf(K) : this.board.indexOf(k)

        return this.isSquareAttacked(kingIndex, this.turn === WHITE? BLACK : WHITE, false)
    },

    perft(depth) {
    
        if (depth === 0) {
            this.perftData.nodes++
            return 1
        }
        
        let nodes = 0
        let moves = this.getMoves()
        
        let legal = 0

        for (let j = 0; j < moves.length; j++) {
            
            if (orobas.makeMove(moves[j])) {
                legal++

                let incheck = this.isKingInCheck()

                if (incheck) this.perftData.checks++

                if (moves[j].isCapture || moves[j].enPassant) this.perftData.captures++
                if (moves[j].castleSide) this.perftData.castles++
                if (moves[j].enPassant) this.perftData.enpassant++

                nodes += this.perft(depth - 1)

                orobas.unmakeMove(moves[j])
            }
        }

        if (legal === 0) {
            this.perftData.checkmates++
        }

        return nodes
    },

    init(silent) {

        if (!silent) console.log('Creating new game!!!!!')
        this.createBoard()
        this.createPieces()
        this.createPieceList()
        this.initZobrist()
        if (!silent) this.draw()
    }
}

let epnodes = 0

orobas.init()
orobas.draw()
console.log(orobas.hashkey, orobas.pawnhashkey)

// Kiwi-Pete
// orobas.loadFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - ')

// console.log('PLY', orobas.ply)
// console.time()
// console.log('PERFT 1', orobas.perft(1), 20, 48) // OK
// console.log('PERFT 2', orobas.perft(2), 400, 2039) // OK
// console.log('PERFT 3', orobas.perft(3), 8902, 97862) // OK
// console.log('PERFT 4', orobas.perft(4), 197281, 4085603) // OK
// console.log('PERFT 5', orobas.perft(5), 4865609, 193690690) // OK
// console.log('PERFT 6', orobas.perft(6), 119060324, 8031647685) // NO
// console.log(orobas.perftData)
// orobas.drawAttackZone(orobas.getAttackZone(WHITE))
// console.log(moves.map(e=>{return orobas.coords[e.from] + '-' + orobas.coords[e.to]}))
// console.timeEnd()
// console.log('PLY', orobas.ply)
orobas.draw()
console.log(orobas.hashkey, orobas.pawnhashkey)

orobas.boardToBits(true)
let move = {from: 118, to: 85, piece: N}
orobas.makeMove(move)

orobas.occupiedBottom = orobas.occupiedBottom ^ (1 << orobas.boardbits[move.from])
orobas.occupiedBottom = orobas.occupiedBottom | (1 << orobas.boardbits[move.to])

console.log(1 << orobas.boardbits[move.from])

orobas.draw()
orobas.drawBitboard()


