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

app.get('/', function (req, res) {

  let chessPosition = new Chess.Position()
  
    if (req.query.fen) {
        let fen = req.query.fen.split(' ')

        let board = fen[0]
        let turn = fen[1] === 'w'? 0 : 1
        let castling = fen[2]
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

        chessPosition.fillPiecesFromBitboards();
	      chessPosition.updateHashKey();

    }

  Chess.AI = require('./ai.js')

  let options = req.body.options
  
  Chess.AI.search(chessPosition, {
    seconds: req.query.seconds? req.query.seconds : null
  }).then(move=>{
  	res.send(move);
  })
});

app.listen(3667, function () {
  console.log('Example app listening on port 3667!');
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