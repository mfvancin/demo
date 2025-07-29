import * as THREE from 'three';
import { ZipFileData, JointPositions, SegmentOrientations, GaitParameters } from '../types';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import * as Papa from 'papaparse';

const eulerToQuaternion = (x: number, y: number, z: number) => {
    const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(x),
        THREE.MathUtils.degToRad(y),
        THREE.MathUtils.degToRad(z),
        'ZYX'
    );
    return new THREE.Quaternion().setFromEuler(euler);
};

export const calculateJointAngle = (q1: THREE.Quaternion, q2: THREE.Quaternion) => {
    const v1 = new THREE.Vector3(0, 1, 0).applyQuaternion(q1);
    const v2 = new THREE.Vector3(0, 1, 0).applyQuaternion(q2);
    const angle = v1.angleTo(v2);
    const degrees = THREE.MathUtils.radToDeg(angle);
    
    return 180 - degrees;
};

export const processZipFile = async (uri: string): Promise<ZipFileData> => {
    try {
        const fileContent = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const zip = await JSZip.loadAsync(fileContent, { base64: true });
        const data: ZipFileData = {};

        if (zip.files['joint_positions.csv']) {
            const csvData = await zip.files['joint_positions.csv'].async('text');
            data.jointPositions = Papa.parse<JointPositions>(csvData, { header: true, dynamicTyping: true }).data;
        }
        if (zip.files['segment_orientations.csv']) {
            const csvData = await zip.files['segment_orientations.csv'].async('text');
            data.segmentOrientations = Papa.parse<SegmentOrientations>(csvData, { header: true, dynamicTyping: true }).data;
        }
        if (zip.files['gait_parameters.csv']) {
            const csvData = await zip.files['gait_parameters.csv'].async('text');
            data.gaitParameters = Papa.parse<GaitParameters>(csvData, { header: true, dynamicTyping: true }).data;
        }

        return data;
    } catch (error) {
        console.error('Error processing ZIP file:', error);
        throw error;
    }
};

const parseSensorFile = (fileContent: string): any[] => {
    const lines = fileContent.replace(/\r\n/g, '\n').split('\n');
    
    let dataStartIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^\d/.test(line) || /PacketCounter|SampleTimeFine|Quat_|Euler_/.test(line)) {
            dataStartIndex = i;
            break;
        }
    }

    const headerLine = lines[dataStartIndex].trim()
        .replace(/\s+/g, ',')  
        .replace(/[,]+/g, ',') 
        .replace(/^,|,$/g, ''); 

    const headers = headerLine.split(',').map(h => h.trim());
    
    const dataRows = [];
    for (let i = dataStartIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) {
            continue;
        }

        const values = line
            .replace(/\s+/g, ',')  
            .replace(/[,]+/g, ',') 
            .replace(/^,|,$/g, '') 
            .split(',')
            .map(v => v.trim());

        if (values.length >= 4) {  
            const rowData: { [key: string]: any } = {};
            headers.forEach((header, index) => {
                if (index < values.length) {
                    const value = parseFloat(values[index]);
                    rowData[header] = isNaN(value) ? values[index] : value;
                }
            });
            dataRows.push(rowData);
        }
    }

    if (dataRows.length === 0) {
        console.warn("No valid data rows found in the file");
        console.warn("Headers found:", headers);
    } else {
        console.log(`Successfully parsed ${dataRows.length} rows with ${headers.length} columns`);
        console.log("Sample row:", dataRows[0]);
    }

    return dataRows;
};

export const analyzeMovementData = async (uri: string, exerciseType: 'Squat' | 'Leg Knee Extension') => {
    try {
        const zipData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const zip = await JSZip.loadAsync(zipData, { base64: true });
        
        const sensorData: { [key: string]: any[] } = {};
        for (const fileName in zip.files) {
            if (!zip.files[fileName].dir && (fileName.endsWith('.txt') || fileName.endsWith('.csv'))) {
                console.log(`Processing file: ${fileName}`);
                const fileContent = await zip.files[fileName].async('text');
                const parsed = parseSensorFile(fileContent);
                if (parsed.length > 0) {
                    sensorData[fileName] = parsed;
                    console.log(`Successfully processed ${fileName} with ${parsed.length} rows`);
                }
            }
        }

        const firstFileKey = Object.keys(sensorData)[0];
        if (!firstFileKey || sensorData[firstFileKey].length === 0) {
            throw new Error("No valid sensor data found in the ZIP file.");
        }

        let analysis;
        if (exerciseType === 'Squat') {
            analysis = calculateSquatMetrics(sensorData);
        } else {
            analysis = calculateLegKneeExtensionMetrics(sensorData);
        }

        return {
            exerciseType,
            ...analysis,
        };
    } catch (error) {
        console.error('Error in analyzeMovementData:', error);
        throw error;
    }
};

const findPeaks = (data: number[], threshold: number, distance: number, exerciseType: 'Squat' | 'Leg Knee Extension') => {
    const peaks: { index: number; angle: number }[] = [];

    for (let i = 1; i < data.length - 1; i++) {
        if (exerciseType === 'Squat') {
            const isValley = data[i] < threshold && data[i] < data[i - 1] && data[i] < data[i + 1];
            if (isValley && (peaks.length === 0 || i - peaks[peaks.length - 1].index > distance)) {
                peaks.push({ index: i, angle: data[i] });
            }
        } else {
            const isPeak = data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1];
            if (isPeak && (peaks.length === 0 || i - peaks[peaks.length - 1].index > distance)) {
                peaks.push({ index: i, angle: data[i] });
            }
        }
    }

    console.log(`Found ${peaks.length} ${exerciseType} repetitions`);
    return peaks;
};

const calculateMetricsForExercise = (sensorData: { [key: string]: any[] }, exerciseType: 'Squat' | 'Leg Knee Extension') => {
    const sensorKeys = Object.keys(sensorData).sort();
    if (sensorKeys.length < 2) {
        throw new Error("At least two sensor files are required for angle calculation.");
    }

    const thighData = sensorData[sensorKeys[0]];
    const shinData = sensorData[sensorKeys[1]];

    const jointAngles: number[] = [];
    const numFrames = Math.min(thighData.length, shinData.length);

    console.log(`Processing ${exerciseType} data:`, numFrames, 'frames');

    const leftWeightDistribution: number[] = [];
    const rightWeightDistribution: number[] = [];

    for (let i = 0; i < numFrames; i++) {
        const thighRow = thighData[i];
        const shinRow = shinData[i];

        let q1, q2;

        if (thighRow.Quat_W != null) {
            q1 = new THREE.Quaternion(
                thighRow.Quat_X,
                thighRow.Quat_Y,
                thighRow.Quat_Z,
                thighRow.Quat_W
            );
        } else {
            q1 = eulerToQuaternion(
                thighRow.Euler_X || 0,
                thighRow.Euler_Y || 0,
                thighRow.Euler_Z || 0
            );
        }

        if (shinRow.Quat_W != null) {
            q2 = new THREE.Quaternion(
                shinRow.Quat_X,
                shinRow.Quat_Y,
                shinRow.Quat_Z,
                shinRow.Quat_W
            );
        } else {
            q2 = eulerToQuaternion(
                shinRow.Euler_X || 0,
                shinRow.Euler_Y || 0,
                shinRow.Euler_Z || 0
            );
        }

        const angle = calculateJointAngle(q1, q2);
        
        if (angle >= 0 && angle <= 180) {
            jointAngles.push(angle);
        }

        const leftWeight = Math.abs(thighRow.Euler_Y || 0) + Math.abs(shinRow.Euler_Y || 0);
        const rightWeight = Math.abs(thighRow.Euler_Z || 0) + Math.abs(shinRow.Euler_Z || 0);
        
        leftWeightDistribution.push(leftWeight);
        rightWeightDistribution.push(rightWeight);
    }

    if (jointAngles.length === 0) {
        console.warn('No valid joint angles calculated');
        return {
            jointAngles: [],
            metrics: {
                repetitionCount: 0,
                maxFlexionAngle: 0,
                maxExtensionAngle: 0,
                centerOfMass: {
                    dominantSide: 'left',
                    distribution: {
                        left: 50,
                        right: 50
                    }
                }
            },
        };
    }

    const maxExtensionAngle = Math.max(...jointAngles);
    const maxFlexionAngle = Math.min(...jointAngles);

    const avgLeftWeight = leftWeightDistribution.reduce((a, b) => a + b, 0) / leftWeightDistribution.length;
    const avgRightWeight = rightWeightDistribution.reduce((a, b) => a + b, 0) / rightWeightDistribution.length;
    
    const totalWeight = avgLeftWeight + avgRightWeight;
    const leftPercentage = (avgLeftWeight / totalWeight) * 100;
    const rightPercentage = (avgRightWeight / totalWeight) * 100;

    let repThreshold;
    if (exerciseType === 'Squat') {
        repThreshold = 100;
    } else {
        repThreshold = maxFlexionAngle + (maxExtensionAngle - maxFlexionAngle) * 0.8;
    }

    console.log(`Using ${exerciseType} threshold: ${repThreshold.toFixed(1)}° based on ROM: ${maxFlexionAngle.toFixed(1)}° - ${maxExtensionAngle.toFixed(1)}°`);
    
    const peaks = findPeaks(jointAngles, repThreshold, 20, exerciseType);
    const repetitionCount = peaks.length;

    return {
        jointAngles,
        metrics: {
            repetitionCount,
            maxFlexionAngle,
            maxExtensionAngle,
            centerOfMass: {
                dominantSide: leftPercentage > rightPercentage ? 'left' : 'right',
                distribution: {
                    left: leftPercentage,
                    right: rightPercentage
                }
            }
        },
    };
};

const calculateSquatMetrics = (sensorData: { [key: string]: any[] }) => {
    return calculateMetricsForExercise(sensorData, 'Squat');
};

const calculateLegKneeExtensionMetrics = (sensorData: { [key: string]: any[] }) => {
    return calculateMetricsForExercise(sensorData, 'Leg Knee Extension');
};

const movementService = {
    eulerToQuaternion,
    calculateJointAngle,
    processZipFile,
    analyzeMovementData,
};

export default movementService; 