const setup = require("./setup");
const { post, get, loginAsMember, loginAsSuperAdmin } = require("./helpers");
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

async function createAndApprovePost(token, adminToken) {
  await seedCategory();
  const created = await post(
    "/api/posts",
    {
      title: "Test Post",
      content: "Content",
      imageName: "test.jpg",
      type: "Sale",
      price: 50000,
      category: "Sách giáo khoa",
      contact: "test@school.edu",
    },
    { token },
  );
  const postId = created.body.data.id;
  await post(`/api/admin/posts/${postId}/approve`, {}, { token: adminToken });
  return postId;
}

describe("Requests API", () => {
  let memberToken, buyerToken, adminToken, postId;

  beforeEach(async () => {
    await seedCategory();

    // Member (post owner)
    const m1 = await loginAsMember();
    memberToken = m1.token;

    // Admin
    const m2 = await loginAsSuperAdmin();
    adminToken = m2.token;

    // Buyer (another member)
    await post("/api/auth/register", {
      fullName: "Buyer",
      email: "buyer@school.edu",
      password: "school123",
      phone: "0988888888",
      userType: "student",
    });
    const buyer = await post("/api/auth/login", { email: "buyer@school.edu", password: "school123" });
    buyerToken = buyer.body.data.token;

    // Create + approve post
    postId = await createAndApprovePost(memberToken, adminToken);
  });

  // ---------------------------------------------------------------------------
  // GET /api/requests/sent
  // ---------------------------------------------------------------------------
  describe("GET /api/requests/sent", () => {
    it("should return sent requests", async () => {
      await post(
        `/api/posts/${postId}/requests`,
        { message: "I want this", contact: "buyer@school.edu" },
        { token: buyerToken },
      );

      const res = await get("/api/requests/sent", { token: buyerToken });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe("Pending Approval");
    });

    it("should require auth", async () => {
      const res = await get("/api/requests/sent");
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/requests/received
  // ---------------------------------------------------------------------------
  describe("GET /api/requests/received", () => {
    it("should return received requests", async () => {
      await post(
        `/api/posts/${postId}/requests`,
        { message: "I want this", contact: "buyer@school.edu" },
        { token: buyerToken },
      );

      const res = await get("/api/requests/received", { token: memberToken });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it("should be empty if no requests", async () => {
      const res = await get("/api/requests/received", { token: memberToken });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/requests/:requestId/accept
  // ---------------------------------------------------------------------------
  describe("POST /api/requests/:requestId/accept", () => {
    it("should accept a pending request", async () => {
      const reqRes = await post(
        `/api/posts/${postId}/requests`,
        { message: "I want this", contact: "buyer@school.edu" },
        { token: buyerToken },
      );
      const requestId = reqRes.body.data.id;

      const res = await post(`/api/requests/${requestId}/accept`, {}, { token: memberToken });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("Accepted");
    });

    it("should reject non-owner from accepting", async () => {
      const reqRes = await post(
        `/api/posts/${postId}/requests`,
        { message: "I want this", contact: "buyer@school.edu" },
        { token: buyerToken },
      );
      const requestId = reqRes.body.data.id;

      // Buyer tries to accept (should fail — not the receiver)
      const res = await post(`/api/requests/${requestId}/accept`, {}, { token: buyerToken });
      expect(res.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/requests/:requestId/reject
  // ---------------------------------------------------------------------------
  describe("POST /api/requests/:requestId/reject", () => {
    it("should reject a pending request", async () => {
      const reqRes = await post(
        `/api/posts/${postId}/requests`,
        { message: "I want this", contact: "buyer@school.edu" },
        { token: buyerToken },
      );
      const requestId = reqRes.body.data.id;

      const res = await post(`/api/requests/${requestId}/reject`, {}, { token: memberToken });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("Rejected");
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/requests/:requestId/complete
  // ---------------------------------------------------------------------------
  describe("POST /api/requests/:requestId/complete", () => {
    it("should complete an accepted Exchange request", async () => {
      // Create an Exchange post (Sale must go through payment flow)
      await seedCategory();
      const exCreated = await post(
        "/api/posts",
        {
          title: "Exchange Post",
          content: "Exchange content",
          imageName: "test.jpg",
          type: "Exchange",
          price: 0,
          category: "Sách giáo khoa",
          contact: "test@school.edu",
        },
        { token: memberToken },
      );
      const exPostId = exCreated.body.data.id;
      await post(`/api/admin/posts/${exPostId}/approve`, {}, { token: adminToken });

      const reqRes = await post(
        `/api/posts/${exPostId}/requests`,
        { message: "I want to exchange", contact: "buyer@school.edu" },
        { token: buyerToken },
      );
      const requestId = reqRes.body.data.id;

      await post(`/api/requests/${requestId}/accept`, {}, { token: memberToken });

      const res = await post(`/api/requests/${requestId}/complete`, {}, { token: memberToken });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("Completed");
    });

    it("should reject complete for Sale (must use payment flow)", async () => {
      const reqRes = await post(
        `/api/posts/${postId}/requests`,
        { message: "I want this", contact: "buyer@school.edu" },
        { token: buyerToken },
      );
      const requestId = reqRes.body.data.id;

      await post(`/api/requests/${requestId}/accept`, {}, { token: memberToken });

      // Complete should fail because Sale must go through payment
      const res = await post(`/api/requests/${requestId}/complete`, {}, { token: memberToken });
      expect(res.status).toBe(400);
    });

    it("should not complete a pending request", async () => {
      const reqRes = await post(
        `/api/posts/${postId}/requests`,
        { message: "I want this", contact: "buyer@school.edu" },
        { token: buyerToken },
      );
      const requestId = reqRes.body.data.id;

      // Not accepted yet
      const res = await post(`/api/requests/${requestId}/complete`, {}, { token: memberToken });
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/requests/completed
  // ---------------------------------------------------------------------------
  describe("GET /api/requests/completed", () => {
    it("should return completed requests (via payment for Sale)", async () => {
      const reqRes = await post(
        `/api/posts/${postId}/requests`,
        { message: "Complete me", contact: "buyer@school.edu" },
        { token: buyerToken },
      );
      const requestId = reqRes.body.data.id;

      await post(`/api/requests/${requestId}/accept`, {}, { token: memberToken });

      // Complete Sale via payment flow
      await post(`/api/payments/confirm/${requestId}`, { paymentMethod: "simulated" }, { token: buyerToken });

      const res = await get("/api/requests/completed", { token: memberToken });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });
});
