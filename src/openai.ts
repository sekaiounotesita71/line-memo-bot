import OpenAI from "openai";
import { config } from "./config.js";
import type { MemoryRecord, PriceRow } from "./memory.js";

const client = new OpenAI({
  apiKey: config.openaiApiKey
});

const memoInstructions = `
あなたは水産卸の営業メモを整理するアシスタントです。
対象商品はウニを中心に、水産営業の現場メモを扱います。

ルール:
- LINEグループに投稿された短い現場メモを、営業担当がすぐ使える形に整理する。
- 出力は必ず以下の5項目だけにする。
- 各項目は短く、実務的に書く。
- メモにない情報は「不明」と書く。
- 推測で断定しすぎない。「可能性」「要確認」などを使う。
- ウニ以外の商品や魚の締め方なども、メモとして分かる範囲で整理する。
- 相場は数字、単位、産地、規格が書かれていれば残す。曖昧なら曖昧なまま整理する。

形式:
商品:
状態:
相場:
注意点:
営業コメント:
`.trim();

export async function summarizeSeaUrchinMemo(text: string): Promise<string> {
  const response = await client.responses.create({
    model: config.openaiModel,
    instructions: memoInstructions,
    input: text,
    max_output_tokens: 300
  });

  const summary = response.output_text?.trim();

  if (!summary) {
    throw new Error("OpenAI response did not include output_text.");
  }

  return summary;
}

export async function answerFromMemories(
  question: string,
  memories: MemoryRecord[],
  priceRows: PriceRow[] = []
): Promise<string> {
  const memoryText = memories
    .map((memory) => {
      return [
        `日時: ${memory.created_at}`,
        `原文: ${memory.raw_text}`,
        `整理: ${memory.summary}`
      ].join("\n");
    })
    .join("\n---\n");

  const priceText = priceRows
    .map((row) => {
      return [
        `登録日時: ${row.created_at ?? "不明"}`,
        `ファイル: ${row.file_name ?? "不明"}`,
        `シート: ${row.sheet_name}`,
        `区分: ${row.category ?? "不明"}`,
        `商品: ${row.product_name}`,
        `産地: ${row.origin ?? "不明"}`,
        `サイズ: ${row.size ?? "不明"}`,
        `kg: ${row.kg ?? "不明"}`,
        `日本価格: ${row.jp_price_low ?? "不明"}-${row.jp_price_high ?? "不明"}`,
        `MY: ${row.malaysia_low ?? "不明"}-${row.malaysia_high ?? "不明"}`,
        `TH: ${row.thailand_low ?? "不明"}-${row.thailand_high ?? "不明"}`,
        `SG: ${row.singapore_low ?? "不明"}-${row.singapore_high ?? "不明"}`,
        `KH: case=${row.cambodia_case ?? "不明"} kg=${row.cambodia_kg ?? "不明"}`
      ].join("\n");
    })
    .join("\n---\n");

  const response = await client.responses.create({
    model: config.openaiModel,
    instructions: `
あなたは水産卸の営業知識を答えるLINE Botです。
保存済みメモと保存済み相場表だけを根拠に、短く実務的に答えてください。

ルール:
- 保存済み情報にないことは「保存情報上は不明」と書く。
- 相場表にあることは「相場表上」と分かるように答える。
- 勝手に断定しすぎない。
- 現場で使える短い箇条書きにする。
- 相場、品質、締め方、輸出先別価格、得意先注意点などは分けて整理する。
`.trim(),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `質問:\n${question}\n\n保存済みメモ:\n${memoryText || "なし"}\n\n保存済み相場表:\n${priceText || "なし"}`
          }
        ]
      }
    ],
    max_output_tokens: 500
  });

  const answer = response.output_text?.trim();

  if (!answer) {
    throw new Error("OpenAI response did not include output_text.");
  }

  return answer;
}
