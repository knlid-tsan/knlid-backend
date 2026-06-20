import '../models/tariff_entry.dart';
import 'api_client.dart';

class TariffsService {
  final _dio = ApiClient().dio;

  Future<List<TariffEntry>> getTariffs() async {
    final response = await _dio.get('/rewards/tariffs');
    return (response.data as List)
        .map((j) => TariffEntry.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<List<String>> getCities() async {
    final response = await _dio.get('/cities');
    return (response.data as List)
        .cast<Map<String, dynamic>>()
        .where((c) => c['is_active'] == true)
        .map((c) => c['name'] as String)
        .toList()
      ..sort();
  }
}
