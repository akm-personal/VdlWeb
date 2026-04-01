import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authService } from './authService'; // Import authService
import '../../styles/Auth.css'; // Using Auth.css for consistent styling
import "@fortawesome/fontawesome-free/css/all.min.css";
import '../../styles/loginfromstyle.css';
const Register = () => {
  const [regType, setRegType] = useState('email'); // 'email' or 'mobile'
  const [formData, setFormData] = useState({
    name: '',
    roleId: 4,
    emailOrMobile: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    let value = e.target.value;
    // Auto-format: allow only numbers and restrict to 10 digits for mobile
    if (e.target.name === 'emailOrMobile' && regType === 'mobile') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const registerData = {
        username: formData.name,
        email: regType === 'email' ? formData.emailOrMobile : null,
        mobileNumber: regType === 'mobile' ? formData.emailOrMobile : null,
        password: formData.password,
        roleId: formData.roleId,
      };

      const response = await authService.register(registerData);

      if (response.success) {
        const userDetails = response.user;
        alert(`Registration successful!\nUser ID: ${userDetails.id}\nUsername: ${userDetails.username}\nEmail: ${userDetails.email}\nMobile: ${userDetails.mobileNumber || 'N/A'}\nRole: ${userDetails.roleName}`);
        navigate('/auth/login');
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div id="container-parent">
       <div className="container" id="container">
         <form className="form-container sign-in active" onSubmit={handleSubmit}>
            <h1 style={{textAlign:'center'}} >Vinayak Digital Library</h1>   
          <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            
            <div style={{ display: 'flex', gap: '20px', margin: '10px 0', justifyContent: 'center', width: '100%' }}>
              <label style={{ fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input type="radio" value="email" checked={regType === 'email'} onChange={(e) => setRegType(e.target.value)} style={{ margin: '0 5px 0 0', width: 'auto' }} /> Email
              </label>
              <label style={{ fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input type="radio" value="mobile" checked={regType === 'mobile'} onChange={(e) => setRegType(e.target.value)} style={{ margin: '0 5px 0 0', width: 'auto' }} /> Mobile
              </label>
            </div>

            <input
              type={regType === 'email' ? 'email' : 'tel'}
              name="emailOrMobile"
              placeholder={regType === 'email' ? 'Email Address' : 'Mobile Number (10 digits)'}
              value={formData.emailOrMobile}
              onChange={handleChange}
              required
              pattern={regType === 'mobile' ? '[0-9]{10}' : undefined}
              title={regType === 'mobile' ? 'Please enter a valid 10-digit mobile number' : undefined}
            />
            <div style={{ position: 'relative', width: '100%', margin: '8px 0' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                title="Password must be at least 6 characters long"
                style={{ margin: 0, width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
              />
              <i 
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#777' }}
              ></i>
            </div>
            <button type="submit">
              Register Now
            </button>
            {error && <p className="error">{error}</p>}
        </form>
        {/* The toggle container should be on the right, and show the "Sign In" button. */}
        {/* When the main container does NOT have right-panel-active, the toggle-container is on the right, and toggle-panel toggle-right is visible. */}
        {/* So, we put the "Sign In" content into toggle-panel toggle-right. */}
        <div className="toggle-container">
          <div className="toggle">
            {/* This panel is visible by default when the main container does NOT have right-panel-active */}
            <div className="toggle-panel toggle-right">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="hidden" id="login" onClick={() => navigate('/auth/login')}>Login</button>
            </div>
            <div className="toggle-panel toggle-left"></div> {/* This panel will be hidden by default */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;