import { Redirect } from 'expo-router';

import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function Index() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <LoadingState message="Cargando TallerIQ..." />
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}