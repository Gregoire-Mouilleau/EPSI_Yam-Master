import React from 'react';
import { View, StyleSheet } from 'react-native';

const DOT_LAYOUTS = {
  1: [
    [false, false, false],
    [false, true,  false],
    [false, false, false],
  ],
  2: [
    [false, false, true],
    [false, false, false],
    [true,  false, false],
  ],
  3: [
    [false, false, true],
    [false, true,  false],
    [true,  false, false],
  ],
  4: [
    [true, false, true],
    [false, false, false],
    [true, false, true],
  ],
  5: [
    [true, false, true],
    [false, true, false],
    [true, false, true],
  ],
  6: [
    [true, false, true],
    [true, false, true],
    [true, false, true],
  ],
};

export default function DiceFace({ value, size = 36, highlight = false }) {
  const layout = DOT_LAYOUTS[value];
  if (!layout) return null;

  const dotSize = size * 0.24;
  const dotColor = '#FFFFFF';

  return (
    <View style={[s.face, { width: size, height: size, borderColor: highlight ? '#F9A825' : '#8B6F47' }]}>
      {layout.map((row, r) => (
        <View key={r} style={s.row}>
          {row.map((filled, c) => (
            <View
              key={c}
              style={[
                s.dot,
                { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
                filled ? { backgroundColor: dotColor } : { backgroundColor: 'transparent' },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  face: {
    borderRadius: 6,
    borderWidth: 1.5,
    padding: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    paddingHorizontal: 2,
  },
  dot: {},
});
