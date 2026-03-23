import React, { useEffect, useContext, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const Grid = () => {

    const socket = useContext(SocketContext);

    const [displayGrid, setDisplayGrid] = useState(true);
    const [canSelectCells, setCanSelectCells] = useState([]);
    const [grid, setGrid] = useState([]);
    const [playerKey, setPlayerKey] = useState(null);

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

    return (
        <View style={styles.gridContainer}>
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

const styles = StyleSheet.create({
    gridContainer: {
        flex: 7,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        width: "100%",
        padding: 10,
    },
    row: {
        flexDirection: "row",
        flex: 1,
        width: "100%",
    },
    cell: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#3D2817",
        borderWidth: 2,
        borderColor: "#8B6F47",
        padding: 5,
        minHeight: 40,
        position: 'relative',
    },
    cellText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#F6DEB2",
        zIndex: 1,
    },
    canBeCheckedCell: {
        backgroundColor: "#FFF9C4",
        borderColor: "#F9A825",
    },
    topBorder: {
        borderTopWidth: 2,
    },
    leftBorder: {
        borderLeftWidth: 2,
    },
    tokenImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
    },
});

export default Grid;
