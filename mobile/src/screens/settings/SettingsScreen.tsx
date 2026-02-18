import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, TextInput,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../api/user';

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
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{user?.email}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nom</Text>
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
          <Text style={styles.sectionTitle}>Securite</Text>

          {showPasswordForm ? (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe actuel"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
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
            <Text style={styles.logoutButtonText}>Se deconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity onPress={handleDeleteAccount}>
            <Text style={styles.dangerLink}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#212121' },
  section: {
    backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 12, padding: 20, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#9E9E9E', textTransform: 'uppercase', marginBottom: 16 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: '#9E9E9E', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#212121' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editInput: {
    flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 8, fontSize: 16,
  },
  saveLink: { color: '#2196F3', fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12,
    fontSize: 16, marginBottom: 12, backgroundColor: '#F5F5F5',
  },
  link: { color: '#2196F3', fontSize: 16 },
  actionButton: {
    backgroundColor: '#2196F3', borderRadius: 8, padding: 12, alignItems: 'center',
  },
  actionButtonText: { color: '#FFF', fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#F5F5F5', borderRadius: 8, padding: 14, alignItems: 'center',
  },
  logoutButtonText: { color: '#424242', fontSize: 16, fontWeight: '600' },
  dangerSection: { alignItems: 'center', padding: 24 },
  dangerLink: { color: '#D32F2F', fontSize: 14 },
});
