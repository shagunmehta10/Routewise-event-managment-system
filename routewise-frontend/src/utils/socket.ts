import { io, Socket } from 'socket.io-client';

export const USE_REAL_SOCKET = true;

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
  private socket: Socket | null = null;
  private connected: boolean = false;

  // Connect to socket server
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server:', this.socket?.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Subscribe to an event
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  }

  // Unsubscribe from an event
  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  // Emit an event
  emit(event: string, data?: any): void {
    if (!this.socket) this.connect();
    this.socket?.emit(event, data);
  }

  // Join a room
  joinRoom(roomId: string): void {
    this.emit('joinEvent', roomId);
  }

  // Leave a room
  leaveRoom(roomId: string): void {
    // Backend doesn't explicitly have leaveEvent but socket.leave(room) can be added if needed
    // For now, we'll just emit it if the backend handles it or just disconnect/change room
  }

  // Subscribe to vehicle location updates
  subscribeToVehicleTracking(vehicleId: string, callback: (data: VehicleLocation) => void): void {
    this.joinRoom(vehicleId);
    this.on('updateLocation', callback);
  }

  // Unsubscribe from vehicle location updates
  unsubscribeFromVehicleTracking(vehicleId: string, callback?: (...args: any[]) => void): void {
    this.off('updateLocation', callback);
  }

  // Subscribe to emergency alerts
  subscribeToEmergencyAlerts(callback: (data: EmergencyAlert) => void): void {
    this.on('clearRoute', callback);
  }

  // Unsubscribe from emergency alerts
  unsubscribeFromEmergencyAlerts(callback?: (...args: any[]) => void): void {
    this.off('clearRoute', callback);
  }

  // Subscribe to route updates
  subscribeToRouteUpdates(eventId: string, callback: (data: any) => void): void {
    this.joinRoom(eventId);
    this.on('route-update', callback);
  }

  // Unsubscribe from route updates
  unsubscribeFromRouteUpdates(eventId: string, callback?: (...args: any[]) => void): void {
    this.off('route-update', callback);
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.connected;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

export const SOCKET_CONFIG = {
  url: 'http://localhost:5000',
  options: {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
};

