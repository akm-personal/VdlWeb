# SeatManagement - Feature Integration Map & Testing Checklist

## ✅ **FEATURE CHECKLIST**

### **Layout Management Features**

- [ ] **Feature 1: Fetch Layout**
  - API: `GET /SeatManagement/layout`
  - Trigger: Component mount
  - Retry: 3x with 1.5s delay
  - Success: All seats rendered with occupancy status
  - Error: Show "Loading layout data..." message

- [ ] **Feature 2: Add Row**
  - API: `POST /SeatManagement/rows/create`
  - Trigger: Click "+ Add New Row" button
  - Permission: `add_new_row`
  - Validation: Max order calculation
  - Success: New row appears in grid
  - Feedback: Alert on error

- [ ] **Feature 3: Add Seat**
  - API: `POST /SeatManagement/seats/create`
  - Trigger: Click "+" on row
  - Validation: 
    - Row not locked
    - Max 20 seats per row
  - Label Format: `R{rowNum}-{seatNum}`
  - Success: New seat appears in row
  - Feedback: Alert on error

- [ ] **Feature 4: Lock/Unlock Row**
  - API: `PUT /SeatManagement/rows/update/{id}`
  - Trigger: Click "Lock Row" / "Unlock Row" button
  - Permission: `unlock_action` (for unlock)
  - Cascading: All seats in row become unlocked/locked
  - Visual: 🔒 icon appears when locked
  - Feedback: Tooltip shows reason if disabled

- [ ] **Feature 5: Lock/Unlock Seat**
  - API: `PUT /SeatManagement/seats/update/{id}`
  - Trigger: Click "Lock Seat" / "Unlock Seat" button
  - Permission: `unlock_action` (for unlock)
  - Visual: 🔒 icon in top-right corner
  - Blocked Actions: Assign, unassign, edit if locked
  - Feedback: Button disabled if no permission

- [ ] **Feature 8: Remove Seat**
  - API: `DELETE /SeatManagement/seats/delete/{id}`
  - Trigger: Click "Remove Seat" button
  - Validation: Seat not locked
  - Confirmation: None (direct delete)
  - Success: Seat disappears from row
  - Feedback: Alert on error

- [ ] **Feature 9: Remove Row**
  - API: `DELETE /SeatManagement/rows/delete/{id}`
  - Trigger: Click "Remove Row" button
  - Validation: Row not locked
  - Cascading: All seats in row deleted
  - Optimistic Update: Row removed from state immediately
  - Rollback: If API fails, layout refreshes to restore
  - Confirmation: None (direct delete)
  - Feedback: Alert on error

- [ ] **Feature 10: Rename Row**
  - API: `PUT /SeatManagement/rows/update/{id}`
  - Trigger: Edit text field, then blur
  - Validation: Row not locked
  - Input: Text field with current name
  - Success: Name updates on display
  - Failure: Reverts to previous name

---

### **Assignment & Student Management**

- [ ] **Feature 12: Assign Student**
  - API: `POST /SeatManagement/assignments/create`
  - Trigger: Click "Assign Student" button on empty seat
  - Modal: Open assign modal with student search
  - Validation:
    - Seat not locked
    - Selected shifts not occupied
  - Status Assignment:
    - Paid fee → `status: "booked"`
    - Pending fee → `status: "pending"`
  - Multiple Shifts: Use Promise.all() for parallel creation
  - Payload Fields: seatId, shiftId, studentId, status
  - Success: Seat shows assigned student
  - Feedback: Alert on error

- [ ] **Feature 13: Unassign Student**
  - API: `DELETE /SeatManagement/assignments/delete/{id}`
  - Trigger: Click "❌ Unassign" button
  - Validation: Seat not locked
  - Multiple Shifts: Delete assignment for each shift
  - Fallback: Try ID-based deletion first, then pattern-based
  - Success: Seat becomes available again
  - Feedback: Alert on error

- [ ] **Feature 16: Edit Student Details**
  - API: `PUT /Student/update/{vdlId}`
  - Trigger: Click "✏️ Edit" button on assigned student
  - Modal: Edit modal with form
  - Fields:
    - Name (with autocomplete)
    - Admission Date (read-only)
    - Start Date
    - End Date
    - Fee Amount
    - Fee Status (if not student role)
    - Payment Mode
  - Success: Student details update
  - Feedback: Alert on error, modal closes

- [ ] **Feature 15: View Shift Students**
  - API: None (client-side)
  - Trigger: Click "View Shift Students" button
  - Modal: Large table showing all students in shift(s)
  - Columns: Seat, Student Name, ID, Shifts, Fee Status
  - Aggregation: Groups same student from multiple seats
  - Data Source: `getShiftStudents()` function
  - No API call needed

---

### **Fee Management**

- [ ] **Feature 17: Show/Hide Fee History**
  - API: `GET /Fee/student/{vdlId}/records`
  - Trigger: Click "Show Fee History ▼" button
  - Modal: Dropdown under shift card
  - Data Processing:
    - Calculate total paid from payments array
    - Get last payment date
    - Calculate due amount
    - Map to frontend format
  - Display: Last 3 records
  - Link: "View Full History" button shows full modal
  - Success: Dropdown expands with history
  - Feedback: None (silent error handling)

- [ ] **Feature 18: View Full Fee History**
  - API: `GET /Fee/student/{vdlId}/records` (already fetched)
  - Trigger: Click "View Full History" or "+ Collect Fee" button
  - Modal: Large modal with:
    - Student header (ID, admission date)
    - Table with all fee records
    - "+ Collect Fee" button
  - Table Columns:
    - Submit Date
    - Start Date, End Date
    - Amount (paid)
    - Due
    - Status
    - Collected By
    - Description
    - Action (Pay Due button)
  - Styling: Amount in green, Due in red
  - Status Badges: Paid (green), Partial (yellow), Pending (orange)

- [ ] **Feature 19: Collect Fee**
  - API: `POST /Fee/record`
  - Trigger: Click "+ Collect Fee" button in full history
  - Modal: Fee collection form
  - Fields:
    - Start Date (date picker)
    - Duration (1-12 months dropdown)
    - End Date (auto-calculated from start + duration)
    - Total Fee (editable, number input)
    - Collected Fee (editable, number input)
    - Due Amount (auto-calculated, read-only)
    - Description (textarea, optional)
    - Collected By (read-only, "Admin")
  - Auto-Calculation:
    - End Date = Start Date + Duration
    - Due Amount = Total Fee - Collected Fee
  - Payload Fields:
    - vdlId, totalFee, collectedFee, startDate, endDate
    - paymentMode, description, paymentNote
  - Success: 
    - Modal closes
    - Full history updates with new record
    - Seat state updates with new fee status
    - Layout refreshes
  - Feedback: Alert on error

- [ ] **Feature 20: Pay Due Amount**
  - API: `POST /Fee/record` (same as collect fee)
  - Trigger: Click "Pay Due" button on pending record
  - Validation: Can only pay due on first/latest record (idx === 0)
  - Modal: Fee collection form pre-filled with:
    - Total Fee = Due Amount
    - Start/End dates from that record
    - Read-only date fields
    - User enters collected amount
  - Difference from Feature 19: Pre-filled amounts, disabled date fields
  - Success: Record marked as Paid/Partial
  - Feedback: Button disabled if not first record

---

### **Filtering & Visualization**

- [ ] **Feature 14: Filter Seats by Status**
  - API: None (client-side)
  - Trigger: Select option from dropdown (All, Available, Partially-booked, Fully-booked)
  - Filter Logic: Hide seats not matching status
  - Options:
    - "All Seats" - Show everything
    - "Available Only" - Show available seats
    - "Partially Occupied" - Show partially-booked
    - "Fully Occupied" - Show fully-booked
  - Real-time: Updates grid immediately
  - No API call

- [ ] **Feature 21: Shift Filtering**
  - API: None (client-side)
  - Trigger: Select shift combo from dropdown
  - Auto-Generated Options:
    - Single shifts: "Morning 9AM-1PM"
    - Double combos: "Morning & Afternoon"
    - All shifts: "All Shifts (3)"
  - Impact Areas:
    - Occupancy calculation
    - Right panel details
    - Shift students list
  - No API call

- [ ] **Feature 22: Shift Dots Visualization**
  - API: None (client-side)
  - Setting: `show_shift_dots` (on/off)
  - Trigger: If enabled and seat not locked
  - Display: One dot per active shift below seat number
  - Colors:
    - Green (#2ecc71) - Occupied
    - Gray (#bdc3c7) - Available
  - Hover: Tooltip shows shift details + student + fee status
  - Data Source: `seat.shifts[shiftId]` object

---

### **Access Control & Visualization**

- [ ] **Feature 23: RBAC (Role-Based Access Control)**
  - Data Source: `getCurrentUser()`, `hasPermission()`
  - Permissions Checked:
    - `unlock_action` - Unlock buttons
    - `bulk_assign` - Bulk assign button
    - `add_new_row` - Add row button
  - Disable Mechanism: Buttons show disabled with opacity 0.5
  - Tooltip: Explains why disabled
  - Current User Roles:
    - Admin (1) - Full access
    - Internal (2) - Most features
    - External (3) - Limited
    - Student (4) - View only
  - Fallback: Default to Admin if no user

- [ ] **Feature 24: Student View Mode**
  - Trigger: `currentUser.roleId === 4`
  - Hidden Elements:
    - Stats bar (total, occupied, available)
    - Add row/seat buttons
    - Lock/unlock buttons
    - Edit/unassign buttons
    - Right panel (details)
  - Visible Elements:
    - Seat grid only (100% width)
    - Seat occupancy status
    - Shift dots (if enabled)
  - Restrictions:
    - Cannot modify anything
    - Cannot see other students' details
    - Generic "Occupied" status for others
  - Permission Checks: All disabled for students

- [ ] **Feature 11: View Seat Shift Status**
  - API: None (already in state from layout fetch)
  - Trigger: Click on seat
  - Display: Right panel shows shift breakdown
  - For Each Shift:
    - Shift name & time
    - Student name (if assigned)
    - Student ID (VDL ID)
    - Fee status badge
    - Fee history toggle
  - Status Calculation: Check occupancy of each shift
  - No API call (data from component state)

- [ ] **Feature 25: Shift Occupancy Status**
  - Calculation: `getOccupancyStatus(seat, shifts)`
  - Returns:
    - "locked" if seat.locked
    - "fully-booked" if all shifts occupied
    - "partially-booked" if some shifts occupied
    - "available" if no shifts occupied
  - Visual Indicators:
    - Available: Light green (#d4edda)
    - Partially-booked: Orange (#ffeaa7)
    - Fully-booked: Light red (#f8d7da)
    - Locked: Gray (#e2e3e5)
  - CSS Classes: Applied to `.seat-box` element
  - Used For: Filtering, display, calculations

---

### **Bulk Operations**

- [ ] **Feature 6: Bulk Lock All**
  - API: Multiple `PUT /seats/update` + `PUT /rows/update`
  - Trigger: Click "Lock All" button
  - Process:
    - Promise.all() for all seats
    - Promise.all() for all rows
    - Refresh layout after all complete
  - Success: All seats/rows show 🔒 icon
  - Feedback: No alert (silent operation)

- [ ] **Feature 7: Bulk Unlock All**
  - API: Multiple `PUT /seats/update` + `PUT /rows/update`
  - Trigger: Click "Unlock All" button
  - Permission: `unlock_action`
  - Process: Same as bulk lock but `locked: false`
  - Disabled: If user lacks permission
  - Success: All 🔒 icons disappear
  - Feedback: Tooltip if disabled

---

## 🔗 **FEATURE INTERACTION MATRIX**

| Feature | Depends On | Affects | Blocks |
|---------|-----------|---------|--------|
| 1. Fetch Layout | None | All other features | None |
| 2. Add Row | Feature 1 | Feature 3, 4, 10 | Feature 4 (if locked) |
| 3. Add Seat | Feature 1, 2 | Feature 5, 12, 13 | Feature 4, 5 (if locked) |
| 4. Lock Row | Feature 2 | Feature 3, 9, 10 | Feature 3 (prevents add) |
| 5. Lock Seat | Feature 3 | Feature 12, 13, 16 | Feature 12, 13, 16 |
| 6. Bulk Lock | Feature 1 | Feature 4, 5 | Feature 3, 12, 13 |
| 7. Bulk Unlock | Feature 1 | Feature 4, 5 | None |
| 8. Remove Seat | Feature 3 | None | Feature 12, 13 |
| 9. Remove Row | Feature 2 | None | Feature 3, 12, 13 |
| 10. Rename Row | Feature 2 | None | Feature 4 (if locked) |
| 11. View Seat Status | Feature 1, 12 | Feature 14, 21, 22, 25 | None |
| 12. Assign Student | Feature 3 | Feature 11, 16, 17, 18 | Feature 5 (if locked) |
| 13. Unassign Student | Feature 12 | Feature 11, 17 | Feature 5 (if locked) |
| 14. Filter Status | Feature 1 | Feature 11, 25 | None |
| 15. View Shift Students | Feature 12, 21 | None | None |
| 16. Edit Student | Feature 12 | Feature 11 | Feature 5 (if locked) |
| 17. Show Fee History | Feature 16, 18 | Feature 18, 19 | None |
| 18. Full Fee History | Feature 12 | Feature 19, 20 | None |
| 19. Collect Fee | Feature 18 | Feature 11, 16, 17 | None |
| 20. Pay Due | Feature 18 | Feature 11, 16, 17 | None |
| 21. Shift Filter | Feature 1 | Feature 11, 12, 14, 15, 21, 25 | None |
| 22. Shift Dots | Feature 1, 21 | Feature 11 | None |
| 23. RBAC Check | None | 2, 3, 4, 5, 6, 7, 9, 23, 24 | Various |
| 24. Student View | Feature 23 | UI Visibility | Most features |
| 25. Occupancy Status | Feature 1, 21 | Feature 14, 11 | None |

---

## 🧪 **TESTING SCENARIOS**

### **Scenario 1: Complete Student Assignment Flow**
```
1. Fetch layout ✓
2. Add new row ✓
3. Add seat to row ✓
4. Assign student to seat ✓
5. Verify occupancy status ✓
6. View student details ✓
7. Edit student info ✓
8. Collect fee ✓
9. View fee history ✓
```

### **Scenario 2: Lock/Unlock Flow**
```
1. Lock seat ✓
2. Try to assign → should fail ✓
3. Try to edit → should fail ✓
4. Try to unassign → should fail ✓
5. Unlock seat ✓
6. Assign student → should succeed ✓
```

### **Scenario 3: Shift Filtering**
```
1. Select single shift ✓
2. Verify occupancy recalculated ✓
3. Select shift combo ✓
4. Verify correct students shown ✓
5. Filter by status ✓
6. Verify correct seats shown ✓
```

### **Scenario 4: Fee Management**
```
1. Assign student with pending fee ✓
2. Show fee history ✓
3. Collect partial fee ✓
4. View full history ✓
5. Pay remaining due ✓
6. Verify status updates to Paid ✓
```

### **Scenario 5: Permission Testing**
```
1. Login as student ✓
   - No buttons visible ✓
   - Can only view seat ✓
2. Login as manager ✓
   - All buttons visible ✓
   - Full control ✓
3. Login with unlock disabled ✓
   - Unlock button disabled ✓
   - Lock button enabled ✓
```

### **Scenario 6: Error Handling**
```
1. Network failure → Retry 3x ✓
2. 401 Unauthorized → Auto-logout ✓
3. 403 Forbidden → Show permission error ✓
4. Seat already locked → Prevent action ✓
5. Shifts occupied → Show alert ✓
6. Max seats per row → Show alert ✓
```

---

## 🔄 **STATE FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────┐
│              Component Mount                     │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│         fetchLayoutData()                        │
│  GET /SeatManagement/layout                      │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│    Parse Response & Update State:                │
│    - setSeats()                                  │
│    - setLayoutRows()                             │
│    - setRowLocks()                               │
│    - setRowNames()                               │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│       Render Seat Grid                           │
│  - Apply filter (Feature 14)                     │
│  - Show shift dots (Feature 22)                  │
│  - Calculate occupancy (Feature 25)              │
│  - Check RBAC (Feature 23)                       │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│    User Interaction:                             │
│    ├─ Select Seat                                │
│    │  └─ Show Right Panel (Feature 11)           │
│    ├─ Click Assign (Feature 12)                  │
│    │  └─ POST /assignments/create                │
│    │     └─ Refresh Layout                       │
│    ├─ Click Lock (Feature 4/5)                   │
│    │  └─ PUT /seats/update or /rows/update       │
│    │     └─ Refresh Layout                       │
│    ├─ View Fee History (Feature 17)              │
│    │  └─ GET /Fee/student/{id}/records           │
│    ├─ Collect Fee (Feature 19)                   │
│    │  └─ POST /Fee/record                        │
│    │     └─ Refresh Layout                       │
│    └─ ...other actions                           │
└──────────────┬──────────────────────────────────┘
               ↓
         Refresh Layout → Loop
```

---

## 📊 **PERFORMANCE NOTES**

- **Initial Load**: Feature 1 - ~1-2s (with retries)
- **Seat Rendering**: Fast (< 500ms for 200 seats)
- **Student Search**: Real-time (< 100ms)
- **Lock All**: Feature 6 - Parallel requests (2-3s for 100 seats)
- **Fee History**: Feature 17 - Lazy load (on demand)

**Optimization:**
- Uses Promise.all() for parallel requests
- Client-side filtering (no API calls)
- Lazy loads fee history only when requested
- 3-retry mechanism with exponential-like delays

---

## 🎯 **FEATURE DEPENDENCIES**

```
Fetch Layout (1)
│
├─ Row Management (2, 4, 9, 10)
│
├─ Seat Management (3, 5, 8)
│  │
│  └─ Student Assignment (12, 13, 16)
│     │
│     └─ Fee Management (17, 18, 19, 20)
│
├─ Filtering (14, 21)
│  │
│  └─ Visualization (11, 22, 25)
│
└─ Access Control (23)
   │
   └─ Student View (24)
```

---

## ✨ **KEY TAKEAWAYS**

1. **Core Flow**: Load Layout → Select Seat → Assign Student → Manage Fee
2. **Locking**: Prevents any modifications (comprehensive blocking)
3. **Filtering**: Client-side (no API overhead)
4. **Fee**: Post-assignment (dependent on assignment)
5. **RBAC**: Permission-based UI hiding (not security)
6. **Refresh**: After each modification (always re-fetch)
7. **Error Handling**: Alerts for user feedback, retries for network
8. **Student Mode**: Read-only view (no modifications possible)

