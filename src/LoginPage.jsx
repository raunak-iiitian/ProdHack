import React, { useState } from 'react';
import { Eye, EyeOff,Lock, Mail, User } from 'lucide-react';
import './LoginPage.css';
import { Navigate, redirect } from 'react-router-dom';



export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Additional validation for signup
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Login API call
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          alert('Login successful!');
        } else {
          alert(data.error || 'Login failed');
        }
      } else {
        // Signup API call
        const response = await fetch('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        });
        const data = await response.json();
        if (response.ok) {
          alert('Account created successfully!');
        } else {
          alert(data.error || 'Signup failed');
        }
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-header-box">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <img src="/src/assets/logo.svg" alt="ProdHack Logo" className="logo-img" />
            </div>
            <h2 className="login-title">
              {isLogin ? 'ProdHack' : 'Create account'}
            </h2>
            <p className="login-subtitle">
              {isLogin 
                ? 'Please sign in to your account' 
                : 'Please fill in your information'
              }
            </p>
          </div>

          <div className="login-form-fields">
            {/* Name field for signup */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="login-label">
                  Full Name
                </label>
                <div className="input-wrapper">
                  <div className="input-icon-left">
                    <User className="icon-input" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`input-field ${errors.name ? 'input-error' : ''}`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <p className="input-error-text">{errors.name}</p>}
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="login-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <div className="input-icon-left">
                  <Mail className="icon-input" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input-field ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="input-error-text">{errors.email}</p>}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <div className="input-wrapper">
                <div className="input-icon-left">
                  <Lock className="icon-input" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input-field input-with-icon-right ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="icon-toggle" />
                  ) : (
                    <Eye className="icon-toggle" />
                  )}
                </button>
              </div>
              {errors.password && <p className="input-error-text">{errors.password}</p>}
            </div>

            {/* Confirm Password field for signup */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="login-label">
                  Confirm Password
                </label>
                <div className="input-wrapper">
                  <div className="input-icon-left">
                    <Lock className="icon-input" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && <p className="input-error-text">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Remember me / Forgot password */}
            {isLogin && (
              <div className="login-remember-forgot">
                <div className="remember-me">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="checkbox-input"
                  />
                  <label htmlFor="remember-me" className="checkbox-label">
                    Remember me
                  </label>
                </div>
                <div className="forgot-password">
                  <button type="button" className="forgot-password-btn">
                    Forgot password?
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="submit-button-wrapper">
            <button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit}
              className="submit-button"
            >
              {isLoading ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  Processing...
                </div>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </div>

          {/* Toggle between login/signup */}
          <div className="toggle-login-signup">
            <span className="toggle-text">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={toggleMode}
              className="toggle-button"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}