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
        if (!piece) return null;

        return piece.toLowerCase();
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
        if (
            typeof square !== "string" ||
            !/^[a-h][1-8]$/.test(square)
        ) {
            return null;
        }

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
        const pos = this.squareToCoords(square);

        if (!pos) return null;

        const piece =
            this.board[pos.r][pos.c];

        if (!piece) return null;

        return {
            color: this.color(piece),
            type: this.type(piece)
        };
    }

    findKing(color) {
        const king =
            color === "w" ? "K" : "k";

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c] === king) {
                    return { r, c };
                }
            }
        }

        return null;
    }

    attacked(r, c, byColor) {
        // PAWNS

        const pawn =
            byColor === "w" ? "P" : "p";

        const pawnRow =
            byColor === "w"
                ? r + 1
                : r - 1;

        for (const dc of [-1, 1]) {
            const cc = c + dc;

            if (
                this.inside(pawnRow, cc) &&
                this.board[pawnRow][cc] === pawn
            ) {
                return true;
            }
        }

        // KNIGHTS

        const knight =
            byColor === "w" ? "N" : "n";

        const knightMoves = [
            [2,1],
            [2,-1],
            [-2,1],
            [-2,-1],
            [1,2],
            [1,-2],
            [-1,2],
            [-1,-2]
        ];

        for (const [dr, dc] of knightMoves) {
            const rr = r + dr;
            const cc = c + dc;

            if (
                this.inside(rr, cc) &&
                this.board[rr][cc] === knight
            ) {
                return true;
            }
        }

        // KING

        const king =
            byColor === "w" ? "K" : "k";

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) {
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

        // ROOK / QUEEN

        const straightDirections = [
            [1,0],
            [-1,0],
            [0,1],
            [0,-1]
        ];

        for (const [dr, dc] of straightDirections) {
            let rr = r + dr;
            let cc = c + dc;

            while (this.inside(rr, cc)) {
                const piece =
                    this.board[rr][cc];

                if (piece) {
                    if (
                        this.color(piece) === byColor &&
                        (
                            this.type(piece) === "r" ||
                            this.type(piece) === "q"
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

        // BISHOP / QUEEN

        const diagonalDirections = [
            [1,1],
            [1,-1],
            [-1,1],
            [-1,-1]
        ];

        for (const [dr, dc] of diagonalDirections) {
            let rr = r + dr;
            let cc = c + dc;

            while (this.inside(rr, cc)) {
                const piece =
                    this.board[rr][cc];

                if (piece) {
                    if (
                        this.color(piece) === byColor &&
                        (
                            this.type(piece) === "b" ||
                            this.type(piece) === "q"
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

        if (!piece) return [];

        const color =
            this.color(piece);

        if (color !== this.currentTurn) {
            return [];
        }

        const type =
            this.type(piece);

        const moves = [];

        const add = (
            tr,
            tc,
            extra = {}
        ) => {
            if (!this.inside(tr, tc)) {
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

            // Kings are never captured.
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

        // =====================
        // PAWN
        // =====================

        if (type === "p") {
            const direction =
                color === "w" ? -1 : 1;

            const startRow =
                color === "w" ? 6 : 1;

            const promotionRow =
                color === "w" ? 0 : 7;

            const oneRow =
                r + direction;

            if (
                this.inside(oneRow, c) &&
                !this.board[oneRow][c]
            ) {
                add(
                    oneRow,
                    c,
                    {
                        promotion:
                            oneRow === promotionRow
                    }
                );

                const twoRow =
                    r + direction * 2;

                if (
                    r === startRow &&
                    !this.board[twoRow][c]
                ) {
                    add(
                        twoRow,
                        c,
                        {
                            doublePawn: true
                        }
                    );
                }
            }

            for (const dc of [-1, 1]) {
                const tr =
                    r + direction;

                const tc =
                    c + dc;

                if (!this.inside(tr, tc)) {
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
                                tr === promotionRow
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

        // =====================
        // KNIGHT
        // =====================

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

            for (const [dr, dc] of jumps) {
                add(
                    r + dr,
                    c + dc
                );
            }
        }

        // =====================
        // BISHOP / ROOK / QUEEN
        // =====================

        if (
            type === "b" ||
            type === "r" ||
            type === "q"
        ) {
            const directions = [];

            if (
                type === "b" ||
                type === "q"
            ) {
                directions.push(
                    [1,1],
                    [1,-1],
                    [-1,1],
                    [-1,-1]
                );
            }

            if (
                type === "r" ||
                type === "q"
            ) {
                directions.push(
                    [1,0],
                    [-1,0],
                    [0,1],
                    [0,-1]
                );
            }

            for (const [dr, dc] of directions) {
                let tr = r + dr;
                let tc = c + dc;

                while (this.inside(tr, tc)) {
                    const target =
                        this.board[tr][tc];

                    if (target) {
                        if (
                            this.color(target) !== color &&
                            this.type(target) !== "k"
                        ) {
                            add(tr, tc);
                        }

                        break;
                    }

                    add(tr, tc);

                    tr += dr;
                    tc += dc;
                }
            }
        }

        // =====================
        // KING
        // =====================

        if (type === "k") {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (
                        dr === 0 &&
                        dc === 0
                    ) {
                        continue;
                    }

                    add(
                        r + dr,
                        c + dc
                    );
                }
            }

            // =====================
            // CASTLING
            // =====================

            const homeRow =
                color === "w" ? 7 : 0;

            if (
                r === homeRow &&
                c === 4 &&
                !this.inCheck(color)
            ) {
                const enemy =
                    this.opponent(color);

                // KING SIDE

                const kingSideRight =
                    color === "w"
                        ? this.castling.K
                        : this.castling.k;

                const kingRook =
                    color === "w"
                        ? "R"
                        : "r";

                if (
                    kingSideRight &&
                    this.board[homeRow][7] === kingRook &&
                    !this.board[homeRow][5] &&
                    !this.board[homeRow][6] &&
                    !this.attacked(
                        homeRow,
                        5,
                        enemy
                    ) &&
                    !this.attacked(
                        homeRow,
                        6,
                        enemy
                    )
                ) {
                    moves.push({
                        fr: r,
                        fc: c,
                        tr: homeRow,
                        tc: 6,
                        castle: "K"
                    });
                }

                // QUEEN SIDE

                const queenSideRight =
                    color === "w"
                        ? this.castling.Q
                        : this.castling.q;

                const queenRook =
                    color === "w"
                        ? "R"
                        : "r";

                if (
                    queenSideRight &&
                    this.board[homeRow][0] === queenRook &&
                    !this.board[homeRow][1] &&
                    !this.board[homeRow][2] &&
                    !this.board[homeRow][3] &&
                    !this.attacked(
                        homeRow,
                        3,
                        enemy
                    ) &&
                    !this.attacked(
                        homeRow,
                        2,
                        enemy
                    )
                ) {
                    moves.push({
                        fr: r,
                        fc: c,
                        tr: homeRow,
                        tc: 2,
                        castle: "Q"
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

    saveState() {
        return {
            board: this.cloneBoard(),

            castling: {
                ...this.castling
            },

            enPassant:
                this.enPassant
                    ? {
                        ...this.enPassant
                    }
                    : null,

            halfmove:
                this.halfmove,

            fullmove:
                this.fullmove,

            turn:
                this.currentTurn
        };
    }

    restoreState(state) {
        this.board =
            state.board.map(
                row => [...row]
            );

        this.castling = {
            ...state.castling
        };

        this.enPassant =
            state.enPassant
                ? {
                    ...state.enPassant
                }
                : null;

        this.halfmove =
            state.halfmove;

        this.fullmove =
            state.fullmove;

        this.currentTurn =
            state.turn;
    }

    legalMoves() {
        const legal = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece =
                    this.board[r][c];

                if (
                    !piece ||
                    this.color(piece) !==
                        this.currentTurn
                ) {
                    continue;
                }

                const pseudo =
                    this.pseudoMoves(r, c);

                for (const move of pseudo) {
                    const state =
                        this.saveState();

                    const movingColor =
                        this.currentTurn;

                    this.applyMove(
                        move,
                        false
                    );

                    const illegal =
                        this.inCheck(
                            movingColor
                        );

                    this.restoreState(
                        state
                    );

                    if (!illegal) {
                        legal.push(move);
                    }
                }
            }
        }

        return legal;
    }

    moves(options = {}) {
        let list =
            this.legalMoves();

        if (options.square) {
            const pos =
                this.squareToCoords(
                    options.square
                );

            if (!pos) {
                return [];
            }

            list =
                list.filter(
                    move =>
                        move.fr === pos.r &&
                        move.fc === pos.c
                );
        }

        if (options.verbose) {
            return list.map(move => {
                const from =
                    this.coordsToSquare(
                        move.fr,
                        move.fc
                    );

                const to =
                    this.coordsToSquare(
                        move.tr,
                        move.tc
                    );

                const piece =
                    this.board[
                        move.fr
                    ][
                        move.fc
                    ];

                const target =
                    this.board[
                        move.tr
                    ][
                        move.tc
                    ];

                return {
                    from,
                    to,

                    color:
                        this.color(piece),

                    piece:
                        this.type(piece),

                    captured:
                        move.enPassant
                            ? "p"
                            : target
                                ? this.type(target)
                                : undefined,

                    promotion:
                        move.promotion
                            ? "q"
                            : undefined,

                    flags:
                        move.castle === "K"
                            ? "k"
                            : move.castle === "Q"
                                ? "q"
                                : move.enPassant
                                    ? "e"
                                    : move.doublePawn
                                        ? "b"
                                        : target
                                            ? "c"
                                            : "n"
                };
            });
        }

        return list.map(move => {
            return (
                this.coordsToSquare(
                    move.fr,
                    move.fc
                ) +
                this.coordsToSquare(
                    move.tr,
                    move.tc
                )
            );
        });
    }

    move(input) {
        let from;
        let to;
        let promotion = "q";

        if (typeof input === "string") {
            const clean =
                input.trim().toLowerCase();

            if (
                !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(clean)
            ) {
                return null;
            }

            from =
                clean.substring(0, 2);

            to =
                clean.substring(2, 4);

            if (clean.length === 5) {
                promotion =
                    clean[4];
            }
        } else {
            if (!input) {
                return null;
            }

            from =
                input.from;

            to =
                input.to;

            promotion =
                (
                    input.promotion ||
                    "q"
                ).toLowerCase();
        }

        const fromPos =
            this.squareToCoords(from);

        const toPos =
            this.squareToCoords(to);

        if (
            !fromPos ||
            !toPos
        ) {
            return null;
        }

        const legal =
            this.legalMoves();

        const chosen =
            legal.find(move => {
                return (
                    move.fr === fromPos.r &&
                    move.fc === fromPos.c &&
                    move.tr === toPos.r &&
                    move.tc === toPos.c
                );
            });

        if (!chosen) {
            return null;
        }

        chosen.promotionPiece =
            promotion;

        const movingPiece =
            this.board[
                chosen.fr
            ][
                chosen.fc
            ];

        const capturedPiece =
            chosen.enPassant
                ? (
                    this.currentTurn === "w"
                        ? "p"
                        : "P"
                )
                : this.board[
                    chosen.tr
                ][
                    chosen.tc
                ];

        this.applyMove(
            chosen,
            true
        );

        return {
            color:
                this.color(
                    movingPiece
                ),

            piece:
                this.type(
                    movingPiece
                ),

            from,
            to,

            captured:
                capturedPiece
                    ? this.type(
                        capturedPiece
                    )
                    : undefined,

            promotion:
                chosen.promotion
                    ? promotion
                    : undefined,

            flags:
                chosen.castle === "K"
                    ? "k"
                    : chosen.castle === "Q"
                        ? "q"
                        : chosen.enPassant
                            ? "e"
                            : chosen.doublePawn
                                ? "b"
                                : capturedPiece
                                    ? "c"
                                    : "n"
        };
    }

    applyMove(move, realMove) {
        const piece =
            this.board[
                move.fr
            ][
                move.fc
            ];

        const color =
            this.color(piece);

        const type =
            this.type(piece);

        const target =
            this.board[
                move.tr
            ][
                move.tc
            ];

        // MOVE PIECE

        this.board[
            move.tr
        ][
            move.tc
        ] = piece;

        this.board[
            move.fr
        ][
            move.fc
        ] = null;

        // EN PASSANT CAPTURE

        if (move.enPassant) {
            this.board[
                move.fr
            ][
                move.tc
            ] = null;
        }

        // CASTLING KING SIDE

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

        // CASTLING QUEEN SIDE

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

        // PROMOTION

        if (move.promotion) {
            let promoted =
                move.promotionPiece ||
                "q";

            if (color === "w") {
                promoted =
                    promoted.toUpperCase();
            } else {
                promoted =
                    promoted.toLowerCase();
            }

            this.board[
                move.tr
            ][
                move.tc
            ] = promoted;
        }

        // KING MOVED = NO MORE CASTLING

        if (type === "k") {
            if (color === "w") {
                this.castling.K = false;
                this.castling.Q = false;
            } else {
                this.castling.k = false;
                this.castling.q = false;
            }
        }

        // ROOK MOVED

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

        // ROOK CAPTURED

        if (
            target &&
            this.type(target) === "r"
        ) {
            if (
                move.tr === 7 &&
                move.tc === 0
            ) {
                this.castling.Q =
                    false;
            }

            if (
                move.tr === 7 &&
                move.tc === 7
            ) {
                this.castling.K =
                    false;
            }

            if (
                move.tr === 0 &&
                move.tc === 0
            ) {
                this.castling.q =
                    false;
            }

            if (
                move.tr === 0 &&
                move.tc === 7
            ) {
                this.castling.k =
                    false;
            }
        }

        // EN PASSANT TARGET

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

        if (!realMove) {
            return;
        }

        // 50-MOVE COUNTER

        if (
            type === "p" ||
            target ||
            move.enPassant
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

        // SWITCH TURN

        this.currentTurn =
            this.opponent(
                this.currentTurn
            );
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
        let boardFen = "";

        for (let r = 0; r < 8; r++) {
            let empty = 0;

            for (let c = 0; c < 8; c++) {
                const piece =
                    this.board[r][c];

                if (!piece) {
                    empty++;
                    continue;
                }

                if (empty > 0) {
                    boardFen += empty;
                    empty = 0;
                }

                boardFen += piece;
            }

            if (empty > 0) {
                boardFen += empty;
            }

            if (r !== 7) {
                boardFen += "/";
            }
        }

        let castle = "";

        if (this.castling.K) {
            castle += "K";
        }

        if (this.castling.Q) {
            castle += "Q";
        }

        if (this.castling.k) {
            castle += "k";
        }

        if (this.castling.q) {
            castle += "q";
        }

        if (!castle) {
            castle = "-";
        }

        const ep =
            this.enPassant
                ? this.coordsToSquare(
                    this.enPassant.r,
                    this.enPassant.c
                )
                : "-";

        return (
            boardFen +
            " " +
            this.currentTurn +
            " " +
            castle +
            " " +
            ep +
            " " +
            this.halfmove +
            " " +
            this.fullmove
        );
    }
}

window.Chess = Chess;
