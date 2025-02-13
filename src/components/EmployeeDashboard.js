import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import logo from './logo.png';

function EmployeeDashboard() {
  const [employee, setEmployee] = useState({});
  const [tasks, setTasks] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '' });
  const [leaveData, setLeaveData] = useState({ startDate: '', endDate: '', type: 'sick', reason: '' });
  const navigate = useNavigate();

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'employees', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setEmployee(docSnap.data());
      }
    };
    fetchEmployeeData();
  }, []);

  // Fetch tasks assigned to the employee
  useEffect(() => {
    const q = query(collection(db, 'tasks'), where('assignedTo', '==', auth.currentUser?.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  // Fetch leave requests
  useEffect(() => {
    const q = query(collection(db, 'leaveRequests'), where('employeeId', '==', auth.currentUser?.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaveRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  // Handle password change
  const handlePasswordChange = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('User not authenticated. Please log in again.');
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, passwordData.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.new);
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '' });
      alert('Password updated successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  // Handle task status update
  const handleTaskUpdate = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
    } catch (error) {
      alert(error.message);
    }
  };

  // Handle leave request submission
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'leaveRequests'), {
        ...leaveData,
        employeeId: user.uid,
        employeeName: employee.name,
        status: 'pending',
        createdAt: new Date()
      });
      setShowLeaveModal(false);
      setLeaveData({ startDate: '', endDate: '', type: 'sick', reason: '' });
      alert('Leave request submitted successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="page-container">
      {/* Navigation Bar */}
      <div className="navbar">
        <div className="left-section">
          <span>Welcome, {employee.name}</span>
        </div>
        <div className="center-section">Employee Dashboard</div>
        <div className="right-section">
          <button onClick={handleLogout} className="nav-button">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Personal Details */}
        <div className="section">
          <h2>Personal Details</h2>
          <p>Name: {employee.name}</p>
          <p>Email: {employee.email}</p>
          <p>Position: {employee.position}</p>
          <p>Salary: ${employee.salary}</p>
          <button onClick={() => setShowPasswordModal(true)}>Change Password</button>
        </div>

        {/* Tasks Section */}
        <div className="section">
          <h2>Your Tasks</h2>
          <div className="task-list">
            {tasks.map(task => (
              <div key={task.id} className="task-card">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="task-status">
                  Status:
                  <select
                    value={task.status}
                    onChange={(e) => handleTaskUpdate(task.id, e.target.value)}
                  >
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Management Section */}
        <div className="section">
          <h2>Leave Management</h2>
          <button onClick={() => setShowLeaveModal(true)}>Request Leave</button>
          <div className="leave-history">
            {leaveRequests.map(leave => (
              <div key={leave.id} className="leave-card">
                <p>Type: {leave.type}</p>
                <p>Dates: {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                <p>Status: <span className={`status-${leave.status}`}>{leave.status}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Change Password</h3>
            <input
              type="password"
              placeholder="Current Password"
              value={passwordData.current}
              onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
            />
            <input
              type="password"
              placeholder="New Password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
            />
            <button onClick={handlePasswordChange}>Update Password</button>
            <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Apply for Leave</h3>
            <form onSubmit={handleLeaveSubmit}>
              <div className="form-group">
                <label>Leave Type:</label>
                <select
                  value={leaveData.type}
                  onChange={(e) => setLeaveData({ ...leaveData, type: e.target.value })}
                >
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={leaveData.startDate}
                  onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date:</label>
                <input
                  type="date"
                  value={leaveData.endDate}
                  onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Reason:</label>
                <textarea
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                  required
                />
              </div>
              <button type="submit">Submit</button>
              <button type="button" onClick={() => setShowLeaveModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

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
        }
        .nav-button:hover {
          background-color: rgba(255,255,255,0.1);
        }
        .dashboard-content {
          padding: 20px;
          display: grid;
          gap: 30px;
        }
        .section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .task-list, .leave-history {
          display: grid;
          gap: 15px;
          margin-top: 15px;
        }
        .task-card, .leave-card {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .task-status select {
          margin-left: 10px;
          padding: 5px;
        }
        .status-approved {
          color: green;
        }
        .status-pending {
          color: orange;
        }
        .status-rejected {
          color: red;
        }
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 400px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button[type="submit"] {
          background-color: #007bff;
          color: white;
        }
      `}</style>
    </div>
  );
}

export default EmployeeDashboard;