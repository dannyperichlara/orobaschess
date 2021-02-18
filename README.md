# Orobas Chess AI
v1.1.0

Orobas is a chess engine A.I. created in 2020 using only javascript. The move generator is an old but beautifully written javascript project from @kbjorklu (https://github.com/kbjorklu/chess).

Orobas is a Shanon's Type-B A.I. based on these human thinking ideas:

1. Positional moves are evaluated diligently only at the first one or two plies for every piece. Chess maneuvers of 3 or more moves are very rare.
2. Depth is important only if we are counting moves. So, a deep analysis must be made only in case of tactic moves (ie. checks, captures, promotions, pinning moves, erratic moves from the opponent, etc.).
3. Human analysis of chess positions is mostly based on the recognition of patterns. The next step in Orobas is to capture the sense of intuitiveness by adding an extra layer of analysis based on pattern recognition using machine learning.

With Orobas I'm not trying to create an AI that plays better than other chess engines nor even better than humans. The main goal of Orobas is to play LIKE humans do; this doesn't mean blunder by randomness once in a while; this means that if the engine eventually make mistakes, it's because they emerge from the analysis, the same way that mistakes emerge from the human thinking process, and not by programming it.

The main goal is to achieve the maximum ELO at the least depth possible. The opposite of what AIs like Stockfish, Komodo or Alpha Zero do. Betters moves; not more moves.

--------------
## Features
### Common features
* Principal variation search (negamax + alpha-beta pruning + null window search)
* Quiescense Search with stand-pat pruning
* Late move reductions
* Extensions when king is in check
* Futile pruning
* Delta pruning on Quiescense Search
* Reverse futility pruning (soft implementation of the null-move observation pruning)
* Pre-processed Piece Square Tables (PSQT) for the opening, midgame and endgame
* Mobility analysis, limited to first moves
* General pawn structure analysis, limited to first moves
* Material evaluation
* History heuristic, only applied to the actual position. No need for killer moves.
* Move ordering (hash moves, MVV-LVA, history and PSQT)
* Trasposition table with no exact scores (because PSQT change from move to move)
* Iterative deepening
* Internal Iterative deepening
* Phase detector with no tapered evaluation
* Principal variation generator
* History reduction (actually set to 100%)

### Orobas main ideas
* **Positional moves pruning**. If the pre-processor is complex enough and well tuned, the best move positional won't require a deep depth analysis (Capablanca once said "I see only one move ahead, but it is always the correct one"). The main idea is not to move a piece because it will be generate an advantage 48 plies ahead, but because it's very likely, given the experience and previuos knowledge, that this move will give me an advantage later. When? We don't know, and that's not a problem.  It's human intuition, even if this move it's a blunder.
* **History heuristic, only applied to the actual move**, with negative values on low-fails, and valuation not based on depth.
* **Piece-Square-Table for the opening**, with the obvious moves. The idea is to achieve one move per-piece at the opening the same ways that humans do: Moving the obvious piece to the obvious place.
* **A maximum depth of 20** (according to Magnus Carlsen, the maximum number of moves he can see ahead).
* **Limiting the number of moves that the engine can see ahead** in long road (in development). The idea is to emulate human thinking again. How many times a knight will move continously at the midgame? ¿10 times? No. Grandmasters can see a lot of moves ahead, but actually these moves are a combination of a few possible moves that are in front of their heads: one or two moves per piece; eventually a third move, but no more than that.
* **Analysis of common patterns** (not implemented yet). The idea is to evaluate positions based on common patterns like 6P1/5PBP/6K1L; humans recognize very quickly positions they're familiar with, even if they are not exactly the same.


