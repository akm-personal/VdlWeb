import React, { useState, useEffect } from 'react';
import { seatDummyStudents, shifts as dbShifts, settings as dbSettings } from '../../utils/dummyDatabase';
import '../../styles/SeatManagement.css';
import { formatTime12Hour, formatDate, formatDateTime } from '../../utils/helpers';
import { getCurrentUser, hasPermission } from '../../utils/rbac';

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

const generateSeats = () => {
  const stored = localStorage.getItem('vdl_seats');
  if (stored) return JSON.parse(stored);
  const seats = [];
  let idCounter = 1;
  for (let r = 1; r <= 4; r++) {
    for (let n = 1; n <= 20; n++) {
      let seatNumber = (r - 1) * 20 + n;
      const defaultShifts = {};
      dbShifts.forEach(shift => {
        defaultShifts[shift.id] = { status: 'available', student: null };
      });
      seats.push({
        id: idCounter++, row: r, number: seatNumber, locked: false,
        shifts: defaultShifts
      });
    }
  }
  if (seatDummyStudents.length > 0 && seats.length > 0) {
    if (seats[0].shifts['1']) seats[0].shifts['1'] = { status: 'booked', student: seatDummyStudents[0] };
    if (seats[0].shifts['2']) seats[0].shifts['2'] = { status: 'booked', student: seatDummyStudents[0] };
    if (seats[1].shifts['3']) seats[1].shifts['3'] = { status: 'pending', student: seatDummyStudents[1] };
    if (seats[2].shifts['1']) seats[2].shifts['1'] = { status: 'booked', student: seatDummyStudents[2] };
  }
  localStorage.setItem('vdl_seats', JSON.stringify(seats));
  return seats;
};

const SeatManagement = () => {
  const [seats, setSeats] = useState(generateSeats);
  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const isUndoRedoEnabled = dbSettings.find(s => s.id === 'enable_undo_redo')?.status === 'on';
  const showShiftDotsEnabled = dbSettings.find(s => s.id === 'show_shift_dots')?.status !== 'off';

  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [rowLocks, setRowLocks] = useState({});
  const [rowNames, setRowNames] = useState({});
  const [filter, setFilter] = useState('All');

  const activeShifts = dbShifts.filter(s => s.status === 'active');
  const shiftOptions = generateShiftCombinations(activeShifts);
  const defaultFilter = shiftOptions.length > 0 ? shiftOptions[0].id : '';

  const [activeShiftFilter, setActiveShiftFilter] = useState(defaultFilter);
  const [assignShiftFilter, setAssignShiftFilter] = useState(defaultFilter);
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

  useEffect(() => {
    localStorage.setItem('vdl_seats', JSON.stringify(seats));
  }, [seats]);

  const selectedShifts = activeShiftFilter ? activeShiftFilter.split(',') : [];

  // Group seats by row
  const maxRow = Math.max(...seats.map(s => s.row), 2);
  const rows = Array.from({ length: maxRow }, (_, i) => i + 1);

  const selectedSeat = seats.find(s => s.id === selectedSeatId);

  const getOccupancyStatus = (seat, shifts) => {
    if (seat.locked) return 'locked';
    let occupiedCount = 0;
    for (const shift of shifts) {
      // Fallback to 'available' if dynamically removed
      if (seat.shifts[shift] && seat.shifts[shift].status !== 'available') occupiedCount++;
    }
    if (occupiedCount === shifts.length) return 'fully-booked';
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

  const saveToHistory = () => {
    setHistory(prev => [...prev.slice(-9), seats]); // Keep last 10 actions
    setRedoHistory([]); // Clear redo history whenever a new action is performed
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      
      // Save current state to redo history
      setRedoHistory(prev => [...prev, seats]);
      
      // Restore previous state but KEEP CURRENT data for any seat that is currently locked
      const nextSeats = previousState.map(prevStateSeat => {
        const currentSeat = seats.find(s => s.id === prevStateSeat.id);
        if (currentSeat && currentSeat.locked) return currentSeat;
        return prevStateSeat;
      });

      // Ensure newly added but locked seats aren't removed by Undo
      seats.forEach(currentSeat => {
        if (currentSeat.locked && !nextSeats.find(s => s.id === currentSeat.id)) {
          nextSeats.push(currentSeat);
        }
      });

      setSeats(nextSeats);
      setHistory(prev => prev.slice(0, -1));
      setSelectedSeatId(null);
      setSelectedRow(null);
    }
  };

  const handleRedo = () => {
    if (redoHistory.length > 0) {
      const nextState = redoHistory[redoHistory.length - 1];
      
      // Save current state back to undo history
      setHistory(prev => [...prev.slice(-9), seats]);

      const nextSeats = nextState.map(nextStateSeat => {
        const currentSeat = seats.find(s => s.id === nextStateSeat.id);
        if (currentSeat && currentSeat.locked) return currentSeat;
        return nextStateSeat;
      });

      seats.forEach(currentSeat => {
        if (currentSeat.locked && !nextSeats.find(s => s.id === currentSeat.id)) {
          nextSeats.push(currentSeat);
        }
      });

      setSeats(nextSeats);
      setRedoHistory(prev => prev.slice(0, -1));
      setSelectedSeatId(null);
      setSelectedRow(null);
    }
  };

  const handleAddSeat = (rowNum) => {
    if (rowLocks[rowNum]) return;
    const rowSeats = seats.filter(s => s.row === rowNum);
    if (rowSeats.length >= 20) {
      alert('Maximum 20 seats allowed per row!');
      return;
    }
    saveToHistory();
    const baseNumber = (rowNum - 1) * 20;
    const maxNumber = rowSeats.length > 0 ? Math.max(...rowSeats.map(s => s.number)) : baseNumber;
    const newId = Math.max(...seats.map(s => s.id), 0) + 1;
    setSeats([...seats, { 
      id: newId, row: rowNum, number: maxNumber + 1, locked: false,
      shifts: dbShifts.reduce((acc, shift) => ({ ...acc, [shift.id]: { status: 'available', student: null } }), {})
    }]);
  };

  const handleAddRow = () => {
    saveToHistory();
    const newRow = maxRow + 1;
    const startNumber = (newRow - 1) * 20 + 1;
    setSeats([...seats, { 
      id: Date.now(), row: newRow, number: startNumber, locked: false,
      shifts: dbShifts.reduce((acc, shift) => ({ ...acc, [shift.id]: { status: 'available', student: null } }), {})
    }]);
  };

  const handleRemoveSeat = () => {
    if (!selectedSeat) return;
    if (selectedSeat.locked) return; // Action blocked if locked
    saveToHistory();
    setSeats(seats.filter(s => s.id !== selectedSeat.id));
    setSelectedSeatId(null);
  };

  const handleRemoveRow = (rowNum) => {
    if (rowLocks[rowNum]) return; // Action blocked if locked
    saveToHistory();
    setSeats(seats.filter(s => s.row !== rowNum));
    setSelectedRow(null);
  };

  const handleToggleSeatLock = () => {
    if (!selectedSeat) return;
    setSeats(seats.map(s => s.id === selectedSeat.id ? { ...s, locked: !s.locked } : s));
  };

  const handleToggleRowLock = (rowNum) => {
    const isNowLocked = !rowLocks[rowNum];
    setRowLocks(prev => ({ ...prev, [rowNum]: isNowLocked }));
    
    // Bulk Lock/Unlock all seats in this particular row
    setSeats(prevSeats => prevSeats.map(s => 
      s.row === rowNum ? { ...s, locked: isNowLocked } : s
    ));
  };

  const handleBulkLock = () => {
    setSeats(seats.map(s => ({ ...s, locked: true })));
    const newRowLocks = {};
    rows.forEach(r => newRowLocks[r] = true);
    setRowLocks(newRowLocks);
  };

  const handleBulkUnlock = () => {
    setSeats(seats.map(s => ({ ...s, locked: false })));
    const newRowLocks = {};
    rows.forEach(r => newRowLocks[r] = false);
    setRowLocks(newRowLocks);
  };

  const handleAssignStudent = (student) => {
    if (!selectedSeat || selectedSeat.locked) return;
    saveToHistory();
    const newStatus = student.feeStatus === 'Pending' ? 'pending' : 'booked';
    const shiftsToAssign = assignShiftFilter ? assignShiftFilter.split(',') : [];
    
    const cannotAssign = shiftsToAssign.some(shift => selectedSeat.shifts[shift] && selectedSeat.shifts[shift].status !== 'available');
    if (cannotAssign) {
      alert("Selected shift(s) are already occupied for this seat.");
      return;
    }
    
    setSeats(seats.map(s => {
      if (s.id === selectedSeat.id) {
        const updatedShifts = { ...s.shifts };
        shiftsToAssign.forEach(shift => {
          updatedShifts[shift] = { status: newStatus, student: student };
        });
        return { ...s, shifts: updatedShifts };
      }
      return s;
    }));
    setIsAssignModalOpen(false);
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

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (selectedSeat && selectedSeat.locked) return;
    saveToHistory();
    setSeats(seats.map(s => {
      if (s.id === selectedSeat.id) {
        const updatedShifts = { ...s.shifts };
        selectedShifts.forEach(shift => {
          if (updatedShifts[shift].student?.id === originalStudentId) {
            updatedShifts[shift].student = { ...updatedShifts[shift].student, ...editFormData, id: studentToEdit };
          }
        });
        return { ...s, shifts: updatedShifts };
      }
      return s;
    }));
    setIsEditModalOpen(false);
  };

  const handleUnassignSeat = (studentId, specificShift = null) => {
    if (!selectedSeat || selectedSeat.locked) return;
    saveToHistory();
    setSeats(seats.map(s => {
      if (s.id === selectedSeat.id) {
        const updatedShifts = { ...s.shifts };
        const shiftsToClear = specificShift ? [specificShift] : selectedShifts;
        shiftsToClear.forEach(shift => {
          if (updatedShifts[shift].student?.id === studentId) {
            updatedShifts[shift] = { status: 'available', student: null };
          }
        });
        return { ...s, shifts: updatedShifts };
      }
      return s;
    }));
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

  const handleFeeCollectionSubmit = (e) => {
    e.preventDefault();
    saveToHistory();
    
    const newHistoryEntry = {
      date: new Date().toISOString(),
      startDate: feeCollectionFormData.startDate,
      endDate: feeCollectionFormData.endDate,
      amount: feeCollectionFormData.collectedFee,
      status: feeCollectionFormData.dueAmount > 0 ? 'Pending' : 'Paid',
      collectedBy: feeCollectionFormData.collectedBy,
      description: feeCollectionFormData.description,
      totalFee: feeCollectionFormData.totalFee,
      dueAmount: feeCollectionFormData.dueAmount
    };

    const newFeeStatus = feeCollectionFormData.dueAmount > 0 ? 'Pending' : 'Paid';

    setSeats(seats.map(s => {
      const updatedShifts = { ...s.shifts };
      let seatUpdated = false;
      Object.keys(updatedShifts).forEach(shift => {
        if (updatedShifts[shift].student?.id === fullHistoryStudent.id) {
          updatedShifts[shift].student = { 
            ...updatedShifts[shift].student, 
            feeStatus: newFeeStatus,
            feeHistory: [...(updatedShifts[shift].student.feeHistory || []), newHistoryEntry]
          };
          seatUpdated = true;
        }
      });
      return seatUpdated ? { ...s, shifts: updatedShifts } : s;
    }));

    setFullHistoryStudent(prev => ({
      ...prev,
      feeStatus: newFeeStatus,
      feeHistory: [...(prev.feeHistory || []), newHistoryEntry]
    }));

    setIsFeeCollectionModalOpen(false);
  };

  const filteredStudents = seatDummyStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(s.vdlId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getShiftStudents = () => {
    const list = [];
    seats.forEach(seat => {
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
              {isUndoRedoEnabled && (
                <>
                  <button 
                    className="btn-action undo-btn" 
                    onClick={handleUndo} 
                    disabled={history.length === 0}
                  >
                    ↶ Undo
                  </button>
                  <button 
                    className="btn-action undo-btn" 
                    onClick={handleRedo} 
                    disabled={redoHistory.length === 0}
                  >
                    ↷ Redo
                  </button>
                </>
              )}
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
                        const shiftData = seat.shifts[shift.id];
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
                  const shiftData = selectedSeat.shifts[shiftNum];
                  if (!shiftData) return null;
                  const isAvailable = !shiftData.student;
                  const statusClass = isAvailable ? 'available' : (shiftData.student.feeStatus === 'Pending' ? 'pending' : 'booked');

                  return (
                    <div key={shiftNum} className={`shift-3d-card ${statusClass}`}>
                      <div className="shift-card-header">
                        <h4>🕒 {shift.name}</h4>
                        <span className="shift-time">{formatTime12Hour(shift.start)} - {formatTime12Hour(shift.end)}</span>
                      </div>
                      <div className="shift-card-body">
                        {!isAvailable ? (
                          <div className="shift-occupied">
                            <p><strong>👤 Name:</strong> {shiftData.student.name}</p>
                          <p><strong>🆔 ID:</strong> {shiftData.student.vdlId}</p>
                            <p><strong>💰 Fee:</strong> <span className={`status-badge ${shiftData.status}`}>{shiftData.student.feeStatus}</span></p>
                            
                            <div className="fee-history-section">
                              <button className="btn-toggle-history" onClick={() => setShowFeeHistory(prev => ({...prev, [shiftNum]: !prev[shiftNum]}))}>
                                {showFeeHistory[shiftNum] ? 'Hide Fee History ▲' : 'Show Fee History ▼'}
                              </button>
                              {showFeeHistory[shiftNum] && (
                                <ul className="fee-history-list">
                                  {shiftData.student.feeHistory && shiftData.student.feeHistory.length > 0 ? (
                                    <>
                                      {shiftData.student.feeHistory.slice().reverse().slice(0, 3).map((entry, idx) => (
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
                    const isAvailable = selectedSeat ? optShifts.every(shift => selectedSeat.shifts[shift] && selectedSeat.shifts[shift].status === 'available') : true;
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
                      {seatDummyStudents
                        .filter(s => s.name.toLowerCase().includes(editFormData.name.toLowerCase()) || String(s.vdlId).toLowerCase().includes(editFormData.name.toLowerCase()))
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
                  {fullHistoryStudent.feeHistory && fullHistoryStudent.feeHistory.slice().reverse().map((entry, idx) => (
                    <tr key={idx}>
                        <td>{entry.date ? formatDateTime(entry.date) : 'N/A'}</td>
                      <td>{entry.startDate ? formatDate(entry.startDate) : (fullHistoryStudent.fromDate ? formatDate(fullHistoryStudent.fromDate) : 'N/A')}</td>
                      <td>{entry.endDate ? formatDate(entry.endDate) : (fullHistoryStudent.toDate ? formatDate(fullHistoryStudent.toDate) : 'N/A')}</td>
                      <td className="td-amount-green">₹{entry.amount}</td>
                      <td className="td-amount-red">₹{entry.dueAmount || 0}</td>
                      <td><span className={`status-badge ${entry.status === 'Paid' ? 'fully-booked' : 'pending'}`}>{entry.status}</span></td>
                      <td>{entry.collectedBy || 'Admin'}</td>
                      <td>{entry.description || '-'}</td>
                      <td>
                        {(entry.dueAmount > 0 || entry.status === 'Pending') && (
                          <button className="btn-primary-action btn-pay-due" onClick={() => openPayDueModal(entry)}>Pay Due</button>
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