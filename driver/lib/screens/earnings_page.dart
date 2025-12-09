import 'package:flutter/material.dart';
import '../api_client.dart';

class EarningsPage extends StatefulWidget {
  const EarningsPage({super.key, required this.token});
  final String token;

  @override
  State<EarningsPage> createState() => _EarningsPageState();
}

class _EarningsPageState extends State<EarningsPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _entries = [];
  double _total = 0;
  late DateTime _start;
  late DateTime _end;

  @override
  void initState() {
    super.initState();
    _end = DateTime.now();
    _start = _end.subtract(const Duration(days: 6));
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.getEarnings(
        token: widget.token,
        startDate: _formatDate(_start),
        endDate: _formatDate(_end),
      );
      if (!res.success) {
        throw Exception(res.body['message'] ?? 'Failed to load earnings');
      }

      final data = _asMap(res.body['data']);
      final entries = _extractList(data['items'] ?? data['history'] ?? res.body['data']);
      final total = data['total'] ?? data['sum'] ?? _sumEntries(entries);

      if (mounted) {
        setState(() {
          _entries = entries;
          _total = _toDouble(total);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }

  List<Map<String, dynamic>> _extractList(dynamic data) {
    if (data is List) {
      return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    if (data is Map) {
      final list = data['data'] ?? data['rows'] ?? data['items'];
      if (list is List) {
        return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
    return [];
  }

  double _sumEntries(List<Map<String, dynamic>> entries) {
    return entries.fold<double>(
      0,
      (sum, item) => sum + _toDouble(item['amount'] ?? item['fare'] ?? item['earnings']),
    );
  }

  double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }

  String _formatDate(DateTime date) {
    return '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final rangeLabel = '${_formatDate(_start)} to ${_formatDate(_end)}';
    return Scaffold(
      appBar: AppBar(title: const Text('Earnings')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Unable to load earnings',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(_error!, style: TextStyle(color: Colors.red.shade600)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2575FC),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF2575FC).withValues(alpha: 0.25),
                              blurRadius: 12,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Total Earnings',
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _total.toStringAsFixed(2),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              rangeLabel,
                              style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (_entries.isEmpty)
                        Column(
                          children: [
                            Icon(Icons.account_balance_wallet, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text('No earnings found', style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        )
                      else
                        ..._entries.map(
                          (entry) => Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
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
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      (entry['label'] ?? entry['tripId'] ?? 'Trip').toString(),
                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      (entry['date'] ?? entry['createdAt'] ?? '').toString(),
                                      style: TextStyle(color: Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                                Text(
                                  _toDouble(entry['amount'] ?? entry['fare'] ?? entry['earnings']).toStringAsFixed(2),
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
      ),
    );
  }
}
