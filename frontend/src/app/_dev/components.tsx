import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  ArrowRight,
  Leaf,
  Droplet,
  Zap,
  Flame,
  Home,
  User,
} from 'lucide-react-native';

import {
  Button,
  Card,
  MiniCard,
  Input,
  Badge,
  BottomSheet,
  useToast,
  Slider,
  ProgressBar,
  ListItem,
  EmptyState,
  Skeleton,
  Stepper,
  Chip,
  SegmentedControl,
  Switch,
  Header,
  TabBar,
  type TabKey,
} from '@/components';

export default function ComponentGalleryScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  // State for interactive components
  const [inputText, setInputText] = useState('');
  const [passwordText, setPasswordText] = useState('secret123');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetVariant, setSheetVariant] = useState<'modal' | 'docked'>('modal');
  const [sheetHeight, setSheetHeight] = useState<'auto' | '88%' | 'full'>('auto');
  const [sliderVal, setSliderVal] = useState(40);
  const [stopVal, setStopVal] = useState(6);
  const [progressVal, setProgressVal] = useState(0.68);
  const [stepperVal, setStepperVal] = useState(3);
  const [chipSelected, setChipSelected] = useState(true);
  const [segmentVal, setSegmentVal] = useState<'day' | 'week' | 'month'>('week');
  const [switchVal, setSwitchVal] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('simulator');

  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.sectionHeader}>Only available in development mode.</Text>
      </SafeAreaView>
    );
  }

  const openSheet = (variant: 'modal' | 'docked', height: 'auto' | '88%') => {
    setSheetVariant(variant);
    setSheetHeight(height);
    setSheetVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Gallery Header */}
      <View style={styles.topNav}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/simulator');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#292524" strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.navTitle}>UI Component Gallery</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.gallerySubtitle}>
          Complete design system tokens & primitives per design.md
        </Text>

        {/* 1. BUTTONS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>1. Buttons</Text>
          <View style={styles.rowWrap}>
            <Button variant="primary">Primary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="disabled">Disabled</Button>
          </View>
          <View style={styles.rowWrap}>
            <Button variant="primary" loading>Primary Loading</Button>
            <Button variant="accent" leftIcon={<Camera size={18} color="#292524" strokeWidth={1.5} />}>
              With Left Icon
            </Button>
            <Button variant="secondary" rightIcon={<ArrowRight size={18} color="#292524" strokeWidth={1.5} />}>
              With Right Icon
            </Button>
          </View>
        </View>

        {/* 2. CARDS & MINICARDS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>2. Cards & MiniCards</Text>
          <Card hasShadow style={styles.mb3}>
            <Text style={styles.cardHeading}>Standard Card (radius 32px, p-6)</Text>
            <Text style={styles.cardBody}>
              Outer container with cream background and 1px stone-200 border.
            </Text>

            {/* Nested MiniCards (1 level only) */}
            <View style={styles.miniCardGrid}>
              <MiniCard tone="default" style={styles.flex1}>
                <Text style={styles.miniCardTitle}>White MiniCard</Text>
                <Text style={styles.miniCardBody}>Single level nested</Text>
              </MiniCard>
              <MiniCard tone="warm" style={styles.flex1}>
                <Text style={styles.miniCardTitle}>Warm MiniCard</Text>
                <Text style={styles.miniCardBody}>tan-100 tone</Text>
              </MiniCard>
            </View>
          </Card>

          <Card variant="highlight">
            <Text style={styles.cardHeading}>Highlight Card (tan-100)</Text>
            <Text style={styles.cardBody}>
              Used for suggestions, pop-up highlights, and eco rewards.
            </Text>
          </Card>
        </View>

        {/* 3. INPUTS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>3. Text Inputs</Text>
          <Input
            label="Email address"
            placeholder="e.g. meiling@example.com"
            helper="We will send your verification link here."
            value={inputText}
            onChangeText={setInputText}
            leftIcon={<User size={18} color="#a8a29e" strokeWidth={1.5} />}
          />
          <Input
            label="Password"
            placeholder="At least 8 characters"
            isPassword
            value={passwordText}
            onChangeText={setPasswordText}
          />
          <Input
            label="State or region"
            placeholder="Choose state"
            error="Please choose your state to calculate tariff."
            value=""
          />
        </View>

        {/* 4. BADGES */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>4. Badges</Text>
          <View style={styles.rowWrap}>
            <Badge tone="sage" icon={<Leaf size={12} color="#566549" strokeWidth={1.5} />}>
              +10 pts
            </Badge>
            <Badge tone="tan" icon={<Zap size={12} color="#a97a4a" strokeWidth={1.5} />}>
              Electricity
            </Badge>
            <Badge tone="stone">Standard</Badge>
            <Badge tone="amber" icon={<Droplet size={12} color="#92600e" strokeWidth={1.5} />}>
              Watch (Drip)
            </Badge>
            <Badge tone="error" icon={<Flame size={12} color="#a8442f" strokeWidth={1.5} />}>
              Leak Alert
            </Badge>
          </View>
        </View>

        {/* 5. TOASTS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>5. Toast System</Text>
          <View style={styles.rowWrap}>
            <Button
              size="sm"
              variant="accent"
              onPress={() => showToast('Sorted cleanly! +10 points awarded.', 'success')}
            >
              Success Toast
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => showToast('Leak detected on water meter (+48%).', 'warning')}
            >
              Warning Toast
            </Button>
            <Button
              size="sm"
              variant="primary"
              onPress={() => showToast('Could not scan bill. Try a clearer photo.', 'error')}
            >
              Error Toast
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => showToast('Schedule updated for weekdays.', 'info')}
            >
              Info Toast
            </Button>
          </View>
        </View>

        {/* 6. SLIDER */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>6. Sliders</Text>
          <Text style={styles.subLabel}>Continuous Slider (Value: {sliderVal})</Text>
          <Slider
            value={sliderVal}
            min={0}
            max={100}
            step={5}
            onChange={setSliderVal}
            formatValue={(v) => `${v}%`}
          />

          <Text style={[styles.subLabel, styles.mt3]}>
            Fast-Forward Horizon (Stops: 1W, 1M, 1Y)
          </Text>
          <Slider
            value={stopVal}
            min={1}
            max={12}
            stops={[
              { value: 0.25, label: '1W' },
              { value: 1, label: '1M' },
              { value: 12, label: '1Y' },
            ]}
            onChange={setStopVal}
            formatValue={(v) => (v === 0.25 ? '1 Week' : v === 1 ? '1 Month' : '1 Year')}
          />
        </View>

        {/* 7. PROGRESS BAR */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>7. Progress Bar ({Math.round(progressVal * 100)}%)</Text>
          <ProgressBar progress={progressVal} style={styles.mb3} />
          <View style={styles.rowWrap}>
            <Button size="sm" variant="secondary" onPress={() => setProgressVal(0.25)}>
              25%
            </Button>
            <Button size="sm" variant="secondary" onPress={() => setProgressVal(0.5)}>
              50%
            </Button>
            <Button size="sm" variant="secondary" onPress={() => setProgressVal(0.75)}>
              75%
            </Button>
            <Button size="sm" variant="accent" onPress={() => setProgressVal(1.0)}>
              100%
            </Button>
          </View>
        </View>

        {/* 8. LIST ITEMS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>8. List Items</Text>
          <Card style={{ padding: 8 }}>
            <ListItem
              leftIcon={<Home size={20} color="#57534e" strokeWidth={1.5} />}
              title="House Layout"
              subtitle="3 residents · 5 rooms"
              onPress={() => showToast('Tapped House Layout', 'info')}
            />
            <ListItem
              leftIcon={<Zap size={20} color="#a97a4a" strokeWidth={1.5} />}
              title="Air Conditioner"
              subtitle="Living room · 1,500 W"
              rightValue="RM 84/mo"
              showChevron={false}
            />
            <ListItem
              leftIcon={<Leaf size={20} color="#566549" strokeWidth={1.5} />}
              title="Green Deeds Today"
              rightValue={<Badge tone="sage">2 / 3</Badge>}
              showDivider={false}
            />
          </Card>
        </View>

        {/* 9. CONTROLS: STEPPER, CHIP, SEGMENTED CONTROL, SWITCH */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>9. Controls (Stepper, Chip, Segmented, Switch)</Text>

          <Text style={styles.subLabel}>Stepper</Text>
          <Stepper
            value={stepperVal}
            min={1}
            max={10}
            onChange={setStepperVal}
            label="Household residents"
            unit="people"
          />

          <Text style={[styles.subLabel, styles.mt3]}>Chips</Text>
          <View style={styles.rowWrap}>
            <Chip
              label="Watching TV"
              selected={chipSelected}
              onPress={() => setChipSelected(!chipSelected)}
            />
            <Chip
              label="Air Conditioner On"
              selected={!chipSelected}
              onPress={() => setChipSelected(!chipSelected)}
            />
            <Chip
              label="Disabled Option"
              selected={false}
              disabled
              onPress={() => {}}
            />
          </View>

          <Text style={[styles.subLabel, styles.mt3]}>Segmented Control</Text>
          <SegmentedControl
            options={[
              { label: 'Day', value: 'day' },
              { label: 'Week', value: 'week' },
              { label: 'Month', value: 'month' },
            ]}
            selectedValue={segmentVal}
            onChange={setSegmentVal}
          />

          <View style={[styles.rowBetween, styles.mt3]}>
            <Text style={styles.subLabel}>Toggle Switch (on = sage-400)</Text>
            <Switch value={switchVal} onValueChange={setSwitchVal} />
          </View>
        </View>

        {/* 10. SKELETON */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>10. Skeleton Loading (700ms pulse)</Text>
          <View style={{ gap: 8 }}>
            <Skeleton width="60%" height={24} borderRadius={12} />
            <Skeleton width="100%" height={16} borderRadius={8} />
            <Skeleton width="85%" height={16} borderRadius={8} />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Skeleton width={48} height={48} borderRadius={24} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="90%" height={14} borderRadius={6} />
                <Skeleton width="50%" height={14} borderRadius={6} />
              </View>
            </View>
          </View>
        </View>

        {/* 11. EMPTY STATE */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>11. Empty State</Text>
          <Card>
            <EmptyState
              title="No appliances added yet"
              description="Add appliances to see your estimated electricity bill and smart swap recommendations."
              actionLabel="Add Appliance"
              onAction={() => showToast('Open Add Appliance Tray', 'info')}
            />
          </Card>
        </View>

        {/* 12. BOTTOM SHEET DEMOS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>12. Bottom Sheets (Reanimated + Gesture)</Text>
          <View style={styles.rowWrap}>
            <Button
              variant="accent"
              onPress={() => openSheet('modal', 'auto')}
            >
              Open Auto-Height Modal
            </Button>
            <Button
              variant="secondary"
              onPress={() => openSheet('modal', '88%')}
            >
              Open 88% Sheet
            </Button>
            <Button
              variant="primary"
              onPress={() => openSheet('docked', 'auto')}
            >
              Open Docked Tray (No Scrim)
            </Button>
          </View>
        </View>

        {/* 13. HEADERS */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>13. Header Variants</Text>
          <Text style={styles.subLabel}>Variant: bell-only (Simulator / Bin / Profile)</Text>
          <Card style={{ padding: 4 }}>
            <Header variant="bell-only" hasUnread={true} />
          </Card>

          <Text style={[styles.subLabel, styles.mt3]}>Variant: page-title-block (Scanner)</Text>
          <Card style={{ padding: 4 }}>
            <Header
              variant="page-title-block"
              title="Bill analyzer"
              subtitle="Track monthly utility trends, detect leaks, and get AI tips."
              hasUnread={true}
            />
          </Card>

          <Text style={[styles.subLabel, styles.mt3]}>Variant: back-and-title (Sub-pages)</Text>
          <Card style={{ padding: 4 }}>
            <Header
              variant="back-and-title"
              title="Edit Routine"
              onBack={() => showToast('Back pressed', 'info')}
            />
          </Card>
        </View>

        {/* 14. TAB BAR PREVIEW */}
        <View style={[styles.section, { marginBottom: 60 }]}>
          <Text style={styles.sectionHeader}>14. Floating Tab Bar Preview</Text>
          <View style={{ height: 90, position: 'relative' }}>
            <TabBar
              activeTab={activeTab}
              onTabPress={setActiveTab}
              style={{ bottom: 10 }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Interactive Bottom Sheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        variant={sheetVariant}
        height={sheetHeight}
        title={sheetVariant === 'docked' ? 'Docked Tray' : 'Modal Sheet'}
      >
        <Text style={styles.sheetBodyText}>
          {sheetVariant === 'docked'
            ? 'This is a docked tray with no scrim. The floor plan remains interactive above it.'
            : 'This is a modal bottom sheet with a 40% stone-800 scrim. Drag down or tap the close button to dismiss.'}
        </Text>
        <View style={{ marginTop: 20, gap: 12 }}>
          <MiniCard tone="warm">
            <Text style={styles.miniCardTitle}>Sheet Content Example</Text>
            <Text style={styles.miniCardBody}>Height: {sheetHeight}</Text>
          </MiniCard>
          <Button variant="accent" onPress={() => setSheetVisible(false)}>
            Close Sheet
          </Button>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f1', // cream
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
  },
  placeholder: {
    width: 48,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  gallerySubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
    marginBottom: 12,
  },
  subLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#57534e',
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mb3: {
    marginBottom: 12,
  },
  mt3: {
    marginTop: 12,
  },
  cardHeading: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 17,
    color: '#292524',
    marginBottom: 4,
  },
  cardBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e',
    marginBottom: 12,
  },
  miniCardGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  miniCardTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  miniCardBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
    marginTop: 2,
  },
  sheetBodyText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    lineHeight: 22,
  },
});
