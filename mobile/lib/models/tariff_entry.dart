class TariffEntry {
  final String leadType;
  final String? city;
  final String method;
  final double value;

  const TariffEntry({
    required this.leadType,
    this.city,
    required this.method,
    required this.value,
  });

  factory TariffEntry.fromJson(Map<String, dynamic> json) => TariffEntry(
        leadType: json['lead_type'] as String,
        city: json['city'] as String?,
        method: json['method'] as String,
        value: double.parse(json['value'] as String),
      );
}
