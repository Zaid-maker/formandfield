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
        required: true
    },
    type: {
        type: String,
        enum: ['text'],
        default: 'text',
        required: true
    }
}, { timestamps: true });

// Pre-save middleware to set the name field before saving the channel document
channelSchema.pre('save', function (next) {
    this.name = this.name.trim().toLowerCase();
    next();
});

//indexes
channelSchema.index({ server: 1, name: 1 }, { unique: true });
channelSchema.index({ server: 1, createdAt: 1, _id: 1 });

export default mongoose.model('Channel', channelSchema);
