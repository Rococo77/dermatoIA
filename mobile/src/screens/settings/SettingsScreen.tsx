import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../api/user';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export default function SettingsScreen() {
  const { user, logout, loadUser } = useAuthStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleUpdateName = async () => {
    try {
      await userApi.updateProfile({ full_name: newName });
      await loadUser();
      setIsEditingName(false);
      Alert.alert('Succes', 'Nom mis a jour');
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre a jour le nom');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caracteres');
      return;
    }
    try {
      await userApi.changePassword(currentPassword, newPassword);
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Succes', 'Mot de passe modifie');
    } catch {
      Alert.alert('Erreur', 'Mot de passe actuel incorrect');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irreversible. Toutes vos donnees et images seront supprimees.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.deleteAccount();
              await logout();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le compte');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Parametres</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>

          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Feather name="user" size={16} color={colors.text.tertiary} />
              <Text style={styles.fieldLabel}>Email</Text>
            </View>
            <Text style={styles.fieldValue}>{user?.email}</Text>
          </View>

          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Feather name="user" size={16} color={colors.text.tertiary} />
              <Text style={styles.fieldLabel}>Nom</Text>
            </View>
            {isEditingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={newName}
                  onChangeText={setNewName}
                />
                <TouchableOpacity onPress={handleUpdateName}>
                  <Text style={styles.saveLink}>Sauver</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingName(true)}>
                <Text style={styles.fieldValue}>{user?.full_name} ✎</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Feather name="lock" size={16} color={colors.text.tertiary} />
            <Text style={styles.sectionTitle}>Securite</Text>
          </View>

          {showPasswordForm ? (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe actuel"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
                <Text style={styles.actionButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowPasswordForm(true)}>
              <Text style={styles.link}>Changer le mot de passe</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Feather name="log-out" size={18} color={colors.text.primary} />
            <Text style={styles.logoutButtonText}>Se deconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerSection}>
          <Feather name="trash-2" size={18} color={colors.error} style={styles.dangerIcon} />
          <Text style={styles.dangerTitle}>Zone dangereuse</Text>
          <TouchableOpacity onPress={handleDeleteAccount}>
            <Text style={styles.dangerLink}>Supprimer mon compte</Text>
          </TouchableOpacity>
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
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    ...shadows.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text.primary,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  saveLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  link: {
    color: colors.primary,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    borderRadius: borderRadius.sm,
    padding: 14,
    gap: spacing.sm,
  },
  logoutButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerSection: {
    backgroundColor: colors.errorBg,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
    padding: spacing.lg,
    alignItems: 'center',
  },
  dangerIcon: {
    marginBottom: spacing.sm,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.md,
  },
  dangerLink: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
});
