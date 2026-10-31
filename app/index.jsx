
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";

const SPLASH_DURATION = 8200;
const PULSE_DURATION = 1800;
const PULSE_PAUSE = 300;

export default function Index() {
  const { user, loading } = useAuth();

  const pulse = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());
  const hasNavigated = useRef(false);

  // Animación de dos latidos
  useEffect(() => {
    const pulseAnimation = Animated.sequence([
      // Primer latido
      Animated.timing(pulse, {
        toValue: 0.35,
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),

      // Pausa entre latidos
      Animated.delay(PULSE_PAUSE),

      // Segundo latido
      Animated.timing(pulse, {
        toValue: 0.35,
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [pulse]);

  // Navegación después del splash
  useEffect(() => {
    if (loading || hasNavigated.current) return;

    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, SPLASH_DURATION - elapsed);

    const timer = setTimeout(() => {
      if (hasNavigated.current) return;

      hasNavigated.current = true;
      router.replace(user ? "/(tabs)" : "/login");
    }, remaining);

    return () => clearTimeout(timer);
  }, [loading, user]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.imageContainer,
          { opacity: pulse },
        ]}
      >
        <Image
          source={require("../assets/splash.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020817",
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
