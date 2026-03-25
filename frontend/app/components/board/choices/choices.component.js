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
                <Text style={styles.headerText}>{t('choicesHeader')}</Text>
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
                        <Text style={styles.noChoicesText}>{t('choicesNone')}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
};

export default Choices;
