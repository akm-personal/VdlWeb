# SeatManagement Component - Detailed Analysis

---

## 📋 **Overview**
The SeatManagement component is a comprehensive seat/row management system for VDL (Visual Display Layout) with features like:
- Seat and row creation/deletion/locking
- Student assignment to seats across multiple shifts
- Fee management and collection
- RBAC (Role-Based Access Control)
- Real-time seat occupancy tracking

---

## 🎯 **Key Features with Details**

### **Feature 1: Fetch Layout & Initialize Seats**

**Purpose:** Load the entire seat layout from backend including rows, seats, and student assignments.

**How it Works:**
1. Component mounts → calls `fetchLayoutData()`
2. Makes API request to get all rows with their seats
3. Processes response to map assignments to shifts
4. Stores data in state: seats, layoutRows, rowLocks, rowNames
5. Retry mechanism: 3 retries with 1.5s delay if fails

**API Endpoint:**
```
GET /api/SeatManagement/layout
```

**Request (CURL):**
```bash
curl -X GET "http://localhost:5000/api/SeatManagement/layout" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Accept: text/plain" \
  -H "Content-Type: application/json"
```

**Response Sample:**
```json
{
  "data": [
    {
      "rowId": 1,
      "row": 1,
      "id": 1,
      "rowName": "Row 1",
      "name": "Row 1",
      "isLocked": false,
      "locked": false,
      "seats": [
        {
          "seatId": 1,
          "id": 1,
          "seatLabel": "R1-01",
          "seatOrder": 1,
          "number": 1,
          "rowId": 1,
          "row": 1,
          "isLocked": false,
          "locked": false,
          "shifts": {},
          "assignments": [
            {
              "id": 101,
              "assignmentId": 101,
              "seatId": 1,
              "shiftId": "1",
              "studentId": 50,
              "studentName": "Raj Kumar",
              "vdlId": "VDL001",
              "status": "booked",
              "feeStatus": "Paid"
            }
          ]
        }
      ]
    }
  ]
}
```

**Data Flow:**
- Response → Parse assignments → Map to shifts structure → Sort by seat number → Set state

---

### **Feature 2: Add New Row**

**Purpose:** Create a new row in the layout for organizing seats.

**How it Works:**
1. User clicks "+ Add New Row" button
2. Calculates next row order (max existing + 1)
3. Calls `createRow()` API with row data
4. Refreshes layout to show new row
5. Error handling if API fails

**API Endpoint:**
```
POST /api/SeatManagement/rows/create
```

**Request (CURL):**
```bash
curl -X POST "http://localhost:5000/api/SeatManagement/rows/create" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rowOrder": 3,
    "rowName": "Row 3",
    "name": "Row 3"
  }'
```

**Response Sample:**
```json
{
  "rowId": 3,
  "rowOrder": 3,
  "rowName": "Row 3",
  "name": "Row 3",
  "isLocked": false,
  "seats": [],
  "message": "Row created successfully"
}
```

**Permission Required:** `add_new_row` (Admin/Manager only)

---

### **Feature 3: Add Seat to Row**

**Purpose:** Create new seat within a specific row (max 20 seats per row).

**How it Works:**
1. User clicks "+" button on row
2. Validates row not locked
3. Validates max 20 seats per row limit
4. Calculates seat label (R{rowNum}-{seatNum})
5. Calls `createSeat()` API
6. Refreshes layout

**API Endpoint:**
```
POST /api/SeatManagement/seats/create
```

**Request (CURL):**
```bash
curl -X POST "http://localhost:5000/api/SeatManagement/seats/create" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatRowId": 1,
    "seatLabel": "R1-05"
  }'
```

**Response Sample:**
```json
{
  "seatId": 5,
  "id": 5,
  "seatLabel": "R1-05",
  "seatOrder": 5,
  "rowId": 1,
  "isLocked": false,
  "shifts": {},
  "assignments": [],
  "message": "Seat created successfully"
}
```

---

### **Feature 4: Lock/Unlock Row**

**Purpose:** Prevent modifications to a row and its seats.

**How it Works:**
1. User clicks "Lock Row" / "Unlock Row" in right panel
2. Toggle `isLocked` state
3. Call `updateRow()` API with new lock status
4. Refresh layout
5. All seats in locked row become non-editable

**API Endpoint (Lock):**
```
PUT /api/SeatManagement/rows/update/{rowId}
```

**Request (CURL) - Lock Row:**
```bash
curl -X PUT "http://localhost:5000/api/SeatManagement/rows/update/1" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isLocked": true,
    "locked": true,
    "name": "Row 1"
  }'
```

**Response Sample (Lock):**
```json
{
  "rowId": 1,
  "name": "Row 1",
  "isLocked": true,
  "message": "Row locked successfully"
}
```

**Request (CURL) - Unlock Row:**
```bash
curl -X PUT "http://localhost:5000/api/SeatManagement/rows/update/1" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isLocked": false,
    "locked": false,
    "name": "Row 1"
  }'
```

**Permission Required:** `unlock_action` (for unlocking)

---

### **Feature 5: Lock/Unlock Individual Seat**

**Purpose:** Lock a single seat to prevent assignments/changes.

**How it Works:**
1. User selects seat → clicks "Lock Seat" / "Unlock Seat"
2. Toggle `locked` status
3. Call `updateSeat()` API
4. Refresh layout
5. Locked seat shown with 🔒 icon

**API Endpoint:**
```
PUT /api/SeatManagement/seats/update/{seatId}
```

**Request (CURL) - Lock Seat:**
```bash
curl -X PUT "http://localhost:5000/api/SeatManagement/seats/update/5" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "locked": true,
    "isLocked": true
  }'
```

**Response Sample:**
```json
{
  "seatId": 5,
  "id": 5,
  "locked": true,
  "isLocked": true,
  "message": "Seat locked successfully"
}
```

---

### **Feature 6: Bulk Lock All Seats/Rows**

**Purpose:** Lock all seats and rows at once (emergency feature).

**How it Works:**
1. User clicks "Lock All" button
2. Calls `updateSeat()` for ALL seats with `locked: true`
3. Calls `updateRow()` for ALL rows with `isLocked: true`
4. Uses Promise.all() for parallel execution
5. Refreshes layout after all API calls complete

**API Endpoints Used:**
- Multiple `PUT /api/SeatManagement/seats/update/{id}`
- Multiple `PUT /api/SeatManagement/rows/update/{id}`

**Request (CURL) - Example for one seat:**
```bash
# Example for seat 1
curl -X PUT "http://localhost:5000/api/SeatManagement/seats/update/1" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locked": true, "isLocked": true}'

# Example for seat 2
curl -X PUT "http://localhost:5000/api/SeatManagement/seats/update/2" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locked": true, "isLocked": true}'

# ... repeat for all seats
```

---

### **Feature 7: Bulk Unlock All Seats/Rows**

**Purpose:** Unlock all seats and rows at once.

**How it Works:**
1. User clicks "Unlock All" button (if permitted)
2. Permission check: `unlock_action`
3. Same as bulk lock but with `locked: false`
4. Disabled if user doesn't have permission

**Permission Required:** `unlock_action` (Admin/Manager only)

---

### **Feature 8: Remove Seat**

**Purpose:** Delete a seat from the layout.

**How it Works:**
1. User selects seat → clicks "Remove Seat"
2. Validates seat is not locked
3. Calls `deleteSeat()` API
4. Clears seat from state
5. Refreshes layout

**API Endpoint:**
```
DELETE /api/SeatManagement/seats/delete/{seatId}
```

**Request (CURL):**
```bash
curl -X DELETE "http://localhost:5000/api/SeatManagement/seats/delete/5" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response Sample:**
```json
{
  "seatId": 5,
  "message": "Seat deleted successfully"
}
```

---

### **Feature 9: Remove Row**

**Purpose:** Delete entire row from layout.

**How it Works:**
1. User selects row → clicks "Remove Row"
2. Validates row is not locked
3. Optimistic update: removes row from state immediately
4. Calls `deleteRow()` API
5. If fails: refreshes layout to restore
6. If success: removes all seats in that row

**API Endpoint:**
```
DELETE /api/SeatManagement/rows/delete/{rowId}
```

**Request (CURL):**
```bash
curl -X DELETE "http://localhost:5000/api/SeatManagement/rows/delete/2" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response Sample:**
```json
{
  "rowId": 2,
  "message": "Row deleted successfully"
}
```

---

### **Feature 10: Rename Row**

**Purpose:** Change row name/label.

**How it Works:**
1. User selects row → edits name in text input
2. On blur event → calls `updateRow()` API
3. Updates rowNames state with new name
4. Prevents rename if row is locked
5. Returns to original name if update fails

**API Endpoint:**
```
PUT /api/SeatManagement/rows/update/{rowId}
```

**Request (CURL):**
```bash
curl -X PUT "http://localhost:5000/api/SeatManagement/rows/update/1" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Section",
    "isLocked": false
  }'
```

**Response Sample:**
```json
{
  "rowId": 1,
  "name": "Premium Section",
  "message": "Row updated successfully"
}
```

---

### **Feature 11: View Seat Shift Status**

**Purpose:** Display occupancy status of a seat for selected shift(s).

**How it Works:**
1. User selects a seat
2. Right panel shows shift breakdown
3. For each shift, displays:
   - Shift name and time
   - Student assigned (if any)
   - Fee status (Paid/Pending/Due)
4. Status badges show: Available, Booked, Pending
5. Shift dots in seat box show occupancy visually

**Status Calculation:**
```javascript
getOccupancyStatus(seat, shifts) {
  - If locked → 'locked'
  - Count occupied shifts
  - If all shifts occupied → 'fully-booked'
  - If some shifts occupied → 'partially-booked'
  - Otherwise → 'available'
}
```

---

### **Feature 12: Assign Student to Seat**

**Purpose:** Assign a student to a seat for specific shift(s).

**How it Works:**
1. User clicks "Assign Student" button on empty seat
2. Assign modal opens with student search
3. User searches/selects student
4. Student can be assigned to:
   - Single shift
   - Multiple shifts (combo)
   - All shifts
5. Validates shifts are available
6. Sets status based on student's fee status (Paid → 'booked', Pending → 'pending')
7. Calls `createAssignment()` for each shift

**API Endpoint:**
```
POST /api/SeatManagement/assignments/create
```

**Request (CURL) - Assign to Shift 1:**
```bash
curl -X POST "http://localhost:5000/api/SeatManagement/assignments/create" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatId": 5,
    "shiftId": "1",
    "studentId": 50,
    "status": "booked"
  }'
```

**Response Sample:**
```json
{
  "id": 101,
  "assignmentId": 101,
  "seatId": 5,
  "shiftId": "1",
  "studentId": 50,
  "status": "booked",
  "message": "Assignment created successfully"
}
```

**Multiple Assignments (Promise.all):**
```bash
# For shift 1
curl -X POST "http://localhost:5000/api/SeatManagement/assignments/create" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"seatId": 5, "shiftId": "1", "studentId": 50, "status": "booked"}'

# For shift 2 (parallel)
curl -X POST "http://localhost:5000/api/SeatManagement/assignments/create" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"seatId": 5, "shiftId": "2", "studentId": 50, "status": "booked"}'
```

---

### **Feature 13: Unassign Student from Seat**

**Purpose:** Remove student assignment from a seat's specific shift(s).

**How it Works:**
1. User clicks "Unassign" button on assigned seat
2. Validates seat not locked
3. Gets assignment IDs from shift data
4. Calls `deleteAssignment()` for each shift
5. If assignment ID not found, uses fallback deletion pattern
6. Refreshes layout

**API Endpoint:**
```
DELETE /api/SeatManagement/assignments/delete/{assignmentId}
```

**Request (CURL):**
```bash
curl -X DELETE "http://localhost:5000/api/SeatManagement/assignments/delete/101" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response Sample:**
```json
{
  "assignmentId": 101,
  "message": "Assignment deleted successfully"
}
```

---

### **Feature 14: Filter Seats by Status**

**Purpose:** View only seats matching specific occupancy status.

**How it Works:**
1. User selects filter from dropdown:
   - "All Seats"
   - "Available Only"
   - "Partially Occupied"
   - "Fully Occupied"
2. React filters seat display in real-time
3. No API call - client-side filtering
4. Layout recalculates based on filter

**Filter Logic:**
```javascript
if (filter !== 'All' && filter.toLowerCase() !== status) {
  // Don't render this seat
}
```

---

### **Feature 15: View Shift Students**

**Purpose:** Display all students assigned to selected shift(s).

**How it Works:**
1. User clicks "View Shift Students" button
2. Modal opens showing table of all students
3. Shows: Seat, Student Name, ID, Shifts, Fee Status
4. Combines multiple shifts if selected
5. Groups by student (if same student on multiple seats)

**Data Structure:**
```javascript
{
  seatId: 1,
  seatLabel: "R1-01",
  student: { id, name, vdlId, feeStatus },
  shifts: ["1", "2"],
  status: "booked"
}
```

---

### **Feature 16: Edit Student Details**

**Purpose:** Update student information associated with seat assignment.

**How it Works:**
1. User clicks "Edit" button on assigned student
2. Edit modal opens with form
3. Fields:
   - Student Name (with autocomplete search)
   - Start Date
   - End Date
   - Fee Amount
   - Fee Status
   - Admission Date (read-only)
   - Payment Mode
4. Can change assigned student
5. Calls `updateStudent()` API

**API Endpoint:**
```
PUT /api/Student/update/{vdlId}
```

**Request (CURL):**
```bash
curl -X PUT "http://localhost:5000/api/Student/update/VDL001" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 50,
    "name": "Raj Kumar",
    "admissionDate": "2024-01-15",
    "fromDate": "2024-02-01",
    "toDate": "2024-12-31",
    "feeAmount": 5000,
    "previousFee": 5000,
    "feeStatus": "Paid"
  }'
```

**Response Sample:**
```json
{
  "id": 50,
  "vdlId": "VDL001",
  "name": "Raj Kumar",
  "fromDate": "2024-02-01",
  "toDate": "2024-12-31",
  "feeAmount": 5000,
  "feeStatus": "Paid",
  "message": "Student updated successfully"
}
```

---

### **Feature 17: Show/Hide Fee History**

**Purpose:** Display payment history for a student.

**How it Works:**
1. User clicks "Show Fee History ▼" on assigned student
2. API call to fetch fee records for student
3. Processes response:
   - Calculates total paid from payments array
   - Gets last payment date
   - Calculates due amount
4. Stores in feeHistory array
5. Shows last 3 records in dropdown
6. Can view full history by clicking "View Full History"

**API Endpoint:**
```
GET /api/Fee/student/{vdlId}/records
```

**Request (CURL):**
```bash
curl -X GET "http://localhost:5000/api/Fee/student/VDL001/records" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response Sample:**
```json
[
  {
    "id": 1001,
    "startDate": "2024-02-01",
    "endDate": "2024-02-29",
    "totalFee": 5000,
    "status": "Paid",
    "payments": [
      {
        "amountPaid": 5000,
        "paymentDate": "2024-02-10",
        "paymentMode": "UPI"
      }
    ]
  },
  {
    "id": 1002,
    "startDate": "2024-03-01",
    "endDate": "2024-03-31",
    "totalFee": 5000,
    "status": "Partial",
    "payments": [
      {
        "amountPaid": 2500,
        "paymentDate": "2024-03-05",
        "paymentMode": "Cash"
      }
    ]
  }
]
```

**Data Mapping:**
```javascript
{
  id: 1001,
  date: "2024-02-10T10:30:00", // last payment date
  startDate: "2024-02-01",
  endDate: "2024-02-29",
  amount: 5000, // total paid
  dueAmount: 0, // totalFee - totalPaid
  status: "Paid",
  paymentMode: "UPI"
}
```

---

### **Feature 18: View Full Fee History**

**Purpose:** Display complete fee payment history for a student.

**How it Works:**
1. User clicks "View Full History" button
2. Full Fee History modal opens
3. Shows table with all fee records:
   - Submit Date
   - Start Date, End Date
   - Amount Paid
   - Due Amount
   - Status (Paid/Partial/Pending)
   - Collected By (staff name)
   - Description
4. Allows "Pay Due" action on pending records

---

### **Feature 19: Collect Fee**

**Purpose:** Record new fee payment for a student.

**How it Works:**
1. User clicks "+ Collect Fee" in full history view
2. Fee collection modal opens with form
3. Fields:
   - Start Date (date picker)
   - Duration (1-12 months dropdown)
   - End Date (auto-calculated, read-only)
   - Total Fee (editable)
   - Collected Fee (editable)
   - Due Amount (auto-calculated)
   - Description (optional notes)
4. Calls `POST /api/Fee/record` API
5. Refreshes fee history
6. Updates fee data in seat state

**Fee Amount Auto-Calculation:**
```javascript
dueAmount = totalFee - collectedFee
```

**API Endpoint:**
```
POST /api/Fee/record
```

**Request (CURL):**
```bash
curl -X POST "http://localhost:5000/api/Fee/record" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vdlId": "VDL001",
    "totalFee": 5000,
    "collectedFee": 3000,
    "startDate": "2024-03-01",
    "endDate": "2024-03-31",
    "paymentMode": "UPI",
    "description": "Fee Payment for March",
    "paymentNote": "Fee Payment"
  }'
```

**Response Sample:**
```json
{
  "id": 1002,
  "vdlId": "VDL001",
  "totalFee": 5000,
  "collectedFee": 3000,
  "dueAmount": 2000,
  "startDate": "2024-03-01",
  "endDate": "2024-03-31",
  "paymentMode": "UPI",
  "description": "Fee Payment for March",
  "message": "Fee record created successfully"
}
```

---

### **Feature 20: Pay Due Amount**

**Purpose:** Collect remaining/partial payment on a fee record.

**How it Works:**
1. User clicks "Pay Due" button on pending fee record
2. Fee collection modal opens
3. Pre-fills:
   - Total Fee = Due Amount
   - Start/End dates from that record
4. User enters collected amount
5. Can only be used on first/latest record (idx === 0 validation)
6. Same API as Feature 19

**Request (CURL):**
```bash
curl -X POST "http://localhost:5000/api/Fee/record" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vdlId": "VDL001",
    "totalFee": 2000,
    "collectedFee": 2000,
    "startDate": "2024-03-01",
    "endDate": "2024-03-31",
    "paymentMode": "Cash",
    "description": "Remaining payment for March",
    "paymentNote": "Due payment collected"
  }'
```

---

### **Feature 21: Shift Filtering**

**Purpose:** Filter seat display and assignments by specific shift combinations.

**How it Works:**
1. User selects shift from dropdown (top bar)
2. Can select:
   - Single shift (e.g., "Morning 9AM-1PM")
   - Double combo (e.g., "Morning & Evening")
   - All shifts combo
3. Dropdown auto-generated from active shifts
4. Affects:
   - Seat occupancy calculation
   - Right panel seat details
   - Shift students list
5. No API call - client-side filtering

**Shift Combination Logic:**
```javascript
// Single shifts
"1" → Morning

// Double combinations
"1,2" → Morning & Afternoon

// All combinations
"1,2,3" → All Shifts (3)
```

---

### **Feature 22: Shift Dots Visualization**

**Purpose:** Show mini indicators on each seat for shift occupancy status.

**How it Works:**
1. If setting `show_shift_dots` is enabled
2. For each seat, display small dots (one per active shift)
3. Green dot = occupied, Gray dot = available
4. Hover tooltip shows:
   - Shift name & time
   - Student name (if assigned)
   - Fee status
5. Locked seats don't show dots

**Setting Check:**
```javascript
const showShiftDotsEnabled = dbSettings
  .find(s => s.id === 'show_shift_dots')?.status !== 'off'
```

---

### **Feature 23: RBAC (Role-Based Access Control)**

**Purpose:** Restrict features based on user role and permissions.

**How it Works:**
1. On component mount, gets current user via `getCurrentUser()`
2. Checks permissions for:
   - `unlock_action` → Can unlock rows/seats
   - `bulk_assign` → Can bulk assign students
   - `add_new_row` → Can add new rows
3. Disables buttons if user lacks permission
4. Student role (roleId 4) sees minimal UI
5. Shows tooltip explaining why disabled

**Permissions Check:**
```javascript
const canUnlock = hasPermission(currentUser, 'unlock_action')
const canBulkAssign = hasPermission(currentUser, 'bulk_assign')
const canAddRow = hasPermission(currentUser, 'add_new_row')
```

---

### **Feature 24: Student View Mode**

**Purpose:** Limited UI for students viewing only their own seat.

**How it Works:**
1. If `currentUser.roleId === 4` (student)
2. Hides admin controls:
   - Stats bar
   - Add row/seat buttons
   - Lock/unlock buttons
   - Edit/unassign buttons
3. Only shows seat grid (100% width)
4. Can only view status of their own seat
5. Shows "Occupied" status generically for other students

---

### **Feature 25: Shift Occupancy Status**

**Purpose:** Calculate and display seat availability across shifts.

**How it Works:**
```javascript
getOccupancyStatus(seat, shifts) {
  if (seat.locked) return 'locked'
  
  let occupiedCount = 0
  for (each shift in selectedShifts) {
    if (seat.shifts[shift]?.status !== 'available') {
      occupiedCount++
    }
  }
  
  if (occupiedCount === shifts.length && shifts.length > 0)
    return 'fully-booked'
  if (occupiedCount > 0)
    return 'partially-booked'
  return 'available'
}
```

**Visual Indicators:**
- Available: Light green background
- Partially Occupied: Yellow/orange background
- Fully Occupied: Red background
- Locked: Gray background with 🔒 icon

---

## 🔑 **Key State Management**

```javascript
const [seats, setSeats] = useState([])              // All seats data
const [selectedSeatId, setSelectedSeatId] = useState(null)
const [selectedRow, setSelectedRow] = useState(null)
const [rowLocks, setRowLocks] = useState({})        // Row lock status map
const [rowNames, setRowNames] = useState({})        // Row name map
const [layoutRows, setLayoutRows] = useState([])    // Row IDs array
const [filter, setFilter] = useState('All')         // Seat filter
const [activeShiftFilter, setActiveShiftFilter] = useState()
const [assignShiftFilter, setAssignShiftFilter] = useState()

// Modal states
const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
const [isEditModalOpen, setIsEditModalOpen] = useState(false)
const [isShiftStudentsModalOpen, setIsShiftStudentsModalOpen] = useState(false)
const [isFeeCollectionModalOpen, setIsFeeCollectionModalOpen] = useState(false)
const [fullHistoryStudent, setFullHistoryStudent] = useState(null)
```

---

## 🌐 **API Summary Table**

| Feature | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Fetch Layout | GET | `/SeatManagement/layout` | Get all rows & seats |
| Create Row | POST | `/SeatManagement/rows/create` | Add new row |
| Update Row | PUT | `/SeatManagement/rows/update/{id}` | Edit/lock row |
| Delete Row | DELETE | `/SeatManagement/rows/delete/{id}` | Remove row |
| Create Seat | POST | `/SeatManagement/seats/create` | Add new seat |
| Update Seat | PUT | `/SeatManagement/seats/update/{id}` | Lock/unlock seat |
| Delete Seat | DELETE | `/SeatManagement/seats/delete/{id}` | Remove seat |
| Assign Student | POST | `/SeatManagement/assignments/create` | Assign to seat |
| Unassign Student | DELETE | `/SeatManagement/assignments/delete/{id}` | Remove assignment |
| Update Student | PUT | `/Student/update/{vdlId}` | Edit student details |
| Fetch Fee History | GET | `/Fee/student/{vdlId}/records` | Get payment history |
| Collect Fee | POST | `/Fee/record` | Record fee payment |

---

## 📊 **Data Flow Diagram**

```
Component Mount
    ↓
fetchLayoutData() 
    ↓
GET /SeatManagement/layout
    ↓
Parse Response (map assignments to shifts)
    ↓
setSeats, setLayoutRows, setRowLocks, setRowNames
    ↓
Render Seat Grid
    ↓
User Interactions:
    ├─ Click Seat → Show Right Panel Details
    ├─ Click Row → Show Row Settings
    ├─ Assign Student → POST /assignments/create
    ├─ Edit Student → PUT /Student/update/{vdlId}
    ├─ View Fee History → GET /Fee/student/{vdlId}/records
    ├─ Collect Fee → POST /Fee/record
    ├─ Lock/Unlock → PUT /seats/update or /rows/update
    └─ Delete → DELETE endpoints
    ↓
Refresh Layout (re-fetch latest data)
```

---

## 🔐 **Authentication Flow**

All API requests include:
```
Authorization: Bearer {authToken}
Content-Type: application/json
Accept: text/plain
```

Token retrieval (in order):
1. `localStorage.authToken`
2. `localStorage.token`
3. `localStorage.jwt_token`

Token sanitization:
- Removes surrounding quotes
- Removes "Bearer " prefix if present
- Validates not null/undefined

---

## ⚠️ **Error Handling**

1. **401 Unauthorized**: Auto-logout, redirect to login
2. **403 Forbidden**: Show permission error
3. **API Errors**: Show alert with error message
4. **Network Errors**: Retry mechanism (3 retries for layout fetch)

---

## 🎨 **Feature Interaction Map**

```
SeatManagement Component
│
├─ Layout Management
│  ├─ Add Row (Feature 2)
│  ├─ Rename Row (Feature 10)
│  ├─ Lock/Unlock Row (Feature 4)
│  ├─ Remove Row (Feature 9)
│  ├─ Add Seat (Feature 3)
│  ├─ Lock/Unlock Seat (Feature 5)
│  └─ Remove Seat (Feature 8)
│
├─ Assignment Management
│  ├─ Assign Student (Feature 12)
│  ├─ Unassign Student (Feature 13)
│  ├─ Edit Student Details (Feature 16)
│  └─ View Shift Students (Feature 15)
│
├─ Fee Management
│  ├─ Show/Hide Fee History (Feature 17)
│  ├─ View Full History (Feature 18)
│  ├─ Collect Fee (Feature 19)
│  └─ Pay Due Amount (Feature 20)
│
├─ Filtering & Visualization
│  ├─ Filter by Status (Feature 14)
│  ├─ Shift Filtering (Feature 21)
│  ├─ Shift Dots (Feature 22)
│  └─ Occupancy Status (Feature 25)
│
├─ Access Control
│  ├─ RBAC Checks (Feature 23)
│  └─ Student View Mode (Feature 24)
│
└─ Data Management
   ├─ Fetch Layout (Feature 1)
   └─ Shift Status (Feature 11)
```

---

## 📝 **Configuration & Settings**

**Settings Controlled from Settings.js:**

1. `show_shift_dots` (on/off) → Enables shift dots on seats
2. `unlock_action` (on/off) → Allows unlock operations
3. `bulk_assign` (on/off) → Enables bulk assign button
4. `add_new_row` (on/off) → Allows adding new rows

**RBAC Roles:**
- Admin (roleId: 1) → Full access
- Internal (roleId: 2) → Most features
- External (roleId: 3) → Limited features
- Student (roleId: 4) → View only

