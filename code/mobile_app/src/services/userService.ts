import api from './api.config';
import axios, { AxiosError } from 'axios';

export const userService = {
  testConnection: async () => {
    try {
      console.log('Testing API connection...');
      const response = await api.get('/test');
      console.log('Test response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Test connection failed:', error);
      throw error;
    }
  },
  register: async (formData: FormData) => {
    try {
      console.log('Making API request to register user with form data');
      console.log('API URL:', api.defaults.baseURL + '/users/register');

      const response = await api.post('/users/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
        transformRequest: data => data, // Prevent axios from transforming FormData
      });
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API error:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response:', axiosError.response?.data);
          console.error('Error status:', axiosError.response?.status);

          const errorData = axiosError.response?.data;
          const errorStatus = axiosError.response?.status;

          let errorMessage = 'Server error';
          if (errorStatus) {
            errorMessage += `: ${errorStatus}`;
          }

          if (
            errorData &&
            typeof errorData === 'object' &&
            'message' in errorData
          ) {
            errorMessage = String(errorData.message);
          }

          throw new Error(errorMessage);
        } else if (axiosError.request) {
          // The request was made but no response was received
          console.error('No response received');
          throw new Error(
            'No response from server. Please check your connection.',
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Request setup error:', axiosError.message);
          throw new Error(axiosError.message);
        }
      }
      // If it's not an Axios error, throw the original error
      throw error;
    }
  },

  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getStudentsByDepartment: async (department: string) => {
    try {
      const response = await api.get(`/users/by-department/${department}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching students by department:', error);
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

export default userService;
