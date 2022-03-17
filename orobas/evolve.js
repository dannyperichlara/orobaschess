let orobas = require('./orobas.js')
let AI = require('./aiC.js')
const { board } = require('./orobas.js')

let populationLength = 20
let subPositions = 50000
let generations = 2

const WHITE = 1
const BLACK = 2

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

var fs = require('fs')

fs.appendFileSync('genetic_pìece_values.txt', '--------------\n', function (err) {
    if (err) return console.log(err)
})

let positions = []

let getPositions = ()=>{
    // positions = fs.readFileSync('orobasRandomPositionsDepth23.txt').toString().split("\n");
    positions = fs.readFileSync('orobasRandomPositions.txt').toString().split("\n");

    positions.pop()
    
    positions = positions.map(e=>{
        let line = e.split('\t')
        
        line[1] = parseInt(line[1])
        line[2] = parseFloat(line[2])
        
        return {fen: line[0], score: line[1], result: line[2]}
    })

    positions = positions.filter(e=>(Math.random() < subPositions/positions.length))
    console.log('Total positions', positions.length)
    // console.log(positions)
} 



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

let sumOfSquares = async ()=>{
    let sumOfSquares = 0
    
    for (let i = 0; i < positions.length; i++) {
    // for (let i = 0; i < 4; i++) {
        // orobas.init(true)
        orobas.loadFen(positions[i].fen)

        let sign = orobas.turn === WHITE? 1 : -1
        let score = sign * AI.nullWindowFactor * AI.evaluate(orobas, 4, -Infinity, Infinity, orobas.isKingInCheck(), false, 0)
        let sigmoid = 1 / (1 + Math.pow(10, -score / 354))

        // console.log(positions[i].score,score)

        // sumOfSquares += (positions[i].score - score)**2
        sumOfSquares += (positions[i].result - sigmoid)**2
    
        // await AI.search(orobas, {seconds:0.2}).then(res=>{
        //     // if (i % 100 === 0) console.log("Position " + i)
        //     // console.log(i, res.sigmoid)
        //     sumOfSquares += (positions[i].result - res.sigmoid)**2
        // })
    }

    return sumOfSquares
}

let random = (min, max) => {
    return Math.round(Math.random() * (max - min) + min)
}

let unique = (i, n, limit)=>{
    var arr = [];
    while(arr.length < n){
        var r = Math.floor(Math.random() * limit);
        if(r !== i && arr.indexOf(r) === -1) arr.push(r);
    }
    
    return arr
}

let maxFitness = -Infinity

evolve = async (par, limits)=>{
    let fitnessHashTable = {}
    let population = new Array(populationLength)
    

    // Se asegura que actual gen esté presente en la población
    population[0] = {
        par: eval(par),
        fitness: -Infinity
    }

    console.log(limits)

    // Creates population
    for (let i = 1; i < population.length; i++) {
        population[i] = {
            par: eval(par).map((e, j)=>{
                return (e === null? e : random(limits[j][0], limits[j][1]))
            }),
            fitness: -Infinity
        }
    }

    for (let g = 0; g < generations; g++) {
        console.log('GENERACIÓN ' + (g + 1))

        // Fitness of population
        for (let i = 0; i < population.length; i++) {
            eval(par + " = population[i].par")
            console.log(par, eval(par), 'Evaluating fitness of ' + i)

            AI.createPieceValues()

            let key = par+JSON.stringify(population[i].par)

            let fitness = fitnessHashTable[key]

            if (!fitness) {
                fitness = -(await sumOfSquares())
                fitnessHashTable[key] = fitness
                population[i].hash = false
            } else {
                population[i].hash = true
            }
    
            population[i].fitness = fitness
        }
        
        for (let i = 0; i < population.length; i++) {
            let diffIndexes = unique(i, 3, population.length)
            
            //Creación de vectores ruidosos
            let trial = {par:population[diffIndexes[0]].par.map((e,j)=>{
                return e === null? null : e + 0.5*(population[diffIndexes[1]].par[j] - population[diffIndexes[2]].par[j]) | 0
            }), fitness: -Infinity}

            //Verifica límites
            trial.par = trial.par.map((e,j)=>{
                let min = limits[j][0]
                let max = limits[j][1]

                return e === null? null : e < min? min : (e > max? max : e)
            })

            //Recombinación
            trial.par = trial.par.map((e, j)=>{
                return Math.random() < 0.7? e : population[i].par[j]
            })

            eval(par + " = trial.par")
            console.log(eval(par), 'Evaluating fitness of trial ' + i)

            AI.createPieceValues()
    
            let key = par+JSON.stringify(trial.par)

            let fitness = fitnessHashTable[key]

            if (!fitness) {
                fitness = -(await sumOfSquares())
                fitnessHashTable[key] = fitness
                trial.hash = false
            } else {
                trial.hash = true
            }

            trial.fitness = fitness
    
            if (trial.fitness > population[i].fitness) {
                population[i] = trial
            }
        }


        let parentSelection = new Array(population.length)
    
        // Tournament selection
        for (let i = 0; i < population.length; i++) {
            let candidate1 = Math.random() * population.length | 0
            let candidate2 = Math.random() * population.length | 0
            let candidate3 = Math.random() * population.length | 0

            let winner = [
                population[candidate1],
                population[candidate2],
                population[candidate3]
            ].sort((a,b)=>{
                return b.fitness - a.fitness
            })[0]

            parentSelection[i] = winner
        }

        parentSelection.sort((a,b)=>{
            return b.fitness - a.fitness
        })

        if (true || parentSelection[0].fitness > maxFitness) {
            maxFitness = parentSelection[0].fitness
            eval(par + ' = ' + JSON.stringify(parentSelection[0].par))

            fs.appendFileSync(
                'genetic_pìece_values.txt',
                parentSelection[0].fitness + '|' + g + '|' + par + ' = ' + JSON.stringify(parentSelection[0].par) + '\n',
                function (err) {
                    if (err) return console.log(err);
                    console.log('Appended!')
                }
            )
        }

    
        // Crossover

        let children = new Array(parentSelection.length)
    
        for (let i = 0; i < parentSelection.length; i++) {
            children[i] = child(
                parentSelection[Math.random()*(parentSelection.length) | 0],
                parentSelection[Math.random()*(parentSelection.length) | 0],
                limits
            )
        }
    
        population = children
    }

    console.log('Done --------------------------------')
}

child = (parent1, parent2, limits)=> {
    let child = {
        par: new Array(parent1.par.length).fill(null),
        fitness: -Infinity
    }
    
    let par = child.par.map((e,i)=>{
        return (Math.random()>0.5? parent1.par[i] : parent2.par[i])
    })

    // Local mutation
    par = par.map((e, i)=>{
        let min = limits[i][0]
        let max = limits[i][1]
        
        return (Math.random() > 0.9 && e !== null? random(min, max) : e)
    })

    child.par = par

    return child
}

let iterate = async ()=>{
    getPositions()
    
    while (true) {
        // await evolve("AI.PSQT_LATE_ENDGAME[P]", -50, 50)
        // await evolve("AI.PSQT_LATE_ENDGAME[R]", -50, 50)
        // await evolve("AI.PSQT_LATE_ENDGAME[N]", -50, 50)
        // await evolve("AI.PSQT_LATE_ENDGAME[B]", -50, 50)
        // await evolve("AI.PSQT_LATE_ENDGAME[Q]", -50, 50)
        
        // await evolve("AI.PSQT_OPENING[N]", -50, 50)
        // await evolve("AI.PSQT_OPENING[B]", -50, 50)
        // await evolve("AI.PSQT_OPENING[R]", -50, 50)
        // await evolve("AI.PSQT_OPENING[Q]", -50, 50)
        // await evolve("AI.PSQT_OPENING[P]", -50, 50)

        // await evolve("AI.PSQT_LATE_ENDGAME[K]", -50, 50)
        // await evolve("AI.PSQT_OPENING[K]", -50, 50)

        await evolve("AI.POV", [[null, null], [100,100], [280, 450], [280, 450], [500, 750], [1200, 1400]])
        await evolve("AI.PEV", [[null, null], [100,100], [280, 450], [280, 450], [500, 750], [1200, 1400]])

        // await evolve("AI.MOB[R]", 0, 400)
        // await evolve("AI.MOB[N]", 0, 400)
        // await evolve("AI.MOB[B]", 0, 400)
        // await evolve("AI.MOB[Q]", 0, 400)

        // await evolve("AI.DEFENDEDPAWNBONUS", 0, 100)
        // await evolve("AI.DEFENDED_VALUES", 0, 100)

        // await evolve("AI.PASSERSBONUS", 0, 200)

        // await evolve("AI.DOUBLEDPENALTY", 0, 100)
        // await evolve("AI.LEVERPAWNBONUS", 0, 100)
        // await evolve("AI.ALIGNEDPAWNBONUS", 0, 100)
        // await evolve("AI.NEIGHBOURPAWNBONUS", 0, 100)
        // await evolve("AI.BLOCKEDPAWNBONUS", 0, 100)

        // await evolve("AI.OUTPOSTBONUSKNIGHT", 0, 100)
        // await evolve("AI.OUTPOSTBONUSBISHOP", 0, 100)

        // await evolve("AI.BISHOP_PAIR", 0, 100)
        // await evolve("AI.PAWNSHIELD", 0, 100)
        // await evolve("AI.PAR", 0, 100)
        // await evolve("AI.ATTACKING_PIECES", 0, 400)
    }
}

iterate()