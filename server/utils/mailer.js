import nodemailer from "nodemailer"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { ApiError } from "./ApiError.js"

export const sendEmail= async({email, emailType, userId})=>{
    try {
        // Create a hashed token
        const hashedToken = await bcrypt.hash(userId.toString(), 10);


        if (emailType === "VERIFY") {
            await User.findByIdAndUpdate(userId, {
                verifyToken: hashedToken,
                verifyTokenExpiry: Date.now() + 3600000, // 1 hour expiry
            });
        } else if (emailType === "FORGOT_PASSWORD") {
            await User.findByIdAndUpdate(userId, {
                forgotPasswordToken: hashedToken,
                forgotPasswordTokenExpiry: Date.now() + 3600000, // 1 hour expiry
            });
        }

        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
            tls: {
                rejectUnauthorized: false,
            }
        });

        // Use encodeURIComponent to ensure the token is correctly formatted in the URL
        const encodedToken = (hashedToken);

        const mailOptions = {
            from: process.env.USER,
            to: email,
            subject: emailType === "VERIFY" ? "Verify your email" : "Reset your password",
            html: `<p>Click <a href="${process.env.DOMAIN}/components/${emailType === "VERIFY" ? "verifyemail" : "resetPassword"}?token=${encodedToken}">here</a> to ${
                emailType === "VERIFY" ? "verify your email" : "reset your password"
            } or copy and paste the link below in your browser. <br> 
            ${process.env.DOMAIN}/components/${emailType === "VERIFY" ? "verifyemail" : "resetPassword"}?token=${encodedToken}
            </p>`,
        };

        const mailResponse = await transport.sendMail(mailOptions);
        console.log("Mail sent");
        return mailResponse;
    } catch (error) {
        console.log(error);
        throw new ApiError(500, error.message);
    }
}