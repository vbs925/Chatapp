import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

//SignUP

export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;
    console.log("Signup Request Body:", req.body); // Debug log

    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "missing details" })
        }

        const normalizedEmail = email.toLowerCase();
        console.log("Normalized Email:", normalizedEmail); // Debug log

        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            return res.json({ success: false, message: `Account already exists with email: ${normalizedEmail}` })
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName, email: normalizedEmail, password: hashedPassword, bio
        });
        await newUser.save();
        const token = generateToken(newUser._id)

        res.json({ success: true, userData: newUser, token, message: "Account created successfully" })


    } catch (error) {
        console.log(error.message);
        if (error.code === 11000) {
            // Check if error.keyValue exists and log it
            console.log("Duplicate key error:", error.keyValue);
            return res.json({ success: false, message: "Email already in use (Duplicate Key Error)" });
        }
        res.json({ success: false, message: error.message })
    }
}
// Controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email?.toLowerCase() })

        if (!userData) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid credentials" });

        }
        const token = generateToken(userData._id)
        res.json({ success: true, userData, token, message: "Login successfully" })


    } catch (error) {
        console.log(error.message);

        res.json({ success: false, message: error.message })

    }
}

//Controller to check if the user is authenticated 

export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user });
}

// Controller to update user profile 
export const updateProfile = async (req, res) => {
    try {
        const { fullName, profilePic, bio } = req.body;

        const userID = req.user._id;
        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userID, { bio, fullName },
                { new: true });
        } else {
            const upload = await cloudinary.uploader.upload(profilePic);

            updatedUser = await User.findByIdAndUpdate(userID, { profilePic: upload.secure_url, bio, fullName }, { new: true });

        }
        res.json({ success: true, user: updatedUser })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })


    }
}


