// Socket.io Mock Service
// This is a mock implementation for demonstration purposes
// Replace with real Socket.io connection when backend is available

export const USE_REAL_SOCKET = false; // Set to true when you have a real socket server

interface VehicleLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: string;
}

interface EmergencyAlert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

class SocketService {
  private connected: boolean = false;
  private listeners: Map<string, Set<Function>> = new Map();
  private mockIntervals: Map<string, any> = new Map();

  // Connect to socket server (mock implementation)
  connect(): void {
    if (this.connected) {
      console.log('Socket already connected (mock mode)');
      return;
    }

    if (!USE_REAL_SOCKET) {
      // Mock connection
      console.log('Socket connected in MOCK mode');
      this.connected = true;
      return;
    }

    // Real socket.io connection would go here when USE_REAL_SOCKET is true
    console.warn('Real socket connection not implemented yet');
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.connected) {
      // Clear all mock intervals
      this.mockIntervals.forEach((interval) => clearInterval(interval));
      this.mockIntervals.clear();
      this.listeners.clear();
      this.connected = false;
      console.log('Socket disconnected');
    }
  }

  // Subscribe to an event
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  // Unsubscribe from an event
  off(event: string, callback?: Function): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
    } else {
      this.listeners.delete(event);
    }
  }

  // Emit an event (mock implementation)
  emit(event: string, data?: any): void {
    if (!USE_REAL_SOCKET) {
      console.log('Mock emit:', event, data);
      return;
    }
    // Real socket emit would go here
  }

  // Join a room (mock implementation)
  joinRoom(roomId: string): void {
    console.log('Joined room (mock):', roomId);
  }

  // Leave a room (mock implementation)
  leaveRoom(roomId: string): void {
    console.log('Left room (mock):', roomId);
  }

  // Subscribe to vehicle location updates (mock implementation)
  subscribeToVehicleTracking(vehicleId: string, callback: (data: VehicleLocation) => void): void {
    this.joinRoom(`vehicle-${vehicleId}`);
    this.on('vehicle-location-update', callback);

    if (!USE_REAL_SOCKET) {
      // Simulate vehicle movement updates every 2 seconds
      const intervalId = setInterval(() => {
        const mockLocation: VehicleLocation = {
          lat: 40.7128 + (Math.random() - 0.5) * 0.01,
          lng: -74.006 + (Math.random() - 0.5) * 0.01,
          heading: Math.random() * 360,
          speed: 30 + Math.random() * 30,
          timestamp: new Date().toISOString(),
        };

        // Trigger callback with mock data
        const listeners = this.listeners.get('vehicle-location-update');
        if (listeners) {
          listeners.forEach((listener) => listener(mockLocation));
        }
      }, 2000);

      this.mockIntervals.set(`vehicle-${vehicleId}`, intervalId);
    }
  }

  // Unsubscribe from vehicle location updates
  unsubscribeFromVehicleTracking(vehicleId: string, callback?: Function): void {
    this.leaveRoom(`vehicle-${vehicleId}`);
    if (callback) {
      this.off('vehicle-location-update', callback);
    }

    // Clear mock interval
    const intervalId = this.mockIntervals.get(`vehicle-${vehicleId}`);
    if (intervalId) {
      clearInterval(intervalId);
      this.mockIntervals.delete(`vehicle-${vehicleId}`);
    }
  }

  // Subscribe to emergency alerts (mock implementation)
  subscribeToEmergencyAlerts(callback: (data: EmergencyAlert) => void): void {
    this.on('emergency-alert', callback);

    if (!USE_REAL_SOCKET) {
      // Simulate occasional emergency alerts
      const intervalId = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every 10 seconds
          const mockAlert: EmergencyAlert = {
            id: Date.now().toString(),
            message: 'Emergency Vehicle Alert: Ambulance approaching - Please clear the route',
            severity: 'high',
            timestamp: new Date().toISOString(),
          };

          const listeners = this.listeners.get('emergency-alert');
          if (listeners) {
            listeners.forEach((listener) => listener(mockAlert));
          }
        }
      }, 10000);

      this.mockIntervals.set('emergency-alerts', intervalId);
    }
  }

  // Unsubscribe from emergency alerts
  unsubscribeFromEmergencyAlerts(callback?: Function): void {
    if (callback) {
      this.off('emergency-alert', callback);
    }

    const intervalId = this.mockIntervals.get('emergency-alerts');
    if (intervalId) {
      clearInterval(intervalId);
      this.mockIntervals.delete('emergency-alerts');
    }
  }

  // Subscribe to route updates (mock implementation)
  subscribeToRouteUpdates(eventId: string, callback: (data: any) => void): void {
    this.joinRoom(`event-${eventId}`);
    this.on('route-update', callback);

    if (!USE_REAL_SOCKET) {
      // Simulate route updates every 5 seconds
      const intervalId = setInterval(() => {
        const mockUpdate = {
          eventId,
          status: 'active',
          progress: Math.random() * 100,
          timestamp: new Date().toISOString(),
        };

        const listeners = this.listeners.get('route-update');
        if (listeners) {
          listeners.forEach((listener) => listener(mockUpdate));
        }
      }, 5000);

      this.mockIntervals.set(`event-${eventId}`, intervalId);
    }
  }

  // Unsubscribe from route updates
  unsubscribeFromRouteUpdates(eventId: string, callback?: Function): void {
    this.leaveRoom(`event-${eventId}`);
    if (callback) {
      this.off('route-update', callback);
    }

    const intervalId = this.mockIntervals.get(`event-${eventId}`);
    if (intervalId) {
      clearInterval(intervalId);
      this.mockIntervals.delete(`event-${eventId}`);
    }
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.connected;
  }

  // Get socket instance (mock returns null)
  getSocket(): any {
    return null;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

// Configuration for real Socket.io (for future use)
export const SOCKET_CONFIG = {
  url: 'https://api.routewise.com',
  options: {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
};
