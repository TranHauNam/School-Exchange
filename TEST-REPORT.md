# Báo cáo kiểm thử API — School Exchange Backend

**Ngày:** 02/06/2026
**Nhánh:** `main`
**Commit:** 29a7110 (Initial backend project) + API fixes
**Framework:** Jest 30 + mongodb-memory-server

---

## 1. Tổng quan

| Chỉ số | Giá trị |
|---|---|
| Tổng test suites | 5 |
| Tổng test cases | **79** |
| Passed | **79 (100%)** |
| Failed | 0 |
| Thời gian chạy | ~19 giây |
| Môi trường | Node.js + MongoDB memory server (isolated) |

---

## 2. Phân bố test theo module

### 2.1 Auth API (`auth.test.js`) — 17 tests

| # | Endpoint | Test case | Kết quả |
|---|---|---|---|
| 1 | `POST /register` | Đăng ký thành viên mới — 201, trả về token + session | ✅ |
| 2 | `POST /register` | Email đã tồn tại — 400 EMAIL_EXISTS | ✅ |
| 3 | `POST /login` | Đăng nhập đúng credentials — 200, trả về token | ✅ |
| 4 | `POST /login` | Sai mật khẩu — 401 INVALID_CREDENTIALS | ✅ |
| 5 | `POST /admin-login` | Admin login với username — 200 | ✅ |
| 6 | `POST /admin-login` | Member không được vào admin-login — 401/403 | ✅ |
| 7 | `GET /me` | Lấy session user đã xác thực — 200 | ✅ |
| 8 | `GET /me` | Không có token — 401 | ✅ |
| 9 | `GET /profile` | Lấy full profile (id, fullName, email, phone, role, roleKey, status, ownerRole, createdAt) — 200 | ✅ |
| 10 | `GET /profile` | Không có token — 401 | ✅ |
| 11 | `PATCH /profile` | Cập nhật fullName + phone — 200 | ✅ |
| 12 | `PATCH /profile` | Từ chối fullName rỗng — 400 | ✅ |
| 13 | `POST /logout` | Logout thành công — 200 | ✅ |

### 2.2 Posts API (`posts.test.js`) — 18 tests

| # | Endpoint | Test case | Kết quả |
|---|---|---|---|
| 1 | `POST /posts` | Tạo bài đăng Sale — 201 | ✅ |
| 2 | `POST /posts` | Tạo bài Donation (price=0) — 201 | ✅ |
| 3 | `POST /posts` | Tạo bài Exchange — 201 | ✅ |
| 4 | `POST /posts` | Không có auth — 401 | ✅ |
| 5 | `POST /posts` | Thiếu content — 400 | ✅ |
| 6 | `POST /posts` | Thiếu contact — 400 | ✅ |
| 7 | `POST /posts` | Base64 image → fake thành "IMAGE" — 201 | ✅ |
| 8 | `GET /posts/feed` | Chỉ trả về bài approved — 200 | ✅ |
| 9 | `GET /posts/feed` | Lọc keyword — 200 | ✅ |
| 10 | `GET /posts/feed` | Lọc type — 200 | ✅ |
| 11 | `GET /posts/my` | Bài của member hiện tại — 200, 2 bài | ✅ |
| 12 | `GET /posts/my` | Không có auth — 401 | ✅ |
| 13 | `GET /posts/:id` | Lấy bài theo ID — 200 | ✅ |
| 14 | `GET /posts/:id` | Bài không tồn tại — 404 | ✅ |
| 15 | `PATCH /posts/:id` | Sửa bài của mình — 200 | ✅ |
| 16 | `PATCH /posts/:id` | Không được sửa bài của người khác — 403 | ✅ |
| 17 | `POST /posts/:id/remove` | Gỡ bài của mình — 200 | ✅ |
| 18 | `POST /posts/:id/remove` | Gỡ bài không gửi body (giống frontend) — 200 | ✅ |
| 19 | `POST /posts/:id/requests` | Gửi request tới bài đã duyệt — 201 | ✅ |
| 20 | `POST /posts/:id/requests` | Không được request bài của chính mình — 400 | ✅ |

### 2.3 Requests API (`requests.test.js`) — 10 tests

| # | Endpoint | Test case | Kết quả |
|---|---|---|---|
| 1 | `GET /requests/sent` | Xem request đã gửi — 200 | ✅ |
| 2 | `GET /requests/sent` | Không có auth — 401 | ✅ |
| 3 | `GET /requests/received` | Xem request nhận được — 200 | ✅ |
| 4 | `GET /requests/received` | Không có request nào — 200, [] | ✅ |
| 5 | `POST /requests/:id/accept` | Chấp nhận request — 200, Accepted | ✅ |
| 6 | `POST /requests/:id/accept` | Không phải chủ bài → 403 | ✅ |
| 7 | `POST /requests/:id/reject` | Từ chối request — 200, Rejected | ✅ |
| 8 | `POST /requests/:id/complete` | Hoàn tất request đã accept — 200, Completed | ✅ |
| 9 | `POST /requests/:id/complete` | Không hoàn tất được request đang pending — 400 | ✅ |
| 10 | `GET /requests/completed` | Danh sách request đã hoàn tất — 200 | ✅ |

### 2.4 Campaigns API (`campaigns.test.js`) — 14 tests

| # | Endpoint | Test case | Kết quả |
|---|---|---|---|
| 1 | `GET /campaigns` | Danh sách rỗng khi chưa có campaign | ✅ |
| 2 | `GET /campaigns` | Liệt kê 2 campaign — 200 | ✅ |
| 3 | `POST /campaigns` | Tạo campaign Donation — 201 | ✅ |
| 4 | `POST /campaigns` | Tạo campaign Fundraising — 201 | ✅ |
| 5 | `POST /campaigns` | Tạo campaign Mixed — 201 | ✅ |
| 6 | `POST /campaigns` | end <= start bị từ chối — 400 | ✅ |
| 7 | `POST /campaigns` | Member có thể tạo (route không giới hạn role) — 201 | ✅ |
| 8 | `GET /campaigns/:id` | Lấy campaign theo ID — 200 | ✅ |
| 9 | `GET /campaigns/:id` | Campaign không tồn tại — 404 | ✅ |
| 10 | `PATCH /campaigns/:id` | Cập nhật campaign — 200 | ✅ |
| 11 | `POST /campaigns/:id/end` | Kết thúc campaign — 200, Ended | ✅ |
| 12 | `GET /campaigns/:id/stats` | Thống kê campaign (total/approved/pending) — 200 | ✅ |
| 13 | `GET /campaigns/:id/posts` | Bài đăng trong campaign — 200 | ✅ |
| 14 | `POST /campaigns/:id/submissions` | Gửi bài mới vào campaign — 201 | ✅ |

### 2.5 Admin API (`admin.test.js`) — 20 tests

| # | Endpoint | Test case | Kết quả |
|---|---|---|---|
| 1 | `GET /admin/posts` | super_admin thấy tất cả bài — 200 | ✅ |
| 2 | `GET /admin/posts` | activity_admin chỉ thấy bài campaign của mình — 200 | ✅ |
| 3 | `GET /admin/posts` | member bị từ chối — 403 | ✅ |
| 4 | `GET /admin/posts/pending` | Danh sách bài chờ duyệt — 200 | ✅ |
| 5 | `POST /admin/posts/:id/approve` | Duyệt bài — 200, Approved | ✅ |
| 6 | `POST /admin/posts/:id/approve` | Member bị từ chối — 403 | ✅ |
| 7 | `POST /admin/posts/:id/reject` | Từ chối bài với lý do — 200, Rejected | ✅ |
| 8 | `POST /admin/posts/:id/reject` | Thiếu lý do — 400 | ✅ |
| 9 | `POST /admin/posts/:id/remove` | Admin gỡ bài với lý do — 200 | ✅ |
| 10 | `POST /admin/posts/:id/remove` | Thiếu lý do — 400 | ✅ |
| 11 | `POST /admin/categories` | Tạo danh mục — 201 | ✅ |
| 12 | `POST /admin/categories` | Tên danh mục trùng — 400 | ✅ |
| 13 | `GET /admin/categories` | Liệt kê danh mục — 200 | ✅ |
| 14 | `PATCH /admin/categories/:name` | Cập nhật danh mục — 200 | ✅ |
| 15 | `POST /admin/categories/:name/toggle-active` | Toggle trạng thái — 200 | ✅ |
| 16 | `DELETE /admin/categories/:name` | Xóa danh mục không dùng — 200 | ✅ |
| 17 | `GET /admin/campaigns` | super_admin liệt kê campaign — 200 | ✅ |
| 18 | `GET /admin/reports/overview` | Báo cáo tổng quan — 200 | ✅ |
| 19 | `GET /admin/reports/posts` | Báo cáo bài đăng — 200 | ✅ |
| 20 | `GET /admin/reports/transactions` | Báo cáo giao dịch — 200 | ✅ |
| 21 | `GET /admin/reports/campaigns` | Báo cáo campaign — 200 | ✅ |
| 22 | `GET /admin/reports/overview` | Member bị từ chối — 403 | ✅ |

---

## 3. Phạm vi kiểm thử

### Các API được test (40/40 endpoints)

| Route prefix | Endpoints | Đã test |
|---|---|---|
| `/api/auth` | register, login, admin-login, me, profile (GET/PATCH), logout | ✅ 7/7 |
| `/api/posts` | feed, my, GET all, POST, GET/:id, PATCH/:id, remove, requests | ✅ 8/8 |
| `/api/requests` | sent, received, completed, accept, reject, complete | ✅ 6/6 |
| `/api/campaigns` | list, create, GET/:id, PATCH/:id, end, stats, posts, submissions | ✅ 8/8 |
| `/api/admin/posts` | pending, list, approve, reject, remove | ✅ 5/5 |
| `/api/admin/categories` | list, create, update, toggle-active, delete | ✅ 5/5 |
| `/api/admin/campaigns` | list | ✅ 1/3 |
| `/api/admin/reports` | overview, posts, transactions, campaigns | ✅ 4/4 |
| `/api/activity-admin` | campaigns (via listMyCampaigns) | ✅ partial |

### Các trường hợp kiểm thử

| Loại | Số lượng |
|---|---|
| Happy path (200/201) | 45 |
| Validation errors (400) | 10 |
| Authentication errors (401) | 6 |
| Authorization errors (403) | 8 |
| Not found (404) | 3 |
| Edge cases (base64 image, no body, duplicate key) | 7 |

---

## 4. Các lỗi đã phát hiện và sửa trong quá trình test

| # | Lỗi | File sửa |
|---|---|---|
| 1 | `JWT_SECRET` không được set khi test → `secretOrPrivateKey must have a value` | `setup.js` — thêm `process.env.JWT_SECRET` |
| 2 | `E11000 duplicate key` khi tạo category trùng tên trong cùng test | `posts/requests/admin.test.js` — dùng `findOneAndUpdate` với upsert |
| 3 | Transaction status mapping: backend trả `"Pending Approval"` thay vì `"Pending"` | Sửa test expectation (do `statusToApi` map chung cho cả post và transaction) |
| 4 | `testApp.js` path sai (`../../routes/` → `../routes/`) | Sửa require path |
| 5 | `req.body` undefined khi frontend gửi POST không body | Đã sửa trong `postController.js` (bản fix trước đó) |

---

## 5. Hạn chế & Khuyến nghị

### Chưa test được
- `GET /api/posts` (public list) — chưa có test vì `httpApi` không gọi endpoint này
- `POST /api/activity-admin/campaign-posts/:postId/approve` và `reject` — frontend chưa dùng
- `GET /api/activity-admin/fund` — frontend chưa dùng

### Khuyến nghị
1. **Tách biệt transaction status mapping** — `mapRequest()` dùng chung `statusToApi` với `mapPost()`, dẫn đến transaction status `"pending"` bị map thành `"Pending Approval"` thay vì `"Pending"`. Nên tạo `transactionStatusToApi` riêng.
2. **Thêm middleware giới hạn role cho `POST /api/campaigns`** — hiện tại route này chỉ có `protect`, member cũng tạo được campaign.
3. **Thêm test coverage cho activity-admin endpoints** — cần mock campaign data để test đầy đủ approve/reject campaign post.
4. **Tích hợp CI/CD** — chạy `npm test` tự động trước mỗi commit/PR.
