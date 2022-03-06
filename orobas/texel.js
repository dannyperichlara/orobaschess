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
let positions = []

let getPositions = ()=>{
    // var positions = fs.readFileSync('position_scores.txt').toString().split("\n");
    positions = fs.readFileSync('wukongPositions.txt').toString().split("\n");
    
    // positions = positions.map(e=>{
    //     let line = e.split('\t')
    
    //     if (line[2] === '1-0') line[2] = 1 
    //     if (line[2] === '1/2-1/2') line[2] = 0.5
    //     if (line[2] === '0-1') line[2] = 0
    
    //     return {fen: line[0], result: line[2]}
    // })
    
    positions = positions.map(e=>{
        let line = e.split(' [')
        
        if (line[1] === '1.0]') line[1] = 1 
        if (line[1] === '0.5]') line[1] = 0.5
        if (line[1] === '0.0]') line[1] = 0
        
        return {fen: line[0], result: line[1]}
    })

    positions = positions.filter(e=>(Math.random() < 0.9))
    console.log('Total positions', positions.length)
} 


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
    
        await AI.search(orobas, {seconds:0.2}).then(res=>{
            // console.log(i, res.sigmoid)
            sumOfSquares += ((positions[i].result - res.sigmoid)**2)
            if (i % 1000 === 0) console.log('position ' + i)
        })
    }

    return sumOfSquares
}

let print = ()=>{
    console.log('AI.PSQT_OPENING = ', JSON.stringify(opening))
    console.log('AI.PSQT_LATE_ENDGAME = ', JSON.stringify(endgame))

    console.log('AI.POV = ', JSON.stringify(pov))
    console.log('AI.PEV = ', JSON.stringify(pev))
    console.log('AI.BISHOP_PAIR = ', JSON.stringify(bishoppair))
    console.log('AI.DEFENDED_VALUES = ', JSON.stringify(defended))
    console.log('AI.BLOCKEDPAWNBONUS = ', JSON.stringify(blocked))
    console.log('AI.DEFENDEDPAWNBONUS = ', JSON.stringify(defendedbonus))
    console.log('AI.ALIGNEDPAWNBONUS = ', JSON.stringify(aligned))
    console.log('AI.NEIGHBOURPAWNBONUS = ', JSON.stringify(neighbour))
    console.log('AI.LEVERPAWNBONUS = ', JSON.stringify(lever))
    console.log('AI.PASSERSBONUS = ', JSON.stringify(passers))
    console.log('AI.DOUBLEDPENALTY = ', JSON.stringify(doubled))
    console.log('AI.OUTPOSTBONUSKNIGHT = ', JSON.stringify(outpostknight))
    console.log('AI.OUTPOSTBONUSBISHOP = ', JSON.stringify(outpostbishop))
    console.log('AI.ATTACKING_PIECES = ', JSON.stringify(attacking))
    console.log('AI.PAWNSHIELD = ', JSON.stringify(shield))
    console.log('AI.PAR = ', JSON.stringify(par))
    console.log('AI.MOB = ', JSON.stringify(mob))
}

let opening = JSON.parse(JSON.stringify(AI.PSQT_OPENING))
let endgame = JSON.parse(JSON.stringify(AI.PSQT_LATE_ENDGAME))
let pov = JSON.parse(JSON.stringify(AI.POV))
let pev = JSON.parse(JSON.stringify(AI.PEV))
let bishoppair = JSON.parse(JSON.stringify(AI.BISHOP_PAIR))

let defended = JSON.parse(JSON.stringify(AI.DEFENDED_VALUES))
let blocked = JSON.parse(JSON.stringify(AI.BLOCKEDPAWNBONUS))
let defendedbonus = JSON.parse(JSON.stringify(AI.DEFENDEDPAWNBONUS))
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

let originalS2 = Infinity

let iterate = async ()=>{
    while (true) {
        getPositions()
    
        for (let i = 0; i < 100; i++) {
            console.log('ITERATION ' + i)
            
            console.log(AI.POV, AI.PEV, AI.PAWNSHIELD)
            
            let better = false
            let attempts = 0
            
            attempts++
            AI.PSQT_OPENING = JSON.parse(JSON.stringify(opening))
            AI.PSQT_LATE_ENDGAME = JSON.parse(JSON.stringify(endgame))
    
            AI.POV = JSON.parse(JSON.stringify(pov))
            AI.PEV = JSON.parse(JSON.stringify(pev))
    
            AI.BISHOP_PAIR = JSON.parse(JSON.stringify(bishoppair))
    
            AI.DEFENDED_VALUES = JSON.parse(JSON.stringify(defended))
            AI.BLOCKEDPAWNBONUS = JSON.parse(JSON.stringify(blocked))
            AI.DEFENDEDPAWNBONUS = JSON.parse(JSON.stringify(defendedbonus))
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
            
            if (true) {
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
    
                AI.POV = AI.POV.map((e,i)=>(e === null || i === 2? e : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.PEV = AI.PEV.map((e,i)=>(e === null || i === 2? e : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
    
                AI.BISHOP_PAIR = AI.BISHOP_PAIR.map(e=>(Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
    
                AI.DEFENDED_VALUES = AI.DEFENDED_VALUES.map(e=>(Math.random()<0.5? e + 1 : e - 1))
                AI.BLOCKEDPAWNBONUS = AI.BLOCKEDPAWNBONUS.map(e=>(e === null? null : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.DEFENDEDPAWNBONUS = AI.DEFENDEDPAWNBONUS.map(e=>(e === null? null : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.ALIGNEDPAWNBONUS = AI.ALIGNEDPAWNBONUS.map(e=>(e === null? null : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.NEIGHBOURPAWNBONUS = AI.NEIGHBOURPAWNBONUS.map(e=>(e === null? null : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.LEVERPAWNBONUS = AI.LEVERPAWNBONUS.map(e=>(e === null? null : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.PASSERSBONUS = AI.PASSERSBONUS.map(e=>(e === null? null : Math.random()<0.5? e + 1 : e - 1))
                AI.DOUBLEDPENALTY = AI.DOUBLEDPENALTY.map(e=>(e === null? null : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.OUTPOSTBONUSKNIGHT = AI.OUTPOSTBONUSKNIGHT.map(e=>(e === null? null : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.OUTPOSTBONUSBISHOP = AI.OUTPOSTBONUSBISHOP.map(e=>(e === null? null : Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                // AI.ATTACKING_PIECES = AI.ATTACKING_PIECES.map(e=>(e === null? null : Math.random()<0.5? e + 1 : e - 1))
                AI.PAWNSHIELD = AI.PAWNSHIELD.map(e=>(Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
    
                AI.PAR = AI.PAR.map(e=>(Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
    
                AI.MOB[N] = AI.MOB[N].map(e=>(Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.MOB[B] = AI.MOB[B].map(e=>(Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.MOB[R] = AI.MOB[R].map(e=>(Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
                AI.MOB[Q] = AI.MOB[Q].map(e=>(Math.random()<0.5? e + 1 : (e > 0? e - 1 : 0)))
            }
        
            let sumOfSquares = await texel(positions)

            if (i === 0) originalS2 = sumOfSquares
    
            if (sumOfSquares < originalS2) {
                
                better = true
                console.log('New:', AI.POV, AI.PEV, AI.PAWNSHIELD)
                console.log(originalS2, sumOfSquares, 'Better')
    
                // console.log(opening.map(piece=>{
                //     if (piece === null) return null
                
                //     return piece.reduce((a,b)=>(a+b))
                // }))
                
                originalS2 = sumOfSquares
    
                opening = JSON.parse(JSON.stringify(AI.PSQT_OPENING))
                endgame = JSON.parse(JSON.stringify(AI.PSQT_LATE_ENDGAME))
    
                pov = JSON.parse(JSON.stringify(AI.POV))
                pev = JSON.parse(JSON.stringify(AI.PEV))
    
                bishoppair = JSON.parse(JSON.stringify(AI.BISHOP_PAIR))
    
                defended = JSON.parse(JSON.stringify(AI.DEFENDED_VALUES))
                blocked = JSON.parse(JSON.stringify(AI.BLOCKEDPAWNBONUS))
                defendedbonus = JSON.parse(JSON.stringify(AI.DEFENDEDPAWNBONUS))
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

                print()
            } else {
                console.log(originalS2, sumOfSquares, 'No better')
            }
        }
    }
}

iterate()
