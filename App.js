import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import useBLE from './path_to_useBLE_hook';

function App() {
  const {
    deviceDistances,
    scanForPeripherals,
    stopScanning,
    requestPermissions
  } = useBLE();

  useEffect(() => {
    requestPermissions((granted) => {
      if (granted) {
        scanForPeripherals();
      } else {
        console.warn("Permissions not granted");
      }
    });
  }, [requestPermissions, scanForPeripherals]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {Object.entries(deviceDistances).map(([deviceName, rssi]) => (
        <Text key={deviceName}>
          {deviceName}: RSSI = {rssi}
        </Text>
      ))}
      <Button title="Start Scanning" onPress={scanForPeripherals} />
      <Button title="Stop Scanning" onPress={stopScanning} />
    </View>
  );
}

export default App;
