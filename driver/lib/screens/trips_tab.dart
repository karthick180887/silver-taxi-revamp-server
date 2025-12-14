import 'dart:async';

import 'package:flutter/material.dart';
import '../api_client.dart';
import '../services/socket_service.dart';
import '../services/trip_service.dart';
import '../widgets/booking_list_page.dart';

class TripsTab extends StatefulWidget {
  const TripsTab({super.key, required this.token});
  final String token;

  @override
  State<TripsTab> createState() => TripsTabState();
}

class TripsTabState extends State<TripsTab> {
  int _selectedIndex = 0;
  int _listVersion = 0;
  final List<_TripTabConfig> _tabs = const [
    _TripTabConfig(
      label: 'New',
      status: kTripStatusNew,
      badgeKey: 'offers',
      isLive: true,
    ),
    _TripTabConfig(
      label: 'Not Started',
      status: kTripStatusNotStarted,
      badgeKey: 'accepted',
    ),
    _TripTabConfig(
      label: 'Started',
      status: kTripStatusStarted,
      badgeKey: 'started',
    ),
    _TripTabConfig(
      label: 'Completed',
      status: kTripStatusCompleted,
      badgeKey: 'completed',
    ),
    _TripTabConfig(
      label: 'Cancelled',
      status: kTripStatusCancelled,
      badgeKey: 'cancelled',
    ),
  ];
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  Timer? _countTimer;
  bool _isFetching = false;
  static const Duration _autoRefreshInterval = Duration(seconds: 15);
  StreamSubscription? _bookingSub;

  // Badge counts
  Map<String, int> _badges = {
    'offers': 0,
    'accepted': 0,
    'started': 0,
    'completed': 0,
    'cancelled': 0,
  };

  @override
  void initState() {
    super.initState();
    _fetchCounts();
    _startAutoRefresh();
    _setupRealtimeRefresh();
  }

  Future<void> _fetchCounts() async {
    if (_isFetching) {
      debugPrint('TripsTab: ⚠️ Already fetching counts, skipping...');
      return;
    }
    _isFetching = true;
    debugPrint('TripsTab: ========================================');
    debugPrint('TripsTab: 🔄 Fetching trip counts...');
    debugPrint('TripsTab: ========================================');
    try {
      final counts = await TripService(apiClient: _api).getTripCounts(widget.token);
      if (mounted) {
        debugPrint('TripsTab: ✅ Counts received: $counts');
        debugPrint('TripsTab: 📊 Badge mapping:');
        debugPrint('TripsTab:   - "New" tab (offers): ${counts['offers'] ?? 0}');
        debugPrint('TripsTab:   - "Not Started" tab (accepted): ${counts['accepted'] ?? 0}');
        debugPrint('TripsTab:   - "Started" tab (started): ${counts['started'] ?? 0}');
        debugPrint('TripsTab:   - "Completed" tab (completed): ${counts['completed'] ?? 0}');
        debugPrint('TripsTab:   - "Cancelled" tab (cancelled): ${counts['cancelled'] ?? 0}');
        setState(() {
          _badges = counts;
        });
        debugPrint('TripsTab: ✅ Badge counts updated in state');
      } else {
        debugPrint('TripsTab: ⚠️ Widget not mounted, skipping state update');
      }
    } on Exception catch (e) {
      debugPrint('TripsTab: ❌ Exception fetching counts: $e');
      // Don't show error to user for counts - just log it
      // The individual tabs will show errors when loading their data
    } catch (e) {
      debugPrint('TripsTab: ❌ Unexpected error fetching counts: $e');
    } finally {
      _isFetching = false;
    }
  }

  void _startAutoRefresh() {
    _countTimer?.cancel();
    _countTimer = Timer.periodic(_autoRefreshInterval, (_) {
      if (mounted) {
        _fetchCounts();
      }
    });
  }

  void _setupRealtimeRefresh() {
    _bookingSub = SocketService().bookingUpdateStream.listen((event) {
      debugPrint('TripsTab: ========================================');
      debugPrint('TripsTab: 📨📨📨 RECEIVED BOOKING UPDATE EVENT 📨📨📨');
      debugPrint('TripsTab: Full event: $event');
      debugPrint('TripsTab: ========================================');
      
      final type = event['type']?.toString() ?? '';
      debugPrint('TripsTab: Event type: "$type"');
      debugPrint('TripsTab: Current selected tab: ${_tabs[_selectedIndex].label}');
      
      if (type == 'NEW_TRIP_OFFER' || type == 'TRIP_CANCELLED' || type == 'TRIP_ACCEPTED' || type.isEmpty) {
        debugPrint('TripsTab: ✅ Refreshing counts due to event: $type');
        _fetchCounts();
        // Refresh the list if:
        // 1. It's a new offer and we're on the "New" tab
        // 2. It's a trip accepted and we're on the "Not Started" tab
        // 3. It's a trip cancelled (remove from any tab)
        if (mounted) {
          if (type == 'TRIP_ACCEPTED' && _tabs[_selectedIndex].status == kTripStatusNotStarted) {
            // Force refresh of "Not Started" tab when trip is accepted
            debugPrint('TripsTab: ✅ Force refreshing "Not Started" tab (TRIP_ACCEPTED)');
            setState(() => _listVersion++);
          } else if ((type == 'NEW_TRIP_OFFER' || type.isEmpty) && _tabs[_selectedIndex].isLive) {
            // Refresh "New" tab for new offers
            debugPrint('TripsTab: ✅ Force refreshing "New" tab (NEW_TRIP_OFFER)');
            setState(() => _listVersion++);
          } else if (type == 'TRIP_CANCELLED') {
            // Refresh any tab when trip is cancelled
            debugPrint('TripsTab: ✅ Force refreshing current tab (TRIP_CANCELLED)');
            setState(() => _listVersion++);
          }
        }
      }
    });
  }

  void selectTab(int index) {
    if (index >= 0 && index < _tabs.length) {
      if (_selectedIndex == index) {
        setState(() => _listVersion++);
      } else {
        setState(() {
          _selectedIndex = index;
          _listVersion = 0;
        });
      }
      _fetchCounts(); // Refresh counts when switching
    }
  }

  @override
  void dispose() {
    _countTimer?.cancel();
    _bookingSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FD),
      appBar: AppBar(
        title: const Text('Trips'),
        elevation: 0,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _fetchCounts();
              setState(() => _listVersion++);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Segmented Control
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: List.generate(_tabs.length, (index) {
                  final isSelected = _selectedIndex == index;
                  final tab = _tabs[index];
                  final count = _badges[tab.badgeKey] ?? 0;
                  
                  return Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: GestureDetector(
                      onTap: () => selectTab(index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.black : Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isSelected ? Colors.black : Colors.grey.shade300,
                          ),
                        ),
                        child: Row(
                          children: [
                            Text(
                              tab.label,
                              style: TextStyle(
                                color: isSelected ? Colors.white : Colors.black,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            if (count > 0) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isSelected 
                                      ? const Color(0xFF2575FC).withValues(alpha: 0.15)
                                      : Colors.red.shade500,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: isSelected ? null : [
                                    BoxShadow(
                                      color: Colors.red.shade500.withValues(alpha: 0.3),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                constraints: const BoxConstraints(minWidth: 24, minHeight: 20),
                                alignment: Alignment.center,
                                child: Text(
                                  count > 99 ? '99+' : '$count',
                                  style: TextStyle(
                                    color: isSelected ? const Color(0xFF2575FC) : Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
          
          // Content
          Expanded(
            child: BookingListPage(
              key: ValueKey('${_tabs[_selectedIndex].status}_${_tabs[_selectedIndex].isLive}_$_listVersion'), // Force rebuild when status changes
              token: widget.token,
              status: _tabs[_selectedIndex].status,
              isLive: _tabs[_selectedIndex].isLive,
              statusLabel: _tabs[_selectedIndex].label,
              showHeader: false,
              onRefreshCounts: _fetchCounts,
            ),
          ),
        ],
      ),
    );
  }
}

class _TripTabConfig {
  const _TripTabConfig({
    required this.label,
    required this.status,
    required this.badgeKey,
    this.isLive = false,
  });

  final String label;
  final String status;
  final String badgeKey;
  final bool isLive;
}
