import { useState, useRef } from 'react';

export default function useGameDeck(socket) {
    const [playerDices, setPlayerDices] = useState([]);
    const [opponentDices, setOpponentDices] = useState([]);
    const [isDiceRolling, setIsDiceRolling] = useState(false);
    const [isOpponentRolling, setIsOpponentRolling] = useState(false);
    const [displayRollButton, setDisplayRollButton] = useState(false);
    const [displayOpponentDeck, setDisplayOpponentDeck] = useState(false);

    const playerDicesRef = useRef([]);
    const opponentDicesRef = useRef([]);
    const playerRollsCounterRef = useRef(0);
    const opponentRollsCounterRef = useRef(0);

    const handleDeckViewState = (data) => {
        if (data['displayPlayerDeck'] && data['dices']) {
            const prevRollsCounter = playerRollsCounterRef.current;
            const newRollsCounter = data['rollsCounter'];

            if (newRollsCounter === 1 && prevRollsCounter > 1) {
                playerRollsCounterRef.current = 1;
            } else if (newRollsCounter > prevRollsCounter && prevRollsCounter > 0) {
                setIsDiceRolling(true);
                setTimeout(() => setIsDiceRolling(false), 2200);
                playerRollsCounterRef.current = newRollsCounter;
            } else {
                playerRollsCounterRef.current = newRollsCounter;
            }

            playerDicesRef.current = data['dices'];
            setPlayerDices(data['dices']);
            setDisplayRollButton(data['displayRollButton'] || false);
        }

        if (data['displayOpponentDeck'] && data['dices']) {
            const prevOppRollsCounter = opponentRollsCounterRef.current;
            const newOppRollsCounter = data['rollsCounter'];

            if (newOppRollsCounter === 1 && prevOppRollsCounter > 1) {
                opponentRollsCounterRef.current = 1;
            } else if (newOppRollsCounter > prevOppRollsCounter && prevOppRollsCounter > 0) {
                setIsOpponentRolling(true);
                setTimeout(() => setIsOpponentRolling(false), 2200);
                opponentRollsCounterRef.current = newOppRollsCounter;
            } else {
                opponentRollsCounterRef.current = newOppRollsCounter;
            }

            opponentDicesRef.current = data['dices'];
            setOpponentDices(data['dices']);
            setDisplayOpponentDeck(true);
        } else if (!data['displayOpponentDeck']) {
            setDisplayOpponentDeck(false);
        }
    };

    const handleDiceLock = (index) => {
        const dice = playerDices[index];
        if (dice && dice.value && displayRollButton) {
            socket.emit('game.dices.lock', dice.id);
        }
    };

    return {
        playerDices,
        opponentDices,
        isDiceRolling,
        isOpponentRolling,
        displayRollButton,
        displayOpponentDeck,
        handleDeckViewState,
        handleDiceLock,
    };
}
