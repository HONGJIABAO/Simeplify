import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Polyline, Circle, G } from 'react-native-svg';
import { Card } from '../Card';
import { SegmentedControl, type SegmentOption } from '../SegmentedControl';
import { type MonthlyChartDataPoint } from '@/lib/services/scannerService';
import { formatMoney } from '@/lib/formatters';

export type ChartFilter = 'All' | 'Electricity' | 'Water';

const FILTER_OPTIONS: SegmentOption<ChartFilter>[] = [
  { label: 'All', value: 'All' },
  { label: 'Electricity', value: 'Electricity' },
  { label: 'Water', value: 'Water' },
];

export interface UsageChartProps {
  data?: MonthlyChartDataPoint[];
  onSelectMonth?: (item: MonthlyChartDataPoint) => void;
  selectedMonthKey?: string | null;
}

export function UsageChart({ data = [], onSelectMonth, selectedMonthKey }: UsageChartProps) {
  const [filter, setFilter] = useState<ChartFilter>('All');
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(
    selectedMonthKey ?? (data.length > 0 ? data[data.length - 1].month : null)
  );

  const selectedItem = data.find((d) => d.month === (selectedMonthKey ?? activeMonthKey)) ?? data[data.length - 1] ?? null;

  const handleMonthPress = (item: MonthlyChartDataPoint) => {
    setActiveMonthKey(item.month);
    onSelectMonth?.(item);
  };

  if (!data || data.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Monthly usage</Text>
          <Text style={styles.subtitle}>Past 6 billing cycles</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Upload your bills to visualize 6-month consumption trends.</Text>
        </View>
      </Card>
    );
  }

  // Calculate scaling
  const maxElec = Math.max(...data.map((d) => d.electricityRm), 10);
  const maxWater = Math.max(...data.map((d) => d.waterRm), 10);
  const maxSpend = filter === 'All'
    ? Math.max(...data.map((d) => Math.max(d.electricityRm, d.waterRm * 2, d.totalRm * 0.7)), 50)
    : filter === 'Electricity'
    ? maxElec
    : maxWater;

  const CHART_WIDTH = 320;
  const CHART_HEIGHT = 130;
  const BASELINE_Y = 110;
  const colWidth = CHART_WIDTH / data.length;
  const barWidth = 12;

  // Build trend points
  const trendPoints: { x: number; y: number }[] = [];

  return (
    <Card style={styles.card}>
      {/* Title block */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Monthly usage</Text>
        <Text style={styles.subtitle}>Past 6 billing cycles</Text>
      </View>

      {/* Filter row placed on its own row under title (page_refined.md S7.1) */}
      <View style={styles.filterRow}>
        <SegmentedControl
          options={FILTER_OPTIONS}
          selectedValue={filter}
          onChange={setFilter}
          style={styles.segmentedControl}
        />
      </View>

      {/* SVG Chart */}
      <View style={styles.svgWrapper}>
        <Svg width="100%" height={CHART_HEIGHT + 24} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 24}`}>
          {/* Subtle Gridlines */}
          <Line x1="0" y1="35" x2={CHART_WIDTH} y2="35" stroke="#e7e5e4" strokeWidth="1" strokeDasharray="3,3" />
          <Line x1="0" y1="75" x2={CHART_WIDTH} y2="75" stroke="#e7e5e4" strokeWidth="1" strokeDasharray="3,3" />
          <Line x1="0" y1={BASELINE_Y} x2={CHART_WIDTH} y2={BASELINE_Y} stroke="#d6d3d1" strokeWidth="1" />

          {/* Render Bars for each month */}
          {data.map((item, idx) => {
            const centerX = idx * colWidth + colWidth / 2;
            const isSelected = selectedItem?.month === item.month;

            const elecHeight = Math.max(6, (item.electricityRm / (maxSpend * 1.15)) * (BASELINE_Y - 20));
            const waterHeight = Math.max(6, (item.waterRm / (maxSpend * 0.5 || 25)) * (BASELINE_Y - 20));

            const showElec = filter === 'All' || filter === 'Electricity';
            const showWater = filter === 'All' || filter === 'Water';

            // Trend point for this month
            let trendVal = item.totalRm;
            if (filter === 'Electricity') trendVal = item.electricityRm;
            if (filter === 'Water') trendVal = item.waterRm;
            const trendHeight = Math.max(8, (trendVal / (maxSpend * 1.15)) * (BASELINE_Y - 20));
            const trendY = Math.max(16, BASELINE_Y - trendHeight);
            trendPoints.push({ x: centerX, y: trendY });

            return (
              <G key={item.month}>
                {/* Column highlight area when selected */}
                {isSelected && (
                  <Rect
                    x={centerX - colWidth / 2 + 4}
                    y={10}
                    width={colWidth - 8}
                    height={BASELINE_Y + 16}
                    rx={12}
                    fill="#f5f5f4"
                  />
                )}

                {/* Electricity Bar (tan-400 / #d4a373) */}
                {showElec && (
                  <Rect
                    x={showWater ? centerX - barWidth - 2 : centerX - barWidth / 2}
                    y={BASELINE_Y - elecHeight}
                    width={barWidth}
                    height={elecHeight}
                    rx={4}
                    fill="#d4a373"
                    opacity={isSelected ? 1 : 0.88}
                  />
                )}

                {/* Water Bar (sage-500 / #6f8260) */}
                {showWater && (
                  <Rect
                    x={showElec ? centerX + 2 : centerX - barWidth / 2}
                    y={BASELINE_Y - waterHeight}
                    width={barWidth}
                    height={waterHeight}
                    rx={4}
                    fill={item.waterAlertLevel && item.waterAlertLevel !== 'normal' ? '#8F5B14' : '#6f8260'}
                    opacity={isSelected ? 1 : 0.88}
                  />
                )}
              </G>
            );
          })}

          {/* Trend Line (react-native-svg Polyline) */}
          {trendPoints.length > 1 && (
            <Polyline
              points={trendPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#8c857b"
              strokeWidth="2"
              strokeDasharray="4,3"
            />
          )}

          {/* Trend dots */}
          {trendPoints.map((p, i) => (
            <Circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={selectedItem?.month === data[i].month ? 4.5 : 3}
              fill={selectedItem?.month === data[i].month ? '#292524' : '#78716c'}
            />
          ))}
        </Svg>

        {/* Month labels and touch hit areas under SVG */}
        <View style={styles.labelsRow}>
          {data.map((item) => {
            const isSelected = selectedItem?.month === item.month;
            return (
              <Pressable
                key={item.month}
                onPress={() => handleMonthPress(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} bill statement`}
                style={[styles.monthLabelBtn, isSelected && styles.monthLabelBtnSelected]}
              >
                <Text style={[styles.monthLabelText, isSelected && styles.monthLabelTextSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected Month Detail Strip (page_refined.md S7.1 proposal) */}
      {selectedItem && (
        <View style={styles.detailRow}>
          <Text style={styles.detailText}>
            <Text style={styles.detailBold}>{selectedItem.label}: </Text>
            Electricity {formatMoney(selectedItem.electricityRm)} ({selectedItem.electricityKwh} kWh)
            {' · '}
            Water {formatMoney(selectedItem.waterRm)} ({selectedItem.waterM3} m³)
          </Text>
        </View>
      )}

      {/* Legend Row */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.elecDot]} />
          <Text style={styles.legendLabel}>Electricity</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.waterDot]} />
          <Text style={styles.legendLabel}>Water</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, styles.trendDash]} />
          <Text style={styles.legendLabel}>Trend</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 16,
  },
  titleRow: {
    marginBottom: 12,
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
  filterRow: {
    marginBottom: 16,
  },
  segmentedControl: {
    width: '100%',
  },
  svgWrapper: {
    width: '100%',
    position: 'relative',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  monthLabelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  monthLabelBtnSelected: {
    backgroundColor: '#eae5dc',
  },
  monthLabelText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716c',
  },
  monthLabelTextSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#292524',
  },
  detailRow: {
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
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
    gap: 18,
    marginTop: 14,
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
  legendDash: {
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  elecDot: {
    backgroundColor: '#d4a373',
  },
  waterDot: {
    backgroundColor: '#6f8260',
  },
  trendDash: {
    backgroundColor: '#8c857b',
  },
  legendLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#78716c',
    textAlign: 'center',
  },
});
