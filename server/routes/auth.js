import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import User from '../models/User.js';
import { verifyToken, requireRole } from '../middleware/auth.js';


const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15, // Max 15 attempts per IP per 15 mins
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// Register (admin and hr — hr can only create non-admin roles like support)
router.post('/register', authLimiter, verifyToken, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { username, password, role, assignedPartners, assignedBranches, users } = req.body;

    // Security guard: HR users cannot create 'admin' accounts
    const targetRole = role || 'support';
    if (req.user.role === 'hr' && targetRole === 'admin') {
      return res.status(403).json({ error: 'HR department cannot create Administrator accounts.' });
    }

    const cleanPartners = Array.isArray(assignedPartners) ? assignedPartners.filter(Boolean) : [];
    const cleanBranches = Array.isArray(assignedBranches) ? assignedBranches.filter(Boolean) : [];

    // Support batch multiple user registration
    if (Array.isArray(users) && users.length > 0) {
      if (users.length > 50) {
        return res.status(400).json({ error: 'Cannot register more than 50 users at once' });
      }

      // Validate each user entry
      const usernames = [];
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        if (!u.username || typeof u.username !== 'string' || u.username.trim().length < 3) {
          return res.status(400).json({ error: `User #${i + 1}: Username must be at least 3 characters` });
        }
        if (!u.password || typeof u.password !== 'string' || u.password.length < 8) {
          return res.status(400).json({ error: `User #${i + 1} (${u.username}): Password must be at least 8 characters` });
        }
        const trimmed = u.username.trim();
        if (usernames.includes(trimmed)) {
          return res.status(400).json({ error: `Duplicate username in request: "${trimmed}"` });
        }
        usernames.push(trimmed);
      }

      // Check existing usernames in database
      const existingUsers = await User.find({ username: { $in: usernames } }).select('username').lean();
      if (existingUsers.length > 0) {
        return res.status(400).json({ 
          error: `Username(s) already exist: ${existingUsers.map(u => u.username).join(', ')}` 
        });
      }

      const salt = await bcrypt.genSalt(10);
      const createdDocs = [];
      for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, salt);
        createdDocs.push({
          username: u.username.trim(),
          password: hashedPassword,
          role: targetRole,
          assignedPartners: cleanPartners,
          assignedBranches: cleanBranches
        });
      }

      const inserted = await User.insertMany(createdDocs);
      console.info(`[SECURITY AUDIT] ${inserted.length} user(s) registered (role: ${targetRole}) by ${req.user.role} "${req.user?.username}"`);
      return res.status(201).json({ 
        message: `${inserted.length}名のアカウントを正常に一括登録しました！`, 
        count: inserted.length,
        users: inserted.map(u => ({ id: u._id, username: u.username, role: u.role }))
      });
    }

    // Single user registration
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ 
      username: username.trim(), 
      password: hashedPassword,
      role: targetRole,
      assignedPartners: cleanPartners,
      assignedBranches: cleanBranches
    });
    await newUser.save();

    console.info(`[SECURITY AUDIT] New user registered: "${username}" (role: ${newUser.role}) by ${req.user.role} "${req.user?.username}"`);
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.warn(`[SECURITY ALERT] Failed login attempt: unknown username "${username}" from IP: ${req.ip}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[SECURITY ALERT] Failed login attempt: incorrect password for user "${username}" from IP: ${req.ip}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        username: user.username, 
        tokenVersion: user.tokenVersion,
        assignedPartners: user.assignedPartners || [],
        assignedBranches: user.assignedBranches || []
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.info(`[SECURITY AUDIT] Successful login: user "${user.username}" (role: ${user.role}) from IP: ${req.ip}`);
    res.json({ 
      token, 
      user: { 
        id: user._id,
        username: user.username, 
        role: user.role,
        assignedPartners: user.assignedPartners || [],
        assignedBranches: user.assignedBranches || []
      } 
    });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Current User (Token Validation)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Password
router.put('/update-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all users (admin gets all, HR gets support users only)
router.get('/users', verifyToken, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const query = req.user.role === 'hr' ? { role: 'support' } : {};
    const users = await User.find(query, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update user details
// Rules:
//   - Admin  → can edit any user (username, role, password, assignedPartners, assignedBranches)
//   - HR     → can edit support users (username, password, assignedPartners, assignedBranches)
//   - Self   → can edit own username/password only (role change blocked)
//   - Other  → 403
router.put('/users/:id', verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isHR    = req.user.role === 'hr';
    const isSelf  = req.user.id === req.params.id;

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const canHREdit = isHR && targetUser.role === 'support';

    // Non-admins and non-HR (or HR touching non-support) can only touch their own account
    if (!isAdmin && !isSelf && !canHREdit) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }

    const { username, role, password, assignedPartners, assignedBranches } = req.body;

    // Prevent role escalation by non-admins
    if (role && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: only admins can change roles' });
    }

    // Username uniqueness check (exclude the target user)
    if (username) {
      const existingUser = await User.findOne({ username: username.trim(), _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    const canManagePartners = isAdmin || canHREdit;

    // Build the update payload — only include fields that were actually sent
    const updateFields = {
      ...(username && { username: username.trim() }),
      ...(role && isAdmin && { role }),   // role only settable by admin
      ...(assignedPartners !== undefined && canManagePartners && { 
        assignedPartners: Array.isArray(assignedPartners) ? assignedPartners.filter(Boolean) : [] 
      }),
      ...(assignedBranches !== undefined && canManagePartners && { 
        assignedBranches: Array.isArray(assignedBranches) ? assignedBranches.filter(Boolean) : [] 
      }),
    };

    let incFields = {};
    if (password) {
      if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
      incFields.tokenVersion = 1;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const updateOp = { $set: updateFields };
    if (Object.keys(incFields).length > 0) updateOp.$inc = incFields;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateOp,
      { new: true, select: '-password' }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete user (admin can delete any non-self, HR can only delete support users)
router.delete('/users/:id', verifyToken, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.id === targetUser._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    if (req.user.role === 'hr' && targetUser.role !== 'support') {
      return res.status(403).json({ error: 'HR department can only delete Support Department users' });
    }

    await User.findByIdAndDelete(req.params.id);
    console.info(`[SECURITY AUDIT] User deleted: "${targetUser.username}" (role: ${targetUser.role}) by ${req.user.role} "${req.user.username}"`);
    res.json({ message: 'User deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


export default router;
