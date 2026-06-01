// HTTP request helpers for API tests.
const http = require("http");

function request(method, path, { token, body } = {}) {
  return new Promise((resolve, reject) => {
    const base = global.__BASE__;
    if (!base) return reject(new Error("Server not started — did beforeAll run?"));

    const url = new URL(path, base);
    const payload = body !== undefined && body !== null ? JSON.stringify(body) : undefined;

    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {},
    };

    if (payload) opts.headers["Content-Type"] = "application/json";
    if (token) opts.headers["Authorization"] = `Bearer ${token}`;

    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: { raw: data } });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Request timeout")); });
    if (payload) req.write(payload);
    req.end();
  });
}

function get(path, opts) {
  return request("GET", path, opts);
}

function post(path, body, opts) {
  return request("POST", path, { ...opts, body });
}

function patch(path, body, opts) {
  return request("PATCH", path, { ...opts, body });
}

function del(path, opts) {
  return request("DELETE", path, opts);
}

/** Login as member, returns { token, session }. Registers first if needed. */
async function loginAsMember() {
  // Try login first
  let res = await post("/api/auth/login", {
    email: "an@student.school.edu",
    password: "school123",
  });

  if (res.status !== 200) {
    // Register first
    await post("/api/auth/register", {
      fullName: "An Nguyen",
      email: "an@student.school.edu",
      password: "school123",
      phone: "0912345678",
      userType: "student",
    });

    res = await post("/api/auth/login", {
      email: "an@student.school.edu",
      password: "school123",
    });
  }

  if (res.status !== 200 || !res.body.data || !res.body.data.token) {
    throw new Error(`loginAsMember failed: ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.data.token, session: res.body.data.session };
}

/** Login as super_admin, returns { token, session } */
async function loginAsSuperAdmin() {
  // Register admin user
  await post("/api/auth/register", {
    fullName: "Le Quoc Huy",
    email: "huy@school.edu",
    password: "school123",
    phone: "0900000001",
    userType: "school_staff",
  });

  const User = require("../models/User");
  let u = await User.findOne({ email: "huy@school.edu" });
  if (u) {
    u.role = "super_admin";
    u.username = "huyle";
    await u.save();
  }

  const res = await post("/api/auth/admin-login", {
    username: "huyle",
    password: "school123",
  });

  if (res.status !== 200 || !res.body.data || !res.body.data.token) {
    throw new Error(`loginAsSuperAdmin failed: ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.data.token, session: res.body.data.session };
}

/** Login as activity_admin, returns { token, session } */
async function loginAsActivityAdmin() {
  await post("/api/auth/register", {
    fullName: "CLB Green Life",
    email: "greenlife@school.edu",
    password: "school123",
    phone: "0900000002",
    userType: "club",
  });

  const User = require("../models/User");
  let u = await User.findOne({ email: "greenlife@school.edu" });
  if (u) {
    u.role = "activity_admin";
    u.username = "greenlife";
    await u.save();
  }

  const res = await post("/api/auth/admin-login", {
    username: "greenlife",
    password: "school123",
  });

  if (res.status !== 200 || !res.body.data || !res.body.data.token) {
    throw new Error(`loginAsActivityAdmin failed: ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.data.token, session: res.body.data.session };
}

module.exports = { request, get, post, patch, del, loginAsMember, loginAsSuperAdmin, loginAsActivityAdmin };
