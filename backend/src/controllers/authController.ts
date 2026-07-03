import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const ROLE_TENANT = 'TENANT';
const ROLE_OWNER  = 'OWNER';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const prisma = new PrismaClient();

function generateAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, config.jwtSecret, { expiresIn: '1d' });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, role, name } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ error: 'Email, password, role, and name are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const parsedRole = role.toUpperCase();

    if (parsedRole !== ROLE_TENANT && parsedRole !== ROLE_OWNER) {
      return res.status(400).json({ error: 'Invalid role. Must be TENANT or OWNER.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and initialize tenant profile if applicable in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: parsedRole,
          name: name.trim(),
        },
      });

      if (parsedRole === ROLE_TENANT) {
        await tx.tenantProfile.create({
          data: {
            userId: newUser.id,
            preferredLocation: '',
            budgetMin: 0,
            budgetMax: 5000,
            moveInDate: new Date(),
            lifestyleNotes: '',
          },
        });
      }

      return newUser;
    });

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ error: 'Internal server error during token refresh.' });
  }
}

export async function listUsersForQuickLogin(_req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: { name: true, email: true, role: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
}
