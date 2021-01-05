var express = require('express')
var cors = require('cors')
var app = express()

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.use(cors())

let Chess = require('./chess.js')
Chess.Bitboard = require('./bitboard.js')
Chess.Zobrist = require('./zobrist.js')
Chess.Move = require('./move.js')
Chess.Position = require('./position.js')
Chess.AI = require('./ai.js')

// console.log(Chess.AI)

let protochess = Chess.prototype
let protoposition = Chess.Position.prototype
let protobitboard = Chess.Bitboard.prototype
let protozobrist = Chess.Zobrist.prototype
let protomove = Chess.Move.prototype

app.post('/', function (req, res) {
  let chessboard = req.body.chessPosition
  let options = req.body.options

  Object.assign(chessboard.__proto__, protochess, protoposition, protobitboard, protozobrist, protomove)
  Chess.AI.search(chessboard, options).then(move=>{
  	res.send(move);
  })
});

app.listen(3011, function () {
  console.log('Example app listening on port 3011!');
});