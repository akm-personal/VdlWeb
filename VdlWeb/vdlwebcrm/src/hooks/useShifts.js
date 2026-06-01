import { useState, useEffect } from 'react';
import { apiClient } from '../services/apis';

// Helper to format time (e.g. 13:00 to 01:00 PM)
export const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours < 10 ? `0${hours}` : hours}:${m} ${ampm}`;
};

export const useActiveShifts = () => {
  const [activeShifts, setActiveShifts] = useState([]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const data = await apiClient('/Shifts/all');
        const shiftsList = data?.shifts || data || [];
        const active = shiftsList
          .filter(s => s.status === 1 || String(s.status).toLowerCase() === 'active')
          .map(s => ({
            ...s,
            name: s.shiftName || s.name,
            start: (s.startTime || s.start || '').split(' ')[0],
            end: (s.endTime || s.end || '').split(' ')[0]
          }))
          .sort((a, b) => a.start.localeCompare(b.start));
        setActiveShifts(active);
      } catch (err) {
        console.error('Error fetching shifts:', err);
      }
    };
    fetchShifts();
  }, []);

  return { activeShifts, formatTime };
};