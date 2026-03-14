# Electronic Health Record System - Specification

## Project Overview

**Project Name**: MedConnect EHR
**Type**: Hospital Management Web Application
**Core Functionality**: A comprehensive electronic health record system connecting 5 hospital departments with real-time patient data flow, nurse scheduling, and workflow monitoring.
**Target Users**: Hospital administrators, department staff (OPD, ER, Pharmacy, Lab), nurses, and nursing supervisors.

---

## UI/UX Specification

### Layout Structure

**Main Layout**
- Fixed sidebar navigation (280px width) with department icons
- Top header bar (64px height) with user info, notifications, and system status
- Main content area with department-specific views
- Responsive: sidebar collapses to icons on tablet, hamburger menu on mobile

**Page Sections**
1. Dashboard (Nursing Admin Overview)
2. Outpatient Department (OPD)
3. Emergency Room (ER)
4. Pharmacy
5. Laboratory
6. Nurse Scheduling Panel (within Nursing Admin)

### Responsive Breakpoints
- Desktop: ≥1280px (full sidebar)
- Tablet: 768px-1279px (collapsed sidebar icons)
- Mobile: <768px (hamburger menu)

### Visual Design

**Color Palette**
- Primary: `#0F766E` (Teal 700 - medical trust)
- Primary Light: `#14B8A6` (Teal 500)
- Secondary: `#1E293B` (Slate 800 - sidebar)
- Accent: `#F59E0B` (Amber 500 - alerts/warnings)
- Success: `#10B981` (Emerald 500)
- Error: `#EF4444` (Red 500)
- Background: `#F8FAFC` (Slate 50)
- Card Background: `#FFFFFF`
- Text Primary: `#0F172A` (Slate 900)
- Text Secondary: `#64748B` (Slate 500)
- Border: `#E2E8F0` (Slate 200)

**Typography**
- Font Family: `"DM Sans"` for headings, `"IBM Plex Sans"` for body
- Headings: 
  - H1: 32px/700
  - H2: 24px/600
  - H3: 18px/600
- Body: 14px/400
- Small: 12px/400

**Spacing System**
- Base unit: 4px
- Card padding: 24px
- Section gaps: 24px
- Element gaps: 16px

**Visual Effects**
- Card shadows: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Hover transitions: 200ms ease
- Active states: scale(0.98)
- Status indicators: pulsing dots for live data

### Components

**Navigation Sidebar**
- Logo at top
- Department icons with labels
- Active state: teal background highlight
- Hover: subtle background change

**Department Cards**
- Patient count badges
- Status indicators (green/yellow/red dots)
- Quick action buttons
- Hover: elevated shadow

**Patient List Table**
- Sortable columns
- Status badges (Admitted, In Treatment, Discharged, Pending)
- Action buttons (View, Transfer, Discharge)
- Row hover highlight

**Patient Detail Modal**
- Tabs: Overview, Medical History, Medications, Lab Results
- Timeline of visits
- Vital signs chart placeholder
- Notes section

**Pharmacy Panel**
- Medication inventory cards
- Prescription queue
- Dispense button
- Low stock alerts

**Lab Panel**
- Test orders list
- Status: Pending, In Progress, Completed
- Results entry form
- Reference ranges display

**Nurse Scheduling Grid**
- Weekly calendar view
- Shift types: Morning, Afternoon, Night
- Drag-drop assignment
- Availability indicators

**Real-time Activity Feed**
- Live updates from all departments
- Color-coded by department
- Timestamp
- Click to navigate

---

## Functionality Specification

### Core Features

**1. Dashboard (Nursing Admin)**
- Overview statistics: Total patients, ER critical, OPD waiting, Lab pending
- Real-time activity feed from all departments
- Quick access to nurse scheduling
- Department status overview
- Alert notifications

**2. Outpatient Department (OPD)**
- Patient registration/ intake form
- Queue management
- Consultation notes entry
- Referral to other departments
- Appointment scheduling

**3. Emergency Room (ER)**
- Triage system with priority levels (1-5)
- Critical patient alerts
- Quick vital signs entry
- ER to Inpatient transfer
- Resuscitation bay tracking

**4. Pharmacy**
- Medication inventory display
- Prescription verification
- Dispense workflow
- Low stock alerts
- Drug interaction warnings (simulated)

**5. Laboratory**
- Test order management
- Sample collection status
- Results entry with reference ranges
- Lab report generation
- Urgent result alerts

**6. Nursing Admin**
- Nurse roster management
- Shift scheduling (Morning/Afternoon/Night)
- Department assignment
- Workload monitoring
- Leave management

### User Interactions

- Click sidebar to switch departments
- Click patient row to view details
- Click action buttons for operations
- Toggle status filters
- Search patients by name/ID

### Data Handling

- Local state with React useState/useReducer
- Pre-populated sample data for demo
- Patient data structure with all departments
- Real-time updates simulation with setInterval

### Edge Cases

- Empty states for no patients
- Loading states for data fetch
- Error handling for invalid operations
- Confirmation for discharge/transfer

---

## Acceptance Criteria

1. ✅ All 5 departments accessible via sidebar navigation
2. ✅ Dashboard shows aggregated data from all departments
3. ✅ Patient can flow between departments (OPD → Lab → Pharmacy → Discharge)
4. ✅ ER has triage priority system
5. ✅ Pharmacy shows medication inventory with alerts
6. ✅ Lab shows test orders with status tracking
7. ✅ Nursing Admin has nurse scheduling grid
8. ✅ Activity feed shows real-time updates
9. ✅ Responsive design works on all breakpoints
10. ✅ All interactive elements have hover/active states
11. ✅ Color scheme matches specification
12. ✅ Typography uses specified fonts
