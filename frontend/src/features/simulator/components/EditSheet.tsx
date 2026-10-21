import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, LayoutChangeEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, PackageOpen } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { ApplianceTrayRow } from '../logic/trayData';
import { buildApplianceTrayItems, buildFurnitureTrayItems } from '../logic/trayData';
import { getTrayTileWidth } from '../logic/trayRules';
import { getSpriteSource, type SpriteItemDef } from '../logic/spriteMap';
import { Sprite } from './Sprite';

type TrayTab = 'Appliances' | 'Furniture';

interface EditSheetProps {
  visible: boolean;
  applianceTypes?: ApplianceTrayRow[];
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

function TrayTile({ item, width, selected, onStart, onMove, onEnd, onTap }: TrayTileProps) {
  const beginDrag = (x: number, y: number) => onStart(item, x, y);
  const moveDrag = (x: number, y: number) => onMove?.(item, x, y);
  const finishDrag = (x: number, y: number) => onEnd?.(item, x, y);
  const longPressDrag = Gesture.Pan()
    .activateAfterLongPress(200).failOffsetX([-12, 12])
    .onStart((event) => runOnJS(beginDrag)(event.absoluteX, event.absoluteY))
    .onUpdate((event) => runOnJS(moveDrag)(event.absoluteX, event.absoluteY))
    .onEnd((event) => runOnJS(finishDrag)(event.absoluteX, event.absoluteY));
  const upwardDrag = Gesture.Pan()
    .activeOffsetY(-10).failOffsetX([-12, 12])
    .onStart((event) => runOnJS(beginDrag)(event.absoluteX, event.absoluteY))
    .onUpdate((event) => runOnJS(moveDrag)(event.absoluteX, event.absoluteY))
    .onEnd((event) => runOnJS(finishDrag)(event.absoluteX, event.absoluteY));
  const tap = Gesture.Tap().maxDuration(190).onEnd((_event, success) => {
    if (success) runOnJS(onTap)(item);
  });
  const tileGesture = Gesture.Simultaneous(Gesture.Native(), Gesture.Race(longPressDrag, upwardDrag, tap));
  const hasPicture = Boolean(getSpriteSource(item.key));
  return <GestureDetector gesture={tileGesture}>
    <View style={[styles.itemWrapper, { width }]}>
      <View accessible accessibilityRole="button" accessibilityLabel={`Add ${item.label}`}
        style={[styles.itemCard, { width: width - 6 }, selected && styles.itemCardSelected]}>
        {hasPicture ? <Sprite type={item.key} size={52} /> : <View style={styles.placeholderTile}>
          <PackageOpen size={22} color="#78716C" strokeWidth={1.5} />
          <Text style={styles.placeholderText} numberOfLines={1}>{item.label}</Text>
        </View>}
      </View>
      <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
    </View>
  </GestureDetector>;
}

export function EditSheet({ visible, applianceTypes = [], onItemPointerDown, onItemDragMove, onItemDragEnd,
  onItemTap, selectedPendingKey, isDragging = false, initialCollapsed = false, initialScrollToEnd = false }: EditSheetProps) {
  const [activeTab, setActiveTab] = useState<TrayTab>('Appliances');
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [opacity] = useState(() => new Animated.Value(1));
  const [trayWidth, setTrayWidth] = useState(390);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const scrollRef = useRef<any>(null);
  const offsets = useRef<Record<TrayTab, number>>({ Appliances: 0, Furniture: 0 });
  const applianceItems = useMemo(() => buildApplianceTrayItems(applianceTypes), [applianceTypes]);
  const furnitureItems = useMemo(() => buildFurnitureTrayItems(), []);
  const currentItems = activeTab === 'Appliances' ? applianceItems : furnitureItems;
  const tileWidth = getTrayTileWidth(trayWidth);
  const maxScroll = Math.max(0, contentWidth - trayWidth);
  const canScrollLeft = scrollX > 2;
  const canScrollRight = scrollX < maxScroll - 2;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (active) Animated.timing(opacity, { toValue: isDragging ? 0.3 : 1, duration: reduced ? 0 : 400, useNativeDriver: true }).start();
    });
    return () => { active = false; };
  }, [isDragging, opacity]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const wanted = initialScrollToEnd ? Math.max(0, contentWidth - trayWidth) : offsets.current[activeTab];
      const clamped = Math.max(0, Math.min(wanted, Math.max(0, contentWidth - trayWidth)));
      scrollRef.current?.scrollTo({ x: clamped, animated: false });
      setScrollX(clamped); offsets.current[activeTab] = clamped;
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, contentWidth, initialScrollToEnd, trayWidth]);

  const scrollTo = (x: number, animated = true) => {
    const next = Math.max(0, Math.min(x, maxScroll));
    offsets.current[activeTab] = next; setScrollX(next);
    scrollRef.current?.scrollTo({ x: next, animated });
  };
  useEffect(() => {
    offsets.current[activeTab] = scrollX;
    scrollRef.current?.scrollTo({ x: scrollX, animated: false });
  }, [activeTab, scrollX]);
  const webPan = Gesture.Pan().enabled(Platform.OS === 'web')
    .activeOffsetX([-6, 6]).failOffsetY([-10, 10])
    .onUpdate((event) => runOnJS(setScrollX)(Math.max(0, Math.min(maxScroll, scrollX - event.translationX))));
  const scrollGesture = Gesture.Simultaneous(Gesture.Native(), webPan);

  if (!visible) return null;
  const onTrayLayout = (event: LayoutChangeEvent) => setTrayWidth(event.nativeEvent.layout.width);
  const webWheelProps = Platform.OS === 'web' ? { onWheel: (event: any) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta) scrollTo(offsets.current[activeTab] + delta, false);
  } } : {};

  return <Animated.View style={[styles.sheetContainer, collapsed && styles.sheetCollapsed, { opacity }]}>
    <Pressable onPress={() => setCollapsed((value) => !value)} style={styles.handleButton} hitSlop={8}
      accessibilityRole="button" accessibilityState={{ expanded: !collapsed }}
      accessibilityLabel={collapsed ? 'Show item tray' : 'Collapse item tray'}>
      {collapsed ? <ChevronUp size={16} color="#57534E" /> : <ChevronDown size={16} color="#57534E" />}
      <View style={styles.handle} />
      <Text style={styles.handleText}>{collapsed ? 'Show item tray' : 'Collapse item tray'}</Text>
    </Pressable>
    {collapsed ? <View style={styles.collapsedStatus}><PackageOpen size={16} color="#566549" strokeWidth={1.5} />
      <Text style={styles.collapsedText}>Items hidden</Text></View> : <>
      <View style={styles.segmentedContainer}>{(['Appliances', 'Furniture'] as const).map((tab) => <Pressable key={tab}
        onPress={() => { offsets.current[activeTab] = scrollX; setActiveTab(tab); setContentWidth(0); }}
        style={[styles.segmentBtn, activeTab === tab && styles.segmentBtnActive]}
        accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }}>
        <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>{tab}</Text>
      </Pressable>)}</View>
      <View style={styles.trayViewport} onLayout={onTrayLayout} {...webWheelProps}>
        <GestureDetector gesture={scrollGesture}><ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16} contentContainerStyle={styles.scrollContent}
          onContentSizeChange={(width) => setContentWidth(width)}
          onScroll={(event) => { const next = event.nativeEvent.contentOffset.x; offsets.current[activeTab] = next; setScrollX(next); }}>
          {currentItems.map((item) => <TrayTile key={item.key} item={item} width={tileWidth}
            selected={selectedPendingKey === item.key} onStart={onItemPointerDown} onMove={onItemDragMove}
            onEnd={onItemDragEnd} onTap={onItemTap} />)}
        </ScrollView></GestureDetector>
        {Platform.OS === 'web' && canScrollLeft && <Pressable onPress={() => scrollTo(scrollX - tileWidth * 2)}
          style={[styles.chevronButton, styles.chevronLeft]} hitSlop={4} accessibilityRole="button" accessibilityLabel="Scroll tray left">
          <ChevronLeft size={20} color="#566549" /></Pressable>}
        {Platform.OS === 'web' && canScrollRight && <Pressable onPress={() => scrollTo(scrollX + tileWidth * 2)}
          style={[styles.chevronButton, styles.chevronRight]} hitSlop={4} accessibilityRole="button" accessibilityLabel="Scroll tray right">
          <ChevronRight size={20} color="#566549" /></Pressable>}
      </View>
    </>}
  </Animated.View>;
}

const styles = StyleSheet.create({
  sheetContainer: { height: 150, maxHeight: '22%', backgroundColor: '#FAF7F2', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 1, paddingHorizontal: 16, shadowColor: '#5C4033', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1,
    shadowRadius: 12, elevation: 8, borderTopWidth: 1, borderColor: '#ECE7DE' },
  sheetCollapsed: { height: 56 },
  handleButton: { height: 30, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: '#D6D3D1' },
  handleText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#57534E' },
  collapsedStatus: { height: 25, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  collapsedText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#566549' },
  segmentedContainer: { height: 32, flexDirection: 'row', backgroundColor: '#EAE7E0', borderRadius: 9999, padding: 3,
    marginBottom: 3, alignSelf: 'center', width: 230 },
  segmentBtn: { flex: 1, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', minHeight: 26 },
  segmentBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#5C4033', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  segmentText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#78716C' },
  segmentTextActive: { color: '#1C1917' },
  trayViewport: { flex: 1, marginHorizontal: -16, overflow: 'hidden' },
  scrollContent: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 2 },
  itemWrapper: { alignItems: 'center' },
  itemCard: { height: 58, borderRadius: 16, backgroundColor: '#F6F4EE', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E8E4DC' },
  itemCardSelected: { borderColor: '#566549', backgroundColor: '#E0E6D9' },
  itemLabel: { width: '94%', fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, lineHeight: 15, color: '#292524',
    marginTop: 1, textAlign: 'center' },
  placeholderTile: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  placeholderText: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 12, color: '#57534E', marginTop: 1 },
  chevronButton: { position: 'absolute', top: 9, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D6D3D1', shadowColor: '#5C4033', shadowOpacity: 0.12,
    shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, zIndex: 4 },
  chevronLeft: { left: 5 },
  chevronRight: { right: 5 },
});
