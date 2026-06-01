import { apiClient } from './apis';

export const getLayout = () => apiClient('/SeatManagement/layout');
export const createRow = (data) => apiClient('/SeatManagement/rows/create', { method: 'POST', body: JSON.stringify(data) });
export const updateRow = (id, data) => apiClient(`/SeatManagement/rows/update/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRow = (id) => apiClient(`/SeatManagement/rows/delete/${id}`, { method: 'DELETE' });
export const createSeat = (data) => apiClient('/SeatManagement/seats/create', { method: 'POST', body: JSON.stringify(data) });
export const updateSeat = (id, data) => apiClient(`/SeatManagement/seats/update/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSeat = (id) => apiClient(`/SeatManagement/seats/delete/${id}`, { method: 'DELETE' });
export const createAssignment = (data) => apiClient('/SeatManagement/assignments/create', { method: 'POST', body: JSON.stringify(data) });
export const deleteAssignment = (id) => apiClient(`/SeatManagement/assignments/delete/${id}`, { method: 'DELETE' });