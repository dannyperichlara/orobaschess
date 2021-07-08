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
        // r,  n,  b,  q,  k,  b,  n,  r,     -2, -4, -2,  1,  1, -2, -4, -2,
        // p,  p,  p,  p,  p,  p,  p,  p,     -1,  0,  1,  2,  2,  1,  0, -1,
        // 0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        // 0,  0,  0,  0,  0,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
        // 0,  0,  0,  0,  0,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
        // 0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        // P,  P,  P,  P,  P,  P,  P,  P,     -1,  0,  1,  2,  2,  1,  0, -1,
        // R,  N,  B,  Q,  K,  B,  N,  R,     -2, -4, -2,  1,  1, -2, -4, -2,

        // r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -        (Kiwipete)
        r,  0,  0,  0,  k,  0,  0,  r,     -2, -4, -2,  1,  1, -2, -4, -2,
        p,  0,  p,  p,  q,  p,  b,  0,     -1,  0,  1,  2,  2,  1,  0, -1,
        b,  n,  0,  0,  p,  n,  p,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        0,  0,  0,  P,  N,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
        0,  p,  0,  0,  P,  0,  0,  0,      1,  2,  3,  4,  4,  3,  2,  1,
        0,  0,  N,  0,  0,  Q,  0,  p,      0,  1,  2,  3,  3,  2,  1,  0,
        P,  P,  P,  B,  B,  P,  P,  P,     -1,  0,  1,  2,  2,  1,  0, -1,
        R,  0,  0,  0,  K,  0,  0,  R,     -2, -4, -2,  1,  1, -2, -4, -2,

        // 0,0,0,0,0,0,0,0,    0,0,0,0,0,0,0,0,
        // 0,0,p,0,0,0,0,0,    0,0,0,0,0,0,0,0,
        // 0,0,0,p,0,0,0,0,    0,0,0,0,0,0,0,0,
        // K,P,0,0,0,0,0,r,    0,0,0,0,0,0,0,0,
        // 0,R,0,0,0,p,0,k,    0,0,0,0,0,0,0,0,
        // 0,0,0,0,0,0,0,0,    0,0,0,0,0,0,0,0,
        // 0,0,0,0,P,0,P,0,    0,0,0,0,0,0,0,0,
        // 0,0,0,0,0,0,0,0,    0,0,0,0,0,0,0,0,
    ],

    pieceList: [],

    turn: WHITE,
    castleRights: [15], //8: wks, 4:wqs, 2:bks, 1: bqs
    lastMove: {},
    epsquare: null,

    changeTurn(turn) { this.turn = this.turn === 1? -1 : 1}, // Esto es 35% más rápido que ~turn o -turn

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

    createMove(piece, from, to, isCapture, capturedPiece, castleSide, epsquare, plindex) {
        return {
            piece, from, to, isCapture, capturedPiece, castleSide, epsquare, plindex
        }
    },

    inCheck() {
        return false
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

        // //Caballos
        for (let i = 0; i < 8; i++) {
            let to = square + this.pieces[N].offsets[i]

            if (to & 0x88) continue

            if (this.board[to] === side*n) {
                if (count) {attacks++} else {return true}
            }
        }

        // //Alfiles
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

    getCastleRights() {
        return this.castleRights[this.castleRights.length - 1]
    },

    getMoves() {
        let moves = []

        let castleRights = this.getCastleRights()

        for (let i = 0; i < 128; i++) {
            if (i & 0x88) {
                i+=7; continue
            }

            let piece = this.board[i]

            let from = i

            if (this.sign(piece) !== this.turn) continue

            if (piece === 20) {
                //White kingside
                if ((castleRights & 8) && this.board[116] === K && this.board[119] === R && !this.board[117] && !this.board[118]) {
                    moves.push(this.createMove(piece=K, from=116, to=118, isCapture=false, capturedPiece=0, castleSide=8, epsquare=null))
                }
        
                //White queenside
                if ((castleRights & 4) && this.board[116] === K && this.board[112] === R && !this.board[115] && !this.board[114] && !this.board[113]) {
                    moves.push(this.createMove(piece=K, from=116, to=114, isCapture=false, capturedPiece=0, castleSide=4, epsquare=null))
                }
            }

            if (piece === -20) {
                //Black kingside
                if ((castleRights & 2) && this.board[4] === k && this.board[7] === r && !this.board[5] && !this.board[6]) {
                    moves.push(this.createMove(piece=k, from=4, to=7, isCapture=false, capturedPiece=0, castleSide=2, epsquare=null))
                }
        
                //Black queenside
                if ((castleRights & 1) && this.board[4] === k && this.board[0] === r && !this.board[1] && !this.board[2] && !this.board[3]) {
                    moves.push(this.createMove(piece=k, from=4, to=0, isCapture=false, capturedPiece=0, castleSide=1, epsquare=null))
                }
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

                                moves.push(this.createMove(piece, from, to, isCapture, capturedPiece, castleSide=0, epsquare=null))
                            }
                        } else {
                            if (to === this.epsquare) {
                                //En passant
                                moves.push(this.createMove(piece, from, to, isCapture, capturedPiece, castleSide=0, epsquare=null))
                                epnodes++
                            }
                        }
                        
                    } else {
                        let to = from + this.pieces[piece].offsets[0]

                        if (to & 0x88) continue

                        let blockingPiece = this.board[to]

                        if (blockingPiece) {
                            continue
                        }

                        moves.push(this.createMove(piece, from, to, isCapture=false, capturedPiece=0, castleSide=0, epsquare=null))

                        let whitePawns = this.turn === WHITE && from >= 96 && from <= 103
                        let blackPawns = this.turn === BLACK && from >= 16 && from <= 23

                        if (whitePawns || blackPawns) {
                            let epsquare = to
                            
                            to = to + this.pieces[piece].offsets[0]

                            if (to & 0x88) continue

                            if (this.board[to]) continue

                            //Doble push
                            let doublePushMove = this.createMove(piece, from, to, isCapture=false, capturedPiece=0, castleSide=0, epsquare)
                            moves.push(doublePushMove)
                        }
                    }
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
                        if (this.sign(capturedPiece) === this.turn) {
                            continue
                        }
                        
                        isCapture = true
                    }

                    moves.push(this.createMove(piece, from, to, isCapture, capturedPiece, castleSide=0, epsquare=null))
                }
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

                        moves.push(this.createMove(piece, from, to, isCapture, capturedPiece, castleSide=0, epsquare=null))

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
            material += piece
            psqt += this.board[i+8] * this.sign(piece)
        }
        return 100*material + psqt
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

    makeEffectiveMove(move) {
        this.lastepsquare = this.epsquare
        this.board[move.to] = this.board[move.from]
        this.board[move.from] = 0
        this.epsquare = move.epsquare

        let castleRights = this.getCastleRights()

        if (move.castleSide) {
            if (move.castleSide === 8) {
                this.board[119] = 0
                this.board[117] = R

                this.castleRights.push(castleRights ^ 8 ^ 4)
            }

            if (move.castleSide === 4) {
                this.board[112] = 0
                this.board[115] = R

                this.castleRights.push(castleRights ^ 8 ^ 4)
            }

            if (move.castleSide === 2) {
                this.board[7] = 0
                this.board[5] = r

                this.castleRights.push(castleRights ^ 2 ^ 1)
            }

            if (move.castleSide === 1) {
                this.board[0] = 0
                this.board[3] = r

                this.castleRights.push(castleRights ^ 2 ^ 1)
            }
        } else {
            if ((castleRights & 8) && (move.piece === K || (move.piece === R && move.from === 119) || move.to === 119)) {
                castleRights = castleRights ^ 8
            }

            if ((castleRights & 4) && (move.piece === K || (move.piece === R && move.from === 112) || move.to === 112)) {
                castleRights = castleRights ^ 4
            }

            if ((castleRights & 2) && (move.piece === k || (move.piece === r && move.from === 7) || move.to === 7)) {
                castleRights = castleRights ^ 2
            }

            if ((castleRights & 1) && (move.piece === k || (move.piece === r && move.from === 0) || move.to === 0)) {
                castleRights = castleRights ^ 1
            }

            this.castleRights.push(castleRights)
        }


        this.changeTurn()
    },

    unmakeMove(move) {
        this.epsquare = this.lastepsquare

        this.board[move.to] = move.capturedPiece
        this.board[move.from] = move.piece

        if (move.castleSide) {
            if (move.castleSide === 8) {
                this.board[117] = 0
                this.board[119] = R
            }

            if (move.castleSide === 4) {
                this.board[115] = 0
                this.board[112] = R
            }

            if (move.castleSide === 2) {
                this.board[5] = 0
                this.board[7] = r
            }

            if (move.castleSide === 1) {
                this.board[3] = 0
                this.board[0] = r
            }
        }

        this.castleRights.pop()

        this.changeTurn()
    },

    makeMove(move) {
        let me = this.turn
        let enemy = this.turn === WHITE? BLACK : WHITE

        if (move.castleSide) {
            let square1
            let square2
            if (move.castleSide === 8)  {square1 = 117; square2 = 118}
            if (move.castleSide === 4)  {square1 = 115; square2 = 114}
            if (move.castleSide === 2)  {square1 = 5; square2 = 6}
            if (move.castleSide === 1)  {square1 = 3; square2 = 2}

            if (this.isSquareAttacked(square1, enemy)) {
                return false
            }
            if (this.isSquareAttacked(square2, enemy)) {
                return false
            }
        }

        if (move.piece === me*K) {
            if (this.isSquareAttacked(move.to, enemy)) return false
        }
        
        let kingPosition = this.board.indexOf(me*K)

        this.makeEffectiveMove(move)
        
        if (this.isSquareAttacked(kingPosition, enemy)) {
            this.unmakeMove(move)

            return false
        }

        return true
    },

    sign(n) {
        return n >= 0? 1 : -1
    },

    perftData: {
        nodes: 0,
        castles: 0,
        captures: 0,
        enpassant: 0,
        checkmates: 0
    },

    perft(depth) {
        
        if (depth === 0) {
            this.perftData.nodes++
            return 1
        }
        
        nodes = 0
        let moves = this.getMoves()
        
        legal = 0

        for (let j = 0; j < moves.length; j++) {
            if (orobas.makeMove(moves[j])) {
                legal++

                if (moves[j].isCapture) this.perftData.captures++
                if (moves[j].castleSide) this.perftData.castles++
                if (this.lastepsquare && (moves[j].piece === P || moves[j].piece === p) && this.lastepsquare === moves[j].to) {
                    this.perftData.enpassant++
                }

                nodes += this.perft(depth - 1)
                orobas.unmakeMove(moves[j])
            }
        }

        if (legal === 0) this.perftData.checkmates++

        return nodes
    },

    init() {
        orobas.createPieces()
        orobas.createPieceList()
    }
}

let epnodes = 0

orobas.init()
orobas.draw()

// console.log('Evaluation:', orobas.evaluate())

console.time()
// // console.log('PERTF 1', orobas.perft(1), 20, 48); console.log(epnodes)
// console.log('PERTF 2', orobas.perft(2), 400, 2039); console.log(epnodes)
console.log('PER∫TF 3', orobas.perft(3), 8902, 97862); console.log(epnodes)
// // console.log('PERTF 4', orobas.perft(4), 197281, 4085603); console.log(epnodes)
console.timeEnd()
console.log(orobas.perftData)
orobas.drawAttackZone(orobas.getAttackZone(WHITE))
// console.log(orobas.getMoves().map(e=>{return orobas.coords[e.from] + '-' + orobas.coords[e.to]}))