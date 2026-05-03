import apiClient from '../../services/apis';
import { logApiCall } from '../../utils/logs';

export const shiftService = {
  getAll: async () => {
    try {
      const data = await apiClient('/Shifts/all');
      logApiCall('info', 'Fetched shifts', { endpoint: '/Shifts/all', response: data });
      
      // Transform API response to frontend format
      if (data?.shifts && Array.isArray(data.shifts)) {
        return data.shifts.map(shift => ({
          id: shift.id,
          name: shift.shiftName,
          start: shift.startTime.split(' ')[0], // Remove AM/PM if present
          end: shift.endTime.split(' ')[0],
          status: shift.status === 1 ? 'active' : 'inactive',
          shiftName: shift.shiftName,
          startTime: shift.startTime,
          endTime: shift.endTime,
          createdBy: shift.createdBy,
          updatedBy: shift.updatedBy,
          createdDate: shift.createdDate,
          updatedDate: shift.updatedDate,
          isDeleted: shift.isDeleted
        }));
      }
      return [];
    } catch (error) {
      logApiCall('error', 'Fetch shifts failed', { endpoint: '/Shifts/all', error: error.message });
      throw error;
    }
  },

  createShift: async (shiftData) => {
    try {
      // Transform data to match API expectations
      const transformedData = {
        shiftName: shiftData.name,
        status: shiftData.status === 'active' || shiftData.status === 1 ? 1 : 0,
        startTime: shiftData.start,
        endTime: shiftData.end
      };
      const response = await apiClient('/Shifts/create', {
        method: 'POST',
        body: JSON.stringify(transformedData)
      });
      logApiCall('info', 'Created shift', { endpoint: '/Shifts/create', request: transformedData, response });
      return response;
    } catch (error) {
      logApiCall('error', 'Create shift failed', { endpoint: '/Shifts/create', request: shiftData, error: error.message });
      throw error;
    }
  },

  updateShift: async (shiftId, shiftData) => {
    try {
      // Transform data to match API expectations
      const transformedData = {
        shiftName: shiftData.name,
        status: shiftData.status === 'active' || shiftData.status === 1 ? 1 : 0,
        startTime: shiftData.start,
        endTime: shiftData.end
      };
      const response = await apiClient(`/Shifts/update/${shiftId}`, {
        method: 'PUT',
        body: JSON.stringify(transformedData)
      });
      logApiCall('info', 'Updated shift', { endpoint: `/Shifts/update/${shiftId}`, request: transformedData, response });
      return response;
    } catch (error) {
      logApiCall('error', 'Update shift failed', { endpoint: `/Shifts/update/${shiftId}`, request: shiftData, error: error.message });
      throw error;
    }
  },

  deleteShift: async (shiftId) => {
    try {
      const response = await apiClient(`/Shifts/delete/${shiftId}`, {
        method: 'DELETE'
      });
      logApiCall('info', 'Deleted shift', { endpoint: `/Shifts/delete/${shiftId}`, response });
      return response;
    } catch (error) {
      logApiCall('error', 'Delete shift failed', { endpoint: `/Shifts/delete/${shiftId}`, error: error.message });
      throw error;
    }
  }
};
