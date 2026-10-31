import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
    server: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'member'],
        default: 'owner',
        required: true
    }
}, { timestamps: true });

// Pre-save middleware to set the role field before saving the membership document
membershipSchema.pre('save', function (next) {
    if (!this.role) {
        this.role = 'owner';
    }
    next();
});

// indexes
membershipSchema.index({ server: 1, user: 1 }, { unique: true });

export default mongoose.model('Membership', membershipSchema);
