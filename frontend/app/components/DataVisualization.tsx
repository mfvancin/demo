import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../theme/ThemeContext';

interface DataVisualizationProps {
    analysisResult: {
        exerciseType: 'Squat' | 'Leg Knee Extension';
        jointAngles: number[];
        metrics: {
            repetitionCount: number;
            maxFlexionAngle: number;
            maxExtensionAngle: number;
        };
    };
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ analysisResult }) => {
    const { colors } = useTheme();
    const { exerciseType, jointAngles, metrics } = analysisResult;

    const chartData = {
        labels: jointAngles.map((_, i) => (i % 20 === 0 ? `${i}` : '')), 
        datasets: [
            {
                data: jointAngles,
                color: (opacity = 1) => colors.primary,
                strokeWidth: 2,
            },
        ],
        legend: ['Knee Angle (°)',],
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>{exerciseType} Analysis</Text>
            <LineChart
                data={chartData}
                width={Dimensions.get('window').width - 64}
                height={220}
                yAxisSuffix="°"
                chartConfig={{
                    backgroundColor: colors.card,
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                        borderRadius: 16,
                    },
                }}
                bezier
                style={styles.chart}
            />
            <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>{metrics.repetitionCount}</Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Repetitions</Text>
                </View>
                <View style={styles.metricItem}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>{metrics.maxFlexionAngle.toFixed(1)}°</Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Max Flexion</Text>
                </View>
                <View style={styles.metricItem}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>{metrics.maxExtensionAngle.toFixed(1)}°</Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Max Extension</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
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
    metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
    },
    metricItem: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    metricLabel: {
        fontSize: 14,
        marginTop: 4,
    },
});

export default DataVisualization; 