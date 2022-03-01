let orobas = require('./orobas.js')
let AI = require('./aiC.js')
// let stockfish = require("stockfish")();
const { board } = require('./orobas.js')

// let chessAnalysisApi = require('chess-analysis-api').chessAnalysisApi

// console.log(chessAnalysisApi)

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

let rookPositions = new Array(64).fill(0)

let piece = {
     1: 'P',
     2: 'N',
     3: 'B',
     4: 'R',
     5: 'Q',
     6: 'K',
     7: 'p',
     8: 'n',
     9: 'b',
    10: 'r',
    11: 'q',
    12: 'k',
}

let getFen = ()=>{
    let position = new Array(8)

    for (let j = 0; j < 8; j++) {
        position[j] = new Array(8).fill(0)
    }

    for (let j = 0; j < 120; j++) {
        if (j & 0x88) {
            j+=7
            continue
        }

        let square = orobas.board64[j]

        position[(63 - square)/8 | 0][square % 8] = orobas.board[j]        

        if (orobas.board[j] === k) {
            rookPositions[orobas.board64[j]]++
        }
    }

    let fen = ''

    for (let j = 0; j < 8; j++) {
        let empty = 0

        for (let k = 0; k < 8; k++) {
            if (position[j][k] !== 0) {
                if (empty > 0) fen += empty
                fen += piece[position[j][k]]
                empty = 0
            } else {
                empty++
            }
            
        }

        if (empty > 0) fen += empty

        if (j < 7) fen += '/'
    }

    return fen + ' w - - 1 1'
}

let getScore = async (fen)=>{
    // console.log('score')
}

for (let i = 0; i < 2700; i++) {
    let numberOfMoves = Math.random()*400 | 0
    let legal = 0
    
    
    for (let j = 0; j < numberOfMoves; j++) {
        let moves = orobas.getMoves()
        // moves = AI.sortMoves(moves, orobas.turn)
        let randomMoveIndex = Math.random()*moves.length | 0
        let move = moves[randomMoveIndex]
        
        if (orobas.makeMove(move)) {
            legal++
        }
        
    }

    let fen = getFen()
    
    getScore(fen)

    // orobas.draw()
    orobas.init(true)

}

console.log(rookPositions)

