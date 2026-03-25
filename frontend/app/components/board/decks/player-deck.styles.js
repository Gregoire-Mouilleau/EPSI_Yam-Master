import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  deckPlayerContainer: {
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  rollInfoContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  rollInfoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  rollButton: {
    backgroundColor: '#228B22',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#32CD32',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  rollButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
