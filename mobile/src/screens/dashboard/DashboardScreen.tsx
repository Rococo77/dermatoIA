import React, { useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDiagnosisStore } from '../../store/diagnosisStore';
import { getSeverityColor, getSeverityLabel, formatLesionType } from '../../utils/formatters';

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
            <Text style={styles.statNumber}>{stats.total_diagnoses}</Text>
            <Text style={styles.statLabel}>Total analyses</Text>
          </View>
          <View style={[styles.statCard, styles.hospitalCard]}>
            <Text style={[styles.statNumber, { color: '#D32F2F' }]}>
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
                      backgroundColor: '#2196F3',
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#212121' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 64 },
  emptyText: { fontSize: 16, color: '#757575' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 20,
    alignItems: 'center', elevation: 1,
  },
  hospitalCard: { borderLeftWidth: 3, borderLeftColor: '#D32F2F' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#2196F3' },
  statLabel: { fontSize: 13, color: '#757575', marginTop: 4, textAlign: 'center' },
  section: {
    backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 12, padding: 20, elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#212121', marginBottom: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { width: 90, fontSize: 13, color: '#424242' },
  barContainer: {
    flex: 1, height: 20, backgroundColor: '#F5F5F5', borderRadius: 10,
    marginHorizontal: 8, overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: 10, minWidth: 4 },
  barValue: { width: 30, fontSize: 13, fontWeight: '600', color: '#424242', textAlign: 'right' },
});
