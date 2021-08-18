# ♘ Orobas Chess Engine
v1.3.0

Orobas es un motor de Ajedrez creado en 2020 para fines educacionales y de investigación.

Puedes probar Orobas en http://45.58.62.235:3665

--------------
## Características (en inglés)
* Mailbox 0x88 board.
* Principal Variation Search = Negamax + Alpha-Beta Pruning + Null Window Search + Aspiration Window
* Quiescense Search with stand-pat pruning and delta pruning.
* Piece-Square-Tables based on PeSTO
* Late move reductions and other reductions.
* Move count reductions.
* Check extensions.
* Futility pruning.
* Razoring.
* Lazy evaluation
* Null-move heuristic.
* Mobility evaluation.
* Center control evaluation.
* Pawn shield evaluation.
* Evaluation of king being attacked
* Passers evaluation.
* Space evaluation (not fully tested)
* Basic pawn structure analysis (defended, doubled & passed pawns)
* Transposition table
* Pawn hash table
* Static evaluation hash table
* History heuristic
* Killer heuristic
* Move ordering (fail-high on the first move: 90%):
  * 1) Hash moves
  * 2) Promotions
  * 3) Good captures
  * 4) Killer moves
  * 5) Bad captures
  * 6) History moves
  * 7) PSQT
* Iterative Deepening.
* Internal Iterative Deepening.
* Phase detector without tapered eval. Orobas considers 4 phases for better piece and positional evaluation:
  * Phase 1: Opening
  * Phase 2: Midgame
  * Phase 3: Early endgame
  * Phase 4: Late endgame
* MTD(f), but inactive due to some buggy behaviours related to the hash table. See https://www.chessprogramming.org/MTD(f)

### To Do
* Piece lists
* Mate detection
* Isolated/hanging pawns detection.
* Attack tables
* Fix En-Passant bugs
* Move generation by stages (hash moves / tactical moves / killer moves? / quiet moves).
* Automated tuning of parameters.
* Better piece coordination.
* Improve move ordering even more.
* Some way to reduce the odd-even effect.
* Some clever and cheap way to evaluate the loss of castling rights.
* Implementation of Best Node Search (https://en.wikipedia.org/wiki/Best_node_search).
