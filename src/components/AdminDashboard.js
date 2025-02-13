import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs,setDoc, doc, updateDoc, deleteDoc, query, where, addDoc, onSnapshot } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import logo from './logo.png';

function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', position: '', salary: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '' });
  const navigate = useNavigate();

  // Fetch all employees
  useEffect(() => {
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      setEmployees(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchEmployees();
  }, []);

  // Fetch tasks
  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  // Fetch leave requests
  useEffect(() => {
    const q = query(collection(db, 'leaveRequests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeaveRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  // Add new employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await setDoc(doc(db, 'employees', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        position: formData.position,
        salary: formData.salary,
        role: 'employee',
        createdAt: new Date(),
      });
      setShowAddModal(false);
      window.location.reload();
    } catch (error) {
      alert(error.message);
    }
  };

  // Update employee
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'employees', selectedEmployee.id), {
        position: formData.position,
        salary: formData.salary,
      });
      setShowEditModal(false);
      window.location.reload();
    } catch (error) {
      alert(error.message);
    }
  };

  // Delete employee
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  // Handle leave request approval
  const handleLeaveDecision = async (id, decision) => {
    await updateDoc(doc(db, 'leaveRequests', id), { status: decision });
  };

  // Handle task creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'tasks'), {
      ...newTask,
      status: 'assigned',
      createdAt: new Date(),
    });
    setShowTaskModal(false);
    setNewTask({ title: '', description: '', assignedTo: '' });
  };

  // Handle task deletion
  const handleDeleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
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
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <div className="center-section">Admin Dashboard</div>
        <div className="right-section">
          <button onClick={() => setShowAddModal(true)} className="nav-button">
            Add Employee
          </button>
          <button onClick={handleLogout} className="nav-button">
            Logout
          </button>
        </div>
      </div>

      {/* Employee Table */}
      <div className="dashboard-content">
        <h1>Employee List</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Position</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{employee.email}</td>
                <td>{employee.position}</td>
                <td>${employee.salary}</td>
                <td>
                  <button onClick={() => {
                    setSelectedEmployee(employee);
                    setFormData({ position: employee.position, salary: employee.salary });
                    setShowEditModal(true);
                  }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(employee.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tasks Section */}
      <div className="section">
        <h2>Tasks</h2>
        <button onClick={() => setShowTaskModal(true)}>Create New Task</button>
        <div className="task-list">
          {tasks.map(task => (
            <div key={task.id} className="task-card">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <p>Assigned To: {task.assignedTo}</p>
              <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Requests Section */}
      <div className="section">
        <h2>Pending Leave Requests</h2>
        <div className="leave-list">
          {leaveRequests.map(request => (
            <div key={request.id} className="leave-card">
              <p>Employee: {request.employeeName}</p>
              <p>Dates: {request.startDate} to {request.endDate}</p>
              <p>Reason: {request.reason}</p>
              <div>
                <button onClick={() => handleLeaveDecision(request.id, 'approved')}>Approve</button>
                <button onClick={() => handleLeaveDecision(request.id, 'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Employee</h2>
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Position:</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                >
                  <option value="">Select Position</option>
                  <option value="Manager">Manager</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Salary:</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
              </div>
              <button type="submit">Add Employee</button>
              <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Assign To:</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit">Create Task</button>
              <button type="button" onClick={() => setShowTaskModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Employee</h2>
            <form onSubmit={handleUpdateEmployee}>
              <div className="form-group">
                <label>Position:</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                >
                  <option value="Manager">Manager</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Salary:</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
              </div>
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
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
          text-decoration: none;
        }
        .nav-button:hover {
          background-color: rgba(255,255,255,0.1);
        }
        .dashboard-content {
          flex: 1;
          padding: 20px;
          background-color: #f0f0f0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #007bff;
          color: white;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .section {
          margin-top: 20px;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .task-list, .leave-list {
          display: grid;
          gap: 15px;
        }
        .task-card, .leave-card {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal-content {
          background-color: white;
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
          border: 1px solid #ccc;
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
        button[type="submit"]:hover {
          background-color: #0056b3;
        }
        button[type="button"] {
          background-color: #ccc;
          margin-left: 10px;
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;