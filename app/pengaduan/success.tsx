import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  Download,
  Copy,
  Check,
  Home,
  AlertCircle
} from 'lucide-react-native';
import React from 'react';
import { View, SafeAreaView, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

export default function SuccessPage() {
  const router = useRouter();
  const { code } = useLocalSearchParams();
  const complaintCode = code || 'HKD-20231015-001';
  const [isCopied, setIsCopied] = React.useState(false);
  const viewShotRef = React.useRef<any>(null);
  const qrRef = React.useRef<any>(null);

  const handleCopy = async () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

    try {
      await Clipboard.setStringAsync(complaintCode as string);
    } catch {
      // Web fallback
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(complaintCode as string);
        }
      } catch {
        // Final fallback for web
        if (typeof document !== 'undefined') {
          const el = document.createElement('textarea');
          el.value = complaintCode as string;
          el.style.cssText = 'position:fixed;opacity:0;left:-9999px;top:-9999px;';
          document.body.appendChild(el);
          el.focus();
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
      }
    }
  };

  const handleSaveQR = async () => {
    // Web doesn't support view-shot capture
    if (Platform.OS === 'web') {
      if (qrRef.current) {
        qrRef.current.toDataURL((data: string) => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 260;
            canvas.height = 320;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Draw background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, 260, 320);

              const img = new window.Image();
              img.onload = () => {
                // Draw QR
                ctx.drawImage(img, 30, 30, 200, 200);

                // Draw Text
                ctx.fillStyle = '#9CA3AF';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('KODE PENGADUAN', 130, 260);

                ctx.fillStyle = '#16A34A';
                ctx.font = 'bold 18px monospace';
                ctx.fillText(complaintCode as string, 130, 290);

                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `KODE-${complaintCode}.png`;
                link.click();
              };
              img.src = `data:image/png;base64,${data}`;
            }
          } catch {
            window.alert('Gagal mengunduh gambar.');
          }
        });
      }
      return;
    }

    if (!viewShotRef.current) {
      Alert.alert('Error', 'Gambar belum siap.');
      return;
    }

    try {
      const uri = await viewShotRef.current.capture?.();
      if (!uri) {
        Alert.alert('Info', 'Tidak bisa menyimpan ke galeri.');
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Tidak dapat menyimpan ke galeri.');
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('HKD App', asset, false);

      Alert.alert('Sukses', 'Gambar kode telah disimpan ke galeri.');
    } catch (error) {
      console.error('Save QR error:', error);
      Alert.alert('Error', 'Gagal menyimpan gambar.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
        showsVerticalScrollIndicator={false}>
        <Text className="font-pbold mb-2 mt-4 text-center text-2xl text-gray-900">
          Pengaduan Terkirim!
        </Text>
        <Text className="font-pmedium mb-10 text-center text-sm leading-5 text-gray-500">
          Laporan Anda telah berhasil kami terima. Simpan kode di bawah ini untuk melacak
          status laporan Anda.
        </Text>

        {/* Ticket Card */}
        <View
          style={{
            width: '100%',
            backgroundColor: '#f9fafb',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: '#f3f4f6',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 15,
            elevation: 2,
          }}>
          {/* QR Code */}
          <View
            style={{
              backgroundColor: '#fff',
              padding: 16,
              borderRadius: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
            }}>
            <QRCode
              getRef={(c) => (qrRef.current = c)}
              value={complaintCode as string}
              size={180}
              color="#1A1A1A"
              backgroundColor="white"
            />
          </View>

          <Text className="font-psemibold mb-1 text-xs text-gray-400">KODE PENGADUAN</Text>
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="font-pbold text-md tracking-wide text-green-700">{complaintCode}</Text>
            <TouchableOpacity onPress={handleCopy} className="rounded-full bg-green-50 p-1.5">
              {isCopied ? (
                <Check size={12} color="#16A34A" />
              ) : (
                <Copy size={12} color="#16A34A" />
              )}
            </TouchableOpacity>
          </View>

          <View className="h-[1px] w-full border-t border-dashed border-gray-200" />

          <View className="mt-6 flex-row items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
            <AlertCircle size={14} color="#D97706" />
            <Text className="font-pmedium text-[10px] text-amber-700">
              Gunakan kode ini di menu "Lacak Pengaduan"
            </Text>
          </View>

          {/* Hidden QR for capture - not visible but can be captured */}
          <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              <View style={{ padding: 32, backgroundColor: '#ffffff', alignItems: 'center', width: 300 }}>
                <View style={{ marginBottom: 20, backgroundColor: '#fff', padding: 16, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                  <QRCode
                    value={complaintCode as string}
                    size={200}
                    color="#1A1A1A"
                    backgroundColor="white"
                  />
                </View>
                <Text className="font-psemibold text-[14px] text-gray-400 mb-2">
                  KODE PENGADUAN
                </Text>
                <Text className="font-pbold text-[22px] text-green-700">
                  {complaintCode}
                </Text>
              </View>
            </ViewShot>
          </View>
        </View>

        {/* Actions */}
        <View className="mt-10 w-full gap-3">
          <TouchableOpacity
            onPress={handleSaveQR}
            style={{
              height: 56,
              width: '100%',
              backgroundColor: '#16A34A',
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            <Download size={20} color="white" />
            <Text className="font-pbold text-base text-white">Simpan Gambar Kode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={{
              height: 56,
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#e5e7eb',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            <Home size={20} color="#4B5563" />
            <Text className="font-pbold text-base text-gray-600">Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
