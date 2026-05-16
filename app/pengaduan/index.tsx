import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Send,
  Info,
  Trees,
  HardHat,
  ShieldAlert,
  Users,
  Activity,
  MoreHorizontal,
  X,
  Image as ImageIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { Text } from '@/components/ui/text';
import LoadingScreen from '@/components/shared/LoadingScreen';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { createComplaint } from '@/services/complaints';
import { ComplaintCategory } from '@/types';

const CATEGORIES: { id: ComplaintCategory; label: string; icon: typeof HardHat; color: string }[] = [
  { id: 'infrastruktur', label: 'Infrastruktur', icon: HardHat, color: '#0EA5E9' },
  { id: 'lingkungan', label: 'Lingkungan', icon: Trees, color: '#16A34A' },
  { id: 'keamanan', label: 'Keamanan', icon: ShieldAlert, color: '#EF4444' },
  { id: 'sosial', label: 'Sosial', icon: Users, color: '#8B5CF6' },
  { id: 'kesehatan', label: 'Kesehatan', icon: Activity, color: '#F43F5E' },
  { id: 'lainnya', label: 'Lainnya', icon: MoreHorizontal, color: '#6B7280' },
];

const MAX_IMAGES = 3;

export default function PengaduanPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView>(null);

  const handleImagePick = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Peringatan', `Maksimal ${MAX_IMAGES} foto yang dapat diunggah.`);
      return;
    }

    Alert.alert('Unggah Foto', 'Pilih sumber gambar', [
      { text: 'Kamera', onPress: takePhoto },
      { text: 'Galeri', onPress: pickImage },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((a) => a.uri);
      setImages([...images, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Izin Ditolak', 'Izin kamera diperlukan untuk mengambil foto.');
        return;
      }
    }
    setIsCameraModalVisible(true);
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo?.uri) {
        setImages([...images, photo.uri].slice(0, MAX_IMAGES));
      }
      setIsCameraModalVisible(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (
      !reporterName.trim() ||
      !reporterPhone.trim() ||
      !title.trim() ||
      !selectedCategory ||
      !description.trim() ||
      !location.trim()
    ) {
      Alert.alert('Peringatan', 'Mohon lengkapi semua data pengaduan termasuk identitas Anda.');
      return;
    }

    setIsLoading(true);

    try {
      const complaint = await createComplaint({
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        location: location.trim(),
        reporterName: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
      });

      router.replace({
        pathname: '/pengaduan/success',
        params: { code: complaint.code },
      });
    } catch (error) {
      const message = (error as Error).message || 'Terjadi kesalahan';
      Alert.alert('Gagal', message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    reporterName.trim() !== '' &&
    reporterPhone.trim() !== '' &&
    title.trim() !== '' &&
    selectedCategory !== '' &&
    description.trim() !== '' &&
    location.trim() !== '';

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Sticky Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingBottom: 16,
          paddingTop: Platform.OS === 'android' ? 16 : 8,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
          zIndex: 10,
        }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-50">
          <ArrowLeft size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="font-pbold text-lg text-gray-900">Buat Pengaduan</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
            {/* Info Card */}
            <View className="mb-8 flex-row items-center gap-3 rounded-2xl bg-green-50 p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Info size={20} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="font-psemibold text-sm text-green-800">
                  Layanan Aspirasi & Pengaduan
                </Text>
                <Text className="font-pmedium text-xs text-green-700">
                  Sampaikan keluhan Anda untuk desa yang lebih baik.
                </Text>
              </View>
            </View>

            {/* Nama Pelapor */}
            <View style={{ marginBottom: 20 }}>
              <Text className="font-psemibold mb-2 text-sm text-gray-700">Nama Pelapor</Text>
              <View className="rounded-2xl border border-gray-100 bg-gray-50 px-4">
                <TextInput
                  placeholder="Masukkan nama lengkap Anda"
                  placeholderTextColor="#9CA3AF"
                  className="font-pmedium h-12 text-sm text-gray-900"
                  value={reporterName}
                  onChangeText={setReporterName}
                />
              </View>
            </View>

            {/* Nomor WhatsApp */}
            <View style={{ marginBottom: 20 }}>
              <Text className="font-psemibold mb-2 text-sm text-gray-700">Nomor WhatsApp</Text>
              <View className="rounded-2xl border border-gray-100 bg-gray-50 px-4">
                <TextInput
                  placeholder="Contoh: 08123456789"
                  placeholderTextColor="#9CA3AF"
                  className="font-pmedium h-12 text-sm text-gray-900"
                  keyboardType="numeric"
                  value={reporterPhone}
                  onChangeText={(text) => setReporterPhone(text.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>

            {/* Judul Pengaduan */}
            <View style={{ marginBottom: 20 }}>
              <Text className="font-psemibold mb-2 text-sm text-gray-700">Judul Pengaduan</Text>
              <View className="rounded-2xl border border-gray-100 bg-gray-50 px-4">
                <TextInput
                  placeholder="Contoh: Lampu jalan rusak"
                  placeholderTextColor="#9CA3AF"
                  className="font-pmedium h-12 text-sm text-gray-900"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* Kategori */}
            <View style={{ marginBottom: 20 }}>
              <Text className="font-psemibold mb-3 text-sm text-gray-700">Pilih Kategori</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    className={`flex-row items-center gap-2 rounded-full border px-4 py-2.5 ${
                      selectedCategory === cat.id
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-100 bg-gray-50'
                    }`}>
                    <cat.icon
                      size={16}
                      color={selectedCategory === cat.id ? '#FFFFFF' : cat.color}
                    />
                    <Text
                      className={`font-psemibold text-xs ${selectedCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Lokasi */}
            <View style={{ marginBottom: 20 }}>
              <Text className="font-psemibold mb-2 text-sm text-gray-700">Lokasi Kejadian</Text>
              <View className="flex-row items-center rounded-2xl border border-gray-100 bg-gray-50 px-4">
                <TextInput
                  placeholder="Masukkan alamat atau titik lokasi"
                  placeholderTextColor="#9CA3AF"
                  className="font-pmedium ml-2 h-12 flex-1 text-sm text-gray-900"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Deskripsi */}
            <View style={{ marginBottom: 20 }}>
              <Text className="font-psemibold mb-2 text-sm text-gray-700">Deskripsi Lengkap</Text>
              <View className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2">
                <TextInput
                  placeholder="Ceritakan detail keluhan Anda..."
                  placeholderTextColor="#9CA3AF"
                  className="font-pmedium text-sm text-gray-900"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  style={{ height: 120 }}
                />
              </View>
            </View>

            {/* Upload Foto */}
            <View style={{ marginBottom: 28 }}>
              <Text className="font-psemibold mb-2 text-sm text-gray-700">
                Bukti Foto (Maks. {MAX_IMAGES})
              </Text>

              {/* Image Previews */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                {images.map((uri, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: '#EF4444',
                        borderRadius: 10,
                        padding: 2,
                      }}>
                      <X size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < MAX_IMAGES && (
                  <TouchableOpacity
                    onPress={handleImagePick}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: '#E5E7EB',
                      backgroundColor: '#F9FAFB',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Camera size={24} color="#16A34A" />
                  </TouchableOpacity>
                )}
              </View>

              {images.length === 0 && (
                <TouchableOpacity
                  onPress={handleImagePick}
                  style={{
                    height: 120,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#E5E7EB',
                    backgroundColor: '#F9FAFB',
                  }}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-green-50">
                    <ImageIcon size={20} color="#16A34A" />
                  </View>
                  <Text className="font-psemibold text-sm text-gray-500">
                    Unggah Bukti Kejadian
                  </Text>
                  <Text className="font-pmedium text-xs text-gray-400">
                    Klik untuk ambil foto atau pilih dari galeri
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isFormValid}
              style={{
                height: 56,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 16,
                backgroundColor: isFormValid ? '#16A34A' : '#D1D5DB',
                shadowColor: isFormValid ? '#16A34A' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isFormValid ? 0.2 : 0,
                shadowRadius: 8,
                elevation: isFormValid ? 4 : 0,
              }}>
              <Send size={20} color="#FFFFFF" />
              <Text className="font-pbold text-lg text-white">Kirim Pengaduan</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Custom Native Camera Modal */}
      <Modal visible={isCameraModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View className="flex-1">
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
            >
              <View className="flex-1 items-center justify-between p-6">
                <TouchableOpacity
                  onPress={() => setIsCameraModalVisible(false)}
                  className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <X size={24} color="white" />
                </TouchableOpacity>

                {/* Capture Controls */}
                <View className="mb-10 w-full flex-row items-center justify-center">
                  <TouchableOpacity
                    onPress={handleCapture}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 4,
                      borderColor: '#fff'
                    }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' }} />
                  </TouchableOpacity>
                </View>
              </View>
            </CameraView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}