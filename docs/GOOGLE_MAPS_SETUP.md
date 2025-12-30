# Google Maps Integration

## Setup Instructions

To enable Google Maps functionality for vineyard locations, you need to obtain a Google Maps API key:

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API** (optional, for future features)
4. Go to "Credentials" and create an API key
5. (Optional but recommended) Restrict the API key:
   - Application restrictions: HTTP referrers
   - Add your domain(s): `localhost:4201/*`, `your-production-domain.com/*`
   - API restrictions: Select "Restrict key" and choose "Maps JavaScript API"

### 2. Configure the API Key

#### Development (local)
Edit `frontend/src/index.html` and replace `YOUR_API_KEY` with your actual API key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY"></script>
```

#### Production
For production deployment, you should:
1. Store the API key in an environment variable
2. Update your deployment script to inject the key during build

Alternatively, create a `.env` file:
```bash
GOOGLE_MAPS_API_KEY=your_actual_api_key
```

And reference it in your deployment configuration.

### 3. Cost & Quotas

Google Maps offers:
- **$200 free credit per month** (covers ~28,000 map loads)
- Pay-as-you-go pricing after free tier
- For a winery ERP with moderate usage, you'll likely stay within the free tier

### 4. Features Implemented

**Map Picker (Vineyard Form)**
- Click anywhere on the map to set vineyard location
- Displays current coordinates
- Centered on Greece (Athens) by default

**Vineyards Map View**
- Shows all vineyards with coordinates
- Click markers to see vineyard details
- Auto-fits bounds to show all vineyards
- Legend shows count of vineyards with/without locations
- Direct link to edit each vineyard

### 5. Testing Without API Key

The maps will show "For development purposes only" watermark and may have limited functionality, but the core features will still work for testing.

### Note

If you prefer not to use Google Maps, we can:
1. Use OpenStreetMap (Leaflet) - free, no API key, but may have rendering issues
2. Use Mapbox - similar to Google Maps, also requires API key but has different pricing
3. Simply store coordinates without map visualization

Let me know if you need help with any of these alternatives!

