import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import workersRouter from "./workers";
import policiesRouter from "./policies";
import claimsRouter from "./claims";
import triggersRouter from "./triggers";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/workers", workersRouter);
router.use("/policies", policiesRouter);
router.use("/claims", claimsRouter);
router.use("/triggers", triggersRouter);
router.use("/admin", adminRouter);

export default router;
