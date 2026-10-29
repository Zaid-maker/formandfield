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

export default mongoose.model('Server', serverSchema);
