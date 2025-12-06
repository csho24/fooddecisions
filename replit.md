# Food Faster

Speed-focused food decision-making app with native mobile support via Expo React Native.

## Overview

- **Purpose**: Quick food decisions - manage food items at home and dining out options
- **Architecture**: Express backend (Replit) + Expo React Native mobile app (run locally)
- **Database**: PostgreSQL with Drizzle ORM

## Project Structure

```
├── server/          # Express backend API
├── client/          # Web frontend (original)
├── shared/          # Shared types and schema
└── mobile/          # Expo React Native app (run locally)
```

## Running the Mobile App

The mobile app uses Expo and must be run locally on your computer (not on Replit).

### Steps:

1. **Publish the Backend First**
   - Click the Publish button in Replit to get a public URL
   - Note your published URL (e.g., `https://food-faster.replit.app`)

2. **Clone the Project Locally**
   ```bash
   git clone <your-replit-git-url>
   cd <project-folder>/mobile
   ```

3. **Update the API URL**
   - Edit `mobile/app.config.js`
   - Replace `"https://your-app-name.replit.app"` with your published URL

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start Expo**
   ```bash
   npx expo start
   ```

6. **Open in Expo Go**
   - Install Expo Go on your phone (iOS App Store or Google Play)
   - Scan the QR code from the terminal
   - The app will load on your phone

## API Endpoints

- `GET /api/foods` - List all food items
- `POST /api/foods` - Create food item
- `PATCH /api/foods/:id` - Update food item
- `DELETE /api/foods/:id` - Delete food item

## Features

- **Food Lists**: Quick entry of home (Fridge/Snacks) and out items
- **Add Info**: Detailed editing with multiple locations per food
- **Decide**: Browse available options based on current time/day
- **Location Support**: Shop-specific opening hours and closed days

## Recent Changes

- Added Expo React Native mobile app structure
- Enabled CORS for mobile app connectivity
- Configurable API URL via app.config.js
