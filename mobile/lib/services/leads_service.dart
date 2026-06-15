import 'package:dio/dio.dart';
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
    String? comment,
  }) async {
    final data = <String, dynamic>{'status': status};
    if (commissionAmount != null) data['commission_amount'] = commissionAmount;
    if (comment != null && comment.isNotEmpty) data['comment'] = comment;
    final response = await _dio.patch('/leads/$id/status', data: data);
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> submitProof(String id, String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });
    await _dio.post(
      '/leads/$id/submit-proof',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
  }

  Future<Lead> confirmPayment(String id) async {
    final response = await _dio.post('/leads/$id/confirm-payment');
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Lead> openDispute(String id, String reason) async {
    final response = await _dio.post(
      '/leads/$id/dispute',
      data: {'reason': reason},
    );
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> checkDuplicate(String type, String phone) async {
    final response = await _dio.get(
      '/leads/check-duplicate',
      queryParameters: {'type': type, 'phone': phone},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Lead> createLead({
    required String type,
    required String city,
    required String description,
    required String clientPhone,
    required String clientName,
    required String clientCity,
    bool force = false,
  }) async {
    final data = <String, dynamic>{
      'type': type,
      'city': city,
      'description': description,
      'client': {
        'phone': clientPhone,
        'full_name': clientName,
        'city': clientCity,
      },
    };
    if (force) data['force'] = true;
    final response = await _dio.post('/leads', data: data);
    return Lead.fromJson(response.data as Map<String, dynamic>);
  }
}
