import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { useTheme } from '@theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { calculateJointAngles, getRelativeQuaternion, SensorDataRow } from '../utils/sensorCalculations';
import Avatar from '../components/Avatar';
import type { BodyOrientations } from '../components/Avatar';
import Slider from '@react-native-community/slider';
import * as THREE from 'three';

const screenWidth = Dimensions.get('window').width;

const MovellaScreen = () => {
    const { colors } = useTheme();
    const [fileName, setFileName] = useState<string | null>(null);
    const [sensorData, setSensorData] = useState<Record<string, SensorDataRow[]>>({});
    const [jointAngles, setJointAngles] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [bodyOrientations, setBodyOrientations] = useState<BodyOrientations>({});

    useEffect(() => {
        if (!sensorData || Object.keys(sensorData).length === 0) {
            return;
        }

        const fileKeys = Object.keys(sensorData);
        const getOrientationForFile = (fileIndex: number): THREE.Quaternion | undefined => {
            if (fileKeys.length <= fileIndex) {
                return undefined;
            }
            const dataPoint = sensorData[fileKeys[fileIndex]][currentFrame];
            if (!dataPoint) {
                return undefined;
            }
            
            const w = Number(dataPoint.Quat_W);
            const x = Number(dataPoint.Quat_X);
            const y = Number(dataPoint.Quat_Y);
            const z = Number(dataPoint.Quat_Z);

            if (![w, x, y, z].some(isNaN)) {
                return new THREE.Quaternion(x, y, z, w).normalize();
            }
            return undefined;
        };

        const pelvisQ = getOrientationForFile(0);
        const rightThighQ = getOrientationForFile(1);
        const rightShinQ = getOrientationForFile(2);
        const leftThighQ = getOrientationForFile(3);
        const leftShinQ = getOrientationForFile(4);

        if (!pelvisQ) {
            setBodyOrientations({});
            return;
        }

        const newOrientations: BodyOrientations = {
            pelvis: pelvisQ,
            rightThigh: rightThighQ ? getRelativeQuaternion(pelvisQ, rightThighQ) : undefined,
            rightShin: (rightThighQ && rightShinQ) ? getRelativeQuaternion(rightThighQ, rightShinQ) : undefined,
            leftThigh: leftThighQ ? getRelativeQuaternion(pelvisQ, leftThighQ) : undefined,
            leftShin: (leftThighQ && leftShinQ) ? getRelativeQuaternion(leftThighQ, leftShinQ) : undefined,
        };

        setBodyOrientations(newOrientations);

    }, [currentFrame, sensorData]);

    const handleFileUpload = async () => {
        setFileName(null);
        setSensorData({});
        setJointAngles([]);
        setCurrentFrame(0);
        setBodyOrientations({});

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/zip',
                copyToCacheDirectory: true,
            });

            if (result.canceled === false) {
                setIsLoading(true);
                setFileName(result.assets[0].name);
                await processZipFile(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick the document.');
        } finally {
            setIsLoading(false);
        }
    };

    const processZipFile = async (uri: string) => {
        try {
            const fileContent = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            
            const zip = await JSZip.loadAsync(fileContent, { base64: true });
            const parsedData: Record<string, SensorDataRow[]> = {};

            for (const a of Object.keys(zip.files)) {
                if (zip.files[a].name.endsWith('.csv') || zip.files[a].name.endsWith('.txt')) {
                    const csvData = await zip.files[a].async('text');
                    const { data } = Papa.parse<SensorDataRow>(csvData, { header: true, skipEmptyLines: true, dynamicTyping: true });
                    parsedData[zip.files[a].name] = data;
                }
            }
            
            setSensorData(parsedData);
            processSensorData(parsedData);
            Alert.alert('Success', `Successfully parsed ${Object.keys(parsedData).length} file(s) from the ZIP.`);
        } catch (error) {
            console.error('Error processing ZIP file:', error);
            Alert.alert('Error', 'Failed to process the ZIP file. It might be corrupted or in an unexpected format.');
        }
    };

    const processSensorData = (data: Record<string, SensorDataRow[]>) => {
        const fileKeys = Object.keys(data);
        if (fileKeys.length >= 2) {
            const angles = calculateJointAngles(data[fileKeys[0]], data[fileKeys[1]]);
            setJointAngles(angles);
        } else {
            setJointAngles([]);
            Alert.alert('Not Enough Data', 'At least two sensor data files are needed to calculate joint angles.');
        }
    };

    const renderDataPreview = () => {
        return Object.entries(sensorData).map(([fileName, data]) => (
            <View key={fileName} style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{fileName}</Text>
                <Text style={{ color: colors.textSecondary }}>{`Found ${data.length} rows of data.`}</Text>
                {data.length > 0 && data[0] && (
                    <Text style={{ color: colors.textSecondary, marginTop: 5, fontFamily: 'monospace' }}>
                        {`Columns: ${Object.keys(data[0]).join(', ')}`}
                    </Text>
                )}
            </View>
        ));
    };

    const renderAngleChart = () => {
        if (jointAngles.length === 0) {
            return null;
        }

        const chartData = {
            labels: jointAngles.map((_, index) => (index % 10 === 0 ? index.toString() : '')),
            datasets: [{
                data: jointAngles,
                strokeWidth: 2,
            }]
        };

        return (
            <View style={[styles.card, { backgroundColor: colors.card, marginTop: 20 }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Joint Angle vs. Time</Text>
                <LineChart
                    data={chartData}
                    width={screenWidth - 64}
                    height={220}
                    withInnerLines={false}
                    withOuterLines={false}
                    chartConfig={{
                        backgroundColor: colors.card,
                        backgroundGradientFrom: colors.card,
                        backgroundGradientTo: colors.card,
                        decimalPlaces: 1,
                        color: (opacity = 1) => colors.primary,
                        labelColor: (opacity = 1) => colors.textSecondary,
                    }}
                    bezier
                    style={styles.chart}
                />
            </View>
        );
    };

    const renderDigitalTwin = () => {
        const fileKeys = Object.keys(sensorData);
        if (fileKeys.length < 1) {
            return null;
        }

        const maxFrames = sensorData[fileKeys[0]]?.length - 1 || 0;

        return (
            <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Digital Twin</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Avatar orientations={bodyOrientations} />
                        {maxFrames > 0 && (
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={maxFrames}
                                step={1}
                                value={currentFrame}
                                onValueChange={setCurrentFrame}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor={colors.mediumGray}
                                thumbTintColor={colors.primary}
                            />
                        )}
                    <Text style={styles.frameText}>Frame: {currentFrame}</Text>
                </View>
            </>
        )
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.container}>
                <Text style={[styles.title, { color: colors.text }]}>Movella Data Analysis</Text>

                <TouchableOpacity 
                    style={[styles.uploadButton, { backgroundColor: colors.primary }]} 
                    onPress={handleFileUpload}
                    disabled={isLoading}
                >
                    <Ionicons name="cloud-upload-outline" size={22} color={colors.white} />
                    <Text style={[styles.uploadButtonText, { color: colors.white }]}>
                        {isLoading ? 'Processing...' : 'Upload .zip File'}
                    </Text>
                </TouchableOpacity>

                {fileName && !isLoading && (
                    <Text style={styles.fileNameText}>
                        Processed: <Text style={{ fontWeight: 'bold' }}>{fileName}</Text>
                    </Text>
                )}
                
                {Object.keys(sensorData).length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Parsed Data</Text>
                        {renderDataPreview()}
                        {renderAngleChart()}
                        {renderDigitalTwin()}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    uploadButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    uploadButtonText: {
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
    },
    fileNameText: {
        textAlign: 'center',
        marginTop: 15,
        fontSize: 14,
        color: '#6E6E73',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 10,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 5,
    },
    chart: {
        marginTop: 10,
        marginLeft: -15,
    },
    slider: {
        width: '100%',
        height: 40,
        marginTop: 10,
    },
    frameText: {
        textAlign: 'center',
        color: '#8E8E93',
        marginTop: 5,
    }
});

export default MovellaScreen; 