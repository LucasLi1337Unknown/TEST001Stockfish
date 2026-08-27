class Chess {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = [
      ["r","n","b","q","k","b","n","r"],
      ["p","p","p","p","p","p","p","p"],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ["P","P","P","P","P","P","P","P"],
      ["R","N","B","Q","K","B","N","R"]
    ];

    this.currentTurn = "w";

    this.castling = {
      K: true,
      Q: true,
      k: true,
      q: true
    };

    this.enPassant = null;

    this.halfmove = 0;
    this.fullmove = 1;
  }

  turn() {
    return this.currentTurn;
  }

  opponent(color) {
    return color === "w" ? "b" : "w";
  }

  color(piece) {
    if (!piece) return null;

    return piece === piece.toUpperCase()
      ? "w"
      : "b";
  }

  type(piece) {
    return piece
      ? piece.toLowerCase()
      : null;
  }

  inside(r, c) {
    return (
      r >= 0 &&
      r < 8 &&
      c >= 0 &&
      c < 8
    );
  }

  squareToCoords(square) {
    return {
      c: square.charCodeAt(0) - 97,
      r: 8 - Number(square[1])
    };
  }

  coordsToSquare(r, c) {
    return (
      String.fromCharCode(97 + c) +
      (8 - r)
    );
  }

  get(square) {
    const { r, c } =
      this.squareToCoords(square);

    const piece =
      this.board[r][c];

    if (!piece) {
      return null;
    }

    return {
      color: this.color(piece),
      type: this.type(piece)
    };
  }

  findKing(color) {
    const king =
      color === "w"
        ? "K"
        : "k";

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (
          this.board[r][c] === king
        ) {
          return { r, c };
        }
      }
    }

    return null;
  }

  attacked(r, c, byColor) {

    // pawns

    const pawn =
      byColor === "w"
        ? "P"
        : "p";

    const pawnDirection =
      byColor === "w"
        ? 1
        : -1;

    for (const dc of [-1, 1]) {

      const rr =
        r + pawnDirection;

      const cc =
        c + dc;

      if (
        this.inside(rr, cc) &&
        this.board[rr][cc] === pawn
      ) {
        return true;
      }
    }


    // knights

    const knight =
      byColor === "w"
        ? "N"
        : "n";

    const knightMoves = [
      [2,1],[2,-1],
      [-2,1],[-2,-1],
      [1,2],[1,-2],
      [-1,2],[-1,-2]
    ];

    for (const [dr, dc]
      of knightMoves) {

      const rr = r + dr;
      const cc = c + dc;

      if (
        this.inside(rr, cc) &&
        this.board[rr][cc] === knight
      ) {
        return true;
      }
    }


    // king

    const king =
      byColor === "w"
        ? "K"
        : "k";

    for (
      let dr = -1;
      dr <= 1;
      dr++
    ) {

      for (
        let dc = -1;
        dc <= 1;
        dc++
      ) {

        if (!dr && !dc) {
          continue;
        }

        const rr = r + dr;
        const cc = c + dc;

        if (
          this.inside(rr, cc) &&
          this.board[rr][cc] === king
        ) {
          return true;
        }
      }
    }


    // rook + queen

    for (
      const [dr, dc]
      of [
        [1,0],
        [-1,0],
        [0,1],
        [0,-1]
      ]
    ) {

      let rr = r + dr;
      let cc = c + dc;

      while (
        this.inside(rr, cc)
      ) {

        const p =
          this.board[rr][cc];

        if (p) {

          if (
            this.color(p) ===
            byColor &&
            (
              this.type(p) === "r" ||
              this.type(p) === "q"
            )
          ) {
            return true;
          }

          break;
        }

        rr += dr;
        cc += dc;
      }
    }


    // bishop + queen

    for (
      const [dr, dc]
      of [
        [1,1],
        [1,-1],
        [-1,1],
        [-1,-1]
      ]
    ) {

      let rr = r + dr;
      let cc = c + dc;

      while (
        this.inside(rr, cc)
      ) {

        const p =
          this.board[rr][cc];

        if (p) {

          if (
            this.color(p) ===
            byColor &&
            (
              this.type(p) === "b" ||
              this.type(p) === "q"
            )
          ) {
            return true;
          }

          break;
        }

        rr += dr;
        cc += dc;
      }
    }

    return false;
  }

  inCheck(color) {

    const king =
      this.findKing(color);

    if (!king) {
      return true;
    }

    return this.attacked(
      king.r,
      king.c,
      this.opponent(color)
    );
  }

  pseudoMoves(r, c) {

    const piece =
      this.board[r][c];

    if (
      !piece ||
      this.color(piece) !==
        this.currentTurn
    ) {
      return [];
    }

    const moves = [];

    const color =
      this.color(piece);

    const type =
      this.type(piece);

    const add = (
      tr,
      tc,
      extra = {}
    ) => {

      if (
        !this.inside(tr, tc)
      ) {
        return;
      }

      const target =
        this.board[tr][tc];

      if (
        target &&
        this.color(target) === color
      ) {
        return;
      }

      /*
      Kings aren't captured in
      normal chess.
      */

      if (
        target &&
        this.type(target) === "k"
      ) {
        return;
      }

      moves.push({
        fr: r,
        fc: c,
        tr,
        tc,
        ...extra
      });
    };


    // PAWN

    if (type === "p") {

      const dir =
        color === "w"
          ? -1
          : 1;

      const start =
        color === "w"
          ? 6
          : 1;

      const promotionRank =
        color === "w"
          ? 0
          : 7;


      if (
        this.inside(
          r + dir,
          c
        ) &&
        !this.board[r + dir][c]
      ) {

        add(
          r + dir,
          c,
          {
            promotion:
              r + dir ===
              promotionRank
          }
        );


        if (
          r === start &&
          !this.board[
            r + dir * 2
          ][c]
        ) {

          add(
            r + dir * 2,
            c,
            {
              doublePawn: true
            }
          );
        }
      }


      for (
        const dc of [-1,1]
      ) {

        const tr = r + dir;
        const tc = c + dc;

        if (
          !this.inside(tr, tc)
        ) {
          continue;
        }

        const target =
          this.board[tr][tc];


        if (
          target &&
          this.color(target) !== color
        ) {

          add(
            tr,
            tc,
            {
              promotion:
                tr === promotionRank
            }
          );
        }


        if (
          this.enPassant &&
          this.enPassant.r === tr &&
          this.enPassant.c === tc
        ) {

          moves.push({
            fr: r,
            fc: c,
            tr,
            tc,
            enPassant: true
          });
        }
      }
    }


    // KNIGHT

    if (type === "n") {

      const jumps = [
        [2,1],
        [2,-1],
        [-2,1],
        [-2,-1],
        [1,2],
        [1,-2],
        [-1,2],
        [-1,-2]
      ];

      for (
        const [dr, dc]
        of jumps
      ) {

        add(
          r + dr,
          c + dc
        );
      }
    }


    // BISHOP / ROOK / QUEEN

    if (
      type === "b" ||
      type === "r" ||
      type === "q"
    ) {

      const dirs = [];

      if (type !== "r") {

        dirs.push(
          [1,1],
          [1,-1],
          [-1,1],
          [-1,-1]
        );
      }

      if (type !== "b") {

        dirs.push(
          [1,0],
          [-1,0],
          [0,1],
          [0,-1]
        );
      }


      for (
        const [dr,dc]
        of dirs
      ) {

        let tr = r + dr;
        let tc = c + dc;

        while (
          this.inside(tr,tc)
        ) {

          const target =
            this.board[tr][tc];

          if (target) {

            if (
              this.color(target)
              !== color
            ) {

              add(tr,tc);
            }

            break;
          }

          add(tr,tc);

          tr += dr;
          tc += dc;
        }
      }
    }


    // KING

    if (type === "k") {

      for (
        let dr = -1;
        dr <= 1;
        dr++
      ) {

        for (
          let dc = -1;
          dc <= 1;
          dc++
        ) {

          if (!dr && !dc) {
            continue;
          }

          add(
            r + dr,
            c + dc
          );
        }
      }


      // CASTLING

      const home =
        color === "w"
          ? 7
          : 0;


      if (
        r === home &&
        c === 4 &&
        !this.inCheck(color)
      ) {

        const opponent =
          this.opponent(color);


        // kingside

        const canKingSide =
          color === "w"
            ? this.castling.K
            : this.castling.k;


        if (
          canKingSide &&
          !this.board[home][5] &&
          !this.board[home][6] &&
          !this.attacked(
            home,
            5,
            opponent
          ) &&
          !this.attacked(
            home,
            6,
            opponent
          )
        ) {

          moves.push({
            fr:r,
            fc:c,
            tr:home,
            tc:6,
            castle:"K"
          });
        }


        // queenside

        const canQueenSide =
          color === "w"
            ? this.castling.Q
            : this.castling.q;


        if (
          canQueenSide &&
          !this.board[home][1] &&
          !this.board[home][2] &&
          !this.board[home][3] &&
          !this.attacked(
            home,
            3,
            opponent
          ) &&
          !this.attacked(
            home,
            2,
            opponent
          )
        ) {

          moves.push({
            fr:r,
            fc:c,
            tr:home,
            tc:2,
            castle:"Q"
          });
        }
      }
    }

    return moves;
  }

  cloneBoard() {
    return this.board.map(
      row => [...row]
    );
  }

  legalMoves() {

    const result = [];

    for (
      let r = 0;
      r < 8;
      r++
    ) {

      for (
        let c = 0;
        c < 8;
        c++
      ) {

        const p =
          this.board[r][c];

        if (
          !p ||
          this.color(p) !==
          this.currentTurn
        ) {
          continue;
        }

        for (
          const move
          of this.pseudoMoves(r,c)
        ) {

          const backupBoard =
            this.cloneBoard();

          const backupEP =
            this.enPassant;

          const backupCastle = {
            ...this.castling
          };


          this.applyMove(
            move,
            false
          );


          const illegal =
            this.inCheck(
              this.currentTurn
            );


          this.board =
            backupBoard;

          this.enPassant =
            backupEP;

          this.castling =
            backupCastle;


          if (!illegal) {
            result.push(move);
          }
        }
      }
    }

    return result;
  }

  moves(options = {}) {

    let list =
      this.legalMoves();


    if (options.square) {

      const q =
        this.squareToCoords(
          options.square
        );

      list =
        list.filter(
          move =>
            move.fr === q.r &&
            move.fc === q.c
        );
    }


    return list.map(
      move =>
        this.coordsToSquare(
          move.fr,
          move.fc
        ) +
        this.coordsToSquare(
          move.tr,
          move.tc
        )
    );
  }

  move(input) {

    let from;
    let to;
    let promotion = "q";


    if (
      typeof input === "string"
    ) {

      from =
        input.slice(0,2);

      to =
        input.slice(2,4);

      if (input.length === 5) {
        promotion =
          input[4].toLowerCase();
      }

    } else {

      from = input.from;
      to = input.to;

      promotion =
        (
          input.promotion ||
          "q"
        ).toLowerCase();
    }


    const f =
      this.squareToCoords(from);

    const t =
      this.squareToCoords(to);


    const move =
      this.legalMoves().find(
        m =>
          m.fr === f.r &&
          m.fc === f.c &&
          m.tr === t.r &&
          m.tc === t.c
      );


    if (!move) {
      return null;
    }


    move.promotionPiece =
      promotion;


    this.applyMove(
      move,
      true
    );


    return {
      from,
      to,
      promotion:
        move.promotion
          ? promotion
          : undefined
    };
  }

  applyMove(move, realMove) {

    const piece =
      this.board[
        move.fr
      ][move.fc];

    const color =
      this.color(piece);

    const type =
      this.type(piece);

    const target =
      this.board[
        move.tr
      ][move.tc];


    this.board[
      move.tr
    ][move.tc] =
      piece;

    this.board[
      move.fr
    ][move.fc] =
      null;


    // en passant

    if (move.enPassant) {

      this.board[
        move.fr
      ][move.tc] =
        null;
    }


    // castling

    if (move.castle === "K") {

      this.board[
        move.tr
      ][5] =
        this.board[
          move.tr
        ][7];

      this.board[
        move.tr
      ][7] =
        null;
    }


    if (move.castle === "Q") {

      this.board[
        move.tr
      ][3] =
        this.board[
          move.tr
        ][0];

      this.board[
        move.tr
      ][0] =
        null;
    }


    // promotion

    if (move.promotion) {

      let promoted =
        move.promotionPiece ||
        "q";

      if (color === "w") {

        promoted =
          promoted.toUpperCase();
      }

      this.board[
        move.tr
      ][move.tc] =
        promoted;
    }


    // update castling rights

    if (type === "k") {

      if (color === "w") {

        this.castling.K =
          false;

        this.castling.Q =
          false;

      } else {

        this.castling.k =
          false;

        this.castling.q =
          false;
      }
    }


    if (type === "r") {

      if (
        move.fr === 7 &&
        move.fc === 0
      ) {
        this.castling.Q =
          false;
      }

      if (
        move.fr === 7 &&
        move.fc === 7
      ) {
        this.castling.K =
          false;
      }

      if (
        move.fr === 0 &&
        move.fc === 0
      ) {
        this.castling.q =
          false;
      }

      if (
        move.fr === 0 &&
        move.fc === 7
      ) {
        this.castling.k =
          false;
      }
    }


    // en passant target

    if (
      type === "p" &&
      Math.abs(
        move.tr -
        move.fr
      ) === 2
    ) {

      this.enPassant = {
        r:
          (
            move.tr +
            move.fr
          ) / 2,

        c:
          move.fc
      };

    } else {

      this.enPassant =
        null;
    }


    if (realMove) {

      if (
        type === "p" ||
        target
      ) {
        this.halfmove = 0;
      } else {
        this.halfmove++;
      }


      if (
        this.currentTurn === "b"
      ) {
        this.fullmove++;
      }


      this.currentTurn =
        this.opponent(
          this.currentTurn
        );
    }
  }

  isCheck() {
    return this.inCheck(
      this.currentTurn
    );
  }

  isCheckmate() {
    return (
      this.isCheck() &&
      this.legalMoves().length === 0
    );
  }

  isStalemate() {
    return (
      !this.isCheck() &&
      this.legalMoves().length === 0
    );
  }

  isGameOver() {
    return (
      this.isCheckmate() ||
      this.isStalemate()
    );
  }

  fen() {

    let fen = "";

    for (
      let r = 0;
      r < 8;
      r++
    ) {

      let empty = 0;

      for (
        let c = 0;
        c < 8;
        c++
      ) {

        const p =
          this.board[r][c];

        if (!p) {

          empty++;

        } else {

          if (empty) {
            fen += empty;
            empty = 0;
          }

          fen += p;
        }
      }

      if (empty) {
        fen += empty;
      }

      if (r !== 7) {
        fen += "/";
      }
    }


    let rights = "";

    if (this.castling.K)
      rights += "K";

    if (this.castling.Q)
      rights += "Q";

    if (this.castling.k)
      rights += "k";

    if (this.castling.q)
      rights += "q";

    if (!rights)
      rights = "-";


    const ep =
      this.enPassant
        ? this.coordsToSquare(
            this.enPassant.r,
            this.enPassant.c
          )
        : "-";


    return (
      fen +
      " " +
      this.currentTurn +
      " " +
      rights +
      " " +
      ep +
      " " +
      this.halfmove +
      " " +
      this.fullmove
    );
  }
}


/*
Make Chess accessible to index.html
*/

window.Chess = Chess;
