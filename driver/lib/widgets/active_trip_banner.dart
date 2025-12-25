import 'package:flutter/material.dart';
import '../models/trip_models.dart';
import '../design_system.dart';

/// A banner widget that displays active trip information
/// Shows when driver has a Not-Started or Started trip
class ActiveTripBanner extends StatelessWidget {
  const ActiveTripBanner({
    super.key,
    required this.trip,
    required this.onContinue,
  });

  final TripModel trip;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final isStarted = trip.isStarted;
    final statusColor = isStarted ? Colors.orange : AppColors.success;
    
    return GestureDetector(
      onTap: onContinue,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isStarted 
              ? [Colors.orange.shade600, Colors.orange.shade800]
              : [AppColors.success, Colors.green.shade700],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: statusColor.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row - Status & Badge
              _buildHeaderSection(isStarted),
              
              const SizedBox(height: 12),
              
              // Customer Name
              Text(
                trip.customerName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              
              const SizedBox(height: 12),
              const Divider(color: Colors.white24, height: 1),
              const SizedBox(height: 12),
              
              // Locations
              _buildLocationItem(Icons.radio_button_checked, 'Pickup', trip.pickup.address),
              const SizedBox(height: 8),
              _buildLocationItem(Icons.location_on, 'Drop', trip.drop.address),
              
              const SizedBox(height: 16),
              
              // Footer - Fare & Button
              _buildFooterSection(isStarted, statusColor),
              
              // Warning - always show since all active trips block new offers
              const SizedBox(height: 12),
              _buildWarningSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderSection(bool isStarted) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            isStarted ? Icons.directions_car : Icons.schedule,
            color: Colors.white,
            size: 20,
          ),
        ),
        Text(
          isStarted ? 'Trip In Progress' : 'Trip Accepted',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (isStarted)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              'ACTIVE',
              style: TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildLocationItem(IconData icon, String label, String address) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.7),
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          address,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildFooterSection(bool isStarted, Color statusColor) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      alignment: WrapAlignment.spaceBetween,
      children: [
        // Fare
        if (trip.fare != null)
          Text(
            '₹${trip.fare!.toStringAsFixed(0)}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
        // Button
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            isStarted ? 'Continue Trip →' : 'Start Trip →',
            style: TextStyle(
              color: statusColor,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildWarningSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '⚠️ New offers are blocked. Complete this trip to receive new bookings.',
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.9),
          fontSize: 11,
        ),
      ),
    );
  }
}
