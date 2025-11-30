# SayEasy 🗣️

A highly simplified, touch-first web app designed for people with significant motor and cognitive limitations. Built with love for caregiving and communication.

## Features

- **Giant Touch Targets**: Two large left-side buttons (More/Yes and All Done/No) with emoji icons
- **Vertical Rolodex**: Up to 10 large, swipeable item cards on the right side
- **Voice Output**: Text-to-speech using Web Speech API with voice preference options (boy, girl, neutral)
- **Fullscreen Mode**: Kiosk-style fullscreen with double-tap to exit
- **Touch-Tolerant**: Designed for imprecise touches (wet fist, palm, etc.)
- **Two Modes**:
  - **Default**: 7 preset cards (TV, Floor, Play, Read, Stand, Do Hair, Back Rub)
  - **Custom**: Create up to 10 personalized cards with custom labels and emojis
- **No Backend Required**: All settings stored locally using localStorage

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open your browser to `http://localhost:5173` (or the URL shown in terminal)

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Deployment to Netlify

### Option 1: Through Netlify UI

1. Push your code to GitHub
2. Log into [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

### Option 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

### Build Settings for Netlify

If you need to create a `netlify.toml` file:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## How to Use

### For Caregivers

1. **Initial Setup**: When you first open the app, you'll see the Settings page
2. **Choose Voice**: Select voice preference (Neutral, Boy, or Girl)
3. **Choose Mode**:
   - **Default Set**: Uses 7 preset cards
   - **Custom Set**: Create your own cards (up to 10)
4. **Customize Cards** (Custom mode):
   - Set label (what appears on screen)
   - Choose emoji (the icon)
   - Set voice text (what the app will say)
5. **Save Settings**: Click "Save & Close" to enter fullscreen mode
6. **Exit Fullscreen**: Double-tap the "Double-tap to exit" button in top-right corner

### For Users with High Needs

The app displays in fullscreen with:
- **Left side**: Two large buttons to tap
  - Top: "More / Yes" (green with 👏)
  - Bottom: "All Done / No" (red with 🛑)
- **Right side**: Large item cards
  - Tap the circle to hear the item spoken
  - Swipe up/down anywhere on right side to flip to next/previous item
  - Visual dots at bottom show position in the list

## Browser Compatibility

Works best on:
- ✅ Modern Chrome/Edge (desktop & mobile)
- ✅ Safari (iOS & macOS)
- ✅ Firefox (desktop & mobile)

**Note**: Voice output requires a browser that supports Web Speech API (most modern browsers do)

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Web Speech API** - Text-to-speech
- **LocalStorage** - Settings persistence

## Accessibility Features

- High contrast colors with thick borders
- Large touch targets (minimum 72px)
- No small text or complex navigation
- Visual and audio feedback
- Designed for imprecise touch input
- Fullscreen mode to minimize distractions

## Development Notes

### Project Structure

```
src/
├── components/
│   ├── MainView.jsx      # Main communication interface
│   └── Settings.jsx      # Settings/customization page
├── data/
│   └── defaultCards.js   # Default card configurations
├── utils/
│   ├── speech.js         # Web Speech API utilities
│   └── storage.js        # localStorage utilities
├── App.jsx               # Main app component
├── main.jsx              # Entry point
└── index.css             # Global styles
```

### Adding New Features

The app is intentionally simple, but you can extend it:
- Edit `defaultCards.js` to change default cards
- Modify button colors in `MainView.jsx`
- Add more voice options in `speech.js`
- Customize swipe sensitivity by changing `dragThreshold`

## Future Enhancements

Possible features for future versions:
- Image uploads with Supabase backend
- More customizable button options
- Usage analytics
- Multiple profiles for different users
- Export/import settings

## Support

For issues or questions, please file an issue on GitHub.

## License

MIT License - feel free to use and modify for your needs!

---

Built with ❤️ for accessible communication
