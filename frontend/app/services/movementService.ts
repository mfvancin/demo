import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { Quaternion, Euler, Vector3, MathUtils } from 'three';
import { 
    ZipFileData, 
    JointPositions, 
    SegmentOrientations, 
    GaitParameters, 
    SegmentOrientation 
} from '../types';

class MovementService {
  private static instance: MovementService;

  private constructor() {}

  public static getInstance(): MovementService {
    if (!MovementService.instance) {
      MovementService.instance = new MovementService();
    }
    return MovementService.instance;
  }

  public async processZipFile(uri: string): Promise<ZipFileData> {
    try {
      // Read the zip file
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Load and parse the zip file
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(fileContent, { base64: true });

      const result: ZipFileData = {};

      // Process each file in the zip
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (!file.dir) {
          const content = await file.async('string');
          
          if (filename.includes('joint_positions')) {
            result.jointPositions = this.parseJointPositions(content);
          } else if (filename.includes('segment_orientations')) {
            result.segmentOrientations = this.parseSegmentOrientations(content);
          } else if (filename.includes('gait_parameters')) {
            result.gaitParameters = this.parseGaitParameters(content);
          } else if (filename.includes('raw_data')) {
            result.raw = this.parseRawData(content);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing zip file:', error);
      throw error;
    }
  }

  private parseJointPositions(csvContent: string): JointPositions[] {
    const parsed = Papa.parse(csvContent, { header: true });
    return parsed.data.map((row: any) => ({
      ankle: {
        x: parseFloat(row.ankle_x),
        y: parseFloat(row.ankle_y),
        z: parseFloat(row.ankle_z),
      },
      knee: {
        x: parseFloat(row.knee_x),
        y: parseFloat(row.knee_y),
        z: parseFloat(row.knee_z),
      },
      hip: {
        x: parseFloat(row.hip_x),
        y: parseFloat(row.hip_y),
        z: parseFloat(row.hip_z),
      },
      timestamp: row.timestamp,
    }));
  }

  private parseSegmentOrientations(csvContent: string): SegmentOrientations[] {
    const parsed = Papa.parse(csvContent, { header: true });
    return parsed.data.map((row: any) => ({
      foot: this.parseQuaternion(row, 'foot'),
      tibia: this.parseQuaternion(row, 'tibia'),
      femur: this.parseQuaternion(row, 'femur'),
      timestamp: row.timestamp,
    }));
  }

  private parseQuaternion(row: any, prefix: string): { qx: number; qy: number; qz: number; qw: number } {
    // Handle both Euler angles and quaternion inputs
    if (row[`${prefix}_qw`] !== undefined) {
      // Direct quaternion data
      return {
        qx: parseFloat(row[`${prefix}_qx`]),
        qy: parseFloat(row[`${prefix}_qy`]),
        qz: parseFloat(row[`${prefix}_qz`]),
        qw: parseFloat(row[`${prefix}_qw`]),
      };
    } else {
      // Convert from Euler angles
      const euler = new Euler(
        parseFloat(row[`${prefix}_x`]) * Math.PI / 180,
        parseFloat(row[`${prefix}_y`]) * Math.PI / 180,
        parseFloat(row[`${prefix}_z`]) * Math.PI / 180,
        'XYZ'
      );
      const quaternion = new Quaternion().setFromEuler(euler);
      return {
        qx: quaternion.x,
        qy: quaternion.y,
        qz: quaternion.z,
        qw: quaternion.w,
      };
    }
  }

  private parseGaitParameters(csvContent: string): GaitParameters[] {
    const parsed = Papa.parse(csvContent, { header: true });
    return parsed.data.map((row: any) => ({
      stepLength: parseFloat(row.step_length),
      cadence: parseFloat(row.cadence),
      timestamp: row.timestamp,
    }));
  }

  private parseRawData(csvContent: string): { accelerometer: any[]; gyroscope: any[] } {
    const parsed = Papa.parse(csvContent, { header: true });
    return {
      accelerometer: parsed.data.map((row: any) => ({
        x: parseFloat(row.accel_x),
        y: parseFloat(row.accel_y),
        z: parseFloat(row.accel_z),
        timestamp: row.timestamp,
      })),
      gyroscope: parsed.data.map((row: any) => ({
        x: parseFloat(row.gyro_x),
        y: parseFloat(row.gyro_y),
        z: parseFloat(row.gyro_z),
        timestamp: row.timestamp,
      })),
    };
  }

  public calculateRelativeRotation(q1: Quaternion, q2: Quaternion): Quaternion {
    // Calculate the relative rotation from q1 to q2
    return q2.clone().multiply(q1.clone().invert());
  }

  public interpolateQuaternions(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
    // Spherical linear interpolation between quaternions
    return q1.clone().slerp(q2, t);
  }

  public calculateJointAngle(q1: SegmentOrientation, q2: SegmentOrientation): number {
    // Convert SegmentOrientation to THREE.Quaternion
    const quaternion1 = new Quaternion(q1.qx, q1.qy, q1.qz, q1.qw);
    const quaternion2 = new Quaternion(q2.qx, q2.qy, q2.qz, q2.qw);

    // Calculate relative rotation between segments
    const relativeRotation = quaternion1.clone().multiply(quaternion2.clone().invert());

    // Convert to Euler angles
    const euler = new Euler().setFromQuaternion(relativeRotation);

    // Return the angle in degrees (using the largest component)
    return Math.abs(Math.max(
        MathUtils.radToDeg(euler.x),
        MathUtils.radToDeg(euler.y),
        MathUtils.radToDeg(euler.z)
    ));
  }
}

export default MovementService.getInstance(); 