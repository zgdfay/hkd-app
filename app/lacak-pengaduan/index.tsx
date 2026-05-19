import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Search, QrCode, MapPin, Calendar, CheckCircle2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { BrowserMultiFormatReader } from '@zxing/library';

import { searchComplaintByCode } from '@/services/complaints';
import { Complaint, ComplaintStatus } from '@/types';
import { CitizenDetailModal } from '@/components/shared/CitizenDetailModal';
import { StatusBadge } from '@/components/admin/StatusBadge';

const STATUS_STEPS: { id: number; status: ComplaintStatus; label: string; desc: string }[] = [
  {
    id: 1,
    status: 'Pending',
    label: 'Menunggu',
    desc: 'Laporan telah diterima dan sedang menunggu diproses.',
  },
  {
    id: 2,
    status: 'Proses',
    label: 'Sedang Diproses',
    desc: 'Laporan sedang dikerjakan oleh tim.',
  },
  { id: 3, status: 'Selesai', label: 'Selesai', desc: 'Laporan telah selesai ditangani.' },
];

const getLogStyle = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes('selesai')) {
    return { dot: 'bg-green-500', text: 'text-green-700' };
  }
  if (lower.includes('pending') || lower.includes('proses')) {
    return { dot: 'bg-yellow-500', text: 'text-yellow-700' };
  }
  return { dot: 'bg-blue-500', text: 'text-blue-700' };
};

export default function LacakPengaduanPage() {
  const router = useRouter();
  const [complaintCode, setComplaintCode] = useState('');
  const [searchResult, setSearchResult] = useState<Complaint | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const handleSearch = async () => {
    if (!complaintCode.trim()) {
      Alert.alert('Peringatan', 'Mohon masukkan kode pengaduan.');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const result = await searchComplaintByCode(complaintCode.trim().toUpperCase());
      if (result) {
        setSearchResult(result);
      } else {
        Alert.alert('Tidak Ditemukan', 'Kode pengaduan tidak terdaftar di sistem kami.');
      }
    } catch {
      Alert.alert('Error', 'Terjadi kesalahan saat mencari.');
    } finally {
      setIsSearching(false);
    }
  };

  const onBarCodeScanned = ({ data }: { data: string }) => {
    if (hasScanned) return;

    // Reject blob URLs and invalid data
    if (data.startsWith('blob:') || data.startsWith('http') || !data) {
      setIsScannerVisible(false);
      Alert.alert('Error', 'QR Code tidak valid. Silakan masukkan kode secara manual.');
      setHasScanned(false);
      return;
    }

    setHasScanned(true);
    setIsScannerVisible(false);

    // Validate - QR should contain complaint code
    const code = data.trim().toUpperCase();
    if (!code || code.length < 5) {
      Alert.alert('Error', 'QR Code tidak valid. Silakan coba lagi.');
      setHasScanned(false);
      return;
    }

    setComplaintCode(code);
    setIsSearching(true);
    setSearchResult(null);

    searchComplaintByCode(code)
      .then((result) => {
        if (result) {
          setSearchResult(result);
        } else {
          Alert.alert('Tidak Ditemukan', 'Kode dari QR tidak terdaftar.');
          setHasScanned(false);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Terjadi kesalahan saat mencari.');
        setHasScanned(false);
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Izin Ditolak', 'Izin kamera diperlukan untuk scan QR Code.');
        return;
      }
    }
    setHasScanned(false);
    setIsScannerVisible(true);
  };

  const pickQRImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsScannerVisible(false);
      setIsSearching(true);

      try {
        const imageUri = result.assets[0].uri;

        if (Platform.OS === 'web') {
          // On Web, use the browser-side ZXing decoder
          const reader = new BrowserMultiFormatReader();
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = async () => {
            try {
              const result2 = await reader.decodeFromImageElement(img);
              const scannedCode = result2.getText();
              
              if (!scannedCode || scannedCode.length < 5 || scannedCode.startsWith('blob:') || scannedCode.startsWith('http')) {
                Alert.alert('Error', 'QR Code tidak valid.');
                setIsSearching(false);
                return;
              }

              setComplaintCode(scannedCode.toUpperCase());
              const complaintResult = await searchComplaintByCode(scannedCode.toUpperCase());
              if (complaintResult) {
                setSearchResult(complaintResult);
              } else {
                Alert.alert('Tidak Ditemukan', 'Kode dari QR tidak terdaftar.');
              }
            } catch {
              Alert.alert('Error', 'Tidak dapat membaca QR Code dari gambar.');
            } finally {
              setIsSearching(false);
            }
          };
          img.onerror = () => {
            Alert.alert('Error', 'Gagal memuat gambar.');
            setIsSearching(false);
          };
          img.src = imageUri;
        } else {
          // On Mobile, upload to a secure, stable QR decoding API
          const formData = new FormData();
          formData.append('file', {
            uri: imageUri,
            name: 'qrcode.jpg',
            type: 'image/jpeg',
          } as any);

          const response = await fetch('https://api.qrserver.com/v1/read-qr-code/', {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
            },
          });

          const apiResult = await response.json();
          setIsSearching(false);

          const symbol = apiResult[0]?.symbol[0];
          const scannedCode = symbol?.data;

          if (scannedCode && !symbol.error) {
            const code = scannedCode.trim().toUpperCase();
            if (code.startsWith('BLOB:') || code.startsWith('HTTP') || code.length < 5) {
              Alert.alert('Error', 'QR Code tidak mengandung kode yang valid.');
              return;
            }

            setComplaintCode(code);
            setIsSearching(true);
            const complaintResult = await searchComplaintByCode(code);
            if (complaintResult) {
              setSearchResult(complaintResult);
            } else {
              Alert.alert('Tidak Ditemukan', 'Kode dari QR tidak terdaftar.');
            }
            setIsSearching(false);
          } else {
            Alert.alert(
              'Gagal Membaca',
              'Gambar tidak mengandung QR Code yang valid. Pastikan QR Code terlihat jelas.'
            );
          }
        }
      } catch (error) {
        setIsSearching(false);
        console.error('QR decode error:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat memproses gambar.');
      }
    }
  };

  const getStatusIndex = (status: string): number => {
    const index = STATUS_STEPS.findIndex((step) => step.status === status);
    return index === -1 ? 0 : index;
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingBottom: 16,
          paddingTop: Platform.OS === 'android' ? 16 : 8,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
        }}>
        <TouchableOpacity
          onPress={handleBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-50">
          <ArrowLeft size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="font-pbold ml-4 text-lg text-gray-900">Lacak Pengaduan</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled">
        {/* Search Box */}
        <View className="mb-8">
          <Text className="font-psemibold mb-3 text-sm text-gray-700">Cek Status Laporan</Text>
          <View className="flex-row gap-2">
            <View className="h-14 flex-1 flex-row items-center rounded-2xl border border-gray-100 bg-gray-50 px-4">
              <Search size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Masukkan kode (Contoh: PKD-...)"
                placeholderTextColor="#9CA3AF"
                className="font-pmedium ml-3 flex-1 text-sm text-gray-900"
                value={complaintCode}
                onChangeText={setComplaintCode}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              onPress={openScanner}
              className="h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
              <QrCode size={24} color="#16A34A" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            disabled={isSearching}
            className={`mt-4 h-14 items-center justify-center rounded-2xl ${isSearching ? 'bg-gray-300' : 'bg-green-600'}`}>
            <Text className="font-pbold text-white">
              {isSearching ? 'Mencari...' : 'Lacak Sekarang'}
            </Text>
          </TouchableOpacity>
        </View>

        {searchResult ? (
          <View>
            {/* Result Info */}
            <View className="mb-6 rounded-3xl border border-gray-100 bg-gray-50 p-6">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="font-pbold text-green-700">{searchResult.code}</Text>
                <StatusBadge status={searchResult.status} />
              </View>
              <Text className="font-pbold mb-4 text-xl text-gray-900">{searchResult.title}</Text>

              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <MapPin size={16} color="#6B7280" />
                  <Text className="font-pmedium text-sm text-gray-600">
                    {searchResult.location}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="font-pmedium text-sm text-gray-600">
                    {new Date(searchResult.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsDetailVisible(true)}
                activeOpacity={0.7}
                className="mt-5 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-green-50 border border-green-100">
                <Text className="font-psemibold text-sm text-green-700">Lihat Detail Pengaduan</Text>
              </TouchableOpacity>
            </View>

            {/* Timeline */}
            <Text className="font-psemibold mb-6 text-sm text-gray-700">Status Terkini</Text>
            <View className="px-2">
              {STATUS_STEPS.map((step, index) => {
                const currentIndex = getStatusIndex(searchResult.status);
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;

                let circleColor = 'bg-gray-200';
                let textColor = 'text-gray-400';
                let lineColor = index < currentIndex ? 'bg-green-600' : 'bg-gray-200';

                if (isCompleted) {
                  circleColor = 'bg-green-600';
                  textColor = 'text-gray-900';
                } else if (isCurrent) {
                  if (step.status === 'Pending') {
                    circleColor = 'bg-amber-500';
                    textColor = 'text-amber-600';
                  } else if (step.status === 'Proses') {
                    circleColor = 'bg-blue-500';
                    textColor = 'text-blue-600';
                  } else if (step.status === 'Selesai') {
                    circleColor = 'bg-green-600';
                    textColor = 'text-green-600';
                  }
                }

                const showCheckmark = isCompleted || (isCurrent && step.status === 'Selesai');

                return (
                  <View key={step.id} className="flex-row">
                    {/* Progress Line & Dot */}
                    <View className="mr-4 items-center">
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-full ${circleColor}`}>
                        {showCheckmark ? (
                          <CheckCircle2 size={14} color="white" />
                        ) : isCurrent ? (
                          <View className="h-2 w-2 rounded-full bg-white" />
                        ) : (
                          <View className="h-2 w-2 rounded-full bg-gray-400" />
                        )}
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View
                          className={`w-[2px] flex-1 ${lineColor}`}
                          style={{ marginVertical: 4 }}
                        />
                      )}
                    </View>

                    {/* Step Content */}
                    <View className="mb-8 flex-1">
                      <Text className={`font-pbold text-sm ${textColor}`}>{step.label}</Text>
                      <Text
                        className={`font-pmedium mt-1 text-xs leading-5 ${isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.desc}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Detailed History Log */}
            {searchResult.history && searchResult.history.length > 0 && (
              <View className="mt-8">
                <Text className="font-psemibold mb-4 text-sm text-gray-700">Detail Riwayat</Text>
                <View className="gap-4">
                  {searchResult.history.map((log, idx) => {
                    const style = getLogStyle(log.label);
                    return (
                      <View
                        key={idx}
                        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <View className="mb-2 flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <View className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                            <Text className={`font-psemibold text-xs ${style.text}`}>
                              {log.label}
                            </Text>
                          </View>
                          <Text className="font-pmedium text-[10px] text-gray-400">{log.date}</Text>
                        </View>
                        <Text className="font-pmedium text-xs leading-5 text-gray-600">
                          {log.desc}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        ) : (
          !isSearching && (
            <View className="items-center justify-center py-10">
              <Search size={48} color="#E5E7EB" />
              <Text className="font-pbold mt-4 text-center text-gray-300">
                Belum ada data untuk dilacak
              </Text>
              <Text className="font-pmedium mt-2 text-center text-xs text-gray-400">
                Masukkan kode atau scan QR untuk melihat status.
              </Text>
            </View>
          )
        )}
      </ScrollView>

      {/* Scanner Modal */}
      <Modal visible={isScannerVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View className="flex-1">
            <CameraView
              style={{ flex: 1 }}
              onBarcodeScanned={hasScanned ? undefined : onBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}>
              <View className="flex-1 items-center justify-between p-6">
                {/* Close Button - Left Side */}
                <View className="w-full flex-row justify-between">
                  <TouchableOpacity
                    onPress={() => {
                      setHasScanned(false);
                      setIsScannerVisible(false);
                    }}
                    className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
                    <X size={24} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Scanner Overlay */}
                <View className="h-64 w-64 rounded-3xl border-2 border-white/50 bg-transparent" />
                <Text className="font-pbold mt-8 text-center text-white">
                  Arahkan kamera ke QR Code
                </Text>

                {/* Gallery Button */}
                <TouchableOpacity
                  onPress={pickQRImage}
                  className="mb-8 h-14 w-full items-center justify-center rounded-2xl bg-white/20">
                  <Text className="font-pbold text-white">Pilih dari Galeri</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        </SafeAreaView>
      </Modal>

      <CitizenDetailModal
        visible={isDetailVisible}
        onClose={() => setIsDetailVisible(false)}
        complaint={searchResult}
      />
    </SafeAreaView>
  );
}
