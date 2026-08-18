This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## セキュリティ研究デモについて（ログイン画面）

学校のセキュリティ研究（マルウェア対策の学習）を目的として、ログイン画面（[LoginForm.tsx](src/app/login/LoginForm.tsx)）に教育用のデモ表示を追加しています。

- **内容**: 過去に実在した iOS マルウェア「KeyRaider」（脱獄済み端末上で認証情報の入力を横取りし、外部サーバーへ送信していたスパイウェア）の手口を紹介する警告メッセージを、特定の条件下でモーダル表示します。
- **発動条件**: ログイン画面で **旧パスコード「0315」** を入力して送信したときのみ表示されます。現行のパスコードでログインする通常の操作には一切影響しません。
- **安全性**: この機能は完全にクライアント側（ブラウザ内）で完結しており、サーバーへの通信や外部への送信は一切行われません。実際にデータを収集・窃取する機能は含まれていません（[SPEC.md](SPEC.md) 参照）。
- **パスコードの変更**: このデモを安全に組み込むため、実際のログイン用パスコードは **`0607`** に変更しました（[src/lib/auth.ts](src/lib/auth.ts) / `.env` の `APP_PASSCODE`）。旧パスコード `0315` はログインには使用できず、デモの発火専用の値になっています。
- **本番環境（Vercel等）への反映**: デフォルト値はコード側で `0607` に変更済みですが、デプロイ先で環境変数 `APP_PASSCODE` を明示的に設定している場合は、そちらも `0607` に更新する必要があります。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
