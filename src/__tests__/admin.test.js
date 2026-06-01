const setup = require("./setup");
const { post, get, patch, loginAsMember, loginAsSuperAdmin, loginAsActivityAdmin } = require("./helpers");
const Category = require("../models/Category");

beforeAll(() => setup.connect(), 30000);
afterAll(() => setup.disconnect(), 15000);
afterEach(() => setup.clean());

async function seedCategory() {
  return Category.findOneAndUpdate(
    { categoryName: "Sách giáo khoa" },
    { categoryName: "Sách giáo khoa", description: "Sách học tập", status: "active" },
    { upsert: true, new: true },
  );
}

async function createPostAsMember(token) {
  return post(
    "/api/posts",
    {
      title: "Member Post",
      content: "Post content",
      imageName: "test.jpg",
      type: "Sale",
      price: 50000,
      category: "Sách giáo khoa",
      contact: "test@school.edu",
    },
    { token },
  );
}

describe("Admin API", () => {
  // =========================================================================
  // Admin Posts
  // =========================================================================
  describe("Admin Posts", () => {
    let adminToken, memberToken, postId;

    beforeEach(async () => {
      await seedCategory();
      const admin = await loginAsSuperAdmin();
      adminToken = admin.token;
      const member = await loginAsMember();
      memberToken = member.token;
      const created = await createPostAsMember(memberToken);
      postId = created.body.data.id;
    });

    // -----------------------------------------------------------------------
    // GET /api/admin/posts
    // -----------------------------------------------------------------------
    describe("GET /api/admin/posts", () => {
      it("super_admin should see all posts", async () => {
        const res = await get("/api/admin/posts", { token: adminToken });
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      });

      it("activity_admin should see only their campaign posts", async () => {
        const { token: activityToken } = await loginAsActivityAdmin();
        const res = await get("/api/admin/posts", { token: activityToken });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it("member should be forbidden", async () => {
        const res = await get("/api/admin/posts", { token: memberToken });
        expect(res.status).toBe(403);
      });
    });

    // -----------------------------------------------------------------------
    // GET /api/admin/posts/pending
    // -----------------------------------------------------------------------
    describe("GET /api/admin/posts/pending", () => {
      it("should list pending posts", async () => {
        const res = await get("/api/admin/posts/pending", { token: adminToken });
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      });
    });

    // -----------------------------------------------------------------------
    // POST /api/admin/posts/:postId/approve
    // -----------------------------------------------------------------------
    describe("POST /api/admin/posts/:postId/approve", () => {
      it("should approve a pending post", async () => {
        const res = await post(`/api/admin/posts/${postId}/approve`, {}, { token: adminToken });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("Approved");
      });

      it("member should be forbidden", async () => {
        const res = await post(`/api/admin/posts/${postId}/approve`, {}, { token: memberToken });
        expect(res.status).toBe(403);
      });
    });

    // -----------------------------------------------------------------------
    // POST /api/admin/posts/:postId/reject
    // -----------------------------------------------------------------------
    describe("POST /api/admin/posts/:postId/reject", () => {
      it("should reject a pending post with reason", async () => {
        const res = await post(
          `/api/admin/posts/${postId}/reject`,
          { reason: "Inappropriate content" },
          { token: adminToken },
        );
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("Rejected");
        expect(res.body.data.reason).toBe("Inappropriate content");
      });

      it("should require reason", async () => {
        const res = await post(`/api/admin/posts/${postId}/reject`, {}, { token: adminToken });
        expect(res.status).toBe(400);
      });
    });

    // -----------------------------------------------------------------------
    // POST /api/admin/posts/:postId/remove
    // -----------------------------------------------------------------------
    describe("POST /api/admin/posts/:postId/remove", () => {
      it("should admin-remove a post with reason", async () => {
        const res = await post(
          `/api/admin/posts/${postId}/remove`,
          { reason: "Violation" },
          { token: adminToken },
        );
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("Removed");
        expect(res.body.data.reason).toBe("Violation");
      });

      it("should require reason", async () => {
        const res = await post(`/api/admin/posts/${postId}/remove`, {}, { token: adminToken });
        expect(res.status).toBe(400);
      });
    });
  });

  // =========================================================================
  // Admin Categories
  // =========================================================================
  describe("Admin Categories", () => {
    let adminToken;

    beforeEach(async () => {
      const admin = await loginAsSuperAdmin();
      adminToken = admin.token;
    });

    describe("POST /api/admin/categories", () => {
      it("should create a category", async () => {
        const res = await post(
          "/api/admin/categories",
          { name: "Đồng phục", desc: "Đồng phục học sinh" },
          { token: adminToken },
        );
        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe("Đồng phục");
      });

      it("should reject duplicate category name", async () => {
        await post(
          "/api/admin/categories",
          { name: "Dụng cụ", desc: "Dụng cụ học tập" },
          { token: adminToken },
        );
        const res = await post(
          "/api/admin/categories",
          { name: "Dụng cụ", desc: "Dụng cụ học tập 2" },
          { token: adminToken },
        );
        expect(res.status).toBe(400);
      });
    });

    describe("GET /api/admin/categories", () => {
      it("should list all categories", async () => {
        await post(
          "/api/admin/categories",
          { name: "Category A", desc: "A" },
          { token: adminToken },
        );
        const res = await get("/api/admin/categories", { token: adminToken });
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe("PATCH /api/admin/categories/:name", () => {
      it("should update a category", async () => {
        await post(
          "/api/admin/categories",
          { name: "Old Name", desc: "Old" },
          { token: adminToken },
        );
        const res = await patch(
          `/api/admin/categories/${encodeURIComponent("Old Name")}`,
          { name: "New Name", desc: "Updated" },
          { token: adminToken },
        );
        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe("New Name");
      });
    });

    describe("POST /api/admin/categories/:name/toggle-active", () => {
      it("should toggle category active status", async () => {
        await post(
          "/api/admin/categories",
          { name: "Toggle Me", desc: "Toggle test" },
          { token: adminToken },
        );
        const res = await post(
          `/api/admin/categories/${encodeURIComponent("Toggle Me")}/toggle-active`,
          {},
          { token: adminToken },
        );
        expect(res.status).toBe(200);
        // Status should toggle from Active -> Inactive
        // (the mapper maps Hidden -> Inactive)
      });
    });

    describe("DELETE /api/admin/categories/:name", () => {
      it("should delete a category not in use", async () => {
        await post(
          "/api/admin/categories",
          { name: "Delete Me", desc: "To be deleted" },
          { token: adminToken },
        );
        const res = await require("./helpers").del(
          `/api/admin/categories/${encodeURIComponent("Delete Me")}`,
          { token: adminToken },
        );
        expect(res.status).toBe(200);
      });
    });
  });

  // =========================================================================
  // Admin Campaigns
  // =========================================================================
  describe("Admin Campaigns", () => {
    it("super_admin can list all campaigns", async () => {
      const { token: activityToken } = await loginAsActivityAdmin();
      await require("./helpers").post(
        "/api/campaigns",
        {
          name: "Admin Campaign Test",
          organizer: "CLB",
          description: "Test",
          type: "Donation",
          is_free: true,
          start: "2026-06-01",
          end: "2026-07-01",
        },
        { token: activityToken },
      );

      const { token: adminToken } = await loginAsSuperAdmin();
      const res = await get("/api/admin/campaigns", { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  // =========================================================================
  // Reports
  // =========================================================================
  describe("Reports", () => {
    let adminToken;

    beforeEach(async () => {
      const admin = await loginAsSuperAdmin();
      adminToken = admin.token;
    });

    it("GET /api/admin/reports/overview should return overview", async () => {
      const res = await get("/api/admin/reports/overview", { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("totalPosts");
      expect(res.body.data).toHaveProperty("totalTransactions");
      expect(res.body.data).toHaveProperty("activeCampaigns");
      expect(res.body.data).toHaveProperty("postsByType");
    });

    it("GET /api/admin/reports/posts should return post stats", async () => {
      const res = await get("/api/admin/reports/posts", { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("postsByStatus");
      expect(res.body.data).toHaveProperty("postDetailRows");
    });

    it("GET /api/admin/reports/transactions should return transaction stats", async () => {
      const res = await get("/api/admin/reports/transactions", { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("totalTransactions");
      expect(res.body.data).toHaveProperty("transactionsByType");
    });

    it("GET /api/admin/reports/campaigns should return campaign stats", async () => {
      const res = await get("/api/admin/reports/campaigns", { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("campaigns");
    });

    it("member should be forbidden from reports", async () => {
      const { token: memberToken } = await loginAsMember();
      const res = await get("/api/admin/reports/overview", { token: memberToken });
      expect(res.status).toBe(403);
    });
  });
});
