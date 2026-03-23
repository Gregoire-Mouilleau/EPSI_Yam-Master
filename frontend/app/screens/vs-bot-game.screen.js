import React, { useContext, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { SocketContext } from '../contexts/socket.context';
import VsBotGameController from '../controllers/vs-bot-game.controller';

export default function VsBotGameScreen({ navigation }) {

    const socket = useContext(SocketContext);
    const [isInGame, setIsInGame] = useState(false);

    return (
        <View style={styles.container}>
            {!socket ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.paragraph}>
                        Pas de connexion avec le serveur...
                    </Text>
                    <Text style={styles.footnote}>
                        Redémarrez l'application et attendez que le serveur soit de nouveau en ligne.
                    </Text>
                </View>
            ) : (
                <VsBotGameController 
                    navigation={navigation} 
                    language="FR" 
                    onGameStateChange={setIsInGame}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2C1810",
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    paragraph: {
        fontSize: 16,
        marginBottom: 10,
        color: '#FFD700',
    },
    footnote: {
        fontSize: 14,
        fontStyle: "italic",
        marginBottom: 20,
    },
});
