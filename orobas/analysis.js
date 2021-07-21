let fs = require('fs')

//Importa archivo de juegos de Carlsen
let games = fs.readFileSync('carlsen.pgn', 'utf8').toString()

//Separa los juegos en un arreglo
games = games.replace(/\r\n9/g, '').split('\n\r').map(e=>e.trim())

//Sea segura de que efectivamente los juegos fueron separados correctamente
games = games.filter(e=>{
    return e.substr(0, 2) === '1.'
})

//Crea mapas de jugadas
let moves = {
    white: new Map(),
    black: new Map(),
}


//Agrega a mapas cada jugada o aumenta contador
for (let i = 0; i < games.length; i++) {
    let eachmove = games[i].split('.')
    eachmove.shift()
    
    for (let j = 0; j < eachmove.length; j++) {
        if (j < 60 || j > 1000) continue
        let singlemove = eachmove[j].split(' ')

        if (moves.white[singlemove[0]]) {
            moves.white[singlemove[0]]++
        } else {
            moves.white[singlemove[0]] = 1
        }

        if (moves.black[singlemove[1]]) {
            moves.black[singlemove[1]]++
        } else {
            moves.black[singlemove[1]] = 1
        }
    }
}

//Elimina movimientos únicos
for (let i in moves.white) {
    if (moves.white[i] === 1) {
        delete moves.white[i]
    }
}

for (let i in moves.black) {
    if (moves.black[i] === 1) {
        delete moves.black[i]
    }
}

//Crea arreglos de movimientos antes de ordenar
let whitemoves = []
let blackmoves = []

for (let i in moves.white) {
    whitemoves.push({
        move: i,
        n: moves.white[i]
    })
}

for (let i in moves.black) {
    blackmoves.push({
        move: i,
        n: moves.black[i]
    })
}

//Ordena movimientos
whitemoves.sort((a,b)=>{
    return b.n - a.n
})

blackmoves.sort((a,b)=>{
    return b.n - a.n
})

console.log(whitemoves)





