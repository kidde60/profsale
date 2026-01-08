# ProfSale Mobile App

Professional Sales Management Mobile Application built with React Native and TypeScript.

## Features

- 🔐 **Authentication** - Login and registration with JWT tokens
- 📊 **Dashboard** - Real-time business analytics and insights
- 📦 **Product Management** - Manage inventory, pricing, and stock levels
- 💰 **Point of Sale (POS)** - Quick sales transactions
- 🧾 **Sales History** - Track all sales with detailed receipts
- 👥 **Customer Management** - Maintain customer database and loyalty points
- 📈 **Reports & Analytics** - Business performance metrics
- ⚙️ **Settings** - Business configuration and preferences

## Tech Stack

- **React Native 0.82** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation and routing
- **Axios** - API communication
- **AsyncStorage** - Local data persistence

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Loading.tsx
├── screens/            # Application screens
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── ProductsScreen.tsx
│   ├── POSScreen.tsx
│   ├── SalesScreen.tsx
│   ├── CustomersScreen.tsx
│   └── SettingsScreen.tsx
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── services/          # API service layer
│   ├── api.ts
│   ├── authService.ts
│   ├── productService.ts
│   ├── salesService.ts
│   ├── customerService.ts
│   ├── dashboardService.ts
│   └── businessService.ts
├── context/           # React context providers
│   └── AuthContext.tsx
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Utility functions
│   └── helpers.ts
├── constants/         # App constants and theme
│   └── theme.ts
└── config.ts          # App configuration
```

## Getting Started

### Prerequisites

- Node.js >= 20
- React Native development environment setup
- Android Studio (for Android)
- Xcode (for iOS - macOS only)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Install iOS pods (macOS only):

```bash
cd ios && pod install && cd ..
```

3. Configure the backend API URL in `src/config.ts`

### Running the App

**Android:**

```bash
npm run android
```

**iOS:**

```bash
npm run ios
```

**Start Metro Bundler:**

```bash
npm start
```

## Backend Integration

The app connects to the ProfSale backend API. Make sure the backend server is running:

```bash
cd backend
npm run dev
```

### API Endpoints Used

- `/api/auth/*` - Authentication endpoints
- `/api/dashboard/*` - Dashboard and analytics
- `/api/products/*` - Product management
- `/api/sales/*` - Sales transactions
- `/api/customers/*` - Customer management
- `/api/business/*` - Business settings

## Configuration

### API URL

Update the API URL in `src/config.ts`:

```typescript
API_URL: __DEV__
  ? 'http://localhost:5000/api' // Development
  : 'https://your-api.com/api'; // Production
```

For Android emulator, use `http://10.0.2.2:5000/api`
For iOS simulator, use `http://localhost:5000/api`
For physical devices, use your computer's local IP address

## Building for Production

### Android

```bash
cd android
./gradlew assembleRelease
```

The APK will be in `android/app/build/outputs/apk/release/`

### iOS

1. Open `ios/profsale.xcworkspace` in Xcode
2. Select your signing certificate
3. Archive the app
4. Upload to App Store Connect

## Environment Variables

Create a `.env` file in the root directory:

```env
API_URL=http://localhost:5000/api
APP_NAME=ProfSale
```

## Testing

```bash
npm test
```

## Troubleshooting

### Metro Bundler Issues

```bash
npm start -- --reset-cache
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Issues

```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Private - All rights reserved

## Support

For support, contact: support@profsale.com
