import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    server: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server',
        required: true
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    }
}, { timestamps: true });

// Pre-save middleware to trim the content field before saving the message document
messageSchema.pre('save', function (next) {
    this.content = this.content.trim();
    next();
});

messageSchema.index({ channel: 1, _id: -1 });

export default mongoose.model('Message', messageSchema);
