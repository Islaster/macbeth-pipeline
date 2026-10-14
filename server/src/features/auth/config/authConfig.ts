export const authConfig = {
  appUrl: process.env.APP_URL ?? "http://localhost:5173", // where invite links point
  sessionCookieName: "pipeline_session",
  sessionDays: 7,
  inviteHours: 72, // 3 days
  minPasswordLength: 12,
  isProduction: process.env.NODE_ENV === "production",
};
