import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BLEDevicesScreen from './screens/BLEDeviceScreen'; // Assuming this is the path to your BLEDevicesScreen
import GyroscopeScreen from './screens/GyroscopeScreen'; // Adjust the path as necessary

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="BLEDevices">
        <Stack.Screen 
          name="BLEDevices" 
          component={BLEDevicesScreen} 
          options={{ title: 'BLE Devices' }} 
        />
        <Stack.Screen 
          name="Gyroscope" 
          component={GyroscopeScreen} 
          options={{ title: 'Gyroscope' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
