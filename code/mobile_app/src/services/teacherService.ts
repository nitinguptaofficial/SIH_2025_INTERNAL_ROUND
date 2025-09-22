import api from './api.config';
import axios, { AxiosError } from 'axios';

export interface TeacherRegistrationData {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  department: string;
}

export interface TeacherLoginData {
  email: string;
  password: string;
}

export const teacherService = {
  register: async (data: TeacherRegistrationData) => {
    try {
      const response = await api.post('/teachers/register', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (
          axiosError.response?.data &&
          typeof axiosError.response.data === 'object' &&
          'message' in axiosError.response.data
        ) {
          throw new Error(String(axiosError.response.data.message));
        }
      }
      throw error;
    }
  },

  login: async (data: TeacherLoginData) => {
    try {
      const response = await api.post('/teachers/login', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (
          axiosError.response?.data &&
          typeof axiosError.response.data === 'object' &&
          'message' in axiosError.response.data
        ) {
          throw new Error(String(axiosError.response.data.message));
        }
      }
      throw error;
    }
  },

  getProfile: async (teacherId: number) => {
    try {
      const response = await api.get(
        `/teachers/profile?teacherId=${teacherId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (
          axiosError.response?.data &&
          typeof axiosError.response.data === 'object' &&
          'message' in axiosError.response.data
        ) {
          throw new Error(String(axiosError.response.data.message));
        }
      }
      throw error;
    }
  },
};

export default teacherService;
