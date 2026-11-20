import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';

export const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in.' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select('-passwordHash');
    if (!user) throw new Error('no user');
    req.user = user;
    if (user.role === 'student') req.student = await Student.findOne({ userId: user._id });
    next();
  } catch {
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

export const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only.' });

export const studentOnly = (req, res, next) =>
  req.user.role === 'student' && req.student ? next() : res.status(403).json({ message: 'Students only.' });
