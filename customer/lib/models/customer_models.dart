class Customer {
  final String customerId;
  final String? adminId;
  final String? vendorId;
  final String name;
  final String? email;
  final String phone;
  final String? walletId;
  final String? createdBy;
  final int bookingCount;
  final int totalAmount;
  final String? referralCode;
  final String? referredBy;
  final DateTime? dob;
  final String? gender;
  final bool isApp;
  final bool isWebsite;
  final bool rateNow;
  final String? profilePicture;
  final String status;
  final double rating;
  final int totalTrips;

  Customer({
    required this.customerId,
    this.adminId,
    this.vendorId,
    required this.name,
    this.email,
    required this.phone,
    this.walletId,
    this.createdBy,
    this.bookingCount = 0,
    this.totalAmount = 0,
    this.referralCode,
    this.referredBy,
    this.dob,
    this.gender,
    this.isApp = false,
    this.isWebsite = false,
    this.rateNow = true,
    this.profilePicture,
    this.status = 'active',
    this.rating = 0.0,
    this.totalTrips = 0,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      customerId: json['customerId'] ?? '',
      adminId: json['adminId'],
      vendorId: json['vendorId'],
      name: json['name'] ?? '',
      email: json['email'],
      phone: json['phone'] ?? '',
      walletId: json['walletId'],
      createdBy: json['createdBy'],
      bookingCount: json['bookingCount'] ?? 0,
      totalAmount: json['totalAmount'] ?? 0,
      referralCode: json['referralCode'],
      referredBy: json['referredBy'],
      dob: json['dob'] != null ? DateTime.parse(json['dob']) : null,
      gender: json['gender'],
      isApp: json['isApp'] ?? false,
      isWebsite: json['isWebsite'] ?? false,
      rateNow: json['rateNow'] ?? true,
      profilePicture: json['profilePicture'],
      status: json['status'] ?? 'active',
      rating: (json['rating'] ?? 0.0).toDouble(),
      totalTrips: json['totalTrips'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'customerId': customerId,
      'adminId': adminId,
      'vendorId': vendorId,
      'name': name,
      'email': email,
      'phone': phone,
      'walletId': walletId,
      'createdBy': createdBy,
      'bookingCount': bookingCount,
      'totalAmount': totalAmount,
      'referralCode': referralCode,
      'referredBy': referredBy,
      'dob': dob?.toIso8601String(),
      'gender': gender,
      'isApp': isApp,
      'isWebsite': isWebsite,
      'rateNow': rateNow,
      'profilePicture': profilePicture,
      'status': status,
      'rating': rating,
      'totalTrips': totalTrips,
    };
  }
}

class CustomerWallet {
  final String walletId;
  final String customerId;
  final int balance;
  final int startAmount;
  final int minusAmount;
  final int plusAmount;
  final int totalAmount;
  final String currency;

  CustomerWallet({
    required this.walletId,
    required this.customerId,
    this.balance = 0,
    this.startAmount = 0,
    this.minusAmount = 0,
    this.plusAmount = 0,
    this.totalAmount = 0,
    this.currency = 'INR',
  });

  factory CustomerWallet.fromJson(Map<String, dynamic> json) {
    return CustomerWallet(
      walletId: json['walletId'] ?? '',
      customerId: json['customerId'] ?? '',
      balance: json['balance'] ?? 0,
      startAmount: json['startAmount'] ?? 0,
      minusAmount: json['minusAmount'] ?? 0,
      plusAmount: json['plusAmount'] ?? 0,
      totalAmount: json['totalAmount'] ?? 0,
      currency: json['currency'] ?? 'INR',
    );
  }
}

class WalletTransaction {
  final String transactionId;
  final String walletId;
  final String customerId;
  final int amount;
  final String type; // Credit, Debit
  final DateTime date;
  final String? reason;
  final String? description;
  final String status; // Paid, Unpaid
  final DateTime? createdAt;

  WalletTransaction({
    required this.transactionId,
    required this.walletId,
    required this.customerId,
    required this.amount,
    required this.type,
    required this.date,
    this.reason,
    this.description,
    this.status = 'Unpaid',
    this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      transactionId: json['transactionId'] ?? '',
      walletId: json['walletId'] ?? '',
      customerId: json['customerId'] ?? '',
      amount: json['amount'] ?? 0,
      type: json['type'] ?? '',
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
      reason: json['reason'],
      description: json['description'],
      status: json['status'] ?? 'Unpaid',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    );
  }
}

