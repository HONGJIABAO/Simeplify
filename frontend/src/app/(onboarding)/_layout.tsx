import { Stack, Redirect } from 'expo-router';
import { useAuthSession } from '@/lib/authSession';

export default function OnboardingLayout() {
  const { session } = useAuthSession();

  if (!session.isLoggedIn || !session.user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#faf6f1' },
      }}
    />
  );
}
