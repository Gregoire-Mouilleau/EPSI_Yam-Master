// Durée d'un tour en secondes
const TURN_DURATION = 30;

const DECK_INIT = {
    dices: [
        { id: 1, value: '', locked: true },
        { id: 2, value: '', locked: true },
        { id: 3, value: '', locked: true },
        { id: 4, value: '', locked: true },
        { id: 5, value: '', locked: true },
    ],
    rollsCounter: 1,
    rollsMaximum: 3
};

const CHOICES_INIT = {
    isDefi: false,
    isSec: false,
    idSelectedChoice: null,
    availableChoices: [],
};

const ALL_COMBINATIONS = [
    { value: 'Brelan1', id: 'brelan1' },
    { value: 'Brelan2', id: 'brelan2' },
    { value: 'Brelan3', id: 'brelan3' },
    { value: 'Brelan4', id: 'brelan4' },
    { value: 'Brelan5', id: 'brelan5' },
    { value: 'Brelan6', id: 'brelan6' },
    { value: 'Full', id: 'full' },
    { value: 'Carré', id: 'carre' },
    { value: 'Yam', id: 'yam' },
    { value: 'Suite', id: 'suite' },
    { value: '≤8', id: 'moinshuit' },
    { value: 'Sec', id: 'sec' },
    { value: 'Défi', id: 'defi' }
];

const GRID_INIT = [
    [
        { viewContent: '1', id: 'brelan1', owner: null, canBeChecked: false },
        { viewContent: '3', id: 'brelan3', owner: null, canBeChecked: false },
        { viewContent: 'Défi', id: 'defi', owner: null, canBeChecked: false },
        { viewContent: '4', id: 'brelan4', owner: null, canBeChecked: false },
        { viewContent: '6', id: 'brelan6', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '2', id: 'brelan2', owner: null, canBeChecked: false },
        { viewContent: 'Carré', id: 'carre', owner: null, canBeChecked: false },
        { viewContent: 'Sec', id: 'sec', owner: null, canBeChecked: false },
        { viewContent: 'Full', id: 'full', owner: null, canBeChecked: false },
        { viewContent: '5', id: 'brelan5', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '≤8', id: 'moinshuit', owner: null, canBeChecked: false },
        { viewContent: 'Full', id: 'full', owner: null, canBeChecked: false },
        { viewContent: 'Yam', id: 'yam', owner: null, canBeChecked: false },
        { viewContent: 'Défi', id: 'defi', owner: null, canBeChecked: false },
        { viewContent: 'Suite', id: 'suite', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '6', id: 'brelan6', owner: null, canBeChecked: false },
        { viewContent: 'Sec', id: 'sec', owner: null, canBeChecked: false },
        { viewContent: 'Suite', id: 'suite', owner: null, canBeChecked: false },
        { viewContent: '≤8', id: 'moinshuit', owner: null, canBeChecked: false },
        { viewContent: '1', id: 'brelan1', owner: null, canBeChecked: false },
    ],
    [
        { viewContent: '3', id: 'brelan3', owner: null, canBeChecked: false },
        { viewContent: '2', id: 'brelan2', owner: null, canBeChecked: false },
        { viewContent: 'Carré', id: 'carre', owner: null, canBeChecked: false },
        { viewContent: '5', id: 'brelan5', owner: null, canBeChecked: false },
        { viewContent: '4', id: 'brelan4', owner: null, canBeChecked: false },
    ]
];

const GAME_INIT = {
    gameState: {
        currentTurn: 'player:1',
        timer: TURN_DURATION,
        player1Score: 0,
        player2Score: 0,
        grid: [],
        choices: {},
        deck: {}
    }
}

const GameService = {

    init: {
        gameState: () => {
            return {
                gameState: {
                    currentTurn: 'player:1',
                    timer: TURN_DURATION,
                    player1Score: 0,
                    player2Score: 0,                    
                    player1PiecesLeft: 12,
                    player2PiecesLeft: 12,                    
                    grid: JSON.parse(JSON.stringify(GRID_INIT)),
                    choices: { ...CHOICES_INIT, availableChoices: [] },
                    deck: { 
                        ...DECK_INIT,
                        dices: DECK_INIT.dices.map(d => ({ ...d }))
                    }
                }
            };
        },

        deck: () => {
            return { 
                ...DECK_INIT,
                dices: DECK_INIT.dices.map(d => ({ ...d }))
            };
        },

        choices: () => {
            return { ...CHOICES_INIT, availableChoices: [] };
        },

        grid: () => {
            return JSON.parse(JSON.stringify(GRID_INIT));
        }
    },
    send: {
        forPlayer: {
            viewGameState: (playerKey, game) => {
                return {
                    inQueue: false,
                    inGame: true,
                    idPlayer:
                        (playerKey === 'player:1')
                            ? game.player1Socket.id
                            : (game.player2Socket ? game.player2Socket.id : 'bot'),
                    idOpponent:
                        (playerKey === 'player:1')
                            ? (game.player2Socket ? game.player2Socket.id : 'bot')
                            : game.player1Socket.id,
                    pseudoPlayer:
                        (playerKey === 'player:1')
                            ? game.player1Pseudo
                            : game.player2Pseudo,
                    pseudoOpponent:
                        (playerKey === 'player:1')
                            ? game.player2Pseudo
                            : game.player1Pseudo,
                    avatarKeyPlayer:
                        (playerKey === 'player:1')
                            ? game.player1AvatarKey
                            : game.player2AvatarKey,
                    avatarKeyOpponent:
                        (playerKey === 'player:1')
                            ? game.player2AvatarKey
                            : game.player1AvatarKey
                };
            },

            viewQueueState: () => {
                return {
                    inQueue: true,
                    inGame: false,
                };
            },
            gameTimer: (playerKey, gameState) => {
                // Selon la clé du joueur on adapte la réponse (player / opponent)
                const playerTimer = gameState.currentTurn === playerKey ? gameState.timer : 0;
                const opponentTimer = gameState.currentTurn === playerKey ? 0 : gameState.timer;
                return { playerTimer: playerTimer, opponentTimer: opponentTimer };
            },

            deckViewState: (playerKey, gameState) => {
                const deckViewState = {
                    displayPlayerDeck: gameState.currentTurn === playerKey,
                    displayOpponentDeck: gameState.currentTurn !== playerKey,
                    displayRollButton: gameState.deck.rollsCounter <= gameState.deck.rollsMaximum,
                    rollsCounter: gameState.deck.rollsCounter,
                    rollsMaximum: gameState.deck.rollsMaximum,
                    dices: gameState.deck.dices
                };
                return deckViewState;
            },

            choicesViewState: (playerKey, gameState) => {
                const choicesViewState = {
                    displayChoices: true,
                    canMakeChoice: playerKey === gameState.currentTurn,
                    idSelectedChoice: gameState.choices.idSelectedChoice,
                    availableChoices: gameState.choices.availableChoices
                }
                return choicesViewState;
            },

            gridViewState: (playerKey, gameState) => {
                return {
                    displayGrid: true,
                    canSelectCells: (playerKey === gameState.currentTurn) && (gameState.choices.availableChoices.length > 0),
                    playerKey: playerKey,
                    grid: gameState.grid,
                    player1PiecesLeft: gameState.player1PiecesLeft,
                    player2PiecesLeft: gameState.player2PiecesLeft
                };
            }
        }
    },
    timer: {
        getTurnDuration: () => {
            return TURN_DURATION;
        }
    },
    dices: {
        roll: (dicesToRoll) => {
            const rolledDices = dicesToRoll.map(dice => {
                if (dice.value === "") {
                    // Si la valeur du dé est vide, alors on le lance en mettant le flag locked à false
                    const newValue = String(Math.floor(Math.random() * 6) + 1);
                    return {
                        id: dice.id,
                        value: newValue,
                        locked: false
                    };
                } else if (!dice.locked) {
                    // Si le dé n'est pas verrouillé et possède déjà une valeur, alors on le relance
                    const newValue = String(Math.floor(Math.random() * 6) + 1);
                    return {
                        ...dice,
                        value: newValue
                    };
                } else {
                    // Si le dé est verrouillé ou a déjà une valeur mais le flag locked est true, on le laisse tel quel
                    return dice;
                }
            });
            return rolledDices;
        },

        lockEveryDice: (dicesToLock) => {
            const lockedDices = dicesToLock.map(dice => ({
                ...dice,
                locked: true
            }));
            return lockedDices;
        }
    },
    choices: {
        findCombinations: (dices, isDefi, isSec, grid) => {
            const availableCombinations = [];
            const allCombinations = ALL_COMBINATIONS;

            // Fonction helper pour vérifier si une combinaison a au moins une case libre sur la grille
            const hasAvailableCell = (combinationId) => {
                for (let row of grid) {
                    for (let cell of row) {
                        if (cell.id === combinationId && cell.owner === null) {
                            return true;
                        }
                    }
                }
                return false;
            };

            const counts = Array(7).fill(0); // Tableau pour compter le nombre de dés de chaque valeur (de 1 à 6)
            let hasPair = false; // Pour vérifier si une paire est présente
            let threeOfAKindValue = null; // Stocker la valeur du brelan
            let hasThreeOfAKind = false; // Pour vérifier si un brelan est présent
            let hasFourOfAKind = false; // Pour vérifier si un carré est présent
            let hasFiveOfAKind = false; // Pour vérifier si un Yam est présent
            let hasStraight = false; // Pour vérifier si une suite est présente
            let sum = 0; // Somme des valeurs des dés

            // Compter le nombre de dés de chaque valeur et calculer la somme
            for (let i = 0; i < dices.length; i++) {
                const diceValue = parseInt(dices[i].value);
                counts[diceValue]++;
                sum += diceValue;
            }

            // Vérifier les combinaisons possibles
            for (let i = 1; i <= 6; i++) {
                if (counts[i] === 2) {
                    hasPair = true;
                } else if (counts[i] === 3) {
                    threeOfAKindValue = i;
                    hasThreeOfAKind = true;
                } else if (counts[i] === 4) {
                    threeOfAKindValue = i;
                    hasThreeOfAKind = true;
                    hasFourOfAKind = true;
                } else if (counts[i] === 5) {
                    threeOfAKindValue = i;
                    hasThreeOfAKind = true;
                    hasFourOfAKind = true;
                    hasFiveOfAKind = true;
                }
            }

            const sortedValues = dices.map(dice => parseInt(dice.value)).sort((a, b) => a - b); // Trie les valeurs de dé

            // Vérifie si les valeurs triées forment une suite
            hasStraight = sortedValues.every((value, index) => index === 0 || value === sortedValues[index - 1] + 1);

            // Vérifier si la somme ne dépasse pas 8
            const isLessThanEqual8 = sum <= 8;

            // Retourner les combinaisons possibles via leur ID
            allCombinations.forEach(combination => {
                if (
                    (combination.id.includes('brelan') && hasThreeOfAKind && parseInt(combination.id.slice(-1)) === threeOfAKindValue) ||
                    (combination.id === 'full' && hasPair && hasThreeOfAKind) ||
                    (combination.id === 'carre' && hasFourOfAKind) ||
                    (combination.id === 'yam' && hasFiveOfAKind) ||
                    (combination.id === 'suite' && hasStraight) ||
                    (combination.id === 'moinshuit' && isLessThanEqual8) ||
                    (combination.id === 'defi' && isDefi)
                ) {
                    const isDisabled = !hasAvailableCell(combination.id);
                    availableCombinations.push({
                        ...combination,
                        disabled: isDisabled
                    });
                }
            });

            const notOnlyBrelan = availableCombinations.some(combination => !combination.id.includes('brelan'));

            if (isSec && availableCombinations.length > 0 && notOnlyBrelan) {
                const secCombination = allCombinations.find(combination => combination.id === 'sec');
                const isSecDisabled = !hasAvailableCell('sec');
                availableCombinations.push({
                    ...secCombination,
                    disabled: isSecDisabled
                });
            }

            return availableCombinations;
        }
    },
    grid: {
        resetcanBeCheckedCells: (grid) => {
            const updatedGrid = grid.map(row => 
                row.map(cell => ({
                    ...cell,
                    canBeChecked: false
                }))
            );
            return updatedGrid;
        },

        updateGridAfterSelectingChoice: (idSelectedChoice, grid) => {
            const updatedGrid = grid.map(row => 
                row.map(cell => ({
                    ...cell,
                    canBeChecked: cell.id === idSelectedChoice && cell.owner === null
                }))
            );
            return updatedGrid;
        },

        selectCell: (idCell, rowIndex, cellIndex, currentTurn, grid) => {
            const updatedGrid = grid.map((row, rIndex) => 
                row.map((cell, cIndex) => {
                    if (rIndex === rowIndex && cIndex === cellIndex && cell.id === idCell) {
                        return {
                            ...cell,
                            owner: currentTurn,
                            canBeChecked: false
                        };
                    }
                    return cell;
                })
            );
            return updatedGrid;
        },

        // Détecter les lignes de N jetons consécutifs pour un joueur
        findLines: (grid, playerKey, lineLength) => {
            const lines = [];
            const rows = grid.length;
            const cols = grid[0].length;

            // Vérifier les lignes horizontales
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col <= cols - lineLength; col++) {
                    let count = 0;
                    const cells = [];
                    for (let i = 0; i < lineLength; i++) {
                        if (grid[row][col + i].owner === playerKey) {
                            count++;
                            cells.push({ row, col: col + i });
                        }
                    }
                    if (count === lineLength) {
                        lines.push({ type: 'horizontal', cells });
                    }
                }
            }

            // Vérifier les lignes verticales
            for (let col = 0; col < cols; col++) {
                for (let row = 0; row <= rows - lineLength; row++) {
                    let count = 0;
                    const cells = [];
                    for (let i = 0; i < lineLength; i++) {
                        if (grid[row + i][col].owner === playerKey) {
                            count++;
                            cells.push({ row: row + i, col });
                        }
                    }
                    if (count === lineLength) {
                        lines.push({ type: 'vertical', cells });
                    }
                }
            }

            // Vérifier les diagonales (\ direction)
            for (let row = 0; row <= rows - lineLength; row++) {
                for (let col = 0; col <= cols - lineLength; col++) {
                    let count = 0;
                    const cells = [];
                    for (let i = 0; i < lineLength; i++) {
                        if (grid[row + i][col + i].owner === playerKey) {
                            count++;
                            cells.push({ row: row + i, col: col + i });
                        }
                    }
                    if (count === lineLength) {
                        lines.push({ type: 'diagonal-down', cells });
                    }
                }
            }

            // Vérifier les diagonales (/ direction)
            for (let row = lineLength - 1; row < rows; row++) {
                for (let col = 0; col <= cols - lineLength; col++) {
                    let count = 0;
                    const cells = [];
                    for (let i = 0; i < lineLength; i++) {
                        if (grid[row - i][col + i].owner === playerKey) {
                            count++;
                            cells.push({ row: row - i, col: col + i });
                        }
                    }
                    if (count === lineLength) {
                        lines.push({ type: 'diagonal-up', cells });
                    }
                }
            }

            return lines;
        },

        // Calculer le score d'un joueur basé sur ses lignes de 3 (1pt) et de 4 (2pts).
        // Une ligne de 4 n'additionne PAS ses deux sous-lignes de 3.
        // Une case peut appartenir à plusieurs lignes dans des directions différentes.
        calculateScore: (grid, playerKey) => {
            let score = 0;
            const directions = [
                [0, 1],   // horizontal
                [1, 0],   // vertical
                [1, 1],   // diagonal \
                [1, -1],  // diagonal /
            ];

            for (const [dr, dc] of directions) {
                for (let r = 0; r < 5; r++) {
                    for (let c = 0; c < 5; c++) {
                        if (grid[r][c].owner !== playerKey) continue;

                        // Vérifie si c'est le début d'un run (la case précédente n'appartient pas au joueur)
                        const prevR = r - dr;
                        const prevC = c - dc;
                        const prevInBounds = prevR >= 0 && prevR < 5 && prevC >= 0 && prevC < 5;
                        if (prevInBounds && grid[prevR][prevC].owner === playerKey) continue;

                        // Compter la longueur du run
                        let len = 0;
                        let cr = r, cc = c;
                        while (cr >= 0 && cr < 5 && cc >= 0 && cc < 5 && grid[cr][cc].owner === playerKey) {
                            len++;
                            cr += dr;
                            cc += dc;
                        }

                        if (len === 3) score += 1;
                        else if (len === 4) score += 2;
                        // len === 5 : condition de victoire, déjà gérée avant d'arriver ici
                    }
                }
            }

            return score;
        },

        // Vérifier si la grille est pleine
        isFull: (grid) => {
            return grid.every(row => row.every(cell => cell.owner !== null));
        },

        // Vérifier si la partie est terminée et déterminer le gagnant
        checkGameEnd: (grid, player1Score, player2Score) => {
            // Vérifier si un joueur a fait une ligne de 5
            const player1LinesOf5 = GameService.grid.findLines(grid, 'player:1', 5);
            const player2LinesOf5 = GameService.grid.findLines(grid, 'player:2', 5);

            console.log('[DEBUG] Lignes de 5 détectées:', {
                player1: player1LinesOf5.length,
                player2: player2LinesOf5.length,
                player1Lines: player1LinesOf5,
                player2Lines: player2LinesOf5
            });

            if (player1LinesOf5.length > 0) {
                return { gameEnded: true, winner: 'player:1', reason: 'line-of-5' };
            }

            if (player2LinesOf5.length > 0) {
                return { gameEnded: true, winner: 'player:2', reason: 'line-of-5' };
            }

            // Vérifier si la grille est pleine
            if (GameService.grid.isFull(grid)) {
                if (player1Score > player2Score) {
                    return { gameEnded: true, winner: 'player:1', reason: 'score' };
                } else if (player2Score > player1Score) {
                    return { gameEnded: true, winner: 'player:2', reason: 'score' };
                } else {
                    return { gameEnded: true, winner: 'draw', reason: 'score' };
                }
            }

            return { gameEnded: false, winner: null, reason: null };
        }
    },
    utils: {
        findGameIndexById: (games, idGame) => {
            for (let i = 0; i < games.length; i++) {
                if (games[i].idGame === idGame) {
                    return i; 
                }
            }
            return -1;
        },

        findGameIndexBySocketId: (games, socketId) => {
            for (let i = 0; i < games.length; i++) {
                if (games[i].player1Socket.id === socketId || games[i].player2Socket.id === socketId) {
                    return i; // Retourne l'index du jeu si le socket est trouvé
                }
            }
            return -1;
        },

        findDiceIndexByDiceId: (dices, idDice) => {
            for (let i = 0; i < dices.length; i++) {
                if (dices[i].id === idDice) {
                    return i; // Retourne l'index du dé si l'id est trouvé
                }
            }
            return -1;
        }
    }
}

module.exports = GameService;
