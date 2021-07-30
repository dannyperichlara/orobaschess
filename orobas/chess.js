var seedrandom = require('seedrandom')

seedrandom('orobas19ffec57e6844cdb3b9cdc9537a25393', {global: true})

const p =  -1
const n =  -3
const b =  -4
const r =  -5
const q =  -9
const k = -20
const P =   1
const N =   3
const B =   4
const R =   5
const Q =   9
const K =  20

const WHITE =  1
const BLACK = -1


module.exports = orobas = {
    pieces: new Map(),
    pieceList: new Array(32),
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
        r,  n,  b,  q,  k,  b,  n,  r,     -8, -4, -4, -2, -2, -4, -4, -8,
        p,  p,  p,  p,  p,  p,  p,  p,     -1,  0,  1, -1, -1,  1,  0, -1,
        0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        0,  0,  0,  0,  0,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
        0,  0,  0,  0,  0,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
        0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        P,  P,  P,  P,  P,  P,  P,  P,     -1,  0,  1, -1, -1,  1,  0, -1,
        R,  N,  B,  Q,  K,  B,  N,  R,     -8, -4, -4, -2, -2, -4, -4, -8,
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

    pieceList: [],

    turn: WHITE,
    castlingRights: [15], //8: wks, 4:wqs, 2:bks, 1: bqs
    lastMove: {},
    enPassantSquares: [null],

    hashkey: 0,

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
        this.zobristKeys.turn[-1] = (Math.random()*0xFFFFFFFF) >>> 0
        this.zobristKeys.turn[ 1] = (Math.random()*0xFFFFFFFF) >>> 0

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
        }
        
        // Actualiza hashkey con turno
        this.updateHashkey(this.zobristKeys.turn[this.turn])
    },

    updateHashkey(value) {
        this.hashkey = ((this.hashkey ^ value) >>> 0)
    },

    changeTurn(turn) {
        if (turn) {
            this.turn = turn
            this.updateHashkey(this.zobristKeys.turn[turn]) //this.turn, ya cambió el turn
        } else {
            this.turn = this.turn === 1? -1 : 1 // Esto es 35% más rápido que ~turn o -turn
            this.updateHashkey(this.zobristKeys.turn[this.turn]) //this.turn, ya cambió el turn
        }
    },

    createPieces() {
        this.pieces[0] = {symbol: '.', offsets: []}

        //Blancas
        this.pieces[P] = {symbol: 'P', offsets: [-16, -17, -15]}
        this.pieces[N] = {symbol: 'N', offsets: [-18, -33, -31, -14, 18, 33, 31, 14]}
        this.pieces[B] = {symbol: 'B', offsets: [-17, -15, 17, 15]}
        this.pieces[R] = {symbol: 'R', offsets: [-16, 1, 16, -1]}
        this.pieces[Q] = {symbol: 'Q', offsets: [-17, -16, -15, 1, 17, 16, 15, -1]}
        this.pieces[K] = {symbol: 'K', offsets: [-17, -16, -15, 1, 17, 16, 15, -1]}
        
        //Negras
        this.pieces[p] = {symbol: 'p', offsets: [16, 17, 15]}
        this.pieces[n] = {symbol: 'n', offsets: [-18, -33, -31, -14, 18, 33, 31, 14]}
        this.pieces[b] = {symbol: 'b', offsets: [-17, -15, 17, 15]}
        this.pieces[r] = {symbol: 'r', offsets: [-16, 1, 16, -1]}
        this.pieces[q] = {symbol: 'q', offsets: [-17, -16, -15, 1, 17, 16, 15, -1]}
        this.pieces[k] = {symbol: 'k', offsets: [-17, -16, -15, 1, 17, 16, 15, -1]}
    },

    createPieceList() {
        for (let i = 0; i < 128; i++) {
            if (i & 0x88) {
                i += 7
                continue
            }

            if (this.board[i]) this.pieceList.push({piece: this.board[i], index: i})
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

    isSquareAttacked(square, side, count) {
        side = -side

        let attacks = 0
        //Peones
        for (let i = 1; i <= 2; i++) {
            let to = square + this.pieces[side*P].offsets[i]

            if (to & 0x88) continue

            if (this.board[to] === side*p) {
                if (count) {attacks++} else {return true}
            }
        }

        // Caballos
        for (let i = 0; i < 8; i++) {
            let to = square + this.pieces[N].offsets[i]

            if (to & 0x88) continue

            if (this.board[to] === side*n) {
                if (count) {attacks++} else {return true}
            }
        }

        // Alfiles
        for (let i = 0; i <= 3; i++) {
            let to = square
            let blocked = false
            let outofbounds = false

            while (!blocked && !outofbounds) {
                to = to + this.pieces[side*B].offsets[i]

                if (to & 0x88) {
                    outofbounds = true
                } else {
                    if (this.board[to]) {
                        if (this.board[to] === side*b) {
                            if (count) {attacks++} else {return true}
                        } else {
                            blocked = true
                        }
                    }
                }
            }
        }

        //Torres
        for (let i = 0; i <= 3; i++) {
            let to = square
            let blocked = false
            let outofbounds = false

            while (!blocked && !outofbounds) {
                to = to + this.pieces[side*R].offsets[i]

                if (to & 0x88) {
                    outofbounds = true
                } else {
                    if (this.board[to]) {
                        if (this.board[to] === side*r) {
                            if (count) {attacks++} else {return true}
                        } else {
                            blocked = true
                        }
                    }
                }
            }
        }

        //Dama
        for (let i = 0; i <= 7; i++) {
            let to = square
            let blocked = false
            let outofbounds = false

            while (!blocked && !outofbounds) {
                to = to + this.pieces[side*Q].offsets[i]

                if (to & 0x88) {
                    outofbounds = true
                } else {
                    if (this.board[to]) {
                        if (this.board[to] === side*q) {
                            if (count) {attacks++} else {return true}
                        } else {
                            blocked = true
                        }
                    }
                }
            }
        }

        //Rey
        for (let i = 0; i <= 7; i++) {
            let to = square + this.pieces[K].offsets[i]

            if (to & 0x88) continue

            if (this.board[to] === side*k) {
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

    getMoves() {
        let moves = []

        for (let i = 0; i < 128; i++) {
            if (i & 0x88) {
                i+=7; continue
            }

            let piece = this.board[i]

            let from = i

            if (this.sign(piece) !== this.turn) continue

            if (piece === K && i === 116) {
                moves.push(this.createMove({piece: K, from:116, to:118, isCapture:false, capturedPiece:0, castleSide:8, enPassantSquares:null}))
                moves.push(this.createMove({piece: K, from:116, to:114, isCapture:false, capturedPiece:0, castleSide:4, enPassantSquares:null}))
                // continue
            }

            if (piece === k && i === 4) {
                moves.push(this.createMove({piece: k, from:4, to:6, isCapture:false, capturedPiece:0, castleSide:2, enPassantSquares:null}))
                moves.push(this.createMove({piece: k, from:4, to:2, isCapture:false, capturedPiece:0, castleSide:1, enPassantSquares:null}))
                // continue
            }

            //Peones
            if (piece === P || piece === p) {
                for (j = 0, len=this.pieces[piece].offsets.length; j < len; j++) {
                    let to = from + this.pieces[piece].offsets[j]

                    if (to & 0x88) continue

                    //El tercer y cuarto offset corresponden a capturas
                    if (j >= 1) {
                        let isCapture = false
    
                        let capturedPiece = this.board[to]
    
                        if (capturedPiece) {
                            if (this.sign(capturedPiece) === this.turn) {
                                continue
                            } else {
                                isCapture = true

                                if (to>=0 && to <= 7) {
                                    promotingPiece = Q
                                }
                                
                                if (to>=112 && to <= 119) {
                                    promotingPiece = q
                                }

                                moves.push(this.createMove({piece, from, to, isCapture, capturedPiece, castleSide:0, enPassantSquares:null}))
                            }
                        } else {
                            if (to === this.enPassantSquares) {
                                //En passant
                                moves.push(this.createMove({piece, from, to, isCapture, capturedPiece, castleSide:0, enPassantSquares:null}))
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

                        moves.push(this.createMove({piece, from, to, isCapture:false, capturedPiece:0, castleSide:0, enPassantSquares:null, promotingPiece}))

                        let whitePawns = this.turn === WHITE && from >= 96 && from <= 103
                        let blackPawns = this.turn === BLACK && from >= 16 && from <= 23

                        if (whitePawns || blackPawns) {
                            let enPassantSquares = to
                            
                            to = to + this.pieces[piece].offsets[0]

                            if (to & 0x88) continue

                            if (this.board[to]) continue

                            //Doble push
                            let doublePushMove = this.createMove({piece, from, to, isCapture:false, capturedPiece:0, castleSide:0, enPassantSquares})
                            moves.push(doublePushMove)
                        }
                    }
                }

                continue
            }
            
            //Caballos y rey
            if (piece === N || piece === n || piece === K || piece === k) {
                for (j=0, len=this.pieces[piece].offsets.length; j < len; j++) {
                    let to = from + this.pieces[piece].offsets[j]

                    if (to & 0x88) continue

                    let isCapture = false

                    let capturedPiece = this.board[to]

                    if (capturedPiece) {
                        if (this.sign(capturedPiece) === this.turn) {
                            continue
                        }
                        
                        isCapture = true
                    }

                    moves.push(this.createMove({piece, from, to, isCapture, capturedPiece, castleSide:0, enPassantSquares:null}))
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
                            if (this.sign(capturedPiece) === this.turn) {
                                break
                            } else {
                                isCapture = true
                            }
                        }

                        moves.push(this.createMove({piece, from, to, isCapture, capturedPiece, castleSide:0, enPassantSquares:null}))

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
            psqt += this.board[i+8] * this.sign(piece)
        }

        let score = orobas.sign(orobas.turn) * (material + psqt)

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
        
        // if (move.piece === K || move.piece === k) { //????? WTF
        //     if (this.isKingInCheck()) return false
        // }
        
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
        // Mueve la la pieza de from a to
        this.updateHashkey(this.zobristKeys.positions[move.piece][move.from]) //Quita pieza del hashkey de su casilla original
        
        if (move.capturedPiece) {
            this.updateHashkey(this.zobristKeys.positions[move.capturedPiece][move.to]) // Remueve pieza capturada del hashkey
        }
        
        this.updateHashkey(this.zobristKeys.positions[move.piece][move.to]) //Agrega pieza al hashkey en casilla de destino

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

                this.castlingRights.push(castlingRights ^ 8 ^ 4)
            }

            if (move.castleSide === 4) {
                this.board[112] = 0
                this.board[115] = R

                this.updateHashkey(this.zobristKeys.positions[R][112]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[R][115]) //Agrega torre al hashkey

                this.castlingRights.push(castlingRights ^ 8 ^ 4)
            }

            if (move.castleSide === 2) {
                this.board[7] = 0
                this.board[5] = r

                this.updateHashkey(this.zobristKeys.positions[r][7]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[r][5]) //Agrega torre al hashkey

                this.castlingRights.push(castlingRights ^ 2 ^ 1)
            }

            if (move.castleSide === 1) {
                this.board[0] = 0
                this.board[3] = r

                this.updateHashkey(this.zobristKeys.positions[r][0]) //Quita torre del hashkey
                this.updateHashkey(this.zobristKeys.positions[r][3]) //Agrega torre al hashkey

                this.castlingRights.push(castlingRights ^ 2 ^ 1)
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

            this.castlingRights.push(castlingRights)
        }
        
        this.changeTurn()
    },

    unmakeMove(move) {
        this.updateHashkey(this.zobristKeys.positions[move.piece][move.to]) //Quita pieza al hashkey en casilla de destino
        
        if (move.capturedPiece) {
            this.updateHashkey(this.zobristKeys.positions[move.capturedPiece][move.to]) // Agrega pieza capturada al hashkey
        }
        
        this.updateHashkey(this.zobristKeys.positions[move.piece][move.from]) //Agrega pieza del hashkey de su casilla original

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

    sign(n) {
        return n >= 0? 1 : -1
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

        return this.isSquareAttacked(kingIndex, -this.turn, false)
    },

    perft(depth) {
        
        if (depth === 0) {
            this.perftData.nodes++
            return 1
        }
        
        let nodes = 0
        let moves = this.getMoves()
        
        let legal = 0

        let lastEnPassantSquare = this.enPassantSquares[this.enPassantSquares.length - 1]
        
        for (let j = 0; j < moves.length; j++) {
            
            if (orobas.makeMove(moves[j])) {
                legal++
                
                let incheck = this.isKingInCheck()

                if (incheck) this.perftData.checks++

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
console.log(orobas.hashkey)

// console.log('PERFT 1', orobas.perft(1), 20, 48)
// console.log('PERFT 2', orobas.perft(2), 400, 2039)
console.log('PERFT 3', orobas.perft(3), 8902, 97862)
// console.log('PERFT 4', orobas.perft(4), 197281, 422333)
// console.log(orobas.perftData)
// orobas.drawAttackZone(orobas.getAttackZone(WHITE))
// console.log(moves.map(e=>{return orobas.coords[e.from] + '-' + orobas.coords[e.to]}))

orobas.draw()
console.log(orobas.hashkey)