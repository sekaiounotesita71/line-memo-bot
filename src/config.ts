import dotenv from "dotenv";

dotenv.config();

const requiredEnv = [
  "LINE_CHANNEL_SECRET",
  "LINE_CHANNEL_ACCESS_TOKEN",
  "OPENAI_API_KEY"
] as const;

type RequiredEnvKey = (typeof requiredEnv)[number];

function requireEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const config = {
  lineChannelSecret: requireEnv("LINE_CHANNEL_SECRET"),
  lineChannelAccessToken: requireEnv("LINE_CHANNEL_ACCESS_TOKEN"),
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5.5",
  port: Number(process.env.PORT ?? 3000)
};
