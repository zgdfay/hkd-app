import React from 'react';
import { View, Modal, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { X, AlertCircle, Phone, User, Calendar } from 'lucide-react-native';
import { StatusBadge } from '../admin/StatusBadge';
import { Complaint } from '@/types';

interface CitizenDetailModalProps {
  visible: boolean;
  onClose: () => void;
  complaint: Complaint | null;
}

export const CitizenDetailModal = ({ visible, onClose, complaint }: CitizenDetailModalProps) => {
  if (!complaint) return null;

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        {/* Clickable backdrop overlay to close modal */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View 
          className="h-[90%] rounded-t-[32px] bg-white p-6 shadow-2xl"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 20,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-gray-100 pb-4">
            <View>
              <Text className="font-pbold text-lg text-gray-900">Detail Pengaduan</Text>
              <Text className="font-pmedium text-xs text-green-700 mt-0.5">{complaint.code}</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-50"
            >
              <X size={20} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
          >
            {/* Status and Category Badge */}
            <View className="mb-4 flex-row items-center gap-3">
              <StatusBadge status={complaint.status} />
              <View className="rounded-lg bg-gray-100 px-2.5 py-1">
                <Text className="font-psemibold text-[11px] uppercase text-gray-600">
                  {complaint.category}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text className="font-pbold mb-5 text-[22px] leading-8 text-[#1A1A1A]">
              {complaint.title}
            </Text>

            {/* Reporter Data Section */}
            <View className="mb-5">
              <Text className="font-psemibold mb-2.5 text-[14px] text-gray-500">Informasi Pelapor</Text>
              <View className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <User size={16} color="#9CA3AF" />
                    <Text className="font-pmedium text-[14px] text-gray-600">Nama Pelapor</Text>
                  </View>
                  <Text className="font-psemibold text-[14px] text-gray-900">
                    {complaint.reporterName || 'Anonim'}
                  </Text>
                </View>
                {complaint.reporterPhone && (
                  <View className="flex-row items-center justify-between border-t border-gray-100/80 pt-3">
                    <View className="flex-row items-center gap-2">
                      <Phone size={16} color="#9CA3AF" />
                      <Text className="font-pmedium text-[14px] text-gray-600">No. Telepon</Text>
                    </View>
                    <Text className="font-psemibold text-[14px] text-gray-900">
                      {complaint.reporterPhone}
                    </Text>
                  </View>
                )}
                <View className="flex-row items-center justify-between border-t border-gray-100/80 pt-3">
                  <View className="flex-row items-center gap-2">
                    <Calendar size={16} color="#9CA3AF" />
                    <Text className="font-pmedium text-[14px] text-gray-600">Tanggal Pengaduan</Text>
                  </View>
                  <Text className="font-psemibold text-[14px] text-gray-900">
                    {formattedDate}
                  </Text>
                </View>
              </View>
            </View>

            {/* Location Section */}
            <View className="mb-5">
              <Text className="font-psemibold mb-2.5 text-[14px] text-gray-500">Lokasi Kejadian</Text>
              <View className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <Text className="font-pmedium flex-1 text-[14px] leading-6 text-gray-800">
                  {complaint.location || 'Tidak ada lokasi'}
                </Text>
              </View>
            </View>

            {/* Description Section */}
            <View className="mb-5">
              <Text className="font-psemibold mb-2.5 text-[14px] text-gray-500">Deskripsi Laporan</Text>
              <View className="rounded-2xl border border-green-50 bg-green-50/30 p-4">
                <Text className="font-pregular text-[14px] leading-6 text-gray-800">
                  {complaint.description || 'Tidak ada deskripsi tersedia.'}
                </Text>
              </View>
            </View>

            {/* Images Proof Section */}
            <View className="mb-6">
              <Text className="font-psemibold mb-2.5 text-[14px] text-gray-500">Bukti Lampiran</Text>
              {complaint.images && complaint.images.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {complaint.images.map((img, index) => (
                    <View key={index} className="relative rounded-2xl overflow-hidden bg-gray-100">
                      <Image
                        source={{ uri: img }}
                        className="h-[180px] w-[260px]"
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View className="h-[140px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <AlertCircle size={28} color="#9CA3AF" />
                  <Text className="font-pmedium text-[13px] text-gray-400">
                    Tidak ada foto pendukung
                  </Text>
                </View>
              )}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              className="h-14 w-full items-center justify-center rounded-2xl bg-green-600 shadow-lg shadow-green-600/30"
            >
              <Text className="font-pbold text-[16px] text-white">Tutup Detail</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
