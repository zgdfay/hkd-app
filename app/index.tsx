import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { LogIn, MessageSquarePlus, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { getCurrentSession } from '@/services/auth';

const LOGO_SOURCE = require('../assets/logo/logo-kidul-dalem-app.png');

export default function Home() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      if ((await AsyncStorage.getItem('hasSeenOnboarding')) !== 'true') {
        router.replace('/welcome');
      } else {
        // Auto-login session restoration — only if Supabase session is still valid
        try {
          const cachedUser = await AsyncStorage.getItem('user');
          if (cachedUser) {
            const session = await getCurrentSession();
            
            if (session) {
              // Session is valid — auto-redirect to dashboard
              const user = JSON.parse(cachedUser);
              if (user?.role === 'admin') {
                router.replace('/admin/dashboard');
                return;
              } else if (user?.role === 'lurah') {
                router.replace('/lurah/dashboard');
                return;
              }
            } else {
              // Session expired — clear stale cache
              await AsyncStorage.removeItem('user');
            }
          }
        } catch (error) {
          await AsyncStorage.removeItem('user');
        }
        setIsReady(true);
      }
    })();
  }, []);

  if (!isReady) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center px-6">
        {/* Main Content Container */}
        <View className="w-full items-center">
          <Image
            source={LOGO_SOURCE}
            style={{ width: 180, height: 180 }}
            resizeMode="contain"
            className="mb-6 mt-8"
          />
          <Text className="font-pbold text-center text-xl font-black tracking-widest text-green-600">
            HALO KIDUL DALEM
          </Text>
          <Text className="font-pregular mb-12 px-8 text-center text-[15px] leading-6 text-gray-500">
            Satu Aplikasi, Berbagai Solusi Layanan Masyarakat
          </Text>

          <View className="w-full gap-3.5">
            {/* Masuk Ke Akun */}
            <TouchableOpacity
              className="h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-green-600 shadow-md"
              activeOpacity={0.8}
              onPress={() => router.push('/login')}>
              <LogIn size={20} color="#FFF" strokeWidth={2.5} />
              <Text className="font-pbold text-base text-white">Masuk Ke Akun</Text>
            </TouchableOpacity>

            {/* Buat Pengaduan (Tanpa Login) */}
            <TouchableOpacity
              className="h-14 flex-row items-center justify-center gap-3 rounded-2xl border-2 border-green-600 bg-green-50"
              activeOpacity={0.8}
              onPress={() => router.push('/pengaduan')}>
              <MessageSquarePlus size={20} color="#16A34A" strokeWidth={2.5} />
              <Text className="font-pbold text-base text-green-600">Buat Pengaduan</Text>
            </TouchableOpacity>

            {/* Lacak Pengaduan */}
            <TouchableOpacity
              onPress={() => router.push('/lacak-pengaduan' as any)}
              className="h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-50"
              activeOpacity={0.8}>
              <Search size={20} color="#666" strokeWidth={2.5} />
              <Text className="font-psemibold text-base text-gray-600">Lacak Pengaduan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
