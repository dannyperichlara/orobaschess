# ♘ Orobas Chess Engine
v2.1.2

Orobas is a Chess-Engine created in 2020, written entirely in Javascript.

You can try Orobas in [45.58.62.235:3665](http://45.58.62.235:3665)

--------------
## FEATURES
* Mailbox 0x88 board
* MTD(f) (slightly modified in order to obtain PV Nodes). See https://www.chessprogramming.org/MTD(f)
* Quiescense Search with stand-pat pruning and delta pruning
* Piece-Square-Tables (PSQT) based on PeSTO
* Tapered Evaluation for PSQT and material
* Late move reductions (old Stockfish formula)
* Bad moves reductions
* Move count reductions
* Other reductions
* Late moves random pruning
* Mate-threath extensions
* Check extensions
* Futility pruning
* Static Null Move pruning (deactivated)
* Razoring
* Lazy evaluation
* Extended Null-Move Reductions
* Safe Mobility evaluation
* Center-control evaluation
* Pawn Shield evaluation
* Evaluation of some common patterns (rook trapped by a king, developing a bishop in front of pawn, etc.)
* Evaluation of king being attacked
* Passers evaluation
* Space gain evaluation
* Pawn structure analysis
* Zobrist hashing
* Transposition table with always-replace scheme
* Pawn hash table
* Static evaluation hash table
* History heuristic
* Killer heuristic
* Move ordering (fail-high on the first move > 90%):
  1. Hash moves
  2. Promotions
  3. Good captures
  4. Killer moves
  5. Bad captures
  6. History moves
  7. PSQT
* Iterative Deepening
* Internal Iterative Deepening
* Orobas considers 4 phases for several evaluation terms:
  * Phase 1: Opening
  * Phase 2: Midgame
  * Phase 3: Early endgame
  * Phase 4: Late endgame

## INNOVATIONS

1. Bad moves reductions: Orobas reduces by 4 the depth of moves to squares defended by enemy pawns
2. Late moves random pruning: This pruning technique is based on the observation that in MCTS, most of the moves are not even explored. Considering, algo, that most of the nodes fail-high on the first or the second move is very safe to prune 80% of moves in non PV-Nodes randomly after the 12th move.
3. Complex evaluation terms only for PV Nodes. This technique has proved to get more ELO than a full evaluation in every node.
4. MTD(f) with an initial window of beta-2. This allows to get PV-Nodes in order to evaluate more complex terms.
5. Null-Window-Factor. All evaluation values are divided by 20 in order to make the MTD(f) algorithm work faster.
6. Wide-Center-Control. For the evaluation of center control, Orobas considers a wide center (from c-file to f-file).

### To Do
* Piece lists
* Attack tables
* Fix En-Passant bugs
* Move generation by stages (hash moves / tactical moves / killer moves? / quiet moves).
* Automated tuning of parameters.
* Improve piece coordination
* Some way to reduce the odd-even effect
* Some clever and cheap way to evaluate the loss of castling rights
* Best Node Search (https://en.wikipedia.org/wiki/Best_node_search). This a fuzzy minimax algorithm. I once tried to implement it and effectively is faster than MTD(f) but because it doesn't deliver full information it's very expensive to retrieve the PV Nodes in order to calculate the more complex evaluation terms.
