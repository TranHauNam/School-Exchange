# School Exchange Backend

Backend ExpressJS + MongoDB cho ứng dụng trao đổi / quyên góp / thanh lý đồ cũ trong trường học.

## Cài đặt

```bash
npm install
cp .env.example .env
npm run dev
```

## API chính

- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/categories`
- `POST /api/posts`
- `POST /api/items`
- `POST /api/transactions`
- `POST /api/campaigns`
- `POST /api/campaign-items`
- `POST /api/fees`

Các API tạo/sửa/xóa cần header:

```txt
Authorization: Bearer <token>
```

## Collections

- users
- categories
- posts
- items
- transactions
- campaigns
- campaign_items
- fees
