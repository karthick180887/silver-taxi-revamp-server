import 'package:flutter/material.dart';
import '../api_client.dart';
import '../models/customer_models.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key, required this.token});
  final String token;

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  CustomerWallet? _wallet;
  List<WalletTransaction> _transactions = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadWalletData();
  }

  Future<void> _loadWalletData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Load wallet
      final walletResult = await _apiClient.getCustomerWallet(token: widget.token);
      if (walletResult.success && walletResult.body['data'] != null) {
        setState(() {
          _wallet = CustomerWallet.fromJson(walletResult.body['data']);
        });
      }

      // Load transactions
      final transactionsResult = await _apiClient.getWalletTransactions(
        token: widget.token,
        limit: 50,
      );
      if (transactionsResult.success && transactionsResult.body['data'] != null) {
        final List<dynamic> data = transactionsResult.body['data'];
        setState(() {
          _transactions = data.map((json) => WalletTransaction.fromJson(json)).toList();
        });
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _errorMessage!,
              style: const TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadWalletData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadWalletData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Wallet Balance Card
            if (_wallet != null)
              Card(
                color: const Color(0xFF2575FC),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Wallet Balance',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '₹${_wallet!.balance}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildStatItem('Added', '₹${_wallet!.plusAmount}', Colors.white70),
                          _buildStatItem('Spent', '₹${_wallet!.minusAmount}', Colors.white70),
                          _buildStatItem('Total', '₹${_wallet!.totalAmount}', Colors.white70),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),
            const Text(
              'Transaction History',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            if (_transactions.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Text('No transactions yet'),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _transactions.length,
                itemBuilder: (context, index) {
                  final transaction = _transactions[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: transaction.type == 'Credit'
                            ? Colors.green
                            : Colors.red,
                        child: Icon(
                          transaction.type == 'Credit' ? Icons.add : Icons.remove,
                          color: Colors.white,
                        ),
                      ),
                      title: Text(
                        transaction.description ?? transaction.reason ?? 'Transaction',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      subtitle: Text(
                        '${transaction.date.day}/${transaction.date.month}/${transaction.date.year}',
                      ),
                      trailing: Text(
                        '${transaction.type == 'Credit' ? '+' : '-'}₹${transaction.amount}',
                        style: TextStyle(
                          color: transaction.type == 'Credit' ? Colors.green : Colors.red,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(color: color, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}

