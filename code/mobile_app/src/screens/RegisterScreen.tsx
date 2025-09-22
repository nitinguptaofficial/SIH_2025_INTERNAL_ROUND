import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {
  Camera,
  useCameraDevices,
  CameraDevice,
} from 'react-native-vision-camera';
import Toast from 'react-native-toast-message';
import { userService } from '../services/userService';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [camera, setCamera] = useState<Camera | null>(null);
  const devices = useCameraDevices();
  const [device, setDevice] = useState<CameraDevice | undefined>();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'front',
  );

  const departments = [
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
    'Class 11',
    'Class 12',
  ];

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => {
      if (prev.includes(dept)) {
        return prev.filter(d => d !== dept);
      } else {
        return [...prev, dept];
      }
    });
  };

  useEffect(() => {
    if (devices.length > 0) {
      setDevice(devices.find(d => d.position === cameraPosition));
    }
  }, [devices, cameraPosition]);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'granted');
  };

  const toggleCamera = () => {
    setCameraPosition(prev => (prev === 'front' ? 'back' : 'front'));
  };

  const handleRegister = async () => {
    if (!camera) {
      Toast.show({
        type: 'error',
        text1: 'Camera not ready',
        text2: 'Please wait for camera to initialize',
      });
      return;
    }

    if (!name || !email || !rollNumber || selectedDepartments.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Missing information',
        text2:
          'Please fill in all required fields and select at least one department',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Take photo
      Toast.show({
        type: 'info',
        text1: 'Taking photo...',
        text2: 'Please stay still',
        visibilityTime: 1000,
      });

      const photo = await camera.takePhoto({
        flash: 'off',
      });
      console.log('Photo taken:', photo);

      // Step 2: Create form data
      Toast.show({
        type: 'info',
        text1: 'Processing...',
        text2: 'Preparing data for registration',
        visibilityTime: 1000,
      });

      console.log('Sending registration request...', {
        name,
        email,
        rollNumber,
        class: selectedDepartments.join(', '),
        role,
        photoPath: photo.path,
      });

      // Create form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('rollNumber', rollNumber);
      formData.append('class', selectedDepartments.join(', '));
      formData.append('role', role);

      // Add photo as a file
      const photoFile = {
        uri: Platform.OS === 'ios' ? photo.path : `file://${photo.path}`,
        type: 'image/jpeg',
        name: 'photo.jpg',
      };
      formData.append('photo', photoFile as any);

      console.log('Sending form data:', {
        name,
        email,
        rollNumber,
        class: selectedDepartments.join(', '),
        role,
        photoPath: photo.path,
      });

      // Step 3: Send registration request
      Toast.show({
        type: 'info',
        text1: 'Processing...',
        text2: 'Registering user with face recognition',
        visibilityTime: 1000,
      });

      const response = await userService.register(formData);

      console.log('Registration response:', response);

      Toast.show({
        type: 'success',
        text1: 'Registration successful',
        text2: `User ${name} has been registered`,
      });

      setName('');
      setEmail('');
      setRollNumber('');
      setSelectedDepartments([]);
      setRole('student');
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error
      ) {
        errorMessage = (error as { message: string }).message;
      }

      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission) {
    return (
      <LinearGradient colors={['#0f1720', '#071224']} style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>No access to camera</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f1720', '#071224']} style={styles.gradient}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.cameraContainer}>
                {device ? (
                  <>
                    <Camera
                      ref={ref => setCamera(ref)}
                      style={styles.camera}
                      device={device}
                      isActive={true}
                      photo={true}
                      enableZoomGesture={false}
                    />
                    <TouchableOpacity
                      style={styles.cameraRotateButton}
                      onPress={toggleCamera}
                    >
                      <Text style={styles.cameraRotateButtonText}>⟳</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.noCameraText}>
                    No camera device available
                  </Text>
                )}
              </View>

              <View style={styles.form}>
                <Text style={styles.inputLabel}>Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter name"
                  placeholderTextColor="#bfc7cf"
                  value={name}
                  onChangeText={setName}
                />
                <Text style={styles.inputLabel}>Email:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#bfc7cf"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <Text style={styles.inputLabel}>Roll Number:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter roll number"
                  placeholderTextColor="#bfc7cf"
                  value={rollNumber}
                  onChangeText={setRollNumber}
                />
                <View style={styles.departmentContainer}>
                  <Text style={styles.departmentLabel}>
                    Select Departments:
                  </Text>
                  <View style={styles.checkboxContainer}>
                    {departments.map(dept => (
                      <TouchableOpacity
                        key={dept}
                        style={styles.checkboxItem}
                        onPress={() => toggleDepartment(dept)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selectedDepartments.includes(dept) &&
                              styles.checkboxSelected,
                          ]}
                        >
                          {selectedDepartments.includes(dept) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                        <Text style={styles.checkboxText}>{dept}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'student' && styles.roleButtonActive,
                    ]}
                    onPress={() => setRole('student')}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'student' && styles.roleButtonTextActive,
                      ]}
                    >
                      Student
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Registering...' : 'Register'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
  },
  cameraRotateButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraRotateButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  camera: {
    flex: 1,
  },
  noCameraText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#3a4750',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#e6eef5',
  },
  departmentContainer: {
    width: '100%',
    marginVertical: 8,
    marginBottom: 16,
  },
  departmentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#e6eef5',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#7fb3ff',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7fb3ff',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a4750',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    color: '#bfc7cf',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;
