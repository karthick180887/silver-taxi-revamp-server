import 'package:flutter/material.dart';
import 'api_client.dart';

void main() {
  runApp(const VendorApp());
}

class VendorApp extends StatelessWidget {
  const VendorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vendor App (API wired)',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2575FC)),
        useMaterial3: true,
      ),
      home: const ApiDemoScreen(),
    );
  }
}

/// Minimal screen that exercises all API methods.
class ApiDemoScreen extends StatefulWidget {
  const ApiDemoScreen({super.key});

  @override
  State<ApiDemoScreen> createState() => _ApiDemoScreenState();
}

class _ApiDemoScreenState extends State<ApiDemoScreen> {
  final _api = VendorApiClient();
  final _tokenController = TextEditingController();
  final _log = <String>[];
  bool _busy = false;

  void _append(String text) {
    setState(() => _log.insert(0, text));
  }

  Future<void> _call(Future<void> Function() fn) async {
    setState(() => _busy = true);
    try {
      await fn();
    } catch (e) {
      _append('Error: $e');
    } finally {
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vendor API Demo'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _tokenController,
              decoration: const InputDecoration(
                labelText: 'Bearer token',
                hintText: 'Paste JWT here',
                border: OutlineInputBorder(),
              ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(12),
              children: [
                _ActionButton(
                  label: 'Get profile',
                  busy: _busy,
                  onPressed: () => _call(() async {
                    final res = await _api.fetchProfile(token: _tokenController.text);
                    _append('profile → ${res.statusCode} ${res.message}');
                  }),
                ),
                _ActionButton(
                  label: 'Get transactions',
                  busy: _busy,
                  onPressed: () => _call(() async {
                    final res = await _api.fetchTransactions(token: _tokenController.text);
                    _append('transactions → ${res.statusCode} ${res.message}');
                  }),
                ),
                _ActionButton(
                  label: 'Get booking counts',
                  busy: _busy,
                  onPressed: () => _call(() async {
                    final res = await _api.getBookingCounts(token: _tokenController.text);
                    _append('counts → ${res.statusCode} ${res.message}');
                  }),
                ),
                _ActionButton(
                  label: 'Get config keys',
                  busy: _busy,
                  onPressed: () => _call(() async {
                    final res = await _api.getConfigKeys(token: _tokenController.text);
                    _append('config → ${res.statusCode} ${res.message}');
                  }),
                ),
                _ActionButton(
                  label: 'Get version',
                  busy: _busy,
                  onPressed: () => _call(() async {
                    final res = await _api.getVersion(token: _tokenController.text);
                    _append('version → ${res.statusCode} ${res.message}');
                  }),
                ),
                _ActionButton(
                  label: 'List bookings (v1)',
                  busy: _busy,
                  onPressed: () => _call(() async {
                    final res = await _api.getAllBookings(token: _tokenController.text);
                    _append('bookings → ${res.statusCode} ${res.message}');
                  }),
                ),
                _ActionButton(
                  label: 'List bookings (v2)',
                  busy: _busy,
                  onPressed: () => _call(() async {
                    final res = await _api.getAllBookingsV2(token: _tokenController.text);
                    _append('bookings v2 → ${res.statusCode} ${res.message}');
                  }),
                ),
                _ActionButton(
                  label: 'Get drivers w/ location',
                  busy: _busy,
                  onPressed: () => _call(() async {
                    final res = await _api.getDriversWithLocation(token: _tokenController.text);
                    _append('drivers-location → ${res.statusCode} ${res.message}');
                  }),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Logs (most recent first)',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                for (final entry in _log.take(30))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(entry),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.onPressed,
    required this.busy,
  });

  final String label;
  final VoidCallback onPressed;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: ElevatedButton(
        onPressed: busy ? null : onPressed,
        child: Text(label),
      ),
    );
  }
}

