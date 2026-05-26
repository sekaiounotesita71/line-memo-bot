import OpenAI from "openai";
import { config } from "./config.js";

const client = new OpenAI({
  apiKey: config.openaiApiKey
});

const instructions = `
あなたは水産卸の営業メモを整理するアシスタントです。
対象商品は最初はウニだけです。

ルール:
- LINEグループに投稿された短い現場メモを、営業担当がすぐ使える形に整理する。
- 出力は必ず以下の5項目だけにする。
- 各項目は短く、実務的に書く。
- メモにない情報は「不明」と書く。
- 推測で断定しすぎない。「可能性」「要確認」などを使う。
- ウニ以外の商品が主題の場合も、現時点ではウニ対応のみであることを短く示す。
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
    instructions,
    input: text,
    max_output_tokens: 300
  });

  const summary = response.output_text?.trim();

  if (!summary) {
    throw new Error("OpenAI response did not include output_text.");
  }

  return summary;
}
