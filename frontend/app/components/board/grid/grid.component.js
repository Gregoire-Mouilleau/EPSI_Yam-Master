import React, { useEffect, useContext, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import styles from './grid.styles';
import { SocketContext } from "../../../contexts/socket.context";

const Grid = () => {

    const socket = useContext(SocketContext);

    const [displayGrid, setDisplayGrid] = useState(true);
    const [canSelectCells, setCanSelectCells] = useState([]);
    const [grid, setGrid] = useState([]);
    const [playerKey, setPlayerKey] = useState(null);
    const [player1PiecesLeft, setPlayer1PiecesLeft] = useState(12);
    const [player2PiecesLeft, setPlayer2PiecesLeft] = useState(12);

    const handleSelectCell = (cellId, rowIndex, cellIndex) => {
        if (canSelectCells) {
            socket.emit("game.grid.selected", { cellId, rowIndex, cellIndex });
        }
    };

    useEffect(() => {
        socket.on("game.grid.view-state", (data) => {
            setDisplayGrid(data['displayGrid']);
            setCanSelectCells(data['canSelectCells']);
            setPlayerKey(data['playerKey']);
            setGrid(data['grid']);
            if (data['player1PiecesLeft'] !== undefined) setPlayer1PiecesLeft(data['player1PiecesLeft']);
            if (data['player2PiecesLeft'] !== undefined) setPlayer2PiecesLeft(data['player2PiecesLeft']);
        });

        return () => {
            socket.off("game.grid.view-state");
        };
    }, []);

    const renderToken = (owner) => {
        if (!owner || owner === null) return null;
        
        // Si l'owner est le joueur actuel, jeton vert, sinon rouge
        const isCurrentPlayer = owner === playerKey;
        
        return (
            <Image 
                source={isCurrentPlayer 
                    ? require('../../../../assets/jeton_vert.png')
                    : require('../../../../assets/jeton_rouge.png')
                } 
                style={styles.tokenImage}
                resizeMode="contain"
            />
        );
    };

    const myPieces = playerKey === 'player:1' ? player1PiecesLeft : player2PiecesLeft;
    const opponentPieces = playerKey === 'player:1' ? player2PiecesLeft : player1PiecesLeft;

    return (
        <View style={styles.gridContainer}>
            {displayGrid && (
                <View style={styles.piecesRow}>
                    <Text style={styles.piecesText}>⚫ {opponentPieces}</Text>
                    <Text style={styles.piecesLabel}>pions restants</Text>
                    <Text style={styles.piecesTextOwn}>🟢 {myPieces}</Text>
                </View>
            )}
            {displayGrid &&
                grid.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((cell, cellIndex) => (
                            <TouchableOpacity
                                key={cell.id}
                                style={[
                                    styles.cell,
                                    (cell.canBeChecked && !(cell.owner === "player:1") && !(cell.owner === "player:2")) && styles.canBeCheckedCell,
                                    rowIndex !== 0 && styles.topBorder,
                                    cellIndex !== 0 && styles.leftBorder,
                                ]}
                                onPress={() => handleSelectCell(cell.id, rowIndex, cellIndex)}
                                disabled={!cell.canBeChecked}
                            >
                                <Text style={styles.cellText}>{cell.viewContent}</Text>
                                {renderToken(cell.owner)}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
        </View>
    );
};

export default Grid;
