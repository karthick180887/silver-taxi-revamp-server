# DOM Analysis: Admin Enquiry Page
## URL: https://admin.silvertaxi.in/admin/enquiry

**Analysis Date:** 2025-01-12  
**Page Title:** Silver Taxi  
**Framework:** Next.js (React-based) with App Router

---

## 1. Page Structure Overview

### 1.1 Main Container Hierarchy
```
generic (root)
└── generic (main container - flex layout)
    ├── generic (sidebar container - fixed left)
    │   ├── generic (logo/branding)
    │   └── navigation (main menu - same as dashboard)
    └── generic (content area)
        ├── banner (header)
        └── main (enquiry table content)
            └── generic (table container)
                ├── generic (toolbar with search/filters)
                └── table (enquiries data table)
```

---

## 2. Navigation Structure

### 2.1 Sidebar Navigation
Same navigation structure as dashboard page:
- Dashboard
- **Enquiries** (currently active)
- Bookings (with submenu)
- Customers
- Drivers
- Vendors
- Services
- Vehicles
- Invoices
- Offers
- Promo Code
- Custom Notifications

**Note:** "Enquirie" label appears truncated in accessibility tree (same issue as other pages).

---

## 3. Header Section

### 3.1 Banner/Header (`ref-flqwumr8p9`)
- **Type:** `<banner>` (semantic HTML)
- **Structure:**
  - Heading: "Dashboard" (`ref-b0j7xuukfud`) - *Note: Shows "Dashboard" but we're on enquiry page*
  - Action buttons container (`ref-4x6bl1g8x0e`)
    - Notification button: Shows count "17478" (`ref-dtmiekhchu5`)
    - Additional button (`ref-oex6nqikph`)

**Issue:** Header shows "Dashboard" heading even though we're on the enquiry page. This may be a bug or the heading is static.

---

## 4. Main Content Area

### 4.1 Enquiry Table Container

#### 4.1.1 Table Toolbar (`ref-5yxszo0ny7u`)

**Search Functionality:**
- **Search Input:** (`ref-bne3fal5b0m`)
  - Placeholder: "Search ..."
  - Type: Textbox
- **Clear Search Button:** (`ref-f2hx8fjjps`)
  - Label: "Clear search"
  - Purpose: Clear search input

**Action Buttons:**
1. **Refresh Data** (`ref-yrpgsg19ieh`)
   - Icon: Present
   - Purpose: Reload table data from API

2. **Show/Hide filters** (`ref-h9alj4o3oem`)
   - Purpose: Toggle filter panel visibility

3. **Show/Hide columns** (`ref-2zagq5knuu`)
   - Purpose: Toggle column visibility settings
   - *Note: This is a new feature not seen in other tables*

4. **Toggle density** (`ref-cd03im9ygg`)
   - Purpose: Switch between compact/comfortable/spacious table row heights
   - *Note: This is a new feature not seen in other tables*

5. **Toggle full screen** (`ref-35ktoqf4enz`)
   - Purpose: Enter/exit full-screen mode for table

### 4.2 Enquiries Data Table

#### 4.2.1 Table Structure (`ref-cqamwspmdzh`)

**Type:** `<table>` element with advanced features

#### 4.2.2 Table Columns

1. **Checkbox Column** (`ref-4sxf7shdwg5`)
   - **Header:** "Toggle select all" checkbox (`ref-ld0p3ts2lqs`)
   - **Purpose:** Select/deselect all rows
   - **Per Row:** Individual row selection checkboxes

2. **Enquiry ID** (`ref-zdrshiljkkf`)
   - **Sortable:** ✅ Yes (ascending/descending)
   - **Column Actions:** ✅ Yes
   - **Format:** Alphanumeric (e.g., "SLTE6091420755")
   - **Sample Values:**
     - SLTE6091420755
     - SLTE6091420754
     - SLTE6091420753
     - SLTE3940020752

3. **Phone Number** (`ref-7onm0u20kko`)
   - **Sortable:** ✅ Yes
   - **Column Actions:** ✅ Yes
   - **Format:** International format (e.g., "+ 91 9361060914")
   - **Sample Values:**
     - + 91 9361060914
     - + 91 09080394008

4. **From** (`ref-yzcxrodlw1`)
   - **Sortable:** ✅ Yes
   - **Column Actions:** ✅ Yes
   - **Format:** Location (truncated in display)
   - **Sample Values:**
     - Salem, Tamil Na ... (Salem, Tamil Nadu)
     - Kozhikode, Kera ... (Kozhikode, Kerala)

5. **To** (`ref-rir3lwi2sq`)
   - **Sortable:** ✅ Yes
   - **Column Actions:** ✅ Yes
   - **Format:** Location (truncated in display)
   - **Sample Values:**
     - Dindigul, Tamil ... (Dindigul, Tamil Nadu)
     - Namakkal, Tamil ... (Namakkal, Tamil Nadu)
     - Nagercoil, Tami ... (Nagercoil, Tamil Nadu)
     - Bangalore, Karn ... (Bangalore, Karnataka)

6. **PickUp Date** (`ref-1lb6y2l7p1z`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Format:** DD/MM/YYYY
   - **Sample Values:**
     - 11/12/2025
     - 27/12/2025

7. **PickUp Time** (`ref-v52dplixq4f`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Format:** HH:MM am/pm
   - **Sample Values:**
     - 02:23 pm
     - 06:00 am

8. **Drop Date** (`ref-2hmyl5k14ll`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Format:** DD/MM/YYYY or "Invalid Date"
   - **Sample Values:**
     - 11/12/2025
     - Invalid Date (data issue)

9. **Service Name** (`ref-jspiscscekh`)
   - **Sortable:** ✅ Yes
   - **Column Actions:** ✅ Yes
   - **Format:** Text
   - **Sample Values:**
     - One way

10. **Status** (`ref-xwd1lqujy4`)
    - **Sortable:** ✅ Yes
    - **Column Actions:** ✅ Yes
    - **Format:** Status badge/button
    - **Sample Values:**
      - Current (clickable button)
    - **Note:** Label shows "Statu 0" (truncated)

11. **Source** (`ref-kkanzfh2yhn`)
    - **Sortable:** ✅ Yes
    - **Column Actions:** ✅ Yes
    - **Format:** Text
    - **Sample Values:**
      - Web ite (Website - truncated)
      - U er (User - truncated)

12. **Created By** (`ref-qc9qgnp4krk`)
    - **Sortable:** ✅ Yes
    - **Column Actions:** ✅ Yes
    - **Format:** Text
    - **Sample Values:**
      - U er (User - truncated)

13. **Created At** (`ref-o02aph8h3lo`)
    - **Sortable:** ✅ Yes (default: descending)
    - **Column Actions:** ✅ Yes
    - **Format:** DD/MM/YYYY HH:MM am/pm
    - **Sample Values:**
      - 11/12/2025 07:56 pm
      - 11/12/2025 07:55 pm
      - 11/12/2025 07:54 pm
      - 11/12/2025 06:46 pm

14. **Action** (`ref-rysqb1q8oue`)
    - **Column Actions:** ✅ Yes
    - **Per Row Actions:** 4 action buttons
      - Button 1: View/Edit (icon)
      - Button 2: Delete (icon)
      - Button 3: Additional action (icon)
      - Button 4: Menu (icon) - "Open menu"

#### 4.2.3 Sample Table Rows

**Row 1:**
- Enquiry ID: SLTE6091420755
- Phone: + 91 9361060914
- From: Salem, Tamil Nadu
- To: Dindigul, Tamil Nadu
- PickUp: 11/12/2025 02:23 pm
- Drop: 11/12/2025
- Service: One way
- Status: Current
- Source: Website User
- Created: 11/12/2025 07:56 pm

**Row 2:**
- Enquiry ID: SLTE6091420754
- Phone: + 91 9361060914
- From: Salem, Tamil Nadu
- To: Namakkal, Tamil Nadu
- PickUp: 11/12/2025 02:23 pm
- Drop: 11/12/2025
- Service: One way
- Status: Current
- Source: Website User
- Created: 11/12/2025 07:55 pm

**Row 3:**
- Enquiry ID: SLTE6091420753
- Phone: + 91 9361060914
- From: Salem, Tamil Nadu
- To: Nagercoil, Tamil Nadu
- PickUp: 11/12/2025 02:23 pm
- Drop: 11/12/2025
- Service: One way
- Status: Current
- Source: Website User
- Created: 11/12/2025 07:54 pm

**Row 4 (Data Issue):**
- Enquiry ID: SLTE3940020752
- Phone: + 91 09080394008
- From: Kozhikode, Kerala
- To: Bangalore, Karnataka
- PickUp: 27/12/2025 06:00 am
- Drop: **Invalid Date** ⚠️
- Service: One way
- Status: Current
- Source: Website User
- Created: 11/12/2025 06:46 pm

### 4.3 Data Quality Issues

#### 4.3.1 Identified Issues
1. **Invalid Date:** One row shows "Invalid Date" in Drop Date column
   - **Enquiry ID:** SLTE3940020752
   - **Likely Cause:** Missing or malformed date data in API response
   - **Impact:** User experience degradation

2. **Label Truncation:**
   - "Statu 0" instead of "Status"
   - "Web ite" instead of "Website"
   - "U er" instead of "User"
   - **Cause:** CSS text truncation or accessibility tree limitations

3. **Location Truncation:**
   - Location names are truncated with "..." (e.g., "Salem, Tamil Na ...")
   - **Impact:** Full location not visible without hover/expansion

---

## 5. API Integration Analysis

### 5.1 WebSocket Connection
- **URL:** `wss://api.silvertaxi.in/socket.io/?EIO=4&transport=websocket`
- **Status:** 101 (Switching Protocols - Connected)
- **Purpose:** Real-time updates for enquiries

### 5.2 REST API Endpoints Called

#### 5.2.1 Company Profile
- **URL:** `https://api.silvertaxi.in/v1/company-profile`
- **Method:** GET
- **Status:** 200 OK

#### 5.2.2 Column Visibility Settings
- **URL:** `https://api.silvertaxi.in/v1/column-visibility/enquiries`
- **Method:** GET
- **Status:** 200 OK
- **Purpose:** Fetch user's column visibility preferences
- **Note:** This is a new endpoint not seen in other pages

#### 5.2.3 Enquiries Data
- **URL:** `https://api.silvertaxi.in/v1/enquiries?page=1&limit=10`
- **Method:** GET
- **Status:** 200 OK
- **Parameters:**
  - page: 1
  - limit: 10 (smaller than other tables which use 30)
- **Response:** Contains enquiry data array

#### 5.2.4 Notifications
- **URL:** `https://api.silvertaxi.in/v1/notifications`
- **Method:** GET
- **Status:** 200 OK

### 5.3 Next.js Route Prefetching
Multiple routes are prefetched:
- `/admin` (Dashboard)
- `/admin/customers`
- `/admin/drivers`

---

## 6. Console Warnings

### 6.1 Observed Warning
```
res.data.data enquiries >> [object Object]
```
- **Location:** `app/admin/enquiry/page-a908176d590a03f7.js:1`
- **Type:** Warning
- **Analysis:**
  - Likely related to API response structure
  - May indicate nested data structure (res.data.data)
  - Could be from console.log debugging statement
  - Suggests response structure: `{ data: { data: [...] } }`

---

## 7. Table Features Analysis

### 7.1 Advanced Features (Not in Other Tables)

#### 7.1.1 Column Visibility Toggle
- **Button:** "Show/Hide columns" (`ref-2zagq5knuu`)
- **API:** `/v1/column-visibility/enquiries`
- **Purpose:** Allow users to customize which columns are visible
- **Storage:** Likely stored per user in backend

#### 7.1.2 Density Toggle
- **Button:** "Toggle density" (`ref-cd03im9ygg`)
- **Purpose:** Switch between table row densities:
  - Compact
  - Comfortable (default)
  - Spacious
- **UX:** Better for users who want to see more/fewer rows at once

### 7.2 Standard Features (Same as Other Tables)

#### 7.2.1 Search
- Global search across all columns
- Clear search button

#### 7.2.2 Sorting
- Multi-column sorting
- Default sort: Created At (descending)

#### 7.2.3 Filtering
- Show/Hide filters toggle
- Filter panel (when enabled)

#### 7.2.4 Row Selection
- Select all checkbox
- Individual row checkboxes
- Enables bulk operations

#### 7.2.5 Actions
- Per-row action buttons (4 buttons)
- Column-specific actions menu

#### 7.2.6 Full Screen
- Toggle full-screen mode

#### 7.2.7 Refresh
- Manual data refresh button

---

## 8. Data Patterns Observed

### 8.1 Enquiry ID Format
- **Pattern:** `SLTE` + 10 digits
- **Examples:**
  - SLTE6091420755
  - SLTE3940020752
- **Analysis:**
  - "SLTE" prefix likely stands for "Silver Taxi Enquiry"
  - 10-digit number appears to be sequential or timestamp-based

### 8.2 Phone Number Format
- **Pattern:** `+ 91` + 10 digits
- **Country Code:** India (+91)
- **Format:** International format with space

### 8.3 Date/Time Format
- **Date:** DD/MM/YYYY
- **Time:** HH:MM am/pm (12-hour format)
- **Combined:** DD/MM/YYYY HH:MM am/pm

### 8.4 Status Values
- **Observed:** "Current"
- **Likely Other Values:** Pending, Completed, Cancelled, etc.

### 8.5 Source Values
- **Observed:** "Website User"
- **Likely Other Values:** Mobile App, Phone Call, Walk-in, etc.

### 8.6 Service Types
- **Observed:** "One way"
- **Likely Other Values:** Round trip, Hourly, etc.

---

## 9. Accessibility Analysis

### 9.1 Strengths
✅ Semantic HTML structure (table, banner, main)  
✅ Proper table structure with headers  
✅ ARIA roles present  
✅ Keyboard navigation support  
✅ Search functionality accessible  
✅ Row selection checkboxes properly labeled  
✅ Action buttons have icons (visual indicators)

### 9.2 Issues
⚠️ **Label Truncation:** Multiple labels truncated in accessibility tree:
- "Statu 0" instead of "Status"
- "Web ite" instead of "Website"
- "U er" instead of "User"
- "Enquirie" instead of "Enquiries"

⚠️ **Location Truncation:** Location names truncated with "..."
- Full location not accessible without hover/expansion
- May impact screen reader users

⚠️ **Action Button Labels:** Some action buttons may lack descriptive labels
- Icons without text labels
- May need ARIA labels for better accessibility

⚠️ **Header Mismatch:** Header shows "Dashboard" instead of "Enquiries"
- Confusing for screen reader users
- Should reflect current page

⚠️ **Invalid Date Display:** "Invalid Date" shown without context
- No error message or explanation
- May confuse users

---

## 10. Source Code Analysis

### 10.1 Expected File Location
Based on Next.js App Router structure:
- **Expected:** `admin-dashboard/src/app/admin/enquiry/page.tsx`
- **Status:** ❌ File not found in codebase
- **Alternative:** May be at `admin-dashboard/src/app/admin/enquiries/page.tsx`

### 10.2 Code Structure Inference

Based on the DOM structure and API calls, the component likely includes:

```typescript
// Expected structure
- useState for table data
- useState for filters/search
- useState for column visibility
- useState for table density
- useEffect for API calls
- Table component (likely Material-UI DataGrid or similar)
- Search input
- Filter panel
- Action buttons
```

### 10.3 API Integration Pattern

```typescript
// Expected API calls
1. GET /v1/enquiries?page=1&limit=10
2. GET /v1/column-visibility/enquiries
3. GET /v1/company-profile
4. GET /v1/notifications
5. WebSocket connection for real-time updates
```

---

## 11. Security Observations

### 11.1 API Endpoints
- **Base URL:** `https://api.silvertaxi.in/v1/`
- **Authentication:** Likely JWT tokens (from cookies/localStorage)
- **WebSocket:** Secure WebSocket (wss://)

### 11.2 Potential Concerns
1. **Data Exposure:** Phone numbers and locations visible in table
   - Ensure proper access control
   - Consider masking sensitive data

2. **Bulk Operations:** Row selection enables bulk operations
   - Ensure proper authorization for bulk actions
   - Add confirmation dialogs for destructive actions

3. **Column Visibility:** User preferences stored
   - Ensure user-specific data isolation
   - Validate column visibility permissions

---

## 12. Performance Analysis

### 12.1 Resource Loading
- **API Calls:** 4 REST API calls on page load
- **WebSocket:** Persistent connection
- **Pagination:** 10 items per page (smaller than other tables)
- **Route Prefetching:** 3 routes prefetched

### 12.2 Optimization Opportunities
1. **Pagination Size:** Currently 10 items - consider increasing to 30 for consistency
2. **Lazy Loading:** Load column visibility settings asynchronously
3. **Caching:** Cache column visibility preferences
4. **Virtual Scrolling:** Implement for large datasets

---

## 13. Recommendations

### 13.1 Data Quality
1. **Fix Invalid Date:** Handle missing/null drop dates gracefully
   - Show "N/A" or "Not specified" instead of "Invalid Date"
   - Validate date data on backend

2. **Location Display:** 
   - Add tooltip/hover to show full location
   - Consider expanding column width
   - Add "View Full" link for truncated locations

3. **Label Truncation:**
   - Fix CSS causing label truncation
   - Ensure full labels in accessibility tree

### 13.2 Functionality
1. **Header Fix:** Update header to show "Enquiries" instead of "Dashboard"
2. **Bulk Actions:** Implement bulk operations for selected rows
3. **Export:** Add export functionality (CSV/Excel)
4. **Filters:** Implement advanced filtering options

### 13.3 Accessibility
1. **ARIA Labels:** Add descriptive labels to action buttons
2. **Keyboard Navigation:** Ensure all actions are keyboard accessible
3. **Screen Reader:** Test with screen readers
4. **Error Messages:** Add proper error messages for invalid data

### 13.4 Code Organization
1. **Create Component:** Implement the enquiry page component
2. **Reusable Table:** Extract table component for reuse
3. **API Service:** Create enquiry service layer
4. **Error Handling:** Add comprehensive error handling

### 13.5 Performance
1. **Increase Page Size:** Change limit from 10 to 30 for consistency
2. **Virtual Scrolling:** For large datasets
3. **Debounce Search:** Add debouncing to search input
4. **Optimistic Updates:** For real-time updates

---

## 14. Key Findings Summary

### 14.1 Page Structure
- **Layout:** Sidebar + Header + Main content
- **Content:** Advanced data table with enquiries
- **Features:** Search, filter, sort, column visibility, density toggle

### 14.2 Table Features
- **Columns:** 14 columns (including checkbox and action)
- **Rows:** 10 items per page (pagination)
- **Selection:** Multi-row selection with checkboxes
- **Actions:** 4 action buttons per row

### 14.3 API Integration
- **REST API:** 4 endpoints called
- **WebSocket:** Real-time updates
- **Column Visibility:** User preference storage
- **Pagination:** Page-based with limit

### 14.4 Data Quality
- **Issues:** Invalid date in one row
- **Truncation:** Labels and locations truncated
- **Format:** Consistent date/time and phone formats

### 14.5 Advanced Features
- **Column Visibility Toggle:** ✅ Unique to this page
- **Density Toggle:** ✅ Unique to this page
- **User Preferences:** Stored per user

---

## 15. Next Steps for Development

1. **Locate/Create Component:**
   - Find existing enquiry page component
   - Or create at `admin-dashboard/src/app/admin/enquiry/page.tsx`

2. **Fix Data Issues:**
   - Handle invalid dates gracefully
   - Fix label truncation
   - Improve location display

3. **Implement Missing Features:**
   - Bulk actions for selected rows
   - Export functionality
   - Advanced filters

4. **Accessibility Improvements:**
   - Add ARIA labels
   - Fix header text
   - Test with screen readers

5. **Performance Optimization:**
   - Increase page size to 30
   - Add virtual scrolling
   - Implement debounced search

6. **Error Handling:**
   - Add error boundaries
   - Handle API errors gracefully
   - Show user-friendly error messages
