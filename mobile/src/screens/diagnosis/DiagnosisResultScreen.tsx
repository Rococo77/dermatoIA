import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useDiagnosisStore } from '../../store/diagnosisStore';
import { formatDate, formatConfidence, getSeverityColor, getSeverityBgColor, getSeverityLabel, formatLesionType } from '../../utils/formatters';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function DiagnosisResultScreen() {
  const navigation = useNavigation<any>();
  const { currentDiagnosis } = useDiagnosisStore();

  if (!currentDiagnosis) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const severityColor = getSeverityColor(currentDiagnosis.severity_level);
  const severityBgColor = getSeverityBgColor(currentDiagnosis.severity_level);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Resultat du diagnostic</Text>
          <Text style={styles.date}>{formatDate(currentDiagnosis.created_at)}</Text>
        </View>

        {currentDiagnosis.requires_hospital && (
          <View style={styles.alertBanner}>
            <View style={styles.alertHeader}>
              <Feather name="alert-triangle" size={20} color={colors.error} />
              <Text style={styles.alertTitle}>Consultation recommandee</Text>
            </View>
            <Text style={styles.alertText}>
              Nos analyses suggerent que cette condition necessite une attention medicale.
            </Text>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => Linking.openURL('tel:15')}
            >
              <Text style={styles.emergencyButtonText}>Appeler le 15 (SAMU)</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.resultCard}>
          <Text style={styles.label}>Type de lesion</Text>
          <Text style={styles.lesionType}>{formatLesionType(currentDiagnosis.lesion_type)}</Text>
          <Text style={styles.confidence}>
            Confiance : {formatConfidence(currentDiagnosis.lesion_type_confidence)}
          </Text>
        </View>

        <View style={[styles.severityCard, { backgroundColor: severityBgColor, borderLeftColor: severityColor }]}>
          <Text style={styles.label}>Niveau de gravite</Text>
          <Text style={[styles.severityLevel, { color: severityColor }]}>
            {getSeverityLabel(currentDiagnosis.severity_level)}
          </Text>
          <Text style={styles.confidence}>
            Confiance : {formatConfidence(currentDiagnosis.severity_confidence)}
          </Text>
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.label}>Recommandation</Text>
          <Text style={styles.recommendation}>{currentDiagnosis.recommendation}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.homeButtonText}>Retour a l'accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newAnalysisButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.newAnalysisButtonText}>Nouvelle analyse</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimer}>
            Ce diagnostic est genere par une intelligence artificielle et ne remplace en aucun cas
            l'avis d'un professionnel de sante. Consultez toujours un dermatologue pour un diagnostic definitif.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  scrollContent: {
    padding: spacing['2xl'],
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text.primary,
  },
  date: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  alertBanner: {
    backgroundColor: colors.errorBg,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    marginLeft: spacing.sm,
  },
  alertText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  severityCard: {
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  recommendationCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  lesionType: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  severityLevel: {
    fontSize: 22,
    fontWeight: '700',
  },
  confidence: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  recommendation: {
    fontSize: 15,
    color: colors.primaryDark,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  homeButton: {
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  newAnalysisButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  newAnalysisButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  disclaimerContainer: {
    backgroundColor: colors.borderLight,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  disclaimer: {
    textAlign: 'center',
    color: colors.text.tertiary,
    fontSize: 11,
    lineHeight: 16,
  },
});
