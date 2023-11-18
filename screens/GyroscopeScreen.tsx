import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { gyroscope, accelerometer } from 'react-native-sensors';
import { Audio } from 'expo-av';

const GyroscopeScreen = ({ navigation }) => {
    const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
    const [sound, setSound] = useState();

    useEffect(() => {
        const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
            setGyroData({ x, y, z });
            adjustVolumeBasedOnMovement(x, y, z);
        });

        loadSound();

        return () => {
            gyroSubscription.unsubscribe();
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    const loadSound = async () => {
        const { sound: soundObject, status } = await Audio.Sound.createAsync(
            require('../audio/drone.mp3'), // Replace with your sound file
            { shouldPlay: true, isLooping: true, volume: 0.1 } // Start with low volume
        );
        setSound(soundObject);
    };

    const adjustVolumeBasedOnMovement = (x, y, z) => {
        // Define thresholds for movement
        const movementThreshold = 0.5;
        const highVolume = 1.0;
        const lowVolume = 0.1;

        // Check if the movement exceeds the threshold
        if (Math.abs(x) > movementThreshold || Math.abs(y) > movementThreshold || Math.abs(z) > movementThreshold) {
            sound?.setVolumeAsync(highVolume);
        } else {
            sound?.setVolumeAsync(lowVolume);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Gyroscope Data:</Text>
            <Text>X: {gyroData.x.toFixed(2)}</Text>
            <Text>Y: {gyroData.y.toFixed(2)}</Text>
            <Text>Z: {gyroData.z.toFixed(2)}</Text>

            <Button
                title="Back to Main Screen"
                onPress={() => {
                    navigation.goBack();
                    if (sound) {
                        sound.stopAsync();
                    }
                }}
            />
        </View>
    );
};

export default GyroscopeScreen;
