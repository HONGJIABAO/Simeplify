import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, LayoutChangeEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, PackageOpen } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { ApplianceTrayRow, FurnitureTrayRow } from '../logic/trayData';
import { buildApplianceTrayItems, buildFurnitureTrayItems, ENABLE_FURNITURE_TAB } from '../logic/trayData';
import { getTrayTileWidth } from '../logic/trayRules';
import { getSpriteSource, type SpriteItemDef } from '../logic/spriteMap';
import { Sprite } from './Sprite';

type TrayTab = 'Appliances' | 'Furniture';

interface EditSheetProps {
  visible: boolean;
  applianceTypes?: ApplianceTrayRow[];
  furnitureTypes?: FurnitureTrayRow[];
  onItemPointerDown: (item: SpriteItemDef, clientX: number, clientY: number) => void;
  onItemDragMove?: (item: SpriteItemDef, clientX: number, clientY: number) => void;
  onItemDragEnd?: (item: SpriteItemDef, clientX: number, clientY: number) => void;
  onItemTap: (item: SpriteItemDef) => void;
  selectedPendingKey?: string | null;
  isDragging?: boolean;
  initialCollapsed?: boolean;
  initialScrollToEnd?: boolean;
}

interface TrayTileProps {
  item: SpriteItemDef;
  width: number;
  selected: boolean;
  onStart: EditSheetProps['onItemPointerDown'];
  onMove?: EditSheetProps['onItemDragMove'];
  onEnd?: EditSheetProps['onItemDragEnd'];
  onTap: EditSheetProps['onItemTap'];
}

export const EDIT_SHEET_HEIGHT = 184;

export function EditSheetSurface({
  children,
  collapsed = false,
  opacity,
  height = EDIT_SHEET_HEIGHT,
}: {
  children: React.ReactNode;
  collapsed?: boolean;
  opacity?: Animated.Value;
  height?: number;
}) {
  const [translateY] = useState(() => new Animated.Value(EDIT_SHEET_HEIGHT));

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      Animated.timing(translateY, {
        toValue: 0,
        duration: reduced ? 0 : 500,
        useNativeDriver: true,
      }).start();
    });
    return () => { active = false; };
  }, [translateY]);

  return (
    <Animated.View style={[
      styles.sheetContainer,
      { height },
      collapsed && styles.sheetCollapsed,
      { opacity: opacity ?? 1, transform: [{ translateY }] },
    ]}>
      {children}
    </Animated.View>
  );
}

/** Shared tray tile surface used by Edit mode and Simulator recommendations. */
export function EditSheetTileSurface({
  children,
  width,
  selected = false,
  style,
}: {
  children: React.ReactNode;
  width: number;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.itemCard, { width: width - 6 }, selected && styles.itemCardSelected, style]}>
      {children}
    </View>
  );
}

function TrayTile({ item, width, selected, onStart, onMove, onEnd, onTap }: TrayTileProps) {
  const beginDrag = (x: number, y: number) => onStart(item, x, y);
  const moveDrag = (x: number, y: number) => onMove?.(item, x, y);
  const finishDrag = (x: number, y: number) => onEnd?.(item, x, y);

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .minDistance(4)
    .onStart((event) => runOnJS(beginDrag)(event.absoluteX, event.absoluteY))
    .onUpdate((event) => runOnJS(moveDrag)(event.absoluteX, event.absoluteY))
    .onEnd((event) => runOnJS(finishDrag)(event.absoluteX, event.absoluteY));

  const hasPicture = Boolean(getSpriteSource(item.key));

  return (
    <GestureDetector gesture={dragGesture}>
      <Pressable
        onPress={() => onTap(item)}
        style={[styles.itemWrapper, { width }]}
        accessibilityRole="button"
        accessibilityLabel={`Add ${item.label}`}
      >
        <EditSheetTileSurface width={width} selected={selected}>
          {hasPicture ? (
            <Sprite type={item.key} width={44} height={44} size={44} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderTile}>
              <PackageOpen size={22} color="#78716C" strokeWidth={1.5} />
              <Text style={styles.placeholderText} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          )}
        </EditSheetTileSurface>
        <Text style={styles.itemLabel} numberOfLines={1}>
          {item.label}
        </Text>
      </Pressable>
    </GestureDetector>
  );
}

export function EditSheet({
  visible,
  applianceTypes = [],
  furnitureTypes = [],
  onItemPointerDown,
  onItemDragMove,
  onItemDragEnd,
  onItemTap,
  selectedPendingKey,
  isDragging = false,
  initialCollapsed = false,
  initialScrollToEnd = false,
}: EditSheetProps) {
  const [activeTab, setActiveTab] = useState<TrayTab>('Appliances');
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [opacity] = useState(() => new Animated.Value(1));
  const [trayWidth, setTrayWidth] = useState(390);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const scrollRef = useRef<any>(null);
  const offsets = useRef<Record<TrayTab, number>>({ Appliances: 0, Furniture: 0 });

  const applianceItems = useMemo(() => buildApplianceTrayItems(applianceTypes), [applianceTypes]);
  const furnitureItems = useMemo(() => buildFurnitureTrayItems(furnitureTypes), [furnitureTypes]);
  const currentItems = activeTab === 'Appliances' ? applianceItems : furnitureItems;
  const tileWidth = getTrayTileWidth(trayWidth);
  const maxScroll = Math.max(0, contentWidth - trayWidth);
  const canScrollLeft = scrollX > 6;
  const canScrollRight = scrollX < maxScroll - 6;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (active) {
        Animated.timing(opacity, {
          toValue: isDragging ? 0.3 : 1,
          duration: reduced ? 0 : 400,
          useNativeDriver: true,
        }).start();
      }
    });
    return () => {
      active = false;
    };
  }, [isDragging, opacity]);

  useEffect(() => {
    if (initialScrollToEnd && contentWidth > trayWidth) {
      const maxX = contentWidth - trayWidth;
      scrollRef.current?.scrollTo({ x: maxX, animated: false });
      offsets.current[activeTab] = maxX;
    }
  }, [activeTab, contentWidth, initialScrollToEnd, trayWidth]);

  const handleTabChange = (tab: TrayTab) => {
    offsets.current[activeTab] = scrollX;
    setActiveTab(tab);
    const targetX = offsets.current[tab] ?? 0;
    setScrollX(targetX);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: targetX, animated: false });
    }, 10);
  };

  const scrollTo = (x: number, animated = true) => {
    const next = Math.max(0, Math.min(x, maxScroll));
    offsets.current[activeTab] = next;
    setScrollX(next);
    scrollRef.current?.scrollTo({ x: next, animated });
  };

  if (!visible) return null;
  const onTrayLayout = (event: LayoutChangeEvent) => setTrayWidth(event.nativeEvent.layout.width);
  const webWheelProps =
    Platform.OS === 'web'
      ? {
          onWheel: (event: any) => {
            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
            if (delta) scrollTo(offsets.current[activeTab] + delta, false);
          },
        }
      : {};

  return (
    <EditSheetSurface collapsed={collapsed} opacity={opacity}>
      <Pressable
        onPress={() => setCollapsed((value) => !value)}
        style={styles.handleButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        accessibilityLabel={collapsed ? 'Show item tray' : 'Collapse item tray'}
      >
        {collapsed ? <ChevronUp size={16} color="#57534E" /> : <ChevronDown size={16} color="#57534E" />}
        <View style={styles.handle} />
        <Text style={styles.handleText}>{collapsed ? 'Show item tray' : 'Collapse item tray'}</Text>
      </Pressable>
      {collapsed ? (
        <View style={styles.collapsedStatus}>
          <PackageOpen size={16} color="#566549" strokeWidth={1.5} />
          <Text style={styles.collapsedText}>Items hidden</Text>
        </View>
      ) : (
        <>
          <View style={styles.segmentedContainer}>
            {(['Appliances', ...(ENABLE_FURNITURE_TAB ? ['Furniture' as const] : [])] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => handleTabChange(tab)}
                style={[styles.segmentBtn, activeTab === tab && styles.segmentBtnActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.trayViewport} onLayout={onTrayLayout} {...webWheelProps}>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              style={styles.trayScrollView}
              contentContainerStyle={styles.scrollContent}
              onContentSizeChange={(w) => setContentWidth(w)}
              onScroll={(event) => {
                const next = event.nativeEvent.contentOffset.x;
                offsets.current[activeTab] = next;
                setScrollX(next);
              }}
            >
              {currentItems.map((item) => (
                <TrayTile
                  key={`${activeTab}-${item.key}`}
                  item={item}
                  width={tileWidth}
                  selected={selectedPendingKey === item.key}
                  onStart={onItemPointerDown}
                  onMove={onItemDragMove}
                  onEnd={onItemDragEnd}
                  onTap={onItemTap}
                />
              ))}
            </ScrollView>
            {Platform.OS === 'web' && canScrollLeft && (
              <Pressable
                onPress={() => scrollTo(scrollX - tileWidth * 2)}
                style={[styles.chevronButton, styles.chevronLeft]}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Scroll tray left"
              >
                <ChevronLeft size={20} color="#566549" />
              </Pressable>
            )}
            {Platform.OS === 'web' && canScrollRight && (
              <Pressable
                onPress={() => scrollTo(scrollX + tileWidth * 2)}
                style={[styles.chevronButton, styles.chevronRight]}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Scroll tray right"
              >
                <ChevronRight size={20} color="#566549" />
              </Pressable>
            )}
          </View>
        </>
      )}
    </EditSheetSurface>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    height: EDIT_SHEET_HEIGHT,
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 8,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: '#ECE7DE',
  },
  sheetCollapsed: {
    height: 48,
    paddingBottom: 0,
  },
  handleButton: {
    height: 28,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
  },
  handleText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#57534E',
  },
  collapsedStatus: {
    height: 20,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549',
  },
  segmentedContainer: {
    height: 32,
    flexDirection: 'row',
    backgroundColor: '#EAE7E0',
    borderRadius: 9999,
    padding: 3,
    marginBottom: 6,
    alignSelf: 'center',
    width: 230,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 26,
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
    fontSize: 12,
    color: '#78716C',
  },
  segmentTextActive: {
    color: '#1C1917',
  },
  trayViewport: {
    flex: 1,
    marginHorizontal: -16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  trayScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  itemWrapper: {
    alignItems: 'center',
  },
  itemCard: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F6F4EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E4DC',
  },
  itemCardSelected: {
    borderColor: '#566549',
    backgroundColor: '#E0E6D9',
  },
  itemLabel: {
    width: '94%',
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    lineHeight: 15,
    color: '#292524',
    marginTop: 2,
    textAlign: 'center',
  },
  placeholderTile: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  placeholderText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#57534E',
    marginTop: 1,
  },
  chevronButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6D3D1',
    shadowColor: '#5C4033',
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  chevronLeft: { left: 4 },
  chevronRight: { right: 4 },
});
