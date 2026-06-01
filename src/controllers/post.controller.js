const Post = require("../models/Post");
const Item = require("../models/Item");

exports.createPost = async (req, res) => {
  try {
    const { title, description, postType, items = [] } = req.body;

    if (!title || !postType) {
      return res.status(400).json({
        message: "Title and postType are required"
      });
    }

    if (!items.length) {
      return res.status(400).json({
        message: "At least one item is required"
      });
    }

    const post = await Post.create({
      memberId: req.user._id,
      title,
      description,
      postType,
      postStatus: "pending"
    });

    const createdItems = await Item.insertMany(
      items.map((item) => ({
        postId: post._id,
        categoryId: item.categoryId,
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        condition: item.condition,
        price: item.price || 0,
        imageUrl: item.imageUrl || [],
        itemStatus: "available"
      }))
    );

    res.status(201).json({
      message: "Post created successfully",
      post,
      items: createdItems
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.postStatus = req.query.status;
    if (req.query.type) filter.postType = req.query.type;

    const posts = await Post.find(filter)
      .populate("memberId", "fullName email role")
      .populate("moderatorId", "fullName email role")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getApprovedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ postStatus: "approved" })
      .populate("memberId", "fullName email")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ memberId: req.user._id }).sort({
      createdAt: -1
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "memberId",
      "fullName email"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const items = await Item.find({ postId: post._id }).populate(
      "categoryId",
      "categoryName"
    );

    res.json({ post, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (
      post.memberId.toString() !== req.user._id.toString() &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        message: "You cannot update this post"
      });
    }

    const { title, description, postType } = req.body;

    if (title !== undefined) post.title = title;
    if (description !== undefined) post.description = description;
    if (postType !== undefined) post.postType = postType;

    if (req.user.role === "member") {
      post.postStatus = "pending";
      post.moderatorId = null;
      post.rejectReason = null;
    }

    await post.save();

    res.json({
      message: "Post updated successfully",
      post
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (
      post.memberId.toString() !== req.user._id.toString() &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        message: "You cannot delete this post"
      });
    }

    post.postStatus = "hidden";
    await post.save();

    await Item.updateMany(
      { postId: post._id },
      { itemStatus: "hidden" }
    );

    res.json({
      message: "Post hidden",
      post
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.moderatePost = async (req, res) => {
  try {
    const { postStatus, rejectReason } = req.body;

    if (!["approved", "rejected", "hidden"].includes(postStatus)) {
      return res.status(400).json({
        message: "Invalid postStatus"
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    post.postStatus = postStatus;
    post.moderatorId = req.user._id;
    post.rejectReason =
      postStatus === "rejected" ? rejectReason || "" : null;

    await post.save();

    res.json({
      message: "Post moderated successfully",
      post
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};