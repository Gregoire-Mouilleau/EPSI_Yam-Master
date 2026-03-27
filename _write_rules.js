const fs = require('fs');
const path = require('path');

const content = `import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import FramedPage from '../components/FramedPage';
import styles from './rules.styles';

const COMBINATIONS = [
  { emoji: '1\uFE0F\u20E3', label: 'Brelan 1', desc: '3 dés affichant 1' },
  { emoji: '2\uFE0F\u20E3', label: 'Brelan 2', desc: '3 dés affichant 2' },
  { emoji: '3\uFE0F\u20E3', label: 'Brelan 3', desc: '3 dés affichant 3' },
  { emoji: '4\uFE0F\u20E3', label: 'Brelan 4', desc: '3 dés affichant 4' },
  { emoji: '5\uFE0F\u20E3', label: 'Brelan 5', desc: '3 dés affichant 5' },
  { emoji: '6\uFE0F\u20E3', label: 'Brelan 6', desc: '3 dés affichant 6' },
  { emoji: '\uD83C\uDCCF', label: 'Full',     desc: 'Brelan + paire' },
  { emoji: '\uD83C\uDFB2', label: 'Carré',   desc: '4 dés identiques' },
  { emoji: '\uD83C\uDFAF', label: 'Yam',     desc: '5 dés identiques' },
  { emoji: '\uD83D\uDCC8', label: 'Suite',   desc: '1-2-3-4-5 ou 2-3-4-5-6' },
  { emoji: '\u2B07\uFE0F',  label: '\u2264 8',    desc: 'Somme \u2264 8' },
  { emoji: '\u26A1', label: 'Sec',     desc: 'Hors brelan, dès le 1er lancé' },
  { emoji: '\u2694\uFE0F', label: 'Défi',   desc: 'Voler la case adverse' },
];

export default function RulesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const twoCol = width >= 700;

  return (
    <FramedPage navigation={navigation} emoji="\uD83D\uDCD6" title="RÈGLES DU JEU" maxWidth={980}>
      <View style={styles.container}>

        {/* Rangée 2 colonnes */}
        <View style={[styles.rowCols, twoCol && styles.rowColsTwoCol]}>

          {/* Colonne gauche : 2 Déroulement + 4 Mode spécial */}
          <View style={[styles.col, twoCol && styles.colLeft]}>

            {/* Section 2 */}
            <View style={styles.ruleBlock}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleNumber}>2</Text>
                <Text style={styles.sectionTitle}>Déroulement</Text>
              </View>
              <View style={styles.stepList}>
                <View style={styles.step}>
                  <View style={styles.stepBullet}><Text style={styles.stepBulletText}>1</Text></View>
                  <Text style={styles.stepText}>Lancez les <Text style={styles.highlight}>5 dés</Text> — <Text style={styles.highlight}>3 lancés</Text> max par tour.</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepBullet}><Text style={styles.stepBulletText}>2</Text></View>
                  <Text style={styles.stepText}><Text style={styles.highlight}>Verrouillez</Text> les dés à conserver entre chaque lancé.</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepBullet}><Text style={styles.stepBulletText}>3</Text></View>
                  <Text style={styles.stepText}>Choisissez une <Text style={styles.highlight}>combinaison</Text> et revendiquez une case.</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepBullet}><Text style={styles.stepBulletText}>4</Text></View>
                  <Text style={styles.stepText}><Text style={styles.highlight}>30 secondes</Text> par tour, sinon le tour passe.</Text>
                </View>
              </View>
            </View>

            {/* Section 4 */}
            <View style={styles.ruleBlock}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleNumber}>4</Text>
                <Text style={styles.sectionTitle}>Mode spécial</Text>
              </View>
              <View style={[styles.specialCard, styles.specialCardDefi]}>
                <View style={styles.specialHeader}>
                  <Text style={styles.specialEmoji}>\u2694\uFE0F</Text>
                  <Text style={styles.specialTitle}>Défi</Text>
                </View>
                <Text style={styles.bodyText}>
                  Choisissez la <Text style={styles.highlight}>même combinaison que l'adversaire</Text> pour tenter de voler sa case.
                  Si vous réussissez, votre jeton remplace le sien !
                </Text>
              </View>
            </View>

          </View>

          {/* Colonne droite : 1 Objectif + 3 Combinaisons */}
          <View style={[styles.col, twoCol && styles.colRight]}>

            {/* Section 1 */}
            <View style={styles.ruleBlock}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleNumber}>1</Text>
                <Text style={styles.sectionTitle}>Objectif</Text>
              </View>
              <Text style={styles.bodyText}>
                Jeu de dés stratégique mêlant le <Text style={styles.highlight}>Yam</Text> et la{' '}
                <Text style={styles.highlight}>Puissance 4</Text>.{' '}
                Alignez <Text style={styles.highlight}>5 jetons</Text> sur la grille 5\u00D75 pour gagner instantanément, ou ayez le{' '}
                <Text style={styles.highlight}>meilleur score</Text> quand tous les pions sont posés.
              </Text>
            </View>

            {/* Section 3 */}
            <View style={styles.ruleBlock}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleNumber}>3</Text>
                <Text style={styles.sectionTitle}>Les combinaisons</Text>
              </View>
              <View style={styles.combosGrid}>
                {COMBINATIONS.map((combo, i) => (
                  <View key={i} style={styles.comboCard}>
                    <Text style={styles.comboEmoji}>{combo.emoji}</Text>
                    <Text style={styles.comboLabel}>{combo.label}</Text>
                    <Text style={styles.comboDesc}>{combo.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

          </View>
        </View>

        {/* Section 5 – Score & Victoire (pleine largeur) */}
        <View style={styles.ruleBlock}>
          <View style={styles.ruleHeader}>
            <Text style={styles.ruleNumber}>5</Text>
            <Text style={styles.sectionTitle}>Score &amp; Victoire</Text>
          </View>

          <Text style={styles.bodyText}>
            Chaque fois qu'un jeton est posé, le jeu vérifie automatiquement si tu formes des{' '}
            <Text style={styles.highlight}>lignes</Text> (horizontales, verticales ou diagonales) et attribue des points :
          </Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreEmoji}>\uD83D\uDFE1\uD83D\uDFE1\uD83D\uDFE1</Text>
              <Text style={styles.scoreValue}>1 pt</Text>
              <Text style={styles.scoreLabel}>Ligne de 3 jetons</Text>
              <Text style={styles.scoreDetail}>H · V · Diag</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreEmoji}>\uD83D\uDFE1\uD83D\uDFE1\uD83D\uDFE1\uD83D\uDFE1</Text>
              <Text style={styles.scoreValue}>2 pts</Text>
              <Text style={styles.scoreLabel}>Ligne de 4 jetons</Text>
              <Text style={styles.scoreDetail}>H · V · Diag</Text>
            </View>
            <View style={[styles.scoreCard, styles.scoreCardSpecial]}>
              <Text style={styles.scoreEmoji}>\uD83D\uDFE1\uD83D\uDFE1\uD83D\uDFE1\uD83D\uDFE1\uD83D\uDFE1</Text>
              <Text style={styles.scoreValue}>Victoire !</Text>
              <Text style={styles.scoreLabel}>Ligne de 5 jetons</Text>
              <Text style={styles.scoreDetail}>Fin immédiate</Text>
            </View>
          </View>

          <Text style={[styles.bodyText, { marginTop: 6, marginBottom: 8 }]}>
            <Text style={styles.highlight}>Les lignes peuvent se chevaucher</Text> — poser un pion peut valider plusieurs lignes en même temps et rapporter plusieurs points d'un coup.
          </Text>

          <View style={styles.victoryList}>
            <View style={styles.victoryItem}>
              <Text style={styles.victoryEmoji}>\uD83C\uDFC6</Text>
              <View style={styles.victoryTexts}>
                <Text style={styles.victoryTitle}>Ligne de 5 — victoire immédiate</Text>
                <Text style={styles.victoryDesc}>5 jetons consécutifs (H, V ou diag) → la partie s'arrête instantanément, peu importe les scores.</Text>
              </View>
            </View>
            <View style={styles.victoryItem}>
              <Text style={styles.victoryEmoji}>\uD83C\uDFAF</Text>
              <View style={styles.victoryTexts}>
                <Text style={styles.victoryTitle}>12 pions posés — comparaison des scores</Text>
                <Text style={styles.victoryDesc}>Dès qu'un joueur a placé ses 12 pions, la partie se termine. Le total des lignes de 3 et 4 formées tout au long de la partie détermine le gagnant.</Text>
              </View>
            </View>
            <View style={styles.victoryItem}>
              <Text style={styles.victoryEmoji}>\uD83C\uDFF3\uFE0F</Text>
              <View style={styles.victoryTexts}>
                <Text style={styles.victoryTitle}>Forfait</Text>
                <Text style={styles.victoryDesc}>Victoire automatique si l'adversaire quitte ou se déconnecte.</Text>
              </View>
            </View>
          </View>
        </View>

      </View>
    </FramedPage>
  );
}
`;

fs.writeFileSync(
  path.join(__dirname, 'frontend/app/screens/rules.screen.js'),
  content,
  'utf8'
);
console.log('Written successfully, length=' + content.length);
