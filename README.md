# ♘ Orobas Chess AI
v1.1.0

Orobas is a Chess AI created in 2020 for research and educational purposes, using pure javascript. The move generator is an old but beautifully written javascript project from @kbjorklu (https://github.com/kbjorklu/chess).

Orobas is itendend to be a Shanon's Type-B AI (https://www.chessprogramming.org/Type_B_Strategy) based on these ideas:

1. Positional moves are evaluated diligently only at the first one or two plies for every piece. Chess maneuvers of 3 or more moves are very rare.
2. Depth is important only if we are counting moves. So, a deep analysis must be made only in case of tactic moves (ie. checks, captures, promotions, pinning moves, etc.).
3. From 1 & 2, Orobas applies a massive prune of the tree based on the unlikelihood of making certain moves, and not based on the evaluation of the move itself. Although this behaviour is risky, Orobas hasn't show significant differences with these moves pruned or not.
4. Human analysis of chess positions is mostly based on the recognition of patterns. The next step in Orobas is to capture the sense of intuitiveness by adding an extra layer of analysis based on pattern recognition.

The main intention is not to create an AI that plays better than other chess engines nor even better than humans. The main goal of Orobas is to play LIKE humans do; this doesn't mean blunder by randomness once in a while; this means that if the engine eventually makes mistakes, it's because these errors emerge from the analysis, the same way mistakes emerge from the human thinking process, and not by programming it. A second goal is to achieve the maximum ELO at the least depth possible; better thinking, not more thinking.

--------------
## Features
* Principal Variation Search = Negamax + Alpha-Beta Pruning + Null Window Search.
* Quiescense Search with stand-pat pruning.
* Late move reductions.
* Check extensions.
* Futile pruning.
* Delta pruning on Quiescense Search.
* Reverse futility pruning (soft implementation of the null-move pruning).
* Fail-high reductions.
* Pre-processed Piece Square Tables (PSQT) at the begining of every search.
* Mobility analysis.
* General pawn structure analysis.
* Material evaluation, including valuation of pieces asymmetry (in order to avoid the exchange of 3 pawns for a knight).
* History heuristic, applied only to the actual position. No need for killer moves.
* Move ordering: 1) hash moves; 2) good captures; 3) history moves; 4) PSQT; 5) bad captures.
* Trasposition table.
* Iterative deepening.
* Internal Iterative Deepening.
* Phase detector without tapered eval.
* History reduction (actually set to 100%).
* MTD(f), but inactive due to some buggy behaviours related to the hash table. See https://www.chessprogramming.org/MTD(f)

### Orobas main ideas
* **Positional moves pruning**. If the pre-processor is complex enough and well tuned, the best positional move won't require a deep depth analysis (Capablanca once said "I see only one move ahead, but it is always the correct one"). The main idea is not to move a piece because the evaluation function returns a good score 20 plies ahead, but because it's very likely, given the experience and previuos knowledge, that this move gives an advantage later in the game. Human intuition, even if the move it's a evantually a bad move.
* **Late-bad-captures pruning**. Analyze bad captures near the root only.
* **History heuristic, only applied to the actual position**, with negative values on low-fails, and valuation not based on depth.
* **Piece-Square-Table for the opening**, with the most common moves. The idea is to achieve one move per-piece at the opening the same way humans do: Moving the obvious piece to the obvious place.
* **A maximum depth of 20 in the midgame**. According to Magnus Carlsen, 20 is the maximum number of moves he can see ahead. (This is coherent with: Ferreira, D. (2013). The Impact of the Search Depth on Chess Playing Strength. J. Int. Comput. Games Assoc., 36, 67-80).
* **Prune of unlikely moves** (in development). The idea is to emulate human thinking. Grandmasters can see a lot of moves ahead, but actually these moves are a combination of a few possible moves that are in front of their heads: one or two continous moves per piece; eventually a third move, but no more than that (at least in the midgame).
* **Analysis of common patterns** (not implemented yet). The idea is to evaluate positions based on common patterns like 6P1/5PBP/6K1L; GMs recognize chess positions and patterns very quickly, even if they are not exactly the same.

### To Do
* Passed/doubled/hanging pawns detection.
* Improve king safety.
* Move generation by stages (hash moves / tactival moves / killer moves? / quiet moves).
* Automated tuning of parameters.
* Book openings implementation.
* Recognition/valuation of popular pawn structures (like Maroczy Bind or Benoni's).
* Recognize the areas of the pawn structures when the action is going on, in order to achieve a better piece coordination.
* Improve move ordering even more.
* Remove stupid blunders like 1k3b1r/pppb1ppp/4p3/1Nr4n/2P5/1P1P1B1P/P1K2PPB/4R2R b - - 1 21 (in some iterations, the engine sacrifices a knight for nothing).
* Programming of anti-human and anti-computer strategies.
* Some way to soften the effect of the pre-processor in the hash table in order to avoid jumps in the score.
* Some way to reduce the odd-even effect.
* Some way to emulate human focus. For example, the greek gift sacrifice (rnbq1rk1/pppn1ppB/4p3/3pP3/1b1P4/2N2N2/PPP2PPP/R1BQK2R b KQ - 0 7); on the next 2 or 3 moves, the last of black's concerns will be the development of rook on a8, because the actual concern is to put black king in a safe position again.
* Some clever and cheap way to evaluate the loss of castling rights.
* Implementation of Best Node Search (https://en.wikipedia.org/wiki/Best_node_search).
* Implementation of neural network for evaluation and move ordering.
* Parallel tree search ("Parallel Randomized Best-First Minimax Search". Yaron Shoham, Sivan Toledo).
