let AI = {
    version: '1.0'
}

const { board } = require('./chess.js')
let orobas = require('./chess.js')

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

MATE = 20000

let sortMoves = (moves, ply) => {
    for (let i = 0, len=moves.length; i < len; i++) {
        moves[i].score = 0

        if (moves[i].castleSide) {
            moves[i].score += 1e9
            continue
        }
        
        if (PV[ply] && moves[i].from === PV[ply].from && moves[i].to === PV[ply].to) {
            moves[i].score += 1e8
            continue
        }
        
        if (moves[i].capturedPiece) {
            let mvvlva = -100*((moves[i].capturedPiece + 1)/(moves[i].piece + 1)) | 0
            moves[i].score += 1e7 + mvvlva
            // console.log(mvvlva)
            continue
        }

        moves[i].score += orobas.board[moves[i].to + 8] - orobas.board[moves[i].from + 8]
    }

    return moves.sort((a,b)=>{
        return b.score - a.score
    })
}

let qsearch = (alpha, beta, depth, ply) => {
    let standpat = orobas.evaluate()

    if (standpat >= beta) {
        return standpat
    }

    if (standpat > alpha) alpha = standpat

    let moves = orobas.getMoves()
    moves = sortMoves(moves)

    let legal = 0
    let score = -Infinity

    for (let i = 0, len = moves.length; i < len; i++) {
        if (!moves[i].capturedPiece) continue

        if (orobas.makeMove(moves[i])) {
            legal++

            score = -qsearch(-beta, -alpha, depth - 1, ply + 1)
    
            orobas.unmakeMove(moves[i])
    
            if (score >= beta) {
                return beta
            }
            
            if (score > alpha) {
                alpha = score
            }
        }
    }

    if (legal === 0) {
        if (orobas.isKingInCheck()) return -MATE + ply

        return 0 // Draw
    }

    return alpha
}

let pvs = (alpha, beta, depth, ply) => {
    if (depth <= 0) {
        return qsearch(alpha, beta, depth, ply)
    }

    let moves = orobas.getMoves()

    moves = sortMoves(moves, ply)

    let score = 0
    let R = 0
    let legal = 0
    let bestmove = moves[0]

    for (let i = 0, len = moves.length; i < len; i++) {
        if (orobas.makeMove(moves[i])) {
            legal++

            let E = orobas.isKingInCheck()? 1 : 0

            score = -pvs(-beta, -alpha, depth + E - 1, ply + 1)
            // if (legal === 1) {
            //     score = -pvs(-beta, -alpha, depth + E - 1, ply + 1)
            // } else {
            //     R = (depth>=3? depth/5 + legal/5 + 1 : 0) | 0
        
            //     score = -pvs(-alpha-1, -alpha, depth+ E - R - 1, ply + 1)
    
            //     if (score > alpha) score = -pvs(-beta, -alpha, depth + E - 1, ply + 1)
            // }

    
            orobas.unmakeMove(moves[i])
    
            if (score >= beta) {
                bestmove = moves[i]
                PV[ply] = bestmove
                return score
            }
            
            if (score > alpha) {
                alpha = score
                bestmove = moves[i]
            }
        }
    }

    if (legal === 0) {
        if (orobas.isKingInCheck()) return -MATE + ply

        return 0 // Draw
    }

    PV[ply] = bestmove

    return alpha
}

let PV = []
let score = 0

AI = {
    search: (options) => {
        return new Promise((resolve, reject) => {
            for (let depth = 1; depth < options.depth; depth++) {
                score = pvs(-Infinity, Infinity, depth, 1)
            }
    
            let move = PV[1]
            // orobas.makeMove(move)
            // orobas.draw()
            console.log('Score', orobas.sign(orobas.turn) * score)

            move.from = orobas.board64[move.from]
            move.to = orobas.board64[move.to]

            resolve({...move})
        })
    
        
    }
}

module.exports = AI



