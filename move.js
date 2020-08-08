"use strict";

let Chess = require('./chess.js')

/**
 * Representation of a chess move; a piece moves from square to another, possibly capturing another piece in the process.
 * @constructor
 * @param {number} from 0-63
 * @param {number} to 0-63
 * @param {!Move.Kind} kind
 * @param {!Chess.Piece} piece moving piece
 * @param {?Chess.Piece} capturedPiece N.B. null is stored as pawn
 */
let Move = function(from, to, kind, piece, capturedPiece) {
	/**
	 * An integer value containing the source and destination square indices, the move kind, the moving piece, etc.
	 * @type {number}
	 */
	this.value = (to & 0x3F) | ((from & 0x3F) << 6) | ((kind & 0xF) << 12) | ((piece & 0x7) << 16) | (((capturedPiece | 0) & 0x7) << 19);
};

/**
 * @enum {number}
 * @see http://goo.gl/z5Rpl (Encoding Moves)
 */
Move.Kind = {
	POSITIONAL: 0,
	DOUBLE_PAWN_PUSH: 1,
	KING_CASTLE: 2, // kingside castle
	QUEEN_CASTLE: 3, // queenside castle
	CAPTURE: 4,
	EN_PASSANT_CAPTURE: 5,
	KNIGHT_PROMOTION: 8,
	BISHOP_PROMOTION: 9,
	ROOK_PROMOTION: 10,
	QUEEN_PROMOTION: 11,
	KNIGHT_PROMOTION_CAPTURE: 12,
	BISHOP_PROMOTION_CAPTURE: 13,
	ROOK_PROMOTION_CAPTURE: 14,
	QUEEN_PROMOTION_CAPTURE: 15
};

/** @return {number} 0-63 */
Move.prototype.getTo = function() {
	return this.value & 0x3F;
};

/** @return {number} 0-63 */
Move.prototype.getFrom = function() {
	return (this.value >>> 6) & 0x3F;
};

/** @return {!Move.Kind} */
Move.prototype.getKind = function() {
	return /** @type {!Move.Kind} */ ((this.value >>> 12) & 0xF);
};

/** @return {!Chess.Piece} */
Move.prototype.getPiece = function() {
	return /** @type {!Chess.Piece} */ ((this.value >>> 16) & 0x7);
};

/** @return {boolean} */
Move.prototype.isCapture = function() {
	return !!(this.getKind() & 4);
};

/**
 * @return {!Chess.Piece}
 */
Move.prototype.getCapturedPiece = function() {
	return /** @type {!Chess.Piece} */ ((this.value >>> 19) & 0x7);
};

/** @return {boolean} */
Move.prototype.isPromotion = function() {
	return !!(this.getKind() & 8);
};

/** @return {boolean} */
Move.prototype.isCastle = function() {
	return this.getKind() === Move.Kind.KING_CASTLE || this.getKind() === Move.Kind.QUEEN_CASTLE;
};

/** @return {!Chess.Piece} */
Move.prototype.getPromotedPiece = function() {
	if (this.isPromotion()) {
		return /** @type {!Chess.Piece} */ (Chess.Piece.KNIGHT + (this.getKind() & 3));
	}

	return Chess.Piece.PAWN;
};

/** @return {number} 0-63 */
Move.prototype.getCaptureSquare = function() {
	if (this.getKind() !== Move.Kind.EN_PASSANT_CAPTURE) {
		return this.getTo();
	}

	return this.getTo() + ((this.getFrom() < this.getTo()) ? -Chess.FILES : Chess.FILES);
};

/**
 * @return {string} long algebraic notation
 * @see http://goo.gl/h8hhf (Long algebraic notation)
 * We don't require the chess position here, so shorter notation is not used, and check, checkmate and game end are not reported.
 */
Move.prototype.getString = function() {
	if (!this.isCastle()) {
		return Chess.PIECE_ALGEBRAIC_NAMES.charAt(this.getPiece()) +
			(this.getPiece > 0 || this.isCapture() ? Chess.getAlgebraicFromIndex(this.getFrom()) : '') +
			(this.isCapture() ? "x" : "") +
			Chess.getAlgebraicFromIndex(this.getTo()) +
			((this.getKind() === Move.Kind.EN_PASSANT_CAPTURE) ? "e.p." : "") +
			(this.isPromotion() ? Chess.PIECE_ALGEBRAIC_NAMES.charAt(this.getPromotedPiece()) : "");
	}

	return "0-0" + ((this.getKind() === Move.Kind.QUEEN_CASTLE) ? "-0" : "");
};

module.exports = Move