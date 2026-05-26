import express from "express";
import { middleware, messagingApi } from "@line/bot-sdk";
import { Readable } from "node:stream";
import { config } from "./config.js";
import { parsePriceWorkbook } from "./excel.js";
import { answerFromMemories, summarizeSeaUrchinMemo } from "./openai.js";
import {
  isMemoryEnabled,
  listRecentMemories,
  listRecentPriceRows,
  saveMemory,
  savePriceRows
} from "./memory.js";

type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  message?: {
    type: string;
    id?: string;
    fileName?: string;
    fileSize?: number;
    text?: string;
  };
  source?: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
};

const lineConfig = {
  channelSecret: config.lineChannelSecret,
  channelAccessToken: config.lineChannelAccessToken
};

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: config.lineChannelAccessToken
});

const lineBlobClient = new messagingApi.MessagingApiBlobClient({
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
  const events = req.body.events as LineWebhookEvent[];

  await Promise.all(events.map(handleEvent));

  res.status(200).end();
});

async function handleEvent(event: LineWebhookEvent): Promise<void> {
  if (event.type !== "message" || !event.replyToken) {
    return;
  }

  const replyText = await buildReply(event);

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

async function buildReply(event: LineWebhookEvent): Promise<string> {
  try {
    if (!isMemoryEnabled()) {
      return [
        "商品: 不明",
        "状態: DB設定が未完了",
        "相場: 不明",
        "注意点: Supabaseの環境変数をRenderに追加してください。",
        "営業コメント: 蓄積型にするにはSUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYが必要です。"
      ].join("\n");
    }

    if (event.message?.type === "file" && event.message.id) {
      return await handleFileMessage(event);
    }

    if (event.message?.type !== "text" || !event.message.text) {
      return "テキストメモかExcel相場表を送ってください。";
    }

    const text = event.message.text;

    if (isQuestion(text)) {
      const question = stripCommand(text);
      const memories = await listRecentMemories();
      const priceRows = await listRecentPriceRows();
      return await answerFromMemories(question, memories, priceRows);
    }

    const memoText = stripCommand(text);
    const summary = await summarizeSeaUrchinMemo(memoText);

    await saveMemory({
      sourceType: event.source?.type ?? "unknown",
      sourceId: getSourceId(event),
      userId: event.source?.userId,
      rawText: memoText,
      summary
    });

    return `${summary}\n\n保存: OK`;
  } catch (error) {
    console.error("Failed to process message:", error);
    return [
      "商品: 不明",
      "状態: 不明",
      "相場: 不明",
      "注意点: AI整理または保存に失敗。Renderログを確認してください。",
      "営業コメント: もう一度送るか、ファイル形式を確認してください。"
    ].join("\n");
  }
}

async function handleFileMessage(event: LineWebhookEvent): Promise<string> {
  const fileName = event.message?.fileName ?? "unknown.xlsx";

  if (!fileName.toLowerCase().endsWith(".xlsx")) {
    return "Excel相場表は .xlsx ファイルで送ってください。";
  }

  const content = await lineBlobClient.getMessageContent(event.message?.id ?? "");
  const buffer = await streamToBuffer(content);
  const rows = parsePriceWorkbook(buffer, {
    sourceId: getSourceId(event),
    fileName
  });

  await savePriceRows(rows);

  return [
    "相場表保存: OK",
    `ファイル: ${fileName}`,
    `保存件数: ${rows.length}件`,
    "質問例: 今日の相場表まとめて / クエの相場どう？ / タイ向けで高い商品は？"
  ].join("\n");
}

function getSourceId(event: LineWebhookEvent): string | undefined {
  return event.source?.groupId ?? event.source?.roomId ?? event.source?.userId;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function isQuestion(text: string): boolean {
  const normalized = text.trim();
  return normalized.startsWith("質問:") || normalized.startsWith("質問：");
}

function stripCommand(text: string): string {
  return text.replace(/^(メモ|質問|相場表)[:：]\s*/, "").trim();
}
