import request from "supertest"
import User from "../models/user.model";
import { app } from "../app.js";
import * as emailUtil from "../utils/mailer.js";
import * as cloudUtil from "../utils/cloudinary.js";

jest.mock("../utils/mailer.js");
jest.mock("../utils/cloudinary.js");

describe("POST /api/v1/users/register", () => {
    beforeEach(async () => {
        await User.deleteMany();
        emailUtil.sendEmail.mockResolvedValue(true);
        cloudUtil.uploadOnCloudinary.mockResolvedValue({
            url: "http://fake-url"
        });
    })

    it("should fail if fields are missing", async () => {
        const res = await request(app)
            .post("/api/v1/users/register")
            .send({
                name: "",
                email: "test@example.com",
                password: "1234",
                confirm_password: "1234",
            });


        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("All fields are required");
    })

    it("should register a new user", async () =>{
        const res = await request(app)
            .post("/api/v1/users/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "1234",
                confirm_password: "1234",
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("Verification link sent successfully, Please verify your email!");
        expect(res.body.data.name).toBe("Test User");
        expect(res.body.data.email).toBe("test@example.com");
        expect(res.body.data.avatar).toBe("");
        expect(res.body.data.isVerified).toBe(false);
    })

    it("should fail if passwords don't match", async ()=>{
        const res = await request(app)
            .post("/api/v1/users/register")
            .send({
                name: "Test User 2",
                email: "test2@example.com",
                password: "1234",
                confirm_password: "12345",
            });
            console.log("password don't match", res.body);
        expect(res.statusCode).toBe(409);
        expect(res.body.message).toBe("Passwords don't match");
    })
})