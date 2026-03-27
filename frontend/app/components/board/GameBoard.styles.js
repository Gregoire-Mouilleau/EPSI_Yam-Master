import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#2C1810',
  },
  gameBoard: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 8,
    paddingRight: 8,
  },
  leftSection: {
    flex: 3,
    marginRight: 8,
  },
  rightSection: {
    flex: 2,
    justifyContent: 'space-between',
  },
  topIndicatorContainer: {
    flex: 2,
    marginBottom: 8,
  },
  plateauContainer: {
    flex: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceRollingZone: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonContainer: {
    flex: 2,
    marginTop: 8,
  },
  opponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rulesButtonPlaceholder: {
    width: 96,
  },
  rulesButton: {
    marginLeft: 8,
    backgroundColor: '#5B1F0A',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rulesButtonText: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
