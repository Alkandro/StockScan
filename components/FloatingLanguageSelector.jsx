import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS } from "../constants/theme";

const STORAGE_KEY = "stockscan:languageButton:v1";

const BUTTON_SIZE = 52;
const MARGIN = 8;
const DRAG_THRESHOLD = 6;

const MENU_WIDTH = 76;
const MENU_ITEM_HEIGHT = 44;
const MENU_PADDING = 6;
const MENU_GAP = 8;

const LANGUAGES = [
  { code: "es", flag: "🇦🇷" },
  { code: "pt", flag: "🇧🇷" },
  { code: "ja", flag: "🇯🇵" },
  { code: "en", flag: "🇺🇸" },
];

const MENU_HEIGHT = LANGUAGES.length * MENU_ITEM_HEIGHT + MENU_PADDING * 2;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// La posición se guarda como proporción (0 a 1) del espacio disponible,
// así sigue en un lugar parecido si cambia el tamaño de la pantalla
function ratioToPosition(ratio, bounds) {
  return {
    x: bounds.minX + ratio.fx * (bounds.maxX - bounds.minX),
    y: bounds.minY + ratio.fy * (bounds.maxY - bounds.minY),
  };
}

function positionToRatio(position, bounds) {
  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;

  return {
    fx: rangeX > 0 ? clamp((position.x - bounds.minX) / rangeX, 0, 1) : 1,
    fy: rangeY > 0 ? clamp((position.y - bounds.minY) / rangeY, 0, 1) : 1,
  };
}

/**
 * Botón de idioma flotante: se arrastra con el dedo a cualquier lugar
 * y al tocarlo abre las banderas. Recuerda dónde lo dejaste.
 * Se coloca como último hijo de una pantalla (ocupa todo el espacio de su contenedor).
 */
export default function FloatingLanguageSelector() {
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const [layout, setLayout] = useState(null);
  // Por defecto, abajo a la derecha
  const [ratio, setRatio] = useState({ fx: 1, fy: 1 });
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;
  const posRef = useRef({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const boundsRef = useRef(null);

  // Límites dentro de los que se puede mover el botón
  const bounds = useMemo(() => {
    if (!layout) return null;

    const minY = insets.top + MARGIN;

    return {
      minX: MARGIN,
      maxX: Math.max(MARGIN, layout.width - BUTTON_SIZE - MARGIN),
      minY,
      maxY: Math.max(minY, layout.height - BUTTON_SIZE - MARGIN),
    };
  }, [layout, insets.top]);

  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  // Recupera el lugar donde el usuario dejó el botón la última vez
  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;

        try {
          const saved = JSON.parse(raw);

          if (typeof saved.fx === "number" && typeof saved.fy === "number") {
            setRatio({
              fx: clamp(saved.fx, 0, 1),
              fy: clamp(saved.fy, 0, 1),
            });
          }
        } catch {
          // Dato dañado: se usa la posición por defecto
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const position = useMemo(
    () => (bounds ? ratioToPosition(ratio, bounds) : null),
    [ratio, bounds],
  );

  // Mantiene la animación en la posición calculada
  useEffect(() => {
    if (!position) return;

    posRef.current = position;
    pan.setValue(position);
  }, [position, pan]);

  // Guarda dónde quedó el botón al soltarlo
  const commit = useCallback(() => {
    if (!boundsRef.current) return;

    const next = positionToRatio(posRef.current, boundsRef.current);

    setRatio(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        startRef.current = { ...posRef.current };
        movedRef.current = false;
      },

      onPanResponderMove: (_, gesture) => {
        const exceeded =
          Math.abs(gesture.dx) > DRAG_THRESHOLD ||
          Math.abs(gesture.dy) > DRAG_THRESHOLD;

        if (!movedRef.current && !exceeded) return;

        // Primer movimiento: es un arrastre, no un toque
        if (!movedRef.current) {
          movedRef.current = true;
          setDragging(true);
          setOpen(false);
        }

        const limits = boundsRef.current;
        if (!limits) return;

        const next = {
          x: clamp(startRef.current.x + gesture.dx, limits.minX, limits.maxX),
          y: clamp(startRef.current.y + gesture.dy, limits.minY, limits.maxY),
        };

        posRef.current = next;
        pan.setValue(next);
      },

      onPanResponderRelease: () => {
        if (movedRef.current) {
          setDragging(false);
          commit();
        } else {
          // Sin movimiento: es un toque
          setOpen((previous) => !previous);
        }
      },

      onPanResponderTerminate: () => {
        if (movedRef.current) {
          setDragging(false);
          commit();
        }
      },
    }),
  ).current;

  const selectLanguage = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  // El menú se abre hacia donde haya más espacio
  const menuStyle = useMemo(() => {
    if (!position || !layout) return null;

    const above = position.y + BUTTON_SIZE / 2 > layout.height / 2;

    const top = above
      ? position.y - MENU_HEIGHT - MENU_GAP
      : position.y + BUTTON_SIZE + MENU_GAP;

    const left = clamp(
      position.x + BUTTON_SIZE / 2 - MENU_WIDTH / 2,
      MARGIN,
      Math.max(MARGIN, layout.width - MENU_WIDTH - MARGIN),
    );

    return { top: Math.max(MARGIN, top), left };
  }, [position, layout]);

  const currentFlag =
    LANGUAGES.find((language) =>
      i18n.language?.toLowerCase().startsWith(language.code),
    )?.flag || "🌐";

  const visible = ready && position !== null;

  return (
    <View
      style={styles.overlay}
      pointerEvents="box-none"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;

        setLayout((previous) =>
          previous && previous.width === width && previous.height === height
            ? previous
            : { width, height },
        );
      }}
    >
      {visible && open && (
        <>
          {/* Toque fuera del menú: lo cierra */}
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

          <View style={[styles.menu, menuStyle]}>
            {LANGUAGES.map((language) => {
              const isActive = i18n.language
                ?.toLowerCase()
                .startsWith(language.code);

              return (
                <Pressable
                  key={language.code}
                  onPress={() => selectLanguage(language.code)}
                  style={[styles.option, isActive && styles.optionActive]}
                >
                  <Text style={styles.flag}>{language.flag}</Text>

                  {isActive && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={COLORS.primary}
                      style={styles.check}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {visible && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.button,
            dragging && styles.buttonDragging,
            {
              transform: [
                ...pan.getTranslateTransform(),
                { scale: dragging ? 1.12 : 1 },
              ],
            },
          ]}
        >
          {open ? (
            <Ionicons name="close" size={24} color={COLORS.primary} />
          ) : (
            <Text style={styles.currentFlag}>{currentFlag}</Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  button: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },

  buttonDragging: {
    elevation: 12,
    shadowOpacity: 0.35,
    shadowRadius: 9,
  },

  currentFlag: {
    fontSize: 28,
    lineHeight: 34,
  },

  menu: {
    position: "absolute",
    width: MENU_WIDTH,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: MENU_PADDING,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },

  option: {
    height: MENU_ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  optionActive: {
    backgroundColor: "#EAF3FF",
  },

  flag: {
    fontSize: 24,
  },

  check: {
    marginLeft: 6,
  },
});