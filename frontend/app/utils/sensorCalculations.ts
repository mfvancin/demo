import * as THREE from 'three';

/**
 * Represents a single row of parsed sensor data.
 */
export type SensorDataRow = {
    'Quat_W': number;
    'Quat_X': number;
    'Quat_Y': number;
    'Quat_Z': number;
    [key: string]: any;
};

/**
 * Calculates the relative quaternion representing the rotation from one orientation to another.
 * @param q1 - The first quaternion (e.g., proximal sensor like upper arm).
 * @param q2 - The second quaternion (e.g., distal sensor like forearm).
 * @returns The relative quaternion.
 */
export function getRelativeQuaternion(q1: THREE.Quaternion, q2: THREE.Quaternion): THREE.Quaternion {
    // The rotation from q1 to q2 is q2 * inverse(q1)
    const q1Inverse = q1.clone().invert();
    return q2.clone().multiply(q1Inverse);
}

/**
 * Calculates the angle of rotation in degrees from a quaternion.
 * The angle is extracted from the axis-angle representation of the quaternion.
 * @param q - The quaternion.
 * @returns The angle in degrees.
 */
function getAngleFromQuaternion(q: THREE.Quaternion): number {
    // angle = 2 * acos(w)
    const angleRad = 2 * Math.acos(q.w);
    // Convert radians to degrees
    let angleDeg = angleRad * (180 / Math.PI);

    // Normalize angle to be within [0, 360)
    if (angleDeg >= 360) {
        angleDeg %= 360;
    }
    
    return angleDeg;
}

/**
 * Processes two sets of sensor data to calculate the relative angle over time.
 * This assumes two sensors are used, one proximal and one distal (e.g., for a single joint).
 * @param data1 - Data from the first sensor (e.g., 'upper_arm.csv').
 * @param data2 - Data from the second sensor (e.g., 'forearm.csv').
 * @returns An array of angles in degrees over time.
 */
export function calculateJointAngles(data1: SensorDataRow[], data2: SensorDataRow[]): number[] {
    const angles: number[] = [];
    const numSamples = Math.min(data1.length, data2.length);

    for (let i = 0; i < numSamples; i++) {
        const row1 = data1[i];
        const row2 = data2[i];

        if (
            row1 && row2 &&
            row1.Quat_W != null && row1.Quat_X != null && row1.Quat_Y != null && row1.Quat_Z != null &&
            row2.Quat_W != null && row2.Quat_X != null && row2.Quat_Y != null && row2.Quat_Z != null
        ) {
            const q1 = new THREE.Quaternion(row1.Quat_X, row1.Quat_Y, row1.Quat_Z, row1.Quat_W).normalize();
            const q2 = new THREE.Quaternion(row2.Quat_X, row2.Quat_Y, row2.Quat_Z, row2.Quat_W).normalize();

            const relativeQ = getRelativeQuaternion(q1, q2);
            const angle = getAngleFromQuaternion(relativeQ);
            
            angles.push(angle);
        }
    }

    return angles;
} 