# SeatManagement - Quick Reference Guide

## 🚀 **Quick API Reference**

### **Base URL**
```
http://localhost:5000/api
```

### **Authentication Header (All Requests)**
```
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json
Accept: text/plain
```

---

## **🔴 LAYOUT MANAGEMENT APIs**

### **1. GET Layout (Fetch All Seats)**
```bash
curl -X GET "http://localhost:5000/api/SeatManagement/layout" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Accept: text/plain"
```
**Used For:** Initialize layout on component mount

---

### **2. CREATE Row**
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
**Used For:** Add new row | **Permission:** `add_new_row`

---

### **3. UPDATE Row (Lock/Unlock/Rename)**
```bash
# Rename Row
curl -X PUT "http://localhost:5000/api/SeatManagement/rows/update/1" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Section",
    "isLocked": false
  }'

# Lock Row
curl -X PUT "http://localhost:5000/api/SeatManagement/rows/update/1" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Row 1",
    "isLocked": true,
    "locked": true
  }'

# Unlock Row
curl -X PUT "http://localhost:5000/api/SeatManagement/rows/update/1" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Row 1",
    "isLocked": false,
    "locked": false
  }'
```
**Used For:** Modify row settings | **Permission:** `unlock_action` (for unlock)

---

### **4. DELETE Row**
```bash
curl -X DELETE "http://localhost:5000/api/SeatManagement/rows/delete/2" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```
**Used For:** Remove entire row

---

### **5. CREATE Seat**
```bash
curl -X POST "http://localhost:5000/api/SeatManagement/seats/create" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatRowId": 1,
    "seatLabel": "R1-05"
  }'
```
**Used For:** Add new seat to row

---

### **6. UPDATE Seat (Lock/Unlock)**
```bash
# Lock Seat
curl -X PUT "http://localhost:5000/api/SeatManagement/seats/update/5" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "locked": true,
    "isLocked": true
  }'

# Unlock Seat
curl -X PUT "http://localhost:5000/api/SeatManagement/seats/update/5" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "locked": false,
    "isLocked": false
  }'
```
**Used For:** Lock/unlock seat | **Permission:** `unlock_action` (for unlock)

---

### **7. DELETE Seat**
```bash
curl -X DELETE "http://localhost:5000/api/SeatManagement/seats/delete/5" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```
**Used For:** Remove seat

---

## **🟢 ASSIGNMENT MANAGEMENT APIs**

### **8. CREATE Assignment (Assign Student)**
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
**Used For:** Assign student to seat for specific shift

**Status Values:**
- `booked` → Student has Paid fee
- `pending` → Student has Pending fee

---

### **9. DELETE Assignment (Unassign Student)**
```bash
curl -X DELETE "http://localhost:5000/api/SeatManagement/assignments/delete/101" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```
**Used For:** Remove student from seat

---

### **10. UPDATE Student (Edit Details)**
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
    "feeStatus": "Paid"
  }'
```
**Used For:** Update student information | **Field:** vdlId in URL

---

## **💰 FEE MANAGEMENT APIs**

### **11. GET Fee History**
```bash
curl -X GET "http://localhost:5000/api/Fee/student/VDL001/records" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```
**Used For:** Fetch payment history for a student | **Field:** vdlId in URL

**Response Structure:**
```json
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
}
```

---

### **12. POST Fee Record (Collect/Pay Fee)**
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
**Used For:** Record new fee payment or pay due amount

**Payment Mode Options:**
- UPI
- Cash
- Bank Transfer
- Credit/Debit Card
- Net Banking

---

## **📊 FEATURE MATRIX**

| Feature | Method | Endpoint | Needs Auth | Permission |
|---------|--------|----------|------------|-----------|
| Fetch Layout | GET | `/SeatManagement/layout` | ✅ | None |
| Create Row | POST | `/SeatManagement/rows/create` | ✅ | `add_new_row` |
| Update Row | PUT | `/SeatManagement/rows/update/{id}` | ✅ | `unlock_action` |
| Delete Row | DELETE | `/SeatManagement/rows/delete/{id}` | ✅ | None |
| Create Seat | POST | `/SeatManagement/seats/create` | ✅ | None |
| Update Seat | PUT | `/SeatManagement/seats/update/{id}` | ✅ | `unlock_action` |
| Delete Seat | DELETE | `/SeatManagement/seats/delete/{id}` | ✅ | None |
| Create Assignment | POST | `/SeatManagement/assignments/create` | ✅ | None |
| Delete Assignment | DELETE | `/SeatManagement/assignments/delete/{id}` | ✅ | None |
| Update Student | PUT | `/Student/update/{vdlId}` | ✅ | None |
| Get Fee History | GET | `/Fee/student/{vdlId}/records` | ✅ | None |
| Create Fee Record | POST | `/Fee/record` | ✅ | None |

---

## **🎯 COMMON WORKFLOWS**

### **Workflow 1: Add Seat and Assign Student**
```bash
# Step 1: Create Seat
curl -X POST "http://localhost:5000/api/SeatManagement/seats/create" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"seatRowId": 1, "seatLabel": "R1-05"}'

# Step 2: Assign Student (use seatId from response)
curl -X POST "http://localhost:5000/api/SeatManagement/assignments/create" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"seatId": 5, "shiftId": "1", "studentId": 50, "status": "booked"}'

# Step 3: Collect Fee
curl -X POST "http://localhost:5000/api/Fee/record" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vdlId": "VDL001",
    "totalFee": 5000,
    "collectedFee": 5000,
    "startDate": "2024-03-01",
    "endDate": "2024-03-31",
    "paymentMode": "UPI",
    "description": "Advance Fee"
  }'
```

---

### **Workflow 2: Lock All and Bulk Unlock**
```bash
# Lock All (single request - handled by Promise.all in component)
# Component makes multiple requests:
curl -X PUT "http://localhost:5000/api/SeatManagement/seats/update/1" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locked": true, "isLocked": true}'

curl -X PUT "http://localhost:5000/api/SeatManagement/seats/update/2" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locked": true, "isLocked": true}'

# ... repeat for all seats, then rows
```

---

### **Workflow 3: View and Pay Fee**
```bash
# Step 1: Get Fee History
curl -X GET "http://localhost:5000/api/Fee/student/VDL001/records" \
  -H "Authorization: Bearer TOKEN"

# Step 2: Pay Due Amount (from response)
curl -X POST "http://localhost:5000/api/Fee/record" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vdlId": "VDL001",
    "totalFee": 2000,
    "collectedFee": 2000,
    "startDate": "2024-03-01",
    "endDate": "2024-03-31",
    "paymentMode": "Cash",
    "description": "Payment of due amount"
  }'
```

---

## **📋 STATUS VALUES**

**Assignment Status:**
- `booked` - Full payment received
- `pending` - Payment pending
- `available` - No assignment

**Fee Status:**
- `Paid` - Full amount collected
- `Pending` - No payment received
- `Partial` - Partial payment received

**Row/Seat Lock Status:**
- `true` / `isLocked: true` - Locked (no modifications)
- `false` / `isLocked: false` - Unlocked (modifications allowed)

**Occupancy Status:**
- `available` - All shifts free
- `partially-booked` - Some shifts occupied
- `fully-booked` - All shifts occupied
- `locked` - Seat locked

---

## **⚙️ QUERY PARAMETERS**

Currently, the SeatManagement APIs do NOT use query parameters. All filtering is done client-side:

- **Filter by Status** → Client-side filtering
- **Filter by Shift** → Client-side filtering via `activeShiftFilter`
- **Search Students** → Client-side search via `searchQuery`

---

## **🔍 DEBUGGING TIPS**

### **Check Token in Browser:**
```javascript
// In browser console
localStorage.getItem('authToken')
localStorage.getItem('token')
localStorage.getItem('jwt_token')
```

### **Monitor API Calls:**
```javascript
// Calls are logged via logApiCall()
// Check browser Console and Network tab
// Log format: "Request: METHOD ENDPOINT"
```

### **Verify Permissions:**
```javascript
// In browser console, after app loads
getCurrentUser()  // Check current user
hasPermission(user, 'unlock_action')  // Check specific permission
```

---

## **❌ Common Error Responses**

### **401 Unauthorized**
```json
{
  "status": 401,
  "message": "Your session has expired or token is invalid. Please login again."
}
```
**Solution:** Re-login, check token validity

---

### **403 Forbidden**
```json
{
  "status": 403,
  "message": "Permission denied. Please contact your administrator."
}
```
**Solution:** User lacks required permission for this feature

---

### **400 Bad Request**
```json
{
  "status": 400,
  "message": "Invalid input or missing required fields",
  "errors": {
    "seatRowId": "Required field"
  }
}
```
**Solution:** Check request payload format

---

### **404 Not Found**
```json
{
  "status": 404,
  "message": "Seat not found"
}
```
**Solution:** Resource doesn't exist (already deleted?)

---

### **500 Internal Server Error**
```json
{
  "status": 500,
  "message": "Internal server error. Please try again later."
}
```
**Solution:** Server issue, retry after some time

---

## **🔄 PAGINATION & LIMITS**

Currently, NO pagination implemented:
- All seats loaded in single request
- Max 20 seats per row (enforced by component)
- Fee history loaded completely (not paginated)

---

## **⏱️ RETRY MECHANISM**

**Layout fetch** has automatic retry:
- Max 3 retries
- Delay: 1.5 seconds between attempts
- Used for initial data load only

---

## **📱 Response Headers**

```
Content-Type: application/json
Authorization: Bearer [HIDDEN]
Accept: text/plain
```

---

## **🔐 Security Notes**

1. Token stored in localStorage (not secure for sensitive apps)
2. Token sanitized before sending (removes extra quotes)
3. All API calls require Bearer token
4. 401 errors trigger auto-logout
5. No CSRF tokens used currently
6. CORS configured on backend

---

## **📚 Related Files**

- **Component:** `src/features/seats/SeatManagement.js`
- **Service:** `src/services/seatManagementService.js`
- **API Client:** `src/services/apis.js`
- **Styles:** `src/styles/SeatManagement.css`
- **Hooks:** `src/hooks/useShifts.js`, `src/hooks/useStudents.js`
- **Settings:** `src/features/seats/Settings.js`

