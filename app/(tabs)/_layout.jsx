import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#8994A5',
        tabBarStyle: { height: 68, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
  name="list"
  options={{
    title: "Lista",
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="list-outline" size={size} color={color} />
    ),
  }}
/>
      <Tabs.Screen
        name="history"
        options={{ title: 'Historial', tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
