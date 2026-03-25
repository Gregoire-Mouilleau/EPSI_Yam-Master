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
});
