import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../l10n/app_localizations.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

enum _VerifState { notStarted, pending, rejected, active }

_VerifState _parseState(String status, String? rejectionReason) {
  if (status == 'active') return _VerifState.active;
  if (status == 'pending') return _VerifState.pending;
  if (rejectionReason != null && rejectionReason.isNotEmpty) {
    return _VerifState.rejected;
  }
  return _VerifState.notStarted;
}

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final _client = ApiClient();
  final _picker = ImagePicker();

  _VerifState _state = _VerifState.notStarted;
  String? _rejectionReason;
  bool _loading = true;
  bool _uploading = false;
  bool _docConsentAccepted = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await _client.dio.get('/users/me');
      final user = res.data as Map<String, dynamic>;
      final status = user['status'] as String? ?? 'new';
      final reason = user['verification_rejection_reason'] as String?;
      setState(() {
        _state = _parseState(status, reason);
        _rejectionReason = reason;
      });
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is Map ? data['message'] : null;
      if (mounted) {
        setState(() => _error = msg is String ? msg : AppLocalizations.of(context)!.uploadError);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickAndUpload() async {
    final choice = await _showSourceSheet();
    if (choice == null) return;

    final XFile? file = await _picker.pickImage(
      source: choice,
      imageQuality: 85,
      maxWidth: 1920,
    );
    if (file == null) return;

    setState(() { _uploading = true; _error = null; });
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path, filename: file.name),
      });
      await _client.dio.post(
        '/users/me/identity-document',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      await _loadStatus();
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is Map ? data['message'] : null;
      if (mounted) {
        setState(() => _error = msg is String ? msg : AppLocalizations.of(context)!.uploadError);
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<ImageSource?> _showSourceSheet() async {
    final l = AppLocalizations.of(context)!;
    return showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: Text(l.sourceCamera),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: Text(l.sourceGallery),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l.verificationTitle,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _buildContent(l),
    );
  }

  Widget _buildContent(AppLocalizations l) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
      children: [
        Center(
          child: Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: _stateColor().withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(_stateIcon(), size: 40, color: _stateColor()),
          ),
        ),
        const SizedBox(height: 20),

        Text(
          _stateTitle(l),
          style: const TextStyle(
            fontSize: 20, fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          _stateSubtitle(l),
          style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
          textAlign: TextAlign.center,
        ),

        if (_state == _VerifState.rejected && _rejectionReason != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              border: Border.all(color: const Color(0xFFFECACA)),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, size: 16, color: AppColors.brand),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    l.reasonPrefix(_rejectionReason!),
                    style: const TextStyle(fontSize: 13, color: AppColors.brand),
                  ),
                ),
              ],
            ),
          ),
        ],

        if (_state == _VerifState.notStarted || _state == _VerifState.rejected) ...[
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.verificationStepsTitle,
                  style: const TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 10),
                _Step(number: '1', text: l.verificationStep1),
                _Step(number: '2', text: l.verificationStep2),
                _Step(number: '3', text: l.verificationStep3),
              ],
            ),
          ),
        ],

        if (_error != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              border: Border.all(color: const Color(0xFFFECACA)),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              _error!,
              style: const TextStyle(fontSize: 13, color: AppColors.brand),
            ),
          ),
        ],

        const SizedBox(height: 24),

        if (_state == _VerifState.notStarted || _state == _VerifState.rejected)
          _ConsentCheckbox(
            value: _docConsentAccepted,
            onChanged: (v) => setState(() => _docConsentAccepted = v ?? false),
            text: l.verificationConsentText,
          ),

        const SizedBox(height: 16),

        if (_state == _VerifState.notStarted || _state == _VerifState.rejected)
          FilledButton.icon(
            onPressed: _uploading || !_docConsentAccepted ? null : _pickAndUpload,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: _uploading
                ? const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.camera_alt_outlined),
            label: Text(
              _uploading ? l.uploadingPhoto : l.btnUploadPhoto,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ),
      ],
    );
  }

  Color _stateColor() {
    switch (_state) {
      case _VerifState.active:   return AppColors.success;
      case _VerifState.pending:  return const Color(0xFFF59E0B);
      case _VerifState.rejected: return AppColors.brand;
      case _VerifState.notStarted: return AppColors.textSecondary;
    }
  }

  IconData _stateIcon() {
    switch (_state) {
      case _VerifState.active:   return Icons.verified_outlined;
      case _VerifState.pending:  return Icons.hourglass_top_outlined;
      case _VerifState.rejected: return Icons.cancel_outlined;
      case _VerifState.notStarted: return Icons.badge_outlined;
    }
  }

  String _stateTitle(AppLocalizations l) {
    switch (_state) {
      case _VerifState.active:   return l.verifActiveTitle;
      case _VerifState.pending:  return l.verifPendingTitle;
      case _VerifState.rejected: return l.verifRejectedTitle;
      case _VerifState.notStarted: return l.verifNotStartedTitle;
    }
  }

  String _stateSubtitle(AppLocalizations l) {
    switch (_state) {
      case _VerifState.active:   return l.verifActiveSubtitle;
      case _VerifState.pending:  return l.verifPendingSubtitle;
      case _VerifState.rejected: return l.verifRejectedSubtitle;
      case _VerifState.notStarted: return l.verifNotStartedSubtitle;
    }
  }
}

class _Step extends StatelessWidget {
  final String number;
  final String text;
  const _Step({required this.number, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 20, height: 20,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.textPrimary,
              shape: BoxShape.circle,
            ),
            child: Text(
              number,
              style: const TextStyle(
                fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}

class _ConsentCheckbox extends StatelessWidget {
  final bool value;
  final ValueChanged<bool?> onChanged;
  final String text;
  const _ConsentCheckbox({
    required this.value,
    required this.onChanged,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: GestureDetector(
            onTap: () => onChanged(!value),
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.45,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
