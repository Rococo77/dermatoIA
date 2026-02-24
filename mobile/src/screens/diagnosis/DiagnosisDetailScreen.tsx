import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { formatDate, formatConfidence, getSeverityColor, getSeverityBgColor, getSeverityLabel, formatLesionType } from '../../utils/formatters';
import { Diagnosis } from '../../types';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function DiagnosisDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const diagnosis: Diagnosis = route.params.diagnosis;

  const severityColor = getSeverityColor(diagnosis.severity_level);
  const severityBgColor = getSeverityBgColor(diagnosis.severity_level);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Detail du diagnostic</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>{formatDate(diagnosis.created_at)}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Type de lesion</Text>
          <Text style={styles.value}>{formatLesionType(diagnosis.lesion_type)}</Text>
          <Text style={styles.confidence}>Confiance : {formatConfidence(diagnosis.lesion_type_confidence)}</Text>
        </View>

        <View style={[styles.card, styles.severityCard, { backgroundColor: severityBgColor, borderLeftColor: severityColor }]}>
          <Text style={styles.label}>Gravite</Text>
          <Text style={[styles.value, { color: severityColor }]}>
            {getSeverityLabel(diagnosis.severity_level)}
          </Text>
          <Text style={styles.confidence}>Confiance : {formatConfidence(diagnosis.severity_confidence)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Recommandation</Text>
          <Text style={styles.recommendation}>{diagnosis.recommendation}</Text>
        </View>

        {diagnosis.requires_hospital && (
          <View style={styles.hospitalBadge}>
            <Feather name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.hospitalText}>Consultation medicale recommandee</Text>
          </View>
        )}

        <Text style={styles.modelVersion}>
          Modele v{diagnosis.model_version}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    padding: spacing['2xl'],
  },
  date: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  severityCard: {
    borderLeftWidth: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  confidence: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  recommendation: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  hospitalBadge: {
    backgroundColor: colors.errorBg,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  hospitalText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  modelVersion: {
    textAlign: 'center',
    color: colors.text.muted,
    fontSize: 12,
    marginTop: spacing.lg,
  },
});
