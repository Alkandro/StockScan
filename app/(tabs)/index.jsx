import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import {
  getProducts,
  getProductsCount,
  isAdminUser,
} from "../../services/productService";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [productsCount, setProductsCount] = useState(null);
  const [countFailed, setCountFailed] = useState(false);
  const [products, setProducts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const uid = user?.uid;

  const rawName =
    user?.email?.split("@")[0] || t("home.user");

  const displayName =
    rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const languages = [
    {
      code: "es",
      flag: "🇦🇷",
    },
    {
      code: "pt",
      flag: "🇧🇷",
    },
    {
      code: "ja",
      flag: "🇯🇵",
    },
    {
      code: "en",
      flag: "🇺🇸",
    },
  ];

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    setLanguageOpen(false);
  };

  const load = useCallback(async () => {
    if (!uid) return;

    const loadCount = async () => {
      try {
        const total = await getProductsCount();

        if (total !== null) {
          setProductsCount(total);
          setCountFailed(false);
        }
      } catch (error) {
        console.error(
          t("home.errors.countProducts"),
          error,
        );
        setCountFailed(true);
      }
    };

    const loadList = async () => {
      setProducts(await getProducts());
    };

    const loadRole = async () => {
      setIsAdmin(await isAdminUser());
    };

    await Promise.all([
      loadCount(),
      loadList(),
      loadRole(),
    ]);
  }, [uid, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();

      router.replace("/login");
    } catch (error) {
      console.error(
        t("home.errors.logout"),
        error,
      );

      Alert.alert(
        t("common.error"),
        t("home.errors.logoutMessage"),
      );

      setLoggingOut(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matches = products.filter((p) => {
      if (!term) return true;

      return (
        String(p.name || "")
          .toLowerCase()
          .includes(term) ||
        String(p.productNumber || "")
          .toLowerCase()
          .includes(term)
      );
    });

    return matches.sort((a, b) => {
      const nameA = String(a.name || "");
      const nameB = String(b.name || "");

      if (nameA && !nameB) return -1;
      if (!nameA && nameB) return 1;

      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
      });
    });
  }, [products, search]);

  const countLabel = countFailed
    ? "—"
    : productsCount === null
      ? "..."
      : productsCount;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 4,
        },
      ]}
    >
      {/* Parte fija: no se desplaza */}
      <View>
        <View style={styles.topBar}>
          <View style={styles.topSide} />

          <Text style={styles.brand}>
            Stock
            <Text style={{ color: COLORS.primary }}>
              Scan
            </Text>
          </Text>

          <View
            style={[
              styles.topSide,
              styles.headerActions,
            ]}
          >
            <Pressable
              onPress={() =>
                router.push("/change-password")
              }
              hitSlop={10}
            >
              <Ionicons
                name="key-outline"
                size={24}
                color={COLORS.text}
              />
            </Pressable>

            <Pressable
              onPress={handleLogout}
              disabled={loggingOut}
              hitSlop={10}
              style={
                loggingOut && styles.disabled
              }
            >
              <Ionicons
                name="log-out-outline"
                size={24}
                color={COLORS.text}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.greetingRow}>
          <Text
            style={styles.greeting}
            numberOfLines={1}
          >
            {t("home.greeting", {
              name: displayName,
            })}{" "}
            👋
          </Text>

          {isAdmin && (
            <View style={styles.adminChip}>
              <Text style={styles.adminChipText}>
                {t("home.admin")}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={styles.subtitle}
          numberOfLines={1}
        >
          {t("home.subtitle")}
        </Text>

        <Pressable
          style={styles.scanButton}
          onPress={() => router.push("/scan")}
        >
          <Ionicons
            name="scan-outline"
            size={28}
            color="#FFF"
          />

          <Text style={styles.scanTitle}>
            {t("home.scanButton")}
          </Text>

          <Text style={styles.scanSubtitle}>
            {t("home.scanButtonSubtitle")}
          </Text>
        </Pressable>

        <Stat
          title={t("home.registeredProducts")}
          value={countLabel}
          icon="cube-outline"
        />

        <Text style={styles.sectionTitle}>
          {t("home.productsSection")}
        </Text>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.muted}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t(
              "home.searchPlaceholder",
            )}
            autoCorrect={false}
            style={styles.search}
          />
        </View>
      </View>

      {/* Solo esta lista se desplaza */}
      <FlatList
        style={styles.list}
        contentContainerStyle={
          styles.listContent
        }
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
        renderItem={({ item }) => {
          const isDraft =
            item.status === "draft";

          return (
            <Pressable
              style={styles.row}
              disabled={!isAdmin}
              onPress={() =>
                router.push({
                  pathname: "/product-form",
                  params: { id: item.id },
                })
              }
            >
              <View style={styles.icon}>
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>

              <Text
                style={[
                  styles.rowTitle,
                  !item.name &&
                    styles.rowTitleMuted,
                ]}
                numberOfLines={2}
              >
                {item.name ||
                  t("home.noDescription")}
              </Text>

              {isDraft && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {t("home.draft")}
                  </Text>
                </View>
              )}

              {isAdmin && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#A1A9B5"
                />
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search
              ? t("home.noProductsFound")
              : t("home.noProducts")}
          </Text>
        }
      />

      {/* SELECTOR DE IDIOMA FLOTANTE */}
      {languageOpen && (
        <View
          style={[
            styles.languageMenu,
            {
              bottom: insets.bottom + 74,
            },
          ]}
        >
          {languages.map((language) => {
            const isActive =
              i18n.language
                ?.toLowerCase()
                .startsWith(language.code);

            return (
              <Pressable
                key={language.code}
                onPress={() =>
                  changeLanguage(
                    language.code,
                  )
                }
                style={[
                  styles.languageOption,
                  isActive &&
                    styles.languageOptionActive,
                ]}
              >
                <Text style={styles.languageFlag}>
                  {language.flag}
                </Text>

                {isActive && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={COLORS.primary}
                    style={styles.checkIcon}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Botón flotante */}
      <Pressable
        onPress={() =>
          setLanguageOpen(
            (previous) => !previous,
          )
        }
        style={[
          styles.languageFloatingButton,
          {
            bottom: insets.bottom + 16,
          },
        ]}
      >
        {languageOpen ? (
          <Ionicons
            name="close"
            size={24}
            color={COLORS.primary}
          />
        ) : (
          <Text style={styles.currentLanguageFlag}>
            {languages.find((language) =>
              i18n.language
                ?.toLowerCase()
                .startsWith(language.code),
            )?.flag || "🌐"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function Stat({ title, value, icon }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statRow}>
        <Ionicons
          name={icon}
          size={22}
          color={COLORS.primary}
        />

        <Text style={styles.statValue}>
          {value}
        </Text>
      </View>

      <Text style={styles.statTitle}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  topSide: {
    width: 66,
  },

  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 18,
  },

  disabled: {
    opacity: 0.5,
  },

  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },

  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  greeting: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  adminChip: {
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },

  adminChipText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },

  scanButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },

  scanTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },

  scanSubtitle: {
    color: "#DCEBFF",
    fontSize: 12,
    marginTop: 1,
  },

  stat: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginLeft: 8,
  },

  statTitle: {
    fontSize: 12,
    color: COLORS.muted,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },

  searchBox: {
    height: 42,
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  search: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 90,
  },

  row: {
    backgroundColor: "#FFF",
    minHeight: 52,
    borderRadius: 14,
    marginBottom: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  rowTitleMuted: {
    color: "#98A2B3",
    fontStyle: "italic",
    fontWeight: "600",
  },

  chip: {
    backgroundColor: "#FEF0C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginHorizontal: 8,
  },

  chipText: {
    color: "#B54708",
    fontSize: 10,
    fontWeight: "800",
  },

  empty: {
    textAlign: "center",
    color: COLORS.muted,
    marginTop: 20,
  },

  // SELECTOR DE IDIOMA
  languageFloatingButton: {
    position: "absolute",
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },

  currentLanguageFlag: {
    fontSize: 28,
    lineHeight: 34,
  },

  languageMenu: {
    position: "absolute",
    right: 18,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "flex-end", // Permite que el contenedor se ajuste solo a su contenido
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },

  languageOption: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  languageOptionActive: {
    backgroundColor: "#EAF3FF",
  },

  languageFlag: {
    fontSize: 24,
  },

  checkIcon: {
    marginLeft: 6,
  },
});