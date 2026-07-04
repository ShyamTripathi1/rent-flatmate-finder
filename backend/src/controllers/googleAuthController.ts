import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config';

function generateAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, config.jwtSecret, { expiresIn: '1d' });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Google access token is required.' });
    }

    // Verify the token by calling Google's userinfo endpoint
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid Google access token.' });
    }

    const payload = await googleRes.json() as {
      sub: string;
      email: string;
      name?: string;
      email_verified?: boolean;
    };

    if (!payload.email) {
      return res.status(401).json({ error: 'Could not retrieve email from Google account.' });
    }

    const normalizedEmail = payload.email.toLowerCase().trim();

    // Find or create TENANT user
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Auto-register as TENANT
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash: `google_oauth_${payload.sub}`,
            role: 'TENANT',
            name: payload.name || normalizedEmail.split('@')[0],
          },
        });

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

        return newUser;
      });
    }

    const appAccessToken = generateAccessToken(user.id, user.email, user.role);
    const appRefreshToken = generateRefreshToken(user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      accessToken: appAccessToken,
      refreshToken: appRefreshToken,
    });
  } catch (err: any) {
    console.error('Google login error:', err);
    return res.status(500).json({ error: 'Google authentication failed.' });
  }
}
