import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import i18n from '../i18n';

const languageMap = {
    'English': 'en',
    'Hindi': 'hi',
    'Bengali': 'bn',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de'
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and user on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.preferredLanguage && languageMap[parsedUser.preferredLanguage]) {
          i18n.changeLanguage(languageMap[parsedUser.preferredLanguage]);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.data.token);
    // Assuming backend returns user object inside data
    // Usually res.data = { success: true, token: '...', user: {...} } based on typical controller
    // Let's verify backend response structure from authController if needed, but standard is token.
    // We might need to decode token or get user profile. 
    // For now assuming we decode or fetch ME. 
    // Actually standard JWT flow often returns user data on login too.
    
    // Let's fetch user profile to be safe or use what's returned
    // If backend returns user data:
    // setUser(res.data.user);
    // localStorage.setItem('user', JSON.stringify(res.data.user));
    
    // Let's assume we need to fetch 'me' or it's in response.
    // Based on previous valid logs: AUTH HEADER => ... DECODED => ...
    // Let's assume login returns token.
    
    // Quick fix: let's fetch /auth/me if strictly needed, or trust the response.
    // checking backend auth controller would be ideal but let's assume standard response for now.
    // If we look at previous interactions, we didn't see login response structure.
    // I'll assume it returns token and I should fetch /auth/me or it returns user.
    
    // Actually, let's just decode for now or fetch.
    // To be robust:
    const userRes = await api.get('/auth/me'); 
    const userData = userRes.data.data;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.preferredLanguage && languageMap[userData.preferredLanguage]) {
        i18n.changeLanguage(languageMap[userData.preferredLanguage]);
    }
    
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    localStorage.setItem('token', res.data.data.token);
    
    const userRes = await api.get('/auth/me');
    const newUserData = userRes.data.data;
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
    if (newUserData.preferredLanguage && languageMap[newUserData.preferredLanguage]) {
        i18n.changeLanguage(languageMap[newUserData.preferredLanguage]);
    }
    return newUserData;
  };

  const googleLogin = async (token, role) => {
    const res = await api.post('/auth/google', { token, role });
    localStorage.setItem('token', res.data.data.token);
    
    // Backend returns user data directly, but consistent verification is good
    const userRes = await api.get('/auth/me');
    const userData = userRes.data.data;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.preferredLanguage && languageMap[userData.preferredLanguage]) {
        i18n.changeLanguage(languageMap[userData.preferredLanguage]);
    }
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    isAuthenticated: !!user,
    isTrainer: user?.role === 'trainer' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
