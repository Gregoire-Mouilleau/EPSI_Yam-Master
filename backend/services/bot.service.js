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
        
        // Filtrer les choix non disabled
        const usableChoices = availableChoices.filter(choice => !choice.disabled);
        if (usableChoices.length === 0) return null;

        // Pour chaque choix, évaluer quelle case on pourrait prendre
        const choicesWithEval = usableChoices.map(choice => {
            const possibleCells = BotService.decision.findCellsForChoice(grid, choice.id, botKey, playerKey, strategy);
            return {
                choice,
                possibleCells,
                bestCellScore: possibleCells.length > 0 ? Math.max(...possibleCells.map(c => c.score)) : 0
            };
        });

        // Trier par score de la meilleure case possible
        choicesWithEval.sort((a, b) => b.bestCellScore - a.bestCellScore);
        
        // Stratégie : choisir le meilleur choix avec un peu d'aléatoire (70% meilleur, 30% top 3)
        if (Math.random() < 0.7 || choicesWithEval.length === 1) {
            return choicesWithEval[0].choice;
        } else {
            const topChoices = choicesWithEval.slice(0, Math.min(3, choicesWithEval.length));
            return topChoices[Math.floor(Math.random() * topChoices.length)].choice;
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
            
            // 1. Vérifier si c'est un coup gagnant (priorité maximale)
            const testGrid = JSON.parse(JSON.stringify(grid));
            testGrid[row][col].owner = botKey;
            if (BotService.analysis.checkLineOf5At(testGrid, row, col, botKey)) {
                return 10000; // Coup gagnant !
            }
            
            // 2. Vérifier si ça bloque un coup gagnant de l'adversaire
            const testGrid2 = JSON.parse(JSON.stringify(grid));
            testGrid2[row][col].owner = playerKey;
            if (BotService.analysis.checkLineOf5At(testGrid2, row, col, playerKey)) {
                score += 5000; // Bloquer une victoire adverse
            }
            
            // 3. Évaluer le potentiel de la case pour créer des lignes
            const potential = BotService.analysis.evaluateCellPotential(grid, row, col, botKey);
            score += potential * 100;
            
            // 4. Favoriser le centre de la grille (positions stratégiques)
            const centerDistance = Math.abs(row - 2) + Math.abs(col - 2);
            score += (4 - centerDistance) * 10;
            
            // 5. Ajuster selon la stratégie
            if (strategy === 'aggressive') {
                // Favoriser les cases qui créent des menaces multiples
                score += potential * 50;
            } else if (strategy === 'defensive') {
                // Favoriser les cases qui bloquent l'adversaire
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
        
        console.log('[BOT decideDicesToLock] Lancer', rollsCounter, 'Valeurs:', dices.map(d => `${d.id}=${d.value}`));
        
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
        
        console.log('[BOT] Pattern détecté:', maxCount, 'x', maxValue, '| Fréquences:', counts);
        
        // Vérifier si on a des combinaisons utilisables dans la grille
        const usableChoices = availableChoices.filter(c => !c.disabled);
        console.log('[BOT] Combinaisons utilisables:', usableChoices.map(c => c.id));
        
        // Si AUCUNE combo utilisable dans la grille, garder quand même les doublons/patterns
        if (usableChoices.length === 0) {
            console.log('[BOT] Aucune combo utilisable dans la grille');
            
            // YAM (5 identiques) - Garder malgré tout
            if (maxCount === 5) {
                console.log('[BOT] ⭐ YAM détecté (5x', maxValue, ') - conserve malgré grille pleine');
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
            
            // CARRÉ (4 identiques) - Garder malgré tout
            if (maxCount >= 4) {
                console.log('[BOT] ⭐ CARRÉ détecté (4x', maxValue, ') - conserve malgré grille pleine');
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
            
            // BRELAN (3 identiques) - Garder malgré tout
            if (maxCount >= 3) {
                console.log('[BOT] ⭐ BRELAN détecté (3x', maxValue, ') - conserve malgré grille pleine');
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
            
            // PAIRE (2 identiques) - Garder pour anticiper
            if (maxCount === 2) {
                console.log('[BOT] ⭐ PAIRE détectée (2x', maxValue, ') - conserve pour anticiper');
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
            
            // Vraiment rien d'intéressant - tout relancer
            console.log('[BOT] ❌ Aucun doublon - relance tous les dés');
            return [];
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
            console.log('[BOT] 🏆 COUP GAGNANT avec', winningChoice.choice.id);
            return BotService.getDicesForCombo(dices, winningChoice.choice.id, counts);
        }
        
        // PRIORITÉ 2 : BLOCAGE CRITIQUE (score > 4000)
        const blockingChoice = choicesWithScores.find(c => c.bestScore > 4000);
        if (blockingChoice) {
            console.log('[BOT] 🛡️ BLOCAGE CRITIQUE avec', blockingChoice.choice.id);
            return BotService.getDicesForCombo(dices, blockingChoice.choice.id, counts);
        }
        
        // PRIORITÉ 3 : COMBOS SELON LES DÉS ACTUELS
        
        // YAM (5 identiques) - TOUJOURS garder
        if (maxCount === 5) {
            const hasYam = usableChoices.some(c => c.id === 'yam' || c.id.startsWith('yam'));
            if (hasYam) {
                console.log('[BOT] ⭐ YAM détecté - conserve 5x', maxValue);
                return dices.filter(dice => parseInt(dice.value) === maxValue);
            }
        }
        
        // CARRÉ (4 identiques) - TOUJOURS garder
        if (maxCount >= 4) {
            const hasCarre = usableChoices.some(c => c.id === 'carre' || c.id.startsWith('carre'));
            if (hasCarre) {
                console.log('[BOT] ⭐ CARRÉ détecté - conserve 4x', maxValue);
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
                    console.log('[BOT] ⭐ FULL détecté - conserve 3x', maxValue, '+ 2x', pairValue);
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
                console.log('[BOT] ⭐ BRELAN détecté - conserve 3x', maxValue);
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
                console.log('[BOT] ⭐ SUITE complète détectée');
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
                console.log('[BOT] ⭐ Suite partielle (4) - conserve:', longestSeq);
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
                console.log('[BOT] ⭐ PAIRE de', maxValue, 'détectée et disponible');
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
                        console.log('[BOT] ⭐ Valeurs hautes:', counts[val], 'x', val);
                        return dices.filter(dice => parseInt(dice.value) === val);
                    }
                }
            }
        }
        
        // Sinon, ne rien garder (tout relancer)
        console.log('[BOT] ❌ Rien à garder - relance tous les dés');
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
    }
};

module.exports = BotService;
