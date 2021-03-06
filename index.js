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

let Chess = require('./chess/chess.js')
    Chess.Bitboard = require('./chess/bitboard.js')
    Chess.Zobrist = require('./chess/zobrist.js')
    Chess.Move = require('./chess/move.js')
    Chess.Position = require('./chess/position.js')

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

// const tf = require('@tensorflow/tfjs');

// require('@tensorflow/tfjs-node')

// let model = null

// loadModel = async ()=> {
//     model = await tf.loadLayersModel("file://orobas/neural/model.json")
// }

// loadModel()

app.get('/', function (req, res) {

  let chessPosition = new Chess.Position()
  
    if (req.query.fen) {

        let fen = req.query.fen.split(' ')

        let board = fen[0]
        let turn = fen[1] === 'w'? 0 : 1
        let castling = fen[2]
        let enpassantsquare = fen[3]
        let movenumber = fen[5]

    //  * 1st bit: white can castle kingside
	  //  * 2nd bit: black can castle kingside
	  //  * 3rd bit: white can castle queenside
	  //  * 4th bit: black can castle queenside
    //  * @type {number} 0-15
    
        let castlingRights = 0

        if (castling.indexOf('K') > -1) castlingRights +=    1
        if (castling.indexOf('k') > -1) castlingRights +=   10
        if (castling.indexOf('Q') > -1) castlingRights +=  100
        if (castling.indexOf('q') > -1) castlingRights += 1000
        
        chessPosition.bitboards = fen2bitboards(board)
        chessPosition.movenumber = parseInt(movenumber)

        chessPosition.setTurnColor(turn)

        castlingRights = parseInt(castlingRights.toString(), 2)
        chessPosition.castlingRights = castlingRights

        
        if (enpassantsquare !== '-') {
          chessPosition.enPassantSquare = fromto.indexOf(enpassantsquare)
          // console.log('enpassant', chessPosition.enPassantSquare)
  
          //En passant squares are defined different from FEN in the move generator:
          if (turn === 0) chessPosition.enPassantSquare -= 8
          if (turn === 1) chessPosition.enPassantSquare += 8
        }

        chessPosition.fillPiecesFromBitboards();
	      chessPosition.updateHashKey();

    }

  Chess.AI = require('./orobas/aiC.js')

  let options = req.body.options
  
  Chess.AI.search(chessPosition, {
    seconds: req.query.seconds? req.query.seconds : null
  }/*, tf, model*/).then(move=>{
  	res.send(move);
  })
});

app.listen(3666, function () {
  console.log('Example app listening on port 3666!');
});

let fen2bitboards = function (board) {
	let B = board.replace(/1/g, '0')
				.replace(/2/g, '00')
				.replace(/3/g, '000')
				.replace(/4/g, '0000')
				.replace(/5/g, '00000')
				.replace(/6/g, '000000')
				.replace(/7/g, '0000000')
				.replace(/8/g, '00000000')

    B = B.split('/')
    
    B = B.map(e=>{
        return e.split('').reverse().join('')
    })
    
    B = B.join('')

	let bitboards = {
		black: B.replace(/[^a-z^//]/g, '0').replace(/[a-z]/g, '1').replace(/[//]/g,''),
		white: B.replace(/[^A-Z^//]/g, '0').replace(/[A-Z]/g, '1').replace(/[//]/g,''),
		WP: B.replace(/[^P^//]/g, '0').replace(/[P]/g, '1').replace(/[//]/g,''),
		WN: B.replace(/[^N^//]/g, '0').replace(/[N]/g, '1').replace(/[//]/g,''),
		WB: B.replace(/[^B^//]/g, '0').replace(/[B]/g, '1').replace(/[//]/g,''),
		WR: B.replace(/[^R^//]/g, '0').replace(/[R]/g, '1').replace(/[//]/g,''),
		WQ: B.replace(/[^Q^//]/g, '0').replace(/[Q]/g, '1').replace(/[//]/g,''),
    WK: B.replace(/[^K^//]/g, '0').replace(/[K]/g, '1').replace(/[//]/g,''),
		BP: B.replace(/[^p^//]/g, '0').replace(/[p]/g, '1').replace(/[//]/g,''),
		BN: B.replace(/[^n^//]/g, '0').replace(/[n]/g, '1').replace(/[//]/g,''),
		BB: B.replace(/[^b^//]/g, '0').replace(/[b]/g, '1').replace(/[//]/g,''),
		BR: B.replace(/[^r^//]/g, '0').replace(/[r]/g, '1').replace(/[//]/g,''),
		BQ: B.replace(/[^q^//]/g, '0').replace(/[q]/g, '1').replace(/[//]/g,''),
		BK: B.replace(/[^k^//]/g, '0').replace(/[k]/g, '1').replace(/[//]/g,'')
  }

  
	bitboards = {
		black: {low: parseInt(bitboards.black.substr(32, 32), 2), high: parseInt(bitboards.black.substr(0,32), 2)},
		white: {low: parseInt(bitboards.white.substr(32, 32), 2), high: parseInt(bitboards.white.substr(0,32), 2)},
		WP: {low: parseInt(bitboards.WP.substr(32, 32), 2), high: parseInt(bitboards.WP.substr(0,32), 2)},
		WN: {low: parseInt(bitboards.WN.substr(32, 32), 2), high: parseInt(bitboards.WN.substr(0,32), 2)},
		WB: {low: parseInt(bitboards.WB.substr(32, 32), 2), high: parseInt(bitboards.WB.substr(0,32), 2)},
		WR: {low: parseInt(bitboards.WR.substr(32, 32), 2), high: parseInt(bitboards.WR.substr(0,32), 2)},
		WQ: {low: parseInt(bitboards.WQ.substr(32, 32), 2), high: parseInt(bitboards.WQ.substr(0,32), 2)},
		WK: {low: parseInt(bitboards.WK.substr(32, 32), 2), high: parseInt(bitboards.WK.substr(0,32), 2)},
		BP: {low: parseInt(bitboards.BP.substr(32, 32), 2), high: parseInt(bitboards.BP.substr(0,32), 2)},
		BN: {low: parseInt(bitboards.BN.substr(32, 32), 2), high: parseInt(bitboards.BN.substr(0,32), 2)},
		BB: {low: parseInt(bitboards.BB.substr(32, 32), 2), high: parseInt(bitboards.BB.substr(0,32), 2)},
		BR: {low: parseInt(bitboards.BR.substr(32, 32), 2), high: parseInt(bitboards.BR.substr(0,32), 2)},
		BQ: {low: parseInt(bitboards.BQ.substr(32, 32), 2), high: parseInt(bitboards.BQ.substr(0,32), 2)},
		BK: {low: parseInt(bitboards.BK.substr(32, 32), 2), high: parseInt(bitboards.BK.substr(0,32), 2)},
  }
  
  let pawns = new Chess.Bitboard(bitboards.WP.low | bitboards.BP.low, bitboards.WP.high | bitboards.BP.high )
  let knights = new Chess.Bitboard(bitboards.WN.low | bitboards.BN.low, bitboards.WN.high | bitboards.BN.high )
  let bishops = new Chess.Bitboard(bitboards.WB.low | bitboards.BB.low, bitboards.WB.high | bitboards.BB.high )
  let rooks = new Chess.Bitboard(bitboards.WR.low | bitboards.BR.low, bitboards.WR.high | bitboards.BR.high )
  let queens = new Chess.Bitboard(bitboards.WQ.low | bitboards.BQ.low, bitboards.WQ.high | bitboards.BQ.high )
  let kings = new Chess.Bitboard(bitboards.WK.low | bitboards.BK.low, bitboards.WK.high | bitboards.BK.high )
  let white = new Chess.Bitboard(bitboards.white.low, bitboards.white.high)
  let black = new Chess.Bitboard(bitboards.black.low, bitboards.black.high)
  
  return [
    pawns, // pawns
    knights, // knights
    bishops, // bishops
    rooks, // rooks
    queens, // queens
    kings, // kings
    white, // white pieces
    black // black pieces
  ];
}