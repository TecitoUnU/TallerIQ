import { Redirect, Stack } from 'expo-router';

import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { colors } from '@/theme';

export default function AuthLayout() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor:
            colors.background,
        },
      }}
    />
  );
}