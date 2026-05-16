import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getColors = () => {
    switch (status) {
      case 'Pending':
        return { bg: 'bg-amber-100', text: 'text-amber-600' };
      case 'Proses':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'Selesai':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  const colors = getColors();
  return (
    <View className={`${colors.bg} rounded-lg px-2.5 py-1 ${className}`}>
      <Text className={`${colors.text} font-psemibold text-[11px]`}>{status}</Text>
    </View>
  );
};
