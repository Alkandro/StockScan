
import "../i18n";
import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { View, StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: {
              backgroundColor: "#020817",
            },
          }}
        />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020817",
  },
});
