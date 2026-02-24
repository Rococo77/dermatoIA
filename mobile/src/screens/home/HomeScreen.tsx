import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour, {user?.full_name}</Text>
          <Text style={styles.subtitle}>Comment va votre peau aujourd'hui ?</Text>
        </View>

        <View style={styles.mainAction}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => navigation.navigate('Camera')}
            activeOpacity={0.85}
          >
            <Feather name="camera" size={36} color="#FFFFFF" />
            <Text style={styles.cameraButtonText}>Analyser ma peau</Text>
            <Text style={styles.cameraButtonSubtext}>
              Prenez une photo pour obtenir un diagnostic IA
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCards}>
          <TouchableOpacity
            style={[styles.card, styles.cardHistorique]}
            onPress={() => navigation.navigate('HistoryTab')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Feather name="clock" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Historique</Text>
            </View>
            <Text style={styles.cardDescription}>Consultez vos diagnostics precedents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardDashboard]}
            onPress={() => navigation.navigate('DashboardTab')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Feather name="bar-chart-2" size={20} color="#D97706" />
              <Text style={styles.cardTitle}>Dashboard</Text>
            </View>
            <Text style={styles.cardDescription}>Vue d'ensemble de vos analyses</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Cette application ne remplace pas un avis medical professionnel.
            En cas de doute ou d'urgence, consultez un dermatologue.
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  mainAction: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  cameraButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.lg,
  },
  cameraButtonText: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  cameraButtonSubtext: {
    color: colors.primaryLight,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  infoCards: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardHistorique: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  cardDashboard: {
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  disclaimer: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  disclaimerText: {
    textAlign: 'center',
    color: colors.text.tertiary,
    fontSize: 11,
    lineHeight: 16,
  },
});
