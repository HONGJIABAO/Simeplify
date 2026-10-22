import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LayoutGrid } from 'lucide-react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';

interface TidyUpSheetProps {
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function TidyUpSheet({ visible, onConfirm, onClose }: TidyUpSheetProps) {
  return <BottomSheet visible={visible} onClose={onClose} title="Tidy up this floor">
    <View style={styles.content}>
      <View style={styles.messageRow}>
        <LayoutGrid size={22} color="#566549" strokeWidth={1.6} />
        <Text style={styles.message}>Move the items on this floor to a tidy layout? They stay in their rooms.</Text>
      </View>
      <View style={styles.buttons}>
        <Button variant="secondary" onPress={onClose} style={styles.button}>Cancel</Button>
        <Button variant="primary" onPress={() => { onConfirm(); onClose(); }} style={styles.button}>Tidy up</Button>
      </View>
    </View>
  </BottomSheet>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 22, gap: 22 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  message: { flex: 1, fontFamily: 'SourceSans3_400Regular', fontSize: 15, lineHeight: 22, color: '#292524' },
  buttons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1 },
});
