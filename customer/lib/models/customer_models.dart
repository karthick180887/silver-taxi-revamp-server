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

class Service {
  final String serviceId;
  final String name;
  final bool isActive;
  final int? minKm;

  Service({
    required this.serviceId,
    required this.name,
    required this.isActive,
    this.minKm,
  });

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      serviceId: json['serviceId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      isActive: json['isActive'] ?? true,
      minKm: json['minKm'] != null ? int.tryParse(json['minKm'].toString()) : null,
    );
  }
}

class DestinationGroup {
  final String fromCity;
  final List<dynamic> destinations;

  DestinationGroup({
    required this.fromCity,
    required this.destinations,
  });

  factory DestinationGroup.fromJson(Map<String, dynamic> json) {
    return DestinationGroup(
      fromCity: json['fromCity']?.toString() ?? '',
      destinations: (json['destinations'] as List<dynamic>? ?? const []),
    );
  }
}

class BookingSummary {
  final String bookingId;
  final String pickup;
  final String drop;
  final String status;
  final DateTime? pickupDateTime;
  final num finalAmount;
  final String serviceType;

  BookingSummary({
    required this.bookingId,
    required this.pickup,
    required this.drop,
    required this.status,
    required this.finalAmount,
    required this.serviceType,
    this.pickupDateTime,
  });

  factory BookingSummary.fromJson(Map<String, dynamic> json) {
    return BookingSummary(
      bookingId: json['bookingId']?.toString() ?? '',
      pickup: (json['pickup'] ?? json['pickupLocation'] ?? '').toString(),
      drop: (json['drop'] ?? json['dropLocation'] ?? '').toString(),
      status: json['status']?.toString() ?? '',
      finalAmount: num.tryParse(json['finalAmount']?.toString() ?? '') ?? 0,
      serviceType: json['serviceType']?.toString() ?? '',
      pickupDateTime: json['pickupDateTime'] != null
          ? DateTime.tryParse(json['pickupDateTime'].toString())
          : null,
    );
  }
}

class Offer {
  final String id;
  final String name;
  final String? description;
  final num? amount;
  final String? category;

  Offer({
    required this.id,
    required this.name,
    this.description,
    this.amount,
    this.category,
  });

  factory Offer.fromJson(Map<String, dynamic> json) {
    return Offer(
      id: json['id']?.toString() ?? json['offerId']?.toString() ?? '',
      name: json['offerName']?.toString() ?? json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      amount: num.tryParse(json['offerAmount']?.toString() ?? ''),
      category: json['category']?.toString(),
    );
  }
}

class EstimatedFare {
  final String? tariffId;
  final String? packageId;
  final String? packageName;
  final num finalPrice;
  final num estimatedPrice;
  final num distance;
  final num? duration;
  final num? driverBeta;
  final num? pricePerKm;
  final num? taxAmount;
  final num? taxPercentage;
  final num? offerAmount;
  final String? offerId;
  final String? offerName;
  final String? offerType;
  final num? toll;
  final num? hill;
  final num? permitCharge;
  final num? discountApplyPrice;
  final num? beforeDiscountPrice;

  EstimatedFare({
    this.tariffId,
    this.packageId,
    this.packageName,
    required this.finalPrice,
    required this.estimatedPrice,
    required this.distance,
    this.duration,
    this.driverBeta,
    this.pricePerKm,
    this.taxAmount,
    this.taxPercentage,
    this.offerAmount,
    this.offerId,
    this.offerName,
    this.offerType,
    this.toll,
    this.hill,
    this.permitCharge,
    this.discountApplyPrice,
    this.beforeDiscountPrice,
  });

  factory EstimatedFare.fromJson(Map<String, dynamic> json) {
    num _numVal(dynamic v) => num.tryParse(v?.toString() ?? '') ?? 0;

    return EstimatedFare(
      tariffId: json['tariffId']?.toString(),
      packageId: json['packageId']?.toString(),
      packageName: json['packageName']?.toString(),
      finalPrice: _numVal(json['finalPrice']),
      estimatedPrice: _numVal(json['estimatedPrice'] ?? json['baseFare']),
      distance: _numVal(json['distance']),
      duration: num.tryParse(json['duration']?.toString() ?? ''),
      driverBeta: num.tryParse(json['driverBeta']?.toString() ?? ''),
      pricePerKm: num.tryParse(json['pricePerKm']?.toString() ?? ''),
      taxAmount: num.tryParse(json['taxAmount']?.toString() ?? ''),
      taxPercentage: num.tryParse(json['taxPercentage']?.toString() ?? ''),
      offerAmount: num.tryParse(json['offerAmount']?.toString() ?? ''),
      offerId: json['offerId']?.toString(),
      offerName: json['offerName']?.toString(),
      offerType: json['offerType']?.toString(),
      toll: num.tryParse(json['toll']?.toString() ?? ''),
      hill: num.tryParse(json['hill']?.toString() ?? ''),
      permitCharge: num.tryParse(json['permitCharge']?.toString() ?? ''),
      discountApplyPrice: num.tryParse(json['discountApplyPrice']?.toString() ?? ''),
      beforeDiscountPrice: num.tryParse(json['beforeDiscountPrice']?.toString() ?? ''),
    );
  }
}

class EstimatedVehicle {
  final String vehicleId;
  final String vehicleType;
  final String? vehicleImage;
  final String? packageDisplayName;
  final num? extraPricePerKm;
  final List<EstimatedFare> fares;

  EstimatedVehicle({
    required this.vehicleId,
    required this.vehicleType,
    this.vehicleImage,
    this.packageDisplayName,
    this.extraPricePerKm,
    required this.fares,
  });

  factory EstimatedVehicle.fromJson(Map<String, dynamic> json) {
    final faresJson = (json['fares'] as List<dynamic>? ?? const []);
    return EstimatedVehicle(
      vehicleId: json['vehicleId']?.toString() ?? '',
      vehicleType: json['vehicleType']?.toString() ??
          json['name']?.toString() ??
          'Vehicle',
      vehicleImage: json['vehicleImage']?.toString(),
      packageDisplayName: json['packageDisplayName']?.toString(),
      extraPricePerKm: num.tryParse(json['extraPricePerKm']?.toString() ?? ''),
      fares: faresJson.map((e) => EstimatedFare.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}

