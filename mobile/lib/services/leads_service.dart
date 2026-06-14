import '../models/lead.dart';
import 'api_client.dart';

class LeadsService {
  final _dio = ApiClient().dio;

  Future<List<Lead>> getMyCreated() async {
    final response = await _dio.get('/leads/my-created');
    return (response.data as List)
        .map((j) => Lead.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<List<Lead>> getMyAssigned() async {
    final response = await _dio.get('/leads/my-assigned');
    return (response.data as List)
        .map((j) => Lead.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<Lead> getOne(String id) async {
    final response = await _dio.get('/leads/$id');
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }
}
