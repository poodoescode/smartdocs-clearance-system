# 📚 SmartDocs Complete System Guide

## Table of Contents
1. [Complete Feature Overview](#1-complete-feature-overview)
2. [Super Admin Account - CRITICAL](#2-super-admin-account---critical)
3. [Role Hierarchy & Permissions](#3-role-hierarchy--permissions)
4. [Admin Management Flow](#4-admin-management-flow)
5. [Practical Examples](#5-practical-examples)
6. [What You Must Do Manually](#6-what-you-must-do-manually)

---

# 1. Complete Feature Overview

## 1.1 Authentication Features

### Sign Up (Public - Anyone)
**What it does**: Creates a new user account
**Who can access**: Anyone (public)
**Frontend/Backend**: Both
- Frontend: Signup form with validation
- Backend: Creates user in Supabase Auth + profiles table

**Features**:
- ✅ First name and last name fields
- ✅ Email validation
- ✅ Password strength meter (8+ chars, uppercase, lowercase, number, special)
- ✅ Show/hide password toggle
- ✅ reCAPTCHA verification
- ✅ Rate limiting (5 signups per hour per IP)
- ✅ Email verification required before login
- ✅ Role selection (Student, Library Admin, Cashier Admin, Registrar Admin)
- ❌ Cannot select Super Admin during signup (security)

### Sign In (Public - Anyone)
**What it does**: Logs user into the system
**Who can access**: Anyone with verified email
**Frontend/Backend**: Both

**Features**:
- ✅ Email and password
- ✅ Show/hide password toggle
- ✅ Email verification check
- ✅ Account active status check
- ✅ Toast notifications (no browser alerts)

---

## 1.2 Student Features

### Document Request Management
**What it does**: Students can request clearance documents
**Who can access**: Students only
**Frontend/Backend**: Both

**Features**:
- ✅ Create new clearance request
- ✅ Select document type (Graduation, Transfer, Leave of Absence)
- ✅ View all personal requests
- ✅ Track request status (pending, approved, on_hold, completed)
- ✅ See current stage (library → cashier → registrar)
- ✅ Visual progress bar
- ✅ Resubmit rejected requests
- ✅ View rejection reasons

### Personal Environmental Impact
**What it does**: Shows student's personal paper savings
**Who can access**: Students only
**Frontend only**: Reads from database

**Features**:
- ✅ Personal paper sheets saved
- ✅ Personal trees saved
- ✅ Personal energy saved
- ✅ Personal CO2 reduced

---

## 1.3 Admin Features (Library, Cashier, Registrar)

### Request Queue Management
**What it does**: Admins review and process requests at their stage
**Who can access**: Library Admin, Cashier Admin, Registrar Admin
**Frontend/Backend**: Both

**Features**:
- ✅ View requests pending at their stage only
- ✅ See student information
- ✅ Approve requests (moves to next stage)
- ✅ Reject requests (with reason required)
- ✅ View request history
- ✅ Refresh queue

**Stage-specific access**:
- Library Admin: Only sees requests at "library" stage
- Cashier Admin: Only sees requests at "cashier" stage
- Registrar Admin: Only sees requests at "registrar" stage

### School-wide Environmental Impact
**What it does**: Shows total school impact
**Who can access**: All admins
**Frontend only**: Reads from database

**Features**:
- ✅ Total paper sheets saved
- ✅ Total trees saved
- ✅ Total energy saved
- ✅ Total CO2 reduced

---

## 1.4 Super Admin Features (EXCLUSIVE)

### User Management Dashboard
**What it does**: Complete control over all users
**Who can access**: Super Admin ONLY
**Frontend/Backend**: Both (requires super_admin role)

**Features**:
- ✅ View ALL users (students and admins)
- ✅ Search users by name, student number, role
- ✅ Filter by: All, Students, Admins, Inactive
- ✅ Statistics (total users, students, admins, active, inactive)
- ✅ Deactivate users (soft delete - can be undone)
- ✅ Reactivate users
- ✅ Delete users permanently (with confirmation)
- ✅ Prevent self-deletion (cannot delete own account)
- ✅ Admin action logging (audit trail)

**Backend Protection**:
- Database RLS policies check for super_admin role
- Cannot be bypassed from frontend

---

## 1.5 Settings Features (All Users)

### Appearance Settings
**What it does**: Customize app appearance
**Who can access**: All logged-in users
**Frontend/Backend**: Both (saves to database)

**Features**:
- ✅ Light/dark theme toggle
- ✅ Theme persistence (saved to database + localStorage)
- ✅ Instant theme switching

### Account Settings
**What it does**: Manage account information
**Who can access**: All logged-in users
**Frontend/Backend**: Both

**Features**:
- ✅ View profile information (read-only)
- ✅ Change email (requires re-verification)
- ✅ View current role

### Security Settings
**What it does**: Manage password
**Who can access**: All logged-in users
**Frontend/Backend**: Both

**Features**:
- ✅ Change password (requires current password)
- ✅ Password strength validation
- ✅ Show/hide password toggle

---

## 1.6 Environmental Impact Dashboard (All Users)

### Global Dashboard
**What it does**: Shows environmental impact
**Who can access**: All logged-in users
**Frontend only**: Reads from database

**Features**:
- ✅ Paper sheets saved
- ✅ Trees saved (8,333 sheets = 1 tree)
- ✅ Energy saved (kWh)
- ✅ CO2 reduced (kg)
- ✅ Personal impact (for students)
- ✅ School-wide impact (for admins)
- ✅ Fun facts and progress messages

---

# 2. Super Admin Account - CRITICAL

## 2.1 How Super Admin is Created

### ⚠️ IMPORTANT: Super Admin is NOT Auto-Created

**The system does NOT automatically create a Super Admin account.**

You must manually create it yourself after deployment.

### Why?
- Security: Prevents unauthorized super admin creation
- Control: You decide who has super admin access
- Flexibility: Can promote any existing user

---

## 2.2 Creating Your First Super Admin

### Method 1: Promote Existing User (RECOMMENDED)

**Step 1: Create a regular admin account**
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Fill form and select any admin role (Library Admin, Cashier Admin, or Registrar Admin)
4. Complete signup
5. Verify email
6. Login

**Step 2: Promote to Super Admin via Supabase**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Table Editor" → "profiles"
4. Find your account (search by email or name)
5. Click on the row to edit
6. Change `role` field from `library_admin` (or whatever) to `super_admin`
7. Click "Save"
8. Log out and log back in

**You are now Super Admin!**

---

### Method 2: Direct Database Insert (ADVANCED)

**Step 1: Create auth user first**
1. Sign up normally through the app
2. Verify email

**Step 2: Update role via SQL**
```sql
-- Find your user ID first
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'your-email@example.com';

-- Update to super_admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, email, full_name, role 
FROM profiles 
WHERE role = 'super_admin';
```

---

### Method 3: Seed Script (FOR INITIAL SETUP)

Create a file `SEED_SUPER_ADMIN.sql`:

```sql
-- WARNING: Only run this ONCE during initial setup
-- Replace with your actual email and details

-- Step 1: Create auth user (if not exists)
-- You must do this through the signup form first!

-- Step 2: Update existing user to super_admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'admin@yourschool.edu';

-- Verify
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE role = 'super_admin';
```

**How to use**:
1. First, sign up through the app with email `admin@yourschool.edu`
2. Verify the email
3. Run this SQL in Supabase SQL Editor
4. Log out and log back in

---

## 2.3 Where to Find Super Admin Credentials

### There are NO default credentials!

**You create them yourself:**
- Email: Whatever you used during signup
- Password: Whatever you set during signup

**Example**:
- If you signed up with `john@school.edu` and password `MyPass123!`
- Those are your Super Admin credentials after promotion

---

## 2.4 How to Log In as Super Admin

**It's exactly the same as regular login!**

1. Go to http://localhost:5173
2. Click "Sign In" (if not already on login page)
3. Enter your email
4. Enter your password
5. Click "Sign In"

**The system automatically detects your role:**
- If role = `super_admin` → Shows Super Admin Dashboard
- If role = `library_admin` → Shows Library Admin Dashboard
- If role = `student` → Shows Student Dashboard

**No special login page or URL needed!**

---

## 2.5 How to Recover Super Admin Access

### Scenario 1: Forgot Password

**Solution**: Use Supabase password reset

1. Go to Supabase Dashboard
2. Authentication → Users
3. Find your super admin user
4. Click "..." → "Send password recovery email"
5. Check email and reset password

---

### Scenario 2: Account Deactivated

**Solution**: Reactivate via SQL

```sql
-- Reactivate super admin account
UPDATE profiles 
SET is_active = TRUE 
WHERE email = 'your-super-admin@example.com';
```

---

### Scenario 3: All Super Admins Deleted

**Solution**: Promote a new user

```sql
-- Find an existing admin
SELECT id, email, full_name, role 
FROM profiles 
WHERE role LIKE '%admin%';

-- Promote to super_admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'existing-admin@example.com';
```

**Or create a new one**:
1. Sign up through the app
2. Verify email
3. Run SQL to promote to super_admin

---

### Scenario 4: No Users Exist at All

**Solution**: Start fresh

1. Sign up through the app
2. Verify email
3. Promote to super_admin via SQL
4. Done!

---

## 2.6 Super Admin Special Flags

### Database Fields

**In `profiles` table**:
```sql
role = 'super_admin'  -- This is the ONLY flag needed
is_active = TRUE      -- Must be active
```

**No other special fields required!**

### Environment Variables

**There are NO environment variables for Super Admin.**

The role is stored in the database only.

---

# 3. Role Hierarchy & Permissions

## 3.1 Role Hierarchy (Lowest to Highest)

```
Student (Level 1)
    ↓
Library Admin (Level 2)
Cashier Admin (Level 2)
Registrar Admin (Level 2)
    ↓
Super Admin (Level 3) ← HIGHEST
```

---

## 3.2 Student Permissions

### ✅ CAN DO:
- Create clearance requests
- View own requests
- Track request status
- Resubmit rejected requests
- View personal environmental impact
- Change own password
- Change own email
- Switch theme

### ❌ CANNOT DO:
- View other students' requests
- Approve/reject requests
- View admin dashboards
- Manage users
- Deactivate accounts
- Delete accounts
- View admin actions log

---

## 3.3 Admin Permissions (Library, Cashier, Registrar)

### ✅ CAN DO:
- View requests at their stage only
- Approve requests at their stage
- Reject requests at their stage
- View request history
- View school-wide environmental impact
- Change own password
- Change own email
- Switch theme

### ❌ CANNOT DO:
- View requests at other stages
- Create/remove other admins
- Manage users
- Deactivate accounts
- Delete accounts
- View all users
- Change user roles
- View admin actions log

**Stage Restrictions**:
- Library Admin: Only "library" stage
- Cashier Admin: Only "cashier" stage
- Registrar Admin: Only "registrar" stage

---

## 3.4 Super Admin Permissions

### ✅ CAN DO EVERYTHING:
- **All Admin permissions** (approve/reject at any stage)
- **User Management**:
  - View ALL users (students and admins)
  - Search and filter users
  - Deactivate users
  - Reactivate users
  - Delete users permanently
  - Change user roles (promote/demote)
- **Admin Management**:
  - Create new admin accounts (by promoting users)
  - Remove admin privileges
  - View admin action logs
- **System Access**:
  - View all requests (all stages)
  - View all environmental data
  - Access all features

### ❌ CANNOT DO:
- Delete own account (safety feature)
- Bypass email verification (security)

---

## 3.5 Permission Comparison Table

| Feature | Student | Admin | Super Admin |
|---------|---------|-------|-------------|
| Create requests | ✅ | ❌ | ❌ |
| View own requests | ✅ | ❌ | ✅ |
| Approve/reject requests | ❌ | ✅ (own stage) | ✅ (all stages) |
| View all users | ❌ | ❌ | ✅ |
| Deactivate users | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| View admin logs | ❌ | ❌ | ✅ |
| Change theme | ✅ | ✅ | ✅ |
| Change password | ✅ | ✅ | ✅ |

---

# 4. Admin Management Flow

## 4.1 How Super Admin Creates Another Admin

### Method 1: Promote Existing User (RECOMMENDED)

**Step 1: User signs up as student**
1. User goes to signup page
2. Fills form, selects "Student" role
3. Completes signup and verifies email

**Step 2: Super Admin promotes user**
1. Super Admin logs in
2. Goes to Super Admin Dashboard
3. Finds the user in the list
4. Clicks on user row
5. Changes role to desired admin type
6. Saves

**Currently**: This feature is in the UI but needs backend implementation

**Workaround**: Use Supabase Table Editor
1. Go to Supabase → Table Editor → profiles
2. Find user
3. Change `role` field
4. Save

---

### Method 2: Direct Database Update

```sql
-- Promote user to admin
UPDATE profiles 
SET role = 'library_admin'  -- or 'cashier_admin' or 'registrar_admin'
WHERE email = 'user@example.com';

-- Verify
SELECT email, full_name, role 
FROM profiles 
WHERE email = 'user@example.com';
```

---

## 4.2 How Admin Accounts are Removed

### Deactivation (Soft Delete - RECOMMENDED)

**What it does**: User cannot login but data is preserved

**How Super Admin does it**:
1. Login as Super Admin
2. Go to Super Admin Dashboard
3. Find the admin user
4. Click "Deactivate" button
5. Confirm in modal
6. User is deactivated

**What happens**:
- `is_active` field set to `FALSE`
- User cannot login
- Data preserved
- Can be reactivated later
- Action logged in `admin_actions` table

---

### Permanent Deletion (DANGEROUS)

**What it does**: User and all data permanently deleted

**How Super Admin does it**:
1. Login as Super Admin
2. Go to Super Admin Dashboard
3. Find the admin user
4. Click "Delete" button (red trash icon)
5. Confirm in modal (shows warning)
6. User is permanently deleted

**What happens**:
- User deleted from `auth.users`
- Profile deleted from `profiles` (CASCADE)
- All related data deleted
- **CANNOT BE UNDONE**
- Action logged in `admin_actions` table

---

## 4.3 Safety Checks

### Confirmation Modals
- ✅ Deactivate: Shows warning modal
- ✅ Delete: Shows danger modal with strong warning
- ✅ Must click "Confirm" button

### Self-Protection
- ✅ Cannot deactivate own account
- ✅ Cannot delete own account
- ✅ Buttons disabled for own account

### Audit Trail
- ✅ All actions logged in `admin_actions` table
- ✅ Records: who, what, when, target user
- ✅ Includes IP address
- ✅ Includes action details (JSON)

### Database Protection
- ✅ Row Level Security (RLS) policies
- ✅ Only super_admin role can manage users
- ✅ Cannot bypass from frontend

---

# 5. Practical Examples

## 5.1 Example: First Deployment

**Scenario**: "I just deployed the app — how do I get my first Super Admin account?"

**Step-by-Step**:

1. **Run database script**
   ```bash
   # In Supabase SQL Editor, run DATABASE_UPDATE.sql
   ```

2. **Sign up through the app**
   - Go to http://localhost:5173
   - Click "Sign Up"
   - Fill form:
     - First Name: Admin
     - Last Name: User
     - Email: admin@yourschool.edu
     - Password: SecurePass123!
     - Role: Library Admin (any admin role)
   - Complete reCAPTCHA
   - Click "Sign Up"

3. **Verify email**
   - Check inbox for verification email
   - Click verification link

4. **Promote to Super Admin**
   - Go to Supabase Dashboard
   - Table Editor → profiles
   - Find your account (admin@yourschool.edu)
   - Edit row
   - Change `role` to `super_admin`
   - Save

5. **Login as Super Admin**
   - Go back to app
   - Login with admin@yourschool.edu
   - You now see Super Admin Dashboard!

**Time**: ~5 minutes

---

## 5.2 Example: Accidentally Removed All Admins

**Scenario**: "I accidentally removed all admins — how do I recover?"

**Solution 1: If you have database access**

```sql
-- Check if any admins exist
SELECT email, full_name, role, is_active 
FROM profiles 
WHERE role LIKE '%admin%';

-- If deactivated, reactivate
UPDATE profiles 
SET is_active = TRUE 
WHERE role = 'super_admin';

-- If deleted, promote a student
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'some-student@example.com';
```

**Solution 2: If no users exist**

1. Sign up new account through app
2. Verify email
3. Promote to super_admin via SQL
4. Login

**Solution 3: If you have backup**

1. Restore database from backup
2. Login with previous credentials

---

## 5.3 Example: Creating Multiple Admins

**Scenario**: "I need 3 library admins, 2 cashier admins, and 1 registrar admin"

**Step-by-Step**:

1. **Have users sign up**
   - Each person signs up as "Student"
   - Each verifies their email

2. **Promote via Supabase** (until UI is ready)
   ```sql
   -- Library Admins
   UPDATE profiles SET role = 'library_admin' 
   WHERE email IN ('lib1@school.edu', 'lib2@school.edu', 'lib3@school.edu');
   
   -- Cashier Admins
   UPDATE profiles SET role = 'cashier_admin' 
   WHERE email IN ('cash1@school.edu', 'cash2@school.edu');
   
   -- Registrar Admin
   UPDATE profiles SET role = 'registrar_admin' 
   WHERE email = 'reg1@school.edu';
   ```

3. **Verify**
   ```sql
   SELECT email, full_name, role 
   FROM profiles 
   WHERE role LIKE '%admin%'
   ORDER BY role;
   ```

4. **Notify users**
   - Tell them to log out and log back in
   - They will see their admin dashboard

---

## 5.4 Example: Deactivating a User

**Scenario**: "A student graduated and should no longer have access"

**Step-by-Step**:

1. **Login as Super Admin**
2. **Go to Super Admin Dashboard**
3. **Search for student** (by name or student number)
4. **Click deactivate button** (⊘ icon)
5. **Confirm** in modal
6. **Done!** Student cannot login

**To reactivate later**:
1. Filter by "Inactive"
2. Find the student
3. Click reactivate button (✓ icon)
4. Student can login again

---

# 6. What You Must Do Manually

## 6.1 Database Setup (REQUIRED)

### What: Run database update script
### Why: Adds new fields and tables for enhancements
### How:
1. Open `DATABASE_UPDATE.sql`
2. Copy all SQL code
3. Go to Supabase SQL Editor
4. Paste and run
5. Verify success

**Time**: 2 minutes

---

## 6.2 Create Super Admin (REQUIRED)

### What: Create your first super admin account
### Why: You need admin access to manage the system
### How:
1. Sign up through app (any admin role)
2. Verify email
3. Promote to super_admin via Supabase Table Editor
4. Login

**Time**: 5 minutes

---

## 6.3 Configure Email (OPTIONAL but RECOMMENDED)

### What: Set up email sending for verification
### Why: Users need to verify emails before login
### How:
1. Go to Supabase Dashboard
2. Authentication → Email Templates
3. Configure SMTP settings (or use Supabase default)
4. Test email sending

**Time**: 10 minutes

---

## 6.4 Configure reCAPTCHA Domain (IF DEPLOYING)

### What: Add production domain to reCAPTCHA
### Why: reCAPTCHA only works on allowed domains
### How:
1. Go to https://www.google.com/recaptcha/admin
2. Find your site
3. Add production domain (e.g., `smartdocs.yourschool.edu`)
4. Save

**Time**: 2 minutes

---

## 6.5 Environment Variables (ALREADY SET)

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://zixxvohuykyvetpjlmpo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_3RrZOGh0ScrfMW4KJpZDrA_Y-HRqhuK
VITE_API_URL=http://localhost:5000/api
VITE_RECAPTCHA_SITE_KEY=6LfAW00sAAAAAH6ShsCHVbhhuujyZC6iAeU_VkKM
```

### Backend (.env)
```env
SUPABASE_URL=https://zixxvohuykyvetpjlmpo.supabase.co
SUPABASE_KEY=sb_publishable_3RrZOGh0ScrfMW4KJpZDrA_Y-HRqhuK
SUPABASE_SERVICE_KEY=[YOUR_SERVICE_ROLE_KEY]
PORT=5000
RECAPTCHA_SECRET_KEY=6LfAW00sAAAAANZ2RfItGqW0rKdvsRtw31wt0QtG
```

**No changes needed unless deploying to production!**

---

## 6.6 Files Involved

### Database
- `SUPABASE_SCHEMA.sql` - Complete schema
- `DATABASE_UPDATE.sql` - Migration script

### Frontend
- `frontend/src/App.jsx` - Main app (already updated)
- `frontend/src/components/SuperAdminDashboard.jsx` - User management
- `frontend/src/components/Settings.jsx` - User settings
- `frontend/.env` - Environment variables

### Backend
- `backend/index.js` - Server with rate limiting
- `backend/routes/authRoutes.js` - Auth with validation
- `backend/.env` - Environment variables

---

## 6.7 Tables Involved

### profiles
- Stores user information and roles
- Fields: id, full_name, role, student_number, course_year, is_active, theme_preference, last_login

### admin_actions
- Logs all admin actions
- Fields: id, admin_id, action_type, target_user_id, details, ip_address, timestamp

### requests
- Stores clearance requests
- Fields: id, student_id, doc_type_id, current_status, current_stage_index, is_completed

### request_history
- Audit trail for requests
- Fields: id, request_id, processed_by, previous_status, new_status, action_taken, comments

---

# Summary

## Key Takeaways

1. **Super Admin is NOT auto-created** - You must create it manually
2. **Create Super Admin**: Sign up → Verify email → Promote via Supabase
3. **Login is the same** for all roles - System detects role automatically
4. **Roles**: Student < Admin < Super Admin
5. **Super Admin can do everything** except delete themselves
6. **Safety features**: Confirmations, logging, self-protection
7. **Recovery**: Always possible via database access

## Quick Start Checklist

- [ ] Run `DATABASE_UPDATE.sql` in Supabase
- [ ] Sign up through app
- [ ] Verify email
- [ ] Promote to super_admin via Supabase Table Editor
- [ ] Login and test Super Admin Dashboard
- [ ] Create additional admins as needed

---

**Need Help?**
- Check browser console (F12) for errors
- Check backend terminal for errors
- Verify database was updated
- Ensure email is verified
- Confirm role is set to 'super_admin'

**You're all set!** 🚀
