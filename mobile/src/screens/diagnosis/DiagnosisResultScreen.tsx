import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDiagnosisStore } from '../../store/diagnosisStore';
import { formatDate, formatConfidence, getSeverityColor, getSeverityLabel, formatLesionType } from '../../utils/formatters';

export default function DiagnosisResultScreen() {
  const navigation = useNavigation<any>();
  const { currentDiagnosis } = useDiagnosisStore();

  if (!currentDiagnosis) {
    return (
      <View style={styles.loading}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  const severityColor = getSeverityColor(currentDiagnosis.severity_level);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Resultat du diagnostic</Text>
          <Text style={styles.date}>{formatDate(currentDiagnosis.created_at)}</Text>
        </View>

        {currentDiagnosis.requires_hospital && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertTitle}>Consultation recommandee</Text>
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
          <Text style={styles.sectionTitle}>Type de lesion</Text>
          <Text style={styles.lesionType}>{formatLesionType(currentDiagnosis.lesion_type)}</Text>
          <Text style={styles.confidence}>
            Confiance : {formatConfidence(currentDiagnosis.lesion_type_confidence)}
          </Text>
        </View>

        <View style={[styles.severityCard, { borderLeftColor: severityColor }]}>
          <Text style={styles.sectionTitle}>Niveau de gravite</Text>
          <Text style={[styles.severityLevel, { color: severityColor }]}>
            {getSeverityLabel(currentDiagnosis.severity_level)}
          </Text>
          <Text style={styles.confidence}>
            Confiance : {formatConfidence(currentDiagnosis.severity_confidence)}
          </Text>
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.sectionTitle}>Recommandation</Text>
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

        <Text style={styles.disclaimer}>
          Ce diagnostic est genere par une intelligence artificielle et ne remplace en aucun cas
          l'avis d'un professionnel de sante. Consultez toujours un dermatologue pour un diagnostic definitif.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#212121' },
  date: { fontSize: 14, color: '#757575', marginTop: 4 },
  alertBanner: {
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 20,
    marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#D32F2F',
  },
  alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F', marginBottom: 8 },
  alertText: { fontSize: 14, color: '#B71C1C', marginBottom: 12, lineHeight: 20 },
  emergencyButton: {
    backgroundColor: '#D32F2F', borderRadius: 8, padding: 12, alignItems: 'center',
  },
  emergencyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  resultCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  severityCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 12,
    borderLeftWidth: 4, elevation: 1,
  },
  recommendationCard: {
    backgroundColor: '#E3F2FD', borderRadius: 12, padding: 20, marginBottom: 24,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#9E9E9E', textTransform: 'uppercase', marginBottom: 8 },
  lesionType: { fontSize: 22, fontWeight: 'bold', color: '#212121' },
  severityLevel: { fontSize: 22, fontWeight: 'bold' },
  confidence: { fontSize: 14, color: '#757575', marginTop: 4 },
  recommendation: { fontSize: 15, color: '#1565C0', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  homeButton: {
    flex: 1, backgroundColor: '#E0E0E0', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  homeButtonText: { fontSize: 16, fontWeight: '600', color: '#424242' },
  newAnalysisButton: {
    flex: 1, backgroundColor: '#2196F3', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  newAnalysisButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  disclaimer: { textAlign: 'center', color: '#BDBDBD', fontSize: 11, lineHeight: 16 },
});
