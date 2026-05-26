import express from "express";
import {
  middleware,
  messagingApi,
  type WebhookEvent
} from "@line/bot-sdk";
import { config } from "./config.js";
import { summarizeSeaUrchinMemo } from "./openai.js";

const lineConfig = {
  channelSecret: config.lineChannelSecret,
  channelAccessToken: config.lineChannelAccessToken
};

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: config.lineChannelAccessToken
});

export const app = express();

app.get("/", (_req, res) => {
  res.status(200).send("LINE seafood sales memo bot is running.");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/webhook", middleware(lineConfig), async (req, res) => {
  const events = req.body.events as WebhookEvent[];

  await Promise.all(events.map(handleEvent));

  res.status(200).end();
});

async function handleEvent(event: WebhookEvent): Promise<void> {
  if (event.type !== "message") {
    return;
  }

  if (event.message.type !== "text") {
    return;
  }

  const replyText = await buildReply(event.message.text);

  await lineClient.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: replyText
      }
    ]
  });
}

async function buildReply(text: string): Promise<string> {
  try {
    return await summarizeSeaUrchinMemo(text);
  } catch (error) {
    console.error("Failed to summarize memo:", error);
    return [
      "商品: 不明",
      "状態: 不明",
      "相場: 不明",
      "注意点: AI整理に失敗。原文を確認してください。",
      "営業コメント: もう一度短めに送ってください。"
    ].join("\n");
  }
}
