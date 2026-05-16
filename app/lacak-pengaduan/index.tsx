import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchComplaintByCode } from '@/services/complaints';
import { Complaint, ComplaintStatus } from '@/types';

const STATUS_STEPS: { id: number; status: ComplaintStatus; label: string; desc: string }[] = [
  { id: 1, status: 'Pending', label: 'Menunggu', desc: 'Laporan telah diterima dan sedang menunggu diproses.' },
  { id: 2, status: 'Proses', label: 'Sedang Diproses', desc: 'Laporan sedang dikerjakan oleh tim.' },
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

  const getStatusIndex = (status: string): number => {
    const index = STATUS_STEPS.findIndex(step => step.status === status);
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
      <View style={{
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
            <View className="mb-6 rounded-3xl bg-gray-50 p-6 border border-gray-100">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="font-pbold text-green-700">{searchResult.code}</Text>
                <View className="rounded-full bg-green-100 px-3 py-1">
                  <Text className="font-psemibold text-[10px] text-green-700 uppercase">{searchResult.status}</Text>
                </View>
              </View>
              <Text className="font-pbold mb-4 text-xl text-gray-900">{searchResult.title}</Text>

              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <MapPin size={16} color="#6B7280" />
                  <Text className="font-pmedium text-sm text-gray-600">{searchResult.location}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="font-pmedium text-sm text-gray-600">
                    {new Date(searchResult.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>
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
                    circleColor = 'bg-blue-500';
                    textColor = 'text-blue-600';
                  } else if (step.status === 'Proses') {
                    circleColor = 'bg-yellow-500';
                    textColor = 'text-yellow-600';
                  } else if (step.status === 'Selesai') {
                    circleColor = 'bg-green-600';
                    textColor = 'text-green-600';
                  }
                }

                const showCheckmark = isCompleted || (isCurrent && step.status === 'Selesai');

                return (
                  <View key={step.id} className="flex-row">
                    {/* Progress Line & Dot */}
                    <View className="items-center mr-4">
                      <View className={`h-6 w-6 items-center justify-center rounded-full ${circleColor}`}>
                        {showCheckmark ? (
                          <CheckCircle2 size={14} color="white" />
                        ) : isCurrent ? (
                          <View className="h-2 w-2 rounded-full bg-white" />
                        ) : (
                          <View className="h-2 w-2 rounded-full bg-gray-400" />
                        )}
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View className={`w-[2px] flex-1 ${lineColor}`} style={{ marginVertical: 4 }} />
                      )}
                    </View>

                    {/* Step Content */}
                    <View className="mb-8 flex-1">
                      <Text className={`font-pbold text-sm ${textColor}`}>
                        {step.label}
                      </Text>
                      <Text className={`font-pmedium mt-1 text-xs leading-5 ${isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'}`}>
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
                      <View key={idx} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <View className="mb-2 flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <View className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                            <Text className={`font-psemibold text-xs ${style.text}`}>{log.label}</Text>
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
        ) : !isSearching && (
          <View className="items-center justify-center py-10">
            <Search size={48} color="#E5E7EB" />
            <Text className="font-pbold mt-4 text-center text-gray-300">Belum ada data untuk dilacak</Text>
            <Text className="font-pmedium mt-2 text-center text-xs text-gray-400">Masukkan kode untuk melihat status.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}