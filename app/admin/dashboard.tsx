import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import {
  LogOut,
  Search,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Text } from '@/components/ui/text';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatsCards } from '@/components/admin/StatsCards';
import { FilterSection } from '@/components/admin/FilterSection';
import { UniversalComplaintCard } from '@/components/shared/UniversalComplaintCard';
import { DetailModal } from '@/components/admin/DetailModal';
import { TabNavigation } from '@/components/admin/TabNavigation';
import { getAllComplaints, updateComplaintStatus, forwardComplaint, getComplaintStats } from '@/services/complaints';
import { ComplaintListItem } from '@/types';
import { supabase } from '@/utils/supabase';
import { signOut, updatePassword } from '@/services/auth';

const ITEMS_PER_PAGE = 5;

function parseDate(dateStr: string): Date {
  const monthMap: Record<string, string> = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
    Mei: 'May', Jun: 'June', Jul: 'July', Ags: 'August',
    Sep: 'September', Okt: 'October', Nov: 'November', Des: 'December',
  };
  const parts = dateStr.split(' ');
  if (parts.length !== 3) return new Date(0);
  const month = monthMap[parts[1]] || parts[1];
  return new Date(`${month} ${parts[0]}, ${parts[2]}`);
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintListItem | null>(null);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [sortBy, setSortBy] = useState('Terbaru');
  const [activeTab, setActiveTab] = useState('pengaduan');
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, proses: 0, selesai: 0 });

  const [adminName, setAdminName] = useState('Admin HKD');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getComplaintStats();
      setStats(statsData);
    } catch {
      // silent fail
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllComplaints({
        status: filterStatus === 'Semua' ? undefined : filterStatus as any,
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
      });
      setComplaints(result.data);
      setTotalItems(result.total);
    } catch {
      Alert.alert('Error', 'Gagal memuat data pengaduan.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, searchQuery, currentPage]);

  React.useEffect(() => {
    if (activeTab === 'pengaduan') {
      fetchComplaints();
      fetchStats();
    }
  }, [activeTab, fetchComplaints, fetchStats]);

  // Realtime subscription - auto refresh when complaints change
  React.useEffect(() => {
    const channel = supabase
      .channel(`admin-complaints-realtime-${Math.random().toString(36).substring(7)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        () => {
          if (activeTab === 'pengaduan') {
            fetchComplaints();
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, fetchComplaints, fetchStats]);

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
    data.sort((a, b) => {
      const dateA = parseDate(a.date).getTime();
      const dateB = parseDate(b.date).getTime();
      return sortBy === 'Terbaru' ? dateB - dateA : dateA - dateB;
    });
    return data;
  }, [complaints, filterStatus, searchQuery, sortBy]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  const handleLogout = () => {
    const logoutAction = async () => {
      await signOut();
      await AsyncStorage.removeItem('user');
      router.replace('/login');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Apakah Anda yakin ingin keluar?')) logoutAction();
    } else {
      Alert.alert('Konfirmasi Keluar', 'Yakin ingin keluar?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: logoutAction },
      ]);
    }
  };

  const handleReview = (item: ComplaintListItem) => {
    setSelectedComplaint(item);
    setIsDetailVisible(true);
  };

  const handleForward = async (item: ComplaintListItem) => {
    try {
      await forwardComplaint(item.id);
      Alert.alert('Sukses', 'Laporan berhasil diteruskan ke Lurah.');
      fetchComplaints();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat meneruskan laporan.');
    }
  };

  const handleUpdate = async (item: ComplaintListItem) => {
    try {
      // Logic based on current state:
      // - If status='Pending' and lurahStatus='processing' → set status='Proses' (Update for citizen)
      // - If status='Proses' and lurahStatus='done' → set status='Selesai' (Final)
      if (item.status === 'Pending' && item.lurahStatus === 'processing') {
        await updateComplaintStatus(item.id, 'Proses');
        Alert.alert('Sukses', 'Status laporan telah diperbarui.');
      } else if (item.status === 'Proses' && item.lurahStatus === 'done') {
        await updateComplaintStatus(item.id, 'Selesai');
        Alert.alert('Sukses', 'Status akhir laporan telah dikirim.');
      }
      fetchComplaints();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memperbarui status.');
    }
  };

  const handleSaveProfile = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Peringatan', 'Mohon masukkan kata sandi baru.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Peringatan', 'Kata sandi minimal 6 karakter.');
      return;
    }

    try {
      await updatePassword(newPassword);
      Alert.alert('Sukses', 'Kata sandi berhasil diperbarui.');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal memperbarui kata sandi.');
    }
  };

  const handleClearFilters = () => {
    setSearchText('');
    setSearchQuery('');
    setFilterStatus('Semua');
    setCurrentPage(1);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-primary">
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View className="flex-1 bg-white">
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled">

          <AdminHeader activeTab={activeTab} />

          <View className="-mt-6 flex-1 rounded-t-[32px] bg-white pt-2">
            {activeTab === 'pengaduan' ? (
              <>
                <StatsCards
                  total={stats.total}
                  pending={stats.pending}
                  proses={stats.proses}
                  selesai={stats.selesai}
                />

                <FilterSection
                  searchText={searchText}
                  setSearchText={setSearchText}
                  onSearchSubmit={() => { setSearchQuery(searchText); setCurrentPage(1); }}
                  onSearchClear={() => { setSearchText(''); setSearchQuery(''); setCurrentPage(1); }}
                  sortBy={sortBy}
                  setSortBy={(val) => { setSortBy(val); setCurrentPage(1); }}
                  filterStatus={filterStatus}
                  onFilterChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}
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
                        role="admin"
                        onReview={handleReview}
                        onForward={handleForward}
                        onUpdate={handleUpdate}
                      />
                    ))
                  ) : (
                    <View className="items-center justify-center py-16">
                      <Search size={40} color="#9CA3AF" />
                      <Text className="mt-4 text-center font-pbold text-gray-900">Tidak ada hasil ditemukan</Text>
                      <TouchableOpacity onPress={handleClearFilters} className="mt-6 rounded-2xl bg-green-50 px-6 py-3">
                        <Text className="font-pbold text-green-600">Reset Semua</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Pagination */}
                {totalPages > 1 && (
                  <View className="mb-5 flex-row items-center justify-between px-5 py-6">
                    <TouchableOpacity
                      onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      className={`rounded-lg px-4 py-2 ${currentPage === 1 ? 'bg-gray-100' : 'bg-green-600'}`}>
                      <Text className={`font-psemibold text-xs ${currentPage === 1 ? 'text-gray-400' : 'text-white'}`}>Prev</Text>
                    </TouchableOpacity>
                    <Text className="font-pmedium text-xs text-gray-500">{currentPage} dari {totalPages}</Text>
                    <TouchableOpacity
                      onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      className={`rounded-lg px-4 py-2 ${currentPage === totalPages ? 'bg-gray-100' : 'bg-green-600'}`}>
                      <Text className={`font-psemibold text-xs ${currentPage === totalPages ? 'text-gray-400' : 'text-white'}`}>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View className="p-6">
                <Text className="font-pbold mb-6 text-lg text-gray-900">Pengaturan Akun</Text>

                <View className="mb-5">
                  <Text className="font-psemibold mb-2 text-sm text-gray-600">Nama Admin</Text>
                  <View className="h-12 flex-row items-center rounded-2xl bg-gray-50 px-4">
                    <User size={18} color="#9CA3AF" />
                    <TextInput
                      className="font-pmedium ml-3 flex-1 text-sm text-gray-900"
                      value={adminName}
                      onChangeText={setAdminName}
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
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                      {showPassword ? (
                        <EyeOff size={18} color="#9CA3AF" />
                      ) : (
                        <Eye size={18} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  className="mb-10 h-14 items-center justify-center rounded-2xl bg-green-600 shadow-sm"
                  onPress={handleSaveProfile}>
                  <Text className="text-md font-pbold text-white">Simpan Perubahan</Text>
                </TouchableOpacity>

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

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </View>
      </KeyboardAvoidingView>

      <DetailModal
        visible={isDetailVisible}
        onClose={() => setIsDetailVisible(false)}
        complaint={selectedComplaint}
      />
    </SafeAreaView>
  );
}