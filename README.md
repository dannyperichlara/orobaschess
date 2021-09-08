# ♘ Orobas Chess Engine
v2.1.3

Orobas is a Chess-Engine created in 2020, written entirely in Javascript. You can try Orobas in http://45.58.62.235:3665

--------------
## Características (en inglés)
* Mailbox 0x88 board
* Principal Variation Search = Negamax + Alpha-Beta Pruning + Null Window Search + Aspiration Window
* Quiescense Search with stand-pat pruning and delta pruning
* Piece-Square-Tables based on PeSTO
* Tappered Eval (for PSQT only)
* Late move reductions and other reductions
* Move count reductions
* Mate-threath extensions
* Mate distance pruning
* Check extensions
* Futility pruning
* Static Null Move pruning (not working properly)
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
  * 1) Hash moves
  * 2) Promotions
  * 3) Good captures
  * 4) Killer moves
  * 5) Bad captures
  * 6) History moves
  * 7) PSQT
* Iterative Deepening
* Internal Iterative Deepening
* Phase detector without tapered eval. Orobas considers 4 phases for better piece and positional evaluation:
  * Phase 1: Opening
  * Phase 2: Midgame
  * Phase 3: Early endgame
  * Phase 4: Late endgame
* MTD(f) (slighly modified in order to obtain PV Nodes). See https://www.chessprogramming.org/MTD(f)

### To Do
* Piece lists
* Mate detection
* Attack tables
* Fix En-Passant bugs
* Move generation by stages (hash moves / tactical moves / killer moves? / quiet moves).
* Automated tuning of parameters.
* Improve piece coordination
* Improve move ordering even more (maybe with SEE)
* Some way to reduce the odd-even effect
* Some clever and cheap way to evaluate the loss of castling rights
* Implementation of Best Node Search (https://en.wikipedia.org/wiki/Best_node_search)
