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

let Chess = require('./orobas/orobas.js')

let fromto = [
  'a8','b8','c8','d8','e8','f8','g8','h8',    null,null,null,null,null,null,null,null,
  'a7','b7','c7','d7','e7','f7','g7','h7',    null,null,null,null,null,null,null,null,
  'a6','b6','c6','d6','e6','f6','g6','h6',    null,null,null,null,null,null,null,null,
  'a5','b5','c5','d5','e5','f5','g5','h5',    null,null,null,null,null,null,null,null,
  'a4','b4','c4','d4','e4','f4','g4','h4',    null,null,null,null,null,null,null,null,
  'a3','b3','c3','d3','e3','f3','g3','h3',    null,null,null,null,null,null,null,null,
  'a2','b2','c2','d2','e2','f2','g2','h2',    null,null,null,null,null,null,null,null,
  'a1','b1','c1','d1','e1','f1','g1','h1',    null,null,null,null,null,null,null,null,
]

Chess.AI = require('./orobas/aiC.js')

app.get('/', function (req, res) {
  if (req.query.fen) {
     let fen = req.query.fen

      Chess.loadFen(fen)

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