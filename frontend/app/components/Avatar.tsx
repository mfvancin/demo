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
    horizontalRotation?: number;
    verticalRotation?: number;
}

const Avatar: React.FC<AvatarProps> = ({ orientations, horizontalRotation = 0, verticalRotation = 0 }) => {
    const glRef = useRef<any>(null);
    const rendererRef = useRef<Renderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const avatarGroup = useRef<THREE.Group>(new THREE.Group());
    const bodyPartRefs = useRef<{ [key: string]: THREE.Mesh | null }>({});
    let animationFrameId: number;

    useEffect(() => {
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);
    
    useEffect(() => {
        if (orientations) {
            for (const [part, orientation] of Object.entries(orientations)) {
                const bodyPart = bodyPartRefs.current[part];
                if (bodyPart && orientation) {
                    bodyPart.quaternion.copy(orientation);
                }
            }
        }
    }, [orientations]);

    useEffect(() => {
        avatarGroup.current.rotation.y = THREE.MathUtils.degToRad(horizontalRotation);
        avatarGroup.current.rotation.x = THREE.MathUtils.degToRad(verticalRotation);
    }, [horizontalRotation, verticalRotation]);

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
        
        scene.add(avatarGroup.current);

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

        // Geometries
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const torsoGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
        const pelvisGeometry = new THREE.BoxGeometry(1, 0.4, 0.6);
        const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const forearmGeometry = new THREE.BoxGeometry(0.22, 0.7, 0.22);
        const thighGeometry = new THREE.BoxGeometry(0.35, 1, 0.35);
        const shinGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);

        // Body Parts
        const pelvis = new THREE.Mesh(pelvisGeometry, pelvisMaterial);
        avatarGroup.current.add(pelvis);
        bodyPartRefs.current['pelvis'] = pelvis;

        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 0.95;
        pelvis.add(torso);
        bodyPartRefs.current['torso'] = torso;
        
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.05;
        torso.add(head);
        bodyPartRefs.current['head'] = head;
        
        // Left Arm
        const leftUpperArm = new THREE.Mesh(armGeometry, limbMaterial);
        leftUpperArm.position.set(-0.625, 0.35, 0);
        torso.add(leftUpperArm);
        bodyPartRefs.current['leftUpperArm'] = leftUpperArm;
        const leftForearm = new THREE.Mesh(forearmGeometry, limbMaterial);
        leftForearm.position.y = -0.75;
        leftUpperArm.add(leftForearm);
        bodyPartRefs.current['leftForearm'] = leftForearm;
        
        // Right Arm
        const rightUpperArm = new THREE.Mesh(armGeometry, limbMaterial);
        rightUpperArm.position.set(0.625, 0.35, 0);
        torso.add(rightUpperArm);
        bodyPartRefs.current['rightUpperArm'] = rightUpperArm;
        const rightForearm = new THREE.Mesh(forearmGeometry, limbMaterial);
        rightForearm.position.y = -0.75;
        rightUpperArm.add(rightForearm);
        bodyPartRefs.current['rightForearm'] = rightForearm;

        // Left Leg
        const leftThigh = new THREE.Mesh(thighGeometry, limbMaterial);
        leftThigh.position.set(-0.3, -0.7, 0);
        pelvis.add(leftThigh);
        bodyPartRefs.current['leftThigh'] = leftThigh;
        const leftShin = new THREE.Mesh(shinGeometry, limbMaterial);
        leftShin.position.y = -0.95;
        leftThigh.add(leftShin);
        bodyPartRefs.current['leftShin'] = leftShin;
        
        // Right Leg
        const rightThigh = new THREE.Mesh(thighGeometry, limbMaterial);
        rightThigh.position.set(0.3, -0.7, 0);
        pelvis.add(rightThigh);
        bodyPartRefs.current['rightThigh'] = rightThigh;
        const rightShin = new THREE.Mesh(shinGeometry, limbMaterial);
        rightShin.position.y = -0.95;
        rightThigh.add(rightShin);
        bodyPartRefs.current['rightShin'] = rightShin;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
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