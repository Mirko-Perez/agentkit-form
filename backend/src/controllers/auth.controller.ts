import { Request, Response } from 'express';
import { query } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

const signToken = (payload: {
  id: string;
  email: string;
  role: string;
  region: string | null;
  name: string;
}) =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);

export interface UserPayload {
  id: string;
  email: string;
  role: string;
  region: string;
  name: string;
}

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name, role = 'viewer', region, country } = req.body;

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await query(
        `INSERT INTO users (id, email, name, password_hash, role, region, country, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          email.toLowerCase(),
          name,
          passwordHash,
          role,
          region || null,
          country || null,
          true
        ]
      );

      // Generate JWT token
      const token = signToken({
        id: userId,
        email: email.toLowerCase(),
        role,
        region: region || null,
        name,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: userId,
          email: email.toLowerCase(),
          name,
          role,
          region: region || null
        },
        token
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  /**
   * Login user
   * Supports login with email or username (for admin: "admin" or "admin@gmail.com")
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Normalize email input - if it's just "admin", convert to "admin@gmail.com"
      let emailToSearch = email.toLowerCase().trim();
      if (emailToSearch === 'admin') {
        emailToSearch = 'admin@gmail.com';
      }

      // Find user by email
      const userResult = await query(
        'SELECT id, email, name, password_hash, role, region, country, is_active FROM users WHERE email = $1',
        [emailToSearch]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = userResult.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({ error: 'User account is deactivated' });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        region: user.region,
        name: user.name,
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          region: user.region,
          country: user.country
        },
        token
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      // User is attached to request by auth middleware
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get fresh user data from database
      const userResult = await query(
        'SELECT id, email, name, role, region, country, created_at, last_login FROM users WHERE id = $1',
        [user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: userResult.rows[0]
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { name, region, country } = req.body;

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Only allow updating own profile (unless admin)
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex}`);
        values.push(name);
        paramIndex++;
      }

      if (region !== undefined) {
        updates.push(`region = $${paramIndex}`);
        values.push(region);
        paramIndex++;
      }

      if (country !== undefined) {
        updates.push(`country = $${paramIndex}`);
        values.push(country);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(user.id);
      await query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`,
        values
      );

      res.json({
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getUsers(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      // Check if user is admin
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can view all users' });
      }

      const { region, role } = req.query;
      let queryStr = 'SELECT id, email, name, role, region, country, is_active, created_at, last_login FROM users WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (region) {
        queryStr += ` AND region = $${paramIndex}`;
        params.push(region);
        paramIndex++;
      }

      if (role) {
        queryStr += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      queryStr += ' ORDER BY created_at DESC';

      const result = await query(queryStr, params);

      res.json({
        users: result.rows,
        total: result.rowCount
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }
}

