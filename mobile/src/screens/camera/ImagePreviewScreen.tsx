import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useDiagnosisStore } from '../../store/diagnosisStore';
import { compressImage } from '../../utils/imageUtils';
import { colors, spacing, borderRadius, shadows } from '../../theme';

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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButtonContainer}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Apercu</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </View>

      {isAnalyzing ? (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.analyzingText}>Analyse en cours...</Text>
          <Text style={styles.analyzingSubtext}>
            Notre IA examine votre photo
          </Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.retakeButtonText}>Reprendre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleAnalyze}
            activeOpacity={0.85}
          >
            <Text style={styles.analyzeButtonText}>Analyser</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  analyzingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  analyzingText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  analyzingSubtext: {
    color: colors.text.muted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.xl,
    gap: spacing.md,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
