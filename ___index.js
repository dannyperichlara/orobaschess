var express = require('express')
var cors = require('cors')
var app = express()

app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.use(cors())

let Chess = require('./orobas/chess.js')
Chess.AI = require('./orobas/aiC.js')

console.log(Chess.AI)

let fromto = [
  'a1','b1','c1','d1','e1','f1','g1','h1',
  'a2','b2','c2','d2','e2','f2','g2','h2',
  'a3','b3','c3','d3','e3','f3','g3','h3',
  'a4','b4','c4','d4','e4','f4','g4','h4',
  'a5','b5','c5','d5','e5','f5','g5','h5',
  'a6','b6','c6','d6','e6','f6','g6','h6',
  'a7','b7','c7','d7','e7','f7','g7','h7',
  'a8','b8','c8','d8','e8','f8','g8','h8',
]

app.get('/', function (req, res) {
  let command = req.query.command

  if (command == 'think') {
    Chess.AI.search({
      depth: 4
    }).then(move=>{
      res.send(move);
      return
    })
  }

  if (command == 'new') {
    Chess.init()
  }

  if (command == 'move') {
    let moves = Chess.getMoves()

    let from = Chess.board0x88[req.query.from]
    let to = Chess.board0x88[req.query.to]

    if (typeof from !== 'undefined' && typeof to !== 'undefined') {
      moves = moves.filter(m=>{
        return m.from === from && m.to === to
      })

      if (moves.length ===1) {
        Chess.makeMove(moves[0])

        Chess.draw()

        res.send({moved: true})

        return
      } else if (moves.length > 1) {
        console.log('Más de 1 movimiento')
      } else {
        console.log('No existe el movimiento')
      }
    } else {
      console.log('Falta parámetro from o to')
    }
  }
  
});

app.listen(3666, function () {
  console.log('Orobas listening on port 3666!');
});