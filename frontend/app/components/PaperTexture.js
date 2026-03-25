import React from 'react';
import { View } from 'react-native';
import styles from './PaperTexture.styles';

const PAPER_SPECKLES = [
  { top: '7%', left: '9%', size: 3, opacity: 0.2 },
  { top: '11%', left: '44%', size: 2, opacity: 0.14 },
  { top: '15%', left: '77%', size: 4, opacity: 0.18 },
  { top: '19%', left: '27%', size: 2, opacity: 0.16 },
  { top: '24%', left: '63%', size: 3, opacity: 0.16 },
  { top: '31%', left: '84%', size: 2, opacity: 0.22 },
  { top: '37%', left: '14%', size: 3, opacity: 0.17 },
  { top: '42%', left: '52%', size: 2, opacity: 0.12 },
  { top: '48%', left: '71%', size: 3, opacity: 0.19 },
  { top: '54%', left: '36%', size: 2, opacity: 0.15 },
  { top: '61%', left: '88%', size: 4, opacity: 0.12 },
  { top: '67%', left: '16%', size: 2, opacity: 0.2 },
  { top: '73%', left: '58%', size: 3, opacity: 0.14 },
  { top: '79%', left: '41%', size: 2, opacity: 0.17 },
  { top: '86%', left: '75%', size: 3, opacity: 0.16 },
  { top: '90%', left: '23%', size: 2, opacity: 0.22 },
];

export default function PaperTexture() {
  return (
    <View pointerEvents="none" style={styles.paperTextureLayer}>
      <View style={styles.paperWash} />
      {PAPER_SPECKLES.map((speckle, index) => (
        <View
          key={`paper-speckle-${index}`}
          style={[
            styles.paperSpeckle,
            {
              top: speckle.top,
              left: speckle.left,
              width: speckle.size,
              height: speckle.size,
              opacity: speckle.opacity,
            },
          ]}
        />
      ))}
      <View style={[styles.paperStain, styles.paperStainTopLeft]} />
      <View style={[styles.paperStain, styles.paperStainTopRight]} />
      <View style={[styles.paperStain, styles.paperStainBottom]} />
      <View style={[styles.paperBurn, styles.paperBurnOne]} />
      <View style={[styles.paperBurn, styles.paperBurnTwo]} />
      <View style={[styles.paperFiber, styles.paperFiberOne]} />
      <View style={[styles.paperFiber, styles.paperFiberTwo]} />
      <View style={styles.paperInnerFrame} />
      <View style={styles.paperEdgeDarken} />
    </View>
  );
}
