import nodemailer from "nodemailer"
import User from "../models/user.model.js"
import bcrypt from "bcrypt"
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
        } else if (emailType === "RESET") {
            await User.findByIdAndUpdate(userId, {
                forgotPasswordToken: hashedToken,
                forgotPasswordTokenExpiry: Date.now() + 3600000, // 1 hour expiry
            });
        }

        const transport = nodemailer.createTransport({
            host: process.env.HOST,
            port: Number(process.env.MAIL_PORT),
            secure: Boolean(process.env.SECURE),
            service: process.env.SERVICE,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS,
            },
        });

        // Use encodeURIComponent to ensure the token is correctly formatted in the URL
        const encodedToken = (hashedToken);

        const mailOptions = {
            from: process.env.USER,
            to: email,
            subject: emailType === "VERIFY" ? "Verify your email" : "Reset your password",
            html: `<p>Click <a href="${process.env.DOMAIN}/components/verifyemail?token=${encodedToken}">here</a> to ${
                emailType === "VERIFY" ? "verify your email" : "reset your password"
            } or copy and paste the link below in your browser. <br> 
            ${process.env.DOMAIN}/components/verifyemail?token=${encodedToken}
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