import React, { useContext, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SocketContext } from '../../../contexts/socket.context';

const Choices = () => {

    const socket = useContext(SocketContext);

    const [displayChoices, setDisplayChoices] = useState(false);
    const [canMakeChoice, setCanMakeChoice] = useState(false);
    const [idSelectedChoice, setIdSelectedChoice] = useState(null);
    const [availableChoices, setAvailableChoices] = useState([]);

    useEffect(() => {

        socket.on("game.choices.view-state", (data) => {
            setDisplayChoices(data['displayChoices']);
            setCanMakeChoice(data['canMakeChoice']);
            setIdSelectedChoice(data['idSelectedChoice']);
            setAvailableChoices(data['availableChoices']);
        });

        return () => {
            socket.off("game.choices.view-state");
        };

    }, []);

    const handleSelectChoice = (choiceId) => {

        if (canMakeChoice) {
            setIdSelectedChoice(choiceId);
            socket.emit("game.choices.selected", { choiceId });
        }

    };

    return (
        <View style={styles.mainContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>⚡ COMBINAISONS DISPONIBLES</Text>
            </View>
            
            <View style={styles.choicesContainer}>
                {displayChoices && availableChoices.length > 0 ? (
                    availableChoices.map((choice) => (
                        <TouchableOpacity
                            key={choice.id}
                            style={[
                                styles.choiceButton,
                                idSelectedChoice === choice.id && styles.selectedChoice,
                                (!canMakeChoice || choice.disabled) && styles.disabledChoice
                            ]}
                            onPress={() => handleSelectChoice(choice.id)}
                            disabled={!canMakeChoice || choice.disabled}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.choiceText,
                                idSelectedChoice === choice.id && styles.selectedChoiceText,
                                choice.disabled && styles.disabledChoiceText
                            ]}>
                                {choice.value}
                            </Text>
                        </TouchableOpacity>
                    ))
                ) : displayChoices ? (
                    <View style={styles.noChoicesContainer}>
                        <Text style={styles.noChoicesText}>Aucune combinaison disponible</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: 'rgba(70, 11, 0, 0.85)',
        borderRadius: 12,
        margin: 8,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#D89A2E',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    headerContainer: {
        backgroundColor: 'rgba(139, 0, 0, 0.9)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#FFD700',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    choicesContainer: {
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-around",
        alignItems: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 8,
        gap: 6,
    },
    choiceButton: {
        backgroundColor: 'rgba(245, 222, 179, 0.95)',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginVertical: 3,
        minWidth: '30%',
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: '#D4AF37',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    selectedChoice: {
        backgroundColor: 'rgba(34, 139, 34, 0.95)',
        borderColor: '#FFD700',
        borderWidth: 3,
        shadowColor: '#32CD32',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 10,
        transform: [{ scale: 1.05 }],
    },
    choiceText: {
        fontSize: 15,
        fontWeight: "bold",
        color: '#3E2723',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    selectedChoiceText: {
        color: '#FFFFFF',
        fontSize: 16,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    disabledChoice: {
        opacity: 0.4,
    },
    disabledChoiceText: {
        color: '#8B7355',
        textDecorationLine: 'line-through',
    },
    noChoicesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
    },
    noChoicesText: {
        fontSize: 14,
        color: '#DEB887',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});

export default Choices;
