import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

interface StatsCardsProps {
  total?: number;
  pending?: number;
  proses?: number;
  selesai?: number;
}

export const StatsCards = ({ total = 0, pending = 0, proses = 0, selesai = 0 }: StatsCardsProps) => (
  <View className="px-5 py-4 gap-3">
    {/* Baris Pertama: Total & Pending */}
    <View className="flex-row gap-3">
      <View className="flex-1 items-center rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 shadow-sm">
        <Text className="text-center text-[11px] font-pbold uppercase tracking-wider text-gray-500">Total</Text>
        <Text className="mt-1 text-center text-lg font-pbold text-gray-800">{total}</Text>
      </View>
      <View className="flex-1 items-center rounded-2xl border border-amber-100 bg-amber-50/70 p-3.5 shadow-sm">
        <Text className="text-center text-[11px] font-pbold uppercase tracking-wider text-amber-600">Pending</Text>
        <Text className="mt-1 text-center text-lg font-pbold text-amber-700">{pending}</Text>
      </View>
    </View>

    {/* Baris Kedua: Proses & Selesai */}
    <View className="flex-row gap-3">
      <View className="flex-1 items-center rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 shadow-sm">
        <Text className="text-center text-[11px] font-pbold uppercase tracking-wider text-blue-600">Proses</Text>
        <Text className="mt-1 text-center text-lg font-pbold text-blue-700">{proses}</Text>
      </View>
      <View className="flex-1 items-center rounded-2xl border border-green-100 bg-green-50/70 p-3.5 shadow-sm">
        <Text className="text-center text-[11px] font-pbold uppercase tracking-wider text-green-600">Selesai</Text>
        <Text className="mt-1 text-center text-lg font-pbold text-green-700">{selesai}</Text>
      </View>
    </View>
  </View>
);