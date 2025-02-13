import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import logo from './logo.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (adminDoc.exists()) {
        navigate('/admin-dashboard');
        return;
      }

      // Check if employee
      const employeeDoc = await getDoc(doc(db, 'employees', user.uid));
      if (employeeDoc.exists()) {
        navigate('/employee-dashboard');
        return;
      }

      throw new Error('User not registered in system');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Navigation Bar */}
      <div className="navbar">
        <div className="left-section">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <div className="center-section">Employee Management System</div>
        <div className="right-section">
          <Link to="/register" className="nav-button">
            Register
          </Link>
        </div>
      </div>

      {/* Login Form */}
      <div className="form-container">
        <div className="form-wrapper">
          <h1>Login</h1>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background-color: #007bff;
          color: white;
        }
        .left-section, .right-section {
          flex: 1;
          display: flex;
          align-items: center;
        }
        .center-section {
          flex: 2;
          text-align: center;
          font-size: 1.5rem;
          font-weight: bold;
        }
        .right-section {
          justify-content: flex-end;
          gap: 1rem;
        }
        .logo {
          height: 40px;
          width: auto;
        }
        .nav-button {
          background: none;
          border: 2px solid white;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
        }
        .nav-button:hover {
          background-color: rgba(255,255,255,0.1);
        }
        .form-container {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
          background-color: #f0f0f0;
        }
        .form-wrapper {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          width: 300px;
          text-align: center;
        }
        .form-group {
          margin-bottom: 15px;
          text-align: left;
        }
        label {
          display: block;
          margin-bottom: 5px;
        }
        input {
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          width: 100%;
          padding: 10px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #0056b3;
        }
        .error {
          color: red;
        }
      `}</style>
    </div>
  );
}

export default Login;