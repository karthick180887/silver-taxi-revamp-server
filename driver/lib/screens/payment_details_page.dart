import 'package:flutter/material.dart';
import '../api_client.dart';

class PaymentDetailsPage extends StatefulWidget {
  const PaymentDetailsPage({super.key, required this.token});
  final String token;

  @override
  State<PaymentDetailsPage> createState() => _PaymentDetailsPageState();
}

class _PaymentDetailsPageState extends State<PaymentDetailsPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.getPaymentDetailsList(token: widget.token);
      if (!res.success) {
        throw Exception(res.body['message'] ?? 'Failed to load payment details');
      }
      final list = _extractList(res.body['data']);
      if (mounted) setState(() => _items = list);
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
      final list = data['data'] ?? data['items'] ?? data['paymentDetails'] ?? data['rows'];
      if (list is List) {
        return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
    return [];
  }

  String _titleFor(Map<String, dynamic> item) {
    return (item['paymentMethod'] ?? item['type'] ?? 'Payment Method').toString();
  }

  String _subtitleFor(Map<String, dynamic> item) {
    final upi = item['upiId'] ?? item['upi'] ?? '';
    final bank = item['bankName'] ?? item['bank'] ?? '';
    final account = item['accountNumber'] ?? item['account'] ?? '';
    final status = item['status'] ?? item['state'] ?? '';

    final parts = <String>[];
    if (upi.toString().isNotEmpty) parts.add('UPI: $upi');
    if (bank.toString().isNotEmpty) parts.add(bank.toString());
    if (account.toString().isNotEmpty) {
      final acc = account.toString();
      final last4 = acc.length > 4 ? acc.substring(acc.length - 4) : acc;
      parts.add('Acct • $last4');
    }
    if (status.toString().isNotEmpty) parts.add('Status: ${status.toString()}');
    return parts.isEmpty ? 'No details available' : parts.join(' • ');
  }

  IconData _iconFor(Map<String, dynamic> item) {
    final type = (item['type'] ?? item['paymentMethod'] ?? '').toString().toLowerCase();
    if (type.contains('bank')) return Icons.account_balance;
    if (type.contains('upi')) return Icons.qr_code;
    if (type.contains('card')) return Icons.credit_card;
    return Icons.account_balance_wallet;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Details'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Failed to load payment details',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(_error!, style: TextStyle(color: Colors.red.shade600)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _load,
                        child: const Text('Retry'),
                      ),
                    ],
                  )
                : _items.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          Icon(Icons.account_balance_wallet, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          Center(
                            child: Text(
                              'No payment methods found',
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Center(
                            child: Text(
                              'Pull to refresh after adding one',
                              style: TextStyle(color: Colors.grey.shade500),
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          final status = (item['status'] ?? item['state'] ?? '').toString();
                          final isActive = status.toLowerCase() == 'active';
                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: Colors.blue.shade50,
                                child: Icon(_iconFor(item), color: Colors.blue),
                              ),
                              title: Text(
                                _titleFor(item),
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              subtitle: Text(
                                _subtitleFor(item),
                                style: TextStyle(color: Colors.grey.shade700),
                              ),
                              trailing: status.isEmpty
                                  ? null
                                  : Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isActive ? Colors.green.shade100 : Colors.grey.shade200,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(
                                          color: isActive ? Colors.green.shade800 : Colors.grey.shade700,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
