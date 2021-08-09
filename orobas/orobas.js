var seedrandom = require('seedrandom')

seedrandom('orobas', {global: true})

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
    board: [
        r,  n,  b,  q,  k,  b,  n,  r,  	null,	null,	null,	null,	null,	null,	null,	null,
        p,  p,  p,  p,  p,  p,  p,  p,  	null,	null,	null,	null,	null,	null,	null,	null,
        0,  0,  0,  0,  0,  0,  0,  0,  	null,	null,	null,	null,	null,	null,	null,	null,
        0,  0,  0,  0,  0,  0,  0,  0,  	null,	null,	null,	null,	null,	null,	null,	null,
        0,  0,  0,  0,  0,  0,  0,  0,  	null,	null,	null,	null,	null,	null,	null,	null,
        0,  0,  0,  0,  0,  0,  0,  0,  	null,	null,	null,	null,	null,	null,	null,	null,
        P,  P,  P,  P,  P,  P,  P,  P,  	null,	null,	null,	null,	null,	null,	null,	null,
        R,  N,  B,  Q,  K,  B,  N,  R,  	null,	null,	null,	null,	null,	null,	null,	null,
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

    createBoard() {
        this.board = [
            r,  n,  b,  q,  k,  b,  n,  r,     -8, -4, -4, -2, -2, -4, -4, -8,
            p,  p,  p,  p,  p,  p,  p,  p,     -1,  0,  1, -1, -1,  1,  0, -1,
            0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
            0,  0,  0,  0,  0,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
            0,  0,  0,  0,  0,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
            0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
            P,  P,  P,  P,  P,  P,  P,  P,     -1,  0,  1, -1, -1,  1,  0, -1,
            R,  N,  B,  Q,  K,  B,  N,  R,     -8, -4, -4, -2, -2, -4, -4, -8,
        ]

        this.turn = WHITE
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

    changeTurn(turn) {
        if (turn) {
            this.turn = turn
            this.updateHashkey(this.zobristKeys.turn[turn])
        } else {
            this.turn = this.turn === WHITE? BLACK : WHITE // Esto es 35% más rápido que ~turn o -turn o cualquier otra cosa
            // this.updateHashkey(this.zobristKeys.turn[this.turn]) //this.turn, ya cambió el turn
            this.updateHashkey(this.zobristKeys.turn[WHITE])
        }
    },

    createPieces() {
        this.pieces[0] = {symbol: '.', color: 0, offsets: []}

        //Blancas
        this.pieces[P] = {symbol: 'P', color: WHITE, offsets: [-16, -17, -15]}
        this.pieces[N] = {symbol: 'N', color: WHITE, offsets: [-18, -33, -31, -14, 18, 33, 31, 14]}
        this.pieces[B] = {symbol: 'B', color: WHITE, offsets: [-17, -15, 17, 15]}
        this.pieces[R] = {symbol: 'R', color: WHITE, offsets: [-16, 1, 16, -1]}
        this.pieces[Q] = {symbol: 'Q', color: WHITE, offsets: [-17, -16, -15, 1, 17, 16, 15, -1]}
        this.pieces[K] = {symbol: 'K', color: WHITE, offsets: [-17, -16, -15, 1, 17, 16, 15, -1]}
        
        //Negras
        this.pieces[p] = {symbol: 'p', color: BLACK, offsets: [16, 17, 15]}
        this.pieces[n] = {symbol: 'n', color: BLACK, offsets: [-18, -33, -31, -14, 18, 33, 31, 14]}
        this.pieces[b] = {symbol: 'b', color: BLACK, offsets: [-17, -15, 17, 15]}
        this.pieces[r] = {symbol: 'r', color: BLACK, offsets: [-16, 1, 16, -1]}
        this.pieces[q] = {symbol: 'q', color: BLACK, offsets: [-17, -16, -15, 1, 17, 16, 15, -1]}
        this.pieces[k] = {symbol: 'k', color: BLACK, offsets: [-17, -16, -15, 1, 17, 16, 15, -1]}
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
        return {
            piece: m.piece,
            from: m.from,
            to: m.to,
            isCapture: m.isCapture,
            capturedPiece: m.capturedPiece,
            castleSide: m.castleSide,
            enPassantSquares: m.enPassantSquares,
            promotingPiece: m.promotingPiece
        }
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

        //Dama
        for (let i = 0; i < 8; i++) {
            let to = square
            let blocked = false
            let outofbounds = false

            while (!blocked && !outofbounds) {
                to = to + this.pieces[qFrom].offsets[i]

                if (to & 0x88) {
                    outofbounds = true
                } else {
                    if (this.board[to]) {
                        if (this.board[to] === qTo) {
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
                        if (this.board[to] === rTo) {
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
                        if (this.board[to] === bTo) {
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
        
        //Peones
        for (let i = 1; i <= 2; i++) {
            let to = square + this.pieces[pFrom].offsets[i]

            if (to & 0x88) continue

            if (this.board[to] === pTo) {
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

    getMoves(forMobility) {
        forMobility = !!forMobility
        let moves = []
        let moveindex = 0

        for (let i = 0; i < 128; i++) {
            if (i & 0x88) {
                i+=7; continue
            }

            let piece = this.board[i]

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
                                if (to === this.enPassantSquares[this.enPassantSquares.length - 1]) {
                                    //En passant
                                    // moves[moveindex++]=(this.createMove({piece, from, to, isCapture, capturedPiece, castleSide:0, enPassantSquares:null}))
                                    // epnodes++

                                    //DESACTIVADO TEMPORALMENTE
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
            if (piece === N || piece === n || piece === K || piece === k) {
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

    makeMove(move) {
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
            }
            if (move.castleSide === 4)  {
                if (this.board[115] || this.board[114] || this.board[113]) return false

                if (!this.board[112]) return false
                
                from = 116; square1 = 115; to = 114
            }
            if (move.castleSide === 2)  {
                if (this.board[5] || this.board[6]) return false
                if (!this.board[7]) return false
                
                from = 4; square1 = 5; to = 6
            }
            if (move.castleSide === 1)  {
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
        this.changeTurn()
        if (this.isKingInCheck()) {
            this.unmakeMove(move)
            this.changeTurn()
            return false
        }
        this.changeTurn()

        return true
    },

    makeEffectiveMove(move) {
        // Mueve la pieza de from a to
        this.updateHashkey(this.zobristKeys.positions[move.piece][move.from]) //Quita pieza del hashkey de su casilla original
        
        if (move.piece === P || move.piece === p) {
            this.updatePawnHashkey(this.zobristKeys.positions[move.piece][move.from]) //Quita pieza del hashkey de su casilla original
        }
        
        if (move.capturedPiece) {
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

        if (move.enPassantSquares) {
            let lastEnPassantSquare = this.enPassantSquares[this.enPassantSquares.length - 2] // El penúltimo
            this.updateHashkey(this.zobristKeys.enPassantSquares[lastEnPassantSquare]) // Quita última casilla e.p.
            this.updateHashkey(this.zobristKeys.enPassantSquares[move.enPassantSquares]) // Agrega nuevo e.p.
        }
        
        this.enPassantSquares.pop()

        this.changeTurn()

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

        let incheck = this.isKingInCheck()

        if (incheck) this.perftData.checks++
        
        let nodes = 0
        let moves = this.getMoves()
        
        let legal = 0

        let lastEnPassantSquare = this.enPassantSquares[this.enPassantSquares.length - 1]
        
        for (let j = 0; j < moves.length; j++) {
            
            if (orobas.makeMove(moves[j])) {
                legal++

                if (moves[j].isCapture) this.perftData.captures++
                if (moves[j].castleSide) this.perftData.castles++
                if (lastEnPassantSquare && (moves[j].piece === P || moves[j].piece === p) && lastEnPassantSquare === moves[j].to) {
                    this.perftData.enpassant++
                }

                nodes += this.perft(depth - 1)

                orobas.unmakeMove(moves[j])
            }
        }

        if (legal === 0) {
            this.perftData.checkmates++
        }

        return nodes
    },

    init() {
        console.log('Creating new game!!!!!')
        this.createBoard()
        this.createPieces()
        this.createPieceList()
        this.initZobrist()
        this.draw()
    }
}

let epnodes = 0

orobas.init()
orobas.draw()
console.log(orobas.hashkey, orobas.pawnhashkey)

// console.log('PERFT 1', orobas.perft(1), 20, 48) // OK
// console.log('PERFT 2', orobas.perft(2), 400, 2039) // OK
// console.log('PERFT 3', orobas.perft(3), 8902, 97862) // OK
// console.log('PERFT 4', orobas.perft(4), 197281, 422333) // OK
// console.log('PERFT 5', orobas.perft(5), 4865609, '-') // OK
// console.log('PERFT 6', orobas.perft(6), 119060324, '-') // NO
console.log(orobas.perftData)
// orobas.drawAttackZone(orobas.getAttackZone(WHITE))
// console.log(moves.map(e=>{return orobas.coords[e.from] + '-' + orobas.coords[e.to]}))

orobas.draw()
console.log(orobas.hashkey, orobas.pawnhashkey)