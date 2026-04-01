import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from './authService';
import '../../styles/Auth.css'; // Using Auth.css for consistent styling
import '../../styles/loginfromstyle.css'; // Assuming this is also used for layout
import "@fortawesome/fontawesome-free/css/all.min.css";

function Login() {
  const [emailOrUserId, setEmailOrUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = await authService.login({
        username: emailOrUserId, // Use emailOrUserId as the username for the API call
        password,
      });
      localStorage.setItem('jwt_token', user.token);
      localStorage.setItem('user_info', JSON.stringify(user.user));
       // localStorage.setItem('user', JSON.stringify(response.data));
      console.log('Login successful');
      // Assuming login success, navigate to dashboard
      navigate('/');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // This handleChange function will now update the individual state variables
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'emailOrUserId') {
      setEmailOrUserId(value);
    } else if (name === 'password') {
      setPassword(value);
    }
  };
  return (

      <div id="container-parent">
      <div className="container" id="container">
        <div className="form-container sign-in active"> {/* Added 'active' class */}
          <form onSubmit={handleSubmit}>
            <h1 style={{textAlign:'center'}} >Vinayak Digital Library</h1>          
            <input
              type="text"
              name="emailOrUserId"
              placeholder="Email or Mobile or User ID"
              value={emailOrUserId}
              onChange={handleChange}
              required
            />
            <div style={{ position: 'relative', width: '100%', margin: '8px 0' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={password}
                onChange={handleChange}
                style={{ margin: 0, width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
              />
              <i 
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#777' }}
              ></i>
            </div>
            <a href="/auth/forgot-password" className="forgot-btn">Forget Your Password?</a>
            <button type="submit" disabled={loading}>
              {loading ? 'Login...' : 'Login'}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        </div>
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome Back!</h1>
              <p>Enter your personal details to use all of site features</p>
              <button className="hidden" id="login" onClick={() => navigate('/auth/login')}>Login</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Hello, Friend!</h1>
              <p>Register with your personal details to use all of site features</p>
              <button className="hidden" id="register" onClick={() => navigate('/auth/register')}>Register</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
export default Login;
