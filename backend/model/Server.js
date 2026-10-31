import mongoose from 'mongoose';

const serverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    }
}, { timestamps: true });

// Pre-save middleware to set the name field before saving the server document
serverSchema.pre('save', function (next) {
    this.name = this.name.trim();
    next();
});

// indexes
serverSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('Server', serverSchema);
