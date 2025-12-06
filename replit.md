# Food Decisions

Speed-focused food decision-making app with native mobile support via Expo React Native.

## Overview

- **Purpose**: Quick food decisions - manage food items at home and dining out options
- **Architecture**: Express backend (Render) + Expo React Native mobile app (run locally) + Neon PostgreSQL
- **Database**: Neon PostgreSQL with Drizzle ORM

## Hosting

- **Backend API & Web**: https://fooddecisions.onrender.com (Render free tier)
- **Database**: Neon PostgreSQL (free tier)
- **Mobile**: Run locally with Expo Go
- **GitHub**: https://github.com/csho24/fooddecisions

Note: Render's free tier has a ~30 second "cold start" delay after periods of inactivity.

## Project Structure

```
├── server/          # Express backend API
├── client/          # Web frontend
├── shared/          # Shared types and schema
└── mobile/          # Expo React Native app (run locally)
```

## Running the Mobile App

The mobile app uses Expo and must be run locally on your computer.

### Steps:

1. **Clone from GitHub**
   ```bash
   git clone https://github.com/csho24/fooddecisions.git
   cd fooddecisions/mobile
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Expo**
   ```bash
   npx expo start
   ```

4. **Open in Expo Go**
   - Install Expo Go on your phone (iOS App Store or Google Play)
   - Scan the QR code from the terminal
   - The app will load on your phone

The mobile app is already configured to use the Render backend URL.

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

## Recent Changes (Dec 6, 2024)

- Migrated from Replit hosting to Render (free tier)
- Migrated database from Replit PostgreSQL to Neon PostgreSQL (free tier)
- Updated mobile app to use Render backend URL
- Monthly cost reduced from ~$25/month to $0
