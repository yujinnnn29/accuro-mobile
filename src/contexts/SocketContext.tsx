import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL, STORAGE_KEYS } from '../utils/constants';
import { storage } from '../utils/storage';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onNotification: (callback: (notification: any) => void) => () => void;
  onBookingUpdate: (callback: (booking: any) => void) => () => void;
  onQuotationUpdate: (callback: (quotation: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const initSocket = async () => {
      if (!isAuthenticated || !user) {
        if (socket) {
          socket.disconnect();
          setSocket(null);
          setIsConnected(false);
        }
        return;
      }

      const token = await storage.getString(STORAGE_KEYS.TOKEN);
      if (!token) return;

      socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.log('Socket connection error:', error.message);
        setIsConnected(false);
      });

      setSocket(socketInstance);
    };

    initSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const onNotification = useCallback(
    (callback: (notification: any) => void) => {
      if (!socket) return () => {};

      socket.on('notification', callback);
      return () => {
        socket.off('notification', callback);
      };
    },
    [socket]
  );

  const onBookingUpdate = useCallback(
    (callback: (booking: any) => void) => {
      if (!socket) return () => {};

      socket.on('bookingUpdate', callback);
      return () => {
        socket.off('bookingUpdate', callback);
      };
    },
    [socket]
  );

  const onQuotationUpdate = useCallback(
    (callback: (quotation: any) => void) => {
      if (!socket) return () => {};

      socket.on('quotationUpdate', callback);
      return () => {
        socket.off('quotationUpdate', callback);
      };
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onNotification,
        onBookingUpdate,
        onQuotationUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
