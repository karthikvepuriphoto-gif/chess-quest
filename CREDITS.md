# Chess Quest credits & licenses
- **chess.js** v1.0.0 (move legality) — BSD-2-Clause, © Jeff Hlywa. See `lib/LICENSE-chess.js.txt`.
- **Stockfish.js** v10 (engine, runs in a Web Worker) — GPL-3.0, © the Stockfish authors / Nathan Rugg. See `lib/LICENSE-stockfish-GPL3.txt`. Source: https://github.com/nmrugg/stockfish.js
- Piece art, sounds and app code: original to Chess Quest.
- Famous game scores replayed from move 1 and checked against Wikipedia / chessgames.com; every line is validated with chess.js and checked with Stockfish (`build.cjs`).

## Famous puzzle sources (game scores in `sources/`, downloaded from chessgames.com)
| Puzzle | Game | Source |
|---|---|---|
| Opera Game | Morphy vs Duke Karl / Count Isouard, Paris 1858 | https://www.chessgames.com/perl/chessgame?gid=1233404 |
| Immortal Game | Anderssen vs Kieseritzky, London 1851 | https://www.chessgames.com/perl/chessgame?gid=1018910 |
| Evergreen Game | Anderssen vs Dufresne, Berlin 1852 (moves 21–24 from the source's note, Schachzeitung Oct 1852) | https://www.chessgames.com/perl/chessgame?gid=1018961 |
| Game of the Century | D. Byrne vs Fischer, New York 1956 | https://www.chessgames.com/perl/chessgame?gid=1008361 |
| Légal's Mate | Légal vs Saint Brie, Paris 1750 (rook odds; Wikipedia's move order, after Walker 1835 — chessgames.com gives a different order) | https://en.wikipedia.org/wiki/L%C3%A9gal_Trap |
| King Hunt | Ed. Lasker vs G. A. Thomas, London 1912 | https://www.chessgames.com/perl/chessgame?gid=1259009 |
| Réti's Queen Sacrifice | Réti vs Tartakower, Vienna 1910 | https://www.chessgames.com/perl/chessgame?gid=1250654 |
| Kasparov's Immortal / Finishing Blow | Kasparov vs Topalov, Wijk aan Zee 1999 | https://www.chessgames.com/perl/chessgame?gid=1011478 |
| Capablanca's Thunderbolt | Bernstein vs Capablanca, Moscow 1914 | https://www.chessgames.com/perl/chessgame?gid=1261680 |
| Tal's Finish | Tal vs Larsen, Bled 1965 | https://www.chessgames.com/perl/chessgame?gid=1139729 |
| Polgar's Attack | J. Polgar vs Berkes, Budapest 2003 | https://www.chessgames.com/perl/chessgame?gid=1261813 |
| Young Magnus | Carlsen vs Ernst, Wijk aan Zee 2004 | https://www.chessgames.com/perl/chessgame?gid=1272702 |

## Openings
Main lines and ECO codes are checked by `build-openings.cjs` against the lichess-org/chess-openings database (CC0, https://github.com/lichess-org/chess-openings, copy in `sources/lichess-openings/`). Famous player names are checked against each opening's English Wikipedia article.
