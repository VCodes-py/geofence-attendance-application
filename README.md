# 📍 GeoAttendance Mobile Application

[![React Native](https://img.shields.io/badge/React_Native-v0.88-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-v58-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Location Services](https://img.shields.io/badge/Location-High_Precision_GPS-0EA5E9?logo=google-maps&logoColor=white)](https://expo.dev/versions/latest/sdk/location)
[![UI Library](https://img.shields.io/badge/UI-React_Native_Paper_MD3-6200EE?logo=material-design&logoColor=white)](https://callstack.github.io/react-native-paper/)
[![Security](https://img.shields.io/badge/Security-Device_Binding_%26_Anti--Spoof-10B981?logo=shield&logoColor=white)](https://github.com/VCodes-py/geofence-attendance-application)

A modern, location-verified mobile attendance system engineered for universities, colleges, and corporate training centers. **GeoAttendance** automates check-ins by enforcing physical presence within dynamically configured geofence perimeters while shutting down proxy check-ins through hardware device binding and anti-spoof spatial filters.

---

## 🌟 Key Capabilities

### 🎓 1. Student Experience
* **Live Class Discovery**: Automatically surfaces active class sessions matching the student's enrolled courses.
* **One-Tap Geofenced Check-In**: High-precision GPS acquisition validates that the student is physically within the venue perimeter.
* **Attendance Tracking**: Visual progress bars and analytics displaying real-time attendance percentages and total classes attended per subject.
* **Active Session Timers**: Synchronized live countdown timers indicating remaining check-in window time.

### 👨‍🏫 2. Faculty Management
* **Instant Class Activation**: Launch attendance sessions with custom durations, subjects, and venue geofence targets.
* **Dynamic Parameter Tuning**: Modify radius (meters) or extend/shorten duration on the fly during active sessions.
* **Live Attendance Monitor**: Real-time feed of students checking in with roll numbers and timestamps.
* **Manual Override**: Dedicated faculty bypass to manually mark students present in exceptional circumstances (e.g. device failure).
* **Comprehensive Analytics**: View historical session trends, student rosters, and generate single-session or monthly attendance reports.

### 🛡️ 3. Administrative Control
* **Campus Geofence Mapping**: Define venue targets with exact latitude, longitude, and custom radius boundaries.
* **Academic Hierarchy**: Manage subjects, curriculum codes, faculty assignments, and student rosters.
* **Device Security Toggle**: Globally toggle hardware device binding or unbind individual student devices when phones are upgraded or replaced.

---

## 🔒 Security & Anti-Fraud Architecture

To eliminate attendance fraud, proxy check-ins, and GPS spoofing, GeoAttendance incorporates multi-layered validation:

### 📡 1. GPS Centroid Averaging & Drift Rejection
Indoor environments frequently experience satellite multipath interference and GPS drift. GeoAttendance combats this via:
* **Multi-Sample Averaging**: Takes 3 separate GPS readings across 800ms intervals and calculates the mathematical coordinate centroid.
* **Accuracy Threshold**: Enforces a strict hardware accuracy ceiling (≤ 15 meters). Check-ins with weak or degraded signals are automatically rejected.
* **Native Mock Location Detection**: Inspects native Android and iOS operating system flags (`mocked` / `isMock`) to instantly reject developer mock location tools and GPS spoofers.

### 📱 2. Hardware Device Binding
* On initial authentication, the client extracts the device's immutable hardware identifier (`Application.getAndroidId()` on Android or Vendor Identifier on iOS).
* The account is permanently locked to this physical device in the central database, preventing a single present student from signing in to multiple absent classmates' accounts.

### 🔑 3. Enforced Credential Lifecycle
* Newly provisioned accounts (from roster CSVs or admin creation) carry a temporary credential flag.
* The application enforces a mandatory password reset flow before granting dashboard access.

---

## 📐 Application Architecture

```
geo-fencing-mobile-master/
├── App.js                     # Root entry point, navigation containers & status bar config
├── app.json                   # Expo SDK 58 application manifest & permissions
├── package.json               # Dependencies & scripts
└── src/
    ├── api/
    │   └── client.js          # Axios client with JWT interceptor & base URL
    ├── components/
    │   ├── CustomDropdown.js  # Reusable Material Design dropdown picker
    │   └── SessionTimer.js    # Live countdown timer with auto-expiration callbacks
    ├── context/
    │   ├── AlertContext.js    # Global dialog & confirmation alert provider
    │   └── AuthContext.js     # JWT token lifecycle, user state & role management
    ├── screens/
    │   ├── LoginScreen.js         # Secure credential entry & hardware fingerprinting
    │   ├── ForceResetScreen.js    # Compulsory initial password change screen
    │   ├── StudentDashboard.js    # Student check-in, GPS radar & progress metrics
    │   ├── FacultyDashboard.js    # Session start/stop, manual check-in & parameters
    │   ├── FacultyAnalytics.js    # Detailed session metrics & student roster breakdown
    │   └── AdminDashboard.js      # Global system administration & geofence mapping
    └── utils/
        └── haversine.js       # Great-circle spatial distance calculation algorithm
```

---

## 💻 Technology Stack

| Category | Technology |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) (v0.88.1) with [Expo](https://expo.dev/) (SDK 58) |
| **Language** | Modern JavaScript (ES6+), React 19 |
| **Component Library** | [React Native Paper](https://callstack.github.io/react-native-paper/) (MD3 Material Design) |
| **Navigation** | [React Navigation 7](https://reactnavigation.org/) (Native Stack & Bottom Tabs) |
| **Location & Hardware** | `expo-location`, `expo-device`, `expo-application` |
| **Authentication** | JWT (JSON Web Tokens) with Secure Storage |
| **Networking** | Axios REST Client |
| **Spatial Math** | Haversine Great-Circle Distance Algorithm |

---

## 👥 Demo Personas & Test Credentials

For evaluation and demonstration purposes, the application supports three primary access roles:

| Role | Email | Default Password | Access Scope |
|---|---|---|---|
| **System Admin** | `admin@geofence.edu` | `Admin@123` | Full administrative control, venue mapping, roster management |
| **Faculty Member** | `faculty@geofence.edu` | `Faculty@123` | Session management, live feeds, manual check-ins, analytics |
| **Student** | `student@geofence.edu` | `Student@123` | Geofenced attendance check-in, active class discovery, metrics |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
