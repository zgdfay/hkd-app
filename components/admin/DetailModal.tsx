import React from 'react';
import { View, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { X, MapPin, AlertCircle } from 'lucide-react-native';
import { StatusBadge } from './StatusBadge';
import { ComplaintListItem } from '@/types';

interface DetailModalProps {
  visible: boolean;
  onClose: () => void;
  complaint: ComplaintListItem | null;
}

export const DetailModal = ({ visible, onClose, complaint }: DetailModalProps) => {
  if (!complaint) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="h-[90%] rounded-t-[32px] bg-white p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-pbold text-[18px] text-[#1A1A1A]">Detail Pengaduan</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}>
            <View className="mb-3 mt-5 flex-row items-center gap-3">
              <StatusBadge status={complaint.status} />
              <Text className="font-pmedium text-[14px] uppercase text-gray-400">
                {complaint.category}
              </Text>
            </View>

            <Text className="font-pbold mb-6 text-[22px] leading-8 text-[#1A1A1A]">
              {complaint.title}
            </Text>

            <View className="mb-5">
              <Text className="font-psemibold mb-2.5 text-[15px] text-[#1A1A1A]">Data Pelapor</Text>
              <View className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <View className="mb-2 flex-row justify-between">
                  <Text className="font-pregular text-[14px] text-gray-500">Nama:</Text>
                  <Text className="font-psemibold text-[14px] text-[#1A1A1A]">
                    {complaint.citizen}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="font-pregular text-[14px] text-gray-500">Tanggal Lapor:</Text>
                  <Text className="font-psemibold text-[14px] text-[#1A1A1A]">
                    {complaint.date}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-5">
              <Text className="font-psemibold mb-2.5 text-[15px] text-[#1A1A1A]">
                Lokasi Kejadian
              </Text>
              <View className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <Text className="font-pmedium flex-1 text-[14px] text-[#1A1A1A]">
                  {complaint.location || 'Tidak ada lokasi'}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <Text className="font-psemibold mb-2.5 text-[15px] text-[#1A1A1A]">
                Deskripsi Pengaduan
              </Text>
              <View className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <Text className="font-pregular text-[14px] leading-6 text-[#374151]">
                  {complaint.description || 'Tidak ada deskripsi tersedia.'}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <Text className="font-psemibold mb-2.5 text-[15px] text-[#1A1A1A]">
                Bukti Pendukung
              </Text>
              {complaint.images && complaint.images.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}>
                  {complaint.images.map((img, index) => (
                    <Image
                      key={index}
                      source={{ uri: img }}
                      className="h-[160px] w-[240px] rounded-2xl bg-gray-100"
                    />
                  ))}
                </ScrollView>
              ) : (
                <View className="h-[180px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-100">
                  <AlertCircle size={32} color="#9CA3AF" />
                  <Text className="font-pmedium text-[13px] text-gray-400">
                    Foto belum diunggah
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              className="h-14 flex-row items-center justify-center gap-2.5 rounded-2xl bg-green-600 shadow-md"
              onPress={onClose}>
              <Text className="font-pbold text-[16px] text-white">Tutup</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
