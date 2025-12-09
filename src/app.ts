import express, { Request, Response, NextFunction } from 'express';
import { auth, websiteAuth, appAuth, customerApp, vendorApp } from './common/middleware/auth';
import { logger } from './utils/logger';
import adminRouter from './v1/admin/router';
import websiteRouter from './v1/website/routers/website.route';
import customerRouter from './v1/apps/customer/routes/index.route';
import vendorRouter from './v1/apps/vendor/routes/index.route';
import authRouter from './v1/admin/router/authRouter';
import cors from 'cors'
import globalRouter from "./v1/public//router/common.route";
import env from './utils/env';
import appRouter from './v1/apps/driver/routers/index.route'
import { Readable } from 'stream';
import { razorpayWebhook } from './v1/webhook/razorpayWebhook';

const app = express();


// ✅ Webhook route with raw body — place before any express.json() middleware
app.post("/api/razorpay/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(async (req: Request, res: Response, next: NextFunction) => {
    const { customAlphabet } = await import('nanoid');
    const id = customAlphabet('1234567890abcdef', 4)();

    const startTime = Date.now();

    logger.info(`Incoming request:[${id}] ${req.method} ${req.originalUrl}`);

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        logger.info(
            `Request Completed:[${id}] ${req.method} ${req.originalUrl} ` +
            `Status: ${res.statusCode} Duration: ${duration}ms`
        );
    });

    next();
});


// Encourage clients to reuse connections
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Connection', 'keep-alive');
    next();
});

// 🔥 Health checks for Kubernetes
app.get("/health/ready", (_req: Request, res: Response) => {
    // You can later add Redis/DB checks if needed
    res.status(200).send("READY");
});

app.get("/health/startup", (_req: Request, res: Response) => {
    res.status(200).send("STARTED");
});

app.get("/health/live", (_req: Request, res: Response) => {
    res.status(200).send("LIVE");
});


app.get('/', async (_req: Request, res: Response) => {
    res.send('Hello World! in TypeScript');
})

app.use(cors({
    origin: '*',
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization", "x-domain"],
    maxAge: 3600,
}));

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Global Error Handled :", err.message);
    res.status(500).json({
        success: false,
        message: err.message || "Something went wrong"
    });
});


app.use("/image/v1", async (req, res) => {
    try {
        const fileKey = req.path.replace(/^\//, ""); // remove leading slash if any
        const fileUrl = `${env.DO_BUCKET_ENDPOINT}/${env.DO_BUCKET_NAME}/${fileKey}`;

        const fetchResponse = await fetch(fileUrl);
        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ message: "File not found" });
        }

        // Stream image back to client
        const contentType = fetchResponse.headers.get("content-type") || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        //@ts-ignore
        Readable.fromWeb(fetchResponse.body).pipe(res);
    } catch (error) {
        console.error("❌ Error fetching image:", error);
        res.status(500).json({ message: "Error fetching image" });
    }
});

app.use('/auth', authRouter)

app.use('/global', globalRouter)

app.use("/app", appRouter)

//Customer App API's
app.use("/customer", customerApp, customerRouter)

//Vendor App API's
app.use("/vendor", vendorApp, vendorRouter)

// app.use('/*', websiteAuth)
app.use('/website', websiteAuth, websiteRouter)
// app.use('/website', websiteRouter)

// app.use('/*', auth);
app.use('/v1', auth, adminRouter)


app.use('/*', (_req: Request, res: Response) => {
    res.status(404).send('NOt Found');
})

export default app
