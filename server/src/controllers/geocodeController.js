const geocodeCache = new Map();
const reverseCache = new Map();

const sendErrorResponse = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

const hasValidCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
};

export const geocodeAddress = async (req, res) => {
  try {
    const {
      city = '',
      country = 'Germany',
      postalCode = '',
      street = '',
    } = req.body;

    if (!String(city).trim() && !String(postalCode).trim()) {
      return sendErrorResponse(res, 400, 'City or postal code is required');
    }

    const fullAddress = [street, postalCode, city, country]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join(', ');
    const cacheKey = fullAddress.toLowerCase().replace(/\s+/g, ' ');

    if (geocodeCache.has(cacheKey)) {
      return res.json({
        success: true,
        message: 'Location found',
        data: geocodeCache.get(cacheKey),
      });
    }

    const params = new URLSearchParams({
      q: fullAddress,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    // This free geocoding is for demo/light use. For production, use a proper
    // geocoding provider or host a Nominatim instance.
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'FoodHubDemo/1.0',
        },
      },
    );

    if (!response.ok) {
      return sendErrorResponse(
        res,
        502,
        'Address lookup is temporarily unavailable',
      );
    }

    const results = await response.json();

    if (!results.length) {
      return sendErrorResponse(
        res,
        404,
        'Could not find location from address',
      );
    }

    const location = {
      lat: Number(results[0].lat),
      lng: Number(results[0].lon),
      displayName: results[0].display_name,
    };

    geocodeCache.set(cacheKey, location);

    res.json({
      success: true,
      message: 'Location found',
      data: location,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }

    sendErrorResponse(res, 502, 'Address lookup failed. Please try again later.');
  }
};

export const reverseGeocodeLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!hasValidCoordinates(lat, lng)) {
      return sendErrorResponse(
        res,
        400,
        'Valid latitude and longitude are required',
      );
    }

    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;

    if (reverseCache.has(cacheKey)) {
      return res.json({
        success: true,
        message: 'Address found',
        data: reverseCache.get(cacheKey),
      });
    }

    const params = new URLSearchParams({
      format: 'json',
      lat: String(lat),
      lon: String(lng),
      addressdetails: '1',
    });

    // This reverse geocoding uses OpenStreetMap Nominatim for demo/light usage.
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'FoodHubDemo/1.0',
        },
      },
    );

    if (response.status === 404) {
      return sendErrorResponse(
        res,
        404,
        'Could not find address from location',
      );
    }

    if (!response.ok) {
      return sendErrorResponse(res, 502, 'Reverse geocoding failed');
    }

    const result = await response.json();

    if (!result || result.error) {
      return sendErrorResponse(
        res,
        404,
        'Could not find address from location',
      );
    }

    const address = result.address || {};
    let street = '';

    if (address.road && address.house_number) {
      street = `${address.road} ${address.house_number}`;
    } else {
      street =
        address.road ||
        address.pedestrian ||
        address.footway ||
        address.residential ||
        address.suburb ||
        address.neighbourhood ||
        '';
    }

    const formattedAddress = {
      displayName: result.display_name || '',
      street,
      city:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        '',
      postalCode: address.postcode || '',
      country: address.country || 'Germany',
    };

    reverseCache.set(cacheKey, formattedAddress);

    res.json({
      success: true,
      message: 'Address found',
      data: formattedAddress,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }

    sendErrorResponse(res, 502, 'Reverse geocoding failed');
  }
};
