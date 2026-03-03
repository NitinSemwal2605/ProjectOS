import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        attachments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "File",
            },
        ],

        editedAt: {
            type: Date,
            default: null,
        },

        deletedAt: {
            type: Date,
            default: null,
            index: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false }, }
);

export default mongoose.model("Message", messageSchema);