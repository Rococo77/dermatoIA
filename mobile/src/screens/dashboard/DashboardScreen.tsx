import React, { useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useDiagnosisStore } from '../../store/diagnosisStore';
import { getSeverityColor, getSeverityLabel, formatLesionType } from '../../utils/formatters';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function DashboardScreen() {
  const { stats, fetchStats } = useDiagnosisStore();

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune donnee disponible</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Feather name="activity" size={20} color={colors.primary} style={styles.statIcon} />
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats.total_diagnoses}
            </Text>
            <Text style={styles.statLabel}>Total analyses</Text>
          </View>
          <View style={[styles.statCard, styles.hospitalCard]}>
            <Feather name="alert-triangle" size={20} color={colors.error} style={styles.statIcon} />
            <Text style={[styles.statNumber, { color: colors.error }]}>
              {stats.hospital_required_count}
            </Text>
            <Text style={styles.statLabel}>Consultations requises</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Par type de lesion</Text>
          {Object.entries(stats.by_lesion_type).map(([type, count]) => (
            <View key={type} style={styles.barRow}>
              <Text style={styles.barLabel}>{formatLesionType(type)}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${(count / stats.total_diagnoses) * 100}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Par gravite</Text>
          {Object.entries(stats.by_severity).map(([severity, count]) => (
            <View key={severity} style={styles.barRow}>
              <Text style={styles.barLabel}>
                {getSeverityLabel(severity as any)}
              </Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${(count / stats.total_diagnoses) * 100}%`,
                      backgroundColor: getSeverityColor(severity as any),
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{count}</Text>
            </View>
          ))}
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
  header: {
    padding: spacing['2xl'],
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text.primary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  hospitalCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  statIcon: {
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  barLabel: {
    width: 90,
    fontSize: 13,
    color: colors.text.secondary,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.md,
    minWidth: 4,
  },
  barValue: {
    width: 30,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'right',
  },
});
