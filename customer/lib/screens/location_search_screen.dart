import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../api_client.dart';

class LocationSearchScreen extends StatefulWidget {
  const LocationSearchScreen({
    super.key,
    required this.title,
    required this.token,
    this.initialQuery,
  });
  final String title;
  final String token;
  final String? initialQuery;

  @override
  State<LocationSearchScreen> createState() => _LocationSearchScreenState();
}

class _LocationSearchScreenState extends State<LocationSearchScreen> {
  final _searchController = TextEditingController();
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  String? _googleMapsKey;

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.initialQuery ?? '';
    _loadConfigKey();
    if (_searchController.text.isNotEmpty) {
      _performSearch(_searchController.text);
    }
  }

  Future<void> _loadConfigKey() async {
    try {
      final resp = await _apiClient.getConfigKeys(token: widget.token);
      if (resp.success) {
        _googleMapsKey = resp.body['data']?['google_maps_key']?.toString();
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
      });
      return;
    }

    setState(() {
      _isSearching = true;
    });

    try {
      if (_googleMapsKey != null && _googleMapsKey!.isNotEmpty) {
        final results = await _searchPlaces(query);
        if (mounted) {
          setState(() {
            _searchResults = results;
            _isSearching = false;
          });
        }
      } else {
        _fallbackMockSearch(query);
      }
    } catch (_) {
      _fallbackMockSearch(query);
    }
  }

  void _fallbackMockSearch(String query) {
    final mockLocations = [
      {
        'address': 'Salem, Tamil Nadu, India',
        'lat': 11.6643,
        'lng': 78.1460,
      },
      {
        'address': 'Coimbatore, Tamil Nadu, India',
        'lat': 11.0168,
        'lng': 76.9558,
      },
      {
        'address': 'Chennai, Tamil Nadu, India',
        'lat': 13.0827,
        'lng': 80.2707,
      },
    ];

    final filtered = mockLocations
        .where((loc) =>
            (loc['address'] as String).toLowerCase().contains(query.toLowerCase()))
        .toList();
    if (mounted) {
      setState(() {
        _searchResults = filtered;
        _isSearching = false;
      });
    }
  }

  Future<List<Map<String, dynamic>>> _searchPlaces(String query) async {
    final uri = Uri.https(
      'maps.googleapis.com',
      '/maps/api/place/findplacefromtext/json',
      {
        'input': query,
        'inputtype': 'textquery',
        'fields': 'formatted_address,geometry',
        'key': _googleMapsKey!,
      },
    );
    final resp = await http.get(uri);
    if (resp.statusCode != 200) {
      throw Exception('Places API failed');
    }
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    final candidates = data['candidates'] as List<dynamic>? ?? [];
    return candidates.map((c) {
      final map = c as Map<String, dynamic>;
      final loc = map['geometry']?['location'] as Map<String, dynamic>? ?? {};
      return {
        'address': map['formatted_address'] ?? '',
        'lat': loc['lat'],
        'lng': loc['lng'],
      };
    }).toList();
  }

  void _selectLocation(Map<String, dynamic> location) {
    Navigator.pop(context, location);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search location...',
                prefixIcon: const Icon(Icons.location_on, color: Colors.green),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _performSearch('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: _performSearch,
            ),
          ),

          // Search Results
          Expanded(
            child: _isSearching
                ? const Center(child: CircularProgressIndicator())
                : _searchResults.isEmpty
                    ? const Center(
                        child: Text(
                          'No results found',
                          style: TextStyle(color: Colors.grey),
                        ),
                      )
                    : ListView.builder(
                        itemCount: _searchResults.length,
                        itemBuilder: (context, index) {
                          final location = _searchResults[index];
                          return ListTile(
                            leading: const Icon(Icons.location_on, color: Colors.grey),
                            title: Text(location['address'] as String),
                            onTap: () => _selectLocation(location),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

