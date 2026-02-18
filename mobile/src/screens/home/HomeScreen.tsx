import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, {user?.full_name}</Text>
        <Text style={styles.subtitle}>Comment va votre peau aujourd'hui ?</Text>
      </View>

      <View style={styles.mainAction}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.cameraButtonIcon}>📷</Text>
          <Text style={styles.cameraButtonText}>Analyser ma peau</Text>
          <Text style={styles.cameraButtonSubtext}>
            Prenez une photo pour obtenir un diagnostic IA
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCards}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('HistoryTab')}
        >
          <Text style={styles.cardTitle}>Historique</Text>
          <Text style={styles.cardDescription}>Consultez vos diagnostics precedents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('DashboardTab')}
        >
          <Text style={styles.cardTitle}>Dashboard</Text>
          <Text style={styles.cardDescription}>Vue d'ensemble de vos analyses</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Cette application ne remplace pas un avis medical professionnel.
          En cas de doute ou d'urgence, consultez un dermatologue.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 24, paddingTop: 16 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#212121' },
  subtitle: { fontSize: 16, color: '#757575', marginTop: 4 },
  mainAction: { paddingHorizontal: 24, marginBottom: 24 },
  cameraButton: {
    backgroundColor: '#2196F3', borderRadius: 16, padding: 32,
    alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  cameraButtonIcon: { fontSize: 48, marginBottom: 12 },
  cameraButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  cameraButtonSubtext: { color: '#BBDEFB', fontSize: 14, marginTop: 8, textAlign: 'center' },
  infoCards: { flexDirection: 'row', paddingHorizontal: 24, gap: 12 },
  card: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212121', marginBottom: 4 },
  cardDescription: { fontSize: 13, color: '#757575' },
  disclaimer: { position: 'absolute', bottom: 16, left: 24, right: 24 },
  disclaimerText: { textAlign: 'center', color: '#BDBDBD', fontSize: 11, lineHeight: 16 },
});
