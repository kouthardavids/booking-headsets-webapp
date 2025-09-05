// authContext.jsx
import { axiosInstance } from "./headsetApi.js";
import { setAccessToken, clearAccessToken, getAccessToken, setUserData, getUserData, setUserBooking, getUserBooking } from "./authToken.js";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvieder');
  }
  return context;
};

// Helps us know who the logged-in user is
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // stores the user in here
  const [userBooking, setUserBookingState] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedUser = getUserData();
      const storedBooking = getUserBooking();
      const token = getAccessToken();
      
      if (storedUser && token) {
        setUser(storedUser);
        setUserBookingState(storedBooking);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const clearAuthData = () => {
    clearAccessToken();
    setUser(null);
    setUserBookingState(null);
    setIsAuthenticated(false);
  };

  const checkAuthStatus = async () => {
    try {
      const response = await axiosInstance.post('/auth/refresh-token');
      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken);
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      clearAuthData();
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/user-login', { email, password });
      const { accessToken, user: userData } = response.data;

      setAccessToken(accessToken);
      setUserData(userData);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const signup = async (username, email, password) => {
    try {
      const response = await axiosInstance.post('/auth/sign-up', { username, email, password });
      const { accessToken, user: userData } = response.data;

      setAccessToken(accessToken);
      setUserData(userData);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed',
      };
    }
  };

  const googleSignup = async (idToken) => {
    try {
      const response = await axiosInstance.post('/auth/google-signup', { idToken });
      const { accessToken, user: userData } = response.data;

      setAccessToken(accessToken);
      setUserData(userData);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Google signup error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Google signup failed',
      };
    }
  };

  const googleLogin = async (idToken) => {
    try {
      const response = await axiosInstance.post('/auth/google-login', { idToken });
      const { accessToken, user: userData } = response.data;

      setAccessToken(accessToken);
      setUserData(userData);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorMessage = 'Google login failed';
      if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Authentication failed';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const setBooking = (booking) => {
    setUserBookingState(booking);
    setUserBooking(booking);
  };

  const clearBooking = () => {
    setUserBookingState(null);
    setUserBooking(null);
  };

  const logout = () => {
    clearAuthData();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userBooking,
      isAuthenticated, 
      loading,
      login, 
      signup, 
      googleSignup, 
      googleLogin,
      setBooking,
      clearBooking,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};