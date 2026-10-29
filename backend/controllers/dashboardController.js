import mongoose from 'mongoose';
import Channel from '../model/Channel.js';
import Membership from '../model/Membership.js';
import Message from '../model/Message.js';
import Server from '../model/Server.js';

const defaultChannels = ['general', 'introductions', 'ideas', 'off-topic', 'show-and-tell'];

async function getOrCreatePrivateServer(user) {
    let server = await Server.findOne({ owner: user._id });
    if (server) {
        return server;
    }

    try {
        server = await Server.create({
            owner: user._id,
            name: `${user.firstName}'s space`
        });
    } catch (error) {
        if (error.code !== 11000) {
            throw error;
        }

        server = await Server.findOne({ owner: user._id });
        if (!server) {
            throw error;
        }
    }

    return server;
}

async function ensureWorkspace(server, user) {
    await Membership.updateOne(
        { server: server._id, user: user._id },
        { $setOnInsert: { role: 'owner' } },
        { upsert: true }
    );

    await Channel.bulkWrite(defaultChannels.map((name) => ({
        updateOne: {
            filter: { server: server._id, name },
            update: { $setOnInsert: { server: server._id, name, type: 'text' } },
            upsert: true
        }
    })));
}

async function getDashboard(req, res, next) {
    try {
        const server = await getOrCreatePrivateServer(req.user);
        await ensureWorkspace(server, req.user);
        const channels = await Channel.find({ server: server._id }).sort({ createdAt: 1, _id: 1 }).select('_id name type');

        return res.status(200).json({
            server: { id: server._id, name: server.name },
            channels: channels.map((channel) => ({
                id: channel._id,
                name: channel.name,
                type: channel.type
            })),
            user: {
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                username: req.user.username
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function getMessages(req, res, next) {
    try {
        const { channelId } = req.params;
        if (!mongoose.isValidObjectId(channelId)) {
            return res.status(400).json({ message: 'Invalid channel' });
        }

        const channel = await Channel.findById(channelId).select('_id server');
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        const membership = await Membership.findOne({ server: channel.server, user: req.user._id }).select('_id');
        if (!membership) {
            return res.status(403).json({ message: 'You do not have access to this channel' });
        }

        const { after } = req.query;
        if (after !== undefined && (typeof after !== 'string' || !mongoose.isValidObjectId(after))) {
            return res.status(400).json({ message: 'Invalid message cursor' });
        }

        let query = { channel: channel._id };
        let sort = { _id: -1 };
        if (after) {
            query._id = { $gt: new mongoose.Types.ObjectId(after) };
            sort = { _id: 1 };
        }

        let messages = await Message.find(query)
            .sort(sort)
            .limit(after ? 100 : 50)
            .populate('author', 'firstName lastName username')
            .lean();

        if (!after) {
            messages = messages.reverse();
        }

        return res.status(200).json({
            messages: messages.map((message) => ({
                id: message._id,
                content: message.content,
                createdAt: message.createdAt,
                author: {
                    id: message.author._id,
                    firstName: message.author.firstName,
                    lastName: message.author.lastName,
                    username: message.author.username
                }
            }))
        });
    } catch (error) {
        return next(error);
    }
}

async function createMessage(req, res, next) {
    try {
        const { channelId } = req.params;
        if (!mongoose.isValidObjectId(channelId)) {
            return res.status(400).json({ message: 'Invalid channel' });
        }

        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ message: 'Request body must be a JSON object' });
        }

        const { content } = req.body;
        if (typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: 'Write a message before sending' });
        }

        if (content.trim().length > 2000) {
            return res.status(400).json({ message: 'Messages can’t be longer than 2000 characters' });
        }

        const channel = await Channel.findById(channelId).select('_id server');
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        const membership = await Membership.findOne({ server: channel.server, user: req.user._id }).select('_id');
        if (!membership) {
            return res.status(403).json({ message: 'You do not have access to this channel' });
        }

        const message = await Message.create({
            server: channel.server,
            channel: channel._id,
            author: req.user._id,
            content: content.trim()
        });
        await message.populate('author', 'firstName lastName username');

        return res.status(201).json({
            message: {
                id: message._id,
                content: message.content,
                createdAt: message.createdAt,
                author: {
                    id: message.author._id,
                    firstName: message.author.firstName,
                    lastName: message.author.lastName,
                    username: message.author.username
                }
            }
        });
    } catch (error) {
        return next(error);
    }
}

export { createMessage, getDashboard, getMessages };
