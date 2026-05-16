import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { ClipboardList, Settings } from 'lucide-react-native';

interface LurahTabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const LurahTabNav = ({ activeTab, onTabChange }: LurahTabNavProps) => (
  <View className="absolute bottom-0 left-0 right-0 flex-row justify-around border-t border-gray-100 bg-white px-4 py-2 pb-6 shadow-xl">
    <TouchableOpacity
      onPress={() => onTabChange('tugas')}
      className="items-center gap-0.5">
      <ClipboardList size={20} color={activeTab === 'tugas' ? '#16A34A' : '#9CA3AF'} />
      <Text
        className={`font-pbold text-[9px] ${activeTab === 'tugas' ? 'text-green-600' : 'text-gray-400'}`}>
        TUGAS
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
