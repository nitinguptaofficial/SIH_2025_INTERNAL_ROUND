import AsyncStorage from '@react-native-async-storage/async-storage';
import { Teacher } from '../types';

export const storageService = {
  // Store teacher data
  storeTeacher: async (teacher: Teacher) => {
    try {
      await AsyncStorage.setItem('teacher', JSON.stringify(teacher));
    } catch (error) {
      console.error('Error storing teacher data:', error);
      throw error;
    }
  },

  // Get stored teacher data
  getTeacher: async (): Promise<Teacher | null> => {
    try {
      const teacherData = await AsyncStorage.getItem('teacher');
      return teacherData ? JSON.parse(teacherData) : null;
    } catch (error) {
      console.error('Error getting teacher data:', error);
      return null;
    }
  },

  // Remove teacher data (logout)
  removeTeacher: async () => {
    try {
      await AsyncStorage.removeItem('teacher');
    } catch (error) {
      console.error('Error removing teacher data:', error);
      throw error;
    }
  },

  // Store auth token
  storeToken: async (token: string) => {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  },

  // Get auth token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Remove auth token
  removeToken: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  },
};

export default storageService;
