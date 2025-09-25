# PoE2 Market Data Integration Summary

## Current Situation (September 2025)

**No official APIs exist for Path of Exile 2 trade data.** Grinding Gear Games explicitly states "there are currently limited APIs that return PoE2 game information" and prohibits reverse-engineering undocumented endpoints in their Terms of Service.

## Recommended Solution: POE2Scout API

**POE2Scout** is currently the only viable third-party API for PoE2 market data.

### Key Details:
- **Base URL**: `https://poe2scout.com`
- **API Documentation**: `https://poe2scout.com/api/swagger` (Swagger UI)
- **Authentication**: None required
- **Rate Limiting**: Unspecified, but they request contact for high-volume usage
- **Data Source**: Scrapes official PoE2 trade website
- **GitHub**: `https://github.com/poe2scout/poe2scout`

### Required Headers:
```javascript
{
  'User-Agent': 'YourAppName/1.0 (contact: your-email@domain.com)',
  'Content-Type': 'application/json'
}
```

### Implementation Requirements:

1. **Error Handling**: Service could break at any time
2. **Fallback Strategy**: Design for when API is unavailable
3. **Rate Limiting**: Implement conservative rate limiting
4. **Disclaimers**: Inform users about third-party data source limitations

### Example Usage Pattern:
```javascript
const searchWeapons = async (filters) => {
  try {
    const response = await fetch('https://poe2scout.com/api/search', {
      method: 'POST',
      headers: {
        'User-Agent': 'PoE2Toolkit/1.0 (contact: your-email@domain.com)',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        league: "Standard",
        category: "weapon",
        filters: filters
      })
    });
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    // Implement fallback strategy
    console.error('POE2Scout API failed:', error);
    return null;
  }
};
```

### Limitations & Risks:
- **Unofficial**: Not endorsed by GGG
- **Fragile**: Depends on web scraping
- **ToS Risk**: May violate GGG's Terms of Service
- **No SLA**: No uptime guarantees
- **Data Lag**: Not real-time, periodic updates only

## Alternative Approaches:
1. **Wait for Official APIs**: Email `oauth@grindinggear.com` for future access
2. **Build Data Aggregation**: Combine multiple community sources
3. **User-Submitted Data**: Allow users to input prices manually

## Architecture Recommendation:
Design your PoE2 Toolkit with a pluggable data provider system so you can easily switch to official APIs when they become available.