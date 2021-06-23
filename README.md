# ♘ Orobas Chess AI
v1.3.0

Orobas es una Inteligencia Artificial de Ajedrez creada en 2020 para fines educacionales y de investigación. El generador de movimientos es externo, y pertenece a @kbjorklu (https://github.com/kbjorklu/chess).

--------------
## Características (en inglés)
* Principal Variation Search = Negamax + Alpha-Beta Pruning + Null Window Search.
* Quiescense Search with stand-pat pruning.
* Late move reductions.
* Check extensions.
* Futile pruning (deactivated).
* Delta pruning on Quiescense Search (deactivated).
* Reverse futility pruning (soft implementation of the null-move pruning).
* Fail-high reductions (deactivated).
* Type-B pruning
  * Late bad-captures pruning (deactivated)
  * Late quiet-moves pruning (deactivated)
* Pre-processed Piece Square Tables (PSQT) at the begining of every search.
* Mobility analysis.
* Basic king safety.
* Basic passers detection.
* Basic pawn structure analysis (defended, doubled & passed pawns)
* Pawn hash table
* History heuristic
* Killer heuristic
* Move ordering (fail-high on the first move: 90%):
  * 1) Hash moves
  * 2) Promotions
  * 3) Equal and good captures
  * 4) Killer moves
  * 5) Bad captures
  * 6) History moves
  * 7) PSQT
* Trasposition table.
* Iterative Deepening.
* Internal Iterative Deepening.
* Phase detector without tapered eval. Orobas considers 4 phases for better piece and positional evaluation:
  * Phase 1: Opening
  * Phase 2: Midgame
  * Phase 3: Early endgame
  * Phase 4: Late endgame
* History reduction (actually set to 100%).
* MTD(f), but inactive due to some buggy behaviours related to the hash table. See https://www.chessprogramming.org/MTD(f)

### To Do
* Mate detection
* Isolated/hanging pawns detection.
* Improve king safety.
* King pawn tropism.
* Static Exchange Evaluation (SEE) (or maybe not).
* Move generation by stages (hash moves / tactical moves / killer moves? / quiet moves).
* Automated tuning of parameters, ideally, not the dumb and slow Texel-tuning. A Temporal Difference Learning was applied in order to learn some parameter values, but without human intervention, the values tend to diverge at some point.
* Book openings implementation.
* Compute space gain.
* Better piece coordination.
* Improve move ordering even more (with SEE?).
* Programming of anti-human and anti-computer strategies.
* Some way to soften the effect of the pre-processor in the hash table in order to avoid jumps in the score.
* Some way to reduce the odd-even effect.
* Some clever and cheap way to evaluate the loss of castling rights.
* Implementation of Best Node Search (https://en.wikipedia.org/wiki/Best_node_search).
* Implementation of neural networks for evaluation or move ordering.
* Parallel tree search (maybe "Parallel Randomized Best-First Minimax Search". Yaron Shoham, Sivan Toledo).
