import React, { useContext } from "react";
import { StyleSheet, View, Button, Text } from "react-native";
import { SocketContext } from '../contexts/socket.context';

export default function VsBotGameScreen({ navigation }) {

    const socket = useContext(SocketContext);

    return (
        <View style={styles.container}>
            {!socket ? (
                <View>
                    <Text style={styles.paragraph}>
                        No connection with server...
                    </Text>
                    <Text style={styles.footnote}>
                        Restart the app and wait for the server to be back again.
                    </Text>
                </View>
            ) : (
                <View>
                    <Text style={styles.paragraph}>
                        VsBot Game Interface
                    </Text>
                    <Text style={styles.footnote}>
                        My socket id is: {socket.id}
                    </Text>
                    <Button
                        title="Revenir au menu"
                        onPress={() => navigation.navigate('HomeScreen')}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    paragraph: {
        fontSize: 16,
        marginBottom: 10,
    },
    footnote: {
        fontSize: 14,
        fontStyle: "italic",
        marginBottom: 20,
    },
});
