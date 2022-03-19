let orobas = require('./orobas.js')
let AI = require('./aiC.js')
// let stockfish = require("stockfish")();
const { board } = require('./orobas.js')
var fs = require('fs')

let chessAnalysisApi = require('chess-analysis-api').chessAnalysisApi

let PROVIDERS = chessAnalysisApi.providers

process.on('uncaughtException', err => {
    console.error(err && err.stack)
});

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

let piecePositions = new Array(64).fill(0)

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

        if (orobas.board[j] === K) {
            piecePositions[orobas.board64[j]]++
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

    fen = fen + ` ${orobas.turn === 1? 'w' : 'b'} - - 1 1`

    // console.log(fen)

    return fen
}

let getScore = async (fen)=>{
    await chessAnalysisApi.getAnalysis({
        fen,
        depth: 23,
        provider: PROVIDERS.stockfish,
        excludes: [
            PROVIDERS.lichessOpening,
            PROVIDERS.lichessCloud,
        ]
      })
      .then((result) => {
          console.log(result)
        let turn = fen.split(' ')[1]

        // Puntaje relativo al lado que mueve
        if (turn === 'b') result.moves[0].score.value = -result.moves[0].score.value
      
        console.log(result.fen + '\t' + JSON.stringify(result.moves[0].score));

        if (result.moves[0].score.type === 'cp') {
            winner = result.moves[0].score.value > 120? "1.0" : (result.moves[0].score.value < -120? "0.0" : "0.5")
    
            fs.appendFileSync('orobasRandomPositionsDepth23.txt', result.fen + '\t' + result.moves[0].score.value + '\t' + winner + '\n', function (err) {
                if (err) return console.log(err);
                console.log('Appended!');
            });
        }

      })
      .catch(error => {
      
        console.error(error);
        // throw new Error(error.message);
      
        // ...
      });
}

let createPositions = async ()=>{
    for (let i = 0; i < 25000; i++) {
        let numberOfMoves = Math.random()*600 | 0

        numberOfMoves = numberOfMoves < 12? 12 : numberOfMoves

        let legal = 0
        
        
        for (let j = 0; j < numberOfMoves; j++) {
            let moves = orobas.getMoves()

            moves = AI.sortMoves(moves, orobas.turn, 1, 10, null)

            let randomMoveIndex = 0

            if (moves[0].castleSide) {
                randomMoveIndex = 0
            } else {
                randomMoveIndex = Math.random()*moves.length | 0
            }

            let move = moves[randomMoveIndex]
            
            if (orobas.makeMove(move)) {
                // if (move.castleSide) console.log('castle done')
                legal++
            }
            
        }

        // Quiescent
        let quiet = false
        let attempts = 0

        while (!quiet && attempts < 20) {
            let moves = orobas.getMoves()
            moves = AI.sortMoves(moves, orobas.turn, 1, 10, null)

            if (moves.length) {
                if (moves[0].isCapture) {
                    if (orobas.makeMove(moves[0])) {
                        legal++
                    }
                } else {
                    quiet = true
                    break
                }
            }

            attempts++

            // console.log(quiet, attempts)
        }

        if (quiet) {
            // let fen = '8/7P/6P1/3k1P2/p4Q2/p7/2R5/4KBN1 b - - 1 1'// getFen()
            let fen = getFen()
            
            await getScore(fen)

        }
    
        // orobas.draw()
        orobas.init(true)
    }

    console.log('-------------------------------------------------------------')
}

createPositions()


console.log(piecePositions)

// while(true) {}
