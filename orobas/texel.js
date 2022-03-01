let orobas = require('./orobas.js')
let AI = require('./aiC.js')
const { board } = require('./orobas.js')

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

var fs = require('fs');
var positions = fs.readFileSync('position_scores.txt').toString().split("\n");

positions = positions.map(e=>{
    let line = e.split('\t')

    if (line[2] === '1-0') line[2] = 1 
    if (line[2] === '1/2-1/2') line[2] = 0
    if (line[2] === '0-1') line[2] = -1 

    return {fen: line[0], result: line[2]}
})

// console.log(positions)

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

let texel = async ()=>{
    let sumOfSquares = 0
    
    for (let i = 0; i < positions.length; i++) {
    // for (let i = 0; i < 4; i++) {
        // orobas.init(true)
        orobas.loadFen(positions[i].fen)
    
        await AI.search(orobas, {seconds:0.01}).then(res=>{
            sumOfSquares += ((positions[i].result - res.sigmoid)**2)
            if (i % 100 === 1) console.log('position ' + i)
        })
    }

    return sumOfSquares
}

let opening = JSON.parse(JSON.stringify(AI.PSQT_OPENING))
let endgame = JSON.parse(JSON.stringify(AI.PSQT_LATE_ENDGAME))
let pov = JSON.parse(JSON.stringify(AI.POV))
let pev = JSON.parse(JSON.stringify(AI.PEV))

let defended = JSON.parse(JSON.stringify(AI.DEFENDED_VALUES))
let blocked = JSON.parse(JSON.stringify(AI.BLOCKEDPAWNBONUS))
let defendedbonud = JSON.parse(JSON.stringify(AI.DEFENDEDPAWNBONUS))
let aligned = JSON.parse(JSON.stringify(AI.ALIGNEDPAWNBONUS))
let neighbour = JSON.parse(JSON.stringify(AI.NEIGHBOURPAWNBONUS))
let lever = JSON.parse(JSON.stringify(AI.LEVERPAWNBONUS))
let passers = JSON.parse(JSON.stringify(AI.PASSERSBONUS))
let doubled = JSON.parse(JSON.stringify(AI.DOUBLEDPENALTY))
let outpostknight = JSON.parse(JSON.stringify(AI.OUTPOSTBONUSKNIGHT))
let outpostbishop = JSON.parse(JSON.stringify(AI.OUTPOSTBONUSBISHOP))
let attacking = JSON.parse(JSON.stringify(AI.ATTACKING_PIECES))
let shield = JSON.parse(JSON.stringify(AI.PAWNSHIELD))
let par = JSON.parse(JSON.stringify(AI.PAR))
let mob = JSON.parse(JSON.stringify(AI.MOB))

let oldS2 = 3046.877882345157

let iterate = async ()=>{
    for (let i = 0; i < 10; i++) {
        console.log('_____________________ ITERATION ' + i)
        AI.PSQT_OPENING = JSON.parse(JSON.stringify(opening))
        AI.PSQT_LATE_ENDGAME = JSON.parse(JSON.stringify(endgame))

        AI.POV = JSON.parse(JSON.stringify(pov))
        AI.PEV = JSON.parse(JSON.stringify(pev))

        AI.DEFENDED_VALUES = JSON.parse(JSON.stringify(defended))
        AI.BLOCKEDPAWNBONUS = JSON.parse(JSON.stringify(blocked))
        AI.DEFENDEDPAWNBONUS = JSON.parse(JSON.stringify(defendedbonud))
        AI.ALIGNEDPAWNBONUS = JSON.parse(JSON.stringify(aligned))
        AI.NEIGHBOURPAWNBONUS = JSON.parse(JSON.stringify(neighbour))
        AI.LEVERPAWNBONUS = JSON.parse(JSON.stringify(lever))
        AI.PASSERSBONUS = JSON.parse(JSON.stringify(passers))
        AI.DOUBLEDPENALTY = JSON.parse(JSON.stringify(doubled))
        AI.OUTPOSTBONUSKNIGHT = JSON.parse(JSON.stringify(outpostknight))
        AI.OUTPOSTBONUSBISHOP = JSON.parse(JSON.stringify(outpostbishop))
        AI.ATTACKING_PIECES = JSON.parse(JSON.stringify(attacking))
        AI.PAWNSHIELD = JSON.parse(JSON.stringify(shield))

        AI.PAR = JSON.parse(JSON.stringify(par))
        AI.MOB = JSON.parse(JSON.stringify(mob))

        if (true || i > 0) {
            AI.PSQT_OPENING[P] = AI.PSQT_OPENING[P].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_OPENING[N] = AI.PSQT_OPENING[N].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_OPENING[B] = AI.PSQT_OPENING[B].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_OPENING[R] = AI.PSQT_OPENING[R].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_OPENING[Q] = AI.PSQT_OPENING[Q].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_OPENING[K] = AI.PSQT_OPENING[K].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
    
            AI.PSQT_LATE_ENDGAME[P] = AI.PSQT_LATE_ENDGAME[P].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_LATE_ENDGAME[N] = AI.PSQT_LATE_ENDGAME[N].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_LATE_ENDGAME[B] = AI.PSQT_LATE_ENDGAME[B].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_LATE_ENDGAME[R] = AI.PSQT_LATE_ENDGAME[R].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_LATE_ENDGAME[Q] = AI.PSQT_LATE_ENDGAME[Q].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PSQT_LATE_ENDGAME[K] = AI.PSQT_LATE_ENDGAME[K].map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))

            AI.POV = AI.POV.map(e=>(Math.random()>0.5? e + 2 : e - 2))
            AI.PEV = AI.PEV.map(e=>(Math.random()>0.5? e + 2 : e - 2))

            AI.DEFENDED_VALUES = AI.DEFENDED_VALUES.map(e=>(Math.random()>0.5? e + 1 : e - 1))
            AI.BLOCKEDPAWNBONUS = AI.BLOCKEDPAWNBONUS.map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.DEFENDEDPAWNBONUS = AI.DEFENDEDPAWNBONUS.map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.ALIGNEDPAWNBONUS = AI.ALIGNEDPAWNBONUS.map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.NEIGHBOURPAWNBONUS = AI.NEIGHBOURPAWNBONUS.map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.LEVERPAWNBONUS = AI.LEVERPAWNBONUS.map(e=>(e === null? null : Math.random()>0.5? e + 1 : e - 1))
            AI.PASSERSBONUS = AI.PASSERSBONUS.map(e=>(e === null? null : Math.random()>0.5? e + 2 : e - 2))
            AI.DOUBLEDPENALTY = AI.DOUBLEDPENALTY.map(e=>(e === null? null : Math.random()>0.5? e + 2 : e - 2))
            AI.OUTPOSTBONUSKNIGHT = AI.OUTPOSTBONUSKNIGHT.map(e=>(e === null? null : Math.random()>0.5? e + 2 : e - 2))
            AI.OUTPOSTBONUSBISHOP = AI.OUTPOSTBONUSBISHOP.map(e=>(e === null? null : Math.random()>0.5? e + 2 : e - 2))
            AI.ATTACKING_PIECES = AI.ATTACKING_PIECES.map(e=>(Math.random()>0.5? e + 2 : e - 2))
            AI.PAWNSHIELD = AI.PAWNSHIELD.map(e=>(Math.random()>0.5? e + 1 : e - 1))

            AI.PAR = AI.PAR.map(e=>(Math.random()>0.5? e + 1 : e - 1))

            AI.MOB[N] = AI.MOB[N].map(e=>(Math.random()>0.5? e + 1 : e - 1))
            AI.MOB[B] = AI.MOB[B].map(e=>(Math.random()>0.5? e + 1 : e - 1))
            AI.MOB[R] = AI.MOB[R].map(e=>(Math.random()>0.5? e + 1 : e - 1))
            AI.MOB[Q] = AI.MOB[Q].map(e=>(Math.random()>0.5? e + 1 : e - 1))
        }
    
        let sumOfSquares = await texel()
    
        if (sumOfSquares < oldS2) {
            oldS2 = sumOfSquares

            console.log(sumOfSquares, 'Better')

            opening = JSON.parse(JSON.stringify(AI.PSQT_OPENING))
            endgame = JSON.parse(JSON.stringify(AI.PSQT_LATE_ENDGAME))

            pov = JSON.parse(JSON.stringify(AI.POV))
            pev = JSON.parse(JSON.stringify(AI.PEV))

            defended = JSON.parse(JSON.stringify(AI.DEFENDED_VALUES))
            blocked = JSON.parse(JSON.stringify(AI.BLOCKEDPAWNBONUS))
            defendedbonud = JSON.parse(JSON.stringify(AI.DEFENDEDPAWNBONUS))
            aligned = JSON.parse(JSON.stringify(AI.ALIGNEDPAWNBONUS))
            neighbour = JSON.parse(JSON.stringify(AI.NEIGHBOURPAWNBONUS))
            lever = JSON.parse(JSON.stringify(AI.LEVERPAWNBONUS))
            passers = JSON.parse(JSON.stringify(AI.PASSERSBONUS))
            doubled = JSON.parse(JSON.stringify(AI.DOUBLEDPENALTY))
            outpostknight = JSON.parse(JSON.stringify(AI.OUTPOSTBONUSKNIGHT))
            outpostbishop = JSON.parse(JSON.stringify(AI.OUTPOSTBONUSBISHOP))
            attacking = JSON.parse(JSON.stringify(AI.ATTACKING_PIECES))
            shield = JSON.parse(JSON.stringify(AI.PAWNSHIELD))
            par = JSON.parse(JSON.stringify(AI.PAR))
            mob = JSON.parse(JSON.stringify(AI.MOB))
        } else {
            console.log(sumOfSquares, 'No better')
        }
    }

    console.log('psqt opening', JSON.stringify(AI.PSQT_OPENING))
    console.log('psqt endgame', JSON.stringify(AI.PSQT_LATE_ENDGAME))

    console.log('POV', JSON.stringify(AI.POV))
    console.log('PEV', JSON.stringify(AI.PEV))
    console.log('DEFENDED_VALUES', JSON.stringify(AI.DEFENDED_VALUES))
    console.log('BLOCKEDPAWNBONUS', JSON.stringify(AI.BLOCKEDPAWNBONUS))
    console.log('DEFENDEDPAWNBONUS', JSON.stringify(AI.DEFENDEDPAWNBONUS))
    console.log('ALIGNEDPAWNBONUS', JSON.stringify(AI.ALIGNEDPAWNBONUS))
    console.log('NEIGHBOURPAWNBONUS', JSON.stringify(AI.NEIGHBOURPAWNBONUS))
    console.log('LEVERPAWNBONUS', JSON.stringify(AI.LEVERPAWNBONUS))
    console.log('PASSERSBONUS', JSON.stringify(AI.PASSERSBONUS))
    console.log('DOUBLEDPENALTY', JSON.stringify(AI.DOUBLEDPENALTY))
    console.log('OUTPOSTBONUSKNIGHT', JSON.stringify(AI.OUTPOSTBONUSKNIGHT))
    console.log('OUTPOSTBONUSBISHOP', JSON.stringify(AI.OUTPOSTBONUSBISHOP))
    console.log('ATTACKING_PIECES', JSON.stringify(AI.ATTACKING_PIECES))
    console.log('PAWNSHIELD', JSON.stringify(AI.PAWNSHIELD))
    console.log('PAR', JSON.stringify(AI.PAR))
    console.log('MOB', JSON.stringify(AI.MOB))

    console.log('Best S2', oldS2)
}

iterate()
