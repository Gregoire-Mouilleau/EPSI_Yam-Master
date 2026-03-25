import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Background from './Background';
import PaperTexture from './PaperTexture';
import styles from './FramedPage.styles';

export default function FramedPage({ navigation, emoji, title, maxWidth = 1100, panelStyle, children }) {
  return (
    <View style={styles.container}>
      <Background />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.frameGlow, { maxWidth }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.topBanner}>
            <Text style={styles.topBannerEmoji}>{emoji}</Text>
            <Text style={styles.topBannerTitle}>{title}</Text>
          </View>

          <View style={[styles.panel, panelStyle]}>
            <PaperTexture />
            {children}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
