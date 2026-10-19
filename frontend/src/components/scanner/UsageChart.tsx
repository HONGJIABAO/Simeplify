import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { TrendingDown } from 'lucide-react-native';
import { Card } from '../Card';
import { SegmentedControl, type SegmentOption } from '../SegmentedControl';
import { MONTHLY_USAGE_DATA, type MonthlyUsageItem } from '@/lib/mockData';
import { formatMoney } from '@/lib/formatters';

export type ChartFilter = 'All' | 'Electricity' | 'Water';

const FILTER_OPTIONS: SegmentOption<ChartFilter>[] = [
  { label: 'All', value: 'All' },
  { label: 'Electricity', value: 'Electricity' },
  { label: 'Water', value: 'Water' },
];

export interface UsageChartProps {
  data?: MonthlyUsageItem[];
  onSelectMonth?: (item: MonthlyUsageItem) => void;
}

export function UsageChart({ data = MONTHLY_USAGE_DATA, onSelectMonth }: UsageChartProps) {
  const [filter, setFilter] = useState<ChartFilter>('All');
  const [selectedMonth, setSelectedMonth] = useState<MonthlyUsageItem | null>(
    data[data.length - 1] ?? null
  );

  const maxVal = Math.max(...data.map((d) => Math.max(d.electricityRm, d.waterRm, d.totalRm / 2)));
  const CHART_HEIGHT = 140;

  const handleMonthPress = (item: MonthlyUsageItem) => {
    setSelectedMonth(item);
    onSelectMonth?.(item);
  };

  return (
    <Card style={styles.card}>
      {/* Top Header Row with Title & Segmented Filter */}
      <View style={styles.topRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.title}>Monthly Usage</Text>
          <Text style={styles.subtitle}>Past 5 billing cycles</Text>
        </View>

        <SegmentedControl
          options={FILTER_OPTIONS}
          selectedValue={filter}
          onChange={setFilter}
          style={styles.segmentedControl}
        />
      </View>

      {/* Chart Section */}
      <View style={styles.chartWrapper}>
        {/* Horizontal subtle gridline */}
        <View style={styles.gridLine} />

        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const isOctAnomaly = item.waterAlertLevel === 'leak_detected';
            const isSelected = selectedMonth?.month === item.month;

            // Height scaling
            const elecHeight = Math.max(16, (item.electricityRm / (maxVal * 1.25)) * CHART_HEIGHT);
            const waterHeight = Math.max(12, (item.waterRm / (maxVal * 1.25)) * CHART_HEIGHT * 2.2);

            const showElec = filter === 'All' || filter === 'Electricity';
            const showWater = filter === 'All' || filter === 'Water';

            return (
              <Pressable
                key={item.month}
                onPress={() => handleMonthPress(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} bill total ${formatMoney(item.totalRm)}`}
                style={[styles.monthColumn, isSelected && styles.monthColumnSelected]}
              >
                {/* Spend amount label above bars */}
                <View style={styles.amountLabelContainer}>
                  <Text
                    style={[
                      styles.amountLabel,
                      isOctAnomaly && styles.anomalyAmountLabel,
                      isSelected && styles.selectedAmountLabel,
                    ]}
                  >
                    {formatMoney(item.totalRm)}
                  </Text>
                  {isOctAnomaly && <Text style={styles.spikeTriangle}>▲</Text>}
                </View>

                {/* Bars Pair */}
                <View style={styles.barsGroup}>
                  {showElec && (
                    <View
                      style={[
                        styles.bar,
                        styles.elecBar,
                        { height: elecHeight },
                        isSelected && styles.barHighlight,
                      ]}
                    />
                  )}
                  {showWater && (
                    <View
                      style={[
                        styles.bar,
                        styles.waterBar,
                        { height: waterHeight },
                        isOctAnomaly && styles.anomalyWaterBar,
                        isSelected && styles.barHighlight,
                      ]}
                    />
                  )}
                </View>

                {/* Month Label */}
                <Text
                  style={[
                    styles.monthText,
                    isSelected && styles.monthTextSelected,
                    isOctAnomaly && styles.anomalyMonthText,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Interactive Detail Box when month tapped */}
      {selectedMonth && (
        <View style={styles.detailRow}>
          <Text style={styles.detailText}>
            <Text style={styles.detailBold}>{selectedMonth.label}: </Text>
            Electricity {formatMoney(selectedMonth.electricityRm)} ({selectedMonth.electricityKwh} kWh)
            {' · '}
            Water {formatMoney(selectedMonth.waterRm)} ({selectedMonth.waterM3} m³)
          </Text>
        </View>
      )}

      {/* Legend Row */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.elecDot]} />
          <Text style={styles.legendLabel}>Electricity (TNB)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.waterDot]} />
          <Text style={styles.legendLabel}>Water (Air Selangor)</Text>
        </View>
      </View>

      {/* Benchmark Nested Callout Box */}
      <View style={styles.calloutBox}>
        <View style={styles.calloutIconCircle}>
          <TrendingDown size={16} color="#566549" strokeWidth={2} />
        </View>
        <Text style={styles.calloutText}>
          Usage is 12% lower than similar 3-bedroom terrace homes in your district.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 8,
  },
  titleColumn: {
    flexShrink: 1,
  },
  title: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    marginTop: 2,
  },
  segmentedControl: {
    minWidth: 180,
  },
  chartWrapper: {
    position: 'relative',
    height: 190,
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingTop: 20,
  },
  gridLine: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e7e5e4',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  monthColumn: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  monthColumnSelected: {
    backgroundColor: '#f5f5f4',
  },
  amountLabelContainer: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
  },
  amountLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#57534e',
  },
  selectedAmountLabel: {
    color: '#292524',
    fontFamily: 'SourceSans3_700Bold',
  },
  anomalyAmountLabel: {
    color: '#b91c1c',
    fontFamily: 'SourceSans3_700Bold',
  },
  spikeTriangle: {
    fontSize: 7,
    color: '#b91c1c',
    marginTop: -2,
  },
  barsGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginVertical: 6,
    height: 120,
    justifyContent: 'center',
  },
  bar: {
    width: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barHighlight: {
    opacity: 1,
  },
  elecBar: {
    backgroundColor: '#d4a373', // tan-400 / #D49B6A
  },
  waterBar: {
    backgroundColor: '#6f8260', // sage-500 / #697D58
  },
  anomalyWaterBar: {
    backgroundColor: '#566549',
  },
  monthText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
    marginTop: 2,
  },
  monthTextSelected: {
    color: '#292524',
    fontFamily: 'SourceSans3_600SemiBold',
  },
  anomalyMonthText: {
    color: '#292524',
  },
  detailRow: {
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: 'center',
  },
  detailText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
  },
  detailBold: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  elecDot: {
    backgroundColor: '#d4a373',
  },
  waterDot: {
    backgroundColor: '#6f8260',
  },
  legendLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
  },
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f1ea',
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  calloutIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d6e5c8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#44403c',
    flex: 1,
    lineHeight: 16,
  },
});
