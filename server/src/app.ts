import cookieParser from "cookie-parser";
import express from "express";
import { storageRoutes } from "./features/storage/storageRoutes";
import { authRoutes } from "./features/auth/authRoutes";

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/storage", storageRoutes);
app.use("/api/auth", authRoutes);
