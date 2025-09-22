import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useNavigation,
  NavigationProp,
  useFocusEffect,
} from '@react-navigation/native';
import { useLayoutEffect } from 'react';

import { RootStackParamList } from '../navigation/AppNavigator';
import { Teacher, StudentWithAttendance, Attendance } from '../types';
import { teacherService } from '../services/teacherService';
import { userService } from '../services/userService';
import storageService from '../services/storageService';

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await storageService.removeTeacher();
            await storageService.removeToken();
            navigation.navigate('TeacherLogin');
          } catch (error) {
            console.error('Logout error:', error);
            navigation.navigate('TeacherLogin');
          }
        },
      },
    ]);
  };

  const loadTeacherData = async () => {
    try {
      const storedTeacher = await storageService.getTeacher();
      if (storedTeacher) {
        setTeacher(storedTeacher);
        return storedTeacher;
      } else {
        // If no teacher data, redirect to login
        navigation.navigate('TeacherLogin');
        return null;
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
      navigation.navigate('TeacherLogin');
      return null;
    }
  };

  const loadStudents = async (teacherData: Teacher) => {
    try {
      const studentsData = await userService.getStudentsByDepartment(
        teacherData.department,
      );
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students. Please try again.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const teacherData = await loadTeacherData();
      if (teacherData) {
        await loadStudents(teacherData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (teacher) {
        await loadStudents(teacher);
      } else {
        await loadData();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Logout</Text>
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#0f1720',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
        color: '#fff',
      },
    });
  }, [navigation]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAttendancePercentage = (attendanceRecords: Attendance[]) => {
    if (attendanceRecords.length === 0) return 0;
    const presentCount = attendanceRecords.filter(
      record => record.status === 'PRESENT',
    ).length;
    return Math.round((presentCount / attendanceRecords.length) * 100);
  };

  const getRecentAttendance = (attendanceRecords: Attendance[]) => {
    return attendanceRecords.slice(0, 5); // Show last 5 attendance records
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#0f1720', '#071224']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f1720', '#071224']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  Face Recognition Attendance System
                </Text>
                {teacher && (
                  <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>
                      Welcome, {teacher.name}
                    </Text>
                    <Text style={styles.department}>
                      Department: {teacher.department}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>For Students</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Register')}
                  >
                    <Text style={styles.buttonText}>Register New Student</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('MarkAttendance')}
                  >
                    <Text style={styles.buttonText}>Mark Attendance</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {teacher && (
                <View style={styles.studentsSection}>
                  <Text style={styles.sectionTitle}>
                    Students in {teacher.department} ({students.length})
                  </Text>

                  {students.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        No students found in your Class
                      </Text>
                      <Text style={styles.emptyStateSubtext}>
                        Students need to register with Class "
                        {teacher.department}"
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.studentsList}>
                      {students.map(student => (
                        <View key={student.id} style={styles.studentCard}>
                          <View style={styles.studentHeader}>
                            <View style={styles.studentInfo}>
                              <Text style={styles.studentName}>
                                {student.name}
                              </Text>
                              <Text style={styles.studentDetails}>
                                {student.rollNumber &&
                                  `Roll: ${student.rollNumber} • `}
                                {student.email}
                              </Text>
                            </View>
                            <View style={styles.attendanceStats}>
                              <Text style={styles.attendancePercentage}>
                                {getAttendancePercentage(
                                  student.attendance || [],
                                )}
                                %
                              </Text>
                              <Text style={styles.attendanceLabel}>
                                Attendance
                              </Text>
                            </View>
                          </View>

                          <View style={styles.attendanceSection}>
                            <Text style={styles.attendanceTitle}>
                              Recent Attendance
                            </Text>
                            {student.attendance &&
                            student.attendance.length > 0 ? (
                              <View style={styles.attendanceRecords}>
                                {getRecentAttendance(student.attendance).map(
                                  record => (
                                    <View
                                      key={record.id}
                                      style={styles.attendanceRecord}
                                    >
                                      <Text style={styles.attendanceDate}>
                                        {formatDate(record.date)}
                                      </Text>
                                      <View
                                        style={[
                                          styles.statusBadge,
                                          record.status === 'PRESENT'
                                            ? styles.presentBadge
                                            : styles.absentBadge,
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.statusText,
                                            record.status === 'PRESENT'
                                              ? styles.presentText
                                              : styles.absentText,
                                          ]}
                                        >
                                          {record.status}
                                        </Text>
                                      </View>
                                    </View>
                                  ),
                                )}
                              </View>
                            ) : (
                              <Text style={styles.noAttendanceText}>
                                No attendance records yet
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#fff',
  },
  teacherInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    color: '#bfc7cf',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#fff',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  studentsSection: {
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#bfc7cf',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  studentsList: {
    gap: 16,
  },
  studentCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentInfo: {
    flex: 1,
    marginRight: 16,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#bfc7cf',
  },
  attendanceStats: {
    alignItems: 'center',
  },
  attendancePercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#bfc7cf',
    marginTop: 2,
  },
  attendanceSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  attendanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  attendanceRecords: {
    gap: 8,
  },
  attendanceRecord: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  attendanceDate: {
    fontSize: 14,
    color: '#bfc7cf',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presentBadge: {
    backgroundColor: '#e8f5e8',
  },
  absentBadge: {
    backgroundColor: '#ffeaea',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  presentText: {
    color: '#28a745',
  },
  absentText: {
    color: '#dc3545',
  },
  noAttendanceText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default HomeScreen;
