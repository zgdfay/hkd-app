import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { UserCircle } from 'lucide-react-native';

interface LurahHeaderProps {
  activeTab: string;
}

export const LurahHeader = ({ activeTab }: LurahHeaderProps) => (
  <View className="flex-row items-center justify-between bg-primary px-6 pb-10 pt-14">
    <View>
      <Text className="text-xl font-pbold text-white">Halo, Pak Lurah</Text>
      <Text className="text-sm text-white/80">
        {activeTab === 'tugas'
          ? 'Tinjau & ambil keputusan laporan'
          : 'Pengaturan profil lurah'}
      </Text>
    </View>
    <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
      <UserCircle size={24} color="#16A34A" />
    </TouchableOpacity>
  </View>
);
