# Hướng dẫn test API bằng Postman

## Import vào Postman

1. **Import** → chọn 2 file:
   - `postman/School-Exchange.postman_collection.json`
   - `postman/School-Exchange.postman_environment.json`
2. Chọn environment **School Exchange - Local** (góc phải).
3. Chạy server: `npm start`
4. Tạo tài khoản test (1 lần): `node scripts/seed-test-users.js`

## Biến môi trường

| Biến | Ví dụ | Ghi chú |
|------|--------|---------|
| `baseUrl` | `http://localhost:5000` | Không có `/` ở cuối |
| `token` | (tự set) | Bearer cho request hiện tại |
| `sellerToken` / `buyerToken` | (tự set) | Sau register/login |
| `postId` / `requestId` / `campaignId` | (tự set) | Sau tạo bài / yêu cầu / campaign |

**Header chung (API cần đăng nhập):**

```http
Authorization: Bearer {{token}}
Content-Type: application/json
```

---

## 1. Auth

> Đường dẫn thật là **`/api/auth/...`**, không phải `/login` trực tiếp.

### Đăng ký thành viên

`POST {{baseUrl}}/api/auth/register`

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "seller@test.local",
  "password": "123456",
  "phone": "0901111111",
  "userType": "student"
}
```

`userType`: `student` | `teacher` | `school_staff` | `club` | `student_union`

---

### Login thành viên (email)

`POST {{baseUrl}}/api/auth/login`

```json
{
  "email": "seller@test.local",
  "password": "123456"
}
```

Hoặc login bằng username:

```json
{
  "username": "ten_dang_nhap",
  "password": "123456"
}
```

**Response mẫu:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "session": {
      "id": "...",
      "roleKey": "member",
      "role": "Member",
      "userName": "Nguyễn Văn A",
      "email": "seller@test.local"
    }
  }
}
```

Copy `data.token` → dùng `Authorization: Bearer <token>`.

---

### Login admin / activity admin

`POST {{baseUrl}}/api/auth/admin-login`

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Activity admin (sau seed):

```json
{
  "username": "club_admin",
  "password": "club123"
}
```

---

### Thông tin phiên hiện tại

`GET {{baseUrl}}/api/auth/me`  
Header: `Authorization: Bearer {{token}}`

---

### Đăng xuất

`POST {{baseUrl}}/api/auth/logout`  
Header: `Authorization: Bearer {{token}}`

---

## 2. Danh mục

`GET {{baseUrl}}/api/categories/active`  
(Không cần token)

---

## 3. Bài đăng

### Tạo bài (cần token người đăng)

`POST {{baseUrl}}/api/posts`

```json
{
  "title": "Sách Toán 10",
  "content": "Sách còn mới 90%.",
  "type": "Sale",
  "price": 100000,
  "category": "Sách",
  "contact": "0901111111",
  "imageName": "book.jpg"
}
```

`type`: `Sale` | `Exchange` | `Donation`

### Feed

`GET {{baseUrl}}/api/posts/feed`

### Gửi yêu cầu mua (buyer, bài phải **Approved**)

`POST {{baseUrl}}/api/posts/{{postId}}/requests`

```json
{
  "message": "Mình muốn mua.",
  "contact": "0902222222"
}
```

---

## 4. Admin duyệt bài

Token: `super_admin` (`adminToken`)

| Method | URL |
|--------|-----|
| GET | `{{baseUrl}}/api/admin/posts/pending` |
| POST | `{{baseUrl}}/api/admin/posts/{{postId}}/approve` |
| POST | `{{baseUrl}}/api/admin/posts/{{postId}}/reject` |

Body từ chối:

```json
{
  "reason": "Ảnh không rõ."
}
```

---

## 5. Giao dịch (requests)

| Bước | Method | URL | Token |
|------|--------|-----|-------|
| Đã gửi | GET | `/api/requests/sent` | buyer |
| Đã nhận | GET | `/api/requests/received` | seller |
| Chấp nhận | POST | `/api/requests/{{requestId}}/accept` | seller |
| Từ chối | POST | `/api/requests/{{requestId}}/reject` | seller |
| Hoàn tất | POST | `/api/requests/{{requestId}}/complete` | seller |
| Đã xong | GET | `/api/requests/completed` | seller/buyer |

Hoàn tất giao dịch bán → cộng **quỹ chung** (`fundAmount` trong response).

---

## 6. Chiến dịch & quỹ

`POST {{baseUrl}}/api/campaigns`

```json
{
  "name": "Quyên góp sách 2026",
  "type": "Fundraising",
  "start": "2026-06-01",
  "end": "2026-12-31",
  "description": "Mô tả",
  "targetFund": 5000000,
  "is_free": false,
  "cover": "STUDY"
}
```

`GET {{baseUrl}}/api/activity-admin/fund` — token activity admin (CLB/Nhà trường/Hội SV)

---

## Thứ tự test luồng chính

1. Register seller → Register buyer  
2. Admin login → Duyệt bài (sau khi seller tạo post)  
3. Buyer login → Gửi request  
4. Seller → Accept → Complete  
5. Activity admin → Xem `/api/activity-admin/fund`

Hoặc trong Postman: chuột phải collection → **Run collection** (chạy tuần tự folder 0 → 5).
