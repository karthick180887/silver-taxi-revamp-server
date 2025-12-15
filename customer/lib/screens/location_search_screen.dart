import 'package:flutter/material.dart';
import 'package:google_places_flutter/google_places_flutter.dart';
import 'package:google_places_flutter/model/prediction.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../design_system.dart';

class LocationSearchScreen extends StatefulWidget {
  const LocationSearchScreen({
    super.key,
    required this.title,
    this.initialQuery,
    required this.googleMapsKey,
  });
  final String title;
  final String? initialQuery;
  final String googleMapsKey;

  @override
  State<LocationSearchScreen> createState() => _LocationSearchScreenState();
}

class _LocationSearchScreenState extends State<LocationSearchScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.initialQuery ?? '';
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>?> _getPlaceDetails(String placeId) async {
    try {
      final url = Uri.parse(
        'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&fields=formatted_address,geometry&key=${widget.googleMapsKey}',
      );
      final response = await http.get(url);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          final result = data['result'];
          return {
            'address': result['formatted_address'],
            'lat': result['geometry']['location']['lat'],
            'lng': result['geometry']['location']['lng'],
          };
        }
      }
    } catch (e) {
      debugPrint('Error getting place details: $e');
    }
    return null;
  }

  void _selectPrediction(Prediction prediction) async {
    if (prediction.placeId == null) return;
    
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    final location = await _getPlaceDetails(prediction.placeId!);
    
    if (mounted) {
      Navigator.pop(context); // Close loading dialog
      if (location != null) {
        Navigator.pop(context, location); // Return location
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to get location details')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: GooglePlaceAutoCompleteTextField(
          textEditingController: _searchController,
          googleAPIKey: widget.googleMapsKey,
          inputDecoration: InputDecoration(
            hintText: 'Search location...',
            prefixIcon: const Icon(Icons.location_on, color: AppColors.primary),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {});
                    },
                  )
                : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
          debounceTime: 400,
          countries: const ["in"], // Restrict to India
          isLatLngRequired: false,
          getPlaceDetailWithLatLng: (Prediction prediction) {
            _selectPrediction(prediction);
          },
          itemClick: (Prediction prediction) {
            _searchController.text = prediction.description ?? '';
            _searchController.selection = TextSelection.fromPosition(
              TextPosition(offset: _searchController.text.length),
            );
          },
          seperatedBuilder: const Divider(height: 1),
          containerHorizontalPadding: 10,
          itemBuilder: (context, index, Prediction prediction) {
            return Container(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.location_on, color: AppColors.textLight),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      prediction.description ?? '',
                      style: AppTextStyles.bodyMedium,
                    ),
                  ),
                ],
              ),
            );
          },
          isCrossBtnShown: false,
        ),
      ),
    );
  }
}
