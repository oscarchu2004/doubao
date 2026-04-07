const User = require("../models/User")
const { v4: uuidv4 } = require('uuid');

const userController = {
    getUserProfile: async (req, res) =>{
        try{
            console.log(req.user.id);
            const user = await User.findById(req.user.id);

            if (!user){
                return res.status(404).json({error: "User not found"});
            }
            res.status(200).json({
                user:{
                    userId:user.id,
                    email:user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    createAt: user.createdAt,
                    lastLogin: user.lastLogin,
                }
            });
        }catch (error){
            console.error(error);
            res.status(500).json({error: "Internal sv error"});
        }
    }
};

module.exports = userController;