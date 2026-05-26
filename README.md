# LINE 水産営業メモ Bot

LINE グループに投稿されたウニの相場・品質メモを、OpenAI Responses API で短く整理して返信する Bot です。

## 構成

- TypeScript
- Node.js
- Express
- LINE Messaging API SDK
- OpenAI 公式 SDK
- DB 保存なし
- Render / Vercel デプロイ対応

## 返信形式

```text
商品:
状態:
相場:
注意点:
営業コメント:
```

不明な情報は `不明` として返します。最初はウニだけに対応し、営業現場で使いやすい短い表現に整理します。

## 必要な環境変数

```env
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

任意:

```env
OPENAI_MODEL=gpt-5.5
PORT=3000
```

## ローカル起動

```bash
npm install
cp .env.example .env
npm run dev
```

PowerShell の場合:

```powershell
Copy-Item .env.example .env
npm run dev
```

ローカルで LINE webhook を試す場合は、ngrok などで公開 URL を作ります。

```bash
ngrok http 3000
```

LINE Developers の Webhook URL には次の形式で登録します。

```text
https://xxxx.ngrok-free.app/webhook
```

## LINE Developers 側の設定手順

1. [LINE Developers Console](https://developers.line.biz/console/) にログインします。
2. Provider を作成、または既存 Provider を選択します。
3. Messaging API チャネルを作成します。
4. チャネルの `Basic settings` で `Channel secret` を確認し、`LINE_CHANNEL_SECRET` に設定します。
5. チャネルの `Messaging API` タブで `Channel access token` を発行し、`LINE_CHANNEL_ACCESS_TOKEN` に設定します。
6. `Webhook settings` で Webhook URL を登録します。
   - Render: `https://your-service.onrender.com/webhook`
   - Vercel: `https://your-project.vercel.app/webhook`
7. `Use webhook` を有効にします。
8. `Auto-reply messages` は必要に応じて無効にします。
9. Bot を対象の LINE グループに招待します。
10. グループでウニの相場・品質メモを送信し、Bot の返信を確認します。

## Render へのデプロイ

1. GitHub にこのリポジトリを push します。
2. Render で `New Web Service` を作成します。
3. Build Command:

```bash
npm install && npm run build
```

4. Start Command:

```bash
npm start
```

5. Environment に以下を登録します。
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `OPENAI_API_KEY`
   - 必要なら `OPENAI_MODEL`
6. 発行された URL の `/webhook` を LINE Developers に登録します。

## Vercel へのデプロイ

1. GitHub にこのリポジトリを push します。
2. Vercel で Project を import します。
3. Environment Variables に以下を登録します。
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `OPENAI_API_KEY`
   - 必要なら `OPENAI_MODEL`
4. Deploy 後、`https://your-project.vercel.app/webhook` を LINE Developers に登録します。

## 動作例

入力:

```text
利尻バフン 250g 今日は色よし。やや小粒。札幌で箱8500くらい。週末分は強気注意
```

## 蓄積機能

このBotはSupabaseにLINEメモを保存できます。

通常のメモを送ると、AIが整理して返信し、同じ内容を `line_memories` テーブルに保存します。

```text
利尻バフン 250g 色よし 小粒 札幌8500くらい 週末強気注意
```

質問っぽい文を送ると、保存済みメモをもとに回答します。

```text
神経締めの特徴まとめて
今週のウニ相場どう？
過去の注意点を一覧で
```

### Excel相場表の保存

LINEに `.xlsx` の相場表を送ると、固定フォーマットとして読み取り、`price_rows` テーブルに保存します。

対応シート:

```text
Master Special
Master Special 野菜
Master Cheap list
```

保存する主な項目:

```text
ファイル名
シート名
区分
商品名
産地
サイズ
kg
日本価格 下
日本価格 上
マレーシア価格
タイ価格
シンガポール価格
カンボジア価格
```

Excel保存後は、LINEで次のように質問できます。

```text
今日の相場表まとめて
クエの相場どう？
タイ向けで高い商品は？
シンガポール向けの商品一覧
```

### Supabaseの準備

1. [Supabase](https://supabase.com/) でプロジェクトを作成します。
2. `SQL Editor` を開きます。
3. このリポジトリの `supabase.sql` の中身を貼り付けて実行します。
4. `Project Settings` → `API` で以下を確認します。
   - `Project URL`
   - `service_role key`
5. RenderのEnvironment Variablesに以下を追加します。

```text
SUPABASE_URL=Project URL
SUPABASE_SERVICE_ROLE_KEY=service_role key
```

`service_role key` は秘密情報です。GitHubやLINEには貼らないでください。

返信:

```text
商品: 利尻バフンウニ 250g
状態: 色よし。やや小粒
相場: 札幌で箱8500円程度
注意点: 週末分は強気相場の可能性。要確認
営業コメント: 品質は使いやすいが、小粒を事前共有して提案
```

## API

- `GET /` 起動確認
- `GET /health` ヘルスチェック
- `POST /webhook` LINE webhook

## 注意

- DB 保存はしていません。
- テキストメッセージ以外は無視します。
- LINE の署名検証は LINE Messaging API SDK の middleware で行います。
- OpenAI Responses API は公式 SDK の `client.responses.create()` を使っています。
