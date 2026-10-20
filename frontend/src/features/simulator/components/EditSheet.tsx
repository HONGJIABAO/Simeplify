import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { ChevronDown, ChevronUp, PackageOpen } from 'lucide-react-native';
import { APPLIANCE_SPRITES, FURNITURE_SPRITES, SpriteItemDef } from '../logic/spriteMap';
import { Sprite } from './Sprite';

interface EditSheetProps {
  visible: boolean;
  onItemPointerDown: (item: SpriteItemDef, clientX: number, clientY: number) => void;
  onItemDragMove?: (item: SpriteItemDef, clientX: number, clientY: number) => void;
  onItemDragEnd?: (item: SpriteItemDef, clientX: number, clientY: number) => void;
  onItemTap: (item: SpriteItemDef) => void;
  selectedPendingKey?: string | null;
  isDragging?: boolean;
  initialCollapsed?: boolean;
}

export function EditSheet({
  visible,
  onItemPointerDown,
  onItemDragMove,
  onItemDragEnd,
  onItemTap,
  selectedPendingKey,
  isDragging = false,
  initialCollapsed = false,
}: EditSheetProps) {
  const [activeTab, setActiveTab] = useState<'Appliances' | 'Furniture'>('Appliances');
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [opacity] = useState(() => new Animated.Value(1));
  const nativeDraggedKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      Animated.timing(opacity, {
        toValue: isDragging ? 0.3 : 1,
        duration: reduced ? 0 : 400,
        useNativeDriver: true,
      }).start();
    });
    return () => { active = false; };
  }, [isDragging, opacity]);

  if (!visible) return null;

  const currentItems = (activeTab === 'Appliances' ? APPLIANCE_SPRITES : FURNITURE_SPRITES)
    .filter((item) => item.inTray);

  return (
    <Animated.View style={[styles.sheetContainer, collapsed && styles.sheetCollapsed, { opacity }]}>
      <Pressable
        onPress={() => setCollapsed((value) => !value)}
        style={styles.handleButton}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        accessibilityLabel={collapsed ? 'Show item tray' : 'Collapse item tray'}
      >
        {collapsed ? <ChevronUp size={18} color="#57534E" /> : <ChevronDown size={18} color="#57534E" />}
        <View style={styles.handle} />
        <Text style={styles.handleText}>{collapsed ? 'Show item tray' : 'Collapse item tray'}</Text>
      </Pressable>

      {collapsed ? (
        <View style={styles.collapsedStatus}>
          <PackageOpen size={16} color="#566549" strokeWidth={1.5} />
          <Text style={styles.collapsedText}>Items hidden</Text>
        </View>
      ) : <>

      {/* Segmented Tab Pill */}
      <View style={styles.segmentedContainer}>
        <Pressable
          onPress={() => setActiveTab('Appliances')}
          style={[styles.segmentBtn, activeTab === 'Appliances' && styles.segmentBtnActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Appliances' }}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'Appliances' && styles.segmentTextActive,
            ]}
          >
            Appliances
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('Furniture')}
          style={[styles.segmentBtn, activeTab === 'Furniture' && styles.segmentBtnActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Furniture' }}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'Furniture' && styles.segmentTextActive,
            ]}
          >
            Furniture
          </Text>
        </Pressable>
      </View>

      {/* Horizontal Scroll of Item Tiles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentItems.map((item) => {
          const isSelected = selectedPendingKey === item.key;
          return (
            <View key={item.key} style={styles.itemWrapper}>
              <View
                // Pointer down on Web & Native
                {...(Platform.OS === 'web'
                  ? {
                      onPointerDown: (e: any) => {
                        onItemPointerDown(item, e.clientX, e.clientY);
                      },
                    }
                  : {})}
                {...(Platform.OS !== 'web'
                  ? {
                      onTouchStart: (event: any) => {
                        nativeDraggedKey.current = null;
                        onItemPointerDown(item, event.nativeEvent.pageX, event.nativeEvent.pageY);
                      },
                      onTouchMove: (event: any) => {
                        nativeDraggedKey.current = item.key;
                        onItemDragMove?.(item, event.nativeEvent.pageX, event.nativeEvent.pageY);
                      },
                      onTouchEnd: (event: any) => {
                        if (nativeDraggedKey.current === item.key) {
                          const touch = event.nativeEvent.changedTouches?.[0] ?? event.nativeEvent;
                          onItemDragEnd?.(item, touch.pageX, touch.pageY);
                        }
                      },
                    }
                  : {})}
              >
                <Pressable
                  onPress={() => {
                    if (nativeDraggedKey.current === item.key) {
                      nativeDraggedKey.current = null;
                      return;
                    }
                    onItemTap(item);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.label}`}
                  style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                >
                  <Sprite type={item.key} size={52} />
                </Pressable>
              </View>
              <Text style={styles.itemLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      </>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 2,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: '#ECE7DE',
  },
  sheetCollapsed: { paddingBottom: 2 },
  handleButton: {
    minHeight: 48,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
    alignSelf: 'center',
  },
  handleText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#57534E' },
  collapsedStatus: { minHeight: 48, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  collapsedText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#566549' },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAE7E0',
    borderRadius: 9999,
    padding: 3,
    marginBottom: 8,
    alignSelf: 'center',
    width: 230,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#78716C',
  },
  segmentTextActive: {
    color: '#1C1917',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 8,
    paddingBottom: 2,
  },
  itemWrapper: {
    alignItems: 'center',
    width: 64,
  },
  itemCard: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#F6F4EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E4DC',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemCardSelected: {
    borderColor: '#566549',
    backgroundColor: '#E0E6D9',
  },
  itemLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#292524',
    marginTop: 5,
    textAlign: 'center',
  },
});
