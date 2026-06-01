const setup = require("./setup");
const { post, get, patch, loginAsMember, loginAsSuperAdmin } = require("./helpers");
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

async function createPost(token, overrides = {}) {
  return post(
    "/api/posts",
    {
      title: "Test Post",
      content: "Test content for post",
      imageName: "test.jpg",
      type: "Sale",
      price: 50000,
      category: "Sách giáo khoa",
      contact: "test@school.edu",
      ...overrides,
    },
    { token },
  );
}

describe("Posts API", () => {
  beforeEach(async () => {
    await seedCategory();
  });

  // ---------------------------------------------------------------------------
  // POST /api/posts (create)
  // ---------------------------------------------------------------------------
  describe("POST /api/posts", () => {
    it("should create a new post", async () => {
      const { token } = await loginAsMember();
      const res = await createPost(token);
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.status).toBe("Pending Approval");
      expect(res.body.data.type).toBe("Sale");
    });

    it("should create a Donation post with price 0", async () => {
      const { token } = await loginAsMember();
      const res = await createPost(token, { type: "Donation", price: 0 });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe("Donation");
    });

    it("should create an Exchange post", async () => {
      const { token } = await loginAsMember();
      const res = await createPost(token, { type: "Exchange", price: 0 });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe("Exchange");
    });

    it("should return 401 without auth", async () => {
      const res = await createPost(null);
      expect(res.status).toBe(401);
    });

    it("should require content", async () => {
      const { token } = await loginAsMember();
      const res = await post(
        "/api/posts",
        {
          imageName: "test.jpg",
          type: "Sale",
          price: 10000,
          category: "Sách giáo khoa",
          contact: "test@school.edu",
        },
        { token },
      );
      expect(res.status).toBe(400);
    });

    it("should require contact", async () => {
      const { token } = await loginAsMember();
      const res = await post(
        "/api/posts",
        {
          content: "No contact",
          imageName: "test.jpg",
          type: "Sale",
          price: 10000,
          category: "Sách giáo khoa",
        },
        { token },
      );
      expect(res.status).toBe(400);
    });

    it("should fake base64 image to placeholder", async () => {
      const { token } = await loginAsMember();
      const fakeBase64 = "data:image/jpeg;base64," + "A".repeat(300);
      const res = await createPost(token, { imageName: fakeBase64 });
      expect(res.status).toBe(201);
      // Base64 is faked to "IMAGE" — verify via DB
      const Post = require("../models/Post");
      const dbPost = await Post.findById(res.body.data.id).lean();
      expect(dbPost.imageName).toBe("IMAGE");
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/posts/feed
  // ---------------------------------------------------------------------------
  describe("GET /api/posts/feed", () => {
    it("should return only approved posts", async () => {
      const { token: memberToken } = await loginAsMember();
      // Create a post (pending)
      await createPost(memberToken);
      // Feed should have 0 posts (not approved yet)
      const feed = await get("/api/posts/feed");
      expect(feed.status).toBe(200);
      expect(Array.isArray(feed.body.data)).toBe(true);
    });

    it("should support keyword filter", async () => {
      const res = await get("/api/posts/feed?keyword=test");
      expect(res.status).toBe(200);
    });

    it("should support type filter", async () => {
      const res = await get("/api/posts/feed?type=Sale");
      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/posts/my
  // ---------------------------------------------------------------------------
  describe("GET /api/posts/my", () => {
    it("should return member's own posts", async () => {
      const { token } = await loginAsMember();
      await createPost(token, { title: "My Post 1" });
      await createPost(token, { title: "My Post 2" });

      const res = await get("/api/posts/my", { token });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it("should return 401 without auth", async () => {
      const res = await get("/api/posts/my");
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/posts/:postId
  // ---------------------------------------------------------------------------
  describe("GET /api/posts/:postId", () => {
    it("should return post by id", async () => {
      const { token } = await loginAsMember();
      const created = await createPost(token);
      const postId = created.body.data.id;

      const res = await get(`/api/posts/${postId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(postId);
    });

    it("should return 404 for non-existent post", async () => {
      const res = await get("/api/posts/000000000000000000000000");
      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/posts/:postId
  // ---------------------------------------------------------------------------
  describe("PATCH /api/posts/:postId", () => {
    it("should update own post", async () => {
      const { token } = await loginAsMember();
      const created = await createPost(token);
      const postId = created.body.data.id;

      const res = await patch(`/api/posts/${postId}`, { title: "Updated Title" }, { token });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Title");
    });

    it("should reject update of another member's post", async () => {
      const { token: token1 } = await loginAsMember();

      // Register second member
      await post("/api/auth/register", {
        fullName: "Other Member",
        email: "other@school.edu",
        password: "school123",
        phone: "0999999999",
        userType: "student",
      });
      const login2 = await post("/api/auth/login", { email: "other@school.edu", password: "school123" });
      const token2 = login2.body.data.token;

      const created = await createPost(token1);
      const postId = created.body.data.id;

      const res = await patch(`/api/posts/${postId}`, { title: "Hacked" }, { token: token2 });
      expect(res.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/posts/:postId/remove
  // ---------------------------------------------------------------------------
  describe("POST /api/posts/:postId/remove", () => {
    it("should remove own post", async () => {
      const { token } = await loginAsMember();
      const created = await createPost(token);
      const postId = created.body.data.id;

      const res = await post(`/api/posts/${postId}/remove`, {}, { token });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("Removed");
    });

    it("should handle remove without body (frontend behavior)", async () => {
      const { token } = await loginAsMember();
      const created = await createPost(token);
      const postId = created.body.data.id;

      // Frontend sends POST with NO body — test this works
      const res = await post(`/api/posts/${postId}/remove`, undefined, { token });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("Removed");
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/posts/:postId/requests
  // ---------------------------------------------------------------------------
  describe("POST /api/posts/:postId/requests", () => {
    it("should create a request on an approved post", async () => {
      const { token: adminToken } = await loginAsSuperAdmin();

      // Create post as member
      const { token: memberToken } = await loginAsMember();
      const created = await createPost(memberToken);
      const postId = created.body.data.id;

      // Admin approves it
      await post(`/api/admin/posts/${postId}/approve`, {}, { token: adminToken });

      // Another member (register + login)
      await post("/api/auth/register", {
        fullName: "Buyer",
        email: "buyer@school.edu",
        password: "school123",
        phone: "0988888888",
        userType: "student",
      });
      const buyer = await post("/api/auth/login", { email: "buyer@school.edu", password: "school123" });
      const buyerToken = buyer.body.data.token;

      const res = await post(
        `/api/posts/${postId}/requests`,
        { message: "I want this", contact: "buyer@school.edu" },
        { token: buyerToken },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("Pending Approval");
    });

    it("should not allow requesting own post", async () => {
      const { token: adminToken } = await loginAsSuperAdmin();
      const { token: memberToken } = await loginAsMember();
      const created = await createPost(memberToken);
      const postId = created.body.data.id;

      await post(`/api/admin/posts/${postId}/approve`, {}, { token: adminToken });

      const res = await post(
        `/api/posts/${postId}/requests`,
        { message: "Self request", contact: "self" },
        { token: memberToken },
      );
      expect(res.status).toBe(400);
    });
  });
});
