import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatDate, formatConfidence, getSeverityColor, getSeverityLabel, formatLesionType } from '../../utils/formatters';
import { Diagnosis } from '../../types';

export default function DiagnosisDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const diagnosis: Diagnosis = route.params.diagnosis;

  const severityColor = getSeverityColor(diagnosis.severity_level);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Detail du diagnostic</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>{formatDate(diagnosis.created_at)}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Type de lesion</Text>
          <Text style={styles.value}>{formatLesionType(diagnosis.lesion_type)}</Text>
          <Text style={styles.confidence}>Confiance : {formatConfidence(diagnosis.lesion_type_confidence)}</Text>
        </View>

        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: severityColor }]}>
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  backButton: { color: '#2196F3', fontSize: 16 },
  topTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 24 },
  date: { fontSize: 14, color: '#757575', marginBottom: 16 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 12,
    elevation: 1,
  },
  label: { fontSize: 12, fontWeight: '600', color: '#9E9E9E', textTransform: 'uppercase', marginBottom: 6 },
  value: { fontSize: 20, fontWeight: 'bold', color: '#212121' },
  confidence: { fontSize: 13, color: '#757575', marginTop: 4 },
  recommendation: { fontSize: 15, color: '#424242', lineHeight: 22 },
  hospitalBadge: {
    backgroundColor: '#FFEBEE', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12,
  },
  hospitalText: { color: '#D32F2F', fontWeight: '600' },
  modelVersion: { textAlign: 'center', color: '#BDBDBD', fontSize: 12, marginTop: 16 },
});
