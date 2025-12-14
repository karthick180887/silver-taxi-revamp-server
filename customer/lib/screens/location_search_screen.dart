import 'package:flutter/material.dart';

class LocationSearchScreen extends StatefulWidget {
  const LocationSearchScreen({
    super.key,
    required this.title,
    this.initialQuery,
  });
  final String title;
  final String? initialQuery;

  @override
  State<LocationSearchScreen> createState() => _LocationSearchScreenState();
}

class _LocationSearchScreenState extends State<LocationSearchScreen> {
  final _searchController = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.initialQuery ?? '';
    if (_searchController.text.isNotEmpty) {
      _performSearch(_searchController.text);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _performSearch(String query) {
    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
      });
      return;
    }

    setState(() {
      _isSearching = true;
    });

    // Simulate location search - In production, use Google Places API
    // For now, return mock results
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _isSearching = false;
          _searchResults = _getMockLocations(query);
        });
      }
    });
  }

  List<Map<String, dynamic>> _getMockLocations(String query) {
    // Mock location data - Replace with actual Google Places API
    final mockLocations = [
      {
        'address': 'Salem, Tamil Nadu, India',
        'lat': 11.6643,
        'lng': 78.1460,
      },
      {
        'address': 'Salem New Bus Stand, Angammal Colony, Salem, Tamil Nadu, India',
        'lat': 11.6643,
        'lng': 78.1460,
      },
      {
        'address': 'Salem Railway Station, Nehru Street, Subramani Nagar, Azad Nagar, Old Suramangalam, Salem, Tamil Nadu, India',
        'lat': 11.6643,
        'lng': 78.1460,
      },
      {
        'address': 'Coimbatore, Tamil Nadu, India',
        'lat': 11.0168,
        'lng': 76.9558,
      },
      {
        'address': 'Coimbatore Railway Station, Coimbatore, Tamil Nadu, India',
        'lat': 11.0168,
        'lng': 76.9558,
      },
    ];

    // Filter based on query
    return mockLocations
        .where((loc) =>
            (loc['address'] as String).toLowerCase().contains(query.toLowerCase()))
        .toList();
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

