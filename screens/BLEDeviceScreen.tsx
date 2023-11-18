import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import useBLE, { targetDevices } from '../components/useBLE';
import { Audio } from 'expo-av';

const ios = Platform.OS === 'ios';

const soundFileMap = {
    MsgOne: require('../audio/asound.m4a'),
    MsgTwo: require('../audio/csound.m4a'),
    MsgThree: require('../audio/dsound.m4a'),
    MsgFour: require('../audio/esound.m4a'),
    MsgFive: require('../audio/fsound.m4a'),
    MsgSix: require('../audio/gsound.m4a'),
    MsgSeven: require('../audio/asound.m4a'),
    MsgEight: require('../audio/csound.m4a'),
    ghost: require('../audio/sample-short.m4a'),
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

    const navigation = useNavigation();
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
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Beacon RSSI</Text>
                </View>

                <FlatList
                    data={devices}
                    keyExtractor={item => item.name}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemRssi}>
                                {item.rssi !== null ? `RSSI: ${item.rssi}` : "Not detected"}
                            </Text>
                        </View>
                    )}
                />

                <TouchableOpacity style={styles.button} onPress={() => { setIsScanning(prev => !prev); }}>
                    <Text style={styles.buttonText}>
                        {isScanning ? "Stop Scanning" : "Start Scanning"}
                    </Text>
                </TouchableOpacity>

                <Button title="Play" onPress={playSound} />
                <Button title="Go to Gyroscope Screen" onPress={() => navigation.navigate('Gyroscope')} />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f3f3',
    },
    safeArea: {
        flex: 1,
        marginHorizontal: 10,
    },
    header: {
        paddingVertical: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 10,
    },
    itemName: {
        fontWeight: 'bold',
    },
    itemRssi: {
        color: '#666',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 15,
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
    },
});

export default BLEDevicesScreen;