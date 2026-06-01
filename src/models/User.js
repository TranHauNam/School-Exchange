const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, unique: true, sparse: true},
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['member', 'super_admin', 'activity_admin'], default: 'member' },
  userType: { type: String, enum: ['student', 'teacher', 'school_staff', 'club', 'student_union'], default: 'student' },
  organizationName: { type: String, default: null },
  accountStatus: { type: String, enum: ['active', 'locked'], default: 'active' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
