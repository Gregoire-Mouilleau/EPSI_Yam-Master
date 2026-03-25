import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  gridContainer: {
    flex: 7,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    width: '100%',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3D2817',
    borderWidth: 2,
    borderColor: '#8B6F47',
    padding: 5,
    minHeight: 40,
    position: 'relative',
  },
  cellText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F6DEB2',
    zIndex: 1,
  },
  canBeCheckedCell: {
    backgroundColor: '#FFF9C4',
    borderColor: '#F9A825',
  },
  topBorder: {
    borderTopWidth: 2,
  },
  leftBorder: {
    borderLeftWidth: 2,
  },
  tokenImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
});
