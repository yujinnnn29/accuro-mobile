import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Rect, Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LineChartData {
  labels: string[];
  data: number[];
}

interface LineChartProps {
  data: LineChartData;
  height?: number;
  color?: string;
  showDots?: boolean;
  showLabels?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = colors.primary[600],
  showDots = true,
  showLabels = true,
}) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = height - 40;
  const paddingX = 30;
  const paddingY = 20;

  // Handle empty data
  const chartData = data?.data?.length > 0 ? data.data.filter(v => typeof v === 'number' && !isNaN(v)) : [0];
  const chartLabels = data?.labels || [];

  const maxValue = Math.max(...chartData, 1);
  const minValue = Math.min(...chartData, 0);
  const range = maxValue - minValue || 1;

  const getX = (index: number) => {
    const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
    return paddingX + (index / divisor) * (chartWidth - paddingX * 2);
  };

  const getY = (value: number) => {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    return paddingY + chartHeight - ((safeValue - minValue) / range) * chartHeight;
  };

  const pathData = chartData
    .map((value, index) => {
      const x = getX(index);
      const y = getY(value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Fill area path
  const fillPathData = `${pathData} L ${getX(chartData.length - 1)} ${paddingY + chartHeight} L ${getX(0)} ${paddingY + chartHeight} Z`;

  return (
    <View style={[styles.chartContainer, { height }]}>
      <Svg width={chartWidth} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <G key={i}>
            <Line
              x1={paddingX}
              y1={paddingY + chartHeight * ratio}
              x2={chartWidth - paddingX}
              y2={paddingY + chartHeight * ratio}
              stroke={colors.gray[200]}
              strokeWidth="1"
              strokeDasharray="4"
            />
            <SvgText
              x={paddingX - 8}
              y={paddingY + chartHeight * ratio + 4}
              fontSize="10"
              fill={colors.gray[400]}
              textAnchor="end"
            >
              {Math.round(maxValue - (maxValue - minValue) * ratio)}
            </SvgText>
          </G>
        ))}

        {/* Fill area */}
        <Path d={fillPathData} fill={color + '20'} />

        {/* Line */}
        <Path d={pathData} stroke={color} strokeWidth="2" fill="none" />

        {/* Dots */}
        {showDots &&
          chartData.map((value, index) => (
            <Circle
              key={index}
              cx={getX(index)}
              cy={getY(value)}
              r="4"
              fill={colors.white}
              stroke={color}
              strokeWidth="2"
            />
          ))}

        {/* X-axis labels */}
        {showLabels &&
          chartLabels.map((label, index) => (
            <SvgText
              key={index}
              x={getX(index)}
              y={height - 5}
              fontSize="10"
              fill={colors.gray[500]}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
};

interface BarChartData {
  labels: string[];
  data: number[];
  colors?: string[];
}

interface BarChartProps {
  data: BarChartData;
  height?: number;
  barColor?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  barColor = colors.primary[600],
}) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = height - 50;
  const paddingX = 40;
  const paddingY = 20;

  // Handle empty data
  const chartData = data?.data?.length > 0 ? data.data.filter(v => typeof v === 'number' && !isNaN(v)) : [0];
  const chartLabels = data?.labels || [];
  const chartColors = data?.colors || [];

  const maxValue = Math.max(...chartData, 1);
  const barWidth = Math.max((chartWidth - paddingX * 2) / (chartData.length || 1) - 8, 10);

  return (
    <View style={[styles.chartContainer, { height }]}>
      <Svg width={chartWidth} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <G key={i}>
            <Line
              x1={paddingX}
              y1={paddingY + chartHeight * ratio}
              x2={chartWidth - paddingX}
              y2={paddingY + chartHeight * ratio}
              stroke={colors.gray[200]}
              strokeWidth="1"
              strokeDasharray="4"
            />
            <SvgText
              x={paddingX - 8}
              y={paddingY + chartHeight * ratio + 4}
              fontSize="10"
              fill={colors.gray[400]}
              textAnchor="end"
            >
              {Math.round(maxValue * (1 - ratio))}
            </SvgText>
          </G>
        ))}

        {/* Bars */}
        {chartData.map((value, index) => {
          const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
          const barHeight = (safeValue / maxValue) * chartHeight;
          const x = paddingX + index * ((chartWidth - paddingX * 2) / (chartData.length || 1)) + 4;
          const y = paddingY + chartHeight - barHeight;
          const barFillColor = chartColors[index] || barColor;

          return (
            <G key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barFillColor}
                rx="4"
              />
              <SvgText
                x={x + barWidth / 2}
                y={height - 5}
                fontSize="10"
                fill={colors.gray[500]}
                textAnchor="middle"
              >
                {chartLabels[index] || ''}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

interface DonutChartData {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 150,
  strokeWidth = 20,
  centerLabel,
  centerValue,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Handle empty or invalid data
  const chartData = Array.isArray(data) ? data.filter(item => item && typeof item.value === 'number' && !isNaN(item.value)) : [];
  const total = chartData.reduce((sum, item) => sum + (item.value || 0), 0) || 1;

  let currentAngle = -90; // Start from top

  return (
    <View style={styles.donutContainer}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.gray[200]}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Data segments */}
        {chartData.map((item, index) => {
          const percentage = (item.value || 0) / total;
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const rotation = currentAngle;
          currentAngle += percentage * 360;

          return (
            <Circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={item.color || colors.gray[300]}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              fill="none"
              rotation={rotation}
              origin={`${size / 2}, ${size / 2}`}
            />
          );
        })}

        {/* Center text */}
        {(centerLabel || centerValue !== undefined) && (
          <G>
            {centerValue !== undefined && (
              <SvgText
                x={size / 2}
                y={size / 2}
                fontSize="24"
                fontWeight="bold"
                fill={colors.gray[900]}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {centerValue}
              </SvgText>
            )}
            {centerLabel && (
              <SvgText
                x={size / 2}
                y={size / 2 + 18}
                fontSize="12"
                fill={colors.gray[500]}
                textAnchor="middle"
              >
                {centerLabel}
              </SvgText>
            )}
          </G>
        )}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color || colors.gray[300] }]} />
            <Text style={styles.legendLabel}>{item.label || ''}</Text>
            <Text style={styles.legendValue}>{item.value || 0}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color = colors.primary[600],
}) => {
  return (
    <View style={styles.metricCard}>
      {icon && (
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
      )}
      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {change !== undefined && (
          <View style={styles.changeContainer}>
            <Text
              style={[
                styles.changeText,
                { color: change >= 0 ? colors.success : colors.error },
              ]}
            >
              {change >= 0 ? '+' : ''}{change}%
            </Text>
            <Text style={styles.changeLabel}>vs last period</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
  },
  donutContainer: {
    alignItems: 'center',
  },
  legend: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 13,
    color: colors.gray[600],
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[900],
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricContent: {},
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  metricTitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 11,
    color: colors.gray[400],
  },
});

export default {
  LineChart,
  BarChart,
  DonutChart,
  MetricCard,
};
