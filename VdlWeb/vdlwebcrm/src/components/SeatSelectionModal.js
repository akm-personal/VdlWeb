import React, { useState, useEffect } from 'react';

const SeatSelectionModal = ({
  isOpen,
  onClose,
  onSeatSelect,
  selectedSeat,
  shiftType,
  activeShifts,
  currentUserVdlId = null // For AllStudent to allow selecting own seat
}) => {
  const [seatLayout, setSeatLayout] = useState([]);

  const getShiftId = () => {
    // Fallback for previously saved string-based old data
    if (['Morning', 'Afternoon', 'Evening'].includes(shiftType)) {
      return shiftType === 'Morning' ? '1' : shiftType === 'Afternoon' ? '2' : '3';
    }
    return shiftType;
  };

  const loadSeats = () => {
    const stored = localStorage.getItem('vdl_seats');
    if (stored) {
      setSeatLayout(JSON.parse(stored));
    } else {
      const seats = [];
      let idCounter = 1;
      for (let r = 1; r <= 4; r++) {
        for (let n = 1; n <= 20; n++) {
          let seatNumber = (r - 1) * 20 + n;
          const defaultShifts = {};
          activeShifts.forEach(shift => {
            defaultShifts[shift.id] = { status: 'available', student: null };
          });
          seats.push({ id: idCounter++, row: r, number: seatNumber, locked: false, shifts: defaultShifts });
        }
      }
      localStorage.setItem('vdl_seats', JSON.stringify(seats));
      setSeatLayout(seats);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSeats();
    }
  }, [isOpen, activeShifts]);

  const handleSeatSelect = (seat) => {
    const shiftId = getShiftId();
    const shiftData = seat.shifts[shiftId];
    const isBookedByCurrentUser = currentUserVdlId && shiftData && shiftData.student && shiftData.student.vdlId === currentUserVdlId;
    const isAvailable = !seat.locked && (!shiftData || shiftData.status === 'available' || isBookedByCurrentUser);
    if (!isAvailable) {
      alert('This seat is not available for the selected shift.');
      return;
    }
    onSeatSelect(seat.number);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-content modal-content-large" style={{ maxWidth: '800px', width: '95%', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="modal-header">
          <h3>Select Seat for {
            activeShifts.find(s => String(s.id) === getShiftId())?.name || shiftType
          }</h3>
          <button className="btn-close-icon" type="button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body seat-layout" style={{ display: 'block' }}>
          <div className="seat-legend" style={{ justifyContent: 'center', marginBottom: '15px' }}>
            <span className="legend-item"><div className="legend-box available"></div> Available</span>
            <span className="legend-item"><div className="legend-box fully-booked"></div> Occupied</span>
            <span className="legend-item"><div className="legend-box locked"></div> Locked</span>
          </div>
          <div className="seat-grid-container table-responsive" style={{ width: '100%', maxHeight: '60vh', overflowY: 'auto' }}>
            {Array.from(new Set(seatLayout.map(s => s.row))).map(rowNum => {
              const rowSeats = seatLayout.filter(s => s.row === rowNum).sort((a,b) => a.number - b.number);
              if(rowSeats.length === 0) return null;
              return (
                <div key={rowNum} className="seat-row-wrapper" style={{ margin: '10px 0' }}>
                  <div className="column-label" style={{ minWidth: '60px' }}>Row {rowNum}</div>
                  <div className="seat-row">
                    {rowSeats.map(seat => {
                      const shiftId = getShiftId();
                      const shiftData = seat.shifts[shiftId];
                      const isBookedByCurrentUser = currentUserVdlId && shiftData && shiftData.student && shiftData.student.vdlId === currentUserVdlId;
                      const isAvailable = !seat.locked && (!shiftData || shiftData.status === 'available' || isBookedByCurrentUser);
                      const statusClass = seat.locked ? 'locked' : (isAvailable ? 'available' : 'fully-booked');

                      return (
                        <div
                          key={seat.id}
                          className={`seat-box ${statusClass} ${Number(selectedSeat) === seat.number ? 'selected' : ''}`}
                          onClick={() => handleSeatSelect(seat)}
                          title={`Seat ${seat.number} - ${isAvailable ? 'Available' : 'Occupied'}`}
                        >
                          {seat.locked && <span className="lock-icon">🔒</span>}
                          <span className="seat-number font-14">{seat.number}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionModal;