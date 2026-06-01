const setup = require("./setup");
const { post, get, patch, loginAsMember, loginAsSuperAdmin } = require("./helpers");

beforeAll(() => setup.connect(), 30000);
afterAll(() => setup.disconnect(), 15000);
afterEach(() => setup.clean());

describe("Auth API", () => {
  // ---------------------------------------------------------------------------
  // POST /api/auth/register
  // ---------------------------------------------------------------------------
  describe("POST /api/auth/register", () => {
    it("should register a new member successfully", async () => {
      const res = await post("/api/auth/register", {
        fullName: "An Nguyen",
        email: "an@student.school.edu",
        password: "school123",
        phone: "0912345678",
        userType: "student",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.session.roleKey).toBe("member");
    });

    it("should return 400 when email already exists", async () => {
      await post("/api/auth/register", {
        fullName: "Dup",
        email: "dup@school.edu",
        password: "school123",
        phone: "0900000000",
        userType: "student",
      });
      const res = await post("/api/auth/register", {
        fullName: "Dup2",
        email: "dup@school.edu",
        password: "school123",
        phone: "0900000001",
        userType: "student",
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("EMAIL_EXISTS");
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/auth/login
  // ---------------------------------------------------------------------------
  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await post("/api/auth/register", {
        fullName: "An Nguyen",
        email: "an@student.school.edu",
        password: "school123",
        phone: "0912345678",
        userType: "student",
      });
    });

    it("should login with correct credentials", async () => {
      const res = await post("/api/auth/login", {
        email: "an@student.school.edu",
        password: "school123",
      });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.session.email).toBe("an@student.school.edu");
    });

    it("should return 401 with wrong password", async () => {
      const res = await post("/api/auth/login", {
        email: "an@student.school.edu",
        password: "wrong",
      });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/auth/admin-login
  // ---------------------------------------------------------------------------
  describe("POST /api/auth/admin-login", () => {
    it("should login as super_admin with username", async () => {
      const { token } = await loginAsSuperAdmin();
      expect(token).toBeDefined();
    });

    it("should reject member from admin-login", async () => {
      await post("/api/auth/register", {
        fullName: "Member",
        email: "member@school.edu",
        password: "school123",
        phone: "0900000003",
        userType: "student",
      });
      const res = await post("/api/auth/admin-login", {
        username: "member@school.edu",
        password: "school123",
      });
      // Either 401 or 403
      expect([401, 403]).toContain(res.status);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/auth/me
  // ---------------------------------------------------------------------------
  describe("GET /api/auth/me", () => {
    it("should return session for authenticated user", async () => {
      const { token } = await loginAsMember();
      const res = await get("/api/auth/me", { token });
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.roleKey).toBe("member");
    });

    it("should return 401 without token", async () => {
      const res = await get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/auth/profile
  // ---------------------------------------------------------------------------
  describe("GET /api/auth/profile", () => {
    it("should return full user profile", async () => {
      const { token } = await loginAsMember();
      const res = await get("/api/auth/profile", { token });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("fullName");
      expect(res.body.data).toHaveProperty("email");
      expect(res.body.data).toHaveProperty("phone");
      expect(res.body.data).toHaveProperty("role");
      expect(res.body.data).toHaveProperty("roleKey");
      expect(res.body.data).toHaveProperty("status");
      expect(res.body.data).toHaveProperty("ownerRole");
      expect(res.body.data).toHaveProperty("createdAt");
    });

    it("should return 401 without token", async () => {
      const res = await get("/api/auth/profile");
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/auth/profile
  // ---------------------------------------------------------------------------
  describe("PATCH /api/auth/profile", () => {
    it("should update fullName and phone", async () => {
      const { token } = await loginAsMember();
      const res = await patch(
        "/api/auth/profile",
        { fullName: "Nguyen Van A", phone: "0987654321" },
        { token },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe("Nguyen Van A");
      expect(res.body.data.phone).toBe("0987654321");
    });

    it("should reject empty fullName", async () => {
      const { token } = await loginAsMember();
      const res = await patch(
        "/api/auth/profile",
        { fullName: "   " },
        { token },
      );
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/auth/logout
  // ---------------------------------------------------------------------------
  describe("POST /api/auth/logout", () => {
    it("should return success on logout", async () => {
      const { token } = await loginAsMember();
      const res = await post("/api/auth/logout", {}, { token });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
