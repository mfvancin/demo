import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

export interface BodyOrientations {
    torso?: THREE.Quaternion;
    upperArm?: THREE.Quaternion;
    forearm?: THREE.Quaternion;
    pelvis?: THREE.Quaternion;
    rightThigh?: THREE.Quaternion;
    rightShin?: THREE.Quaternion;
    leftThigh?: THREE.Quaternion;
    leftShin?: THREE.Quaternion;
}

interface AvatarProps {
    orientations?: BodyOrientations;
}

const Avatar: React.FC<AvatarProps> = ({ orientations }) => {
    const glRef = useRef<any>(null);
    const rendererRef = useRef<Renderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const headRef = useRef<THREE.Mesh | null>(null);
    const torsoRef = useRef<THREE.Mesh | null>(null);
    const leftUpperArmRef = useRef<THREE.Mesh | null>(null);
    const leftForearmRef = useRef<THREE.Mesh | null>(null);
    const rightUpperArmRef = useRef<THREE.Mesh | null>(null);
    const rightForearmRef = useRef<THREE.Mesh | null>(null);
    const pelvisRef = useRef<THREE.Mesh | null>(null);
    const rightThighRef = useRef<THREE.Mesh | null>(null);
    const rightShinRef = useRef<THREE.Mesh | null>(null);
    const leftThighRef = useRef<THREE.Mesh | null>(null);
    const leftShinRef = useRef<THREE.Mesh | null>(null);
    let timeoutId: number;

    useEffect(() => {
        return () => {
            if (timeoutId) {
                cancelAnimationFrame(timeoutId);
            }
        };
    }, []);
    
    useEffect(() => {
        if (orientations) {
            if (torsoRef.current && orientations.torso) {
                torsoRef.current.quaternion.copy(orientations.torso);
            }
            if (leftUpperArmRef.current && orientations.upperArm) {
                leftUpperArmRef.current.quaternion.copy(orientations.upperArm);
            }
            if (leftForearmRef.current && orientations.forearm) {
                leftForearmRef.current.quaternion.copy(orientations.forearm);
            }
            if (pelvisRef.current && orientations.pelvis) {
                pelvisRef.current.quaternion.copy(orientations.pelvis);
            }
            if (rightThighRef.current && orientations.rightThigh) {
                rightThighRef.current.quaternion.copy(orientations.rightThigh);
            }
            if (rightShinRef.current && orientations.rightShin) {
                rightShinRef.current.quaternion.copy(orientations.rightShin);
            }
            if (leftThighRef.current && orientations.leftThigh) {
                leftThighRef.current.quaternion.copy(orientations.leftThigh);
            }
            if (leftShinRef.current && orientations.leftShin) {
                leftShinRef.current.quaternion.copy(orientations.leftShin);
            }
        }
    }, [orientations]);

    const onContextCreate = async (gl: any) => {
        glRef.current = gl;
        const renderer = new Renderer({ gl });
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1C1C1E);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000);
        camera.position.z = 4;
        camera.position.y = 1;
        cameraRef.current = camera;
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);

        // Materials
        const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0x2d75be });
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xbe2d6c });
        const limbMaterial = new THREE.MeshPhongMaterial({ color: 0x2dbe75 });
        const pelvisMaterial = new THREE.MeshPhongMaterial({ color: 0x752dbe });

        // Body Hierarchy
        const pelvis = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 0.6), pelvisMaterial);
        scene.add(pelvis);
        pelvisRef.current = pelvis;

        const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), torsoMaterial);
        torso.position.y = 0.95;
        pelvis.add(torso);
        torsoRef.current = torso;
        
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), headMaterial);
        head.position.y = 1.05;
        torso.add(head);
        headRef.current = head;
        
        const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const forearmGeometry = new THREE.BoxGeometry(0.22, 0.7, 0.22);
        const thighGeometry = new THREE.BoxGeometry(0.35, 1, 0.35);
        const shinGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);

        // Left Arm
        const leftUpperArm = new THREE.Mesh(armGeometry, limbMaterial);
        leftUpperArm.position.set(-0.625, 0.35, 0);
        torso.add(leftUpperArm);
        leftUpperArmRef.current = leftUpperArm;
        const leftForearm = new THREE.Mesh(forearmGeometry, limbMaterial);
        leftForearm.position.y = -0.75;
        leftUpperArm.add(leftForearm);
        leftForearmRef.current = leftForearm;
        
        // Right Arm
        const rightUpperArm = new THREE.Mesh(armGeometry, limbMaterial);
        rightUpperArm.position.set(0.625, 0.35, 0);
        torso.add(rightUpperArm);
        rightUpperArmRef.current = rightUpperArm;
        const rightForearm = new THREE.Mesh(forearmGeometry, limbMaterial);
        rightForearm.position.y = -0.75;
        rightUpperArm.add(rightForearm);
        rightForearmRef.current = rightForearm;

        // Left Leg
        const leftThigh = new THREE.Mesh(thighGeometry, limbMaterial);
        leftThigh.position.set(-0.3, -0.7, 0);
        pelvis.add(leftThigh);
        leftThighRef.current = leftThigh;
        const leftShin = new THREE.Mesh(shinGeometry, limbMaterial);
        leftShin.position.y = -0.95;
        leftThigh.add(leftShin);
        leftShinRef.current = leftShin;
        
        // Right Leg
        const rightThigh = new THREE.Mesh(thighGeometry, limbMaterial);
        rightThigh.position.set(0.3, -0.7, 0);
        pelvis.add(rightThigh);
        rightThighRef.current = rightThigh;
        const rightShin = new THREE.Mesh(shinGeometry, limbMaterial);
        rightShin.position.y = -0.95;
        rightThigh.add(rightShin);
        rightShinRef.current = rightShin;


        const animate = () => {
            timeoutId = requestAnimationFrame(animate);
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
            gl.endFrameEXP();
        };

        animate();
    };

    return (
        <View style={styles.container}>
            <GLView style={styles.glView} onContextCreate={onContextCreate} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glView: {
        width: '100%',
        height: '100%',
    },
});

export default Avatar; 