const User = require('../models/User');

exports.getMembers = async (req, res) => {
  const members = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(members);
};

exports.getMemberById = async (req, res) => {
  const member = await User.findById(req.params.id).select('-password');
  if (!member) return res.status(404).json({ message: 'Member not found' });
  res.json(member);
};

exports.updateMemberRole = async (req, res) => {
  const { role, userType, organizationName } = req.body;
  const member = await User.findByIdAndUpdate(
    req.params.id,
    { role, userType, organizationName },
    { new: true, runValidators: true }
  ).select('-password');
  if (!member) return res.status(404).json({ message: 'Member not found' });
  res.json(member);
};

exports.updateMemberStatus = async (req, res) => {
  const { accountStatus } = req.body;
  const member = await User.findByIdAndUpdate(
    req.params.id,
    { accountStatus },
    { new: true, runValidators: true }
  ).select('-password');
  if (!member) return res.status(404).json({ message: 'Member not found' });
  res.json(member);
};
