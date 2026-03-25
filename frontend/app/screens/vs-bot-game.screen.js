import React, { useContext } from "react";
import { View, Text } from "react-native";
import styles from './vs-bot-game.styles';
import { SocketContext } from '../contexts/socket.context';
import { useLanguage } from '../contexts/language.context';
import VsBotGameController from '../controllers/vs-bot-game.controller';

export default function VsBotGameScreen({ navigation }) {

    const socket = useContext(SocketContext);
    const { language, t } = useLanguage();

    return (
        <View style={styles.container}>
            {!socket ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.paragraph}>
                        {t('noConnectionTitle')}
                    </Text>
                    <Text style={styles.footnote}>
                        {t('noConnectionSubtext')}
                    </Text>
                </View>
            ) : (
                <VsBotGameController 
                    navigation={navigation} 
                    language={language} 
                    onGameStateChange={undefined}
                />
            )}
        </View>
    );
}
