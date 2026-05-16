import { Stack, useRouter } from 'expo-router';
import { LogOut, Search, User, ShieldCheck } from 'lucide-react-native';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';

import { LurahHeader } from '@/components/lurah/LurahHeader';
import { UniversalComplaintCard } from '@/components/shared/UniversalComplaintCard';
import { LurahTabNav } from '@/components/lurah/LurahTabNav';
import { StatsCards } from '@/components/admin/StatsCards';
import { FilterSection } from '@/components/admin/FilterSection';
import { DetailModal } from '@/components/admin/DetailModal';
import { getComplaintsForLurah, setLurahStatusProcessing, setLurahStatusDone } from '@/services/complaints';
import { ComplaintListItem } from '@/types';

export default function LurahDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintListItem | null>(null);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [sortBy, setSortBy] = useState('Terbaru');
  const [activeTab, setActiveTab] = useState('tugas');
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [lurahName, setLurahName] = useState('Bpk. Lurah Kidul Dalem');
  const [newPassword, setNewPassword] = useState('');

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getComplaintsForLurah({
        page: currentPage,
        perPage: 10,
      });
      setComplaints(result.data);
    } catch {
      Alert.alert('Error', 'Gagal memuat tugas.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  React.useEffect(() => {
    if (activeTab === 'tugas') {
      fetchComplaints();
    }
  }, [activeTab, fetchComplaints]);

  const filteredData = useMemo(() => {
    let data = [...complaints];
    if (filterStatus !== 'Semua') data = data.filter((item) => item.status === filterStatus);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.title.toLowerCase().includes(query) || item.citizen.toLowerCase().includes(query)
      );
    }
    return data;
  }, [complaints, filterStatus, searchQuery]);

  const handleLogout = () => {
    const logoutAction = async () => {
      const { signOut } = await import('@/services/auth');
      await signOut();
      router.replace('/login');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Yakin ingin keluar?')) logoutAction();
    } else {
      Alert.alert('Konfirmasi', 'Yakin ingin keluar?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: logoutAction },
      ]);
    }
  };

  const handleReview = (item: ComplaintListItem) => {
    setSelectedComplaint({
      id: item.id,
      code: item.id,
      title: item.title,
      description: item.description || '',
      category: item.category as any,
      location: item.location || '',
      reporterName: item.citizen,
      reporterPhone: '',
      status: item.status,
      images: item.images || [],
      createdAt: item.date,
      updatedAt: item.date,
    });
    setIsDetailVisible(true);
  };

  const handleProcess = async (item: ComplaintListItem) => {
    try {
      await setLurahStatusProcessing(item.id);
      Alert.alert('Sukses', 'Laporan sedang diproses.');
      fetchComplaints();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memperbarui status.');
    }
  };

  const handleDone = async (item: ComplaintListItem) => {
    try {
      await setLurahStatusDone(item.id);
      Alert.alert('Sukses', 'Tugas telah diselesaikan.');
      fetchComplaints();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyelesaikan tugas.');
    }
  };

  const handleSaveProfile = async () => {
    // Profile update not implemented via Supabase yet
    Alert.alert('Info', 'Fitur update profil belum tersedia.');
    setNewPassword('');
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-primary">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 bg-white">
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled">
          <LurahHeader activeTab={activeTab} />

          <View className="-mt-6 flex-1 rounded-t-[32px] bg-white pt-2">
            {activeTab === 'tugas' ? (
              <>
                <StatsCards
                  total={complaints.length}
                  pending={0}
                  proses={complaints.filter(c => c.status === 'Proses').length}
                  selesai={complaints.filter(c => c.status === 'Selesai').length}
                />

                <FilterSection
                  searchText={searchText}
                  setSearchText={setSearchText}
                  onSearchSubmit={() => {
                    setSearchQuery(searchText);
                    setCurrentPage(1);
                  }}
                  onSearchClear={() => {
                    setSearchText('');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  filterStatus={filterStatus}
                  onFilterChange={setFilterStatus}
                />

                <View className="px-5">
                  {isLoading ? (
                    <View className="items-center justify-center py-16">
                      <Text className="font-pmedium text-sm text-gray-500">Memuat...</Text>
                    </View>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <UniversalComplaintCard
                        key={item.id}
                        item={item}
                        role="lurah"
                        onReview={(i) => handleReview(i)}
                        onProcess={(i) => handleProcess(i)}
                        onDone={(i) => handleDone(i)}
                      />
                    ))
                  ) : (
                    <View className="items-center justify-center py-16">
                      <Search size={40} color="#9CA3AF" />
                      <Text className="font-pbold mt-4 text-center text-gray-900">
                        Tidak ada tugas baru
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View className="p-6">
                <Text className="font-pbold mb-6 text-lg text-gray-900">Pengaturan Akun Lurah</Text>

                <View className="mb-5">
                  <Text className="font-psemibold mb-2 text-sm text-gray-600">Nama Lengkap</Text>
                  <View className="h-12 flex-row items-center rounded-2xl bg-gray-50 px-4">
                    <User size={18} color="#9CA3AF" />
                    <TextInput
                      className="font-pmedium ml-3 flex-1 text-sm text-gray-900"
                      value={lurahName}
                      onChangeText={setLurahName}
                    />
                  </View>
                </View>

                <View className="mb-8">
                  <Text className="font-psemibold mb-2 text-sm text-gray-600">Kata Sandi Baru</Text>
                  <View className="h-12 flex-row items-center rounded-2xl bg-gray-50 px-4">
                    <ShieldCheck size={18} color="#9CA3AF" />
                    <TextInput
                      className="font-pmedium ml-3 flex-1 text-sm text-gray-900"
                      placeholder="Masukkan sandi baru"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  className="mb-10 h-14 items-center justify-center rounded-2xl bg-green-600 shadow-sm"
                  onPress={handleSaveProfile}>
                  <Text className="text-md font-pbold text-white">Simpan Perubahan</Text>
                </TouchableOpacity>

                <View className="mb-8 h-[1px] bg-gray-100" />

                <TouchableOpacity
                  onPress={handleLogout}
                  className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-red-50">
                  <LogOut size={20} color="#EF4444" />
                  <Text className="font-pbold text-red-500">Keluar Aplikasi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <LurahTabNav activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <DetailModal
        visible={isDetailVisible}
        onClose={() => setIsDetailVisible(false)}
        complaint={selectedComplaint}
      />
    </SafeAreaView>
  );
}