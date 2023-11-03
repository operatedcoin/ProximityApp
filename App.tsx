import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Platform, TouchableOpacity } from 'react-native';
import useBLE, { targetDevices }  from './components/useBLE';

const ios = Platform.OS === 'ios';

function BLEDevicesScreen() {
    const {
        scanForPeripherals,
        stopScanning,
        requestPermissions,
        deviceRSSIs
    } = useBLE();
  
    const initialDevices = targetDevices.map(device => ({ name: device, rssi: null }));
    const [devices, setDevices] = useState<Array<{ name: string; rssi: number | null }>>(initialDevices);
    const [isScanning, setIsScanning] = useState<boolean>(true);
  
    useEffect(() => {
      // Request permissions when component mounts
      requestPermissions((granted) => {
          if (granted && isScanning) {
              scanForPeripherals();
          } else if (!isScanning) {
              stopScanning();
          }
      });
  
      return () => {
          stopScanning();
      };
  }, [isScanning]);
  
    // Update the devices' RSSI values based on the information from the useBLE hook
    useEffect(() => {
        setDevices(prevDevices => {
            return prevDevices.map(device => {
                return { ...device, rssi: deviceRSSIs[device.name] ?? null };
            });
        });
    }, [deviceRSSIs]);
  
    return (
        <View className="flex bg-gray-100">
          <SafeAreaView className={ios? "-mb-2": "mb-3"}>
          <StatusBar style="auto" />
          <View className="mx-4 h-full flex-col justify-end flex grow">
          <View className="py-8">
            <Text className="text-3xl font-semibold">Beacon RSSI</Text>
          </View>
            <FlatList
                data={devices}
                keyExtractor={item => item.name}
                renderItem={({ item }) => (
                    <View className="flex-row justify-between p-4 bg-white mb-2 rounded-lg">
                        <Text className="font-semibold">{item.name}</Text>
                        <Text className="text-neutral-600">
                            {item.rssi !== null ? `RSSI: ${item.rssi}` : "Not detected"}
                        </Text>
                    </View>
                )}
            />
            <View className="grow" />

            <TouchableOpacity className="bg-neutral-500 p-3 mb-6 w-full items-center rounded-full" onPress={() => { setIsScanning(prev => !prev); }}>
              <Text className="text-white">
                  {isScanning ? "Stop Scanning" : "Start Scanning"}
              </Text>
            </TouchableOpacity>
          </View>
          </SafeAreaView>
        </View>
    );
}

export default BLEDevicesScreen;