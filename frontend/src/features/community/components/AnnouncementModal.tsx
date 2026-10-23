import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import {
  Mail,
  Leaf,
  Award,
  Check,
  CheckCircle2,
  Scale,
} from 'lucide-react-native';

interface AnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onGotIt?: () => void;
}

export function AnnouncementModal({ visible, onClose, onGotIt }: AnnouncementModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.scrimOverlay} className="flex-1 justify-end items-center">
        <Pressable style={styles.scrimPressable} onPress={onClose} />

        <View style={styles.sheetContainer} className="max-w-md mx-auto w-full">
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Tag */}
            <View style={styles.announcementTagRow}>
              <View style={styles.announcementTagBadge}>
                <Mail size={13} color="#566549" strokeWidth={1.8} />
                <Text style={styles.announcementTagText}>
                  Official Announcement • October Results
                </Text>
              </View>
              <Text style={styles.dateText}>Oct 28</Text>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.sheetTitle}>The neighborhood has decided!</Text>
            <Text style={styles.sheetSubtitle}>
              Over 82% of households voted. Together we chose how to channel our
              collective energy savings into local soil:
            </Text>

            {/* Winning Choice Card */}
            <View style={styles.winningCard}>
              <View style={styles.winningHeaderRow}>
                <View style={styles.winningBadge}>
                  <Leaf size={12} color="#A97A4A" strokeWidth={2} />
                  <Text style={styles.winningBadgeText}>WINNING CHOICE</Text>
                </View>
                <Award size={18} color="#A97A4A" strokeWidth={1.8} />
              </View>

              <Text style={styles.winningTitle}>Plant a tree in our community</Text>
              <Text style={styles.winningSubtitle}>
                A native oak grove planted along Meadow Lane parkway this Autumn.
              </Text>

              {/* Meadow Lane Illustration */}
              <View style={styles.mediaContainer}>
                <Image
                  source={require('../../../../assets/images/community/meadow_lane_illustration.png')}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
                <View style={styles.mediaBadge}>
                  <Text style={styles.mediaBadgeText}>Meadow Lane Plot #4</Text>
                </View>
              </View>

              {/* Final Ballot Audit Box */}
              <View style={styles.auditBox}>
                <View style={styles.auditHeader}>
                  <Text style={styles.auditTitle}>
                    Final Ballot Audit (240 total votes)
                  </Text>
                  <Scale size={14} color="#8C867E" strokeWidth={1.8} />
                </View>

                {/* Option 1 Bar */}
                <View style={styles.auditItem}>
                  <View style={styles.auditLabelRow}>
                    <View style={styles.auditOptionNameGroup}>
                      <View style={styles.checkCircleSmall}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                      <Text style={styles.auditOptionTitleBold}>
                        Plant a tree in our community
                      </Text>
                    </View>
                    <Text style={styles.auditStatsBold}>58% (139 votes)</Text>
                  </View>
                  <View style={styles.auditTrack}>
                    <View style={[styles.auditFill, { width: '58%', backgroundColor: '#8B9D77' }]} />
                  </View>
                </View>

                {/* Option 2 Bar */}
                <View style={styles.auditItem}>
                  <View style={styles.auditLabelRow}>
                    <Text style={styles.auditOptionTitleRegular}>
                      50% off organic food
                    </Text>
                    <Text style={styles.auditStatsRegular}>27% (65 votes)</Text>
                  </View>
                  <View style={styles.auditTrack}>
                    <View style={[styles.auditFill, { width: '27%', backgroundColor: '#D4A373' }]} />
                  </View>
                </View>

                {/* Option 3 Bar */}
                <View style={styles.auditItem}>
                  <View style={styles.auditLabelRow}>
                    <Text style={styles.auditOptionTitleRegular}>
                      Tool & seed library
                    </Text>
                    <Text style={styles.auditStatsRegular}>15% (36 votes)</Text>
                  </View>
                  <View style={styles.auditTrack}>
                    <View style={[styles.auditFill, { width: '15%', backgroundColor: '#A8A29E' }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Committee Sign-off Row */}
            <View style={styles.committeeRow}>
              <View style={styles.avatarsGroup}>
                <View style={[styles.avatarCircle, { backgroundColor: '#DCE6D5', zIndex: 3 }]}>
                  <Text style={[styles.avatarText, { color: '#4E6543' }]}>ML</Text>
                </View>
                <View style={[styles.avatarCircle, { backgroundColor: '#F6E8D8', marginLeft: -8, zIndex: 2 }]}>
                  <Text style={[styles.avatarText, { color: '#A97A4A' }]}>TK</Text>
                </View>
                <View style={[styles.avatarCircle, { backgroundColor: '#E7E5E4', marginLeft: -8, zIndex: 1 }]}>
                  <Text style={[styles.avatarText, { color: '#57534E' }]}>JR</Text>
                </View>
              </View>

              <Text style={styles.committeeSignText}>
                Signed by Elm & Oak Block Committee
              </Text>
            </View>

            {/* Got it Action Button */}
            <Pressable
              onPress={onGotIt || onClose}
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
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D6D3D1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 36,
  },
  announcementTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  announcementTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5ECE0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  announcementTagText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#4E6543',
  },
  dateText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12.5,
    color: '#78716C',
  },
  sheetTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 24,
    color: '#292524',
    marginTop: 4,
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13.5,
    color: '#57534E',
    lineHeight: 19,
    marginBottom: 16,
  },
  winningCard: {
    backgroundColor: '#F7EDE0',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9DEC9',
    marginBottom: 16,
  },
  winningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  winningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  winningBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10.5,
    color: '#A97A4A',
    letterSpacing: 0.5,
  },
  winningTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
    marginBottom: 2,
  },
  winningSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
    lineHeight: 17,
    marginBottom: 12,
  },
  mediaContainer: {
    position: 'relative',
    height: 140,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(41, 37, 36, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999,
  },
  mediaBadgeText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 11,
    color: '#FFFFFF',
  },
  auditBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  auditTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#57534E',
  },
  auditItem: {
    marginBottom: 12,
  },
  auditLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  auditOptionNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#566549',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditOptionTitleBold: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12.5,
    color: '#292524',
  },
  auditStatsBold: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
    color: '#292524',
  },
  auditOptionTitleRegular: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
  },
  auditStatsRegular: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#78716C',
  },
  auditTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EAE7E0',
    overflow: 'hidden',
  },
  auditFill: {
    height: '100%',
    borderRadius: 3,
  },
  committeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  avatarsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 10,
  },
  committeeSignText: {
    fontFamily: 'SourceSans3_400Regular',
    fontStyle: 'italic',
    fontSize: 12.5,
    color: '#57534E',
  },
  gotItButton: {
    backgroundColor: '#829A78',
    borderRadius: 9999,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gotItButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
