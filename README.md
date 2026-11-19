# 📱 GeoAttendance Mobile Client (React Native / Expo)

[![React Native Version](https://img.shields.io/badge/React_Native-v0.72+-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-v54-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Location Services](https://img.shields.io/badge/Location-GPS-0EA5E9?logo=google-maps&logoColor=white)](https://expo.dev/versions/latest/sdk/location)

A premium, secure React Native student check-in client designed to verify coordinate presence within server-enforced geofence boundaries. It integrates anti-tampering device binding, mock location guards, push notifications, and a secure password reset system.

---

## 📂 Core Screen Modules

* **Login Panel (`LoginScreen.js`)**: Captures credentials, extracts hardware fingerprints, requests push notifications permissions, and communicates with the backend.
* **Force Reset Stack (`ForceResetScreen.js`)**: Secure redirect view forcing users with temporary credentials (issued on admin roster CSV ingestion) to establish a private password before accessing dashboards.
* **Student Dashboard (`StudentDashboard.js`)**: Queries scheduled classes matching the student's cohort section/division, samples GPS signals, and submits attendance requests.

---

## ⚙️ Core Engineering Implementations

### 1. GPS Temporal Sampling & Averaging Guard
To combat GPS drift in large institutional structures and block coordinates spoofing, the check-in hook employs a sampling algorithm:
* **Temporal Iterations**: Collects **3 separate location samples** at **800ms intervals**.
* **Centroid Math**: Averages the longitude and latitude coordinates to obtain a stable, drift-free reading.
* **Accuracy Threshold**: Rejects checking in if the hardware accuracy value exceeds **15 meters**.
* **Mock Detection**: Directly inspects the native coordinates metadata (`mocked` on Android / `isMock` on iOS) to block developer mock location tools.

### 2. Device Fingerprint Binding
* On first authentication, the application queries the device for a permanent identifier (`expo-application` IDs) and locks the student profile in the database to this specific `deviceId`.
* Prevents students from logging into other accounts to check in for absent classmates.

### 3. Push Alerts Integration
* Registers the device with the **Expo Notification Service** on login.
* The backend lookahead sweep cron uses this token to notify students 10 minutes before their registered division class starts.

---

## 🚀 Quick Start Guide

Ensure you have Node.js (v18+) and Expo Go installed on your debugging phone.

```bash
# Clone the repository
git clone <your-mobile-repo-link>
cd mobile

# Install dependencies
npm install

# Start the local developer server
npx expo start
```
*Scan the generated QR code using your phone's camera (iOS) or the Expo Go app (Android) to open the app.*

### 🔧 Connecting App to Backend (Local Debugging)
To debug on a physical phone, you must point the app to your computer's local network IPv4 address:
1. Open [src/api/client.js](src/api/client.js#L45)
2. Locate the base URL definition:
   ```javascript
   let BASE_URL = "https://geo-fencing-attendance-backend.onrender.com/api/v1";
   ```
3. Update it to your computer's local network IP (e.g. `http://192.168.1.5:3000/api/v1`).
4. Ensure both your computer and phone are connected to the **same Wi-Fi router**.

---

## 🛠️ Standalone APK Compilation Guide (For Standalone Android Distribution)

You do **not** need a paid Google Play developer account to test or distribute standalone versions of this app. You can compile a standalone `.apk` installer locally on your machine for free:

### Prerequisites (Local Build Environment)
1. **JDK 17**: Ensure Java Development Kit 17 is installed and added to your environmental variables (`JAVA_HOME`).
2. **Android SDK**: Install Android Studio and set up the Android SDK Command-line Tools (`ANDROID_HOME`).
3. **EAS CLI**: Install the Expo Application Services package globally:
   ```bash
   npm install -g eas-cli
   ```

### Step-by-Step Build Commands
1. Log in to your Expo account (create one for free at expo.dev):
   ```bash
   eas login
   ```
2. Configure EAS builds inside the mobile folder:
   ```bash
   eas build:configure
   ```
   *Select `android` as the platform. This will create an `eas.json` file.*
3. Ensure the build configuration in `eas.json` is set to output an **APK** (not an AAB bundle). Update the `preview` profile in your `eas.json` to have:
   ```json
   "preview": {
     "distribution": "internal",
     "android": {
       "buildType": "apk"
     }
   }
   ```
4. Run the local build command (which runs on your computer's hardware, avoiding EAS cloud credit costs):
   ```bash
   eas build --platform android --local --profile preview
   ```
5. Retrieve the compiled `.apk` binary file from the build output directory and distribute it to your users (e.g., host it for free inside your **GitHub Releases**).
