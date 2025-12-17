import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../design_system.dart';

class InlineLocationSearch extends StatefulWidget {
  final String label;
  final IconData? icon;
  final Color? iconColor;
  final String googleMapsKey;
  final Function(Map<String, dynamic>) onLocationSelected;
  final String? initialAddress;

  const InlineLocationSearch({
    super.key,
    required this.label,
    this.icon,
    this.iconColor,
    required this.googleMapsKey,
    required this.onLocationSelected,
    this.initialAddress,
  });

  @override
  State<InlineLocationSearch> createState() => _InlineLocationSearchState();
}

class _InlineLocationSearchState extends State<InlineLocationSearch> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  
  List<Map<String, dynamic>> _predictions = [];
  Timer? _debounce;
  bool _isLoading = false;
  bool _showPredictions = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.initialAddress != null) {
      _controller.text = widget.initialAddress!;
    }
    
    _focusNode.addListener(() {
      if (!_focusNode.hasFocus) {
        // Delay hiding to allow tap on list item
        Future.delayed(const Duration(milliseconds: 200), () {
          if (mounted) setState(() => _showPredictions = false);
        });
      } else {
        if (_predictions.isNotEmpty) {
          setState(() => _showPredictions = true);
        }
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }
  
  // Update controller text if parent passes new initialAddress (e.g. swap)
  @override
  void didUpdateWidget(InlineLocationSearch oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialAddress != oldWidget.initialAddress && 
        widget.initialAddress != _controller.text) {
      _controller.text = widget.initialAddress ?? '';
    }
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    
    if (query.isEmpty) {
      setState(() {
        _predictions = [];
        _showPredictions = false;
      });
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 500), () {
      _fetchPredictions(query);
    });
  }

  Future<void> _fetchPredictions(String query) async {
    if (widget.googleMapsKey.isEmpty) {
      setState(() => _error = "Maps API Key missing");
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final url = Uri.parse(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=$query&key=${widget.googleMapsKey}&components=country:in',
      );
      
      final response = await http.get(url);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          setState(() {
            _predictions = List<Map<String, dynamic>>.from(data['predictions']);
            _isLoading = false;
            _showPredictions = true;
          });
        } else if (data['status'] == 'ZERO_RESULTS') {
          setState(() {
            _predictions = [];
            _isLoading = false;
            _showPredictions = false;
          });
        } else {
          setState(() {
            _error = 'API Error: ${data['status']}';
            _predictions = [];
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _error = 'Network Error: ${response.statusCode}';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _getPlaceDetails(String placeId, String description) async {
    setState(() => _isLoading = true);
    
    try {
      final url = Uri.parse(
        'https://maps.googleapis.com/maps/api/place/details/json?place_id=$placeId&fields=formatted_address,geometry&key=${widget.googleMapsKey}',
      );
      final response = await http.get(url);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          final result = data['result'];
          final location = {
            'address': result['formatted_address'] ?? description,
            'lat': result['geometry']['location']['lat'],
            'lng': result['geometry']['location']['lng'],
          };
          
          _controller.text = location['address'];
          widget.onLocationSelected(location);
          
          setState(() {
            _showPredictions = false;
            _isLoading = false;
          });
          _focusNode.unfocus();
        }
      }
    } catch (e) {
      debugPrint('Error getting place details: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Input Field
        Container(
          color: Colors.transparent, // Transparent to blend with parent card
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
               // Icon is handled by parent Timeline now, removing from here if desired? 
               // Wait, keeping it for now but making it optional or styled differently.
               // Actually, for the timeline look, we should hide the icon here and let HomeScreen draw it.
               // But to keep this widget reusable, let's keep it but make it minimal.
               // Refactoring:
               
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_controller.text.isNotEmpty || _focusNode.hasFocus)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Text(
                          widget.label,
                          style: AppTextStyles.label.copyWith(fontSize: 10, color: AppColors.textTertiary),
                        ),
                      ),
                    TextField(
                      controller: _controller,
                      focusNode: _focusNode,
                      onChanged: _onSearchChanged,
                      style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600, fontSize: 16),
                      cursorColor: AppColors.primary,
                      decoration: InputDecoration(
                        hintText: widget.label,
                        hintStyle: AppTextStyles.bodyLarge.copyWith(color: AppColors.textTertiary, fontSize: 16),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(vertical: 8),
                        // Remove prefix icon from Input Decoration
                      ),
                    ),
                  ],
                ),
              ),
              if (_controller.text.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.close, size: 16, color: AppColors.textTertiary),
                  onPressed: () {
                    _controller.clear();
                    _onSearchChanged('');
                    widget.onLocationSelected({}); // Clear selection
                  },
                ),
            ],
          ),
        ),

        // Suggestions List (Inline)
        if (_showPredictions || _isLoading || _error != null)
          Container(
            margin: const EdgeInsets.only(top: 4, left: 12, right: 12),
            padding: const EdgeInsets.symmetric(vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            constraints: const BoxConstraints(maxHeight: 200),
            child: _isLoading
                ? const Center(child: Padding(
                    padding: EdgeInsets.all(8.0),
                    child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                  ))
                : _error != null
                    ? Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                      )
                    : ListView.separated(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        itemCount: _predictions.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final item = _predictions[index];
                          final mainText = item['structured_formatting']?['main_text'] ?? item['description'];
                          final secondaryText = item['structured_formatting']?['secondary_text'] ?? '';
                          
                          return InkWell(
                            onTap: () => _getPlaceDetails(item['place_id'], item['description']),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textLight),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(mainText, style: AppTextStyles.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                                        if (secondaryText.isNotEmpty)
                                          Text(secondaryText, style: AppTextStyles.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
      ],
    );
  }
}
