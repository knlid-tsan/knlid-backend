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

  Future<LeadTariff> getTariff(String id) async {
    final response = await _dio.get('/leads/$id/tariff');
    return LeadTariff.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Lead> acceptLead(String id) async {
    final response = await _dio.post('/leads/$id/accept');
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Lead> declineLead(String id, String reason) async {
    final response = await _dio.post(
      '/leads/$id/decline',
      data: {'reason': reason},
    );
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Lead> updateStatus(
    String id,
    String status, {
    double? commissionAmount,
  }) async {
    final data = <String, dynamic>{'status': status};
    if (commissionAmount != null) data['commission_amount'] = commissionAmount;
    final response = await _dio.patch('/leads/$id/status', data: data);
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Lead> openDispute(String id, String reason) async {
    final response = await _dio.post(
      '/leads/$id/dispute',
      data: {'reason': reason},
    );
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }
}
