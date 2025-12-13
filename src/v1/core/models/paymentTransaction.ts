import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../common/db/postgres";
import { Admin } from "./admin";

export interface PaymentTransactionAttributes {
    id: number;
    adminId: string;
    transactionId?: string;
    gatewayTransactionId: string;
    bankReferenceId: string;
 
    sender: "Vendor" | "Customer" | "Admin" | "Driver";

    senderId: string; 
    senderName: string; 
    senderContact: string; 

    receiverId: string; 
    receiverName: string; 
    receiverContact: string; 

    paymentMethod: string; 
    transactionType: "Credit" | "Debit"; 
    transactionAmount: number; 
    status: "Pending" | "Success" | "Failed"; 
    description: string; 

}


interface PaymentTransactionCreationAttributes extends Optional<PaymentTransactionAttributes, 'id'> { }


class PaymentTransaction 
    extends Model<PaymentTransactionAttributes, PaymentTransactionCreationAttributes> implements PaymentTransactionAttributes {
    public id!: number;
    public transactionId!: string;
    public gatewayTransactionId!: string;
    public bankReferenceId!: string;
    public adminId!: string;

    public sender!: "Vendor" | "Customer" | "Admin" | "Driver";

    public senderId!: string;
    public senderName!: string;
    public senderContact!: string;

    public receiverId!: string;
    public receiverName!: string;
    public receiverContact!: string;

    public paymentMethod!: string;
    public transactionType!: "Credit" | "Debit";
    public transactionAmount!: number;
    public status!: "Pending" | "Success" | "Failed";
    public description!: string;



    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

PaymentTransaction.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true,
        },
        transactionId: {
            type: DataTypes.STRING(255),
            unique: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4(),
        },
        gatewayTransactionId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        bankReferenceId: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        adminId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: Admin,
                key: "adminId",
            },
        },
        sender: {
            type: DataTypes.ENUM("Vendor", "Customer", "Admin", "Driver"),
            allowNull: false,
        },
        senderId: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        senderName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        senderContact: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        receiverId: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        receiverName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        receiverContact: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        transactionType: {
            type: DataTypes.ENUM("Credit", "Debit"),
            allowNull: false,
        },
        transactionAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("Pending", "Success", "Failed"),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "PaymentTransaction",
        tableName: "payment_transactions",
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ["gatewayTransactionId", "transactionId", "adminId", "senderId", "receiverId"],
            },
        ],
    }
);

export { PaymentTransaction };