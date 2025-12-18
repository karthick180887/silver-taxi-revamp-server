import 'package:flutter/material.dart';
import '../api_client.dart';
import '../design_system.dart';

class PayoutRequestPage extends StatefulWidget {
  const PayoutRequestPage({super.key, required this.token});
  final String token;

  @override
  State<PayoutRequestPage> createState() => _PayoutRequestPageState();
}

class _PayoutRequestPageState extends State<PayoutRequestPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _payouts = [];
  final _amountController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _ifscController = TextEditingController();
  final _accountHolderNameController = TextEditingController();
  final _upiIdController = TextEditingController();
  String _selectedType = 'bank_transfer'; // 'bank_transfer' or 'upi'
  Map<String, dynamic>? _walletData;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _accountNumberController.dispose();
    _ifscController.dispose();
    _accountHolderNameController.dispose();
    _upiIdController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final wallet = await _api.fetchWallet(token: widget.token);
      final payoutsRes = await _api.getPayoutRequests(token: widget.token);
      
      if (mounted) {
        setState(() {
          _walletData = wallet['data'] as Map<String, dynamic>?;
          _payouts = _extractList(payoutsRes.body['data']);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> _extractList(dynamic data) {
    if (data is List) {
      return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    if (data is Map) {
      final list = data['payouts'] ?? data['items'] ?? data['data'] ?? data['rows'];
      if (list is List) {
        return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
    return [];
  }

  double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _formatAmount(double amount) {
    return '₹ ${amount.toStringAsFixed(2)}';
  }

  String _formatDate(dynamic value) {
    if (value == null) return '';
    if (value is String) {
      final parsed = DateTime.tryParse(value);
      if (parsed != null) {
        return '${parsed.day}/${parsed.month}/${parsed.year}';
      }
      return value;
    }
    if (value is int) {
      final dt = DateTime.fromMillisecondsSinceEpoch(value);
      return '${dt.day}/${dt.month}/${dt.year}';
    }
    return value.toString();
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return AppColors.success;
      case 'pending':
        return AppColors.secondary;
      case 'rejected':
        return AppColors.error;
      default:
        return AppColors.textTertiary;
    }
  }

  Future<void> _requestPayout() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please enter a valid amount', style: AppTextStyles.bodyMedium.copyWith(color: Colors.white)), backgroundColor: AppColors.error),
      );
      return;
    }

    final balance = _toDouble(_walletData?['balance'] ?? 0.0);
    if (amount > balance) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Insufficient balance', style: AppTextStyles.bodyMedium.copyWith(color: Colors.white)), backgroundColor: AppColors.error),
      );
      return;
    }

    Map<String, dynamic> bankDetails = {};
    if (_selectedType == 'bank_transfer') {
      if (_accountNumberController.text.isEmpty ||
          _ifscController.text.isEmpty ||
          _accountHolderNameController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Please fill all bank details', style: AppTextStyles.bodyMedium.copyWith(color: Colors.white)), backgroundColor: AppColors.error),
        );
        return;
      }
      bankDetails = {
        'accountNumber': _accountNumberController.text,
        'ifsc': _ifscController.text,
        'accountHolderName': _accountHolderNameController.text,
      };
    } else if (_selectedType == 'upi') {
      if (_upiIdController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Please enter UPI ID', style: AppTextStyles.bodyMedium.copyWith(color: Colors.white)), backgroundColor: AppColors.error),
        );
        return;
      }
      bankDetails = {
        'upiId': _upiIdController.text,
      };
    }

    setState(() => _loading = true);
    try {
      final res = await _api.requestPayout(
        token: widget.token,
        type: _selectedType,
        amount: amount,
        bankDetails: bankDetails,
      );

      if (res.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Payout request submitted successfully', style: AppTextStyles.bodyMedium.copyWith(color: Colors.white)), backgroundColor: AppColors.success),
          );
          // Clear form
          _amountController.clear();
          _accountNumberController.clear();
          _ifscController.clear();
          _accountHolderNameController.clear();
          _upiIdController.clear();
          // Reload data
          _loadData();
        }
      } else {
        throw Exception(res.body['message'] ?? 'Failed to request payout');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e', style: AppTextStyles.bodyMedium.copyWith(color: Colors.white)), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
  
  void _showRequestDialog() {
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text('Request Payout', style: AppTextStyles.h3),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Available Balance: ${_formatAmount(_toDouble(_walletData?['balance'] ?? 0.0))}',
                  style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _amountController,
                  decoration: const InputDecoration(
                    labelText: 'Amount',
                    prefixText: '₹ ',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: _selectedType,
                  decoration: const InputDecoration(
                    labelText: 'Payout Method',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'bank_transfer', child: Text('Bank Transfer')),
                    DropdownMenuItem(value: 'upi', child: Text('UPI')),
                  ],
                  onChanged: (value) {
                    setDialogState(() {
                      _selectedType = value ?? 'bank_transfer';
                    });
                  },
                ),
                const SizedBox(height: 16),
                if (_selectedType == 'bank_transfer') ...[
                  TextField(
                    controller: _accountNumberController,
                    decoration: const InputDecoration(
                      labelText: 'Account Number',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _ifscController,
                    decoration: const InputDecoration(
                      labelText: 'IFSC Code',
                      border: OutlineInputBorder(),
                    ),
                    textCapitalization: TextCapitalization.characters,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _accountHolderNameController,
                    decoration: const InputDecoration(
                      labelText: 'Account Holder Name',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ] else if (_selectedType == 'upi') ...[
                  TextField(
                    controller: _upiIdController,
                    decoration: const InputDecoration(
                      labelText: 'UPI ID',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.emailAddress,
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                _requestPayout();
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final balance = _toDouble(_walletData?['balance'] ?? 0.0);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Payout Requests', style: AppTextStyles.h2),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.primary),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.primary,
        child: _loading && _payouts.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _error != null && _payouts.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Failed to load payout requests',
                        style: AppTextStyles.h3,
                      ),
                      const SizedBox(height: 8),
                      Text(_error!, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.error)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _loadData, 
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                        child: const Text('Retry'),
                      ),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Card(
                        color: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 4,
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Available Balance',
                                style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _formatAmount(balance),
                                style: AppTextStyles.h1.copyWith(color: Colors.white, fontSize: 32),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: balance > 0 ? _showRequestDialog : null,
                                icon: const Icon(Icons.account_balance_wallet),
                                label: const Text('Request Payout'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: AppColors.primary,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Payout History',
                        style: AppTextStyles.h3,
                      ),
                      const SizedBox(height: 16),
                      if (_payouts.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            'No payout requests found',
                            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textTertiary),
                          ),
                        )
                      else
                        ..._payouts.map((payout) {
                          final amount = _toDouble(payout['amount'] ?? 0);
                          final status = (payout['status'] ?? 'pending').toString();
                          final date = _formatDate(payout['createdAt'] ?? payout['date']);
                          final method = (payout['paymentMethod'] ?? 'N/A').toString();
                          final statusColor = _getStatusColor(status);
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 4,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      _formatAmount(amount),
                                      style: AppTextStyles.h3.copyWith(fontSize: 18),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        status.toUpperCase(),
                                        style: AppTextStyles.bodySmall.copyWith(
                                          color: statusColor,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Method: $method',
                                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.textTertiary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Date: $date',
                                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.textTertiary, fontSize: 12),
                                ),
                              ],
                            ),
                          );
                        }),
                    ],
                  ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _toDouble(_walletData?['balance'] ?? 0.0) > 0 ? _showRequestDialog : null,
        backgroundColor: AppColors.secondary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.account_balance_wallet),
        label: const Text('Request Payout'),
      ),
    );
  }
}

