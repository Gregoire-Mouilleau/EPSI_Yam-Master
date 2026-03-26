// Service d'intelligence artificielle pour le Bot
// Le bot analyse la grille et prend des décisions stratégiques

const BotService = {

    // Analyse la situation actuelle et détermine la stratégie à adopter
    determineStrategy: (grid, botKey, playerKey) => {
        const botThreats = BotService.analysis.countPlayerThreats(grid, playerKey);
        const botOpportunities = BotService.analysis.countPlayerThreats(grid, botKey);
        
        // Si le joueur a une ligne de 4, défendre en priorité
        if (botThreats.fourInRow > 0) {
            return 'defensive';
        }
        
        // Si le bot peut gagner, mode agressif
        if (botOpportunities.fourInRow > 0) {
            return 'aggressive';
        }
        
        // Si le joueur a plusieurs lignes de 3, défendre
        if (botThreats.threeInRow >= 2) {
            return 'defensive';
        }
        
        // Si le bot a de bonnes opportunités, attaquer
        if (botOpportunities.threeInRow >= 2) {
            return 'aggressive';
        }
        
        // Sinon, mode équilibré
        return 'balanced';
    },

    // Vérifie si au moins 2 jetons sont alignés (horizontal, vertical, diagonal)
    checkAlignedTokens: (tokenPositions) => {
        if (tokenPositions.length < 2) return false;
        
        const directions = [
            { dr: 0, dc: 1 },   // Horizontal
            { dr: 1, dc: 0 },   // Vertical
            { dr: 1, dc: 1 },   // Diagonal \
            { dr: 1, dc: -1 }   // Diagonal /
        ];
        
        // Pour chaque paire de jetons
        for (let i = 0; i < tokenPositions.length; i++) {
            for (let j = i + 1; j < tokenPositions.length; j++) {
                const pos1 = tokenPositions[i];
                const pos2 = tokenPositions[j];
                
                // Vérifier si les 2 jetons sont alignés dans une direction
                for (const { dr, dc } of directions) {
                    // Calculer la différence de position
                    const rowDiff = pos2.row - pos1.row;
                    const colDiff = pos2.col - pos1.col;
                    
                    // Vérifier si la différence correspond à un multiple de la direction
                    // (les jetons sont sur la même ligne/colonne/diagonal)
                    if (dr === 0 && rowDiff === 0 && colDiff !== 0) {
                        // Même ligne horizontale
                        return true;
                    }
                    if (dc === 0 && colDiff === 0 && rowDiff !== 0) {
                        // Même colonne verticale
                        return true;
                    }
                    if (dr === 1 && dc === 1 && rowDiff === colDiff && rowDiff !== 0) {
                        // Même diagonale \
                        return true;
                    }
                    if (dr === 1 && dc === -1 && rowDiff === -colDiff && rowDiff !== 0) {
                        // Même diagonale /
                        return true;
                    }
                }
            }
        }
        
        return false;
    },

    // ===== ANALYSE DES LIGNES DE VICTOIRE =====
    // Évalue les 12 lignes possibles (5 rangées + 5 colonnes + 2 diagonales)
    lines: {
        getAll: (grid) => {
            const result = [];
            for (let r = 0; r < 5; r++)
                result.push([0,1,2,3,4].map(c => ({ row: r, col: c, id: grid[r][c].id, owner: grid[r][c].owner })));
            for (let c = 0; c < 5; c++)
                result.push([0,1,2,3,4].map(r => ({ row: r, col: c, id: grid[r][c].id, owner: grid[r][c].owner })));
            result.push([0,1,2,3,4].map(i => ({ row: i, col: i,   id: grid[i][i].id,     owner: grid[i][i].owner })));
            result.push([0,1,2,3,4].map(i => ({ row: i, col: 4-i, id: grid[i][4-i].id,   owner: grid[i][4-i].owner })));
            return result;
        },

        // Meilleure ligne non bloquée par l'adversaire (celle sur laquelle le bot peut gagner)
        getBotBestLine: (grid, botKey, playerKey) => {
            const all = BotService.lines.getAll(grid);
            let best = null, bestScore = -Infinity;
            for (const cells of all) {
                const mine   = cells.filter(c => c.owner === botKey);
                const theirs = cells.filter(c => c.owner === playerKey);
                const empty  = cells.filter(c => c.owner === null);
                if (theirs.length > 0) continue; // bloquée par l'adversaire
                const score = mine.length * 1000 - empty.length * 100;
                if (score > bestScore) { bestScore = score; best = { cells, botCount: mine.length, remaining: empty, score }; }
            }
            return best;
        },

        // Ligne la plus avancée de l'adversaire non bloquée par le bot
        getOpponentBestLine: (grid, botKey, playerKey) => {
            const all = BotService.lines.getAll(grid);
            let best = null, bestScore = -Infinity;
            for (const cells of all) {
                const mine   = cells.filter(c => c.owner === playerKey); // pions adversaire
                const theirs = cells.filter(c => c.owner === botKey);    // pions bot (bloquants)
                const empty  = cells.filter(c => c.owner === null);
                if (theirs.length > 0) continue; // notre bot bloque déjà
                if (mine.length === 0) continue;
                const score = mine.length * 1000 - empty.length * 100;
                if (score > bestScore) { bestScore = score; best = { cells, playerCount: mine.length, remaining: empty, score }; }
            }
            return best;
        },

        // Ensemble des IDs de combos nécessaires pour compléter les cases vides d'une ligne
        getNeededComboIds: (remainingCells) => new Set(remainingCells.map(c => c.id)),
    },

    // Compte les jetons du bot posés sur la grille
    countBotTokens: (grid, botKey) => {
        let count = 0;
        for (let r = 0; r < 5; r++)
            for (let c = 0; c < 5; c++)
                if (grid[r][c].owner === botKey) count++;
        return count;
    },

    // Valeur intrinsèque d'un combo (rareté / difficulté)
    // Empêche le bot de préférer un brelan de 1 à un Full ou un Carré
    getComboIntrinsicValue: (comboId) => {
        if (comboId === 'yam')       return 1500;
        if (comboId === 'carre')     return 1200;
        if (comboId === 'full')      return 1000;
        if (comboId === 'suite')     return 900;
        // SEC : obtenu sans re-lancer = rare, on ne peut pas le retrouver après re-lancer
        if (comboId === 'sec')       return 850;
        // ≤8 : combo spécial valeur correcte
        if (comboId === 'moinshuit') return 600;
        if (comboId.startsWith('brelan')) {
            const val = parseInt(comboId.replace('brelan', ''));
            return !isNaN(val) ? 100 + val * 30 : 250; // brelan1=130 → brelan6=280
        }
        const pts = parseInt(comboId);
        if (!isNaN(pts) && pts >= 1 && pts <= 6) return pts * 40; // 1=40 → 6=240
        return 50;
    },

    // Analyse les menaces d'un joueur (lignes de 3, 4, etc.)
    analysis: {
        countPlayerThreats: (grid, playerKey) => {
            let threeInRow = 0;
            let fourInRow = 0;
            let twoInRow = 0;

            // Vérifier toutes les directions possibles
            const directions = [
                { dr: 0, dc: 1 },  // Horizontal
                { dr: 1, dc: 0 },  // Vertical
                { dr: 1, dc: 1 },  // Diagonal \
                { dr: 1, dc: -1 }  // Diagonal /
            ];

            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    for (const { dr, dc } of directions) {
                        let count = 0;
                        let empty = 0;
                        
                        // Vérifier une ligne de 5 cases
                        for (let i = 0; i < 5; i++) {
                            const nr = r + dr * i;
                            const nc = c + dc * i;
                            
                            if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5) break;
                            
                            if (grid[nr][nc].owner === playerKey) {
                                count++;
                            } else if (grid[nr][nc].owner === null) {
                                empty++;
                            } else {
                                break; // Ligne bloquée par l'adversaire
                            }
                        }
                        
                        // Si on peut encore compléter la ligne
                        if (count + empty >= 5) {
                            if (count === 4) fourInRow++;
                            else if (count === 3) threeInRow++;
                            else if (count === 2) twoInRow++;
                        }
                    }
                }
            }

            return { fourInRow, threeInRow, twoInRow };
        },

        // Trouve toutes les cases qui permettraient de gagner
        findWinningMoves: (grid, playerKey) => {
            const winningCells = [];
            
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    if (grid[r][c].owner === null) {
                        // Simuler le placement
                        const testGrid = JSON.parse(JSON.stringify(grid));
                        testGrid[r][c].owner = playerKey;
                        
                        // Vérifier si cela crée une ligne de 5
                        if (BotService.analysis.checkLineOf5At(testGrid, r, c, playerKey)) {
                            winningCells.push({ row: r, col: c, id: grid[r][c].id });
                        }
                    }
                }
            }
            
            return winningCells;
        },

        // Vérifie si une case fait partie d'une ligne de 5
        checkLineOf5At: (grid, row, col, playerKey) => {
            const directions = [
                { dr: 0, dc: 1 },   // Horizontal
                { dr: 1, dc: 0 },   // Vertical
                { dr: 1, dc: 1 },   // Diagonal \
                { dr: 1, dc: -1 }   // Diagonal /
            ];

            for (const { dr, dc } of directions) {
                let count = 1; // La case elle-même
                
                // Compter dans une direction
                for (let i = 1; i < 5; i++) {
                    const nr = row + dr * i;
                    const nc = col + dc * i;
                    if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5) break;
                    if (grid[nr][nc].owner === playerKey) count++;
                    else break;
                }
                
                // Compter dans la direction opposée
                for (let i = 1; i < 5; i++) {
                    const nr = row - dr * i;
                    const nc = col - dc * i;
                    if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5) break;
                    if (grid[nr][nc].owner === playerKey) count++;
                    else break;
                }
                
                if (count >= 5) return true;
            }
            
            return false;
        },

        // Trouve les cases qui bloquent une menace de l'adversaire
        findBlockingMoves: (grid, opponentKey) => {
            return BotService.analysis.findWinningMoves(grid, opponentKey);
        },

        // Évalue le potentiel d'une case (nombre de lignes possibles)
        evaluateCellPotential: (grid, row, col, playerKey) => {
            let potential = 0;
            const directions = [
                { dr: 0, dc: 1 },
                { dr: 1, dc: 0 },
                { dr: 1, dc: 1 },
                { dr: 1, dc: -1 }
            ];

            for (const { dr, dc } of directions) {
                let myCount = 0;
                let emptyCount = 1; // La case elle-même
                let blocked = false;
                
                // Regarder dans les deux directions
                for (let dir = -1; dir <= 1; dir += 2) {
                    for (let i = 1; i < 5; i++) {
                        const nr = row + dr * i * dir;
                        const nc = col + dc * i * dir;
                        
                        if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5) break;
                        
                        if (grid[nr][nc].owner === playerKey) {
                            myCount++;
                        } else if (grid[nr][nc].owner === null) {
                            emptyCount++;
                        } else {
                            blocked = true;
                            break;
                        }
                    }
                }
                
                // Si la ligne n'est pas bloquée et a du potentiel
                if (!blocked && myCount + emptyCount >= 5) {
                    potential += myCount + 1; // +1 pour chaque jeton sur cette ligne
                }
            }
            
            return potential;
        }
    },

    // Décide quelle combinaison de dés choisir
    chooseCombo: (availableChoices, grid, botKey, playerKey, strategy) => {
        if (availableChoices.length === 0) return null;
        const usableChoices = availableChoices.filter(choice => !choice.disabled);
        if (usableChoices.length === 0) return null;

        const botTokenCount = BotService.countBotTokens(grid, botKey);
        const botLine = BotService.lines.getBotBestLine(grid, botKey, playerKey);
        const opLine  = BotService.lines.getOpponentBestLine(grid, botKey, playerKey);

        // Combos nécessaires pour la ligne gagnante du bot (actifs dès 2 pions posés)
        const neededForWin = (botTokenCount >= 2 && botLine)
            ? BotService.lines.getNeededComboIds(botLine.remaining) : new Set();

        // Combos nécessaires pour bloquer la ligne adverse (actifs dès 2 pions adverses)
        const neededForBlock = (opLine && opLine.playerCount >= 2)
            ? BotService.lines.getNeededComboIds(opLine.remaining) : new Set();

        const choicesWithEval = usableChoices.map(choice => {
            const possibleCells = BotService.decision.findCellsForChoice(grid, choice.id, botKey, playerKey, strategy);
            const bestCellScore = possibleCells.length > 0 ? Math.max(...possibleCells.map(c => c.score)) : 0;

            // Valeur du combo en lui-même (empêche full < brelan1)
            const intrinsicBonus = BotService.getComboIntrinsicValue(choice.id);

            // Bonus ligne offensive : on reste sur la ligne choisie
            let lineBonus = 0;
            if (botTokenCount >= 2 && botLine && neededForWin.has(choice.id)) {
                lineBonus += 2000 + botLine.botCount * 500; // Urgence croissante avec l'avancement
            }

            // Bonus blocage : adversaire à 2, 3 ou 4 pions sur sa ligne (urgence croissante)
            if (opLine && neededForBlock.has(choice.id)) {
                if (opLine.playerCount >= 4) lineBonus += 8000;
                else if (opLine.playerCount >= 3) lineBonus += 3000;
                else lineBonus += 800; // surveillance légère (2 pions adverses)
            }

            // Bonus compound : ce combo est utile à 2+ lignes bot actives simultanément
            if (botTokenCount >= 1) {
                const allBotLines = BotService.lines.getAll(grid).filter(line =>
                    !line.some(c => c.owner === playerKey) &&
                    line.some(c => c.owner === botKey)
                );
                const linesNeedingThis = allBotLines.filter(line =>
                    BotService.lines.getNeededComboIds(line.filter(c => c.owner === null)).has(choice.id)
                );
                if (linesNeedingThis.length >= 2) lineBonus += linesNeedingThis.length * 900;
            }

            return { choice, possibleCells, bestCellScore: bestCellScore + intrinsicBonus + lineBonus };
        });

        choicesWithEval.sort((a, b) => b.bestCellScore - a.bestCellScore);

        // 70% meilleur coup, 30% top-3 (petite variabilité)
        if (Math.random() < 0.7 || choicesWithEval.length === 1) {
            return choicesWithEval[0].choice;
        } else {
            const top = choicesWithEval.slice(0, Math.min(3, choicesWithEval.length));
            return top[Math.floor(Math.random() * top.length)].choice;
        }
    },

    // Décide où placer le jeton sur la grille
    decision: {
        findCellsForChoice: (grid, choiceId, botKey, playerKey, strategy) => {
            const availableCells = [];
            
            // Trouver toutes les cases avec ce choiceId qui sont libres
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    if (grid[r][c].id === choiceId && grid[r][c].owner === null) {
                        const score = BotService.decision.evaluateCell(grid, r, c, botKey, playerKey, strategy);
                        availableCells.push({ row: r, col: c, id: choiceId, score });
                    }
                }
            }
            
            return availableCells;
        },

        evaluateCell: (grid, row, col, botKey, playerKey, strategy) => {
            let score = 0;

            // 1. Coup gagnant immédiat (priorité absolue)
            const testGrid = JSON.parse(JSON.stringify(grid));
            testGrid[row][col].owner = botKey;
            if (BotService.analysis.checkLineOf5At(testGrid, row, col, botKey)) return 10000;

            // 2. Bloquer une victoire immédiate de l'adversaire
            const testGrid2 = JSON.parse(JSON.stringify(grid));
            testGrid2[row][col].owner = playerKey;
            if (BotService.analysis.checkLineOf5At(testGrid2, row, col, playerKey)) score += 5000;

            // 3. Bonus si la case est sur la ligne gagnante du bot (dès 2 pions posés)
            const botTokenCount = BotService.countBotTokens(grid, botKey);
            if (botTokenCount >= 2) {
                const botLine = BotService.lines.getBotBestLine(grid, botKey, playerKey);
                if (botLine && botLine.cells.some(c => c.row === row && c.col === col)) {
                    score += 2000 + botLine.botCount * 300;
                }

                // Bonus si la case bloque la ligne la plus avancée de l'adversaire
                const opLine = BotService.lines.getOpponentBestLine(grid, botKey, playerKey);
                if (opLine && opLine.playerCount >= 2 &&
                    opLine.cells.some(c => c.row === row && c.col === col)) {
                    score += opLine.playerCount >= 4 ? 4500 : opLine.playerCount >= 3 ? 3000 : 1000;
                }

                // Fork: la case touche 2+ lignes bot non bloquées → menace double impossible à contrer
                const allLines = BotService.lines.getAll(grid);
                const botLinesThrough = allLines.filter(line =>
                    line.some(c => c.row === row && c.col === col) &&
                    !line.some(c => c.owner === playerKey) &&
                    line.some(c => c.owner === botKey)
                );
                if (botLinesThrough.length >= 2) score += botLinesThrough.length * 600;

                // Anti-fork adverse : la case est à l'intersection de 2+ lignes adverses actives (≥2 pions)
                const opLinesThrough = allLines.filter(line =>
                    line.some(c => c.row === row && c.col === col) &&
                    !line.some(c => c.owner === botKey) &&
                    line.filter(c => c.owner === playerKey).length >= 2
                );
                if (opLinesThrough.length >= 2) score += opLinesThrough.length * 500;
            }

            // 4. Potentiel général de la case (contribue à plusieurs lignes)
            const potential = BotService.analysis.evaluateCellPotential(grid, row, col, botKey);
            score += potential * 100;

            // 5. Favoriser le centre
            const centerDistance = Math.abs(row - 2) + Math.abs(col - 2);
            score += (4 - centerDistance) * 10;

            // 6. Ajustement selon la stratégie héritée
            if (strategy === 'aggressive') {
                score += potential * 50;
            } else if (strategy === 'defensive') {
                const opponentPotential = BotService.analysis.evaluateCellPotential(grid, row, col, playerKey);
                score += opponentPotential * 150;
            }

            return score;
        },

        chooseBestCell: (grid, choiceId, botKey, playerKey, strategy) => {
            const cells = BotService.decision.findCellsForChoice(grid, choiceId, botKey, playerKey, strategy);
            
            if (cells.length === 0) return null;
            
            // Trier par score
            cells.sort((a, b) => b.score - a.score);
            
            // Prendre le meilleur coup (90% du temps) ou un des top 3 (10% pour variabilité)
            if (Math.random() < 0.9 || cells.length === 1) {
                return cells[0];
            } else {
                const topCells = cells.slice(0, Math.min(3, cells.length));
                return topCells[Math.floor(Math.random() * topCells.length)];
            }
        }
    },

    // Décide quels dés le bot doit garder (retourne la liste des dés à verrouiller)
    decideDicesToLock: (dices, rollsCounter, availableChoices, grid, botKey, playerKey) => {
        // Si c'est le dernier roll, ne rien retourner (sera géré différemment)
        if (rollsCounter > 3) return [];
        
        
        // Analyser les dés pour voir quels patterns on a
        const counts = Array(7).fill(0);
        dices.forEach(dice => {
            if (dice.value) counts[parseInt(dice.value)]++;
        });
        
        // Trouver les valeurs et leur fréquence maximale
        let maxCount = 0;
        let maxValue = 0;
        for (let i = 1; i <= 6; i++) {
            if (counts[i] > maxCount) {
                maxCount = counts[i];
                maxValue = i;
            }
        }
        
        
        // Nombre de lancers restants cette manche
        const rollsRemaining = Math.max(0, 3 - rollsCounter);

        // Vérifier si on a des combinaisons utilisables dans la grille
        const usableChoices = availableChoices.filter(c => !c.disabled);
        
        // Si AUCUNE combo utilisable dans la grille, garder quand même les doublons/patterns
        if (usableChoices.length === 0) {
            
            // YAM (5 identiques) - Garder malgré tout
            if (maxCount === 5) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
            
            // CARRÉ (4 identiques) - Garder malgré tout
            if (maxCount >= 4) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
            
            // BRELAN (3 identiques) - Garder malgré tout
            if (maxCount >= 3) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
            
            // PAIRE (2 identiques) - Garder pour anticiper
            if (maxCount === 2) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
            
            // Vraiment rien d'intéressant - tout relancer
            return [];
        }
        
        // Compter combien de jetons le bot a posé sur la grille
        let botTokensCount = 0;
        const botTokenPositions = [];
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                if (grid[r][c].owner === botKey) {
                    botTokensCount++;
                    botTokenPositions.push({ row: r, col: c });
                }
            }
        }
        
        // Vérifier si au moins 2 jetons sont alignés (horizontal, vertical, diagonal)
        const hasAlignedTokens = BotService.checkAlignedTokens(botTokenPositions);
        if (hasAlignedTokens) {
        }
        
        // STRATÉGIE DE JEU : Évaluer les coups critiques
        const strategy = BotService.determineStrategy(grid, botKey, playerKey);
        const choicesWithScores = usableChoices.map(choice => {
            const possibleCells = BotService.decision.findCellsForChoice(grid, choice.id, botKey, playerKey, strategy);
            const bestScore = possibleCells.length > 0 ? Math.max(...possibleCells.map(c => c.score)) : 0;
            return { choice, bestScore };
        });
        choicesWithScores.sort((a, b) => b.bestScore - a.bestScore);
        
        // PRIORITÉ 1 : COUPS GAGNANTS (score > 9000)
        const winningChoice = choicesWithScores.find(c => c.bestScore > 9000);
        if (winningChoice) {
            return BotService.getDicesForCombo(dices, winningChoice.choice.id, counts);
        }
        
        // PRIORITÉ 2 : BLOCAGE CRITIQUE (score > 4000)
        const blockingChoice = choicesWithScores.find(c => c.bestScore > 4000);
        if (blockingChoice) {
            return BotService.getDicesForCombo(dices, blockingChoice.choice.id, counts);
        }
        
        // PRIORITÉ 3 : ENGAGEMENT SUR LA LIGNE (dès 2 pions posés)
        if (botTokensCount >= 2) {
            const botLine = BotService.lines.getBotBestLine(grid, botKey, playerKey);
            const opLine  = BotService.lines.getOpponentBestLine(grid, botKey, playerKey);

            // 3a. BLOCAGE URGENT : l'adversaire a 3+ pions sur sa ligne
            if (opLine && opLine.playerCount >= 3) {
                const blockNeeded = BotService.lines.getNeededComboIds(opLine.remaining);
                const proxList = usableChoices
                    .filter(c => blockNeeded.has(c.id))
                    .map(c => ({
                        choice: c,
                        proximity: BotService.evaluateComboProximity(dices, c.id, counts),
                        successProb: BotService.estimateSuccessProbability(c.id, counts, rollsRemaining)
                    }))
                    .sort((a, b) => (b.proximity * 10 + b.successProb) - (a.proximity * 10 + a.successProb));

                if (proxList.length > 0) {
                    const best = proxList[0];
                    const kept = BotService.getDicesForTargetCombo(dices, best.choice.id, counts);
                    if (kept.length > 0) {
                        return kept;
                    }
                    return [];
                }
                return [];
            }

            // 3a'. SURVEILLANCE : l'adversaire a 2 pions (bloquer si coût faible et bot pas déjà avancé)
            if (opLine && opLine.playerCount === 2) {
                const botIsAdvanced = botLine && botLine.botCount >= 3;
                if (!botIsAdvanced) {
                    const blockNeeded = BotService.lines.getNeededComboIds(opLine.remaining);
                    const proxList = usableChoices
                        .filter(c => blockNeeded.has(c.id))
                        .map(c => ({
                            choice: c,
                            proximity: BotService.evaluateComboProximity(dices, c.id, counts),
                            successProb: BotService.estimateSuccessProbability(c.id, counts, rollsRemaining)
                        }))
                        .filter(c => c.proximity >= 5) // seulement si déjà bien aligné
                        .sort((a, b) => (b.proximity * 10 + b.successProb) - (a.proximity * 10 + a.successProb));

                    if (proxList.length > 0) {
                        const best = proxList[0];
                        const kept = BotService.getDicesForTargetCombo(dices, best.choice.id, counts);
                        if (kept.length > 0) {
                            return kept;
                        }
                    }
                }
                // Surveillance non déclenchée → continuer vers l'offensive
            }

            // 3b. OFFENSIVE : cibler les combos nécessaires sur toutes les lignes bot actives
            // On essaie la meilleure ligne en premier, puis les lignes secondaires (fallback)
            if (botLine && botLine.remaining.length > 0) {
                const allActiveBotLines = BotService.lines.getAll(grid)
                    .map(line => {
                        const mine = line.filter(c => c.owner === botKey);
                        const theirs = line.filter(c => c.owner === playerKey);
                        const remaining = line.filter(c => c.owner === null);
                        if (theirs.length > 0 || mine.length === 0) return null;
                        return { botCount: mine.length, remaining, neededIds: BotService.lines.getNeededComboIds(remaining) };
                    })
                    .filter(Boolean)
                    .sort((a, b) => b.botCount - a.botCount);

                for (const [lineIdx, targetLine] of allActiveBotLines.entries()) {
                    const proxList = usableChoices
                        .filter(c => targetLine.neededIds.has(c.id))
                        .map(c => ({
                            choice: c,
                            proximity: BotService.evaluateComboProximity(dices, c.id, counts),
                            successProb: BotService.estimateSuccessProbability(c.id, counts, rollsRemaining)
                        }))
                        .sort((a, b) => (b.proximity * 10 + b.successProb) - (a.proximity * 10 + a.successProb));

                    if (proxList.length === 0) {
                        continue;
                    }

                    const best = proxList[0];

                    // Prob trop faible sur la ligne principale → on laisse tomber en mode opportuniste
                    if (lineIdx === 0 && best.successProb < 5 && rollsRemaining <= 1) {
                        break;
                    }

                    // Prob trop faible sur une ligne secondaire → essayer la suivante
                    if (lineIdx > 0 && best.successProb < 5 && rollsRemaining <= 1) {
                        continue;
                    }
                    const kept = BotService.getDicesForTargetCombo(dices, best.choice.id, counts);
                    if (kept.length > 0) {
                        return kept;
                    }
                }

                // Aucune ligne exploitable
                return [];
            }

            // Toutes les lignes sont bloquées → tombons en mode opportuniste
        }
        
        // PRIORITÉ 4 : COMBOS SELON LES DÉS ACTUELS (mode opportuniste - début de partie)
        
        // YAM (5 identiques) - TOUJOURS garder
        if (maxCount === 5) {
            const hasYam = usableChoices.some(c => c.id === 'yam' || c.id.startsWith('yam'));
            if (hasYam) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
        }
        
        // CARRÉ (4 identiques) - TOUJOURS garder
        if (maxCount >= 4) {
            const hasCarre = usableChoices.some(c => c.id === 'carre' || c.id.startsWith('carre'));
            if (hasCarre) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
        }
        
        // FULL (brelan + paire) - TOUJOURS garder
        if (maxCount === 3) {
            let pairValue = 0;
            for (let i = 1; i <= 6; i++) {
                if (i !== maxValue && counts[i] === 2) {
                    pairValue = i;
                    break;
                }
            }
            if (pairValue > 0) {
                const hasFull = usableChoices.some(c => c.id === 'full' || c.id.startsWith('full'));
                if (hasFull) {
                    return dices.filter(d => {
                        const val = parseInt(d.value);
                        return val === maxValue || val === pairValue;
                    });
                }
            }
        }
        
        // BRELAN (3 identiques) - TOUJOURS garder
        if (maxCount >= 3) {
            const hasBrelan = usableChoices.some(c => c.id === 'brelan' || c.id.startsWith('brelan'));
            if (hasBrelan) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
        }
        
        // SUITE (5 consécutifs ou 4 consécutifs)
        const sortedValues = dices.map(d => parseInt(d.value)).sort((a, b) => a - b);
        const uniqueValues = [...new Set(sortedValues)];
        const longestSeq = BotService.findLongestSequence(uniqueValues);
        
        // Suite complète (5) - TOUJOURS garder
        if (longestSeq.length === 5) {
            const hasSuite = usableChoices.some(c => c.id === 'suite' || c.id.startsWith('suite'));
            if (hasSuite) {
                const dicesToKeep = [];
                const usedValues = new Set();
                for (const dice of dices) {
                    const val = parseInt(dice.value);
                    if (longestSeq.includes(val) && !usedValues.has(val)) {
                        dicesToKeep.push(dice);
                        usedValues.add(val);
                    }
                }
                return dicesToKeep;
            }
        }
        
        // Suite partielle (4 consécutifs) - Garder pour essayer de compléter
        if (longestSeq.length === 4) {
            const hasSuite = usableChoices.some(c => c.id === 'suite' || c.id.startsWith('suite'));
            if (hasSuite) {
                const dicesToKeep = [];
                const usedValues = new Set();
                for (const dice of dices) {
                    const val = parseInt(dice.value);
                    if (longestSeq.includes(val) && !usedValues.has(val)) {
                        dicesToKeep.push(dice);
                        usedValues.add(val);
                    }
                }
                return dicesToKeep;
            }
        }
        
        // PAIRES - Garder si disponible et utile
        if (maxCount === 2) {
            // Vérifier si cette paire correspond à une combo disponible (ID = valeur du dé)
            const pairChoice = usableChoices.find(c => parseInt(c.id) === maxValue);
            
            if (pairChoice) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
        }
        
        // VALEURS HAUTES pour les points (1er lancer uniquement)
        if (rollsCounter === 1) {
            // Chercher les valeurs hautes disponibles (6 puis 5)
            for (let val = 6; val >= 5; val--) {
                if (counts[val] >= 2) {
                    const valueChoice = usableChoices.find(c => parseInt(c.id) === val);
                    if (valueChoice) {
                        return dices.filter(dice => parseInt(dice.value) === val);
                    }
                }
            }
        }
        
        // Sinon, ne rien garder (tout relancer)
        return [];
    },

    // Trouve la plus longue séquence consécutive
    findLongestSequence: (uniqueValues) => {
        let longestSeq = [];
        let currentSeq = [uniqueValues[0]];
        
        for (let i = 1; i < uniqueValues.length; i++) {
            if (uniqueValues[i] === uniqueValues[i-1] + 1) {
                currentSeq.push(uniqueValues[i]);
            } else {
                if (currentSeq.length > longestSeq.length) {
                    longestSeq = [...currentSeq];
                }
                currentSeq = [uniqueValues[i]];
            }
        }
        if (currentSeq.length > longestSeq.length) {
            longestSeq = [...currentSeq];
        }
        return longestSeq;
    },

    // Retourne les dés nécessaires pour une combo donnée
    getDicesForCombo: (dices, comboId, counts) => {
        if (comboId === 'yam' || comboId === 'carre') {
            let maxCount = 0;
            let maxValue = 0;
            for (let i = 1; i <= 6; i++) {
                if (counts[i] > maxCount) {
                    maxCount = counts[i];
                    maxValue = i;
                }
            }
            return dices.filter(dice => parseInt(dice.value) === maxValue);
        }
        
        if (comboId === 'brelan') {
            for (let i = 1; i <= 6; i++) {
                if (counts[i] >= 3) {
                    return dices.filter(dice => parseInt(dice.value) === i);
                }
            }
        }
        
        if (comboId === 'suite') {
            const sortedValues = dices.map(d => parseInt(d.value)).sort((a, b) => a - b);
            const uniqueValues = [...new Set(sortedValues)];
            const longestSeq = BotService.findLongestSequence(uniqueValues);
            const dicesToKeep = [];
            const usedValues = new Set();
            for (const dice of dices) {
                const val = parseInt(dice.value);
                if (longestSeq.includes(val) && !usedValues.has(val)) {
                    dicesToKeep.push(dice);
                    usedValues.add(val);
                }
            }
            return dicesToKeep;
        }
        
        // Pour les points (1-6), garder tous les dés de cette valeur
        const points = parseInt(comboId);
        if (!isNaN(points) && points >= 1 && points <= 6) {
            return dices.filter(dice => parseInt(dice.value) === points);
        }
        
        return [];
    },

    // Évalue la proximité entre les dés actuels et une figure ciblée (score 0-10)
    evaluateComboProximity: (dices, comboId, counts) => {
        // YAM : 5 identiques
        if (comboId === 'yam' || comboId.startsWith('yam')) {
            const maxCount = Math.max(...counts.slice(1));
            if (maxCount === 5) return 10;
            if (maxCount === 4) return 8;
            if (maxCount === 3) return 5;
            if (maxCount === 2) return 2;
            return 0;
        }
        
        // CARRÉ : 4 identiques
        if (comboId === 'carre' || comboId.startsWith('carre')) {
            const maxCount = Math.max(...counts.slice(1));
            if (maxCount >= 4) return 10;
            if (maxCount === 3) return 7;
            if (maxCount === 2) return 3;
            return 0;
        }
        
        // FULL : 3 identiques + 2 identiques
        if (comboId === 'full' || comboId.startsWith('full')) {
            const sortedCounts = counts.slice(1).sort((a, b) => b - a);
            if (sortedCounts[0] === 3 && sortedCounts[1] === 2) return 10;
            if (sortedCounts[0] === 3 && sortedCounts[1] === 1) return 6;
            if (sortedCounts[0] === 2 && sortedCounts[1] === 2) return 5;
            if (sortedCounts[0] === 3) return 4;
            if (sortedCounts[0] === 2) return 2;
            return 0;
        }
        
        // BRELAN : 3 identiques (peut avoir un suffixe comme brelan2, brelan3)
        if (comboId === 'brelan' || comboId.startsWith('brelan')) {
            // Extraire la valeur ciblée si présente (brelan2 = 2)
            const targetValue = parseInt(comboId.replace('brelan', ''));
            
            if (!isNaN(targetValue)) {
                // BRELAN spécifique (ex: brelan2)
                if (counts[targetValue] >= 3) return 10;
                if (counts[targetValue] === 2) return 6;
                if (counts[targetValue] === 1) return 2;
                return 0;
            } else {
                // BRELAN général (n'importe quelle valeur)
                const maxCount = Math.max(...counts.slice(1));
                if (maxCount >= 3) return 10;
                if (maxCount === 2) return 5;
                return 0;
            }
        }
        
        // SUITE : 5 consécutifs
        if (comboId === 'suite' || comboId.startsWith('suite')) {
            const sortedValues = dices.map(d => parseInt(d.value)).sort((a, b) => a - b);
            const uniqueValues = [...new Set(sortedValues)];
            const longestSeq = BotService.findLongestSequence(uniqueValues);
            
            if (longestSeq.length === 5) return 10;
            if (longestSeq.length === 4) return 7;
            if (longestSeq.length === 3) return 4;
            if (longestSeq.length === 2) return 2;
            return 0;
        }
        
        // POINTS (1-6) : paires de la valeur spécifique
        const points = parseInt(comboId);
        if (!isNaN(points) && points >= 1 && points <= 6) {
            if (counts[points] >= 3) return 10;
            if (counts[points] === 2) return 7;
            if (counts[points] === 1) return 3;
            return 0;
        }
        
        return 0;
    },

    // Coefficient binomial (helper interne)
    _binom: (n, k) => {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        let r = 1;
        for (let i = 0; i < k; i++) r *= (n - i) / (i + 1);
        return r;
    },

    // Estime la probabilité (0-100) d'obtenir un combo en tenant compte
    // de l'état des dés actuels et du nombre de lancers restants
    estimateSuccessProbability: (comboId, counts, rollsRemaining) => {
        const r = Math.max(0, rollsRemaining);
        // Probabilité d'obtenir au moins 'need' succès sur 'free' dés (p = 1/6)
        const binomAtLeast = (free, need) => {
            let prob = 0;
            for (let k = need; k <= free; k++) {
                prob += BotService._binom(free, k) * Math.pow(1/6, k) * Math.pow(5/6, free - k);
            }
            return prob;
        };

        // BRELAN spécifique (brelan1..brelan6)
        if (comboId.startsWith('brelan')) {
            const t = parseInt(comboId.replace('brelan', ''));
            if (isNaN(t)) return 0;
            const have = counts[t] || 0;
            if (have >= 3) return 100;
            if (r === 0) return 0;
            const need = 3 - have;
            const free = 5 - have;
            const p1 = binomAtLeast(free, need);
            if (r === 1) return Math.round(p1 * 100);
            // 2 lancers : composition (si raté, 2e chance)
            return Math.round(Math.min(95, (p1 + (1 - p1) * binomAtLeast(free, need)) * 100));
        }

        // CARRÉ
        if (comboId === 'carre') {
            let maxCount = 0;
            for (let i = 1; i <= 6; i++) if ((counts[i] || 0) > maxCount) maxCount = counts[i];
            if (maxCount >= 4) return 100;
            if (r === 0) return 0;
            const need = 4 - maxCount;
            const free = 5 - maxCount;
            const p1 = binomAtLeast(free, need);
            if (r === 1) return Math.round(p1 * 100);
            return Math.round(Math.min(90, (p1 + (1 - p1) * binomAtLeast(free, need)) * 100));
        }

        // YAM
        if (comboId === 'yam') {
            let maxCount = 0;
            for (let i = 1; i <= 6; i++) if ((counts[i] || 0) > maxCount) maxCount = counts[i];
            if (maxCount >= 5) return 100;
            if (r === 0) return 0;
            const need = 5 - maxCount;
            const free = 5 - maxCount;
            const p1 = binomAtLeast(free, need);
            if (r === 1) return Math.round(p1 * 100);
            return Math.round(Math.min(85, (p1 + (1 - p1) * p1) * 100));
        }

        // FULL
        if (comboId === 'full') {
            const sorted = counts.slice(1).sort((a, b) => b - a);
            if (sorted[0] >= 3 && sorted[1] >= 2) return 100;
            if (r === 0) return 0;
            if (sorted[0] >= 3) {
                // Brelan OK, reroll 2 dés → besoin d'une paire
                // P(2 dés identiques) = 6*(1/6)^2 = 1/6
                const pPair = 1 / 6;
                if (r >= 2) return Math.round((1 - Math.pow(1 - pPair, 2)) * 100); // ≈31%
                return Math.round(pPair * 100); // ≈17%
            }
            if (sorted[0] === 2 && sorted[1] === 2) {
                // Deux paires → promouvoir une en brelan (1 dé libre = 1/6)
                if (r >= 2) return 30;
                return 17;
            }
            return r >= 2 ? 20 : 8;
        }

        // SUITE
        if (comboId === 'suite') {
            const vals = [];
            for (let i = 1; i <= 6; i++) if ((counts[i] || 0) > 0) vals.push(i);
            const seq = BotService.findLongestSequence(vals);
            if (seq.length >= 5) return 100;
            if (r === 0) return 0;
            if (r === 1) {
                if (seq.length === 4) return 30;
                if (seq.length === 3) return 8;
                return 2;
            }
            if (seq.length === 4) return 55;
            if (seq.length === 3) return 22;
            return 6;
        }

        // MOINSHUIT (somme ≤ 8)
        if (comboId === 'moinshuit') {
            let sum = 0;
            for (let i = 1; i <= 6; i++) sum += i * (counts[i] || 0);
            if (sum <= 8) return r >= 1 ? 90 : 100;
            if (sum <= 13 && r >= 1) return 25;
            if (sum <= 17 && r >= 2) return 12;
            return 4;
        }

        // SEC : requiert de ne pas relancer → non ciblable
        if (comboId === 'sec') return 0;

        // Points (1-6) : avoir au moins un dé de cette valeur
        const pts = parseInt(comboId);
        if (!isNaN(pts) && pts >= 1 && pts <= 6) {
            const have = counts[pts] || 0;
            if (have >= 2) return 100;
            if (have === 1) return r >= 1 ? 75 : 50;
            if (r === 0) return 0;
            return Math.round((1 - Math.pow(5 / 6, 5)) * 100); // ≈60%
        }

        return 50;
    },

    // Retourne les dés à garder pour cibler une figure spécifique
    getDicesForTargetCombo: (dices, comboId, counts) => {
        // YAM : Garder la valeur la plus fréquente
        if (comboId === 'yam' || comboId.startsWith('yam')) {
            let maxCount = 0;
            let maxValue = 0;
            for (let i = 1; i <= 6; i++) {
                if (counts[i] > maxCount) {
                    maxCount = counts[i];
                    maxValue = i;
                }
            }
            if (maxCount >= 2) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
        }
        
        // CARRÉ : Garder la valeur la plus fréquente
        if (comboId === 'carre' || comboId.startsWith('carre')) {
            let maxCount = 0;
            let maxValue = 0;
            for (let i = 1; i <= 6; i++) {
                if (counts[i] > maxCount) {
                    maxCount = counts[i];
                    maxValue = i;
                }
            }
            if (maxCount >= 2) {
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
        }
        
        // FULL : Garder brelan + paire ou deux paires
        if (comboId === 'full' || comboId.startsWith('full')) {
            const pairs = [];
            for (let i = 1; i <= 6; i++) {
                if (counts[i] >= 2) pairs.push({ value: i, count: counts[i] });
            }
            pairs.sort((a, b) => b.count - a.count);
            
            if (pairs.length >= 2) {
                return dices.filter(d => {
                    const val = parseInt(d.value);
                    return val === pairs[0].value || val === pairs[1].value;
                });
            } else if (pairs.length === 1 && pairs[0].count >= 2) {
                return dices.filter(dice => parseInt(dice.value) === pairs[0].value);
            }
        }
        
        // BRELAN : Garder la valeur ciblée ou la plus fréquente
        if (comboId === 'brelan' || comboId.startsWith('brelan')) {
            const targetValue = parseInt(comboId.replace('brelan', ''));
            
            if (!isNaN(targetValue) && counts[targetValue] >= 1) {
                // BRELAN spécifique
                return dices.filter(dice => parseInt(dice.value) === targetValue);
            } else {
                // BRELAN général - garder la valeur la plus fréquente
                let maxCount = 0;
                let maxValue = 0;
                for (let i = 1; i <= 6; i++) {
                    if (counts[i] > maxCount) {
                        maxCount = counts[i];
                        maxValue = i;
                    }
                }
                if (maxCount >= 2) {
                    return dices.filter(dice => parseInt(dice.value) === maxValue);
                }
            }
        }
        
        // SUITE : Garder la plus longue séquence
        if (comboId === 'suite' || comboId.startsWith('suite')) {
            const sortedValues = dices.map(d => parseInt(d.value)).sort((a, b) => a - b);
            const uniqueValues = [...new Set(sortedValues)];
            const longestSeq = BotService.findLongestSequence(uniqueValues);
            
            if (longestSeq.length >= 3) {
                const dicesToKeep = [];
                const usedValues = new Set();
                for (const dice of dices) {
                    const val = parseInt(dice.value);
                    if (longestSeq.includes(val) && !usedValues.has(val)) {
                        dicesToKeep.push(dice);
                        usedValues.add(val);
                    }
                }
                return dicesToKeep;
            }
        }
        
        // POINTS (1-6) : Garder tous les dés de cette valeur
        const points = parseInt(comboId);
        if (!isNaN(points) && points >= 1 && points <= 6) {
            if (counts[points] >= 1) {
                return dices.filter(dice => parseInt(dice.value) === points);
            }
        }
        
        return [];
    }
};

module.exports = BotService;
