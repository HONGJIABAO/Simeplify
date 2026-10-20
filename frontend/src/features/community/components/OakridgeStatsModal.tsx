import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react-native';
import { CommunityActivityDashboard } from './CommunityActivityDashboard';

interface OakridgeStatsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function OakridgeStatsModal({
  visible,
  onClose,
}: OakridgeStatsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.scrimOverlay}>
        <Pressable style={styles.scrimPressable} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Top Bar with Close Button */}
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle}>Community Activity</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeButton}
            >
              <X size={18} color="#292524" strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* The Full Oakridge Commons - Community Activity Dashboard */}
            <CommunityActivityDashboard showHeader={true} />

            {/* Live Sync Notice */}
            <View style={styles.syncRow}>
              <RefreshCw size={13} color="#78716C" strokeWidth={1.8} />
              <Text style={styles.syncText}>
                Last sync: 2 mins ago • Updates automatically across village sectors
              </Text>
            </View>

            {/* Got It Button */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Got it"
              style={({ pressed }) => [
                styles.gotItButton,
                pressed && { opacity: 0.88 },
              ]}
            >
              <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.gotItButtonText}>Got it</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrimOverlay: {
    flex: 1,
    backgroundColor: 'rgba(41, 37, 36, 0.45)',
    justifyContent: 'flex-end',
  },
  scrimPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 10,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
    alignSelf: 'center',
    marginBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  topBarTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#44403C',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EBE7E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  syncText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
  },
  gotItButton: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: '#566549',
    borderRadius: 9999,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#566549',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  gotItButtonText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
