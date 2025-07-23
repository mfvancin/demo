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
    const qRelative = q1.clone().invert().multiply(q2);
    const angle = 2 * Math.atan2(new THREE.Vector3(qRelative.x, qRelative.y, qRelative.z).length(), qRelative.w);
    return THREE.MathUtils.radToDeg(angle);
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
    
    // Find the start of actual data (after metadata)
    let dataStartIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Look for a line that starts with a number or contains typical header columns
        if (/^\d/.test(line) || /PacketCounter|SampleTimeFine|Quat_|Euler_/.test(line)) {
            dataStartIndex = i;
            break;
        }
    }

    // Extract and clean the header line
    const headerLine = lines[dataStartIndex].trim()
        .replace(/\s+/g, ',')  // Replace multiple spaces with commas
        .replace(/[,]+/g, ',') // Replace multiple commas with single comma
        .replace(/^,|,$/g, ''); // Remove leading/trailing commas

    const headers = headerLine.split(',').map(h => h.trim());
    
    const dataRows = [];
    // Process each data line
    for (let i = dataStartIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) {
            continue;
        }

        // Clean and split the data line
        const values = line
            .replace(/\s+/g, ',')  // Replace multiple spaces with commas
            .replace(/[,]+/g, ',') // Replace multiple commas with single comma
            .replace(/^,|,$/g, '') // Remove leading/trailing commas
            .split(',')
            .map(v => v.trim());

        if (values.length >= 4) {  // Ensure we have at least some valid data
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

const findPeaks = (data: number[], threshold: number, distance: number) => {
    const peaks: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
        const isPeak = data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1];
        if (isPeak) {
            if (peaks.length === 0 || i - peaks[peaks.length - 1] > distance) {
                peaks.push(i);
            }
        }
    }
    return peaks.length;
};

const calculateMetricsForExercise = (sensorData: { [key: string]: any[] }) => {
    const sensorKeys = Object.keys(sensorData).sort();
    if (sensorKeys.length < 2) {
        throw new Error("At least two sensor files are required for angle calculation.");
    }

    const thighData = sensorData[sensorKeys[0]];
    const shinData = sensorData[sensorKeys[1]];

    const jointAngles: number[] = [];
    const numFrames = Math.min(thighData.length, shinData.length);

    for (let i = 0; i < numFrames; i++) {
        const thighRow = thighData[i];
        const shinRow = shinData[i];

        const q1 = thighRow.Quat_W != null ? new THREE.Quaternion(thighRow.Quat_X, thighRow.Quat_Y, thighRow.Quat_Z, thighRow.Quat_W) : eulerToQuaternion(thighRow.Euler_X, thighRow.Euler_Y, thighRow.Euler_Z);
        const q2 = shinRow.Quat_W != null ? new THREE.Quaternion(shinRow.Quat_X, shinRow.Quat_Y, shinRow.Quat_Z, shinRow.Quat_W) : eulerToQuaternion(shinRow.Euler_X, shinRow.Euler_Y, shinRow.Euler_Z);

        if (q1 && q2) {
            const angle = calculateJointAngle(q1, q2);
            jointAngles.push(angle);
        }
    }

    if (jointAngles.length === 0) {
        return {
            jointAngles: [],
            metrics: {
                repetitionCount: 0,
                maxFlexionAngle: 0,
                maxExtensionAngle: 0,
            },
        };
    }

    const repetitionCount = findPeaks(jointAngles, 90, 20);
    const maxFlexionAngle = Math.max(...jointAngles);
    const maxExtensionAngle = Math.min(...jointAngles);

    return {
        jointAngles,
        metrics: {
            repetitionCount,
            maxFlexionAngle,
            maxExtensionAngle,
        },
    };
};

const calculateSquatMetrics = (sensorData: { [key: string]: any[] }) => {
    return calculateMetricsForExercise(sensorData);
};

const calculateLegKneeExtensionMetrics = (sensorData: { [key: string]: any[] }) => {
    return calculateMetricsForExercise(sensorData);
};

const movementService = {
    eulerToQuaternion,
    calculateJointAngle,
    processZipFile,
    analyzeMovementData,
};

export default movementService; 