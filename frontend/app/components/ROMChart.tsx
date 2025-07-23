import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

interface ROMChartProps {
  jointAngles: number[];
}

const ROMChart: React.FC<ROMChartProps> = ({ jointAngles }) => {
    const { colors } = useTheme();

    if (!jointAngles || jointAngles.length === 0) {
        return (
            <View style={styles.placeholder}>
                <Ionicons name="analytics-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    No data to display.
                </Text>
            </View>
        );
    }

    const romMax = Math.max(...jointAngles);
    const romMin = Math.min(...jointAngles);
    const romAvg = jointAngles.reduce((a, b) => a + b, 0) / jointAngles.length;

    const chartData = {
        labels: [],
        datasets: [{
            data: jointAngles,
            color: (opacity = 1) => colors.purple[500],
            strokeWidth: 2
        }]
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Range of Motion (ROM)</Text>
            <LineChart
                data={chartData}
                width={screenWidth - 64}
                height={200}
                yAxisSuffix="°"
                withInnerLines={false}
                withOuterLines={false}
                withShadow={false}
                chartConfig={{
                    backgroundColor: colors.card,
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => colors.purple[500],
                    labelColor: (opacity = 1) => colors.textSecondary,
                    propsForDots: { r: "0" },
                }}
                bezier
                style={styles.chart}
            />
            <View style={styles.table}>
                <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.tableCell, styles.tableHeader, { color: colors.textSecondary }]}>Metric</Text>
                    <Text style={[styles.tableCell, styles.tableHeader, { color: colors.textSecondary, textAlign: 'right' }]}>Value</Text>
                </View>
                <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.tableCell, { color: colors.text }]}>Max ROM</Text>
                    <Text style={[styles.tableCell, { color: colors.text, textAlign: 'right' }]}>{romMax.toFixed(1)}°</Text>
                </View>
                <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.tableCell, { color: colors.text }]}>Min ROM</Text>
                    <Text style={[styles.tableCell, { color: colors.text, textAlign: 'right' }]}>{romMin.toFixed(1)}°</Text>
                </View>
                <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.tableCell, { color: colors.text }]}>Average ROM</Text>
                    <Text style={[styles.tableCell, { color: colors.text, textAlign: 'right' }]}>{romAvg.toFixed(1)}°</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    table: {
        marginTop: 16,
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    tableCell: {
        fontSize: 16,
    },
    tableHeader: {
        fontSize: 14,
        fontWeight: '600',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 12,
        minHeight: 150,
    },
    placeholderText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
});

export default ROMChart; 