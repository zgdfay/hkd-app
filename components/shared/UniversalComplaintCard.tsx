import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  FileSearch,
  Forward,
  CheckCircle2,
  Clock,
  CheckCircle
} from 'lucide-react-native';
import { StatusBadge } from '../admin/StatusBadge';
import { ComplaintListItem } from '@/types';

interface UniversalComplaintCardProps {
  item: ComplaintListItem;
  role: 'admin' | 'lurah';
  onReview: (item: ComplaintListItem) => void;
  // Admin specific
  onForward?: (item: ComplaintListItem) => void;
  onUpdate?: (item: ComplaintListItem) => void;
  // Lurah specific
  onProcess?: (item: ComplaintListItem) => void;
  onDone?: (item: ComplaintListItem) => void;
}

export const UniversalComplaintCard = ({
  item,
  role,
  onReview,
  onForward,
  onUpdate,
  onProcess,
  onDone
}: UniversalComplaintCardProps) => {
  const lurahStatus = item.lurahStatus || 'pending';
  const isDoneByLurah = lurahStatus === 'done';
  const isProcessedByLurah = lurahStatus === 'processing';
  const isPendingByLurah = lurahStatus === 'pending';

  // Admin third button: enabled when lurah processing with status Pending (Update) OR lurah done with status Proses (Selesai)
  const canAdminUpdate = item.isForwarded && lurahStatus === 'processing' && item.status === 'Pending';
  const canAdminSelesai = item.isForwarded && lurahStatus === 'done' && item.status === 'Proses';
  const isAdminThirdEnabled = canAdminUpdate || canAdminSelesai;

  // Card opacity:
  // - Admin: muted only when status='Selesai' AND lurahStatus='done' (fully complete)
  // - Lurah: muted when lurahStatus='done'
  const isFullyComplete = item.isForwarded && lurahStatus === 'done' && item.status === 'Selesai';
  const cardOpacity = role === 'admin' ? (isFullyComplete ? 'opacity-50' : '') : (isDoneByLurah ? 'opacity-50' : '');

  return (
    <View className={`mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${cardOpacity}`}>
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-sm font-pmedium uppercase text-gray-400">{item.category}</Text>
          <Text className="text-md font-psemibold text-gray-900">{item.title}</Text>
        </View>
        <StatusBadge status={item.status} className="mt-1" />
      </View>

      <View className="mb-4">
        <View className="mb-1 flex-row items-center">
          <Text className="text-sm font-pmedium text-gray-500">
            Pelapor: <Text className="text-sm font-pmedium text-gray-900">{item.citizen}</Text>
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-sm font-pmedium text-gray-500">
            {role === 'admin' ? 'Tanggal: ' : 'Lokasi: '}
            <Text className="text-sm font-pmedium text-gray-900">
              {role === 'admin' ? item.date : item.location?.split(',')[0]}
            </Text>
          </Text>
        </View>
      </View>

      <View className="mb-3 h-[1px] bg-gray-50" />

      <View className="flex-row justify-between gap-2">
        {/* First Button: Review - always enabled */}
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-gray-50 py-2.5"
          onPress={() => onReview(item)}>
          <FileSearch size={14} color="#4B5563" />
          <Text className="font-pmedium text-xs text-gray-600">
            {role === 'admin' ? 'Periksa' : 'Tinjau'}
          </Text>
        </TouchableOpacity>

        {/* Second Button: Action */}
        {role === 'admin' ? (
          // Admin: Teruskan button - disabled after forwarded
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
              item.isForwarded ? 'bg-gray-50 opacity-50' : 'bg-blue-50'
            }`}
            onPress={() => onForward?.(item)}
            disabled={item.isForwarded}>
            <Forward size={14} color={item.isForwarded ? '#9CA3AF' : '#2563EB'} />
            <Text className={`font-pmedium text-xs ${item.isForwarded ? 'text-gray-400' : 'text-blue-600'}`}>
              {item.isForwarded ? 'Diteruskan' : 'Teruskan'}
            </Text>
          </TouchableOpacity>
        ) : (
          // Lurah: Proses button - enabled only if lurahStatus='pending' and not done
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
              isDoneByLurah || !isPendingByLurah ? 'bg-gray-50 opacity-50' : 'bg-amber-50'
            }`}
            onPress={() => onProcess?.(item)}
            disabled={isDoneByLurah || !isPendingByLurah}>
            <Clock size={14} color={isDoneByLurah || !isPendingByLurah ? '#9CA3AF' : '#D97706'} />
            <Text className={`font-pmedium text-xs ${isDoneByLurah || !isPendingByLurah ? 'text-gray-400' : 'text-amber-600'}`}>
              {isProcessedByLurah ? 'Diproses' : 'Proses'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Third Button: Completion */}
        {role === 'admin' ? (
          // Admin third button states:
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
              !isAdminThirdEnabled ? 'bg-gray-50 opacity-50' : 'bg-green-50'
            }`}
            onPress={() => onUpdate?.(item)}
            disabled={!isAdminThirdEnabled}>
            <CheckCircle2 size={14} color={!isAdminThirdEnabled ? '#9CA3AF' : '#16A34A'} />
            <Text className={`font-pmedium text-xs ${!isAdminThirdEnabled ? 'text-gray-400' : 'text-green-600'}`}>
              {canAdminSelesai ? 'Selesai' : 'Update'}
            </Text>
          </TouchableOpacity>
        ) : (
          // Lurah Selesai: enabled only if lurahStatus='processing' (already clicked Proses, not done yet)
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
              !isProcessedByLurah || isDoneByLurah ? 'bg-gray-50 opacity-50' : 'bg-green-50'
            }`}
            onPress={() => onDone?.(item)}
            disabled={!isProcessedByLurah || isDoneByLurah}>
            <CheckCircle size={14} color={!isProcessedByLurah || isDoneByLurah ? '#9CA3AF' : '#16A34A'} />
            <Text className={`font-pmedium text-xs ${!isProcessedByLurah || isDoneByLurah ? 'text-gray-400' : 'text-green-600'}`}>
              Selesai
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};