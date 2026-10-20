import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Sparkles, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react-native';

interface DevStatePillProps {
  onSelectState: (stateIndex: number) => void;
  onReset: () => void;
  currentState: string;
}

export function DevStatePill({
  onSelectState,
  onReset,
  currentState,
}: DevStatePillProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.floatingContainer}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={styles.pillButton}
      >
        <Sparkles size={14} color="#566549" strokeWidth={2} />
        <Text style={styles.pillText}>Quick Demo: {currentState}</Text>
        {expanded ? (
          <ChevronDown size={14} color="#566549" strokeWidth={2} />
        ) : (
          <ChevronUp size={14} color="#566549" strokeWidth={2} />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.expandedPanel}>
          <Text style={styles.panelTitle}>Interactive State Navigator</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buttonsRow}>
            <Pressable
              onPress={() => {
                onSelectState(1);
                setExpanded(false);
              }}
              style={styles.stateBtn}
            >
              <Text style={styles.stateBtnText}>1. New Letter</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onSelectState(2);
                setExpanded(false);
              }}
              style={styles.stateBtn}
            >
              <Text style={styles.stateBtnText}>2. Voting Modal</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onSelectState(3);
                setExpanded(false);
              }}
              style={styles.stateBtn}
            >
              <Text style={styles.stateBtnText}>3. Voted (Waiting)</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onSelectState(5);
                setExpanded(false);
              }}
              style={styles.stateBtn}
            >
              <Text style={styles.stateBtnText}>5. Living Leaf</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onSelectState(6);
                setExpanded(false);
              }}
              style={styles.stateBtn}
            >
              <Text style={styles.stateBtnText}>6. Reward Unlocked</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onSelectState(7);
                setExpanded(false);
              }}
              style={styles.stateBtn}
            >
              <Text style={styles.stateBtnText}>Group 2. Audit</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onSelectState(8);
                setExpanded(false);
              }}
              style={styles.stateBtn}
            >
              <Text style={styles.stateBtnText}>Oakridge Stats</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onReset();
                setExpanded(false);
              }}
              style={[styles.stateBtn, styles.resetBtn]}
            >
              <RotateCcw size={12} color="#A8442F" strokeWidth={2} />
              <Text style={styles.resetBtnText}>Reset</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5ECE0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#C5D4BF',
  },
  pillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#425438',
  },
  expandedPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EAE7E0',
    width: '100%',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  panelTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#78716C',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonsRow: {
    gap: 6,
  },
  stateBtn: {
    backgroundColor: '#F0EDE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  stateBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#292524',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FBECE8',
  },
  resetBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#A8442F',
  },
});
