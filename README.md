# RE: SIMULATED

## 環境構築

### 0: 依存ツールのインストール

- [node.js 6.13.1](https://nodejs.org/ja/) 以上
- ruby

### 1: セットアップ

```sh
# gitからリポジトリをcloneします。
git clone git@github.com:gam0022/resimulated.git

cd resimulated

# プロジェクトのセットアップをします。
npm install

# 開発をするときのコマンド（ホットリドード・デバッグ用UIありでWebサーバを起動）
npm run start

# ビルドをするときのコマンド（dist\resimulated.htmlを生成）
npm run build
```

## Chromatiq

PC 64K Introのために開発したファイルサイズの最小化を目的にした自作のWebGLエンジンです。