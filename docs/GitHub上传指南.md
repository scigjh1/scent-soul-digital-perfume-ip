# GitHub 上传指南

## 先注意安全

不要把 Google 密码、GitHub 密码、OpenAI API Key 写进仓库，也不要发到聊天里。

这个项目已经做了安全处理：

- `.env` 会被 `.gitignore` 忽略。
- 仓库只保留 `.env.example`。
- OpenAI Key 只应该放在本机环境变量里。

## 推荐仓库名

```text
scent-soul-digital-perfume-ip
```

## GitHub 仓库简介

```text
ScentSoul: a generative digital perfume IP demo that turns perfume bottles into personalized animated souls with LLM-generated visuals, music, stories, and product-operation loops.
```

## 网页上传方式

适合当前电脑没有 Git 的情况。

1. 打开 GitHub。
2. 登录你的 GitHub 账号。
3. 点击右上角 `+`，选择 `New repository`。
4. Repository name 填：

```text
scent-soul-digital-perfume-ip
```

5. 选择 `Public`。
6. 不要勾选 `Add a README file`，因为项目里已经有 README。
7. 创建仓库后，点击 `uploading an existing file`。
8. 把本项目文件夹里的所有文件拖进去，但不要上传：

```text
server.log
server.err.log
node_modules
.env
```

9. Commit message 写：

```text
Initial commit: ScentSoul digital perfume IP demo
```

## 命令行上传方式

如果你安装了 Git，可以在项目目录运行：

```powershell
git init
git add .
git commit -m "Initial commit: ScentSoul digital perfume IP demo"
git branch -M main
git remote add origin https://github.com/你的GitHub用户名/scent-soul-digital-perfume-ip.git
git push -u origin main
```

## 上传后 README 要展示什么

GitHub 首页会自动显示 `README.md`，里面已经包含：

- 项目定位
- 功能亮点
- 运行方式
- 大模型接入方式
- 简历定位

上传后建议再补 2-3 张截图：

- 首页动态效果
- 生成后的数字 IP
- 运营看板

截图可以放到：

```text
docs/screenshots/
```

然后在 README 里引用。
