"use strict";

/**
 * Bitboard is an unsigned 64 bit integer, each bit representing a boolean value on the corresponding chessboard square.
 * The boolean values represent existence of a piece on the square.
 * The 64 bit unsigned integer is implemented as combination of two 32 bit unsigned integers.
 * @constructor
 * @param {number} low Lower 32 bits of the 64 bit value
 * @param {number} high Upper 32 bits of the 64 bit value
 * TODO: test using three numbers here instead of two: 31 bit integers are faster than 32 bit ones in chrome (https://v8-io12.appspot.com/#35)
 */
let Bitboard = function(low, high) {
	/**
	 * Lower 32 bits of the 64 bit value
	 * @type {number}
	 */
	this.low = low >>> 0;

	/**
	 * Upper 32 bits of the 64 bit value
	 * @type {number}
	 */
	this.high = high >>> 0;
};

/**
 * @see http://goo.gl/pyzBq (Bit Twiddling Hacks)
 * @see http://goo.gl/dnqDn (Bit-peeking bits of JavaScript)
 * @param {number} v 32 bit integer
 * @return {number} 0-32 number of bits set in v
 */
Bitboard.popcnt32 = function(v) {
	v >>>= 0;
	v -= (v >>> 1) & 0x55555555;
	v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
	return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
};

/**
 * @param {number} v 32 bit integer
 * @return {number} v with its lowest bit cleared
 */
Bitboard.popLowestBit32 = function (v) {
	v >>>= 0;
	return (v & (v - 1)) >>> 0;
};

/**
 * @param {number} v 32 bit integer, non-zero. Undefined behavior if v is zero.
 * @return {number} 0-31 Position of first set bit
 */
Bitboard.getLowestBitPosition32 = function(v) {
	v >>>= 0;
	return Bitboard.popcnt32((v & -v) - 1);
};

/** @return {number} 0-64 number of bits set in this Bitboard */
Bitboard.prototype.popcnt = function() {
	return Bitboard.popcnt32(this.low) + Bitboard.popcnt32(this.high);
};

/**
 * Clears the lowest set bit.
 * @return {!Bitboard} this with the lowest bit cleared
 */
Bitboard.prototype.popLowestBit = function() {
	if (this.low) {
		this.low = Bitboard.popLowestBit32(this.low);
	} else {
		this.high = Bitboard.popLowestBit32(this.high);
	}

	return this;
};

/** @return {number} 0-63 position of the first set bit. Undefined behavior if this Bitboard is empty. */
Bitboard.prototype.getLowestBitPosition = function() {
	if (this.low) {
		return Bitboard.getLowestBitPosition32(this.low);
	}

	return 32 + Bitboard.getLowestBitPosition32(this.high);
};

/**
 * Clears the lowest set bit and returns its position.
 * @return {number} 0-63 position of the first set bit. Undefined behavior if this Bitboard is empty.
 */
Bitboard.prototype.extractLowestBitPosition = function() {
	var index = this.getLowestBitPosition();
	this.popLowestBit();
	return index;
};

/** @return {boolean} true if all the bits in this Bitboard are zero */
Bitboard.prototype.isEmpty = function() {
	return !this.low && !this.high;
};

/**
 * @param {number} index 0-63
 * @return {boolean} true if the bit at index is 0
 */
Bitboard.prototype.isClear = function(index) {
	index >>>= 0;

	if (index < 32) {
		return !(this.low & (1 << index));
	}

	return !(this.high & (1 << (index - 32)));
};

/**
 * @param {number} index 0-63
 * @return {boolean} true if the bit at index is 1
 */
Bitboard.prototype.isSet = function(index) {
	return !this.isClear(index);
};

/**
 * @param {number} index 0-63
 * @return {!Bitboard} this or 1 << index
 */
Bitboard.prototype.setBit = function(index) {
	index >>>= 0;

	if (index < 32) {
		this.low = (this.low | (1 << index)) >>> 0;
	} else {
		this.high = (this.high | (1 << (index - 32))) >>> 0;
	}

	return this;
};

/**
 * @param {number} index 0-63
 * @return {!Bitboard} this and not 1 << index
 */
Bitboard.prototype.clearBit = function(index) {
	index >>>= 0;

	if (index < 32) {
		this.low = (this.low & ~(1 << index)) >>> 0;
	} else {
		this.high = (this.high & ~(1 << (index - 32))) >>> 0;
	}

	return this;
};

/**
 * @param {!Bitboard} other
 * @return {!Bitboard} this and other
 */
Bitboard.prototype.and = function(other) {
	this.low = (this.low & other.low) >>> 0;
	this.high = (this.high & other.high) >>> 0;

	return this;
};

/**
 * @param {!Bitboard} other
 * @return {!Bitboard} this and not other
 */
Bitboard.prototype.and_not = function(other) {
	this.low = (this.low & ~other.low) >>> 0;
	this.high = (this.high & ~other.high) >>> 0;

	return this;
};

/**
 * @param {!Bitboard} other
 * @return {!Bitboard} this or other
 */
Bitboard.prototype.or = function(other) {
	this.low = (this.low | other.low) >>> 0;
	this.high = (this.high | other.high) >>> 0;

	return this;
};

/**
 * @param {!Bitboard} other
 * @return {!Bitboard} this xor other
 */
Bitboard.prototype.xor = function(other) {
	this.low = (this.low ^ other.low) >>> 0;
	this.high = (this.high ^ other.high) >>> 0;

	return this;
};

/** @return {!Bitboard} not this */
Bitboard.prototype.not = function() {
	this.low = (~this.low) >>> 0;
	this.high = (~this.high) >>> 0;

	return this;
};

/**
 * Shifts this Bitboard left v bits. Undefined behavior if v is not in 0-63.
 * @param {number} v 0-63 number of bits to shift
 * @return {!Bitboard} this << v
 */
Bitboard.prototype.shl = function(v) {
	v >>>= 0;

	if (v > 31) {
		this.high = (this.low << (v - 32)) >>> 0;
		this.low = 0 >>> 0;
	} else if (v > 0) {
		this.high = ((this.high << v) | (this.low >>> (32 - v))) >>> 0;
		this.low = (this.low << v) >>> 0;
	}

	return this;
};

/**
 * Shifts this Bitboard right v bits. Undefined behavior if v is not in 0-63.
 * @param {number} v 0-63 number of bits to shift
 * @return {!Bitboard} this >>> v
 */
Bitboard.prototype.shr = function(v) {
	v >>>= 0;

	if (v > 31) {
		this.low = this.high >>> (v - 32);
		this.high = 0 >>> 0;
	} else if (v > 0) {
		this.low = ((this.low >>> v) | (this.high << (32 - v))) >>> 0;
		this.high >>>= v;
	}

	return this;
};

/**
 * Shifts this Bitboard left v bits, where v can be negative for right shift.
 * @param {number} v number of bits to shift
 * @return {!Bitboard} this << v
 */
Bitboard.prototype.shiftLeft = function(v) {
	if (v > 63 || v < -63) {
		this.low = this.high = 0 >>> 0;
	} else if (v > 0) {
		this.shl(v);
	} else if (v < 0) {
		this.shr(-v);
	}

	return this;
};

/**
 * @param {!Bitboard} other
 * @return {boolean} 'this' equals 'other'
 */
Bitboard.prototype.isEqual = function(other) {
	return this.low === other.low && this.high === other.high;
};

/** @return {!Bitboard} copy of this */
Bitboard.prototype.dup = function() {
	return Bitboard.make(this.low, this.high);
};

/**
 * @param {number} low Lower 32 bits of the 64 bit value
 * @param {number} high Upper 32 bits of the 64 bit value
 * @return {!Bitboard}
 */
Bitboard.make = function(low, high) {
	return new Bitboard(low, high);
};

/** @return {!Bitboard} bitboard of all zeros */
Bitboard.makeZero = function() {
	return Bitboard.make(0, 0);
};

/** @return {!Bitboard} bitboard of all ones */
Bitboard.makeOne = function() {
	return Bitboard.make(0xFFFFFFFF, 0xFFFFFFFF);
};

/** @return {!Bitboard} bitboard of ones in light (white) squares, zeros in dark (black) squares */
Bitboard.makeLightSquares = function() {
	return Bitboard.make(0x55AA55AA, 0x55AA55AA);
};

/** @return {!Bitboard} bitboard of ones in dark squares, zeros in light squares */
Bitboard.makeDarkSquares = function() {
	return Bitboard.make(0xAA55AA55, 0xAA55AA55);
};

/**
 * @param {number} file
 * @return {!Bitboard} bitboard of ones in file, zeros elsewhere
 */
Bitboard.makeFile = function(file) {
	return Bitboard.make(0x01010101, 0x01010101).shl(file);
};

/** @return {!Array.<!Bitboard>} bitboard for each file */
Bitboard.makeFiles = function() {
	var b = [];
	for (var i = 0; i < 8; ++i) {
		b.push(Bitboard.makeFile(i));
	}
	return b;
};

/**
 * @param {number} rank
 * @return {!Bitboard} bitboard of ones in rank, zeros elsewhere
 */
Bitboard.makeRank = function(rank) {
	return Bitboard.make(0xFF, 0).shl(rank * 8);
};

/** @return {!Array.<!Bitboard>} bitboard for each rank */
Bitboard.makeRanks = function() {
	var b = [];
	for (var i = 0; i < 8; ++i) {
		b.push(Bitboard.makeRank(i));
	}
	return b;
};

/**
 * @param {number} index 0-63
 * @return {!Bitboard} bitboard of 1 at index, zero elsewhere
 */
Bitboard.makeIndex = function(index) {
	return Bitboard.makeZero().setBit(index);
};

/** @return {!Array.<!Bitboard>} bitboard for each index */
Bitboard.makeIndices = function() {
	var b = [];
	for (var i = 0; i < 64; ++i) {
		b.push(Bitboard.makeIndex(i));
	}
	return b;
};

/**
 * 0 diagonal is the main diagonal, positive numbers are superdiagonals, negative numbers subdiagonals.
 * @param {number} diagonal (-7)-7
 * @return {!Bitboard} bitboard with ones on diagonal, zeros elsewhere
 */
Bitboard.makeDiagonal = function(diagonal) {
	return Bitboard.make(0x10204080, 0x01020408).and(Bitboard.makeOne().shiftLeft(diagonal * 8)).shiftLeft(diagonal);
};

/** @return {!Array.<!Bitboard>} bitboard for each diagonal */
Bitboard.makeDiagonals = function() {
	var b = [];
	for (var i = -7; i < 8; ++i) {
		b.push(Bitboard.makeDiagonal(i));
	}
	return b;
};

/**
 * 0 diagonal is the main antidiagonal, positive numbers are subantidiagonals (below the main antidiagonal on the chessboard), negative numbers superantidiagonals.
 * @param {number} antidiagonal (-7)-7
 * @return {!Bitboard} bitboard with ones on antidiagonal, zeros elsewhere
 */
Bitboard.makeAntidiagonal = function(antidiagonal) {
	return Bitboard.make(0x08040201, 0x80402010).and(Bitboard.makeOne().shiftLeft(-antidiagonal * 8)).shiftLeft(antidiagonal);
};

/** @return {!Array.<!Bitboard>} bitboard for each antidiagonal */
Bitboard.makeAntidiagonals = function() {
	var b = [];
	for (var i = -7; i < 8; ++i) {
		b.push(Bitboard.makeAntidiagonal(i));
	}
	return b;
};

/**
 * @see http://goo.gl/MRA5s (Knight Pattern)
 * @param {number} index 0-63 chessboard square of the knight
 * @return {!Bitboard} knight target squares
 */
Bitboard.makeKnightMovement = function(index) {
	var b = Bitboard.makeZero().setBit(index);
	var l1 = b.dup().shr(1).and_not(Bitboard.FILES[7]);
	var l2 = b.dup().shr(2).and_not(Bitboard.FILES[7]).and_not(Bitboard.FILES[6]);
	var r1 = b.dup().shl(1).and_not(Bitboard.FILES[0]);
	var r2 = b.dup().shl(2).and_not(Bitboard.FILES[0]).and_not(Bitboard.FILES[1]);
	var v1 = l2.or(r2);
	var v2 = l1.or(r1);
	return v1.dup().shl(8).or(v1.shr(8)).or(v2.dup().shl(16)).or(v2.shr(16));
};

/** @return {!Array.<!Bitboard>} bitboard for knight movement from each square */
Bitboard.makeKnightMovements = function() {
	var b = [];
	for (var i = 0; i < 64; ++i) {
		b.push(Bitboard.makeKnightMovement(i));
	}
	return b;
};

/**
 * @param {number} index 0-63 chessboard square of the king
 * @return {!Bitboard} king target squares
 */
Bitboard.makeKingMovement = function(index) {
	var b = Bitboard.makeZero().setBit(index);
	var c = b.dup().shr(1).and_not(Bitboard.FILES[7]).or(b.dup().shl(1).and_not(Bitboard.FILES[0]));
	var u = b.dup().or(c).shr(8);
	var d = b.dup().or(c).shl(8);
	return c.or(u).or(d);
};

/** @return {!Array.<!Bitboard>} bitboard for king movement from each square */
Bitboard.makeKingMovements = function() {
	var b = [];
	for (var i = 0; i < 64; ++i) {
		b.push(Bitboard.makeKingMovement(i));
	}
	return b;
};

/**
 * Bitboard of all zeros
 * @const
 * @type {!Bitboard}
 */
Bitboard.ZERO = Bitboard.makeZero();

/**
 * Bitboard of all ones
 * @const
 * @type {!Bitboard}
 */
Bitboard.ONE = Bitboard.makeOne();

/**
 * Bitboard of ones in light squares, zeros in dark squares
 * @const
 * @type {!Bitboard}
 */
Bitboard.LIGHT_SQUARES = Bitboard.makeLightSquares();

/**
 * Bitboard of ones in dark squares, zeros in light squares
 * @const
 * @type {!Bitboard}
 */
Bitboard.DARK_SQUARES = Bitboard.makeDarkSquares();

/**
 * Bitboards ones in corresponding file, zeros elsewhere
 * @const
 * @type {!Array.<!Bitboard>}
 */
Bitboard.FILES = Bitboard.makeFiles();

/**
 * Bitboards ones in corresponding rank, zeros elsewhere
 * @const
 * @type {!Array.<!Bitboard>}
 */
Bitboard.RANKS = Bitboard.makeRanks();

/**
 * Bitboards ones in corresponding diagonal, zeros elsewhere. Bitboard.DIAGONALS[7] = main diagonal, 0-6 = subdiagonals, 8-15 = superdiagonals
 * @const
 * @type {!Array.<!Bitboard>}
 */
Bitboard.DIAGONALS = Bitboard.makeDiagonals();

/**
 * Bitboards ones in corresponding antidiagonal, zeros elsewhere. Bitboard.ANTIDIAGONALS[7] = main antidiagonal, 0-6 = superantidiagonals, 8-15 = subantidiagonals
 * @const
 * @type {!Array.<!Bitboard>}
 */
Bitboard.ANTIDIAGONALS = Bitboard.makeAntidiagonals();

/**
 * 64 bitboards, one per chessboard square, for positions where knights can move from the corresponding square.
 * @const
 * @type {!Array.<!Bitboard>}
 */
Bitboard.KNIGHT_MOVEMENTS = Bitboard.makeKnightMovements();

/**
 * 64 bitboards, one per chessboard square, for positions where kings can move from the corresponding square.
 * @const
 * @type {!Array.<!Bitboard>}
 */
Bitboard.KING_MOVEMENTS = Bitboard.makeKingMovements();

module.exports = Bitboard