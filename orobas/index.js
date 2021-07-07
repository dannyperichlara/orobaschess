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

let search = (alpha, beta, depth, ply) => {
    if (depth <= 0) return orobas.evaluate()

    let moves = orobas.getMoves()
    let score = 0
    let R = 0
    let legal = 0
    let bestmove = null

    for (let i = 0, len = moves.length; i < len; i++) {
        orobas.makeMove(moves[i])

        legal++

        R = depth>=3? depth/5 + legal/5 + 1 : 0

        score = -search(-beta, -alpha, depth - R - 1, ply + 1)

        orobas.unmakeMove(moves[i])

        if (score >= beta) {
            return score
        }
        
        if (score >= alpha) {
            alpha = score
            bestmove = moves[j]
        }
    }
    
    PV[ply] = bestmove

    return alpha
}

let PV = []
let score = 0

for (let i = 0; i < 1; i++) {
    score = search(-Infinity, Infinity, i, 1)
    orobas.makeMove(PV[1])
    
    orobas.draw()
    
    console.log('Score', score, PV[1])
}

