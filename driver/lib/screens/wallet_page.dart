import 'package:flutter/material.dart';
import '../api_client.dart';
import 'payout_request_page.dart';

class WalletPage extends StatefulWidget {
  const WalletPage({super.key, required this.token});
  final String token;

  @override
  State<WalletPage> createState() => _WalletPageState();
}

class _WalletPageState extends State<WalletPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = false;
  bool _loadingMore = false;
  String? _error;
  Map<String, dynamic>? _walletData;
  List<Map<String, dynamic>> _history = [];
  int _offset = 0;
  static const int _limit = 20;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() {
      _loading = true;
      _error = null;
      _offset = 0;
      _hasMore = true;
    });
    try {
      debugPrint('[WalletPage] ========================================');
      debugPrint('[WalletPage] 🔄 Loading wallet and transaction history...');
      debugPrint('[WalletPage] ========================================');
      
      final wallet = await _api.fetchWallet(token: widget.token);
      debugPrint('[WalletPage] ✅ Wallet data received: ${wallet['data']}');
      
      final historyRes = await _api.fetchWalletHistory(
        token: widget.token,
        limit: _limit,
        offset: 0,
      );
      debugPrint('[WalletPage] 📊 History API response:');
      debugPrint('[WalletPage]   - Success: ${historyRes.success}');
      debugPrint('[WalletPage]   - Status: ${historyRes.statusCode}');
      debugPrint('[WalletPage]   - Body keys: ${historyRes.body.keys}');
      debugPrint('[WalletPage]   - Data type: ${historyRes.body['data'].runtimeType}');
      debugPrint('[WalletPage]   - Data: ${historyRes.body['data']}');
      
      final historyList = _extractList(historyRes.body['data']);
      debugPrint('[WalletPage] ✅ Extracted ${historyList.length} transactions');
      if (historyList.isNotEmpty) {
        debugPrint('[WalletPage] First transaction: ${historyList.first}');
      }

      if (mounted) {
        setState(() {
          _walletData = wallet['data'] as Map<String, dynamic>?;
          _history = historyList;
          _offset = historyList.length;
          _hasMore = historyList.length >= _limit;
        });
        debugPrint('[WalletPage] ✅ State updated with ${historyList.length} transactions');
      }
    } catch (e, stackTrace) {
      debugPrint('[WalletPage] ❌ Error loading wallet history: $e');
      debugPrint('[WalletPage] Stack trace: $stackTrace');
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    
    setState(() => _loadingMore = true);
    try {
      final historyRes = await _api.fetchWalletHistory(
        token: widget.token,
        limit: _limit,
        offset: _offset,
      );
      final historyList = _extractList(historyRes.body['data']);

      if (mounted) {
        setState(() {
          _history.addAll(historyList);
          _offset += historyList.length;
          _hasMore = historyList.length >= _limit;
        });
      }
    } catch (e) {
      debugPrint('Error loading more transactions: $e');
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  List<Map<String, dynamic>> _extractList(dynamic data) {
    if (data is List) {
      return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    if (data is Map) {
      final list = data['history'] ?? data['items'] ?? data['data'] ?? data['rows'];
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

  String _formatNumber(String value) {
    try {
      final num = double.tryParse(value) ?? 0;
      if (num >= 100000) {
        return '${(num / 100000).toStringAsFixed(2)}L';
      } else if (num >= 1000) {
        return '${(num / 1000).toStringAsFixed(2)}K';
      }
      return num.toStringAsFixed(2);
    } catch (e) {
      return value;
    }
  }

  String _formatDate(dynamic value) {
    if (value == null) return '';
    if (value is String) {
      final parsed = DateTime.tryParse(value);
      if (parsed != null) return '${parsed.year}-${parsed.month.toString().padLeft(2, '0')}-${parsed.day.toString().padLeft(2, '0')}';
      return value;
    }
    if (value is int) {
      final dt = DateTime.fromMillisecondsSinceEpoch(value);
      return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
    }
    return value.toString();
  }

  @override
  Widget build(BuildContext context) {
    final balance = _toDouble(_walletData?['balance'] ?? 0.0);
    final plusAmount = _toDouble(_walletData?['plusAmount'] ?? 0.0);
    final minusAmount = _toDouble(_walletData?['minusAmount'] ?? 0.0);
    final totalAmount = _walletData?['totalAmount']?.toString() ?? '0';
    final currency = _walletData?['currency']?.toString() ?? 'INR';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wallet'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              debugPrint('[WalletPage] 🔄 Manual refresh triggered');
              _loadAll();
            },
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadAll,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Failed to load wallet',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(_error!, style: TextStyle(color: Colors.red.shade600)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _loadAll, child: const Text('Retry')),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Main Balance Card
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
                              if (currency.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  currency,
                                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Wallet Statistics Cards
                      Row(
                        children: [
                          Expanded(
                            child: Card(
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Total Credit',
                                      style: TextStyle(
                                        color: Colors.grey.shade600,
                                        fontSize: 12,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      _formatAmount(plusAmount),
                                      style: TextStyle(
                                        color: Colors.green.shade700,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Card(
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Total Debit',
                                      style: TextStyle(
                                        color: Colors.grey.shade600,
                                        fontSize: 12,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      _formatAmount(minusAmount),
                                      style: TextStyle(
                                        color: Colors.red.shade700,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (totalAmount.isNotEmpty && totalAmount != '0') ...[
                        const SizedBox(height: 12),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Total Amount',
                                  style: TextStyle(
                                    color: Colors.grey.shade600,
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  '₹ ${_formatNumber(totalAmount)}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Transaction History',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          TextButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => PayoutRequestPage(token: widget.token),
                                ),
                              ).then((_) => _loadAll());
                            },
                            icon: const Icon(Icons.account_balance_wallet, size: 18),
                            label: const Text('Payouts'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (_history.isEmpty)
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
                            'No transactions found',
                            style: TextStyle(color: Colors.grey.shade600),
                          ),
                        )
                      else
                        ..._history.map((item) {
                          final amount = _toDouble(item['amount'] ?? item['value'] ?? item['txnAmount']);
                          final isCredit = amount >= 0;
                          final label = (item['description'] ?? item['txnType'] ?? item['type'] ?? 'Transaction').toString();
                          final date = _formatDate(item['createdAt'] ?? item['date'] ?? item['timestamp']);
                          final status = (item['status'] ?? item['state'] ?? '').toString();
                          final tag = (item['reason'] ?? item['category'] ?? item['txnType'] ?? item['type'] ?? '').toString();
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
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              label,
                                              style: const TextStyle(fontWeight: FontWeight.w600),
                                            ),
                                          ),
                                          if (tag.isNotEmpty)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: isCredit ? Colors.green.shade50 : Colors.red.shade50,
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                tag,
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: isCredit ? Colors.green.shade700 : Colors.red.shade700,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(date, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                      if (status.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          status,
                                          style: TextStyle(
                                            color: Colors.grey.shade700,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  _formatAmount(amount),
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isCredit ? Colors.green.shade700 : Colors.red.shade700,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      if (_hasMore && !_loading)
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Center(
                            child: ElevatedButton(
                              onPressed: _loadMore,
                              child: const Text('Load More'),
                            ),
                          ),
                        ),
                      if (_loadingMore)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      if (!_hasMore && _history.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Center(
                            child: Text(
                              'No more transactions',
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                          ),
                        ),
                    ],
                  ),
      ),
    );
  }
}
