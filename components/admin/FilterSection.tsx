import React from 'react';
import { View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Search, X } from 'lucide-react-native';

interface FilterSectionProps {
  searchText: string;
  setSearchText: (text: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  filterStatus: string;
  onFilterChange: (status: string) => void;
}

export const FilterSection = ({
  searchText,
  setSearchText,
  onSearchSubmit,
  onSearchClear,
  sortBy,
  setSortBy,
  filterStatus,
  onFilterChange,
}: FilterSectionProps) => (
  <>
    {/* Search Bar */}
    <View className="mt-4 mb-6 px-6">
      <View className="flex-row items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-1">
        <Search size={18} color="#9CA3AF" />
        <TextInput
          placeholder="Cari pengaduan atau pelapor..."
          className="font-pmedium ml-2 h-10 flex-1 text-sm text-gray-900"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
        />
        {searchText !== '' && (
          <TouchableOpacity onPress={onSearchClear}>
            <X size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>

    {/* Sort Chips */}
    <View className="mb-3 flex-row items-center pl-6">
      <Text className="font-psemibold mr-3 text-[11px] uppercase text-gray-400">
        Urutan
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 24, gap: 8 }}>
        {['Terbaru', 'Terlama'].map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => setSortBy(option)}
            className={`rounded-full border px-5 py-2 ${
              sortBy === option
                ? 'border-green-600 bg-green-600'
                : 'border-gray-200 bg-white'
            }`}>
            <Text
              className={`font-psemibold text-xs ${
                sortBy === option ? 'text-white' : 'text-gray-600'
              }`}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>

    {/* Filter Chips */}
    <View className="mb-4 flex-row items-center pl-6">
      <Text className="font-psemibold mr-3 text-[11px] uppercase text-gray-400">
        Status
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 24, gap: 8 }}>
        {['Semua', 'Pending', 'Proses', 'Selesai'].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => onFilterChange(status)}
            className={`rounded-full border px-5 py-2 ${
              filterStatus === status
                ? 'border-green-600 bg-green-600'
                : 'border-gray-200 bg-white'
            }`}>
            <Text
              className={`font-psemibold text-xs ${
                filterStatus === status ? 'text-white' : 'text-gray-600'
              }`}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </>
);
