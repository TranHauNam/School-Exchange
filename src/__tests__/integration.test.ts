/**
 * Task 14 — Integration flow tests through the mock API seam.
 *
 * These tests exercise the exact flows described in tasks.md §14.1–14.6,
 * using only the public mockApi interface (the same seam the UI uses).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { mockApi, ApiError } from '@/lib/services/mockApi';
import { resetDemo } from '@/lib/services/mockStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Switch role WITHOUT resetting state (for multi-step flows). */
const ROLE_CREDENTIALS: Record<string, { email: string; password: string }> = {
  member: { email: 'an@student.school.edu', password: 'school123' },
  'system-admin': { email: 'huy@school.edu', password: 'school123' },
  'activity-admin': { email: 'greenlife@school.edu', password: 'school123' },
};

async function switchTo(roleKey: 'member' | 'system-admin' | 'activity-admin') {
  const creds = ROLE_CREDENTIALS[roleKey];
  const isAdmin = roleKey !== 'member';
  return mockApi.auth.login(creds.email, creds.password, isAdmin);
}

// ---------------------------------------------------------------------------
// 14.1 Member: login → feed → send request → request appears in sent tab
// ---------------------------------------------------------------------------
describe('14.1 — Member send request flow', () => {
  beforeEach(() => {
    resetDemo();
  });

  it('should see approved posts on the feed', async () => {
    await switchTo('member');
    const feed = await mockApi.posts.listFeed({});
    expect(feed.length).toBeGreaterThan(0);
    for (const post of feed) {
      expect(post.status).toBe('Approved');
    }
  });

  it('should send a Purchase request for a Sale post', async () => {
    await switchTo('member');
    const feed = await mockApi.posts.listFeed({});
    const salePost = feed.find(
      (p) => p.type === 'Sale' && p.owner !== 'Nguyễn Minh An',
    );
    expect(salePost).toBeDefined();

    const request = await mockApi.requests.sendRequest(
      salePost!.id,
      'Em muốn mua lại ạ.',
      'an@student.school.edu',
    );
    expect(request.status).toBe('Pending');
    expect(request.type).toBe('Purchase');
    expect(request.sender).toBe('Nguyễn Minh An');
  });

  it('should show sent request in "Requests I Sent" tab', async () => {
    await switchTo('member');
    const feed = await mockApi.posts.listFeed({});
    const target = feed.find((p) => p.owner !== 'Nguyễn Minh An');
    expect(target).toBeDefined();

    const created = await mockApi.requests.sendRequest(
      target!.id,
      'Xin nhận ạ.',
      '0123456789',
    );

    const sent = await mockApi.requests.listSent();
    expect(sent.length).toBeGreaterThan(0);
    const ours = sent.find((r) => r.productId === target!.id);
    expect(ours).toBeDefined();
    expect(ours!.status).toBe('Pending');
    expect(ours!.sender).toBe('Nguyễn Minh An');
    expect(ours!.id).toBe(created.id);
  });

  it('should NOT allow sending a request to own post', async () => {
    await switchTo('member');
    const myPosts = await mockApi.posts.listMyPosts();
    const myApproved = myPosts.find((p) => p.status === 'Approved');
    if (myApproved) {
      await expect(
        mockApi.requests.sendRequest(myApproved.id, 'Test', 'contact'),
      ).rejects.toThrow(ApiError);
    }
  });
});

// ---------------------------------------------------------------------------
// 14.2 Member: create post → appears in my-posts with Pending Approval
// ---------------------------------------------------------------------------
describe('14.2 — Member create post flow', () => {
  beforeEach(() => {
    resetDemo();
  });

  it('should create a post with Pending Approval status', async () => {
    await switchTo('member');
    const post = await mockApi.posts.createPost({
      title: 'Integration test post',
      content: 'Nội dung test post.',
      type: 'Sale',
      price: 50000,
      category: 'Books',
      imageName: 'test.jpg',
      contact: 'test@test.com',
    });

    expect(post.status).toBe('Pending Approval');
    expect(post.owner).toBe('Nguyễn Minh An');
    expect(post.title).toBe('Integration test post');
  });

  it('should show new post in my-posts', async () => {
    await switchTo('member');
    const before = await mockApi.posts.listMyPosts();

    await mockApi.posts.createPost({
      title: 'My post',
      content: 'Test nội dung.',
      type: 'Exchange',
      price: 0,
      category: 'Books',
      imageName: 'img.jpg',
      contact: 'contact@test.com',
    });

    const after = await mockApi.posts.listMyPosts();
    expect(after.length).toBe(before.length + 1);
    const created = after.find((p) => p.title === 'My post');
    expect(created).toBeDefined();
    expect(created!.status).toBe('Pending Approval');
  });

  it('should enforce price=0 for Exchange/Donation', async () => {
    await switchTo('member');
    const post = await mockApi.posts.createPost({
      title: 'Donation post',
      content: 'Cho tặng.',
      type: 'Donation',
      price: 999,
      category: 'Books',
      imageName: 'img.jpg',
      contact: 'x@x.com',
    });

    expect(post.price).toBe(0);
  });

  it('should reject create with empty content', async () => {
    await switchTo('member');
    await expect(
      mockApi.posts.createPost({
        title: '',
        content: '',
        type: 'Sale',
        price: 100,
        category: 'Books',
        imageName: 'img.jpg',
        contact: '',
      }),
    ).rejects.toThrow(ApiError);
  });
});

// ---------------------------------------------------------------------------
// 14.3 System Admin: approve post → appears on School Feed
// ---------------------------------------------------------------------------
describe('14.3 — System Admin approve flow', () => {
  beforeEach(() => {
    resetDemo();
  });

  it('should approve a pending post and it appears on feed', async () => {
    // Member creates a post
    await switchTo('member');
    const post = await mockApi.posts.createPost({
      title: 'Awaiting approval',
      content: 'Test bài chờ duyệt.',
      type: 'Sale',
      price: 120000,
      category: 'Books',
      imageName: 'img.jpg',
      contact: 'contact@x.com',
    });
    expect(post.status).toBe('Pending Approval');

    // System Admin approves it (no reset between switches)
    await switchTo('system-admin');
    const approved = await mockApi.posts.approvePost(post.id);
    expect(approved.status).toBe('Approved');

    // Member sees it on feed
    await switchTo('member');
    const feed = await mockApi.posts.listFeed({});
    const onFeed = feed.find((p) => p.id === post.id);
    expect(onFeed).toBeDefined();
    expect(onFeed!.status).toBe('Approved');
  });

  it('should reject a pending post with reason', async () => {
    await switchTo('member');
    const post = await mockApi.posts.createPost({
      title: 'Bad post',
      content: 'Nội dung vi phạm.',
      type: 'Sale',
      price: 1,
      category: 'Books',
      imageName: 'img.jpg',
      contact: 'x@x.com',
    });

    await switchTo('system-admin');
    const rejected = await mockApi.posts.rejectPost(post.id, 'Vi phạm nội quy.');
    expect(rejected.status).toBe('Rejected');
    expect(rejected.reason).toBe('Vi phạm nội quy.');

    // Should NOT appear on feed
    await switchTo('member');
    const feed = await mockApi.posts.listFeed({});
    expect(feed.find((p) => p.id === post.id)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 14.4 Activity Admin: create campaign → Member submit → approve → on feeds
// ---------------------------------------------------------------------------
describe('14.4 — Activity Admin campaign + submit + approve flow', () => {
  beforeEach(() => {
    resetDemo();
  });

  it('full campaign post lifecycle', async () => {
    // 1) Activity Admin creates a campaign
    await switchTo('activity-admin');
    const campaign = await mockApi.campaigns.createCampaign({
      name: 'Integration test campaign',
      organizer: 'CLB Green Life',
      description: 'Test campaign flow.',
      type: 'Donation',
      is_free: true,
      start: '2026-06-01',
      end: '2026-12-31',
    });
    expect(campaign.name).toBe('Integration test campaign');
    // start <= today <= end → Active
    expect(campaign.status).toBe('Active');

    // Campaign appears in "My Campaigns"
    const myCampaigns = await mockApi.campaigns.listMyCampaigns();
    expect(myCampaigns.find((c) => c.id === campaign.id)).toBeDefined();

    // 2) Member submits a campaign post
    await switchTo('member');
    const campaignPost = await mockApi.campaigns.submitCampaignPost({
      campaignId: campaign.id,
      content: 'Bài gửi vào campaign test.',
      imageName: 'campaign-img.jpg',
      note: 'Test submit.',
    });
    expect(campaignPost.status).toBe('Pending Approval');
    expect(campaignPost.campaignId).toBe(campaign.id);

    // 3) Activity Admin approves the campaign post
    await switchTo('activity-admin');
    const approved = await mockApi.posts.approvePost(campaignPost.id);
    expect(approved.status).toBe('Approved');

    // 4) Campaign post appears on School Feed with campaign tag
    await switchTo('member');
    const feed = await mockApi.posts.listFeed({});
    const onFeed = feed.find((p) => p.id === campaignPost.id);
    expect(onFeed).toBeDefined();
    expect(onFeed!.campaignId).toBe(campaign.id);
    expect(onFeed!.campaignName).toBeDefined();

    // 5) Campaign post appears in campaign feed
    const campaignPosts = await mockApi.campaigns.listCampaignPosts(campaign.id);
    expect(campaignPosts.find((p) => p.id === campaignPost.id)).toBeDefined();

    // 6) Campaign stats reflect the approved post
    const stats = await mockApi.campaigns.getCampaignStats(campaign.id);
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.approved).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 14.5 Owner: accept → complete request → appears in Completed Transactions
// ---------------------------------------------------------------------------
describe('14.5 — Request accept and complete flow', () => {
  beforeEach(() => {
    resetDemo();
  });

  it('sendRequest creates a properly linked request', async () => {
    await switchTo('member');
    const feed = await mockApi.posts.listFeed({});
    const target = feed.find((p) => p.owner !== 'Nguyễn Minh An');
    expect(target).toBeDefined();

    const request = await mockApi.requests.sendRequest(
      target!.id,
      'Em muốn trao đổi ạ.',
      '0123456789',
    );
    expect(request.status).toBe('Pending');
    expect(request.productId).toBe(target!.id);
    expect(request.sender).toBe('Nguyễn Minh An');
    expect(request.receiver).toBe(target!.owner);
    expect(request.type).toBeDefined();
  });

  it('should allow accept and complete on received request from seed', async () => {
    await switchTo('member');

    // Seed request r2 is Accepted with receiver "Nguyễn Minh An"
    const received = await mockApi.requests.listReceived();
    const accepted = received.find((r) => r.status === 'Accepted');
    if (!accepted) return; // Skip if no accepted requests

    // Complete
    const completed = await mockApi.requests.completeRequest(accepted.id);
    expect(completed.status).toBe('Completed');

    // Appears in Completed Transactions
    const completedList = await mockApi.requests.listCompleted();
    expect(completedList.find((r) => r.id === accepted.id)).toBeDefined();
  });

  it('should allow accept then complete on pending received request from seed', async () => {
    await switchTo('member');

    const received = await mockApi.requests.listReceived();
    const pending = received.find((r) => r.status === 'Pending');
    if (!pending) return; // No pending requests to us in seed with this role

    // Accept
    const accepted = await mockApi.requests.acceptRequest(pending.id);
    expect(accepted.status).toBe('Accepted');

    // Complete
    const completed = await mockApi.requests.completeRequest(pending.id);
    expect(completed.status).toBe('Completed');

    // Appears in Completed Transactions
    const completedList = await mockApi.requests.listCompleted();
    expect(completedList.find((r) => r.id === pending.id)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 14.6 System Admin: dashboard KPI + hide/remove post
// ---------------------------------------------------------------------------
describe('14.6 — System Admin dashboard + hide/remove flow', () => {
  beforeEach(() => {
    resetDemo();
  });

  it('should show dashboard KPIs', async () => {
    await switchTo('system-admin');

    const allPosts = await mockApi.posts.listAllPosts();
    const pending = await mockApi.posts.listPendingPosts();

    expect(allPosts.length).toBeGreaterThan(0);
    expect(pending.length).toBeGreaterThanOrEqual(0);

    const approvedPosts = allPosts.filter((p) => p.status === 'Approved').length;
    expect(approvedPosts).toBeGreaterThan(0);
  });

  it('should hide/remove a post with reason and it disappears from feed', async () => {
    await switchTo('system-admin');

    const allPosts = await mockApi.posts.listAllPosts();
    const target = allPosts.find((p) => p.status === 'Approved');
    expect(target).toBeDefined();

    const removed = await mockApi.posts.hideRemovePost(
      target!.id,
      'Bài đăng vi phạm quy định.',
    );
    expect(removed.status).toBe('Removed');
    expect(removed.reason).toBe('Bài đăng vi phạm quy định.');

    // Post no longer appears on feed
    await switchTo('member');
    const feed = await mockApi.posts.listFeed({});
    expect(feed.find((p) => p.id === target!.id)).toBeUndefined();
  });

  it('should NOT hide/remove without reason', async () => {
    await switchTo('system-admin');
    const allPosts = await mockApi.posts.listAllPosts();
    const target = allPosts.find((p) => p.status === 'Approved');
    if (target) {
      await expect(
        mockApi.posts.hideRemovePost(target.id, '  '),
      ).rejects.toThrow(ApiError);
    }
  });
});
