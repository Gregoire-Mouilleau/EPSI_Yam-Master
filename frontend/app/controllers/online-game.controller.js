import React, { useEffect, useState, useContext } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { SocketContext } from '../contexts/socket.context';


export default function OnlineGameController({ navigation }) {

    const socket = useContext(SocketContext);

    const [inQueue, setInQueue] = useState(false);
    const [inGame, setInGame] = useState(false);
    const [idOpponent, setIdOpponent] = useState(null);

    useEffect(() => {
        console.log('[emit][get.state]:', socket.id);
        socket.emit("get.state");
        
        console.log('[emit][queue.join]:', socket.id);
        socket.emit("queue.join");
        
        setInQueue(false);
        setInGame(false);

        socket.on('queue.added', (data) => {
            console.log('[listen][queue.added]:', data);
            setInQueue(data['inQueue']);
            setInGame(data['inGame']);
        });

        socket.on('queue.left', (data) => {
            console.log('[listen][queue.left]:', data);
        });

        socket.on('game.start', (data) => {
            console.log('[listen][game.start]:', data);
            setInQueue(data['inQueue']);
            setInGame(data['inGame']);
            setIdOpponent(data['idOpponent']);
        });

        socket.on('opponent.disconnected', (data) => {
            console.log('[listen][opponent.disconnected]:', data);
            alert('Votre adversaire s\'est déconnecté');
            setInQueue(false);
            setInGame(false);
            setIdOpponent(null);
            navigation.navigate('HomeScreen');
        });

        return () => {
            console.log('[cleanup][queue.leave]:', socket.id);
            socket.emit("queue.leave");
            socket.off('queue.added');
            socket.off('queue.left');
            socket.off('game.start');
            socket.off('opponent.disconnected');
        };
    }, []);

    const handleLeaveQueue = () => {
        console.log('[emit][queue.leave]:', socket.id);
        socket.emit("queue.leave");
        setInQueue(false);
        setInGame(false);
        navigation.navigate('HomeScreen');
    };

    return (
        <View style={styles.container}>
            {!inQueue && !inGame && (
                <>
                    <Text style={styles.paragraph}>
                        Waiting for server datas...
                    </Text>
                </>
            )}

            {inQueue && (
                <>
                    <Text style={styles.paragraph}>
                        Waiting for another player...
                    </Text>
                    <View style={{ marginTop: 20 }}>
                        <Button
                            title="Quitter la file d'attente"
                            onPress={handleLeaveQueue}
                            color="#ff6347"
                        />
                    </View>
                </>
            )}

            {inGame && (
                <>
                    <Text style={styles.paragraph}>
                        Game found !
                    </Text>
                    <Text style={styles.paragraph}>
                        Player - {socket.id} -
                    </Text>
                    <Text style={styles.paragraph}>
                        - vs -
                    </Text>
                    <Text style={styles.paragraph}>
                        Player - {idOpponent} -
                    </Text>
                </>
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
        width: '100%',
        height: '100%',
    },
    paragraph: {
        fontSize: 16,
    }
});
