import 'package:flutter/material.dart';
import '../api_client.dart';

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

  String _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'orange';
      case 'rejected':
        return 'red';
      default:
        return 'grey';
    }
  }

  Future<void> _requestPayout() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount')),
      );
      return;
    }

    final balance = _toDouble(_walletData?['balance'] ?? 0.0);
    if (amount > balance) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Insufficient balance')),
      );
      return;
    }

    Map<String, dynamic> bankDetails = {};
    if (_selectedType == 'bank_transfer') {
      if (_accountNumberController.text.isEmpty ||
          _ifscController.text.isEmpty ||
          _accountHolderNameController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please fill all bank details')),
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
          const SnackBar(content: Text('Please enter UPI ID')),
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
            const SnackBar(content: Text('Payout request submitted successfully')),
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
          SnackBar(content: Text('Error: $e')),
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
          title: const Text('Request Payout'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Available Balance: ${_formatAmount(_toDouble(_walletData?['balance'] ?? 0.0))}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
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
      appBar: AppBar(
        title: const Text('Payout Requests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _loading && _payouts.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _error != null && _payouts.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Failed to load payout requests',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(_error!, style: TextStyle(color: Colors.red.shade600)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Card(
                        color: const Color(0xFF2575FC),
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Available Balance',
                                style: TextStyle(color: Colors.white70),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _formatAmount(balance),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: balance > 0 ? _showRequestDialog : null,
                                icon: const Icon(Icons.account_balance_wallet),
                                label: const Text('Request Payout'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: const Color(0xFF2575FC),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Payout History',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      if (_payouts.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            'No payout requests found',
                            style: TextStyle(color: Colors.grey.shade600),
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
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.04),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
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
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: statusColor == 'green'
                                            ? Colors.green.shade50
                                            : statusColor == 'red'
                                                ? Colors.red.shade50
                                                : Colors.orange.shade50,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        status.toUpperCase(),
                                        style: TextStyle(
                                          color: statusColor == 'green'
                                              ? Colors.green.shade700
                                              : statusColor == 'red'
                                                  ? Colors.red.shade700
                                                  : Colors.orange.shade700,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Method: $method',
                                  style: TextStyle(color: Colors.grey.shade600),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Date: $date',
                                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
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
        icon: const Icon(Icons.account_balance_wallet),
        label: const Text('Request Payout'),
      ),
    );
  }
}

