import OnboardingScreen from '@/components/features/onboarding/OnboardingScreen';
import { Stack } from 'expo-router';

export default function Welcome() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingScreen />
    </>
  );
}
