import React, { useEffect, useContext, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const Grid = () => {

    const socket = useContext(SocketContext);

    const [displayGrid, setDisplayGrid] = useState(true);
    const [canSelectCells, setCanSelectCells] = useState([]);
    const [grid, setGrid] = useState([]);

    const handleSelectCell = (cellId, rowIndex, cellIndex) => {
        if (canSelectCells) {
            socket.emit("game.grid.selected", { cellId, rowIndex, cellIndex });
        }
    };

    useEffect(() => {
        socket.on("game.grid.view-state", (data) => {
            setDisplayGrid(data['displayGrid']);
            setCanSelectCells(data['canSelectCells'])
            setGrid(data['grid']);
        });

        return () => {
            socket.off("game.grid.view-state");
        };
    }, []);

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
                                    cell.owner === "player:1" && styles.playerOwnedCell,
                                    cell.owner === "player:2" && styles.opponentOwnedCell,
                                    (cell.canBeChecked && !(cell.owner === "player:1") && !(cell.owner === "player:2")) && styles.canBeCheckedCell,
                                    rowIndex !== 0 && styles.topBorder,
                                    cellIndex !== 0 && styles.leftBorder,
                                ]}
                                onPress={() => handleSelectCell(cell.id, rowIndex, cellIndex)}
                                disabled={!cell.canBeChecked}
                            >
                                <Text style={styles.cellText}>{cell.viewContent}</Text>
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
    },
    cellText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#F6DEB2",
    },
    playerOwnedCell: {
        backgroundColor: "#4CAF50",
        borderColor: "#2E7D32",
    },
    opponentOwnedCell: {
        backgroundColor: "#F44336",
        borderColor: "#C62828",
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
});

export default Grid;
