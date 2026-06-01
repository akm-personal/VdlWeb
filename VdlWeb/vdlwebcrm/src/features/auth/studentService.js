import apiClient from '../../services/apis';
import { logApiCall } from '../../utils/logs';

export const studentService = {
  getStudentByVdlId: async (vdlId) => {
    try {
      const data = await apiClient(`/student/details/${vdlId}`, {
        method: 'GET',
      });
      
      logApiCall('info', 'Fetch student details successful', { endpoint: `/student/details/${vdlId}`, response: data });
      return data;
    } catch (error) {
      logApiCall('error', 'Fetch student details failed', { endpoint: `/student/details/${vdlId}`, error: error.message });
      throw error;
    }
  },
  // Other student-related API calls can go here (e.g., getAllStudents)
};