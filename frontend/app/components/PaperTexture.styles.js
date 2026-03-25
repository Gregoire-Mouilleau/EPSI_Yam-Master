import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  paperTextureLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  paperWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 240, 205, 0.52)',
  },
  paperSpeckle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#7A4B1D',
  },
  paperStain: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(128, 75, 24, 0.16)',
  },
  paperStainTopLeft: {
    width: 220,
    height: 110,
    top: -18,
    left: -28,
    transform: [{ rotate: '-12deg' }],
  },
  paperStainTopRight: {
    width: 170,
    height: 90,
    top: 48,
    right: -42,
    opacity: 0.7,
    transform: [{ rotate: '18deg' }],
  },
  paperStainBottom: {
    width: 280,
    height: 120,
    bottom: -44,
    left: 40,
    opacity: 0.6,
    transform: [{ rotate: '6deg' }],
  },
  paperBurn: {
    position: 'absolute',
    backgroundColor: 'rgba(92, 44, 12, 0.12)',
    borderRadius: 999,
  },
  paperBurnOne: {
    width: 100,
    height: 38,
    top: 96,
    right: 56,
    transform: [{ rotate: '-25deg' }],
  },
  paperBurnTwo: {
    width: 130,
    height: 44,
    bottom: 84,
    left: -16,
    transform: [{ rotate: '22deg' }],
  },
  paperFiber: {
    position: 'absolute',
    borderRadius: 20,
    backgroundColor: 'rgba(145, 82, 34, 0.2)',
  },
  paperFiberOne: {
    width: '85%',
    height: 2,
    top: '30%',
    left: '8%',
  },
  paperFiberTwo: {
    width: '72%',
    height: 2,
    top: '64%',
    right: '6%',
    opacity: 0.85,
  },
  paperInnerFrame: {
    ...StyleSheet.absoluteFillObject,
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 71, 26, 0.26)',
    borderRadius: 14,
  },
  paperEdgeDarken: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 11,
    borderColor: 'rgba(95, 49, 13, 0.15)',
    borderRadius: 18,
  },
});

export default styles;
