import React, { useContext, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { SocketContext } from '../contexts/socket.context';
import { AuthContext } from '../contexts/auth.context';
import OnlineGameController from "../controllers/online-game.controller";
import Background from "../components/Background";
import FloatingDice from "../components/FloatingDice";
import Header from "../components/Header";

export default function OnlineGameScreen({ navigation }) {

    const socket = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const [language] = useState('FR'); // Default to French

    return (
        <View style={styles.container}>
            <Background />
            <FloatingDice />
            <Header 
                onProfilePress={() => navigation.navigate('ProfileScreen')}
                onLeaderboardPress={() => navigation.navigate('LeaderboardScreen')}
                profileLabel={user ? user.pseudo : 'Sign In'}
                isAuthenticated={!!user}
                avatarKey={user?.avatarKey}
            />
            
            <View style={styles.content}>
                {!socket ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>⚠️ No connection</Text>
                        <Text style={styles.errorText}>
                            Unable to connect to the server.
                        </Text>
                        <Text style={styles.errorSubtext}>
                            Please restart the app and try again.
                        </Text>
                    </View>
                ) : (
                    <OnlineGameController navigation={navigation} language={language} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 2,
    },
    errorContainer: {
        backgroundColor: 'rgba(70, 11, 0, 0.76)',
        padding: 40,
        borderRadius: 34,
        borderWidth: 5,
        borderColor: '#D89A2E',
        alignItems: 'center',
        maxWidth: 400,
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 22,
        elevation: 10,
    },
    errorTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FDE047',
        marginBottom: 20,
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    errorText: {
        fontSize: 18,
        color: '#F6DEB2',
        textAlign: 'center',
        marginBottom: 10,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#DEB887',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
