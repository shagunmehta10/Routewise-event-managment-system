// Replace with real API calls when backend is available
import { notifyClash } from './clashDetector';

const MOCK_EVENTS = [
  {
    id: 1,
    name: 'City Marathon 2026',
    description: 'Annual city marathon event with 5000+ participants',
    date: '2026-03-15',
    startLocation: 'City Hall, New York, NY, USA',
    endLocation: 'Central Park, New York, NY, USA',
    status: 'upcoming',
  },
  {
    id: 2,
    name: 'Tech Conference',
    description: 'Technology conference with international speakers',
    date: '2026-04-20',
    startLocation: 'Javits Center, New York, NY, USA',
    endLocation: 'Times Square, New York, NY, USA',
    status: 'upcoming',
  },
  {
    id: 3,
    name: 'Music Festival',
    description: 'Summer music festival featuring local and international artists',
    date: '2026-06-10',
    startLocation: 'Coney Island Beach, Brooklyn, NY, USA',
    endLocation: 'Barclays Center, Brooklyn, NY, USA',
    status: 'upcoming',
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// API Functions
export const eventAPI = {
  // Get all events
  getAllEvents: async (userId?: string | number) => {
    try {
      const url = userId 
        ? `${API_CONFIG.baseURL}/api/events?userId=${userId}`
        : `${API_CONFIG.baseURL}/api/events`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch events");
      let events = await response.json();
      
      // If we fetched ALL events (no userId), we still want to hide private ones 
      // from other users on the client side just in case.
      if (!userId) {
        const userJson = localStorage.getItem('user');
        const currentUser = userJson ? JSON.parse(userJson) : null;
        events = events.filter((e: any) => 
          !e.is_private || (currentUser && String(e.user_id) === String(currentUser.id))
        );
      }
      
      return events;
    } catch (error) {
      console.error('API Error (getAllEvents):', error);
      return [];
    }
  },

  // Create new event
  createEvent: async (eventData: any) => {
    if (!USE_REAL_API) {
      await delay(500);
      const newEvent = { ...eventData, id: Date.now(), status: 'upcoming' };
      MOCK_EVENTS.push(newEvent);
      return { success: true, message: 'Event created successfully', data: newEvent };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.detail || "Failed to create event");
    }
    return await response.json();
  },

  // Get event by ID
  getEventById: async (id: string) => {
    if (!USE_REAL_API) {
      await delay(300);
      const event = MOCK_EVENTS.find((e) => e.id === parseInt(id));
      return event || null;
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/events/${id}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch event");
    }
    return await response.json();
  },

  // Update event
  updateEvent: async (id: string, eventData: any) => {
    if (!USE_REAL_API) {
      await delay(500);
      const index = MOCK_EVENTS.findIndex((e) => e.id === parseInt(id));
      if (index !== -1) {
        MOCK_EVENTS[index] = { ...MOCK_EVENTS[index], ...eventData };
        return {
          success: true,
          message: 'Event updated successfully',
          data: MOCK_EVENTS[index],
        };
      }
      return null;
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.detail || "Failed to update event");
    }
    return await response.json();
  },

  // Delete event
  deleteEvent: async (id: string) => {
    if (!USE_REAL_API) {
      await delay(500);
      const index = MOCK_EVENTS.findIndex((e) => e.id === parseInt(id));
      if (index !== -1) {
        MOCK_EVENTS.splice(index, 1);
        return {
          success: true,
          message: 'Event deleted successfully',
        };
      }
      return null;
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/events/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error("Failed to delete event");
    return await response.json();
  },

  // Helper to calculate actual status based on time
  getLiveStatus: (event: any) => {
    if (!event || !event.date) return 'upcoming';
    
    // Normalize to IST (Indian Standard Time)
    const nowUtc = new Date();
    const nowIst = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
    
    // Parse event date in IST
    const eDateObj = new Date(event.date);
    const eventDateStr = eDateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const [y, m, d] = eventDateStr.split('-').map(Number);

    // Parse event times (HH:MM)
    const startTimeStr = event.startTime || event.starttime || "00:00";
    const endTimeStr = event.endTime || event.endtime || "23:59";
    const [sh, sm] = startTimeStr.split(':').map(Number);
    const [eh, em] = endTimeStr.split(':').map(Number);
    
    const startTime = new Date(y, m - 1, d, sh, sm);
    const endTime = new Date(y, m - 1, d, eh, em);

    // Handle midnight cross
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    if (nowIst >= startTime && nowIst <= endTime) return 'live';
    if (nowIst > endTime) return 'completed';
    return 'upcoming';
  },


  // Detect clashes between events
  detectClashes: (events: any[]) => {
    if (!events || events.length < 2) return events.map(e => ({ ...e, clashing: false }));

    const toMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const getPriority = (type?: string) => {
      const p: Record<string, number> = { ambulance: 1, vip: 2, rally: 3, funeral: 4, other: 5, baraat: 6 };
      return p[type || 'other'] || 5;
    };

    return events.map((e, _, all) => {
      let clashing = false;
      let clashWith = '';
      let mustDivert = false;

      const eD = new Date(e.date);
      const eDate = new Date(eD.getFullYear(), eD.getMonth(), eD.getDate()).getTime();
      const eStart = toMins(e.startTime);
      let eEnd = e.endTime ? toMins(e.endTime) : eStart + 240;
      if (eEnd < eStart) eEnd += 1440;

      for (const other of all) {
        if (e.id === other.id) continue;
        
        // Skip completed events for clash detection
        if (e.status === 'completed' || other.status === 'completed') continue;

        const oD = new Date(other.date);
        if (isNaN(oD.getTime())) continue;
        const oIst = new Date(oD.getTime() + (5.5 * 60 * 60 * 1000));
        const oDate = new Date(oIst.getUTCFullYear(), oIst.getUTCMonth(), oIst.getUTCDate()).getTime();
        if (eDate !== oDate) continue;



        const oStart = toMins(other.startTime);
        let oEnd = other.endTime ? toMins(other.endTime) : oStart + 240;
        if (oEnd < oStart) oEnd += 1440;

        // Time overlap AND Same Route
        if (eStart < oEnd && oStart < eEnd) {
          const sameRoute = e.startLocation === other.startLocation && e.endLocation === other.endLocation;
          
            if (sameRoute) {
              clashing = true;
              clashWith = other.name;
              mustDivert = true; // Always require clearance for clashing tactical paths
              
              // Trigger Tactical Alert
              const userJson = localStorage.getItem('user');
              const user = userJson ? JSON.parse(userJson) : null;
              notifyClash(e, other, user);

            }
        }
      }

      return {
        ...e,
        clashing,
        clashWith,
        mustDivert
      };
    });
  },
};

// Route API
export const routeAPI = {
  // Get route details
  getRouteDetails: async (startLocation: string, endLocation: string) => {
    await delay(300);
    return {
      distance: '12.5 km',
      duration: '25 minutes',
      startLocation,
      endLocation,
      waypoints: [
        { lat: 40.7128, lng: -74.006 },
        { lat: 40.7614, lng: -73.9776 },
      ],
    };
  },

  // Geocode location name to coordinates with caching
  _geocodeCache: {} as Record<string, [number, number] | null>,
  geocodeLocation: async (locationName: string): Promise<[number, number] | null> => {
    if (routeAPI._geocodeCache[locationName]) return routeAPI._geocodeCache[locationName];
    if (routeAPI._geocodeCache[locationName] === null) return null;

    // 1. Try original search with India context and viewbox bias
    const dehradunViewbox = '77.8,30.5,78.2,30.2'; // l,t,r,b
    const tryGeocode = async (q: string, bounded = false) => {
      console.log(`Searching map for: "${q}"`);
      try {
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=in`;
        if (bounded) url += `&viewbox=${dehradunViewbox}&bounded=1`;
        
        const response = await fetch(`${API_CONFIG.baseURL}/api/routes/geocode?q=${encodeURIComponent(q)}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number];
        }
        return null;
      } catch (e) {
        console.error("Search error:", e);
        return null;
      }
    };

    // 1. Try with Dehradun context and bounding box first
    let coords = await tryGeocode(`${locationName}, Dehradun`, true);
    
    // 2. Try with Dehradun context without bounding box
    if (!coords) {
        coords = await tryGeocode(`${locationName}, Dehradun, Uttarakhand, India`);
    }

    // 3. Try with generic India context
    if (!coords) {
        coords = await tryGeocode(`${locationName}, India`);
    }

    // 4. Hardcoded fallbacks for local UX (common spots in the area)
    if (!coords) {
        const lowerName = locationName.toLowerCase();
        if (lowerName.includes('prem nagar')) coords = [30.3344, 77.9619];
        else if (lowerName.includes('centrio')) coords = [30.3426, 78.0494];
        else if (lowerName.includes('marina')) coords = [30.2684, 77.9942];
        else if (lowerName.includes('marina hostel')) coords = [30.2684, 77.9942];
        else if (lowerName.includes('graphic era') || lowerName.includes('geu')) coords = [30.2646, 77.9961];
        else if (lowerName.includes('paltan')) coords = [30.3222, 78.0416];
        else if (lowerName.includes('isbt')) coords = [30.2878, 77.9982];
        else if (lowerName.includes('clock tower')) coords = [30.3256, 78.0416];
        else if (lowerName.includes('pacific mall')) coords = [30.3638, 78.0645];
        else if (lowerName.includes('massorie') || lowerName.includes('mussoorie')) coords = [30.4599, 78.0664];
        else if (lowerName.includes('dehradun')) coords = [30.3165, 78.0322];
    }

    routeAPI._geocodeCache[locationName] = coords;
    return coords;
  },

  // Search for multiple matching locations (for autocomplete)
  searchLocations: async (query: string) => {
    if (!query || query.length < 3) return [];
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}/api/routes/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
    } catch (e) {
      console.error("Search API error:", e);
      return [];
    }
  },

  // Get real route from OSRM
  getOSRMRoute: async (start: [number, number], end: [number, number]) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      if (!response.ok) throw new Error('Failed to fetch OSRM route');
      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes.length) throw new Error('No route found');
      
      const route = data.routes[0];
      return {
        distance: (route.distance / 1000).toFixed(1) + ' km',
        duration: Math.round(route.duration / 60) + ' min',
        geometry: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
      };
    } catch (error) {
      console.error('OSRM Route Error:', error);
      return null;
    }
  },

  // Get multiple alternative routes
  async getOSRMAlternatives(
    start: [number, number], 
    end: [number, number], 
    _options: { avoidTolls?: boolean, avoidHighways?: boolean, preference?: 'fastest' | 'shortest' } = {}
  ) {
    try {
      let url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=true`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      let allRoutes = [];
      if (data.code === 'Ok' && data.routes) {
        allRoutes = data.routes.map((r: any) => ({
          geometry: r.geometry.coordinates.map((c: any) => [c[1], c[0]]),
          distance: (r.distance / 1000).toFixed(1) + ' km',
          duration: Math.round(r.duration / 60) + ' min',
          meters: r.distance,
          seconds: r.duration
        }));
      }

      // If only one route found, let's try to "force" an alternative by using a midpoint via
      if (allRoutes.length === 1) {
        try {
          // Midpoint calculation
          const midLat = (start[0] + end[0]) / 2;
          const midLon = (start[1] + end[1]) / 2;
          // Shift the midpoint slightly (about 1-2km) to force a different path
          const viaLat = midLat + 0.012; 
          const viaLon = midLon + 0.012;
          
          const viaUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${viaLon},${viaLat};${end[1]},${end[0]}?overview=full&geometries=geojson`;
          const viaRes = await fetch(viaUrl);
          const viaData = await viaRes.json();
          
          if (viaData.code === 'Ok' && viaData.routes?.length > 0) {
            const vR = viaData.routes[0];
            allRoutes.push({
              geometry: vR.geometry.coordinates.map((c: any) => [c[1], c[0]]),
              distance: (vR.distance / 1000).toFixed(1) + ' km',
              duration: Math.round(vR.duration / 60) + ' min',
              meters: vR.distance,
              seconds: vR.duration,
              isTactical: true
            });
          }
        } catch (e) { console.error("Could not force tactical alt:", e); }
      }

      // Filter for unique routes (difference > 100m)
      const uniqueRoutes = allRoutes.filter((route: any, index: number) => {
        if (index === 0) return true;
        // Check if this route is significantly different from the first one
        const isDifferent = Math.abs(route.meters - allRoutes[0].meters) > 100 || (route as any).isTactical;
        return isDifferent;
      });

      // Simple clash indicator
      const clashing = uniqueRoutes.length > 1 && uniqueRoutes[0].meters < 5000;
      
      return { 
        routes: uniqueRoutes.length > 0 ? uniqueRoutes : (allRoutes.length > 0 ? allRoutes.slice(0, 1) : []), 
        clashing 
      };
    } catch (error) {
      console.error('OSRM Alternatives error:', error);
      return { routes: [], clashing: false };
    }
  },
};

// Tracking API
export const trackingAPI = {
  // Get live vehicle location
  getVehicleLocation: async (vehicleId: string) => {
    await delay(300);
    return {
      vehicleId,
      lat: 40.7128 + Math.random() * 0.01,
      lng: -74.006 + Math.random() * 0.01,
      heading: Math.random() * 360,
      speed: 30 + Math.random() * 20,
      timestamp: new Date().toISOString(),
    };
  },

  // Get emergency alerts
  getEmergencyAlerts: async () => {
    await delay(300);
    return [
      {
        id: '1',
        message: 'Emergency Vehicle Alert: Ambulance approaching from the north',
        severity: 'high' as const,
        timestamp: new Date().toISOString(),
      },
    ];
  },
};

// Auth API
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    if (!USE_REAL_API) {
      await delay(500);
      const mockUser = {
        id: 1,
        name: 'Demo User',
        email: credentials.email,
        role: 'admin',
        points: 450,
      };
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { success: true, user: mockUser };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed");
    }
    
    const data = await response.json();
    // Persist login state
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return {
      success: true,
      user: data.user,
    };
  },

  register: async (userData: { name: string; email: string; password: string }) => {
    if (!USE_REAL_API) {
      await delay(500);
      const mockUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        role: 'user',
        points: 0,
      };
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { success: true, user: mockUser };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed");
    }
    
    const data = await response.json();
    // Persist login state
    localStorage.setItem('isAuthenticated', 'true');
    // register usually returns just the new user object based on our authController
    // let's wrap it in user key if it's missing, but backend returns rows[0]
    const userObj = data.user || data;
    localStorage.setItem('user', JSON.stringify(userObj));
    
    return {
      success: true,
      user: userObj,
    };
  },

  getProfile: async () => {
    const userJson = localStorage.getItem('user');
    if (!userJson) throw new Error("Not authenticated");
    const user = JSON.parse(userJson);
    
    if (!USE_REAL_API) {
      await delay(300);
      return user;
    }
    
    // In a real app, we'd fetch from /api/auth/profile using a token
    // For now, we'll re-fetch the user details via a simulated or real endpoint if we have one
    // Let's assume the backend has a /api/auth/profile/:id endpoint
    const response = await fetch(`${API_CONFIG.baseURL}/api/auth/profile/${user.id}`);
    if (!response.ok) throw new Error("Failed to fetch profile");
    
    const data = await response.json();
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  },

  logout: async () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    return {
      success: true,
      message: 'Logged out successfully',
    };
  },

  // Update profile data (Avatar, etc.)
  updateProfile: async (id: string | number, data: any) => {
    if (!USE_REAL_API) {
      await delay(500);
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = { ...JSON.parse(userJson), ...data };
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      return data;
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/auth/profile/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Profile synchronization failed");
    const updatedUser = await response.json();
    localStorage.setItem('user', JSON.stringify(updatedUser.user || updatedUser));
    return updatedUser;
  },

  // Update user settings
  updateSettings: async (settings: any) => {
    const userJson = localStorage.getItem('user');
    if (!userJson) throw new Error("Not authenticated");
    const user = JSON.parse(userJson);
    
    if (!USE_REAL_API) {
      await delay(500);
      user.settings = { ...user.settings, ...settings };
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, settings: user.settings };
    }
    
    const response = await fetch(`${API_CONFIG.baseURL}/api/auth/profile/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) throw new Error("Failed to update settings");
    const data = await response.json();
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  // Claim tactical gift card
  claimGiftCard: async (code: string) => {
    const userJson = localStorage.getItem('user');
    if (!userJson) throw new Error("Not authenticated");
    const user = JSON.parse(userJson);
    
    await delay(1000); // Simulate verification
    if (code.startsWith('RTW-')) {
      const reward = 500; // Mock reward
      user.points = (user.points || 0) + reward;
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, message: `Gift card claimed! +${reward} tactical points.`, points: user.points };
    }
    throw new Error("Invalid or expired gift card code");
  },

  // Forgot password — generate tactical reset link
  forgotPassword: async (email: string) => {
    if (!USE_REAL_API) {
      await delay(1000);
      const link = `${window.location.origin}/reset-password?token=RTW-ALPHA-${Math.random().toString(36).substring(7).toUpperCase()}`;
      console.log(`[TACTICAL DISPATCH] Link sent to ${email}: ${link}`);
      return { success: true, message: `Tactical reset link dispatched to ${email}.`, link };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error("Could not verify email identity");
    return await response.json();
  },

  // Reset password — deploy new credentials
  resetPassword: async (password: string, token: string) => {
    if (!USE_REAL_API) {
      await delay(1200);
      return { success: true, message: "Credentials updated. Command access restored." };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, token }),
    });
    if (!response.ok) throw new Error("Invalid or expired reset token");
    return await response.json();
  }
};

// Payment API
export const paymentAPI = {
  payPenalty: async (eventId: string, amount: number, method: string) => {
    // Generate UPI GPay intent
    const upiLink = `upi://pay?pa=routewise@axis&pn=RouteWise%20Tactical&am=${amount}&cu=INR&tn=Mission%20Penalty%20Event%20${eventId}`;
    
    if (!USE_REAL_API) {
      await delay(1500);
      // Simulate redirection to GPay in a real mobile browser
      if (method === 'upi') {
        console.log(`[GPAY INTENT] Redirecting to: ${upiLink}`);
        window.open(upiLink, '_blank');
      }
      return { success: true, transactionId: 'TXN' + Date.now(), upiIntent: upiLink };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/events/${eventId}/pay-penalty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method, upiIntent: upiLink }),
    });
    if (!response.ok) throw new Error("Payment failed");
    return await response.json();
  },

  getMissionHistory: async (userId: string | number) => {
    if (!USE_REAL_API) {
      await delay(500);
      return {
        totalMissions: 42,
        distanceTraveled: '1,240 km',
        pointsEarned: 8400,
        recentActivity: [
          { id: 1, action: 'Mission Completed', points: +200, date: '2026-04-20' },
          { id: 2, action: 'Penalty Paid', points: 0, date: '2026-04-18' },
        ]
      };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/users/${userId}/history`);
    if (!response.ok) throw new Error("Failed to fetch mission history");
    return await response.json();
  }
};

// Venue API
export const venueAPI = {
  // Register a new venue
  registerVenue: async (venueData: any) => {
    if (!USE_REAL_API) {
      await delay(500);
      return { success: true, message: 'Venue registered successfully', data: { ...venueData, id: Date.now(), approved: false } };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/venues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venueData),
    });
    if (!response.ok) throw new Error("Failed to register venue");
    return await response.json();
  },

  // Get all venues
  getAllVenues: async () => {
    if (!USE_REAL_API) {
      await delay(300);
      return [
        { id: 1, name: 'Grand Celebration Banquet', address: '123 Event St, Dehradun', approved: true },
        { id: 2, name: 'Royal Garden Farmhouse', address: '456 Party Ln, Dehradun', approved: false },
      ];
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/venues`);
    if (!response.ok) throw new Error("Failed to fetch venues");
    return await response.json();
  },

  // Get venue by ID
  getVenueById: async (id: string) => {
    if (!USE_REAL_API) {
      await delay(300);
      return { id: parseInt(id), name: 'Grand Celebration Banquet', address: '123 Event St, Dehradun', approved: true };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/venues/${id}`);
    if (!response.ok) throw new Error("Failed to fetch venue");
    return await response.json();
  },

  // Approve a venue
  approveVenue: async (id: string) => {
    if (!USE_REAL_API) {
      await delay(500);
      return { success: true, message: 'Venue approved' };
    }
    const response = await fetch(`${API_CONFIG.baseURL}/api/venues/${id}/approve`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error("Failed to approve venue");
    return await response.json();
  }
};


// Health Check API
export const systemAPI = {
  checkHealth: async () => {
    if (!USE_REAL_API) return { status: 'ok', mock: true };
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/`);
      if (!response.ok) return { status: 'error', message: 'Backend responded with error' };
      const data = await response.json();
      return { status: 'ok', ...data };
    } catch (error) {
      return { status: 'error', message: 'Backend unreachable' };
    }
  }
};


export const USE_REAL_API = true;

// Real API configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
};

