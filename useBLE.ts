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
  distance: number;
  nearestDevice: string | null;
  deviceDistances: { [device: string]: number };
}

export const targetDevices = ['MsgOne', 'MsgTwo', 'MsgThree', 'MsgFour', 'MsgFive', 'MsgSix','MsgSeven','MsgEight'];

function useBLE(): BluetoothLowEnergyApi {
  const [distance, setDistance] = useState<number>(-1);
  const [nearestDevice, setNearestDevice] = useState<string | null>(null);
  const [deviceDistances, setDeviceDistances] = useState<{ [device: string]: number }>({});
  const [deviceLastUpdated, setDeviceLastUpdated] = useState<{ [device: string]: number }>({});

  useEffect(() => {
    const nearest = Object.entries(deviceDistances).sort(([, aDist], [, bDist]) => aDist - bDist)[0];
    if (nearest) {
      setNearestDevice(nearest[0]);
    } else {
      setNearestDevice(null); // Set to null if no devices are detected
    }
  }, [deviceDistances]);

  useEffect(() => {
    const deviceLostThreshold = 5000; // Time in milliseconds to consider a device as "lost"

    const checkForLostDevices = () => {
      const now = Date.now();
      const updatedDistances = { ...deviceDistances };
      const updatedLastUpdated = { ...deviceLastUpdated };
      let changesMade = false;

      for (const device in deviceLastUpdated) {
        if (now - deviceLastUpdated[device] > deviceLostThreshold) {
          delete updatedDistances[device];
          delete updatedLastUpdated[device];
          changesMade = true;
        }
      }

      if (changesMade) {
        setDeviceDistances(updatedDistances);
        setDeviceLastUpdated(updatedLastUpdated);
      }
    };

    const intervalId = setInterval(checkForLostDevices, 1000); // Check every second

    return () => clearInterval(intervalId);
  }, [deviceDistances, deviceLastUpdated]);
  
  useEffect(() => {
    const subscription = bleManager.onStateChange((state) => {
      console.log('Bluetooth current state:', state);  // Log the state regardless
      if (state === 'PoweredOn') {
        console.log('Bluetooth is on.'); // Explicit log for PoweredOn state
      } else {
        console.warn('Bluetooth is not powered on.');
      }
    }, true); // The 'true' here ensures that the current state is passed on the first callback
  
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
          },
        );
        cb(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await requestMultiple([
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ]);

        const isGranted =
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED;

        cb(isGranted);
      }
    } else {
      cb(true);
    }
  }, []);

  const stopScanning = useCallback(() => {
    bleManager.stopDeviceScan();
    console.log('BLE scanning stopped.'); // Optional: log for verification
  }, []);


  const scanForPeripherals = useCallback(() => {
    bleManager.startDeviceScan(
      null,
      {
        allowDuplicates: true,
        scanMode: ScanMode.Balanced,
      },
      (error, device) => {
        if (error) {
          console.error("BLE Scan Error:", error, error.reason, error.name, error.message);
          return;
        }

        const deviceName = device?.name;
        const deviceRssi = device?.rssi;
        if (deviceName && targetDevices.includes(deviceName)) {
          const processedRssi = deviceRssi! > -50 ? deviceRssi! + 110 : 0;

          if (processedRssi > 0) {
            setDeviceDistances(prevDistances => {
              if (prevDistances[deviceName] === processedRssi) {
                return prevDistances;
              }
              return {
                ...prevDistances,
                [deviceName]: processedRssi,
              };
            });
            setDeviceLastUpdated(prevLastUpdated => ({ ...prevLastUpdated, [deviceName]: Date.now() })); // Update last updated time
          } else {
            setDeviceDistances(prevDistances => {
              if (!prevDistances[deviceName]) {
                return prevDistances;
              }
              const updatedDistances = { ...prevDistances };
              delete updatedDistances[deviceName];
              return updatedDistances;
            });
          }

        }
      },
    );
  }, []);


  return {
    scanForPeripherals,
    stopScanning, // Added the new stopScanning method to the return object
    requestPermissions,
    distance,
    nearestDevice,
    deviceDistances,
  };
}

export default useBLE;