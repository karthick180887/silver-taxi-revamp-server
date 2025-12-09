import z from "zod";

export const FormSchema = z.object({
    // title: z.string().default(""),
    fields: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.string(),
        placeholder: z.string(),
        required: z.boolean().default(false),
    })).default([]),
    submitText: z.string().default(""),
    tabs: z.array(z.enum(['Outstation', 'Airport', 'Hourly Rental', ""]).default("")).default([])
}).default({
    fields: [],
    submitText: "",
    tabs: []
});

export const ClientSchema = z.object({
    Name: z.string().default(""),
    imageURL: z.string().default(""),
    CSS: z.object({
        primary: z.string().default("#0056b3"),
        secondary: z.string().default("#007BFF"),
    }).default({
        primary: "#0056b3",
        secondary: "#007BFF"
    }),

}).default({
    Name: "",
    imageURL: "",
    CSS: {
        primary: "#0056b3",
        secondary: "#007BFF"
    }
});

export const DriversSchema = z.object({
    driverId: z.string().default(""),
    adminId: z.string().default(""),
    name: z.string().default(""),
    phone: z.string().default(""),
    adminVerified: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
    fcmToken: z.string().default(""),
    walletId: z.string().default(""),
    geoLocation: z.object({
        latitude: z.number().default(0),
        longitude: z.number().default(0),
        timestamp: z.union([z.string(), z.date(), z.null()]).transform((val) => {
            if (val === null || val === undefined || val === "") {
                return new Date().toISOString();
            }
            if (typeof val === 'string') {
                return val;
            }
            return val instanceof Date ? val.toISOString() : new Date().toISOString();
        }).default(new Date().toISOString()),
    }).nullable().default(null),
    isActive: z.boolean().default(true),
}).default({
    driverId: "",
    adminId: "",
    name: "",
    phone: "",
    adminVerified: "Pending",
    fcmToken: "",
    walletId: "",
    geoLocation: null,
    isActive: true,
});


// Reusable CRUD permission object
const crudSchema = z.object({
    isC: z.boolean().default(false),
    isR: z.boolean().default(false),
    isU: z.boolean().default(false),
    isD: z.boolean().default(false),
}).default({
    isC: false,
    isR: false,
    isU: false,
    isD: false,
});

// Union of boolean or CRUD object
const permissionSchema = z.union([z.boolean().default(false), crudSchema]).default(false);

export const tenantSchema = z.object({
    isDashBoard: z.boolean().default(false),
    isEnquiry: permissionSchema,
    isBooking: permissionSchema,
    isCustomers: permissionSchema,
    isDrivers: permissionSchema,
    isVendors: permissionSchema,
    isAvailableService: z.object({
        isOneWay: z.boolean().default(false),
        isRoundTrip: z.boolean().default(false),
        isAirportPickup: z.boolean().default(false),
        isAirportDrop: z.boolean().default(false),
        isDayPackage: z.boolean().default(false),
        isHourlyPackage: z.boolean().default(false),
    }).default({
        isOneWay: false,
        isRoundTrip: false,
        isAirportPickup: false,
        isAirportDrop: false,
        isDayPackage: false,
        isHourlyPackage: false,
    }),
    isService: permissionSchema,
    isServicePricing: permissionSchema,
    isVehicles: permissionSchema,
    isAllIncludes: permissionSchema,
    isCompanyProfile: permissionSchema,
    isInvoice: permissionSchema,
    isBlog: permissionSchema,
    isDynamicRoutes: permissionSchema,
    isPopularRoutes: permissionSchema,
    isOffers: permissionSchema,
    isPaymentTransaction: permissionSchema,
});