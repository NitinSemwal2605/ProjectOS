import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },

        passwordHash: {
            type: String,
            required: true,
        },

        provider: {
            type: String,
            enum: ["local", "google", "github"],
            default: "local",
        },

        lastActiveAt: {
            type: Date,
            default: Date.now,
        },

        isAdmin: {
            type: Boolean,
            default: false,
            index: true,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false }, }
);

export default mongoose.model("User", userSchema);