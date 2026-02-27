# Pre-Analysis GPS Input Fields - Quick Guide

## Overview
GPS input fields are now available directly on the upload page, allowing users to provide location information **before** starting the analysis.

## Visual Location
**Analyze Page → Upload Section → "Provide GPS Location (Optional)"**

The GPS section appears between the video upload zone and the "Analyze Collision" button.

## How to Use

### Step 1: Enable GPS Input
- Check the "Enable" checkbox on the right side
- GPS input fields will appear below

### Step 2: Enter Coordinates
**Latitude Field:**
- Range: -90 to 90
- Format: Decimal degrees (e.g., 37.774929)
- 6 decimal places recommended for accuracy

**Longitude Field:**
- Range: -180 to 180
- Format: Decimal degrees (e.g., -122.419416)
- 6 decimal places recommended for accuracy

### Step 3: Upload Video
- Click upload zone
- Select your collision video
- GPS coordinates are saved for analysis

### Step 4: Analyze
- Click "Analyze Collision" button
- System processes video normally
- If video has NO GPS metadata → Manual GPS is applied automatically
- If video HAS GPS → Video GPS is used (manual GPS ignored)

## Smart GPS Application Logic

```
Video Upload + Manual GPS Enabled
    ↓
Video Analysis Starts
    ↓
Check: Does video have GPS metadata?
    ↓
┌─── YES ──→ Use video GPS (auto-detected)
│
└─── NO ───→ Apply manual GPS you provided
              ↓
         Geocode address
              ↓
         Fetch traffic info
              ↓
         Mark as "manual" source
```

## Example Coordinates

### Major Cities
| City | Latitude | Longitude |
|------|----------|-----------|
| San Francisco | 37.774929 | -122.419416 |
| New York | 40.712776 | -74.005974 |
| Los Angeles | 34.052235 | -118.243683 |
| Chicago | 41.878113 | -87.629799 |
| Miami | 25.761681 | -80.191788 |
| Seattle | 47.606209 | -122.332069 |
| London | 51.507351 | -0.127758 |
| Tokyo | 35.689487 | 139.691711 |
| Sydney | -33.868820 | 151.209290 |
| Dubai | 25.204849 | 55.270782 |

### How to Get Coordinates from Google Maps

**Method 1: Desktop**
1. Open Google Maps
2. Right-click on the collision location
3. Click on the coordinates that appear
4. Coordinates are copied to clipboard
5. Paste into Latitude and Longitude fields

**Method 2: Mobile**
1. Open Google Maps app
2. Long-press on the location
3. A pin drops with coordinates at bottom
4. Tap on coordinates to copy
5. Paste into the fields

**Method 3: Search Address**
1. Search for address in Google Maps
2. Coordinates appear in URL
3. Format: `@LAT,LON,ZOOM`
4. Extract LAT and LON values

## Features

### ✅ Optional - Not Required
- GPS input is completely optional
- System works perfectly without it
- Only used when video lacks GPS metadata

### ✅ Smart Auto-Application
- Manual GPS only applied if needed
- Automatic detection takes priority
- No duplicate GPS entries

### ✅ Full Feature Integration
- Geocoding to street address
- Traffic information fetching
- Nearby roads detection
- SMS alert inclusion
- Marked as "manual" source

### ✅ User-Friendly Design
- Clean toggle to show/hide fields
- Helpful tooltip with instructions
- Placeholder examples
- Validation on submit
- Clear labeling

## Use Cases

### 1. Dashcam Without GPS
**Scenario:** Old dashcam doesn't record location  
**Solution:** Enable GPS, enter known location, upload video

### 2. Security Camera Footage
**Scenario:** Fixed camera at known intersection  
**Solution:** Enable GPS, enter camera location once, analyze multiple videos

### 3. Witness Video
**Scenario:** Bystander recorded on phone without GPS  
**Solution:** Enable GPS, get location from witness, analyze video

### 4. Archive Footage
**Scenario:** Historical video from incident report  
**Solution:** Enable GPS, reference incident report for location

### 5. Test Videos
**Scenario:** Training scenarios without real locations  
**Solution:** Enable GPS, use test coordinates for various locations

## Post-Analysis Options

Even after analysis completes, you can still:

1. **Update GPS** - Click "Add GPS Manually" in results
2. **Correct Location** - Override incorrect auto-detected GPS
3. **Add Missing GPS** - Provide location for analyzed videos

## Validation

**System validates:**
- ✅ Numeric values only
- ✅ Latitude between -90 and 90
- ✅ Longitude between -180 and 180
- ✅ Proper decimal format
- ✅ Not empty if enabled

**Errors shown if:**
- ❌ Non-numeric input
- ❌ Out of range values
- ❌ Empty when required
- ❌ Invalid format

## Benefits

### For Users
✅ No need to wait for analysis to add GPS  
✅ One-step process instead of two  
✅ Clear visibility before analysis  
✅ Reduce post-analysis corrections  

### For Emergency Response
✅ Location available immediately  
✅ Faster alert dispatch  
✅ More complete initial reports  
✅ Better traffic context  

### For Data Quality
✅ Proactive GPS entry  
✅ Audit trail with source tracking  
✅ Reduced missing data  
✅ Better analysis completeness  

## Comparison: Pre vs Post Analysis GPS

| Feature | Pre-Analysis Input | Post-Analysis Override |
|---------|-------------------|------------------------|
| **When** | Before analysis | After analysis complete |
| **Location** | Upload page | Results page |
| **Action** | Toggle + Fill fields | Click button + Dialog |
| **Auto-Apply** | Yes (if needed) | Manual update |
| **Use Case** | Known lack of GPS | Correction/Addition |
| **Steps** | 1 (during upload) | 2 (analyze then update) |

**Best Practice:** Use pre-analysis input when you know video lacks GPS. Use post-analysis override for corrections or missed entries.

## Tips & Tricks

### 💡 Tip 1: Save Common Locations
Keep a list of frequently used coordinates:
- Company parking lot
- Main intersection
- Fleet depot location

### 💡 Tip 2: Use Landmark Coordinates
For approximate locations:
- Nearest major intersection
- Nearby landmark or building
- Street address midpoint

### 💡 Tip 3: Batch Processing
When analyzing multiple videos from same location:
- Enable GPS once
- Enter coordinates
- Upload and analyze multiple videos
- All get same location

### 💡 Tip 4: Coordinate Precision
- 4 decimals = ~11 meters accuracy (sufficient for most cases)
- 6 decimals = ~0.11 meters accuracy (very precise)
- More decimals = better accuracy

### 💡 Tip 5: Cross-Reference
Verify coordinates using:
- Google Maps reverse lookup
- GPS coordinate validators
- Compare with known landmarks

## Troubleshooting

### GPS Fields Not Showing
**Issue:** Can't see latitude/longitude inputs  
**Fix:** Click the "Enable" checkbox to show fields

### Coordinates Not Applied
**Issue:** Video analyzed without manual GPS  
**Reason:** Video already had GPS metadata  
**Expected:** System prioritizes video GPS (auto-detected)

### Invalid Coordinate Error
**Issue:** Can't submit analysis  
**Check:**
- Latitude between -90 and 90
- Longitude between -180 and 180
- No letters or special characters
- Using decimal format (not degrees/minutes/seconds)

### GPS Shows as "Auto" Not "Manual"
**Issue:** Expected manual source  
**Reason:** Video had GPS metadata  
**Behavior:** Correct - video GPS takes precedence

## Privacy & Security

### Data Handling
- GPS stored with analysis record
- Marked with source (manual/auto)
- Used only for emergency response
- Can be deleted with analysis

### No External Sharing
- GPS not sent to third parties
- Used internally for geocoding/traffic only
- Included only in emergency SMS alerts
- Not exposed in public APIs

## API for Developers

Pre-analysis GPS is applied using the existing update endpoint:

```javascript
// Frontend flow
1. User enables GPS and enters coordinates
2. Video upload and analysis (POST /api/analyze)
3. If response.gps_coordinates is null:
   POST /api/update-gps {
     analysis_id: response.id,
     latitude: preAnalysisGPS.latitude,
     longitude: preAnalysisGPS.longitude
   }
4. Update UI with GPS response
```

## Summary

**Three Ways to Add GPS:**

1. **Auto-Detection** (Best)
   - Video has GPS metadata
   - No user action needed
   - Source: "auto"

2. **Pre-Analysis Input** (New!)
   - Enable checkbox on upload page
   - Enter coordinates before analysis
   - Applied automatically if needed
   - Source: "manual"

3. **Post-Analysis Override**
   - Click button after analysis
   - Enter in dialog
   - Update existing analysis
   - Source: "manual"

Choose the method that fits your workflow!

---

**Feature Status:** ✅ Production Ready  
**Version:** 3.0.0  
**Last Updated:** February 27, 2026
