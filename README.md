# チケット譲渡掲示板

18th JRCNA KYOTO 参加者向けチケット譲渡掲示板

---

## 公開手順（Vercel）

### ① GitHubにアップロード

1. [github.com](https://github.com) にアクセスしてアカウント作成（または既存アカウントでログイン）
2. 右上の「+」→「New repository」をクリック
3. Repository name に `ticket-board` と入力して「Create repository」
4. 「uploading an existing file」リンクをクリック
5. このZIPを解凍したフォルダの中身をすべてドラッグ＆ドロップ
6. 「Commit changes」ボタンをクリック

### ② Vercelで公開

1. [vercel.com](https://vercel.com) にアクセスして「Sign Up」→「Continue with GitHub」
2. 「Add New Project」→ 先ほど作った `ticket-board` を選択
3. 設定はそのままで「Deploy」ボタンをクリック
4. 数分で `https://ticket-board-xxx.vercel.app` のようなURLが発行されて完成！

---

## 合言葉の変更方法

`src/App.jsx` の1行目を編集するだけです：

```js
const PASSWORD = "ここを好きな合言葉に変える";
```

変更後は再度GitHubにアップロードすると自動で更新されます。

---

## サンプル投稿の削除方法

`src/App.jsx` の `INITIAL_POSTS` の配列を空にしてください：

```js
const INITIAL_POSTS = [];
```
