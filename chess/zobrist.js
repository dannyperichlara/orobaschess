"use strict";

!function(a,b,c,d,e,f,g,h,i){function j(a){var b,c=a.length,e=this,f=0,g=e.i=e.j=0,h=e.S=[];for(c||(a=[c++]);d>f;)h[f]=f++;for(f=0;d>f;f++)h[f]=h[g=s&g+a[f%c]+(b=h[f])],h[g]=b;(e.g=function(a){for(var b,c=0,f=e.i,g=e.j,h=e.S;a--;)b=h[f=s&f+1],c=c*d+h[s&(h[f]=h[g=s&g+b])+(h[g]=b)];return e.i=f,e.j=g,c})(d)}function k(a,b){var c,d=[],e=typeof a;if(b&&"object"==e)for(c in a)try{d.push(k(a[c],b-1))}catch(f){}return d.length?d:"string"==e?a:a+"\0"}function l(a,b){for(var c,d=a+"",e=0;e<d.length;)b[s&e]=s&(c^=19*b[s&e])+d.charCodeAt(e++);return n(b)}function m(c){try{return o?n(o.randomBytes(d)):(a.crypto.getRandomValues(c=new Uint8Array(d)),n(c))}catch(e){return[+new Date,a,(c=a.navigator)&&c.plugins,a.screen,n(b)]}}function n(a){return String.fromCharCode.apply(0,a)}var o,p=c.pow(d,e),q=c.pow(2,f),r=2*q,s=d-1,t=c["seed"+i]=function(a,f,g){var h=[];f=1==f?{entropy:!0}:f||{};var o=l(k(f.entropy?[a,n(b)]:null==a?m():a,3),h),s=new j(h);return l(n(s.S),b),(f.pass||g||function(a,b,d){return d?(c[i]=a,b):a})(function(){for(var a=s.g(e),b=p,c=0;q>a;)a=(a+c)*d,b*=d,c=s.g(1);for(;a>=r;)a/=2,b/=2,c>>>=1;return(a+c)/b},o,"global"in f?f.global:this==c)};if(l(c[i](),b),g&&g.exports){g.exports=t;try{o=require("crypto")}catch(u){}}else h&&h.amd&&h(function(){return t})}(this,[],Math,256,6,52,"object"==typeof module&&module,"function"==typeof define&&define,"random");
Math.seedrandom('dannyman')

let Chess = require('./chess.js')

/**
 * Zobrist is a 64 bit Zobrist hash value.
 * Updates to the value can be easily reverted by making the same update again.
 * The idea is to maintain a hash of the chess position, so that detecting repeating states and caching information about seen states is faster.
 * The 64 bit value is implemented as two 32 bit integers, similarly to Bitboard.js.
 * @constructor
 * @param {number} low lower 32 bits of the 64 bit value
 * @param {number} high upper 32 bits of the 64 bit value
 * @see http://goo.gl/WNBQp (Zobrist hashing)
 */
let Zobrist = function(low, high) {
	/** @type {number} */
	this.low = low >>> 0;

	/** @type {number} */
	this.high = high >>> 0;
};

/** @enum {number} */
Zobrist.Count = {
	TURN: 1 * 2,
	PIECE_COLOR_SQUARE: 6 * 2 * 64 * 2,
	CASTLING_RIGHTS: 16 * 2,
	EN_PASSANT_FILE: 8 * 2
};

/** @enum {number} */
Zobrist.Position = {
	TURN: 0,
	PIECE_COLOR_SQUARE: Zobrist.Count.TURN,
	CASTLING_RIGHTS: Zobrist.Count.TURN + Zobrist.Count.PIECE_COLOR_SQUARE,
	EN_PASSANT_FILE: Zobrist.Count.TURN + Zobrist.Count.PIECE_COLOR_SQUARE + Zobrist.Count.CASTLING_RIGHTS
};

/**
 * @param {number} count
 * @return {!Array.<number>}
 */
Zobrist.createRandomValues = function(count) {
	var a = [];
	for (var i = 0; i < count; ++i) {
		a.push((1 + Math.random() * 0xFFFFFFFF) >>> 0);
	}
	return a;
};

/**
 * @const
 * @type {!Array.<number>}
 */
Zobrist.RANDOM_VALUES = Zobrist.createRandomValues(Zobrist.Position.EN_PASSANT_FILE + Zobrist.Count.EN_PASSANT_FILE);

/**
 * @return {!Zobrist}
 */
Zobrist.prototype.dup = function() {
	return new Zobrist(this.low, this.high);
};

/**
 * @return {number} 32 bit key
 */
Zobrist.prototype.getHashKey = function() {
	return (this.low ^ this.high) >>> 0;
};

/**
 * @param {!Zobrist} zobrist
 * @return {boolean}
 */
Zobrist.prototype.isEqual = function(zobrist) {
	return (this.low === zobrist.low && this.high === zobrist.high);
};

/**
 * Xors Zobrist.RANDOM_VALUES[position .. position + RANDOM_VALUES_PER_ITEM] into this Zobrist hash key.
 * @param {number} position
 * @return {!Zobrist} this
 */
Zobrist.prototype.update = function(position) {
	this.low = (this.low ^ Zobrist.RANDOM_VALUES[position]) >>> 0;
	this.high = (this.high ^ Zobrist.RANDOM_VALUES[position + 1]) >>> 0;
	return this;
};

/**
 * @return {!Zobrist} this
 */
Zobrist.prototype.updateTurn = function() {
	return this.update(Zobrist.Position.TURN);
};

/**
 * @param {!Chess.Piece} piece
 * @param {!Chess.PieceColor} color
 * @param {number} index 0-63
 * @return {!Zobrist} this
 */
Zobrist.prototype.updatePieceColorSquare = function(piece, color, index) {
	return this.update(Zobrist.Position.PIECE_COLOR_SQUARE + piece + color * 6 + index * 6 * 2);
};

/**
 * @param {!Chess.Piece} piece
 * @param {!Chess.PieceColor} color
 * @param {!Chess.Bitboard} bitboard
 * @return {!Zobrist} this
 */
Zobrist.prototype.updatePieceColorBitboard = function(piece, color, bitboard) {
	var bb = bitboard.dup();
	while (!bb.isEmpty()) {
		this.updatePieceColorSquare(piece, color, bb.extractLowestBitPosition());
	}
	return this;
};

/**
 * @param {number} castlingRights 0-15
 * @return {!Zobrist} this
 */
Zobrist.prototype.updateCastlingRights = function(castlingRights) {
	return this.update(Zobrist.Position.CASTLING_RIGHTS + castlingRights);
};

/**
 * @param {number} enPassantFile 0-7
 * @return {!Zobrist} this
 */
Zobrist.prototype.updateEnPassantFile = function(enPassantFile) {
	return this.update(Zobrist.Position.EN_PASSANT_FILE + enPassantFile);
};

/**
 * @param {number} enPassantSquare 0-63
 * @return {!Zobrist} this
 */
Zobrist.prototype.updateEnPassantSquare = function(enPassantSquare) {
	if (enPassantSquare >= 0) {
		return this.updateEnPassantFile(Chess.getFile(enPassantSquare));
	}
	return this;
};

module.exports = Zobrist