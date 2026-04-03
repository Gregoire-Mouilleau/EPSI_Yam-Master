import React, { useContext, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import styles from './choices.styles';
import { SocketContext } from '../../../contexts/socket.context';
import { useLanguage } from '../../../contexts/language.context';

const Choices = () => {

    const socket = useContext(SocketContext);
    const { t } = useLanguage();

    const [displayChoices, setDisplayChoices] = useState(false);
    const [canMakeChoice, setCanMakeChoice] = useState(false);
    const [idSelectedChoice, setIdSelectedChoice] = useState(null);
    const [availableChoices, setAvailableChoices] = useState([]);
    const [isDefiMode, setIsDefiMode] = useState(false);
    const [defiRollCount, setDefiRollCount] = useState(0);

    useEffect(() => {

        socket.on("game.choices.view-state", (data) => {
            setDisplayChoices(data['displayChoices']);
            setCanMakeChoice(data['canMakeChoice']);
            setIdSelectedChoice(data['idSelectedChoice']);
            setAvailableChoices(data['availableChoices']);
            setIsDefiMode(data['isDefiMode'] || false);
            setDefiRollCount(data['defiRollCount'] || 0);
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
                <Text style={styles.headerText}>{t('choicesHeader')}</Text>
            </View>
            
            <View style={styles.choicesContainer}>
                {/* Indicateur défi actif (attente d'un lancer pour valider) */}
                {isDefiMode && availableChoices.length === 0 ? (
                    <View style={styles.defiModeContainer}>
                        <Text style={styles.defiModeText}>{t('defiModeActive')}</Text>
                        <Text style={styles.defiModeSubText}>{t('defiModeRoll')}</Text>
                        <Text style={styles.defiRollCountText}>{defiRollCount} / 2</Text>
                    </View>
                ) : displayChoices && availableChoices.length > 0 ? (
                    availableChoices.map((choice) => (
                        <TouchableOpacity
                            key={choice.id}
                            style={[
                                styles.choiceButton,
                                choice.id === 'defi' && styles.defiChoice,
                                idSelectedChoice === choice.id && styles.selectedChoice,
                                (!canMakeChoice || choice.disabled) && styles.disabledChoice
                            ]}
                            onPress={() => handleSelectChoice(choice.id)}
                            disabled={!canMakeChoice || choice.disabled}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.choiceText,
                                choice.id === 'defi' && styles.defiChoiceText,
                                idSelectedChoice === choice.id && styles.selectedChoiceText,
                                choice.disabled && styles.disabledChoiceText
                            ]}>
                                {choice.value}
                            </Text>
                        </TouchableOpacity>
                    ))
                ) : displayChoices ? (
                    <View style={styles.noChoicesContainer}>
                        <Text style={styles.noChoicesText}>{t('choicesNone')}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
};

export default Choices;
