import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apierror.js';
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js';
import  Jwt  from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config({path: "./.env"})


const generateAcessTokenAndRefreshTokens = async(userID)=> {
    try {
        const user =  await User.findById(userID)
        const acessToken =  user.generateAcessToken()
        const refreshToken = user.generateRefreshTokens()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {acessToken , refreshToken}
    }
    catch (error) {
        throw new ApiError(500 , "something went wrong while generating tokens")
        
    }
}



const registerUser = asyncHandler(async (req,res) => {
    // get user details from frontend
    // validation
    // check if user already exist
    // check for images, check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {fullname , email , username , password } = req.body 
    console.log( "email: " , email);

      if(
        [fullname, email , username , password].some((field) => field?.trim() === "")
        ) 
        {
            throw new ApiError(400 , "All fields are required")
        }
    
    const userExisted = await User.findOne({
        $or: [{username},{email}]
    })
    if(userExisted) {
        throw new ApiError(409, "User with email or username laready exists")
    }
    console.log("req.files =>", req.files);
   console.log("req.body =>", req.body);

    const avatarLocalPath = await req.files?.avatar[0]?.path;
    
    let coverImageLocalPath ;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatarlocalpath file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath) 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400 , "Avatar file failed to uplaod on cloudinary" )
    }

   const user = await User.create({
       fullname, 
       avatar: avatar.url,
       coverImage: coverImage?.url|| "",
       email,
       password,
       username : username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser) {
        throw new ApiError(500, "something went wrong while registring")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser ,"user registered successfully")
    )
})

const loginUser = asyncHandler(async (req,res) => {
    // req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    // send cookie
    const {email , username , password} = req.body

    if(!username && !email) {
        throw new ApiError(400 , "username or email is required")
    }
    const user = await User.findOne({
        $or : [{username} , {email}]
    })
    if(!user) {
        throw new ApiError(404 , "user not found")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(401 , "Invalid user credentials")
    }
    const {acessToken , refreshToken} = await generateAcessTokenAndRefreshTokens(user._id) 

    const loggedInuser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200)
    .cookie("acessToken", acessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInuser , acessToken , refreshToken

            },
            "User logged in successfully"
        )
    )


})
const logoutUser = asyncHandler(async(req,res)=>{
    
    await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"))
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken = Jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if(!user) {
            throw new ApiError(401,"Invalid refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"refresh token is expired or used")
        }
        const options = {
            httpOnly : true,
            secure : true
        }
        const {accessToken , newrefreshToken} = await generateAcessTokenAndRefreshTokens(user._id)
        return res.status(200).cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken, options).json(
            new ApiResponse(
                200,{accessToken, refreshToken:newrefreshToken},
                "Accesstoken refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message||"invalid refresh token")
    }
})
export {registerUser, loginUser , logoutUser , refreshAccessToken}