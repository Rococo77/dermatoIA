import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDiagnosisStore } from '../../store/diagnosisStore';
import { compressImage } from '../../utils/imageUtils';

export default function ImagePreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { imageUri } = route.params;
  const { analyzeSkin, isAnalyzing } = useDiagnosisStore();

  const handleAnalyze = async () => {
    try {
      const compressedUri = await compressImage(imageUri);
      await analyzeSkin(compressedUri);
      navigation.replace('DiagnosisResult');
    } catch {
      // Error handled by store
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Apercu</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </View>

      {isAnalyzing ? (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.analyzingText}>Analyse en cours...</Text>
          <Text style={styles.analyzingSubtext}>
            Notre IA examine votre photo
          </Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retakeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retakeButtonText}>Reprendre</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
            <Text style={styles.analyzeButtonText}>Analyser</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
  },
  backButton: { color: '#2196F3', fontSize: 16 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  placeholder: { width: 50 },
  imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  analyzingContainer: { padding: 32, alignItems: 'center' },
  analyzingText: { color: '#FFF', fontSize: 18, fontWeight: '600', marginTop: 16 },
  analyzingSubtext: { color: '#BDBDBD', fontSize: 14, marginTop: 8 },
  actions: {
    flexDirection: 'row', padding: 24, gap: 12,
  },
  retakeButton: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  retakeButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  analyzeButton: {
    flex: 1, backgroundColor: '#2196F3', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  analyzeButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
