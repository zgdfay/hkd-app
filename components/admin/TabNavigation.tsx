import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { LayoutDashboard, Settings } from 'lucide-react-native';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => (
  <View className="absolute bottom-0 left-0 right-0 flex-row justify-around border-t border-gray-100 bg-white px-4 py-2 pb-6 shadow-xl">
    <TouchableOpacity
      onPress={() => onTabChange('pengaduan')}
      className="items-center gap-0.5">
      <LayoutDashboard size={20} color={activeTab === 'pengaduan' ? '#16A34A' : '#9CA3AF'} />
      <Text
        className={`font-pbold text-[9px] ${activeTab === 'pengaduan' ? 'text-green-600' : 'text-gray-400'}`}>
        PENGADUAN
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => onTabChange('setting')}
      className="items-center gap-0.5">
      <Settings size={20} color={activeTab === 'setting' ? '#16A34A' : '#9CA3AF'} />
      <Text
        className={`font-pbold text-[9px] ${activeTab === 'setting' ? 'text-green-600' : 'text-gray-400'}`}>
        SETTING
      </Text>
    </TouchableOpacity>
  </View>
);
