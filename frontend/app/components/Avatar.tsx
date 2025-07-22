import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { PerspectiveCamera, Scene, AmbientLight, DirectionalLight, Group, Quaternion, BoxGeometry, MeshStandardMaterial, Mesh } from 'three';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import { SegmentOrientation } from '../types';

export interface BodyOrientations {
    torso?: SegmentOrientation;
    pelvis?: SegmentOrientation;
    rightThigh?: SegmentOrientation;
    rightShin?: SegmentOrientation;
    rightFoot?: SegmentOrientation;
    leftThigh?: SegmentOrientation;
    leftShin?: SegmentOrientation;
    leftFoot?: SegmentOrientation;
    rightUpperArm?: SegmentOrientation;
    rightForearm?: SegmentOrientation;
    leftUpperArm?: SegmentOrientation;
    leftForearm?: SegmentOrientation;
}

export interface AvatarProps {
    orientations?: BodyOrientations;
    horizontalRotation?: number;
    verticalRotation?: number;
    size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ 
    orientations, 
    horizontalRotation = 0, 
    verticalRotation = 0,
    size = 300 
}) => {
    const modelRef = useRef<Group | null>(null);

    const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
        const sceneColor = 0x151515;

        // Create renderer
        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);
        renderer.setClearColor(sceneColor);

        // Create camera
        const camera = new PerspectiveCamera(70, width / height, 0.01, 1000);
        camera.position.set(0, 1, 2);
        camera.lookAt(0, 1, 0);

        // Create scene
        const scene = new Scene();

        // Add lights
        const ambientLight = new AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 2);
        scene.add(directionalLight);

        // Create placeholder cube
        const geometry = new BoxGeometry(0.5, 0.5, 0.5);
        const material = new MeshStandardMaterial({ color: 0x6b7280 });
        const cube = new Mesh(geometry, material);
        scene.add(cube);
        modelRef.current = new Group();
        modelRef.current.add(cube);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            if (modelRef.current) {
                // Apply rotation
                modelRef.current.rotation.y += 0.01;

                if (orientations?.rightThigh) {
                    const quaternion = new Quaternion(
                        orientations.rightThigh.qx,
                        orientations.rightThigh.qy,
                        orientations.rightThigh.qz,
                        orientations.rightThigh.qw
                    );
                    modelRef.current.quaternion.copy(quaternion);
                }
            }

            renderer.render(scene, camera);
            gl.endFrameEXP();
        };

        animate();
    };

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderRadius: 8,
    },
});

export default Avatar; 