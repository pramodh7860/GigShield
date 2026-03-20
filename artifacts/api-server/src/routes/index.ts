import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import workersRouter from "./workers";
import policiesRouter from "./policies";
import claimsRouter from "./claims";
import triggersRouter from "./triggers";
import adminRouter from "./admin";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/workers", workersRouter);
router.use("/policies", policiesRouter);
router.use("/claims", claimsRouter);
router.use("/triggers", triggersRouter);
router.use("/admin", adminRouter);
router.use("/payments", paymentsRouter);

export default router;
