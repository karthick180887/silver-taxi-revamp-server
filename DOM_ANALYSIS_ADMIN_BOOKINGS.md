# DOM Analysis: Admin Bookings Pages
## URLs: 
- List: https://admin.silvertaxi.in/admin/bookings
- Create: https://admin.silvertaxi.in/admin/bookings/create

**Analysis Date:** 2025-01-12  
**Page Title:** Silver Taxi  
**Framework:** Next.js (React-based) with App Router

---

## 1. Bookings List Page Analysis

### 1.1 Page Structure Overview

```
generic (root)
└── generic (main container - flex layout)
    ├── generic (sidebar - same as other pages)
    └── generic (content area)
        ├── banner (header)
        └── main (bookings content)
            ├── generic (page header with filters)
            ├── generic (table toolbar)
            └── table (bookings data table)
```

### 1.2 Page Header Section

#### 1.2.1 Page Title and Actions
- **Heading:** "Booking Page" (`ref-k9c8sufnixt`)
- **Create Button:** "Create Booking" (`ref-mprx92mwcwp`)
  - Purpose: Navigate to create booking page

#### 1.2.2 Status Filter Buttons
The page includes status filter buttons with counts:

1. **Booking Confirmed Not Contacted** (`ref-umrqfg3qmar`)
   - Count: 0

2. **Booking Confirmed Contacted** (`ref-4jvbb9fnwjm`)
   - Count: 11

3. **Non Started** (`ref-klr94pqso3q`)
   - Count: 66

4. **Started** (`ref-47sd0c5jevp`)
   - Count: 15

5. **Completed** (`ref-vxc4i3vmgv`)
   - Count: 1,069

6. **Cancelled** (`ref-nyg5qctgxho`)
   - Count: 429

7. **Vendor-Booking** (`ref-0ty5mxg5je2`)
   - Count: 1,328

**Analysis:**
- These buttons act as filters to show bookings by status
- Total bookings visible: ~2,918 bookings
- Most common status: Vendor-Booking (1,328)
- Completed bookings: 1,069

### 1.3 Table Toolbar

#### 1.3.1 Search Functionality
- **Search Input:** (`ref-dc8olngutsr`)
  - Placeholder: "Search ..."
  - Type: Textbox

- **Clear Search Button:** (`ref-7wdg2o5dk8d`)
  - Label: "Clear search"

#### 1.3.2 Search By Dropdown
- **Label:** "Search By:" (`ref-3kkgsz2rhvv`)
- **Combobox:** (`ref-ciuhqf0zkb`)
  - Current value: "Not Selected"
  - Purpose: Filter search by specific column

#### 1.3.3 Action Buttons
1. **Refresh Data** (`ref-di7jbxeczkn`)
   - Icon: Present
   - Purpose: Reload table data

2. **Show/Hide filters** (`ref-xfgaxw54nv9`)
   - Purpose: Toggle filter panel

3. **Show/Hide columns** (`ref-jyc2i3tj05p`)
   - Purpose: Toggle column visibility settings

4. **Toggle density** (`ref-vvo836j3ikq`)
   - Purpose: Switch table row density

5. **Toggle full screen** (`ref-z0ntnuo7uo`)
   - Purpose: Enter/exit full-screen mode

### 1.4 Bookings Data Table

#### 1.4.1 Table Structure (`ref-8x50clsdbqi`)

**Type:** `<table>` element with advanced features

#### 1.4.2 Table Columns

1. **Checkbox Column** (`ref-1n0x2yimp8g`)
   - **Header:** "Toggle select all" checkbox (`ref-2pjflku1sm3`)
   - **Purpose:** Select/deselect all rows
   - **Per Row:** Individual row selection checkboxes

2. **Booking ID** (`ref-gouviccxgyp`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Separator:** ✅ Yes (visual separator)

3. **Mobile Number** (`ref-pdwl5s4bisr`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Separator:** ✅ Yes

4. **From** (`ref-x13uuyjqg4c`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Separator:** ✅ Yes

5. **To** (`ref-vjg6s5sl9n`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Separator:** ✅ Yes

6. **PickUp Date** (`ref-miui0zlyhy`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Separator:** ✅ Yes

7. **PickUp Time** (`ref-5ow3nmeeeuf`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Separator:** ✅ Yes

8. **Driver Assigned** (`ref-otx411bou2`)
   - **Sortable:** ✅ Yes (default: descending)
   - **Column Actions:** ✅ Yes
   - **Separator:** ✅ Yes
   - **Note:** Label shows "Driver A igned 0" (truncated)

9. **Created Type** (`ref-ymnieap96w`)
   - **Column Actions:** ✅ Yes
   - **Separator:** ✅ Yes
   - **Not Sortable:** ❌ No sort button

10. **Trip Status** (`ref-e2lrrj58bvu`)
    - **Sortable:** ✅ Yes (default: descending)
    - **Column Actions:** ✅ Yes
    - **Separator:** ✅ Yes
    - **Note:** Label shows "Trip Statu 0" (truncated)

11. **Empty Column** (`ref-mm0o3p3v25`)
    - **Purpose:** Spacing/visual separator

12. **Action** (`ref-hymliv1urf8`)
    - **Column Actions:** ✅ Yes
    - **Separator:** ✅ Yes
    - **Per Row Actions:** Action buttons for each row

### 1.5 Pagination Controls

#### 1.5.1 Pagination Elements
- **Rows per page:** Combobox (`ref-c1yxk8escpr`)
  - Label: "Row per page" / "Rows per page"
  - Purpose: Select number of rows per page

- **Navigation Buttons:**
  1. **Go to first page** (`ref-kr7mhk4vw7`)
  2. **Go to previous page** (`ref-rgkmeblnfuh`)
  3. **Go to next page** (`ref-01sajafjx72p`)
  4. **Go to last page** (`ref-elvwy14we3`)

### 1.6 API Integration

#### 1.6.1 REST API Endpoints

1. **Bookings Data**
   - **URL:** `https://api.silvertaxi.in/v1/bookings?page=1&limit=10&sortBy=createdAt&sortOrder=DESC`
   - **Method:** GET
   - **Status:** 200 OK
   - **Parameters:**
     - page: 1
     - limit: 10
     - sortBy: createdAt
     - sortOrder: DESC

2. **Column Visibility**
   - **URL:** `https://api.silvertaxi.in/v1/column-visibility/bookings`
   - **Method:** GET
   - **Status:** 200 OK
   - **Purpose:** Fetch user's column visibility preferences

3. **Company Profile**
   - **URL:** `https://api.silvertaxi.in/v1/company-profile`
   - **Method:** GET
   - **Status:** 200 OK

4. **Notifications**
   - **URL:** `https://api.silvertaxi.in/v1/notifications`
   - **Method:** GET
   - **Status:** 200 OK

5. **Driver Locations**
   - **URL:** `https://api.silvertaxi.in/v1/drivers/location`
   - **Method:** GET
   - **Status:** 200 OK

#### 1.6.2 WebSocket Connection
- **URL:** `wss://api.silvertaxi.in/socket.io/?EIO=4&transport=websocket`
- **Status:** 101 (Connected)
- **Purpose:** Real-time booking updates

---

## 2. Create Booking Page Analysis

### 2.1 Page Structure Overview

```
generic (root)
└── generic (main container - flex layout)
    ├── generic (sidebar - same as other pages)
    └── generic (content area)
        ├── banner (header)
        └── main (create booking form)
            └── form (booking creation form)
```

### 2.2 Page Header

#### 2.2.1 Page Title
- **Heading:** "Create New Booking" (`ref-mcfhvmazmnd`)

#### 2.2.2 Close Button
- **Button:** "Close" (`ref-hya2o51qdrh`)
  - **Note:** Label shows "Clo e" (truncated)
  - **Purpose:** Close/create booking modal/page

### 2.3 Booking Creation Form

#### 2.3.1 Form Structure (`ref-wdy8sqtcghd`)

The form is organized into multiple sections:

#### 2.3.2 Section 1: Trip Detail

**Heading:** "Trip Detail" (`ref-qhnvf6fepdl`)

**Fields:**

1. **Trip Type** (`ref-5ieqljn6s1u`)
   - **Label:** "Trip Type *" (required)
   - **Type:** Combobox
   - **Current Value:** "One way"
   - **Options:** Likely includes "Round trip", "Hourly", etc.

2. **Vehicle Type** (`ref-s3bj3941i2`)
   - **Label:** "Vehicle Type *" (required)
   - **Type:** Combobox
   - **Current Value:** Not selected (empty)

#### 2.3.3 Section 2: Customer Detail

**Heading:** "Customer Detail" (`ref-yjyioegf01`)
- **Note:** Label shows "Cu tomer Detail" (truncated)

**Fields:**

1. **Customer Name** (`ref-ubu4dx1v5d`)
   - **Label:** "Cu tomer Name *" (required, truncated)
   - **Type:** Textbox
   - **Current Value:** Empty

2. **Phone Number** (`ref-3p1iz8w6bwf`)
   - **Label:** "Phone Number *" (required)
   - **Type:** Textbox with country code selector
   - **Current Value:** "1 (702) 123-4567" (placeholder/example)
   - **Country Code Button:** "India: + 91" (`ref-j7xtr8ml1gj`)
   - **Purpose:** Select country code for phone number

#### 2.3.4 Section 3: Location Detail

**Heading:** "Location Detail" (`ref-l0fejqil5vc`)

**Fields:**

1. **Pickup Location** (`ref-o58prax9r8r`)
   - **Label:** "Pickup Location *" (required)
   - **Type:** Textbox with Google Maps autocomplete
   - **Placeholder:** "Search for a location..."
   - **Input:** (`ref-sti1613yqte`)
   - **Add Stop Button:** (`ref-xnpenkf04ar`)
     - Icon: Present
     - Purpose: Add intermediate stops

2. **Drop Location** (`ref-w7m49kivlw`)
   - **Label:** "Drop Location *" (required)
   - **Type:** Textbox with Google Maps autocomplete
   - **Placeholder:** "Search for a location..."
   - **Input:** (`ref-mplzwbl4v89`)

#### 2.3.5 Section 4: Pickup Date & Time Detail

**Heading:** "Pickup Date & Time Detail" (`ref-7cco56tlk05`)

**Fields:**

1. **Pickup Date & Time** (`ref-e8pi1a2tqqs`)
   - **Label:** "Pickup Date & Time *" (required)
   - **Type:** Textbox (likely date-time picker)
   - **Input:** (`ref-3f5xstp6ej9`)

#### 2.3.6 Section 5: Pricing Detail

**Heading:** "Pricing Detail" (`ref-kh2engd6r8`)

**Fields (All Spinbuttons - numeric inputs):**

1. **Amount per Km** (`ref-yqds8lscwck`)
   - **Type:** Spinbutton
   - **Input:** (`ref-u9mlk8wxrzk`)

2. **Extra Amount per Km** (`ref-ylh6b1m7qt`)
   - **Type:** Spinbutton
   - **Input:** (`ref-l4aw9girtgh`)

3. **Driver Beta** (`ref-l7qjtneubf`)
   - **Type:** Spinbutton
   - **Input:** (`ref-aynogh2bcmi`)
   - **Note:** Likely "Driver Beta" = "Driver Bata" (tip/allowance)

4. **Extra Driver Beta** (`ref-y2j6nvzjns`)
   - **Type:** Spinbutton
   - **Input:** (`ref-vclwfncnxgp`)

5. **Hill Charge** (`ref-2b3nfsin035`)
   - **Type:** Spinbutton
   - **Input:** (`ref-2y3gwpuvrcb`)

6. **Extra Hill Charge** (`ref-84pr3a4hrjr`)
   - **Type:** Spinbutton
   - **Input:** (`ref-cgl5kx3t3ab`)

7. **Permit Charge** (`ref-uiaz776bcar`)
   - **Type:** Spinbutton
   - **Input:** (`ref-59eqdxbh8y2`)

8. **Extra Permit Charge** (`ref-jp78313e6s9`)
   - **Type:** Spinbutton
   - **Input:** (`ref-sjo7qn4gwo`)

### 2.4 Form Actions

#### 2.4.1 Check Fare Button
- **Button:** "Check Fare" (`ref-8u2zs2tbyx3`)
- **Purpose:** Calculate and display fare based on entered details
- **Location:** Below pricing detail section

**Note:** No "Submit" or "Create Booking" button visible in snapshot - may appear after fare calculation or in next step.

### 2.5 API Integration (Create Page)

#### 2.5.1 REST API Endpoints

1. **Services**
   - **URL:** `https://api.silvertaxi.in/v1/services`
   - **Method:** GET
   - **Status:** 200 OK
   - **Purpose:** Fetch available services for trip type

2. **Vehicles (Admin)**
   - **URL:** `https://api.silvertaxi.in/v1/vehicles/admin`
   - **Method:** GET
   - **Status:** 200 OK
   - **Purpose:** Fetch available vehicle types

3. **Tariffs**
   - **URL:** `https://api.silvertaxi.in/v1/tariffs`
   - **Method:** GET
   - **Status:** 200 OK
   - **Purpose:** Fetch pricing/tariff information

4. **Offers**
   - **URL:** `https://api.silvertaxi.in/v1/offers`
   - **Method:** GET
   - **Status:** 200 OK
   - **Purpose:** Fetch available offers/promotions

5. **Company Profile**
   - **URL:** `https://api.silvertaxi.in/v1/company-profile`
   - **Method:** GET
   - **Status:** 200 OK

6. **Notifications**
   - **URL:** `https://api.silvertaxi.in/v1/notifications`
   - **Method:** GET
   - **Status:** 200 OK

#### 2.5.2 Google Maps Integration

**API Usage:**
- **AutocompleteService:** Used for location search
- **Warning:** Console shows deprecation warning:
  - `google.maps.places.AutocompleteService` is deprecated
  - Should migrate to `google.maps.places.AutocompleteSuggestion`
  - Deadline: March 1st, 2025 (for new customers)
  - Existing customers have at least 12 months notice

**Resources Loaded:**
- `maps-api-v3/api/js/63/5d/common.js`
- `maps-api-v3/api/js/63/5d/util.js`
- `maps-api-v3/api/js/63/5d/places.js`

### 2.6 Console Errors/Warnings

#### 2.6.1 Google Maps Deprecation Warning
```
As of March 1st, 2025, google.maps.places.AutocompleteService is not available 
to new customers. Please use google.maps.places.AutocompleteSuggestion instead.
```

**Impact:**
- Current functionality works but uses deprecated API
- Need to migrate to new API before deprecation
- Migration guide available at provided URL

---

## 3. Key Features Comparison

### 3.1 List Page Features
✅ Status filter buttons with counts  
✅ Search with "Search By" dropdown  
✅ Column visibility toggle  
✅ Density toggle  
✅ Full-screen toggle  
✅ Multi-row selection  
✅ Pagination controls  
✅ Real-time updates via WebSocket

### 3.2 Create Page Features
✅ Multi-section form  
✅ Google Maps location autocomplete  
✅ Country code selector for phone  
✅ Add stops functionality  
✅ Pricing detail inputs  
✅ Check fare calculation  
✅ Integration with services, vehicles, tariffs, offers APIs

---

## 4. Accessibility Analysis

### 4.1 List Page
✅ Semantic HTML structure  
✅ Proper table headers  
✅ Keyboard navigation support  
✅ Search functionality accessible  
⚠️ **Label Truncation:** "Driver A igned", "Trip Statu", "Row per page"  
⚠️ **Header Mismatch:** Shows "Dashboard" instead of "Bookings"

### 4.2 Create Page
✅ Form structure with sections  
✅ Required field indicators (*)  
✅ Proper labels for inputs  
⚠️ **Label Truncation:** "Cu tomer Detail", "Cu tomer Name", "Clo e"  
⚠️ **Google Maps:** May have accessibility issues with autocomplete

---

## 5. Data Quality Observations

### 5.1 List Page
- **Status Counts:** Real-time counts displayed
- **Pagination:** 10 items per page (consistent with other tables)
- **Sorting:** Default sort by createdAt (descending)

### 5.2 Create Page
- **Form Validation:** Required fields marked with *
- **Location Search:** Google Maps integration for accurate locations
- **Phone Format:** International format with country code

---

## 6. Recommendations

### 6.1 List Page
1. **Fix Label Truncation:** Resolve CSS causing label truncation
2. **Fix Header:** Update header to show "Bookings" instead of "Dashboard"
3. **Bulk Actions:** Implement bulk operations for selected rows
4. **Export:** Add export functionality (CSV/Excel)
5. **Advanced Filters:** Enhance filter panel with more options

### 6.2 Create Page
1. **Google Maps Migration:** Migrate to AutocompleteSuggestion API
2. **Fix Label Truncation:** Resolve CSS issues
3. **Form Validation:** Add client-side validation
4. **Fare Calculation:** Show fare breakdown after "Check Fare"
5. **Save Draft:** Add ability to save booking as draft
6. **Form Steps:** Consider multi-step form for better UX

### 6.3 Both Pages
1. **Error Handling:** Add comprehensive error handling
2. **Loading States:** Show loading indicators during API calls
3. **Success Messages:** Display success messages after actions
4. **Accessibility:** Test with screen readers
5. **Mobile Responsiveness:** Ensure mobile-friendly design

---

## 7. API Endpoints Summary

### 7.1 List Page Endpoints
- `GET /v1/bookings` - Fetch bookings
- `GET /v1/column-visibility/bookings` - Column preferences
- `GET /v1/company-profile` - Company info
- `GET /v1/notifications` - Notifications
- `GET /v1/drivers/location` - Driver locations
- `WebSocket` - Real-time updates

### 7.2 Create Page Endpoints
- `GET /v1/services` - Available services
- `GET /v1/vehicles/admin` - Vehicle types
- `GET /v1/tariffs` - Pricing information
- `GET /v1/offers` - Available offers
- `GET /v1/company-profile` - Company info
- `GET /v1/notifications` - Notifications
- `POST /v1/bookings` (likely) - Create booking
- `POST /v1/bookings/calculate-fare` (likely) - Calculate fare

---

## 8. Next Steps for Development

1. **Locate/Create Components:**
   - `admin-dashboard/src/app/admin/bookings/page.tsx`
   - `admin-dashboard/src/app/admin/bookings/create/page.tsx`

2. **Fix Issues:**
   - Label truncation
   - Header text
   - Google Maps API migration

3. **Enhance Features:**
   - Bulk actions
   - Export functionality
   - Advanced filters
   - Form validation

4. **Testing:**
   - Unit tests
   - Integration tests
   - Accessibility testing
   - Mobile responsiveness
