import fs from "fs";
import path from "path";
import { Vendor, VendorWallet } from "../models";
import { sequelize } from "../../../common/db/postgres";
import { Transaction } from "sequelize";
import bcrypt from "bcrypt";

async function migrateVendor() {
    const dataPath = path.join(__dirname, "../data/silver-vendor.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const vendors = JSON.parse(raw);

    const minVendor = vendors
    console.log("min Vendor >> ", minVendor.length)
    let failedVendor = []
    for (const v of minVendor) {
        try {
            await sequelize.transaction(async (t: Transaction) => {
                let cleanedPhone = v.vendorPhone.replace(/^\+?91|\D/g, '');
                const hashedPassword = await bcrypt.hash(v.vendorPassword, 10);

                // // Create vendor
                // const newVendor = await Vendor.create({
                //     adminId: "admin-1",
                //     name: v.vendorName,
                //     email: hashedPassword.slice(0, 10),
                //     phone: cleanedPhone,
                //     password: hashedPassword,
                //     remark: "",
                //     isLogin: true,
                //     totalEarnings: String(Math.ceil(v.totalAmountEarned) || 0)
                // }, { transaction: t });

                // newVendor.vendorId = `SLTV${cleanedPhone.slice(5, 10)}${newVendor.id}`;
                // await newVendor.save({ transaction: t });

                // // Create wallet
                // const wallet = await VendorWallet.create({
                //     adminId: newVendor.adminId,
                //     vendorId: newVendor.vendorId,
                //     balance: 0,
                //     startAmount: 0,
                // }, { transaction: t });

                // wallet.walletId = `wlt-${wallet.id}`;
                // await wallet.save({ transaction: t });

                // // Link wallet back to vendor
                // newVendor.walletId = wallet.walletId;
                // await newVendor.save({ transaction: t });


                //update vendor website
                const vendor = await Vendor.findOne({ where: { phone: cleanedPhone }, transaction: t });
                if (!vendor) {
                    failedVendor.push(v)
                    console.error(`❌ Vendor not found for phone ${cleanedPhone}`);
                    return;
                }

                await vendor.update({
                    website: v.vendorWebsite || "",
                })
            });

            console.log(`✅ Migrated vendor ${v.vendorName}`);
        } catch (err: any) {
            failedVendor.push(v)
            console.error(`❌ Error migrating vendor ${v.id}:`, err.message);
        }
    }
    
    
    fs.writeFileSync(path.join(__dirname, "../data/failedVendors.json"), JSON.stringify(failedVendor, null, 2));
    console.log("✅ Vendor Migration completed!");
}

migrateVendor().then(() => process.exit())