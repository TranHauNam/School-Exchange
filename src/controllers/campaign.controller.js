const Campaign = require('../models/Campaign');

exports.createCampaign = async (req, res) => {
  const campaign = await Campaign.create({ ...req.body, organizerId: req.user._id });
  res.status(201).json(campaign);
};

exports.getCampaigns = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.campaignStatus = req.query.status;
  if (req.query.type) filter.campaignType = req.query.type;
  const campaigns = await Campaign.find(filter)
    .populate('organizerId', 'fullName email role organizationName')
    .sort({ createdAt: -1 });
  res.json(campaigns);
};

exports.getCampaignById = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).populate('organizerId', 'fullName email role organizationName');
  if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
  res.json(campaign);
};

exports.updateCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
  if (campaign.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'You cannot update this campaign' });
  }
  Object.assign(campaign, req.body);
  await campaign.save();
  res.json(campaign);
};

exports.deleteCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
  if (campaign.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'You cannot cancel this campaign' });
  }
  campaign.campaignStatus = 'cancelled';
  await campaign.save();
  res.json({ message: 'Campaign cancelled', campaign });
};
