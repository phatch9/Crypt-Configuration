const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getSecret } = require('../services/secretsService');

// Generating token is now async because fetching secret is async
const generateToken = async (id) => {
    const secret = await getSecret('JWT_SECRET');
    return jwt.sign({ id }, secret, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            username,
            password,
        });

        if (user) {
            // Await the token generation
            const token = await generateToken(user._id);
            res.status(201).json({
                _id: user._id,
                username: user.username,
                token: token,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const authUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            // Await the token generation
            const token = await generateToken(user._id);
            res.json({
                _id: user._id,
                username: user.username,
                token: token,
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, authUser };
