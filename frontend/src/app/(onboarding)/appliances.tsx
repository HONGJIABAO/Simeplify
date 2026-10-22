/**
 * ONB-03 – Onboarding Step 3: Initial Rooms & Appliances Entry
 * Loads catalog from `public.appliance_types`, saves configured rooms to `public.rooms`,
 * saves appliances to `public.appliances`, and marks `profiles.onboarding_done = true`.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Tv,
  Wind,
  Flame,
  Wifi,
  Sparkles,
  Check,
  Star,
  Plus,
  Trash2,
  Home,
  CheckCircle2,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { useAuthSession } from '@/lib/authSession';
import { supabase } from '@/lib/supabase';
import type { RoomType } from '@/types/database';

interface ApplianceTypeCatalog {
  id: string;
  name: string;
  sprite_key: string;
  always_on: boolean;
  needs_person: boolean;
  has_star_rating: boolean;
  swap_eligible: boolean;
  in_tray: boolean;
  sort_order: number;
}

interface RoomRecord {
  id: string;
  floor: number;
  slot: string;
  type: RoomType | null;
  name: string | null;
  is_set_up: boolean;
}

interface SelectedAppliance {
  tempId: string;
  typeId: string;
  name: string;
  roomId: string;
  brand: string;
  wattage: number;
  starRating: number; // 1..5
  isNotSure: boolean;
  quantity: number;
}

const DEFAULT_WATTAGES: Record<string, number> = {
  air_conditioner: 1100,
  refrigerator: 150,
  lights: 18,
  fan: 55,
  tv: 90,
  water_heater: 3500,
  router: 15,
  workplace: 80,
  washing_machine: 500,
};

export default function OnboardingAppliancesScreen() {
  const router = useRouter();
  const { session, refresh } = useAuthSession();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [catalog, setCatalog] = useState<ApplianceTypeCatalog[]>([]);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);

  // Room setup toggles for the first 4 slots
  const [configuredRooms, setConfiguredRooms] = useState<
    { slotId: string; type: RoomType; name: string; active: boolean }[]
  >([]);

  // Selected appliances list
  const [appliancesList, setAppliancesList] = useState<SelectedAppliance[]>([]);
  const nextTempIdRef = useRef(1);

  useEffect(() => {
    async function loadData() {
      const householdId = session.profile?.household_id;
      if (!householdId) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Fetch catalog
        const { data: catData, error: catError } = await supabase
          .from('appliance_types')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });

        if (catError) throw catError;
        setCatalog(catData || []);

        // 2. Fetch instantiated rooms for this household
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('household_id', householdId)
          .order('floor', { ascending: true })
          .order('slot', { ascending: true });

        if (roomError) throw roomError;

        const allRooms: RoomRecord[] = roomData || [];
        setRooms(allRooms);

        // Pre-configure initial default room assignments across Floor 1 & 2
        // F1-A: Living Room, F1-B: Kitchen, F2-A: Master Bedroom, F2-B: Bathroom
        const initialSetup = [
          {
            slotId: allRooms.find((r) => r.floor === 1 && r.slot === 'A')?.id || '',
            type: 'living_room' as RoomType,
            name: 'Living Room',
            active: true,
          },
          {
            slotId: allRooms.find((r) => r.floor === 1 && r.slot === 'B')?.id || '',
            type: 'kitchen' as RoomType,
            name: 'Kitchen',
            active: true,
          },
          {
            slotId: allRooms.find((r) => r.floor === 2 && r.slot === 'A')?.id || '',
            type: 'bedroom' as RoomType,
            name: 'Master Bedroom',
            active: true,
          },
          {
            slotId: allRooms.find((r) => r.floor === 2 && r.slot === 'B')?.id || '',
            type: 'bathroom' as RoomType,
            name: 'Bathroom',
            active: true,
          },
        ].filter((r) => Boolean(r.slotId));

        setConfiguredRooms(initialSetup);

        // Pre-populate recommended default starter appliances
        const livingRoomId = initialSetup.find((r) => r.type === 'living_room')?.slotId || '';
        const bedroomId = initialSetup.find((r) => r.type === 'bedroom')?.slotId || '';
        const kitchenId = initialSetup.find((r) => r.type === 'kitchen')?.slotId || '';

        const defaultStarters: SelectedAppliance[] = [
          {
            tempId: 'starter-ac',
            typeId: 'air_conditioner',
            name: 'Air Conditioner',
            roomId: bedroomId || livingRoomId,
            brand: 'Panasonic',
            wattage: DEFAULT_WATTAGES['air_conditioner'] || 1100,
            starRating: 3,
            isNotSure: false,
            quantity: 1,
          },
          {
            tempId: 'starter-fridge',
            typeId: 'refrigerator',
            name: 'Refrigerator',
            roomId: kitchenId || livingRoomId,
            brand: 'Samsung',
            wattage: DEFAULT_WATTAGES['refrigerator'] || 150,
            starRating: 4,
            isNotSure: false,
            quantity: 1,
          },
          {
            tempId: 'starter-lights',
            typeId: 'lights',
            name: 'LED Lights',
            roomId: livingRoomId,
            brand: 'Philips',
            wattage: DEFAULT_WATTAGES['lights'] || 18,
            starRating: 5,
            isNotSure: false,
            quantity: 1,
          },
        ];

        setAppliancesList(defaultStarters);
      } catch (err: any) {
        console.error('Failed to load catalog or rooms:', err);
        showToast(err?.message || 'Error loading appliances.', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [session.profile?.household_id]);

  const activeRooms = configuredRooms.filter((r) => r.active && r.slotId);

  const handleAddAppliance = (type: ApplianceTypeCatalog) => {
    const targetRoomId = activeRooms[0]?.slotId || rooms[0]?.id || '';
    const newAppliance: SelectedAppliance = {
      tempId: `app-${type.id}-${nextTempIdRef.current++}`,
      typeId: type.id,
      name: type.name,
      roomId: targetRoomId,
      brand: '',
      wattage: DEFAULT_WATTAGES[type.id] || 100,
      starRating: 3,
      isNotSure: false,
      quantity: 1,
    };
    setAppliancesList([...appliancesList, newAppliance]);
    showToast(`Added ${type.name}`, 'info');
  };

  const handleRemoveAppliance = (tempId: string) => {
    setAppliancesList(appliancesList.filter((a) => a.tempId !== tempId));
  };

  const handleUpdateAppliance = (tempId: string, updates: Partial<SelectedAppliance>) => {
    setAppliancesList(
      appliancesList.map((a) => (a.tempId === tempId ? { ...a, ...updates } : a))
    );
  };

  const handleFinish = async () => {
    const householdId = session.profile?.household_id;
    if (!householdId || !session.user) {
      showToast('Session missing. Please log in again.', 'error');
      router.replace('/(auth)/login');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update configured rooms in public.rooms
      for (const roomConfig of configuredRooms) {
        if (roomConfig.active && roomConfig.slotId) {
          const { error: roomUpdErr } = await supabase
            .from('rooms')
            .update({
              is_set_up: true,
              type: roomConfig.type,
              name: roomConfig.name,
            })
            .eq('id', roomConfig.slotId);

          if (roomUpdErr) throw roomUpdErr;
        }
      }

      // 2. Insert appliances into public.appliances
      if (appliancesList.length > 0) {
        const fallbackRoomId = activeRooms[0]?.slotId || rooms[0]?.id;
        const rowsToInsert = appliancesList.map((app) => {
          // Rule: If user picks "Not sure", treat as 3 stars
          const finalStarRating = app.isNotSure ? 3 : app.starRating;
          return {
            household_id: householdId,
            room_id: app.roomId || fallbackRoomId,
            type: app.typeId,
            brand: app.brand.trim() || null,
            model: null,
            wattage: Math.max(1, app.wattage || 100),
            star_rating: finalStarRating,
            quantity: Math.max(1, app.quantity || 1),
          };
        });

        const { error: appError } = await supabase.from('appliances').insert(rowsToInsert);
        if (appError) throw appError;
      }

      // 3. Mark profiles.onboarding_done = true
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_done: true,
          onboarding_step: 3,
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      await refresh();
      showToast('Setup complete! Welcome to your EcoTwin simulator.', 'success');

      // Navigate to the main simulator tab
      router.replace('/(tabs)/simulator');
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      showToast(err?.message || 'Failed to complete setup.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#566549" />
        <Text style={styles.loadingText}>Loading appliance catalog...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress dots at top */}
          <View style={styles.progressRow}>
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
          </View>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.stepBadge}>Step 3 of 3</Text>
            <Text style={styles.title}>Rooms & Appliances</Text>
            <Text style={styles.subtitle}>
              Configure your primary rooms and pick your high-usage equipment to power the digital twin simulator.
            </Text>
          </View>

          {/* Room Setup Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Home size={18} color="#566549" strokeWidth={1.75} />
              <Text style={styles.cardTitle}>Configured Home Rooms</Text>
            </View>
            <Text style={styles.cardDesc}>
              Tap to include or rename the rooms in your 2-floor layout.
            </Text>

            <View style={styles.roomChipsRow}>
              {configuredRooms.map((r, i) => (
                <Pressable
                  key={r.slotId || i}
                  onPress={() => {
                    setConfiguredRooms(
                      configuredRooms.map((item, idx) =>
                        idx === i ? { ...item, active: !item.active } : item
                      )
                    );
                  }}
                  style={[styles.roomChip, r.active && styles.roomChipActive]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.roomChipText,
                      r.active && styles.roomChipTextActive,
                    ]}
                  >
                    {r.name}
                  </Text>
                  {r.active && <Check size={14} color="#34402b" strokeWidth={2.2} />}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Appliance Catalog Tray */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Sparkles size={18} color="#566549" strokeWidth={1.75} />
              <Text style={styles.cardTitle}>Add Equipment</Text>
            </View>
            <Text style={styles.cardDesc}>
              Tap an appliance from the standard catalog to add it to your home.
            </Text>

            <View style={styles.catalogGrid}>
              {catalog.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleAddAppliance(item)}
                  style={({ pressed }) => [
                    styles.catalogItem,
                    pressed && styles.catalogItemPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name}`}
                >
                  <Plus size={16} color="#566549" strokeWidth={2} />
                  <Text style={styles.catalogItemText} numberOfLines={1}>
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Added Appliances List */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <CheckCircle2 size={18} color="#566549" strokeWidth={1.75} />
              <Text style={styles.cardTitle}>
                Selected Equipment ({appliancesList.length})
              </Text>
            </View>

            {appliancesList.length === 0 ? (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  No equipment added yet. Tap items from the catalog above!
                </Text>
              </View>
            ) : (
              appliancesList.map((app) => (
                <View key={app.tempId} style={styles.applianceItem}>
                  <View style={styles.applianceHeader}>
                    <Text style={styles.applianceName}>{app.name}</Text>
                    <Pressable
                      onPress={() => handleRemoveAppliance(app.tempId)}
                      style={styles.deleteAppBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Remove appliance"
                    >
                      <Trash2 size={16} color="#a8442f" strokeWidth={1.75} />
                    </Pressable>
                  </View>

                  {/* Room assignment & Wattage row */}
                  <View style={styles.applianceDetailsRow}>
                    <View style={styles.fieldCol}>
                      <Text style={styles.smallLabel}>Room</Text>
                      <View style={styles.roomSelectPill}>
                        <Text style={styles.roomSelectText} numberOfLines={1}>
                          {activeRooms.find((r) => r.slotId === app.roomId)?.name || 'First room'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.fieldCol}>
                      <Text style={styles.smallLabel}>Power (Watts)</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={String(app.wattage || '')}
                        onChangeText={(val) =>
                          handleUpdateAppliance(app.tempId, {
                            wattage: parseInt(val, 10) || 0,
                          })
                        }
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.fieldCol}>
                      <Text style={styles.smallLabel}>Brand</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={app.brand}
                        onChangeText={(val) =>
                          handleUpdateAppliance(app.tempId, { brand: val })
                        }
                        placeholder="Optional"
                        placeholderTextColor="#a8a29e"
                      />
                    </View>
                  </View>

                  {/* Star Rating picker */}
                  <View style={styles.starRow}>
                    <Text style={styles.smallLabel}>Energy Star Rating:</Text>
                    <View style={styles.starsGroup}>
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = !app.isNotSure && starVal <= app.starRating;
                        return (
                          <Pressable
                            key={starVal}
                            onPress={() =>
                              handleUpdateAppliance(app.tempId, {
                                starRating: starVal,
                                isNotSure: false,
                              })
                            }
                            style={styles.starTouch}
                          >
                            <Star
                              size={18}
                              color={isFilled ? '#e6c39b' : '#d6d3d1'}
                              fill={isFilled ? '#e6c39b' : 'transparent'}
                              strokeWidth={1.5}
                            />
                          </Pressable>
                        );
                      })}

                      {/* Not Sure Pill */}
                      <Pressable
                        onPress={() =>
                          handleUpdateAppliance(app.tempId, {
                            isNotSure: !app.isNotSure,
                            starRating: 3,
                          })
                        }
                        style={[
                          styles.notSurePill,
                          app.isNotSure && styles.notSurePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.notSureText,
                            app.isNotSure && styles.notSureTextActive,
                          ]}
                        >
                          Not sure (3★)
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(onboarding)/schedule');
                }
              }}
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>

            <Button
              variant="primary"
              onPress={handleFinish}
              disabled={isSubmitting}
              style={styles.nextButton}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fafaf9" />
              ) : (
                'Finish & Launch Simulator 🚀'
              )}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#faf6f1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#78716c',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d6d3d1',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#566549',
  },
  headerBlock: {
    marginBottom: 20,
  },
  stepBadge: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#566549',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
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
    lineHeight: 22,
    color: '#57534e',
  },
  card: {
    backgroundColor: '#faf6f1',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#292524',
  },
  cardDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
    marginBottom: 14,
  },
  roomChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roomChipActive: {
    backgroundColor: '#e7ecd8',
    borderColor: '#a3b782',
  },
  roomChipText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
  },
  roomChipTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#34402b',
  },
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catalogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catalogItemPressed: {
    backgroundColor: '#ede7df',
  },
  catalogItemText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
  },
  emptyList: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyListText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#78716c',
    fontStyle: 'italic',
  },
  applianceItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    padding: 14,
    marginBottom: 12,
  },
  applianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  applianceName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#292524',
  },
  deleteAppBtn: {
    padding: 6,
  },
  applianceDetailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  fieldCol: {
    flex: 1,
  },
  smallLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#78716c',
    marginBottom: 3,
  },
  roomSelectPill: {
    backgroundColor: '#f5f5f4',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    justifyContent: 'center',
  },
  roomSelectText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#292524',
  },
  smallInput: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#292524',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
  },
  starsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starTouch: {
    padding: 3,
  },
  notSurePill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f4',
  },
  notSurePillActive: {
    backgroundColor: '#e7ecd8',
  },
  notSureText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#78716c',
  },
  notSureTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#34402b',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#78716c',
  },
  nextButton: {
    flex: 1,
  },
});
