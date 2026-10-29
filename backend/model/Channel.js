import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 80
    },
    server: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['text'],
        default: 'text',
        required: true
    }
}, { timestamps: true });

channelSchema.index({ server: 1, name: 1 }, { unique: true });

export default mongoose.model('Channel', channelSchema);
