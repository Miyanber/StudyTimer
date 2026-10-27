# Study Timer

勉強と休憩を効率的に管理できるWebタイマー・ストップウォッチアプリケーションです。  
Web Workerを活用したバックグラウンドでの正確な計時、Screen Wake Lock APIによるスリープ防止、IndexedDBを利用したカスタムアラーム音保存機能を搭載したPWA（Progressive Web App）です。

---

## 主な機能

- **勉強・休憩タイマー**: 設定した勉強時間と休憩時間を交互にカウントダウン
- **Web Worker による高精度計時**: バックグラウンドタブや最小化時でもタイマーが遅延しにくい設計
- **画面スリープ防止（Wake Lock API）**: 計時中に端末の画面が消灯するのを防止（対応ブラウザのみ）
- **タイマー状態の自動保存・復元**: ブラウザの再読み込みや誤操作時に前回の状態から再開可能
- **カスタムアラーム音（IndexedDB）**: お好みの音声ファイル（mp3, wav, m4a等）を端末ローカルに保存してアラームに設定可能
- **ストップウォッチ**: 独立して利用可能な時間計測機能
- **PWA対応**: ホーム画面に追加してアプリ感覚で利用可能

---

## ローカルでの実行方法

本プロジェクトはビルド手順を必要としないピュアなHTML/CSS/JavaScriptで構成されています。Web WorkerおよびPWA機能が動作するため、ローカルHTTPサーバー経由で起動してください。

### 方法1: Python を使用する場合
```bash
# リポジトリ直下で実行
python -m http.server 5501
```
ブラウザで `http://localhost:5501` にアクセスします。

### 方法2: VS Code Live Server を使用する場合
VS Codeの拡張機能「Live Server」をインストールし、右下の「Go Live」をクリックします（設定済みのポート `5501` で起動します）。

---

## ディレクトリ構成

```text
StudyTimer/
├── index.html            # メイン画面HTML
├── index.css             # スタイル定義
├── script.js             # メインアプリケーションロジック（タイマー・IndexedDB連携・WakeLock）
├── worker.js             # バックグラウンド計時用 Web Worker
├── stopWatch.js          # ストップウォッチ機能
├── manifest.json         # PWA マニフェスト
├── contents/
│   ├── serviceWorker.js  # Service Worker 登録スクリプト
│   ├── service-worker.js # Workbox ベースのオフラインキャッシュ制御
│   └── precache-manifest.*.js
├── images/icons/         # アプリアイコン（各解像度）
├── .github/workflows/    # CI/CD設定（Azure Static Web Apps）
├── .gitignore            # Git除外設定
├── LICENSE               # MIT ライセンス
└── README.md             # 本ドキュメント
```

---

## ブラウザ対応・注意事項

- **Screen Wake Lock API**: Chrome, Edge, Safari (iOS 16.4+) などのモダンブラウザで動作します。非対応ブラウザ（Firefox等）でもタイマー機能自体は問題なくご利用いただけます。
- **音声ファイル**: 著作権で保護された商用楽曲をパブリックリポジトリや公開サーバーに直接アップロードせず、アプリ内の「アラーム音の設定」から各自の端末内ファイルを選択してご利用ください。

---

## ライセンス

本プロジェクトは [MIT License](LICENSE) の下で公開されています。
