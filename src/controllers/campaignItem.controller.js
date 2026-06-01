const CampaignItem = require('../models/CampaignItem');
const Campaign = require('../models/Campaign');
const Item = require('../models/Item');
const Post = require('../models/Post');

exports.addItemToCampaign = async (req, res) => {
  try {
    const { campaignId, itemId, description } = req.body;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.campaignStatus !== 'active') return res.status(404).json({ message: 'Active campaign not found' });

    const item = await Item.findById(itemId).populate('postId');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.postId.memberId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only add your own item' });
    }

    const campaignItem = await CampaignItem.create({ campaignId, itemId, memberId: req.user._id, description });
    res.status(201).json(campaignItem);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Item already joined this campaign' });
    res.status(400).json({ message: error.message });
  }
};

exports.getCampaignItems = async (req, res) => {
  const filter = {};
  if (req.query.campaignId) filter.campaignId = req.query.campaignId;
  if (req.query.status) filter.status = req.query.status;
  const campaignItems = await CampaignItem.find(filter)
    .populate('campaignId', 'campaignName campaignType campaignStatus')
    .populate('itemId')
    .populate('memberId', 'fullName email')
    .sort({ createdAt: -1 });
  res.json(campaignItems);
};

exports.updateCampaignItemStatus = async (req, res) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected', 'removed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const campaignItem = await CampaignItem.findById(req.params.id).populate('campaignId');
  if (!campaignItem) return res.status(404).json({ message: 'Campaign item not found' });

  const isOrganizer = campaignItem.campaignId.organizerId.toString() === req.user._id.toString();
  if (!isOrganizer && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Only campaign organizer can approve/reject' });
  }

  campaignItem.status = status;
  campaignItem.note = note || '';
  await campaignItem.save();
  res.json(campaignItem);
};
