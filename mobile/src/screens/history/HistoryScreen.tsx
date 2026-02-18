import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDiagnosisStore } from '../../store/diagnosisStore';
import { formatDate, getSeverityColor, getSeverityLabel, formatLesionType } from '../../utils/formatters';
import { Diagnosis } from '../../types';

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
      >
        <View style={[styles.severityIndicator, { backgroundColor: severityColor }]} />
        <View style={styles.cardContent}>
          <Text style={styles.lesionType}>{formatLesionType(item.lesion_type)}</Text>
          <View style={styles.cardRow}>
            <Text style={[styles.severity, { color: severityColor }]}>
              {getSeverityLabel(item.severity_level)}
            </Text>
            {item.requires_hospital && (
              <View style={styles.hospitalBadge}>
                <Text style={styles.hospitalBadgeText}>Consultation</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
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
            <Text style={styles.emptyText}>Aucun diagnostic pour le moment</Text>
            <Text style={styles.emptySubtext}>Prenez une photo pour commencer</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#212121' },
  count: { fontSize: 14, color: '#757575', marginTop: 4 },
  list: { padding: 16 },
  card: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12,
    marginBottom: 12, overflow: 'hidden', elevation: 1,
  },
  severityIndicator: { width: 4 },
  cardContent: { flex: 1, padding: 16 },
  lesionType: { fontSize: 17, fontWeight: '600', color: '#212121' },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  severity: { fontSize: 14, fontWeight: '500' },
  hospitalBadge: { backgroundColor: '#FFEBEE', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  hospitalBadgeText: { color: '#D32F2F', fontSize: 11, fontWeight: '600' },
  date: { fontSize: 12, color: '#9E9E9E', marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 64 },
  emptyText: { fontSize: 18, color: '#757575', fontWeight: '500' },
  emptySubtext: { fontSize: 14, color: '#BDBDBD', marginTop: 8 },
});
