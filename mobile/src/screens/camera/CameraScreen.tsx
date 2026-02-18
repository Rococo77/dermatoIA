import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export default function CameraScreen() {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });
      if (photo) {
        navigation.navigate('ImagePreview', { imageUri: photo.uri });
      }
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      navigation.navigate('ImagePreview', { imageUri: result.assets[0].uri });
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          L'acces a la camera est necessaire pour analyser votre peau.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Autoriser la camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeButton}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guide}>
          <View style={styles.guideFrame} />
          <Text style={styles.guideText}>
            Cadrez la zone de peau a analyser
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
            <Text style={styles.galleryButtonText}>Galerie</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionText: { fontSize: 16, textAlign: 'center', color: '#757575' },
  permissionButton: {
    marginTop: 16, backgroundColor: '#2196F3', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 8,
  },
  permissionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, paddingTop: 48 },
  closeButton: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  guide: { alignItems: 'center' },
  guideFrame: {
    width: 250, height: 250, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
  },
  guideText: { color: '#FFF', fontSize: 14, marginTop: 12, textAlign: 'center' },
  controls: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', paddingBottom: 40, paddingHorizontal: 24,
  },
  galleryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 20,
  },
  galleryButtonText: { color: '#FFF', fontSize: 14 },
  captureButton: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4,
    borderColor: '#FFF', justifyContent: 'center', alignItems: 'center',
  },
  captureButtonInner: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFF',
  },
  placeholder: { width: 60 },
});
