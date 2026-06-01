import { useState, useEffect } from 'react';
import { apiClient } from '../services/apis';

export const useAllStudents = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/Student/list');
      const sourceData = Array.isArray(data) ? data : (data.data || []);
      const mappedData = sourceData.map(student => ({
        ...student,
        id: student.id,
        vdlId: student.vdlId,
        name: student.name,
        email: student.email,
        mobileNumber: student.mobileNumber,
        feeStatus: student.feeStatus || 'Pending',
        admissionDate: student.createdDate ? student.createdDate.split('T')[0] : '',
        fromDate: student.fromDate || '',
        toDate: student.toDate || '',
        feeAmount: student.feeAmount || 0,
        previousFee: student.feeAmount || 0,
        feeHistory: student.feeHistory || []
      }));
      setStudents(mappedData);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return { students, isLoading, refetchStudents: fetchStudents };
};