import 'package:flutter/material.dart';
import '../api_client.dart';

class AnalyticsPage extends StatefulWidget {
  const AnalyticsPage({super.key, required this.token});
  final String token;

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = false;
  String? _error;
  Map<String, dynamic> _analytics = {};
  List<Map<String, dynamic>> _graphPoints = [];
  late DateTime _start;
  late DateTime _end;

  @override
  void initState() {
    super.initState();
    // Default to last 7 days
    _end = DateTime.now();
    _start = _end.subtract(const Duration(days: 6));
    _load();
  }

  String _formatDate(DateTime date) {
    // Backend expects DD-MM-YYYY format
    return '${date.day.toString().padLeft(2, '0')}-${date.month.toString().padLeft(2, '0')}-${date.year.toString().padLeft(4, '0')}';
  }

  String _formatWeekStart(DateTime date) {
    // Backend expects DD/MM/YYYY format (with slashes) for weekDayStart
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year.toString().padLeft(4, '0')}';
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // Backend requires at least startDate
      final analyticsRes = await _api.getAnalytics(
        token: widget.token,
        startDate: _formatDate(_start),
        endDate: _formatDate(_end),
      );
      if (!analyticsRes.success) {
        throw Exception(analyticsRes.body['message'] ?? 'Failed to load analytics');
      }
      // Earnings graph uses weekDayStart parameter (DD/MM/YYYY format with slashes)
      // For now, use default (previous week) by not passing parameters
      // Or calculate week start from _start date
      final weekStartFormatted = _formatWeekStart(_start);
      final graphRes = await _api.getEarningsGraph(
        token: widget.token,
        weekDayStart: weekStartFormatted,
      );
      if (!graphRes.success) {
        throw Exception(graphRes.body['message'] ?? 'Failed to load analytics graph');
      }

      final analyticsData = _asMap(analyticsRes.body['data']);
      final graphData = _extractList(graphRes.body['data']);

      if (mounted) {
        setState(() {
          _analytics = analyticsData;
          _graphPoints = graphData;
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
      final list = data['graph'] ?? data['data'] ?? data['points'] ?? data['rows'];
      if (list is List) {
        return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Unable to load analytics',
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
                      if (_analytics.isEmpty)
                        Column(
                          children: [
                            Icon(Icons.bar_chart, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text('No analytics available', style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        )
                      else
                        ..._analytics.entries.map(
                          (entry) => Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
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
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    entry.key,
                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                ),
                                Text(entry.value.toString()),
                              ],
                            ),
                          ),
                        ),
                      const SizedBox(height: 8),
                      Text('Earnings Trend', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      if (_graphPoints.isEmpty)
                        Text('No graph data', style: TextStyle(color: Colors.grey.shade600))
                      else
                        ..._graphPoints.map(
                          (point) => Container(
                            margin: const EdgeInsets.only(bottom: 8),
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
                                Text(
                                  (point['label'] ?? point['date'] ?? point['day'] ?? '').toString(),
                                  style: const TextStyle(fontWeight: FontWeight.w500),
                                ),
                                Text(
                                  point['value']?.toString() ??
                                      point['amount']?.toString() ??
                                      point['earnings']?.toString() ??
                                      '',
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
