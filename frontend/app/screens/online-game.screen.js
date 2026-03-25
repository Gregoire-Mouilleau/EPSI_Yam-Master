import React, { useContext } from "react";
import { View, Text } from "react-native";
import styles from './online-game.styles';
import { SocketContext } from '../contexts/socket.context';
import { AuthContext } from '../contexts/auth.context';
import { useLanguage } from '../contexts/language.context';
import OnlineGameController from "../controllers/online-game.controller";
import Background from "../components/Background";
import FloatingDice from "../components/FloatingDice";
import Header from "../components/Header";

export default function OnlineGameScreen({ navigation }) {

    const socket = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const { language, t } = useLanguage();
    const [isPlaying, setIsPlaying] = React.useState(false);

    return (
        <View style={styles.container}>
            {!isPlaying && (
                <>
                    <Background />
                    <FloatingDice />
                    <Header 
                        onProfilePress={() => navigation.navigate('ProfileScreen')}
                        onLeaderboardPress={() => navigation.navigate('LeaderboardScreen')}
                        profileLabel={user ? user.pseudo : t('signIn')}
                        isAuthenticated={!!user}
                        avatarKey={user?.avatarKey}
                    />
                </>
            )}
            
            <View style={[styles.content, isPlaying && styles.contentPlaying]}>
                {!socket ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>{t('noConnectionTitle')}</Text>
                        <Text style={styles.errorText}>
                            {t('noConnectionText')}
                        </Text>
                        <Text style={styles.errorSubtext}>
                            {t('noConnectionSubtext')}
                        </Text>
                    </View>
                ) : (
                    <OnlineGameController 
                        navigation={navigation} 
                        language={language} 
                        onGameStateChange={setIsPlaying}
                    />
                )}
            </View>
        </View>
    );
}
