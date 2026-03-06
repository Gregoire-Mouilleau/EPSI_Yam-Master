import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './app/screens/home.screen';
import OnlineGameScreen from './app/screens/online-game.screen';
import VsBotGameScreen from './app/screens/vs-bot-game.screen';
import ProfileScreen from './app/screens/profile.screen';
import LeaderboardScreen from './app/screens/leaderboard.screen';
import { SocketContext, socket } from './app/contexts/socket.context';
import { AuthProvider } from './app/contexts/auth.context';

const Stack = createStackNavigator();

function App() {
  return (
    <SocketContext.Provider value={socket}>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="LeaderboardScreen" component={LeaderboardScreen} />
            <Stack.Screen name="OnlineGameScreen" component={OnlineGameScreen} />
            <Stack.Screen name="VsBotGameScreen" component={VsBotGameScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SocketContext.Provider>
  );
}

export default App;
