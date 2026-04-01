const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Mock Database (Replace with actual database interaction) ---
// In a real application, you would fetch users from a database.
// For demonstration, we'll use a mock array with pre-hashed passwords.
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Use environment variable in production

// Generate a dummy hashed password for testing
const generateHashedPassword = (password) => bcrypt.hashSync(password, 10);

const mockUsers = [
  {
    id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    mobileNumber: '1234567890',
    password: generateHashedPassword('Password123!'), // Hashed password
    roleId: 4, // Student
    isActive: true,
  },
  {
    id: 2,
    username: 'admin_user',
    email: 'admin@example.com',
    mobileNumber: '0987654321',
    password: generateHashedPassword('AdminPass!'), // Hashed password
    roleId: 1, // Admin
    isActive: true,
  },
  // Add more mock users as needed
];
// --- End Mock Database ---

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  // 1. Input Validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Identifier (username, email, or mobile number) and password are required.',
    });
  }

  try {
    // 2. User Lookup
    // In a real app, this would be a database query.
    const user = mockUsers.find(
      (u) =>
        u.username === username ||
        u.email === username ||
        u.mobileNumber === username
    );

    // 3. Authentication Logic
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        token: null,
        user: null,
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, roleId: user.roleId },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // 5. Success Response
    const { password: _, ...userWithoutPassword } = user; // Exclude password from response
    res.status(200).json({ success: true, message: 'Login successful', token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};