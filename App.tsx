import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Platform, TouchableOpacity } from 'react-native';
import useBLE, { targetDevices }  from './components/useBLE';
import { Audio } from 'expo-av';


const ios = Platform.OS === 'ios';

const soundFileMap = {
    MsgOne: require('./audio/asound.m4a'),
    MsgTwo: require('./audio/csound.m4a'),
    MsgThree: require('./audio/dsound.m4a'),
    MsgFour: require('./audio/esound.m4a'),
    MsgFive: require('./audio/fsound.m4a'),
    MsgSix: require('./audio/gsound.m4a'),
    MsgSeven: require('./audio/asound.m4a'),
    MsgEight: require('./audio/csound.m4a'),
    ghost: require('./audio/sample-short.m4a'),
    // ... add mappings for other beacons
    // MsgThree, MsgFour, MsgFive, MsgSix, MsgSeven, MsgEight, ghost
};



function BLEDevicesScreen() {
    const {
        scanForPeripherals,
        stopScanning,
        requestPermissions,
        deviceRSSIs
    } = useBLE();
  
    const initialDevices = targetDevices.map(device => ({ name: device, rssi: null, soundPlayed: false }));
    const [devices, setDevices] = useState<Array<{
        soundPlayed: any; name: string; rssi: number | null 
}>>(initialDevices);
    const [isScanning, setIsScanning] = useState<boolean>(true);

    const [sound, setSound] = useState();

    const playSound = async (beaconName) => {
        const soundToPlay = soundFileMap[beaconName];
        if (soundToPlay) {
            const { sound: soundObject } = await Audio.Sound.createAsync(soundToPlay, { shouldPlay: true });
            setSound(soundObject);
            await soundObject.playAsync(); 
        }
    };

// Don't forget to unload the sound when the component will unmount

  
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
                const newRssi = deviceRSSIs[device.name] ?? null;
    
                // Check if the device was previously detected
                const wasDetected = device.rssi !== null;
    
                if (newRssi !== null) {
                    if (newRssi > -80 && !device.soundPlayed && wasDetected) {
                        playSound(device.name);
                        return { ...device, rssi: newRssi, soundPlayed: true };
                    } else if (newRssi <= -80 && device.soundPlayed) {
                        return { ...device, rssi: newRssi, soundPlayed: false };
                    }
                } else {
                    // Handling the case when RSSI becomes null
                    if (device.soundPlayed) {
                        return { ...device, rssi: newRssi, soundPlayed: false };
                    }
                }
    
                return { ...device, rssi: newRssi };
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
          <Button title="Play" onPress={playSound} />

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