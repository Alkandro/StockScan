import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { COLORS } from '../constants/theme';

export function Logo({ dark = false }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Ionicons name="scan-outline" size={54} color={COLORS.primary} />
      <Text style={{ fontSize: 34, fontWeight: '800', color: dark ? '#FFF' : COLORS.text }}>
        Stock<Text style={{ color: COLORS.primary }}>Scan</Text>
      </Text>
      <Text style={{ color: dark ? '#AAB4C2' : COLORS.muted, marginTop: 4 }}>
        Escaneá · Registrá · Controlá
      </Text>
    </View>
  );
}
