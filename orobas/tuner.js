"use strict"

const board = require('./orobas.js')
const AI = require('./aiC.js')
const orobas = require('./orobas.js')

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

AI.setPhase(board)
AI.createTables(true, true, true)

let play = ()=>{
    let finished = false
    let mated = false
    let result
    
    while (!mated) {
        let moves = board.getMoves()
        
        moves = AI.sortMoves(moves, board.turn, 1, board, null)
        if (moves.length === 0) break

        moves = moves.filter((m,i)=>{
            return i <= 3 || Math.random() < (1/31)
        })
    
        let index = Math.random()*moves.length | 0

        let capturedPiece = moves[index].capturedPiece

        if (capturedPiece === K || capturedPiece === k) {

            if (capturedPiece === K) {
                result = BLACK
            } else {
                result = WHITE
            }

            mated = true
        } else {
            board.makeMove(moves[index], true)
        }

        // if (true || i % 20 === 19) board.draw()
    }

    // board.draw()

    return result
}

let results = {
    win: 0,
    loss: 0
}

let totalgames = 4000

for (let i = 0; i < totalgames; i++) {
    orobas.init(true)

    orobas.board = [
        N,  0,  0,  0,  k,  0,  0,  N,      0,  1,  2,  3,  3,  2,  1,  0,
        0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        0,  0,  0,  n,  n,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        0,  0,  0,  n,  n,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        0,  0,  0,  0,  0,  0,  0,  0,      0,  1,  2,  3,  3,  2,  1,  0,
        N,  0,  0,  0,  K,  0,  0,  N,      0,  1,  2,  3,  3,  2,  1,  0,
    ]

    orobas.turn = Math.random() > 0.5? WHITE : BLACK
    if (play() === WHITE) {
        results.win++
    } else {
        results.loss++
    }
}

let sigmoid = results.win/totalgames
let centipawns = Math.round(400 * Math.log10(sigmoid/(1 - sigmoid)))

console.log(results, `${Math.round(100*sigmoid)}%`, centipawns)