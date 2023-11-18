import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { gyroscope } from 'react-native-sensors';

const GyroscopeScreen = () => {
    const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        const subscription = gyroscope.subscribe(({ x, y, z, timestamp }) => {
            setGyroData({ x, y, z });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Gyroscope Data:</Text>
            <Text>X: {gyroData.x.toFixed(2)}</Text>
            <Text>Y: {gyroData.y.toFixed(2)}</Text>
            <Text>Z: {gyroData.z.toFixed(2)}</Text>
        </View>
    );
};

export default GyroscopeScreen;
