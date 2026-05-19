import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { Text } from '@/components/ui/text';
import LoadingScreen from '@/components/shared/LoadingScreen';

import { signInWithEmail } from '@/services/auth';
import { registerForPushNotificationsAsync } from '@/services/push-notifications';
import { savePushToken } from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGO_SOURCE = require('../assets/logo/logo-kidul-dalem-app.png');

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Peringatan', 'Email dan password harus diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await signInWithEmail(email.trim(), password);

      // Store user data for session persistence
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Register for push notifications and save token for this user
      try {
        const pushToken = await registerForPushNotificationsAsync();
        // Also explicitly save with the user we just logged in as (belt-and-suspenders)
        if (pushToken && user.id) {
          await savePushToken(user.id, pushToken, {
            platform: Platform.OS,
          });
        }
      } catch (pushError) {
        // silent fail
      }

      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (user.role === 'lurah') {
        router.replace('/lurah/dashboard');
      } else {
        router.replace('/');
      }
    } catch (error) {
      const message = (error as Error).message || 'Login gagal. Silakan coba lagi.';
      Alert.alert('Gagal', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView 
      style={{ flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0 }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}>
          {/* Back Button */}
          <TouchableOpacity
            className="mt-5 h-11 w-11 items-center justify-center rounded-xl bg-gray-50"
            onPress={() => router.replace('/')}
            activeOpacity={0.7}>
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8 mt-6 items-center">
            <Image
              source={LOGO_SOURCE}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
              className="mb-4"
            />
            <Text className="font-pbold text-2xl text-gray-900">Selamat Datang</Text>
            <Text className="font-pregular mt-2 px-5 text-center text-sm leading-5 text-gray-500">
              Silakan masuk ke akun Anda untuk melanjutkan layanan
            </Text>
          </View>

          {/* Form */}
          <View className="gap-5">
            {/* Email Input */}
            <View className="gap-2">
              <Text className="font-pmedium ml-1 text-sm text-gray-700">Email</Text>
              <View className="h-14 flex-row items-center rounded-2xl bg-gray-100 px-4">
                <Mail size={20} color="#9CA3AF" />
                <TextInput
                  className="font-pregular ml-3 h-full flex-1 text-[15px] text-gray-900"
                  placeholder="Masukkan email atau username"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="gap-2">
              <Text className="font-pmedium ml-1 text-sm text-gray-700">Password</Text>
              <View className="h-14 flex-row items-center rounded-2xl bg-gray-100 px-4">
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  className="font-pregular ml-3 h-full flex-1 text-[15px] text-gray-900"
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              className="mt-2 h-14 items-center justify-center rounded-2xl bg-green-600 shadow-md"
              onPress={handleLogin}
              activeOpacity={0.8}>
              <Text className="font-pbold text-base text-white">Masuk</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}