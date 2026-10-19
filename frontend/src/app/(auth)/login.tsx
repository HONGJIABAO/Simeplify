import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Leaf, LogIn } from 'lucide-react-native';
import { Button } from '@/components/Button';

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = () => {
    // TODO: Wire to Supabase Auth signInWithPassword. For now, go to Simulator.
    router.replace('/(tabs)/simulator' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Brand illustration placeholder */}
      <View style={styles.illustrationContainer}>
        <View style={styles.blobA} />
        <View style={styles.blobB} />
        <View style={styles.sproutCircle}>
          <Leaf size={32} color="#566549" strokeWidth={1.5} />
        </View>
      </View>

      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        Save energy, sort waste, grow your community.
      </Text>

      {/* Log in button */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          onPress={handleLogin}
          leftIcon={<LogIn size={18} color="#fafaf9" strokeWidth={1.5} />}
          style={styles.loginButton}
        >
          Log in
        </Button>

        <Text style={styles.placeholderNote}>
          Placeholder — full login form coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  illustrationContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  blobA: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f6e8d8', // tan-100
    left: 10,
    top: 10,
  },
  blobB: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#e0e6d9', // sage-100
    right: 10,
    bottom: 10,
  },
  sproutCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    zIndex: 1,
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 28,
    color: '#292524',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  loginButton: {
    width: '100%',
  },
  placeholderNote: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#a8a29e', // stone-400
    textAlign: 'center',
  },
});
