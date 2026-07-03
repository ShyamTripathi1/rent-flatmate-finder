import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: process.env.PORT || '5000',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'rent-flatmate-finder-super-secret-access-token-key-2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'rent-flatmate-finder-super-secret-refresh-token-key-2026',
  llmProvider: process.env.LLM_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"Rent & Flatmate Finder" <noreply@flatmatefinder.com>'
  },
  resendApiKey: process.env.RESEND_API_KEY || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || ''
};
export default config;
