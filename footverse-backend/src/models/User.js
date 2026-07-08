import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },      // Home / Work / Other
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    line1: { type: String, default: "" },
    line2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pin: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" }, // base64 data URL or remote URL

    addresses: [AddressSchema],

    isVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    resetTokenHash: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};
UserSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
UserSchema.methods.toSafe = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    addresses: this.addresses || [],
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", UserSchema);