var express = require('express')
var cors = require('cors')
var app = express()
// const fs = require("fs");

// const ChessTools = require('chess-tools');
// const OpeningBook = ChessTools.EPD
// const book = new OpeningBook();
// const fen = "rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq";
// const EPD_FILE_PATH = process.cwd() + "/perfect2017.epd"
// stream = fs.createReadStream(EPD_FILE_PATH)

// stream.on('open', function () {
//   // This just pipes the read stream to the response object (which goes to the client)
//   stream.pipe(res);
// });

// book.load_stream(stream);

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.use(cors())

let Chess = require('./orobas/chess.js')

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

Chess.AI = require('./orobas/aiC.js')

app.get('/', function (req, res) {
  if (req.query.fen) {

      let fen = req.query.fen.split(' ')

      let board = fen[0]
      let turn = fen[1] === 'w'? 1 : -1
      let castling = fen[2]
      let enpassantsquare = fen[3]
      let movenumber = fen[5]

      Chess.movenumber = movenumber
  
      let castlingRights = 0


      if (castling.indexOf('K') > -1) castlingRights ^= 8
      if (castling.indexOf('k') > -1) castlingRights ^= 4
      if (castling.indexOf('Q') > -1) castlingRights ^= 2
      if (castling.indexOf('q') > -1) castlingRights ^= 1
      
      Chess.castlingRights = [castlingRights]

      Chess.board = fen2board(board)

      Chess.changeTurn(turn)
      
      if (enpassantsquare !== '-') {
        Chess.enPassantSquare = [null]
      }

      Chess.draw()
  }

  let options = req.body.options
  
  Chess.AI.search(Chess, {
    seconds: req.query.seconds? req.query.seconds : null
  }).then(move=>{
  	res.send(move);
  })
});

app.listen(3666, function () {
  console.log('Example app listening on port 3666!');
});

let fen2board = function (fen) {
	let board = fen.replace(/1/g, '0')
				.replace(/2/g, '00')
				.replace(/3/g, '000')
				.replace(/4/g, '0000')
				.replace(/5/g, '00000')
				.replace(/6/g, '000000')
				.replace(/7/g, '0000000')
				.replace(/8/g, '00000000')

    board = board.replace(/\//g, '').split('')

    board = board.map(e=>{
      let piece = 0

      if (e === 'k') piece = -20
      if (e === 'q') piece =  -9
      if (e === 'r') piece =  -5
      if (e === 'b') piece =  -4
      if (e === 'n') piece =  -3
      if (e === 'p') piece =  -1
      if (e === 'K') piece =  20
      if (e === 'Q') piece =   9
      if (e === 'R') piece =   5
      if (e === 'B') piece =   4
      if (e === 'N') piece =   3
      if (e === 'P') piece =   1

      return piece 
    })

    let board0x88 = []

    for (let i in board) {
      if (i % 8 === 0 && i>0) board0x88 = [...board0x88, 0, 0, 0, 0, 0, 0, 0, 0]
      board0x88.push(board[i])
    }

    board0x88 = [...board0x88, 0, 0, 0, 0, 0, 0, 0, 0]

  return board0x88
}