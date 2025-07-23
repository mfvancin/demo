import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, SafeAreaView } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LineChart } from 'react-native-chart-kit';
import Avatar, { BodyOrientations } from '@components/Avatar';
import movementService from '@services/movementService';
import { SegmentOrientation } from '../types';
import * as THREE from 'three';
import JSZip from 'jszip';
import Papa from 'papaparse';

interface SensorData {
    Quat_W?: number;
    Quat_X?: number;
    Quat_Y?: number;
    Quat_Z?: number;
    Euler_X?: number;
    Euler_Y?: number;
    Euler_Z?: number;
    [key: string]: number | undefined;
}

interface RealtimeData {
    name: string;
    orientation?: SegmentOrientation;
    accel?: { x?: number; y?: number; z?: number };
    gyro?: { x?: number; y?: number; z?: number };
}

const MovellaScreen = () => {
    const { colors } = useTheme();
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [maxFramesValue, setMaxFramesValue] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentOrientations, setCurrentOrientations] = useState<BodyOrientations>({});
    const [sensorData, setSensorData] = useState<Record<string, SensorData[]>>({});
    const [horizontalRotation, setHorizontalRotation] = useState(0);
    const [verticalRotation, setVerticalRotation] = useState(0);

    const createSegmentOrientation = (qx: number, qy: number, qz: number, qw: number): SegmentOrientation => {
        return { qx, qy, qz, qw };
    };

    const convertToSegmentOrientation = (data: SensorData): SegmentOrientation => {
        if (data.Quat_W != null && data.Quat_X != null && data.Quat_Y != null && data.Quat_Z != null) {
            const quat = new THREE.Quaternion(data.Quat_X, data.Quat_Y, data.Quat_Z, data.Quat_W).normalize();
            return createSegmentOrientation(quat.x, quat.y, quat.z, quat.w);
        }

        if (data.Euler_X != null && data.Euler_Y != null && data.Euler_Z != null) {
            const euler = new THREE.Euler(
                THREE.MathUtils.degToRad(data.Euler_X),
                THREE.MathUtils.degToRad(data.Euler_Y),
                THREE.MathUtils.degToRad(data.Euler_Z),
                'ZYX'
            );
            const quat = new THREE.Quaternion().setFromEuler(euler);
            return createSegmentOrientation(quat.x, quat.y, quat.z, quat.w);
        }

        return createSegmentOrientation(0, 0, 0, 1);
    };

    const updateOrientations = (frame: number) => {
        if (!sensorData || Object.keys(sensorData).length === 0) {
          return;
        }

        const newOrientations: BodyOrientations = {};
        Object.entries(sensorData).forEach(([key, data]) => {
            if (data[frame]) {
                const orientation = convertToSegmentOrientation(data[frame]);
                switch (key) {
                    case 'thigh':
                        newOrientations.rightThigh = orientation;
                        break;
                    case 'shin':
                        newOrientations.rightShin = orientation;
                        break;
                }
            }
        });

        setCurrentOrientations(newOrientations);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        
        if (isPlaying && maxFramesValue > 0) {
            interval = setInterval(() => {
                setCurrentFrame(prev => {
                    const next = prev >= maxFramesValue ? 0 : prev + 1;
                    updateOrientations(next);
                    return next;
                });
            }, 50); 
        }
        
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isPlaying, maxFramesValue]);

    const handleFileUpload = async () => {
        setIsPlaying(false);
        setCurrentFile(null);
        setSensorData({});
        setCurrentFrame(0);
        setCurrentOrientations({});
        setMaxFramesValue(0);

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/zip',
                copyToCacheDirectory: true,
            });

            if (result.canceled === false) {
                setCurrentFile(result.assets[0].name);
                await processZipFile(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick the document.');
        } finally {
        }
    };

    const processZipFile = async (uri: string) => {
        try {
            const fileContent = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            
            const zip = await JSZip.loadAsync(fileContent, { base64: true });
            const parsedData: Record<string, SensorData[]> = {};

            for (const a of Object.keys(zip.files)) {
                if (zip.files[a].name.endsWith('.csv') || zip.files[a].name.endsWith('.txt')) {
                    let csvData = await zip.files[a].async('text');
                    
                    const headerIndex = csvData.indexOf('PacketCounter');
                    if (headerIndex !== -1) {
                        csvData = csvData.substring(headerIndex);
                    }

                    const { data } = Papa.parse<SensorData>(csvData, { 
                        header: true, 
                        skipEmptyLines: true, 
                        dynamicTyping: true,
                    });

                    parsedData[zip.files[a].name] = data;
                }
            }
            
            setSensorData(parsedData);
            processData(parsedData);
            Alert.alert('Success', `Successfully parsed ${Object.keys(parsedData).length} file(s) from the ZIP.`);
        } catch (error) {
            console.error('Error processing ZIP file:', error);
            Alert.alert('Error', 'Failed to process the ZIP file. It might be corrupted or in an unexpected format.');
        }
    };

    const processData = (data: Record<string, SensorData[]>) => {
        const sortedFileKeys = Object.keys(data).sort();
        if (sortedFileKeys.length >= 2) {
            const so1 = convertToSegmentOrientation(data[sortedFileKeys[0]][0]);
            const so2 = convertToSegmentOrientation(data[sortedFileKeys[1]][0]);
            const angles = movementService.calculateJointAngle(
                new THREE.Quaternion(so1.qx, so1.qy, so1.qz, so1.qw),
                new THREE.Quaternion(so2.qx, so2.qy, so2.qz, so2.qw)
            );
        } else {
            Alert.alert('Not Enough Data', 'At least two sensor data files are needed to calculate joint angles.');
        }
    };

    const renderDataPreview = () => {
        if (Object.keys(sensorData).length === 0) {
            return null;
        }

        return (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Parsed Data</Text>
                {Object.entries(sensorData).map(([fileName, data]) => {
                    const mapping = `Sensor ${Object.keys(sensorData).indexOf(fileName) + 1}`;
                    return (
                        <View key={fileName} style={[styles.section, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>{mapping}</Text>
                            <Text style={[styles.dataValue, { color: colors.textSecondary }]}>
                                {`${data.length} frames`}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderAngleChart = () => {
        return null;
    };

    const renderDigitalTwin = () => {
        const fileKeys = Object.keys(sensorData);
        if (fileKeys.length < 1) {
            return null;
        }

        const maxFrames = Math.max(0, (sensorData[fileKeys[0]]?.length || 1) - 1);
        
        if (maxFrames !== maxFramesValue) {
            setMaxFramesValue(maxFrames);
            if (currentFrame > maxFrames) {
                setCurrentFrame(0);
            }
        }

        return (
            <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Digital Twin</Text>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Avatar 
                        orientations={currentOrientations}
                        horizontalRotation={horizontalRotation}
                        verticalRotation={verticalRotation}
                    />
                    <View style={styles.controlsContainer}>
                        <TouchableOpacity
                            onPress={() => setIsPlaying(true)}
                            disabled={isPlaying || maxFrames === 0}
                        >
                            <Ionicons name="play" size={32} color={isPlaying || maxFrames === 0 ? colors.mediumGray : colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setIsPlaying(false)} 
                            disabled={!isPlaying}
                        >
                            <Ionicons name="pause" size={32} color={!isPlaying ? colors.mediumGray : colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setIsPlaying(false);
                                setCurrentFrame(0);
                                updateOrientations(0);
                            }}
                        >
                            <Ionicons name="refresh" size={32} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    {maxFrames > 0 && (
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={maxFrames}
                            step={1}
                            value={Math.min(Math.max(0, currentFrame), maxFrames)}
                            onValueChange={(value: number) => {
                                const frameNumber = Math.floor(value);
                                setIsPlaying(false);
                                setCurrentFrame(frameNumber);
                                updateOrientations(frameNumber);
                            }}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.mediumGray}
                            thumbTintColor={colors.primary}
                        />
                    )}
                    <Text style={styles.frameText}>Frame: {currentFrame} / {maxFrames}</Text>
                    
                    <Slider
                        style={styles.slider}
                        minimumValue={-180}
                        maximumValue={180}
                        step={1}
                        value={horizontalRotation}
                        onValueChange={setHorizontalRotation}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor={colors.mediumGray}
                        thumbTintColor={colors.primary}
                    />
                    <Text style={styles.frameText}>Horizontal: {horizontalRotation}°</Text>
                    
                    <Slider
                        style={styles.slider}
                        minimumValue={-90}
                        maximumValue={90}
                        step={1}
                        value={verticalRotation}
                        onValueChange={setVerticalRotation}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor={colors.mediumGray}
                        thumbTintColor={colors.primary}
                    />
                    <Text style={styles.frameText}>Vertical: {verticalRotation}°</Text>
                </View>
            </>
        )
    }

    const renderRealtimeDataDisplay = () => {
        if (Object.keys(currentOrientations).length === 0) {
            return null;
        }

        const formatValue = (val: number | undefined) => val?.toFixed(3) ?? 'N/A';
        const formatQuat = (q: SegmentOrientation | undefined) => {
            if (!q) {
                return 'N/A';
            }
            return `w:${formatValue(q.qw)}, x:${formatValue(q.qx)}, y:${formatValue(q.qy)}, z:${formatValue(q.qz)}`;
        }

        return (
            <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Real-time Data</Text>
                <View style={[styles.card, { backgroundColor: colors.card, paddingBottom: 20 }]}>
                    {Object.entries(currentOrientations).map(([key, orientation]) => (
                        <View key={key} style={styles.dataRowContainer}>
                            <Text style={[styles.dataRowTitle, { color: colors.text }]}>{key}</Text>
                            <Text style={[styles.dataRowText, { color: colors.textSecondary }]}>
                                <Text style={styles.dataLabel}>Orient:</Text> {formatQuat(orientation)}
                            </Text>
                            <Text style={[styles.dataRowText, { color: colors.textSecondary }]}>
                                <Text style={styles.dataLabel}>Accel:</Text> x:{formatValue(undefined)}, y:{formatValue(undefined)}, z:{formatValue(undefined)}
                            </Text>
                            <Text style={[styles.dataRowText, { color: colors.textSecondary }]}>
                                <Text style={styles.dataLabel}>Gyro:</Text> x:{formatValue(undefined)}, y:{formatValue(undefined)}, z:{formatValue(undefined)}
                            </Text>
                        </View>
                    ))}
                </View>
            </>
        )
    }

    return (
        <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Live Session</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Upload and analyze your movement data
                    </Text>
                </View>

                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Movement Data</Text>
                        <TouchableOpacity 
                            style={[styles.uploadButton, { backgroundColor: colors.purple[500] }]}
                            onPress={handleFileUpload}
                        >
                            <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
                            <Text style={[styles.buttonText, { color: colors.white }]}>Upload Data</Text>
                        </TouchableOpacity>
                    </View>

                    {currentFile ? (
                        <>
                            <View style={styles.avatarContainer}>
                                <Avatar orientations={currentOrientations} />
                            </View>

                            <View style={styles.controlsContainer}>
                                <TouchableOpacity 
                                    style={[styles.playButton, { backgroundColor: colors.purple[500] }]}
                                    onPress={() => setIsPlaying(!isPlaying)}
                                >
                                    <Ionicons 
                                        name={isPlaying ? "pause" : "play"} 
                                        size={24} 
                                        color={colors.white} 
                                    />
                                </TouchableOpacity>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={maxFramesValue}
                                    step={1}
                                    value={currentFrame}
                                    onValueChange={(value: number) => {
                                        setIsPlaying(false);
                                        setCurrentFrame(Math.floor(value));
                                    }}
                                    minimumTrackTintColor={colors.purple[500]}
                                    maximumTrackTintColor={colors.mediumGray}
                                    thumbTintColor={colors.purple[500]}
                                />
                            </View>

                            {renderDataPreview()}
                        </>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Ionicons 
                                name="cloud-upload" 
                                size={48} 
                                color={colors.textSecondary} 
                            />
                            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                                Upload a movement data file to begin analysis
                            </Text>
                        </View>
                    )}
                </View>

                {currentFile && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Real-time Data</Text>
                        {renderRealtimeDataDisplay()}
                    </View>
                )}

                {/* Add bottom padding to account for tab bar */}
                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    avatarContainer: {
        height: 300,
        marginBottom: 16,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slider: {
        flex: 1,
        height: 40,
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        gap: 16,
    },
    placeholderText: {
        fontSize: 16,
        textAlign: 'center',
    },
    dataGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
    },
    dataItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 12,
        borderRadius: 8,
    },
    dataLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    dataValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    chartContainer: {
        marginTop: 24,
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    dataRowContainer: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    dataRowTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    dataRowText: {
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 18,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    frameText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 8,
    },
});

export default MovellaScreen; 