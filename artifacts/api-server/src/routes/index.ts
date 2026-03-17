import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import projectsRouter from "./projects.js";
import economyRouter from "./economy.js";
import marketplaceRouter from "./marketplace.js";
import accountRouter from "./account.js";
import adminRouter from "./admin.js";
import chatRouter from "./chat.js";

const router: IRouter = Router();

router.use(healthRouter);

// All BeraPanel routes under /brucepanel/*
router.use("/brucepanel", authRouter);
router.use("/brucepanel", projectsRouter);
router.use("/brucepanel", economyRouter);
router.use("/brucepanel", marketplaceRouter);
router.use("/brucepanel", accountRouter);
router.use("/brucepanel/admin", adminRouter);
router.use("/brucepanel", chatRouter);

export default router;
