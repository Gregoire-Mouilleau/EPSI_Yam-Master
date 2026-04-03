import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

function YamCell({ highlight }) {
  return (
    <View style={s.container}>
      <Image
        source={require('../../../../assets/mascotte.png')}
        style={s.mascotte}
        resizeMode="contain"
      />
      <Text style={[s.comboLabel, s.yamLabel, highlight && s.highlightLabel]}>YAM</Text>
    </View>
  );
}

function CarreCell({ highlight }) {
  const color = highlight ? '#8B1A1A' : '#F6DEB2';
  return (
    <View style={s.container}>
      <View style={s.grid2x2}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[s.square, { borderColor: color }]} />
        ))}
      </View>
      <Text style={[s.comboLabel, highlight && s.highlightLabel]}>CARRÉ</Text>
    </View>
  );
}

function FullCell({ highlight }) {
  const color = highlight ? '#8B1A1A' : '#F6DEB2';
  return (
    <View style={s.container}>
      <View style={s.fullRow}>
        {[0,1,2].map(i => <View key={i} style={[s.squareFull, { backgroundColor: color }]} />)}
        <View style={[s.separator, { backgroundColor: color, opacity: 0.4 }]} />
        {[0,1].map(i => <View key={i} style={[s.squareFullSmall, { backgroundColor: color, opacity: 0.7 }]} />)}
      </View>
      <Text style={[s.comboLabel, highlight && s.highlightLabel]}>FULL</Text>
    </View>
  );
}

function SuiteCell({ highlight }) {
  const color = highlight ? '#8B1A1A' : '#F6DEB2';
  return (
    <View style={s.container}>
      <View style={s.suiteRow}>
        {[1,2,3,4,5].map((n, i) => (
          <React.Fragment key={n}>
            <Text style={[s.suiteNum, { color }]}>{n}</Text>
            {i < 4 && <Text style={[s.suiteArrow, { color, opacity: 0.5 }]}>›</Text>}
          </React.Fragment>
        ))}
      </View>
      <Text style={[s.comboLabel, highlight && s.highlightLabel]}>SUITE</Text>
    </View>
  );
}

function Inf8Cell({ highlight }) {
  const color = highlight ? '#8B1A1A' : '#F6DEB2';
  return (
    <View style={s.container}>
      <Text style={[s.bigSymbol, { color }]}>≤8</Text>
      <Text style={[s.comboLabel, highlight && s.highlightLabel]}>SOMME</Text>
    </View>
  );
}

function DefiCell({ highlight }) {
  const color = highlight ? '#8B1A1A' : '#FFD700';
  return (
    <View style={s.container}>
      <Text style={[s.emojiIcon, { color }]}>⚡</Text>
      <Text style={[s.comboLabel, highlight && s.highlightLabel]}>DÉFI</Text>
    </View>
  );
}

function SecCell({ highlight }) {
  const color = highlight ? '#8B1A1A' : '#FFD700';
  return (
    <View style={s.container}>
      <Text style={[s.emojiIcon, { color }]}>💎</Text>
      <Text style={[s.comboLabel, highlight && s.highlightLabel]}>SEC</Text>
    </View>
  );
}

const COMBO_MAP = {
  'Yam':   YamCell,
  'Carré': CarreCell,
  'Full':  FullCell,
  'Suite': SuiteCell,
  '≤8':   Inf8Cell,
  'Défi':  DefiCell,
  'Sec':   SecCell,
};

export default function ComboDice({ value, highlight = false }) {
  const Cell = COMBO_MAP[value];
  if (!Cell) return <Text style={[s.comboLabel, highlight && s.highlightLabel]}>{value}</Text>;
  return <Cell highlight={highlight} />;
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  mascotte: {
    width: '90%',
    aspectRatio: 1,
    maxWidth: 70,
    maxHeight: 70,
  },
  yamLabel: {
    color: '#FFD700',
    fontSize: 10,
    textShadowColor: 'rgba(255,200,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  comboLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#F6DEB2',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  highlightLabel: {
    color: '#8B1A1A',
  },
  // Carré
  grid2x2: {
    width: 28,
    height: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  square: {
    width: 11,
    height: 11,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  // Full
  fullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  squareFull: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  squareFullSmall: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  separator: {
    width: 1,
    height: 10,
    marginHorizontal: 1,
  },
  // Suite
  suiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  suiteNum: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  suiteArrow: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  // ≤8
  bigSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // icons
  emojiIcon: {
    fontSize: 20,
  },
});

