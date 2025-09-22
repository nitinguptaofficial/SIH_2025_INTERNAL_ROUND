import api from './api.config';

export const attendanceService = {
  markAttendance: async (formData: FormData) => {
    console.log('Making API request to mark attendance with form data');
    console.log('API URL:', api.defaults.baseURL + '/attendance/mark');

    const response = await api.post('/attendance/mark', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      transformRequest: data => data, // Prevent axios from transforming FormData
    });
    return response.data;
  },

  getAttendanceList: async () => {
    const response = await api.get('/attendance');
    return response.data;
  },
};

export default attendanceService;
