import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { useTheme } from '@theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { calculateJointAngles, getRelativeQuaternion, SensorDataRow } from '../utils/sensorCalculations';
import Avatar, { BodyOrientations } from '../components/Avatar';
import Slider from '@react-native-community/slider';
import * as THREE from 'three';

const screenWidth = Dimensions.get('window').width;

const MovellaScreen = () => {
    const { colors } = useTheme();
    const [fileName, setFileName] = useState<string | null>(null);
    const [sensorData, setSensorData] = useState<Record<string, SensorDataRow[]>>({});
    const [jointAngles, setJointAngles] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [maxFrames, setMaxFrames] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [bodyOrientations, setBodyOrientations] = useState<BodyOrientations>({});
    const [horizontalRotation, setHorizontalRotation] = useState(0);
    const [verticalRotation, setVerticalRotation] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const animationFrameId = useRef<number | null>(null);
    const initialOrientations = useRef<Record<string, THREE.Quaternion | undefined>>({});

    useEffect(() => {
        // This effect runs once when sensorData is populated to capture the initial T-pose
        if (!sensorData || Object.keys(sensorData).length === 0) {
            initialOrientations.current = {};
            return;
        }

        const fileKeys = Object.keys(sensorData).sort();
        if (fileKeys.length < 5) return;

        const getInitialOrientation = (fileIndex: number): THREE.Quaternion | undefined => {
            const dataPoint = sensorData[fileKeys[fileIndex]]?.[0];
            if (!dataPoint) return undefined;
            
            if (dataPoint.Quat_W != null && dataPoint.Quat_X != null && dataPoint.Quat_Y != null && dataPoint.Quat_Z != null) {
                const { Quat_W: w, Quat_X: x, Quat_Y: y, Quat_Z: z } = dataPoint;
                if (![w, x, y, z].some(isNaN)) {
                     return new THREE.Quaternion(x, y, z, w).normalize();
                }
            }
            
            if (dataPoint.Euler_X != null && dataPoint.Euler_Y != null && dataPoint.Euler_Z != null) {
                const euler = new THREE.Euler(
                    THREE.MathUtils.degToRad(dataPoint.Euler_X),
                    THREE.MathUtils.degToRad(dataPoint.Euler_Y),
                    THREE.MathUtils.degToRad(dataPoint.Euler_Z),
                    'ZYX'
                );
                return new THREE.Quaternion().setFromEuler(euler);
            }

            return undefined;
        }
        
        const initials: Record<string, THREE.Quaternion | undefined> = {};
        for(let i = 0; i < 5; i++) {
            initials[i] = getInitialOrientation(i);
        }
        initialOrientations.current = initials;
        
    }, [sensorData]);

    useEffect(() => {
        if (!sensorData || Object.keys(sensorData).length < 5 || Object.keys(initialOrientations.current).length < 5) {
            return;
        }

        const getOrientationForFile = (fileIndex: number, frame: number): THREE.Quaternion | undefined => {
            const fileKeys = Object.keys(sensorData).sort();
            if (fileKeys.length <= fileIndex) {
                return undefined;
            }

            const dataPoint = sensorData[fileKeys[fileIndex]][frame];
            if (!dataPoint) {
                return undefined;
            }
            
            if (dataPoint.Quat_W != null && dataPoint.Quat_X != null && dataPoint.Quat_Y != null && dataPoint.Quat_Z != null) {
                const { Quat_W: w, Quat_X: x, Quat_Y: y, Quat_Z: z } = dataPoint;
                if (![w, x, y, z].some(isNaN)) {
                    return new THREE.Quaternion(x, y, z, w).normalize();
                }
            }

            if (dataPoint.Euler_X != null && dataPoint.Euler_Y != null && dataPoint.Euler_Z != null) {
                const euler = new THREE.Euler(
                    THREE.MathUtils.degToRad(dataPoint.Euler_X),
                    THREE.MathUtils.degToRad(dataPoint.Euler_Y),
                    THREE.MathUtils.degToRad(dataPoint.Euler_Z),
                    'ZYX' 
                );
                return new THREE.Quaternion().setFromEuler(euler);
            }
            
            return undefined;
        };
        
        // Sensor Mapping based on user request and sorted file names:
        // 0: Chest (Spine) -> Torso
        // 1: Right Upper Arm
        // 2: Right Forearm
        // 3: Right Thigh
        // 4: Right Shin
        const s1_t = getOrientationForFile(0, currentFrame);
        const s2_t = getOrientationForFile(1, currentFrame);
        const s3_t = getOrientationForFile(2, currentFrame);
        const s4_t = getOrientationForFile(3, currentFrame);
        const s5_t = getOrientationForFile(4, currentFrame);

        const s1_0 = initialOrientations.current[0];
        const s2_0 = initialOrientations.current[1];
        const s3_0 = initialOrientations.current[2];
        const s4_0 = initialOrientations.current[3];
        const s5_0 = initialOrientations.current[4];
        
        if (!s1_0 || !s2_0 || !s3_0 || !s4_0 || !s5_0 || !s1_t || !s2_t || !s3_t || !s4_t || !s5_t) {
            return; // Not all data is available or calibrated
        }
        
        // Calibrated orientations (delta from T-Pose)
        const delta1 = s1_0.clone().invert().multiply(s1_t); // Torso
        const delta2 = s2_0.clone().invert().multiply(s2_t); // R Upper Arm
        const delta3 = s3_0.clone().invert().multiply(s3_t); // R Forearm
        const delta4 = s4_0.clone().invert().multiply(s4_t); // R Thigh
        const delta5 = s5_0.clone().invert().multiply(s5_t); // R Shin
        
        // Calculate local rotations for the avatar's hierarchy
        const newOrientations: BodyOrientations = {
            pelvis: new THREE.Quaternion(), // Static root
            torso: delta1,
            rightUpperArm: delta1.clone().invert().multiply(delta2),
            rightForearm: delta2.clone().invert().multiply(delta3),
            rightThigh: delta4, // Local rotation is same as calibrated global, since parent (pelvis) is static
            rightShin: delta4.clone().invert().multiply(delta5)
        };
        
        setBodyOrientations(newOrientations);

    }, [currentFrame, sensorData]);

    useEffect(() => {
        const fileKeys = Object.keys(sensorData);
        if (fileKeys.length === 0) {
            return;
        }

        const maxFramesValue = sensorData[fileKeys[0]]?.length - 1 || 0;

        const animate = () => {
            setCurrentFrame(prevFrame => {
                const nextFrame = prevFrame + 1;
                if (nextFrame > maxFramesValue) {
                    setIsPlaying(false);
                    return prevFrame;
                }
                return nextFrame;
            });
            animationFrameId.current = requestAnimationFrame(animate);
        };

        if (isPlaying) {
                    animationFrameId.current = requestAnimationFrame(animate);
                }
        else if (animationFrameId.current) {
                        cancelAnimationFrame(animationFrameId.current);
                    }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isPlaying, sensorData]);

    const handleFileUpload = async () => {
        setIsPlaying(false);
        setFileName(null);
        setSensorData({});
        setJointAngles([]);
        setCurrentFrame(0);
        setBodyOrientations({});
        setHorizontalRotation(0);
        setVerticalRotation(0);
        initialOrientations.current = {};

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
                    let csvData = await zip.files[a].async('text');
                    
                    // Find header row and slice the data from there to ignore metadata
                    const headerIndex = csvData.indexOf('PacketCounter');
                    if (headerIndex !== -1) {
                        csvData = csvData.substring(headerIndex);
                    }

                    const { data } = Papa.parse<SensorDataRow>(csvData, { 
                        header: true, 
                        skipEmptyLines: true, 
                        dynamicTyping: true,
                    });

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

        const maxFramesValue = sensorData[fileKeys[0]]?.length - 1 || 0;

        return (
            <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Digital Twin</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Avatar 
                        orientations={bodyOrientations}
                        horizontalRotation={horizontalRotation}
                        verticalRotation={verticalRotation}
                    />
                    <View style={styles.controlsContainer}>
                        <TouchableOpacity
                            onPress={() => {
                                if (currentFrame >= maxFramesValue) {
                                    setCurrentFrame(0);
                                }
                                setIsPlaying(true);
                            }}
                            disabled={isPlaying}
                        >
                            <Ionicons name="play" size={32} color={isPlaying ? colors.mediumGray : colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsPlaying(false)} disabled={!isPlaying}>
                            <Ionicons name="pause" size={32} color={!isPlaying ? colors.mediumGray : colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setIsPlaying(false);
                                setCurrentFrame(0);
                            }}
                        >
                            <Ionicons name="refresh" size={32} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    {maxFramesValue > 0 && (
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={maxFramesValue}
                            step={1}
                            value={currentFrame}
                            onValueChange={(value) => {
                                setIsPlaying(false);
                                setCurrentFrame(Math.floor(value));
                            }}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.mediumGray}
                            thumbTintColor={colors.primary}
                        />
                    )}
                    <Text style={styles.frameText}>Frame: {currentFrame} / {maxFramesValue}</Text>
                    
                    <Slider
                        style={styles.slider}
                        minimumValue={-180}
                        maximumValue={180}
                        value={horizontalRotation}
                        onValueChange={setHorizontalRotation}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor={colors.mediumGray}
                        thumbTintColor={colors.primary}
                    />
                    <Text style={styles.frameText}>Horizontal: {horizontalRotation.toFixed(0)}°</Text>
                    
                    <Slider
                        style={styles.slider}
                        minimumValue={-90}
                        maximumValue={90}
                        value={verticalRotation}
                        onValueChange={setVerticalRotation}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor={colors.mediumGray}
                        thumbTintColor={colors.primary}
                    />
                    <Text style={styles.frameText}>Vertical: {verticalRotation.toFixed(0)}°</Text>
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
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginVertical: 15,
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
    },
    button: {
        marginBottom: 10,
    },
    chartContainer: {
        marginTop: 20,
    },
    sliderContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    sliderLabel: {
        fontSize: 16,
        color: '#666',
    },
    sliderValue: {
        marginTop: 5,
        fontSize: 14,
        color: '#333',
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
});

export default MovellaScreen; 