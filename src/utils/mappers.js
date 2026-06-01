const typeToApi = { sell: "Sale", exchange: "Exchange", donate: "Donation" };
const apiToType = { Sale: "sell", Exchange: "exchange", Donation: "donate", Purchase: "sell", Fundraising: "fundraising", Mixed: "mixed" };

const statusToApi = {
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  hidden: "Removed",
  removed: "Removed",
  completed: "Completed",
  active: "Active",
  upcoming: "Upcoming",
  ended: "Ended",
  cancelled: "Cancelled"
};

const apiToStatus = {
  "Pending Approval": "pending",
  Approved: "approved",
  Rejected: "rejected",
  Completed: "completed",
  Removed: "removed",
  All: "All"
};

function roleLabel(role) {
  return role === "super_admin" ? "System Administrator" :
    role === "activity_admin" ? "Activity Administrator" : "Member";
}

function userName(user) {
  return user?.fullName || user?.userName || user?.username || "";
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

function iconForCategory(categoryName = "") {
  const s = categoryName.toLowerCase();
  if (s.includes("book") || s.includes("sách")) return "📚";
  if (s.includes("calculator") || s.includes("máy tính")) return "∑";
  if (s.includes("sport") || s.includes("thể thao")) return "🏸";
  if (s.includes("uniform") || s.includes("đồng phục")) return "👕";
  return "📦";
}

async function mapPost(post, item = null, category = null, campaign = null) {
  const p = post.toObject ? post.toObject() : post;
  const owner = p.memberId;
  const i = item || p.firstItem || null;
  const cat = category || i?.categoryId || null;
  const camp = campaign || p.campaignId || null;

  return {
    id: String(p._id),
    title: p.title,
    icon: iconForCategory(cat?.categoryName),
    type: typeToApi[p.postType] || p.postType,
    price: i?.price ?? 0,
    category: cat?.categoryName || "",
    owner: userName(owner),
    ownerRole: owner?.userType === "teacher" ? "Teacher" : owner?.userType === "student" ? "Student" : roleLabel(owner?.role),
    status: statusToApi[p.postStatus] || p.postStatus,
    campaignId: camp?._id ? String(camp._id) : (p.campaignId ? String(p.campaignId) : null),
    campaignName: camp?.campaignName || null,
    date: formatDate(p.createdAt),
    content: p.content || p.description,
    description: i?.itemDescription || p.description || "",
    contact: p.contact || owner?.email || "",
    reason: p.rejectReason || p.removeReason || null
  };
}

function mapSession(user) {
  return {
    id: String(user._id),
    roleKey: user.role,
    role: roleLabel(user.role),
    userName: user.fullName || user.userName || user.username,
    email: user.email
  };
}

function mapCategory(category, count = 0) {
  return {
    name: category.categoryName,
    desc: category.description || "",
    status: category.status === "active" ? "Active" : "Hidden",
    count
  };
}

function mapCampaign(campaign) {
  const c = campaign.toObject ? campaign.toObject() : campaign;
  return {
    id: String(c._id),
    name: c.campaignName,
    organizer: c.organizer || c.organizerId?.organizationName || userName(c.organizerId) || "",
    type: c.campaignType === "fundraising" ? "Fundraising" : c.campaignType === "mixed" ? "Mixed" : "Donation",
    is_free: c.isFree,
    start: formatDate(c.startDate),
    end: formatDate(c.endDate),
    status: statusToApi[c.campaignStatus] || c.campaignStatus,
    cover: c.cover || "STUDY",
    description: c.description || ""
  };
}

function mapRequest(tx) {
  const t = tx.toObject ? tx.toObject() : tx;
  const post = t.postId;
  const item = t.itemId;
  const type = t.transactionType === "sell" ? "Purchase" : typeToApi[t.transactionType];
  return {
    id: String(t._id),
    productId: post?._id ? String(post._id) : String(t.postId || ""),
    product: post?.title || item?.itemName || "",
    sender: userName(t.requesterId),
    receiver: userName(t.ownerId),
    type,
    status: statusToApi[t.transactionStatus] || capitalize(t.transactionStatus),
    date: formatDate(t.createdAt || t.transactionDate)
  };
}

function capitalize(s = "") {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = { typeToApi, apiToType, statusToApi, apiToStatus, mapPost, mapSession, mapCategory, mapCampaign, mapRequest };
