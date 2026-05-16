import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { LayoutDashboard } from 'lucide-react-native';

interface AdminHeaderProps {
  activeTab: string;
}

export const AdminHeader = ({ activeTab }: AdminHeaderProps) => (
  <View className="flex-row items-center justify-between bg-primary px-6 pb-10 pt-14">
    <View>
      <Text className="text-xl font-pbold text-white">Halo, Admin</Text>
      <Text className="text-sm text-white/80">
        {activeTab === 'pengaduan'
          ? 'Kelola pengaduan warga'
          : 'Pengaturan akun admin'}
      </Text>
    </View>
    <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
      <LayoutDashboard size={24} className="text-primary" />
    </TouchableOpacity>
  </View>
);
