# دستیار هوش مصنوعی SmartTeacherAI

سایت روی GitHub Pages فقط فایل‌های استاتیک را میزبانی می‌کند و کلید API نباید داخل
آن قرار بگیرد (هر بازدیدکننده می‌توانست آن را بردارد). بنابراین پرسش‌های هوش مصنوعی از
یک سرور کوچک عبور می‌کنند:

```
مرورگر  ──POST /api/ai──▶  server/index.mjs  ──Bearer AI_API_KEY──▶  ارائه‌دهنده
```

## ۱. آماده‌سازی سرور

به یک سرور لینوکسی با دامنه و HTTPS نیاز است (مثلاً `ai.example.com`). Node نسخه ۱۸ یا بالاتر کافی است؛
هیچ پکیجی نصب نمی‌شود.

```bash
# روی سرور
mkdir -p /srv/smartteacher && cd /srv/smartteacher
# فایل server/index.mjs را از مخزن کپی کنید (scp یا git clone)
AI_API_KEY='کلید-محرمانه' \
AI_BASE_URL='https://api.openai.com/v1' \
AI_MODEL='gpt-4o-mini' \
ALLOWED_ORIGIN='https://mmasoud1346-ux.github.io' \
PORT=8787 \
node server/index.mjs
```

| متغیر | کاربرد |
| --- | --- |
| `AI_API_KEY` | کلید سرویس؛ اگر خالی باشد سرور پاسخ ۵۰۳ می‌دهد و سایت در حالت محلی می‌ماند |
| `AI_BASE_URL` | آدرس پایهٔ سازگار با OpenAI (بدون `/chat/completions`) |
| `AI_MODEL` | نام مدل |
| `ALLOWED_ORIGIN` | دامنهٔ سایت مجاز برای CORS؛ فقط همین دامنه اجازهٔ صدا زدن دارد |
| `PORT` | پورت شنود (پیش‌فرض ۸۷۸۷) |

سرور را با `systemd` یا `pm2` پایدار نگه دارید و پیش از آن Nginx را برای HTTPS و
پروکسی `/api` به پورت ۸۷۸۷ تنظیم کنید.

نمونهٔ Nginx:

```nginx
server {
  server_name ai.example.com;
  listen 443 ssl;
  # ssl_certificate ... (Certbot)
  location /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header X-Forwarded-For $remote_addr;
    client_max_body_size 64k;
  }
}
```

## ۲. اتصال سایت

سایت باید با آدرس بک‌اند بیلد شود:

```bash
VITE_AI_ENDPOINT='https://ai.example.com/api/ai' npx vite build --base=/smart-teacher/
```

سپس همان پوشهٔ `dist` را روی شاخهٔ `gh-pages` منتشر کنید. اگر `VITE_AI_ENDPOINT`
تنظیم نشده باشد، سایت به‌طور خودکار در حالت قالب محلی کار می‌کند و هیچ درخواستی به بیرون نمی‌فرستد.

## ۳. بررسی

```bash
curl https://ai.example.com/api/health
# {"ok":true,"configured":true}

curl -X POST https://ai.example.com/api/ai \
  -H 'Content-Type: application/json' \
  -d '{"task":"lesson","topic":"فتوسنتز","audience":"پایه هفتم","duration":45}'
# {"text":"..."}
```

انواع `task` عبارت‌اند از `lesson`، `quiz`، `content`، `video`، `analysis` و `marketing`.

## محدودیت‌های پیاده‌شده

- کلید فقط در سرور است و به مرورگر نمی‌رسد.
- بدنهٔ درخواست تا ۴۰ کیلوبایت، متن موضوع تا ۴۰۰۰ نویسه و زمان ۱۰ تا ۱۸۰ دقیقه.
- حداکثر ۱۲ درخواست در دقیقه برای هر IP.
- خطای ارائه‌دهنده با کد ۵۰۲ و پیام فارسی برگردانده می‌شود.

## کارهای باقی‌مانده برای استفادهٔ عمومی

- **احراز هویت**: الان هر کسی که آدرس بک‌اند را بداند می‌تواند از سهمیهٔ شما مصرف کند؛
  پیش از انتشار عمومی، ورود کاربر و سهمیهٔ هر حساب را اضافه کنید.
- **ذخیرهٔ پیش‌نویس‌ها**: فعلاً پیش‌نویس‌ها فقط در مرورگر کاربر می‌مانند.
