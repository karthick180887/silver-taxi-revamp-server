import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

/// Service to extract odometer readings from photos using Google ML Kit OCR
class OdometerOcrService {
  static final OdometerOcrService _instance = OdometerOcrService._internal();
  factory OdometerOcrService() => _instance;
  OdometerOcrService._internal();

  final TextRecognizer _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

  /// Extract odometer reading from an image file
  /// Returns the detected number as double, or null if extraction fails
  Future<OcrResult> extractOdometerReading(File imageFile) async {
    try {
      debugPrint('[OdometerOCR] Processing image: ${imageFile.path}');
      
      final inputImage = InputImage.fromFile(imageFile);
      final recognizedText = await _textRecognizer.processImage(inputImage);
      
      debugPrint('[OdometerOCR] Raw text detected: ${recognizedText.text}');
      debugPrint('[OdometerOCR] Number of blocks: ${recognizedText.blocks.length}');
      
      // Extract all numbers from the recognized text
      final allNumbers = <ExtractedNumber>[];
      
      for (final block in recognizedText.blocks) {
        for (final line in block.lines) {
          debugPrint('[OdometerOCR] Line: ${line.text}');
          
          // Extract numbers from this line
          final numbers = _extractNumbers(line.text);
          for (final num in numbers) {
            allNumbers.add(ExtractedNumber(
              value: num,
              confidence: line.confidence ?? 0.0,
              text: line.text,
            ));
          }
        }
      }
      
      if (allNumbers.isEmpty) {
        debugPrint('[OdometerOCR] No numbers found in image');
        return OcrResult(
          success: false,
          rawText: recognizedText.text,
          message: 'No numbers detected in image. Please take a clearer photo of the odometer.',
        );
      }
      
      // Sort by value (odometer readings are typically larger numbers)
      // Filter out very small numbers (likely not odometer readings)
      final validNumbers = allNumbers.where((n) => n.value >= 100).toList();
      
      if (validNumbers.isEmpty) {
        // If no large numbers, use the largest small number
        allNumbers.sort((a, b) => b.value.compareTo(a.value));
        final bestGuess = allNumbers.first;
        
        debugPrint('[OdometerOCR] Only small numbers found. Best guess: ${bestGuess.value}');
        return OcrResult(
          success: true,
          value: bestGuess.value,
          confidence: bestGuess.confidence,
          rawText: recognizedText.text,
          message: 'Detected: ${bestGuess.value.toStringAsFixed(1)} km',
          needsConfirmation: true,
        );
      }
      
      // Find the most likely odometer reading
      // Prefer larger numbers with higher confidence
      validNumbers.sort((a, b) {
        // Weight by size (larger numbers more likely) and confidence
        final scoreA = a.value * (a.confidence + 0.5);
        final scoreB = b.value * (b.confidence + 0.5);
        return scoreB.compareTo(scoreA);
      });
      
      final bestNumber = validNumbers.first;
      debugPrint('[OdometerOCR] Best match: ${bestNumber.value} (confidence: ${bestNumber.confidence})');
      
      return OcrResult(
        success: true,
        value: bestNumber.value,
        confidence: bestNumber.confidence,
        rawText: recognizedText.text,
        message: 'Detected: ${bestNumber.value.toStringAsFixed(1)} km',
        allDetectedNumbers: allNumbers.map((n) => n.value).toList(),
      );
      
    } catch (e, stackTrace) {
      debugPrint('[OdometerOCR] Error processing image: $e');
      debugPrint('[OdometerOCR] Stack trace: $stackTrace');
      return OcrResult(
        success: false,
        message: 'Failed to process image: ${e.toString()}',
      );
    }
  }

  /// Extract all numeric values from a text string
  List<double> _extractNumbers(String text) {
    final numbers = <double>[];
    
    // Clean the text - remove common OCR mistakes
    String cleanText = text
        .replaceAll('O', '0')  // Common OCR mistake
        .replaceAll('o', '0')
        .replaceAll('I', '1')
        .replaceAll('l', '1')
        .replaceAll('S', '5')
        .replaceAll(',', '')   // Remove comma separators
        .replaceAll(' ', '');  // Remove spaces
    
    // Match numbers (including decimals)
    // Pattern matches: integers, decimals, and numbers with dots as thousand separators
    final regex = RegExp(r'(\d+\.?\d*)');
    final matches = regex.allMatches(cleanText);
    
    for (final match in matches) {
      final numStr = match.group(1);
      if (numStr != null && numStr.isNotEmpty) {
        final value = double.tryParse(numStr);
        if (value != null && value > 0) {
          numbers.add(value);
        }
      }
    }
    
    return numbers;
  }

  /// Dispose resources when done
  void dispose() {
    _textRecognizer.close();
  }
}

/// Result of OCR extraction
class OcrResult {
  final bool success;
  final double? value;
  final double confidence;
  final String? rawText;
  final String message;
  final bool needsConfirmation;
  final List<double>? allDetectedNumbers;

  OcrResult({
    required this.success,
    this.value,
    this.confidence = 0.0,
    this.rawText,
    required this.message,
    this.needsConfirmation = false,
    this.allDetectedNumbers,
  });
}

/// Extracted number with metadata
class ExtractedNumber {
  final double value;
  final double confidence;
  final String text;

  ExtractedNumber({
    required this.value,
    required this.confidence,
    required this.text,
  });
}
