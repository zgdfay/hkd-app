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
  <View className="flex-row gap-3 px-5 py-5">
    <View className="flex-1 items-center rounded-2xl border border-green-100 bg-green-50 p-3">
      <Text className="text-center text-sm font-pbold uppercase text-gray-700">Total</Text>
      <Text className="mt-1 text-center text-sm font-psemibold text-green-600">{total}</Text>
    </View>
    <View className="flex-1 items-center rounded-2xl border border-amber-100 bg-amber-50 p-3">
      <Text className="text-center text-sm font-pbold uppercase text-gray-700">Pending</Text>
      <Text className="mt-1 text-center text-sm font-psemibold text-amber-600">{pending}</Text>
    </View>
    <View className="flex-1 items-center rounded-2xl border border-blue-100 bg-blue-50 p-3">
      <Text className="text-center text-sm font-pbold uppercase text-gray-700">Proses</Text>
      <Text className="mt-1 text-center text-sm font-psemibold text-blue-600">{proses}</Text>
    </View>
  </View>
);