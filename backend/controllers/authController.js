const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const userAuthController = {
    signupUser: async (req, res) => {
        try {
            const { email, password, firstName, lastName } = req.body;

            // check if email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: "Email already exists." });
            }

            // hash password
            const hashedPassword = await argon2.hash(password);

            // create a new user
            const user = await User.create({
                email,
                password: hashedPassword,
                firstName,
                lastName,
            });
            
            // const txHash = await blockchainService.registerGovernment(
            //     walletAddress,
            // );
            res.status(201).json({ message: "User account created successfully!", user });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    //login
    loginUser: async (req, res) => {
        try {
            const { email, password } = req.body;

            // find the user by email
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ error: "User account not found." });
            }

            // verify the password
            const isPasswordValid = await argon2.verify(user.password, password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: "Invalid password." });
            }

            // generate JWT
            const token = jwt.sign(
                { id: user.id, role: "user" },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            // set HttpOnly Cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // only true on production (HTTPS)
                sameSite: "Strict",
                maxAge: 60 * 60 * 1000, // 1 hour
            });

            res.status(200).json({
                message: "Login successful!",
                token,
                user: {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    //logout controller
    logoutUser: (req, res) => {
        res.clearCookie("token");
        res.status(200).json({ message: "Logged out successfully" });
    }
};

module.exports = userAuthController;
