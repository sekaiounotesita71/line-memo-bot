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
