import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import FramedPage from '../components/FramedPage';
import styles from './rules.styles';

const COMBINATIONS = [
  { emoji: '1️⃣', label: 'Brelan 1', desc: '3 dés affichant 1' },
  { emoji: '2️⃣', label: 'Brelan 2', desc: '3 dés affichant 2' },
  { emoji: '3️⃣', label: 'Brelan 3', desc: '3 dés affichant 3' },
  { emoji: '4️⃣', label: 'Brelan 4', desc: '3 dés affichant 4' },
  { emoji: '5️⃣', label: 'Brelan 5', desc: '3 dés affichant 5' },
  { emoji: '6️⃣', label: 'Brelan 6', desc: '3 dés affichant 6' },
  { emoji: '🃏', label: 'Full',     desc: 'Brelan + paire' },
  { emoji: '🎲', label: 'Carré',   desc: '4 dés identiques' },
  { emoji: '🎯', label: 'Yam',     desc: '5 dés identiques' },
  { emoji: '📈', label: 'Suite',   desc: '1-2-3-4-5 ou 2-3-4-5-6' },
  { emoji: '⬇️',  label: '≤ 8',    desc: 'Somme ≤ 8' },
  { emoji: '⚡', label: 'Sec',     desc: 'Hors brelan, dès le 1er lancé' },
];

export default function RulesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const twoCol = width >= 700;

  return (
    <FramedPage navigation={navigation} emoji="📖" title="RÈGLES DU JEU" maxWidth={980}>
      <View style={styles.container}>

        {/* Rangée 2 colonnes */}
        <View style={[styles.rowCols, twoCol && styles.rowColsTwoCol]}>

          {/* Colonne gauche : 1 Objectif + 3 Combinaisons */}
          <View style={[styles.col, twoCol && styles.colLeft]}>

            {/* Section 1 */}
            <View style={styles.ruleBlock}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleNumber}>1</Text>
                <Text style={styles.sectionTitle}>Objectif</Text>
              </View>
              <Text style={styles.bodyText}>
                Jeu de dés stratégique mêlant le <Text style={styles.highlight}>Yam</Text> et la{' '}
                <Text style={styles.highlight}>Puissance 4</Text>.{' '}
                Alignez <Text style={styles.highlight}>5 jetons</Text> sur la grille 5×5 pour gagner instantanément, ou ayez le{' '}
                <Text style={styles.highlight}>meilleur score</Text> quand tous les pions sont posés.
              </Text>
            </View>

            {/* Section 3 */}
            <View style={[styles.ruleBlock, styles.ruleBlockFlex]}>
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

          {/* Colonne droite : 2 Déroulement + 4 Mode spécial */}
          <View style={[styles.col, twoCol && styles.colRight]}>

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
            <View style={[styles.ruleBlock, styles.ruleBlockFlex]}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleNumber}>4</Text>
                <Text style={styles.sectionTitle}>Mode spécial</Text>
              </View>
              <View style={[styles.specialCard, styles.specialCardDefi]}>
                <View style={styles.specialHeader}>
                  <Text style={styles.specialEmoji}>⚔️</Text>
                  <Text style={styles.specialTitle}>Défi</Text>
                </View>
                <View style={styles.stepList}>
                  <View style={styles.step}>
                    <View style={styles.stepBullet}><Text style={styles.stepBulletText}>1</Text></View>
                    <Text style={styles.stepText}>Après le 1er lancé, la <Text style={styles.highlight}>case Défi</Text> peut apparaître sur la grille (faible probabilité).</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepBullet}><Text style={styles.stepBulletText}>2</Text></View>
                    <Text style={styles.stepText}>Si tu <Text style={styles.highlight}>sélectionnes la case Défi</Text>, tu dois réaliser une combinaison <Text style={styles.highlight}>autre qu'un brelan</Text> dans tes prochains lancés.</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepBullet}><Text style={styles.stepBulletText}>3</Text></View>
                    <Text style={styles.stepText}>C'est <Text style={styles.highlight}>tout ou rien</Text> : si tu réussis, tu poses un pion sur la case Défi — et uniquement celle-là. Si tu fais un brelan ou rien, ton tour est perdu.</Text>
                  </View>
                </View>
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
              <Text style={styles.scoreEmoji}>🟡🟡🟡</Text>
              <Text style={styles.scoreValue}>1 pt</Text>
              <Text style={styles.scoreLabel}>Ligne de 3 jetons</Text>
              <Text style={styles.scoreDetail}>H · V · Diag</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreEmoji}>🟡🟡🟡🟡</Text>
              <Text style={styles.scoreValue}>2 pts</Text>
              <Text style={styles.scoreLabel}>Ligne de 4 jetons</Text>
              <Text style={styles.scoreDetail}>H · V · Diag</Text>
            </View>
            <View style={[styles.scoreCard, styles.scoreCardSpecial]}>
              <Text style={styles.scoreEmoji}>🟡🟡🟡🟡🟡</Text>
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
              <Text style={styles.victoryEmoji}>🏆</Text>
              <View style={styles.victoryTexts}>
                <Text style={styles.victoryTitle}>Ligne de 5 — victoire immédiate</Text>
                <Text style={styles.victoryDesc}>5 jetons consécutifs (H, V ou diag) → la partie s'arrête instantanément, peu importe les scores.</Text>
              </View>
            </View>
            <View style={styles.victoryItem}>
              <Text style={styles.victoryEmoji}>🎯</Text>
              <View style={styles.victoryTexts}>
                <Text style={styles.victoryTitle}>12 pions posés — comparaison des scores</Text>
                <Text style={styles.victoryDesc}>Dès qu'un joueur a placé ses 12 pions, la partie se termine. Le total des lignes de 3 et 4 formées tout au long de la partie détermine le gagnant.</Text>
              </View>
            </View>
            <View style={styles.victoryItem}>
              <Text style={styles.victoryEmoji}>🏳️</Text>
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
