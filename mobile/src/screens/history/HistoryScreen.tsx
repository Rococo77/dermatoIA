import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useDiagnosisStore } from '../../store/diagnosisStore';
import { formatDate, getSeverityColor, getSeverityLabel, formatLesionType } from '../../utils/formatters';
import { Diagnosis } from '../../types';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { history, totalItems, currentPage, isLoading, fetchHistory, deleteDiagnosis } = useDiagnosisStore();

  useFocusEffect(
    useCallback(() => {
      fetchHistory(1);
    }, [])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer le diagnostic',
      'Etes-vous sur de vouloir supprimer ce diagnostic ? Cette action est irreversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteDiagnosis(id),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Diagnosis }) => {
    const severityColor = getSeverityColor(item.severity_level);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DiagnosisDetail', { diagnosis: item })}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
            <View style={styles.cardInfo}>
              <Text style={styles.lesionType}>{formatLesionType(item.lesion_type)}</Text>
              <View style={styles.cardRow}>
                <Text style={[styles.severity, { color: severityColor }]}>
                  {getSeverityLabel(item.severity_level)}
                </Text>
                {item.requires_hospital && (
                  <View style={styles.hospitalBadge}>
                    <Feather name="alert-circle" size={12} color={colors.error} />
                    <Text style={styles.hospitalBadgeText}>Consultation</Text>
                  </View>
                )}
              </View>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.text.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.count}>{totalItems} diagnostic(s)</Text>
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={() => fetchHistory(1)}
        onEndReached={() => {
          if (history.length < totalItems) {
            fetchHistory(currentPage + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="clipboard" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>Aucun diagnostic pour le moment</Text>
            <Text style={styles.emptySubtext}>Prenez une photo pour commencer</Text>
          </View>
        }
      />
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
  count: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardTop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  lesionType: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  severity: {
    fontSize: 14,
    fontWeight: '500',
  },
  hospitalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBg,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 4,
  },
  hospitalBadgeText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.secondary,
    fontWeight: '500',
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});
