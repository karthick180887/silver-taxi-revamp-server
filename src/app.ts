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
    res.send('Welcome to Golang based Cabigo API');
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
        let fileKey = req.path.replace(/^\//, ""); // remove leading slash if any

        // If fileKey doesn't start with "silver-taxi-images/", add it
        // This handles both old paths (without prefix) and new paths (with prefix)
        if (!fileKey.startsWith("silver-taxi-images/")) {
            fileKey = `silver-taxi-images/${fileKey}`;
        }

        // DigitalOcean Spaces URL format: https://{endpoint}/{folder}/{file}
        // The bucket name is part of the endpoint domain, not in the path
        const endpoint = env.DO_BUCKET_ENDPOINT || "silvertaxi.blr1.digitaloceanspaces.com";
        const cleanEndpoint = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const fileUrl = `https://${cleanEndpoint}/${fileKey}`;

        const fetchResponse = await fetch(fileUrl);
        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).json({ message: "File not found" });
        }

        // Stream image back to client with CORS headers
        const contentType = fetchResponse.headers.get("content-type") || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
        //@ts-ignore
        Readable.fromWeb(fetchResponse.body).pipe(res);
    } catch (error) {
        console.error("❌ Error fetching image:", error);
        res.status(500).json({ message: "Error fetching image" });
    }
});

// Module Loading Logic
const modules = (env.APP_MODULES || 'all').split(',');
const isEnabled = (m: string) => modules.includes('all') || modules.includes(m);

logger.info(`Active Modules: ${modules.join(', ')}`);

app.use('/auth', authRouter)

// Always load global routes? Or only if needed? Assuming global is needed for all.
app.use('/global', globalRouter)

if (isEnabled('driver')) {
    logger.info("Mounting Driver Routes");
    app.use("/app", appRouter)
}

if (isEnabled('customer')) {
    logger.info("Mounting Customer Routes");
    app.use("/customer", customerApp, customerRouter)
}

if (isEnabled('vendor')) {
    logger.info("Mounting Vendor Routes");
    app.use("/vendor", vendorApp, vendorRouter)
}

if (isEnabled('admin')) {
    logger.info("Mounting Admin & Website Routes");
    // app.use('/*', websiteAuth)
    app.use('/website', websiteAuth, websiteRouter)
    // app.use('/website', websiteRouter)

    // app.use('/*', auth);
    app.use(['/v1', '/', '/admin'], auth, adminRouter)
}


app.use('/*', (_req: Request, res: Response) => {
    res.status(404).send('NOt Found');
})

export default app
