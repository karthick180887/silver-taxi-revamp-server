import 'package:flutter/cupertino.dart';
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
      final wallet = await _api.fetchWallet(token: widget.token);
      final historyRes = await _api.fetchWalletHistory(
        token: widget.token,
        limit: _limit,
        offset: 0,
      );
      
      final historyList = _extractList(historyRes.body['data']);

      if (mounted) {
        setState(() {
          _walletData = wallet['data'] as Map<String, dynamic>?;
          _history = historyList;
          _offset = historyList.length;
          _hasMore = historyList.length >= _limit;
        });
      }
    } catch (e) {
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
      if (parsed != null) return '${parsed.day}/${parsed.month}';
    }
    if (value is int) {
      final dt = DateTime.fromMillisecondsSinceEpoch(value);
      return '${dt.day}/${dt.month}';
    }
    return value.toString();
  }

  @override
  Widget build(BuildContext context) {
    final balance = _toDouble(_walletData?['balance'] ?? 0.0);
    final plusAmount = _toDouble(_walletData?['plusAmount'] ?? 0.0);
    final minusAmount = _toDouble(_walletData?['minusAmount'] ?? 0.0);
    
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('My Wallet', style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: const BackButton(color: Color(0xFF1E293B)),
        actions: [
           IconButton(
            icon: const Icon(CupertinoIcons.arrow_right_arrow_left, color: Color(0xFF2563EB)),
            tooltip: 'Request Payout',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PayoutRequestPage(token: widget.token),
                ),
              ).then((_) => _loadAll());
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadAll,
        color: const Color(0xFF2563EB),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
            : ListView(
                padding: const EdgeInsets.all(20),
                children: [
                   // Balance Card
                   Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2563EB), Color(0xFF1E40AF)],
                        begin: Alignment.topLeft, 
                        end: Alignment.bottomRight
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF2563EB).withValues(alpha: 0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                     child: Column(
                       children: [
                         const Text(
                           'Available Balance',
                           style: TextStyle(color: Colors.white70, fontSize: 14),
                         ),
                         const SizedBox(height: 8),
                         Text(
                           _formatAmount(balance),
                           style: const TextStyle(
                             color: Colors.white,
                             fontSize: 36,
                             fontWeight: FontWeight.bold,
                           ),
                         ),
                         const SizedBox(height: 24),
                         Row(
                           children: [
                             Expanded(child: _buildSummaryItem('Total Income', plusAmount, Colors.greenAccent)),
                             Container(width: 1, height: 40, color: Colors.white24),
                             Expanded(child: _buildSummaryItem('Total Spend', minusAmount, Colors.orangeAccent)),
                           ],
                         )
                       ],
                     ),
                   ),
                   
                   const SizedBox(height: 32),
                   const Text(
                     'Recent Transactions',
                     style: TextStyle(
                       fontSize: 18,
                       fontWeight: FontWeight.bold,
                       color: Color(0xFF1E293B),
                     ),
                   ),
                   const SizedBox(height: 16),
                   
                   if (_history.isEmpty)
                      _buildEmptyState()
                   else
                      ListView.builder(
                        physics: const NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                        itemCount: _history.length + (_hasMore ? 1 : 0),
                        itemBuilder: (ctx, i) {
                          if (i == _history.length) {
                             return _loadingMore 
                                ? const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
                                : Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    child: ElevatedButton(
                                      onPressed: _loadMore,
                                      style: ElevatedButton.styleFrom(elevation: 0, backgroundColor: Colors.white, foregroundColor: Colors.blue),
                                      child: const Text('Load More'),
                                    ),
                                  );
                          }
                          return _buildTransactionItem(_history[i]);
                        },
                      ),
                     
                     const SizedBox(height: 40),
                ],
              ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, double amount, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          _formatAmount(amount),
          style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
     return Center(
       child: Padding(
         padding: const EdgeInsets.only(top: 40),
         child: Column(
           children: [
             Icon(CupertinoIcons.doc_text_search, size: 48, color: Colors.grey.shade300),
             const SizedBox(height: 16),
             Text('No transactions yet', style: TextStyle(color: Colors.grey.shade500)),
           ],
         ),
       ),
     );
  }

  Widget _buildTransactionItem(Map<String, dynamic> item) {
    final amount = _toDouble(item['amount'] ?? item['value'] ?? item['txnAmount']);
    final isCredit = amount >= 0;
    final label = (item['description'] ?? item['txnType'] ?? item['type'] ?? 'Transaction').toString();
    final date = _formatDate(item['createdAt'] ?? item['date'] ?? item['timestamp']);
    final tag = (item['reason'] ?? item['category'] ?? item['txnType'] ?? item['type'] ?? '').toString().toUpperCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isCredit ? Colors.green.shade50 : Colors.red.shade50,
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCredit ? CupertinoIcons.arrow_down_left_square_fill : CupertinoIcons.arrow_up_right_square_fill,
              color: isCredit ? Colors.green.shade600 : Colors.red.shade600,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Color(0xFF1E293B)),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(date, style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                    const SizedBox(width: 8),
                    if (tag.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                           color: Colors.grey.shade100,
                           borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(tag, style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
                      ),
                  ],
                ),
              ],
            ),
          ),
          Text(
            (isCredit ? '+' : '') + _formatAmount(amount),
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: isCredit ? Colors.green.shade700 : Colors.red.shade700,
            ),
          ),
        ],
      ),
    );
  }
}
