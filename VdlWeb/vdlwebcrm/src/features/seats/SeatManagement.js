import React, { useState, useEffect } from 'react';
import { settings as dbSettings } from '../../utils/dummyDatabase';
import '../../styles/SeatManagement.css';
import { formatTime12Hour, formatDate, formatDateTime } from '../../utils/helpers';
import { getCurrentUser, hasPermission } from '../../utils/rbac';
import { updateStudent, apiClient } from '../../services/apis';
import { getLayout, createRow, updateRow, deleteRow, createSeat, updateSeat, deleteSeat, createAssignment, deleteAssignment } from '../../services/seatManagementService';
import { useActiveShifts } from '../../hooks/useShifts';
import { useAllStudents } from '../../hooks/useStudents';

const generateShiftCombinations = (shiftsList) => {
  const results = [];
  if (shiftsList.length === 0) return results;
  
  // 1. Single shifts
  shiftsList.forEach(s => {
    results.push({ id: String(s.id), label: `${s.name} (${formatTime12Hour(s.start)} - ${formatTime12Hour(s.end)})`, shifts: [String(s.id)] });
  });

  // 2. Double combinations
  for (let i = 0; i < shiftsList.length; i++) {
    for (let j = i + 1; j < shiftsList.length; j++) {
      results.push({
        id: `${shiftsList[i].id},${shiftsList[j].id}`,
        label: `${shiftsList[i].name} & ${shiftsList[j].name}`,
        shifts: [String(shiftsList[i].id), String(shiftsList[j].id)]
      });
    }
  }

  // 3. All combinations if > 2
  if (shiftsList.length > 2) {
    results.push({
      id: shiftsList.map(s => s.id).join(','),
      label: `All Shifts (${shiftsList.length})`,
      shifts: shiftsList.map(s => String(s.id))
    });
  }
  return results;
};

const SeatManagement = () => {
  const [seats, setSeats] = useState([]);
  const showShiftDotsEnabled = dbSettings.find(s => s.id === 'show_shift_dots')?.status !== 'off';

  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowLocks, setRowLocks] = useState({});
  const [rowNames, setRowNames] = useState({});
  const [layoutRows, setLayoutRows] = useState([]);
  const [filter, setFilter] = useState('All');

  const { activeShifts } = useActiveShifts();
  const shiftOptions = generateShiftCombinations(activeShifts);
  const defaultFilter = shiftOptions.length > 0 ? shiftOptions[0].id : '';

  const [activeShiftFilter, setActiveShiftFilter] = useState(defaultFilter);
  const [assignShiftFilter, setAssignShiftFilter] = useState(defaultFilter);

  useEffect(() => {
    if (shiftOptions.length > 0 && (!activeShiftFilter || !shiftOptions.find(o => o.id === activeShiftFilter))) {
      setActiveShiftFilter(shiftOptions[0].id);
      setAssignShiftFilter(shiftOptions[0].id);
    }
  }, [shiftOptions, activeShiftFilter]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShiftStudentsModalOpen, setIsShiftStudentsModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [originalStudentId, setOriginalStudentId] = useState(null);
  const [showEditSearch, setShowEditSearch] = useState(false);
  const [showFeeHistory, setShowFeeHistory] = useState({});
  const [fullHistoryStudent, setFullHistoryStudent] = useState(null);
  const [isFeeCollectionModalOpen, setIsFeeCollectionModalOpen] = useState(false);
  const [feeCollectionFormData, setFeeCollectionFormData] = useState({});

  // RBAC Initialization
  const currentUser = getCurrentUser() || { roleId: 1 }; // Default Admin for testing
  const isStudent = currentUser?.roleId === 4;
  const canUnlock = hasPermission(currentUser, 'unlock_action');
  const canBulkAssign = hasPermission(currentUser, 'bulk_assign');
  const canAddRow = hasPermission(currentUser, 'add_new_row');

  const { students: allStudents } = useAllStudents();

  useEffect(() => {
    fetchLayoutData();
  }, []);

  const fetchLayoutData = async () => {
    try {
      const data = await getLayout();
      let fetchedSeats = [];
      let fetchedRows = [];
      
      // Handle response structure { data: [...] } or direct array
      const layoutData = data.data || data;
      
      if (Array.isArray(layoutData)) {
        fetchedRows = layoutData;
        layoutData.forEach(row => {
          if (row.seats && Array.isArray(row.seats)) {
            row.seats.forEach(seat => {
              // Extract numeric seat order securely from "R1-01" label
              let seatNum = seat.seatOrder || seat.number || 0;
              if (seat.seatLabel && seat.seatLabel.includes('-')) {
                const parts = seat.seatLabel.split('-');
                seatNum = parseInt(parts[parts.length - 1], 10);
              }

              // Map assignments securely to frontend shifts standard
              const mappedShifts = seat.shifts || {};
              if (seat.assignments && Array.isArray(seat.assignments)) {
                seat.assignments.forEach(assignment => {
                  mappedShifts[String(assignment.shiftId)] = {
                    id: assignment.assignmentId || assignment.id,
                    status: assignment.status || 'booked',
                    student: assignment.student || { 
                      id: assignment.studentId, 
                      name: assignment.studentName || 'Assigned', 
                      vdlId: assignment.vdlId,
                      feeStatus: assignment.feeStatus || 'Paid'
                    }
                  };
                });
              }

              fetchedSeats.push({ 
                ...seat, 
                id: seat.seatId || seat.id,
                row: row.rowId || row.id, 
                rowId: row.rowId || row.id,
                number: seatNum,
                locked: seat.isLocked !== undefined ? seat.isLocked : seat.locked,
                shifts: mappedShifts
              });
            });
          }
        });
      }

      // Strictly sequence seats using their derived 'number'
      setSeats(fetchedSeats.sort((a, b) => a.number - b.number));

      if (fetchedRows && Array.isArray(fetchedRows) && fetchedRows.length > 0) {
        const rl = {};
        const rn = {};
        const lr = [];
        fetchedRows.forEach(r => {
          const rNum = Number(r.rowId || r.row || r.id);
          if (!isNaN(rNum)) {
            rl[rNum] = r.isLocked || r.locked;
            rn[rNum] = r.rowName || r.name;
            if (!lr.includes(rNum)) lr.push(rNum);
          }
        });
        setRowLocks(rl);
        setRowNames(rn);
        setLayoutRows(lr.sort((a, b) => a - b));
      } else {
        setLayoutRows([]); // Fallback to empty if DB has no layout
      }
    } catch (err) {
      console.error("Failed to fetch layout data:", err);
    }
  };

  const selectedShifts = activeShiftFilter ? activeShiftFilter.split(',') : [];

  // Group seats by row
  const rows = layoutRows;

  const selectedSeat = seats.find(s => s.id === selectedSeatId);

  const getOccupancyStatus = (seat, shifts) => {
    if (seat.locked) return 'locked';
    let occupiedCount = 0;
    const seatShifts = seat.shifts || {};
    for (const shift of shifts) {
      // Fallback to 'available' if dynamically removed
      if (seatShifts[shift] && seatShifts[shift].status !== 'available') occupiedCount++;
    }
    if (occupiedCount === shifts.length && shifts.length > 0) return 'fully-booked';
    if (occupiedCount > 0) return 'partially-booked';
    return 'available';
  };

  const totalSeats = seats.length;
  const availableCount = seats.filter(s => getOccupancyStatus(s, selectedShifts) === 'available').length;
  const occupiedCount = totalSeats - availableCount;

  const handleSeatClick = (id) => { setSelectedSeatId(id); setSelectedRow(null); };
  const handleRowClick = (rowNum) => { setSelectedRow(rowNum); setSelectedSeatId(null); };

  const getRowName = (rowNum) => {
    return rowNames[rowNum] !== undefined && rowNames[rowNum].trim() !== '' ? rowNames[rowNum] : `Row ${rowNum}`;
  };

  const handleAddSeat = async (rowNum) => {
    if (rowLocks[rowNum]) return;
    const rowSeats = seats.filter(s => s.row === rowNum);
    if (rowSeats.length >= 20) {
      alert('Maximum 20 seats allowed per row!');
      return;
    }
    try {
      const baseNumber = (rowNum - 1) * 20;
      const maxNumber = rowSeats.length > 0 ? Math.max(...rowSeats.map(s => s.number || 0)) : baseNumber;
      const nextSeatNumber = maxNumber + 1;
      const seatLabel = `R${rowNum}-${String(nextSeatNumber).padStart(2, '0')}`;
      
      await createSeat({ seatRowId: rowNum, seatLabel: seatLabel });
      await fetchLayoutData();
    } catch (err) {
      alert("Error adding seat: " + err.message);
    }
  };

  const handleAddRow = async () => {
    try {
      const newOrder = layoutRows.length > 0 ? Math.max(...layoutRows) + 1 : 1;
      await createRow({ rowOrder: newOrder, rowName: `Row ${newOrder}`, name: `Row ${newOrder}` });
      await fetchLayoutData();
    } catch (err) {
      alert("Error adding row: " + err.message);
    }
  };

  const handleRemoveSeat = async () => {
    if (!selectedSeat) return;
    if (selectedSeat.locked) return; // Action blocked if locked
    try {
      await deleteSeat(selectedSeat.id);
      setSelectedSeatId(null);
      await fetchLayoutData();
    } catch (err) {
      alert("Error removing seat: " + err.message);
    }
  };

  const handleRemoveRow = async (rowNum) => {
    if (rowLocks[rowNum]) return; // Action blocked if locked
    try {
      setLayoutRows(prev => prev.filter(r => r !== rowNum)); // Optimistic update
      setSeats(prev => prev.filter(s => s.row !== rowNum));
      await deleteRow(rowNum);
      setSelectedRow(null);
      await fetchLayoutData();
    } catch (err) {
      alert("Error removing row: " + err.message);
      await fetchLayoutData(); // Refresh to restore on failure
    }
  };

  const handleToggleSeatLock = async () => {
    if (!selectedSeat) return;
    try {
      await updateSeat(selectedSeat.id, { locked: !selectedSeat.locked, isLocked: !selectedSeat.locked });
      await fetchLayoutData();
    } catch (err) {
      alert("Error toggling seat lock: " + err.message);
    }
  };

  const handleToggleRowLock = async (rowNum) => {
    const isNowLocked = !rowLocks[rowNum];
    try {
      await updateRow(rowNum, { isLocked: isNowLocked, locked: isNowLocked, name: rowNames[rowNum] });
      await fetchLayoutData();
    } catch (err) {
      alert("Error toggling row lock: " + err.message);
    }
  };

  const handleRowRenameBlur = async (rowNum) => {
    try {
      await updateRow(rowNum, { name: rowNames[rowNum], isLocked: rowLocks[rowNum] });
      await fetchLayoutData();
    } catch (err) {
      console.error("Failed to rename row", err);
    }
  };

  const handleBulkLock = async () => {
    try {
      await Promise.all(seats.map(s => updateSeat(s.id, { locked: true, isLocked: true })));
      await Promise.all(rows.map(r => updateRow(r, { isLocked: true, locked: true })));
      await fetchLayoutData();
    } catch (err) { alert("Failed to bulk lock."); }
  };

  const handleBulkUnlock = async () => {
    try {
      await Promise.all(seats.map(s => updateSeat(s.id, { locked: false, isLocked: false })));
      await Promise.all(rows.map(r => updateRow(r, { isLocked: false, locked: false })));
      await fetchLayoutData();
    } catch (err) { alert("Failed to bulk unlock."); }
  };

  const handleAssignStudent = async (student) => {
    if (!selectedSeat || selectedSeat.locked) return;
    const newStatus = student.feeStatus === 'Pending' ? 'pending' : 'booked';
    const shiftsToAssign = assignShiftFilter ? assignShiftFilter.split(',') : [];
    
    const cannotAssign = shiftsToAssign.some(shift => selectedSeat.shifts && selectedSeat.shifts[shift] && selectedSeat.shifts[shift].status !== 'available');
    if (cannotAssign) {
      alert("Selected shift(s) are already occupied for this seat.");
      return;
    }
    
    try {
      await Promise.all(shiftsToAssign.map(shift => 
        createAssignment({ seatId: selectedSeat.id, shiftId: shift, studentId: student.id, status: newStatus })
      ));
      setIsAssignModalOpen(false);
      await fetchLayoutData();
    } catch (err) {
      alert("Failed to assign student: " + err.message);
    }
  };

  const openEditModal = (student) => {
    setOriginalStudentId(student.id);
    setStudentToEdit(student.id);
    setEditFormData({
      id: student.id,
      name: student.name,
      admissionDate: student.admissionDate,
      fromDate: student.fromDate,
      toDate: student.toDate,
      feeAmount: student.feeAmount,
      previousFee: student.feeAmount,
      feeStatus: student.feeStatus
    });
    setIsEditModalOpen(true);
    setShowEditSearch(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (selectedSeat && selectedSeat.locked) return;
    try {
      await updateStudent(studentToEdit || originalStudentId, editFormData);
      setIsEditModalOpen(false);
      await fetchLayoutData();
    } catch (err) {
      alert("Error updating student: " + err.message);
    }
  };

  const handleUnassignSeat = async (studentId, specificShift = null) => {
    if (!selectedSeat || selectedSeat.locked || !selectedSeat.shifts) return;
    try {
      const shiftsToClear = specificShift ? [specificShift] : selectedShifts;
      const assignmentIds = shiftsToClear.map(shift => selectedSeat.shifts[shift] ? (selectedSeat.shifts[shift].id || selectedSeat.shifts[shift].assignmentId) : null).filter(Boolean);

      if (assignmentIds.length > 0) {
        await Promise.all(assignmentIds.map(id => deleteAssignment(id)));
      } else {
        await Promise.all(shiftsToClear.map(shift => deleteAssignment(`${selectedSeat.id}-${studentId}-${shift}`)));
      }
      await fetchLayoutData();
    } catch (err) {
      alert("Failed to unassign student: " + err.message);
    }
  };

  const handleToggleFeeHistory = async (shiftNum, student) => {
    const isCurrentlyShown = showFeeHistory[shiftNum];
    setShowFeeHistory(prev => ({ ...prev, [shiftNum]: !isCurrentlyShown }));
    
    if (!isCurrentlyShown) {
      try {
        const data = await apiClient(`/Fee/student/${student.vdlId}/records`);
        const mappedHistory = data.map(record => {
          const totalPaid = record.payments ? record.payments.reduce((sum, p) => sum + p.amountPaid, 0) : 0;
          const lastPayment = record.payments && record.payments.length > 0 ? record.payments[record.payments.length - 1] : null;
          return {
            id: record.id,
            date: lastPayment ? lastPayment.paymentDate : record.startDate,
            startDate: record.startDate,
            endDate: record.endDate,
            amount: totalPaid,
            dueAmount: record.totalFee - totalPaid,
            status: record.status,
            paymentMode: lastPayment ? lastPayment.paymentMode : 'N/A'
          };
        });
        
        setSeats(prevSeats => prevSeats.map(s => {
          if (s.id === selectedSeatId) {
            const updatedShifts = { ...s.shifts };
            if (updatedShifts[shiftNum] && updatedShifts[shiftNum].student) {
              updatedShifts[shiftNum].student = { ...updatedShifts[shiftNum].student, feeHistory: mappedHistory };
            }
            return { ...s, shifts: updatedShifts };
          }
          return s;
        }));
      } catch (err) {
        console.error("Failed to fetch fee history", err);
      }
    }
  };

  const openFeeCollectionModal = () => {
    setFeeCollectionFormData({
      startDate: fullHistoryStudent.fromDate || '',
      endDate: fullHistoryStudent.toDate || '',
      totalFee: fullHistoryStudent.feeAmount || '',
      collectedFee: '',
      dueAmount: fullHistoryStudent.feeAmount || '',
      description: '',
      collectedBy: 'Admin'
    });
    setIsFeeCollectionModalOpen(true);
  };

  const openPayDueModal = (entry) => {
    setFeeCollectionFormData({
      startDate: entry.startDate || fullHistoryStudent.fromDate || '',
      endDate: entry.endDate || fullHistoryStudent.toDate || '',
      totalFee: entry.dueAmount || '',
      collectedFee: '',
      dueAmount: entry.dueAmount || '',
      description: '',
      collectedBy: 'Admin'
    });
    setIsFeeCollectionModalOpen(true);
  };

  const handleFeeCollectionChange = (e) => {
    const { name, value } = e.target;
    setFeeCollectionFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'totalFee' || name === 'collectedFee') {
         const total = parseFloat(updated.totalFee) || 0;
         const collected = parseFloat(updated.collectedFee) || 0;
         updated.dueAmount = total - collected;
      }
      return updated;
    });
  };

  const handleFeeCollectionSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vdlId: fullHistoryStudent.vdlId,
        totalFee: parseFloat(feeCollectionFormData.totalFee) || 0,
        collectedFee: parseFloat(feeCollectionFormData.collectedFee) || 0,
        startDate: feeCollectionFormData.startDate,
        endDate: feeCollectionFormData.endDate,
        paymentMode: feeCollectionFormData.paymentMode || 'UPI',
        description: feeCollectionFormData.description || 'Fee Payment',
        paymentNote: feeCollectionFormData.description || 'Fee Payment'
      };

      await apiClient('/Fee/record', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await apiClient(`/Fee/student/${fullHistoryStudent.vdlId}/records`);
      const mappedHistory = data.map(record => {
        const totalPaid = record.payments ? record.payments.reduce((sum, p) => sum + p.amountPaid, 0) : 0;
        const lastPayment = record.payments && record.payments.length > 0 ? record.payments[record.payments.length - 1] : null;
        return {
          id: record.id, date: lastPayment ? lastPayment.paymentDate : record.startDate,
          startDate: record.startDate, endDate: record.endDate, amount: totalPaid,
          dueAmount: record.totalFee - totalPaid, status: record.status,
          paymentMode: lastPayment ? lastPayment.paymentMode : 'N/A'
        };
      });

      setFullHistoryStudent(prev => ({
        ...prev,
        feeHistory: mappedHistory
      }));

      setIsFeeCollectionModalOpen(false);

      setSeats(prevSeats => prevSeats.map(s => {
        if (s.id === selectedSeatId) {
          const newShifts = { ...s.shifts };
          Object.keys(newShifts).forEach(sh => {
            if (newShifts[sh]?.student?.vdlId === fullHistoryStudent.vdlId) {
              newShifts[sh].student = { ...newShifts[sh].student, feeHistory: mappedHistory };
            }
          });
          return { ...s, shifts: newShifts };
        }
        return s;
      }));

      await fetchLayoutData();
    } catch (err) {
      alert("Failed to collect fee: " + err.message);
    }
  };

  const filteredStudents = allStudents.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(s.vdlId || s.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getShiftStudents = () => {
    const list = [];
    seats.forEach(seat => {
      if (!seat.shifts) return;
      selectedShifts.forEach(shift => {
        const shiftData = seat.shifts[shift];
        if (shiftData && shiftData.student) {
          const existing = list.find(item => item.student.id === shiftData.student.id && item.seatId === seat.id);
          if (existing) {
            if (!existing.shifts.includes(shift)) existing.shifts.push(shift);
          } else {
            list.push({
              seatId: seat.id, seatLabel: `${seat.row}-${seat.number}`,
              student: shiftData.student, shifts: [shift], status: shiftData.status
            });
          }
        }
      });
    });
    return list;
  };

  return (
    <div className="seat-page">
      {/* Header Actions */}
      <div className="seat-header">
        <h2>Seat Management Dashboard</h2>
        <div className="header-actions">
          <select className="seat-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All Seats</option>
            <option value="available">Available Only</option>
            <option value="partially-booked">Partially Occupied</option>
            <option value="fully-booked">Fully Occupied</option>
          </select>
          {!isStudent && (
            <>
              <button className="btn-action bg-red-text-white" onClick={handleBulkLock}>Lock All</button>
              <button 
                className="btn-action bg-green-text-white" 
                onClick={handleBulkUnlock} 
                disabled={!canUnlock} 
                title={!canUnlock ? 'No permission: Admin/Authorized only' : ''}
                style={{ opacity: canUnlock ? 1 : 0.5, cursor: canUnlock ? 'pointer' : 'not-allowed' }}
              >Unlock All</button>
              <button 
                className="btn-action bulk-btn" 
                title={!canBulkAssign ? 'No permission to bulk assign' : 'Coming soon'} 
                disabled={!canBulkAssign}
                style={{ opacity: canBulkAssign ? 1 : 0.5, cursor: canBulkAssign ? 'pointer' : 'not-allowed' }}
              >Bulk Assign</button>
            </>
          )}
        </div>
      </div>

      {/* Stats and Shift Filter Bar */}
      {!isStudent && (
        <div className="stats-bar stats-bar-container">
          <div className="stat-item stat-item-center">
            <span className="stat-value">{totalSeats}</span>
            <p className="stat-label">Total Seats</p>
          </div>
          <div className="stat-item stat-item-divider">
            <span className="stat-value-occupied">{occupiedCount}</span>
            <p className="stat-label">Occupied</p>
          </div>
          <div className="stat-item stat-item-divider">
            <span className="stat-value-available">{availableCount}</span>
            <p className="stat-label">Available</p>
          </div>
          
          <div className="shift-filter-container">
            <label className="shift-filter-label">Select Shift:</label>
            <select 
              className="seat-filter shift-filter-select" 
              value={activeShiftFilter} 
              onChange={(e) => { setActiveShiftFilter(e.target.value); setSelectedSeatId(null); }}
            >
              {shiftOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
            <button className="btn-primary-action btn-view-shift-students" onClick={() => setIsShiftStudentsModalOpen(true)}>
              View Shift Students
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="seat-legend">
        <span className="legend-item"><div className="legend-box available"></div> Available</span>
        <span className="legend-item"><div className="legend-box partially-booked"></div> Partially Occupied</span>
        <span className="legend-item"><div className="legend-box fully-booked"></div> Fully Occupied</span>
        <span className="legend-item"><div className="legend-box locked"></div> Locked</span>
      </div>

      {/* Main Layout Split */}
      <div className="seat-layout">
        {/* LEFT PANEL - 70% */}
        <div className="left-panel" style={isStudent ? { flex: '0 0 100%', maxWidth: '100%' } : {}}>
          <div className="seat-grid-container table-responsive">
            {rows.map(rowNum => {
              const rowSeats = seats.filter(s => s.row === rowNum).sort((a,b) => a.number - b.number);
              return (
                <div key={rowNum} className="seat-row-wrapper">
                  <div 
                    className={`column-label cursor-pointer ${selectedRow === rowNum ? 'selected-label' : ''}`}
                    onClick={() => handleRowClick(rowNum)}
                  >
                    {getRowName(rowNum)} {rowLocks[rowNum] && <span className="ml-5" title="Locked">🔒</span>}
                  </div>
                  <div className="seat-row">
                    {rowSeats.map(seat => {
                      const status = getOccupancyStatus(seat, selectedShifts);
                      if (filter !== 'All' && filter.toLowerCase() !== status) return null;

                      let tooltip = `Seat ${seat.row}-${seat.number}`;
                      if (!isStudent) tooltip += ` | ${status.toUpperCase().replace('-', ' ')}`;
                      
                      const shiftDetails = [];
                      const shiftCount = activeShifts.length;
                      
                      const shiftDots = activeShifts.map((shift, index) => {
                        const shiftData = seat.shifts ? seat.shifts[shift.id] : null;
                        const isOccupied = shiftData && shiftData.student;
                        const color = isOccupied ? '#2ecc71' : '#bdc3c7'; // Green or Gray
                        
                        let dotTooltip = `${shift.name} (${formatTime12Hour(shift.start)} - ${formatTime12Hour(shift.end)})`;
                        if (isOccupied) {
                          const st = shiftData.student;
                          if (isStudent) {
                            if (String(st.id) === String(currentUser?.id)) {
                              dotTooltip += `\nStudent: ${st.name} (You)`;
                            } else {
                              dotTooltip += `\nStatus: Occupied`;
                            }
                          } else {
                            dotTooltip += `\nStudent: ${st.name}`;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isExpired = st.toDate ? new Date(st.toDate) < today : false;
                            if (isExpired) {
                              dotTooltip += `\nFee: Due/Pending (Expired on ${st.toDate})`;
                            } else {
                              dotTooltip += `\nFee: ${st.feeStatus}`;
                            }
                          }
                        } else {
                          dotTooltip += `\nStatus: Available`;
                        }
                        shiftDetails.push(dotTooltip);

                        return (
                          <span 
                            key={shift.id} 
                            style={{
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: color, 
                              display: 'inline-block',
                              border: '1px solid rgba(0,0,0,0.3)'
                            }}
                          ></span>
                        );
                      });

                      if (shiftDetails.length > 0) tooltip += `\n\n${shiftDetails.join('\n\n')}`;
                      
                      return (
                        <div 
                          key={seat.id} 
                          title={tooltip}
                          className={`seat-box ${status} ${selectedSeatId === seat.id ? 'selected' : ''} ${seat.locked ? 'locked' : ''}`}
                          onClick={() => handleSeatClick(seat.id)}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
                        >
                          {seat.locked && <span className="lock-icon" style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '10px' }}>🔒</span>}
                          <span className="seat-number font-14" style={{ zIndex: 1, position: 'relative', fontWeight: 'bold' }}>{seat.number}</span>
                          {showShiftDotsEnabled && !seat.locked && shiftCount > 0 && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', zIndex: 1 }}>
                              {shiftDots}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Add Seat Button */}
                    {!isStudent && !rowLocks[rowNum] && (
                      <div className="add-seat-btn" onClick={() => handleAddSeat(rowNum)}>+</div>
                    )}
                  </div>
                </div>
              );
            })}
            {!isStudent && (
              <button 
                className="btn-action add-row-btn" 
                onClick={handleAddRow}
                disabled={!canAddRow}
                title={!canAddRow ? 'No permission to add layout' : ''}
                style={{ opacity: canAddRow ? 1 : 0.5, cursor: canAddRow ? 'pointer' : 'not-allowed' }}
              >+ Add New Row</button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - 30% */}
        {!isStudent && (
          <div className="right-panel">
          {selectedSeat ? (
            <div className="details-card">
              <div className="details-header">
                <h3>Seat {selectedSeat.row}-{selectedSeat.number}</h3>
                <span className={`status-badge ${getOccupancyStatus(selectedSeat, selectedShifts)}`}>
                  {getOccupancyStatus(selectedSeat, selectedShifts).replace('-', ' ')}
                </span>
              </div>

              <div className="viewing-shifts-text">
                <strong>Viewing Shifts:</strong> {shiftOptions.find(opt => opt.id === activeShiftFilter)?.label}
              </div>

              <div className="shifts-breakdown">
                {activeShifts.map(shift => {
                  const shiftNum = String(shift.id);
                  const shiftData = selectedSeat.shifts ? selectedSeat.shifts[shiftNum] : null;
                  const isAvailable = !shiftData || !shiftData.student || shiftData.status === 'available';
                  const statusClass = isAvailable ? 'available' : (shiftData.student.feeStatus === 'Pending' ? 'pending' : 'booked');

                  return (
                    <div key={shiftNum} className={`shift-3d-card ${statusClass}`}>
                      <div className="shift-card-header">
                        <h4>🕒 {shift.name}</h4>
                        <span className="shift-time">{formatTime12Hour(shift.start)} - {formatTime12Hour(shift.end)}</span>
                      </div>
                      <div className="shift-card-body">
                        {!isAvailable && shiftData ? (
                          <div className="shift-occupied">
                            <p><strong>👤 Name:</strong> {shiftData.student.name}</p>
                          <p><strong>🆔 ID:</strong> {shiftData.student.vdlId}</p>
                            <p><strong>💰 Fee:</strong> <span className={`status-badge ${shiftData.status}`}>{shiftData.student.feeStatus}</span></p>
                            
                            <div className="fee-history-section">
                              <button className="btn-toggle-history" onClick={() => handleToggleFeeHistory(shiftNum, shiftData.student)}>
                                {showFeeHistory[shiftNum] ? 'Hide Fee History ▲' : 'Show Fee History ▼'}
                              </button>
                              {showFeeHistory[shiftNum] && (
                                <ul className="fee-history-list">
                                  {shiftData.student.feeHistory && shiftData.student.feeHistory.length > 0 ? (
                                    <>
                                    {shiftData.student.feeHistory.slice(0, 3).map((entry, idx) => (
                                <li key={idx} className="fee-history-item">
                                  <div className="fee-history-item-header">
                                    <span>{entry.date ? formatDateTime(entry.date) : entry.date}</span>
                                    <span>
                                      <strong className="text-green">₹{entry.amount}</strong>
                                      {entry.dueAmount > 0 && <strong className="text-red-margin">(Due: ₹{entry.dueAmount})</strong>}
                                    </span>
                                  </div>
                                  {entry.description && <em className="fee-history-desc">{entry.description}</em>}
                                </li>
                                      ))}
                                      <button 
                                        className="btn-view-full-history"
                                        onClick={() => setFullHistoryStudent(shiftData.student)}
                                      >
                                        View Full History &rarr;
                                      </button>
                                    </>
                                  ) : (
                                    <li><span className="text-muted">No history available.</span></li>
                                  )}
                                </ul>
                              )}
                            </div>

                            {!selectedSeat.locked && (
                              <div className="action-buttons-group card-actions">
                                <button className="btn-edit" onClick={() => openEditModal(shiftData.student)}>✏️ Edit</button>
                                <button className="btn-unassign" onClick={() => handleUnassignSeat(shiftData.student.id, shiftNum)}>❌ Unassign</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="shift-available">
                            <span className="available-icon">✔️</span>
                            <p>Available</p>
                            {!selectedSeat.locked && (
                              <button className="btn-primary-action assign-btn-3d" onClick={() => { setAssignShiftFilter(shiftNum.toString()); setIsAssignModalOpen(true); }}>Assign Student</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button 
                className="btn-action undo-btn btn-action-dark" 
                onClick={handleToggleSeatLock}
                disabled={!canUnlock && selectedSeat.locked}
                title={(!canUnlock && selectedSeat.locked) ? 'No permission to unlock' : ''}
                style={{ opacity: (!canUnlock && selectedSeat.locked) ? 0.5 : 1, cursor: (!canUnlock && selectedSeat.locked) ? 'not-allowed' : 'pointer' }}
              >
                {selectedSeat.locked ? 'Unlock Seat' : 'Lock Seat'}
              </button>
              {!selectedSeat.locked && (
                <button className="btn-remove-seat btn-remove-seat-full" onClick={handleRemoveSeat}>Remove Seat</button>
              )}
            </div>
          ) : selectedRow ? (
            <div className="details-card">
              <div className="details-header">
                <h3>{getRowName(selectedRow)} Settings</h3>
                <span className={`status-badge ${rowLocks[selectedRow] ? 'due' : 'done'}`}>
                  {rowLocks[selectedRow] ? 'Locked' : 'Unlocked'}
                </span>
              </div>
              <p><strong>Total Seats:</strong> {seats.filter(s => s.row === selectedRow).length}</p>
              
              <div className="row-rename-container">
                <label className="row-rename-label">Rename Row:</label>
                <input 
                  type="text" 
                  value={rowNames[selectedRow] !== undefined ? rowNames[selectedRow] : `Row ${selectedRow}`} 
                  onChange={(e) => setRowNames(prev => ({ ...prev, [selectedRow]: e.target.value }))}
                  onBlur={() => handleRowRenameBlur(selectedRow)}
                  className="row-rename-input"
                  disabled={rowLocks[selectedRow]}
                />
              </div>

              <div className="action-buttons-group">
                <button 
                  className="btn-action undo-btn btn-action-dark-inline" 
                  onClick={() => handleToggleRowLock(selectedRow)}
                  disabled={!canUnlock && rowLocks[selectedRow]}
                  title={(!canUnlock && rowLocks[selectedRow]) ? 'No permission to unlock' : ''}
                  style={{ opacity: (!canUnlock && rowLocks[selectedRow]) ? 0.5 : 1, cursor: (!canUnlock && rowLocks[selectedRow]) ? 'not-allowed' : 'pointer' }}
                >
                  {rowLocks[selectedRow] ? 'Unlock Row' : 'Lock Row'}
                </button>
                {!rowLocks[selectedRow] && (
                  <button className="btn-remove-seat" onClick={() => handleRemoveRow(selectedRow)}>Remove Row</button>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-selection-card">
              <span className="empty-icon">🖱️</span>
              <p>Select a Seat or a Row Title to manage settings.</p>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Assign Student Modal */}
      {isAssignModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content assign-modal">
            <div className="modal-header">
              <h3>Assign Shift(s) (Seat {selectedSeat?.row}-{selectedSeat?.number})</h3>
              <button className="btn-close-icon" onClick={() => setIsAssignModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="assign-shift-container">
                <label className="assign-shift-label">Select Shift to Assign:</label>
                <select 
                  className="seat-filter assign-shift-select" 
                  value={assignShiftFilter} 
                  onChange={(e) => setAssignShiftFilter(e.target.value)}
                >
                  {shiftOptions.map(opt => {
                    const optShifts = opt.id.split(',');
                    const isAvailable = selectedSeat ? optShifts.every(shift => {
                      const s = selectedSeat.shifts && selectedSeat.shifts[shift];
                      return !s || s.status === 'available';
                    }) : true;
                    return (
                      <option key={opt.id} value={opt.id} disabled={!isAvailable}>
                        {opt.label} {!isAvailable ? '(Occupied)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <input 
                type="text" 
                className="search-student-input" 
                placeholder="Search by Name or VDL ID..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
              <ul className="student-select-list">
                {filteredStudents.map(student => (
                  <li key={student.id} onClick={() => handleAssignStudent(student)}>
                    <div className="student-info">
                      <strong>{student.name}</strong>
                      <span>ID: {student.vdlId}</span>
                    </div>
                    <span className={`status-badge ${student.feeStatus === 'Pending' ? 'pending' : 'booked'}`}>
                      {student.feeStatus}
                    </span>
                  </li>
                ))}
                {filteredStudents.length === 0 && <p className="text-center-muted">No students found.</p>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Shift Students Table Modal */}
      {isShiftStudentsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-large">
            <div className="modal-header">
              <h3>Students for {shiftOptions.find(o => o.id === activeShiftFilter)?.label}</h3>
              <button className="btn-close-icon" onClick={() => setIsShiftStudentsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body table-responsive">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Seat</th>
                    <th>Student Name</th>
                    <th>ID</th>
                    <th>Shifts</th>
                    <th>Fee Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getShiftStudents().map((info, index) => (
                    <tr key={index}>
                      <td>{info.seatLabel}</td>
                      <td>{info.student.name}</td>
                      <td>{info.student.vdlId}</td>
                      <td>Shift {info.shifts.join(', ')}</td>
                      <td>
                        <span className={`status-badge ${info.status}`}>{info.student.feeStatus}</span>
                      </td>
                    </tr>
                  ))}
                  {getShiftStudents().length === 0 && (
                    <tr><td colSpan="5" className="table-empty-cell">No students assigned for these shifts.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Details Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content assign-modal">
            <div className="modal-header">
              <h3>Edit Student Details</h3>
              <button className="btn-close-icon" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit} className="edit-student-form">
                <div className="form-group full-width form-group-relative">
                  <label>Student Name (Search or Edit)</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={editFormData.name || ''} 
                    onChange={(e) => { handleEditChange(e); setShowEditSearch(true); }} 
                    onFocus={() => setShowEditSearch(true)}
                    required 
                    autoComplete="off"
                  />
                  {showEditSearch && editFormData.name && (
                    <ul className="student-select-list student-dropdown-list">
                      {allStudents
                        .filter(s => (s.name || '').toLowerCase().includes((editFormData.name || '').toLowerCase()) || String(s.vdlId || s.id || '').toLowerCase().includes((editFormData.name || '').toLowerCase()))
                        .map(student => (
                          <li key={student.id} onClick={() => {
                            setEditFormData({
                              id: student.id, name: student.name, admissionDate: student.admissionDate,
                              fromDate: student.fromDate, toDate: student.toDate, feeAmount: student.feeAmount,
                              previousFee: student.feeAmount, feeStatus: student.feeStatus
                            });
                            setStudentToEdit(student.id);
                            setShowEditSearch(false);
                          }}>
                            <div className="student-info">
                              <strong>{student.name}</strong>
                              <span>ID: {student.vdlId}</span>
                            </div>
                            <span className={`status-badge ${student.feeStatus === 'Pending' ? 'pending' : 'booked'} status-badge-black`}>
                              {student.feeStatus}
                            </span>
                          </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="form-group">
                  <label>Payment Mode</label>
                  <select name="paymentMode" value={feeCollectionFormData.paymentMode || 'UPI'} onChange={handleFeeCollectionChange} required>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit/Debit Card">Credit/Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Admission Date</label>
                  <input type="date" name="admissionDate" value={editFormData.admissionDate} disabled className="input-disabled" />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="fromDate" value={editFormData.fromDate} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" name="toDate" value={editFormData.toDate} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>New Fee Amount (₹)</label>
                  <input type="number" name="feeAmount" value={editFormData.feeAmount} onChange={handleEditChange} required />
                </div>
                {!isStudent && (
                  <div className="form-group">
                    <label>Fee Status</label>
                    <select name="feeStatus" value={editFormData.feeStatus || 'Pending'} onChange={handleEditChange} required>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                )}
                <div className="form-group full-width">
                  <label className="label-previous-fee">Previous submitted Fee: ₹{editFormData.previousFee}</label>
                </div>
                <div className="form-actions full-width form-actions-margin">
                  <button type="submit" className="btn-primary-action">Submit Details</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Full Fee History Modal */}
      {fullHistoryStudent && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-xlarge">
            <div className="modal-header">
              <h3>Fee History: {fullHistoryStudent.name}</h3>
              <button className="btn-close-icon" onClick={() => setFullHistoryStudent(null)}>&times;</button>
            </div>
            <div className="modal-body table-responsive">
              <div className="fee-history-header-card">
                <div>
                  <p className="student-id-text"><strong>🆔 VDL ID:</strong> {fullHistoryStudent.vdlId}</p>
                  <p className="student-admission-text"><strong>🎓 Admission Date:</strong> {fullHistoryStudent.admissionDate ? formatDate(fullHistoryStudent.admissionDate) : 'N/A'}</p>
                </div>
                <button className="btn-primary-action btn-collect-fee" onClick={openFeeCollectionModal}>+ Collect Fee</button>
              </div>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Submit Date</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Amount</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Collected By</th>
                    <th>Desc</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fullHistoryStudent.feeHistory && fullHistoryStudent.feeHistory.map((entry, idx) => (
                    <tr key={idx}>
                        <td>{entry.date ? formatDateTime(entry.date) : 'N/A'}</td>
                      <td>{entry.startDate ? formatDate(entry.startDate) : (fullHistoryStudent.fromDate ? formatDate(fullHistoryStudent.fromDate) : 'N/A')}</td>
                      <td>{entry.endDate ? formatDate(entry.endDate) : (fullHistoryStudent.toDate ? formatDate(fullHistoryStudent.toDate) : 'N/A')}</td>
                      <td className="td-amount-green">₹{entry.amount}</td>
                      <td className="td-amount-red">₹{entry.dueAmount || 0}</td>
                      <td><span className={`status-badge ${entry.status === 'Paid' ? 'fully-booked' : (entry.status === 'Partial' ? 'partially-booked' : 'pending')}`}>{entry.status}</span></td>
                      <td>{entry.collectedBy || 'Admin'}</td>
                      <td>{entry.description || '-'}</td>
                      <td>
                        {entry.status !== 'Paid' && entry.dueAmount > 0 && (
                          <button 
                            className="btn-primary-action btn-pay-due" 
                            style={{ opacity: idx !== 0 ? 0.5 : 1, cursor: idx !== 0 ? 'not-allowed' : 'pointer' }}
                            onClick={() => idx === 0 ? openPayDueModal(entry) : null}
                            disabled={idx !== 0}
                          >
                            Pay Due
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!fullHistoryStudent.feeHistory || fullHistoryStudent.feeHistory.length === 0) && (
                    <tr><td colSpan="9" className="td-empty-history">No fee history available for this student.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fee Collection Modal */}
      {isFeeCollectionModalOpen && (
        <div className="modal-overlay modal-overlay-top">
          <div className="modal-content modal-content-medium">
            <div className="modal-header">
              <h3>Fee Collection</h3>
              <button className="btn-close-icon" onClick={() => setIsFeeCollectionModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleFeeCollectionSubmit} className="edit-student-form">
                <div className="form-group full-width">
                  <label>Student Name</label>
                  <input type="text" value={fullHistoryStudent?.name || ''} disabled className="input-disabled" />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="startDate" value={feeCollectionFormData.startDate} onChange={handleFeeCollectionChange} required />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" name="endDate" value={feeCollectionFormData.endDate} onChange={handleFeeCollectionChange} required />
                </div>
                <div className="form-group">
                  <label>Total Fee (₹)</label>
                  <input type="number" name="totalFee" value={feeCollectionFormData.totalFee} onChange={handleFeeCollectionChange} required />
                </div>
                <div className="form-group">
                  <label>Collected Fee (₹)</label>
                  <input type="number" name="collectedFee" value={feeCollectionFormData.collectedFee} onChange={handleFeeCollectionChange} required />
                </div>
                <div className="form-group">
                  <label>Due Amount (₹)</label>
                  <input type="number" name="dueAmount" value={feeCollectionFormData.dueAmount} disabled className="input-disabled" />
                </div>
                <div className="form-group">
                  <label>Collected By</label>
                  <input type="text" name="collectedBy" value={feeCollectionFormData.collectedBy} disabled className="input-disabled" />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea name="description" value={feeCollectionFormData.description} onChange={handleFeeCollectionChange} placeholder="Any additional notes..." className="textarea-custom" rows="3" />
                </div>
                <div className="form-actions full-width form-actions-margin">
                  <button type="submit" className="btn-primary-action">Save Fee Record</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatManagement;