/* eslint-disable no-bitwise */
import { useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, ScanMode } from 'react-native-ble-plx';
import { PERMISSIONS, requestMultiple } from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';


const bleManager = new BleManager();


type VoidCallback = (result: boolean) => void;

interface BluetoothLowEnergyApi {
  requestPermissions(cb: VoidCallback): Promise<void>;
  scanForPeripherals(): void;
  stopScanning(): void;
  deviceRSSIs: { [device: string]: number | null };
}

export const targetDevices = ['MsgOne', 'MsgTwo', 'MsgThree', 'MsgFour', 'MsgFive', 'MsgSix', 'MsgSeven', 'MsgEight', 'ghost'];

function useBLE(): BluetoothLowEnergyApi {
  const [deviceRSSIs, setDeviceRSSIs] = useState<{ [device: string]: number | null }>({});
  const [deviceLastUpdated, setDeviceLastUpdated] = useState<{ [device: string]: number }>({});
 
  const [userPosition, setUserPosition] = useState({ x: 0, y: 0 });

  // Coordinates of your beacons (example values, replace with your actual coordinates)
   const beaconPositions = {
    MsgThree: { x: 0, y: 0 },
    MsgFour: { x: 270, y: 0 },
    MsgEight: { x: 0, y: 460 },
    MsgSix: { x: 270, y: 460 },
    // Add other beacons if necessary
  };

    // Function to calculate user position using trilateration (placeholder)
    const calculateUserPosition = () => {
      // Implement trilateration logic here
      // Example: setUserPosition({ x: calculatedX, y: calculatedY });
    };

  useEffect(() => {
    const deviceLostThreshold = 5000;
    let intervalId: NodeJS.Timeout;

    const checkForLostDevices = () => {
      const now = Date.now();
      const updatedRSSIs = { ...deviceRSSIs };
      const updatedLastUpdated = { ...deviceLastUpdated };
      let changesMade = false;

      for (const device in deviceLastUpdated) {
        if (now - deviceLastUpdated[device] > deviceLostThreshold) {
          updatedRSSIs[device] = null;
          delete updatedLastUpdated[device];
          changesMade = true;
        }
      }

      if (changesMade) {
        setDeviceRSSIs(updatedRSSIs);
        setDeviceLastUpdated(updatedLastUpdated);
      }
    };

    if (Object.keys(deviceLastUpdated).length) { // Only run the interval if there are devices to check
      intervalId = setInterval(checkForLostDevices, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [deviceRSSIs, deviceLastUpdated]);

  useEffect(() => {
    const subscription = bleManager.onStateChange((state) => {
      console.log('Bluetooth current state:', state);
      if (state === 'PoweredOn') {
        console.log('Bluetooth is on.');
      } else {
        console.warn('Bluetooth is not powered on.');
      }
    }, true);

    return () => {
      subscription.remove();
    };
  }, []);

  const requestPermissions = useCallback(async (cb: VoidCallback) => {
    if (Platform.OS === 'android') {
      const apiLevel = await DeviceInfo.getApiLevel();

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth Low Energy requires Location',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        cb(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await requestMultiple([
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ]);

        const isGranted = 
          result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

        cb(isGranted);
      }
    } else {
      cb(true);
    }
  }, []);

  const stopScanning = useCallback(() => {
    bleManager.stopDeviceScan();
    console.log('BLE scanning stopped.');
    setDeviceRSSIs({});  // Clear devices on stop to manage memory
    setDeviceLastUpdated({});
  }, []);

  function rssiToDistance(rssi) {
    const A = -65; // RSSI value at 1 meter
    const n = 2.5; // Path-loss exponent (adjust based on your environment)
    return 10 ** ((rssi - A) / (-10 * n));
  }
  
  const scanForPeripherals = useCallback(() => {
    bleManager.startDeviceScan(
      null,
      {
        allowDuplicates: true,
        scanMode: ScanMode.Balanced,
      },
      (error, device) => {
        if (error) {
          console.error("BLE Scan Error:", error);
          return;
        }
  
        const deviceName = device?.name;
        const deviceRssi = device?.rssi;
        const now = Date.now();
  
        if (deviceName && targetDevices.includes(deviceName)) {
          setDeviceLastUpdated((prevLastUpdated) => {
            const lastUpdated = prevLastUpdated[deviceName] || 0;
  
            if (now - lastUpdated > 500) {
              const distance = rssiToDistance(deviceRssi);
              setDeviceRSSIs((prevRSSIs) => ({
                ...prevRSSIs,
                [deviceName]: distance, // Store the calculated distance
              }));
  
              return {
                ...prevLastUpdated,
                [deviceName]: now,
              };
            }
  
            return prevLastUpdated;
          });
        }
      }
    );
  }, []);
  
  


  return {
    requestPermissions,
    scanForPeripherals,
    stopScanning,
    deviceRSSIs,
  };
}

export default useBLE;