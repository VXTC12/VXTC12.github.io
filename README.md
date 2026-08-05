# 我们的小世界

一个使用 React、Vite 和 JavaScript 制作的私人情侣纪念网站。

## 第一次或以后启动

最简单的方法：打开 `D:\My_webstie` 文件夹，双击 `start-website.bat`。稍等片刻后浏览器会自动打开网站。黑色窗口需要保持开启；不用网站时，在黑色窗口中按 `Ctrl + C`，再关闭窗口。

也可以在项目文件夹的终端中运行：

```text
npm run dev
```

浏览器通常打开 `http://127.0.0.1:5173/`。

## Supabase 登录、云端数据和照片

本地连接参数放在 `.env.local`。此文件只填写 `Project URL` 和 `sb_publishable_` 开头的公开密钥，绝对不要填写 Secret key、service_role 或数据库密码。

Supabase 项目第一次使用时：

1. 在 Supabase 后台打开 `SQL Editor`，新建查询。
2. 复制 `supabase\setup.sql` 的全部内容，粘贴后点击 `Run`。
3. 打开 `Authentication → Users → Add user`，添加两人的邮箱账号。
4. 打开 `Authentication → Sign In / Providers`，关闭 `Allow new users to sign up`，防止陌生人自行注册。

完成后，登录用户的记录会保存到 Supabase 的受保护数据表；首页上传的合照会存入私有照片空间。浏览器本地仍会保留一份副本，导入和导出 JSON 备份也继续可用。

## 修改姓名、日期和文案

打开 `src\data\siteConfig.js`。情侣姓名、头像、恋爱日期、首页文案和示例内容都集中在这里。日期保持 `年-月-日` 格式，例如 `2024-12-24`。

## 替换头像和示例照片

图片都在 `public\images`：

- `avatar-one.png`：第一位的头像
- `avatar-two.png`：第二位的头像
- `cover.png`：未上传私人合照前显示的首页占位图
- 其他图片：时光轴、日常和相册示例照片

登录后可直接在首页点击“更换我们的合照”，照片最大 8MB。

## GitHub Pages 自动部署

`.github\workflows\deploy.yml` 已配置自动部署。代码推送到 `VXTC12.github.io` 仓库的 `main` 分支后，在 GitHub 仓库 `Settings → Pages` 中将 `Source` 设为 `GitHub Actions`。以后每次推送都会自动重新发布。

正式构建检查：

```text
npm run build
```
