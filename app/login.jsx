import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS } from '../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Datos incompletos', 'Ingresá tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('No se pudo iniciar sesión', 'Revisá el correo y la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Logo dark />

        <View style={styles.form}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            placeholderTextColor="#91A0B2"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="#91A0B2"
            secureTextEntry
            style={styles.input}
          />

          <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Iniciar sesión'}</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Powered by Alejandro Sklar</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  inner: { flex: 1, justifyContent: 'center', padding: 26 },
  form: { marginTop: 42, gap: 14 },
  input: {
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#344457',
    backgroundColor: '#122033',
    color: '#FFF',
    paddingHorizontal: 18,
    fontSize: 15,
  },
  button: {
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', color: '#728198', marginTop: 45 },
});
