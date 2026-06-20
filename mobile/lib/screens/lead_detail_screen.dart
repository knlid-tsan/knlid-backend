import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../l10n/app_localizations.dart';
import '../l10n/lead_labels.dart';
import '../models/lead.dart';
import '../services/leads_service.dart';
import '../services/api_client.dart';
import '../services/phone_formatter.dart';
import '../config.dart';
import '../theme/app_colors.dart';
import 'verification_screen.dart';

String _resolveFileUrl(String base, String key) {
  if (key.startsWith('http://') || key.startsWith('https://')) return key;
  if (key.startsWith('/')) return '$base$key';
  return '$base/$key';
}

String _fmt(String amount) {
  final n = double.tryParse(amount);
  if (n == null) return amount;
  return n
      .toStringAsFixed(0)
      .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
}

class _ThousandsFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.isEmpty) return newValue.copyWith(text: '');
    final formatted = digits.replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]} ',
    );
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

String _extractError(Object e) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map) {
      final msg = data['message'];
      if (msg is String) return msg;
    }
    return 'Ошибка ${e.response?.statusCode ?? "сети"}';
  }
  return e.toString();
}

// ─── Screen ──────────────────────────────────────────────────────────────────

class LeadDetailScreen extends StatefulWidget {
  final String leadId;
  const LeadDetailScreen({super.key, required this.leadId});

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen> {
  final _service = LeadsService();
  final _picker = ImagePicker();

  Lead? _lead;
  LeadTariff? _tariff;
  String _userId = '';
  bool _loading = true;
  String? _error;
  bool _actionLoading = false;
  bool _proofUploading = false;

  bool get _isExecutor =>
      _userId.isNotEmpty && _userId == _lead?.executorId;
  bool get _isAuthor =>
      _userId.isNotEmpty && _userId == _lead?.authorId;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    if (_userId.isEmpty) {
      final token = await ApiClient().getToken();
      if (token != null) {
        try {
          final p = ApiClient().decodeTokenPayload(token);
          _userId = p['sub'] as String? ?? '';
        } catch (_) {}
      }
    }
    await _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final lead = await _service.getOne(widget.leadId);
      LeadTariff? tariff;
      if (_userId == lead.executorId) {
        try {
          tariff = await _service.getTariff(widget.leadId);
        } catch (_) {}
      }
      if (mounted) {
        setState(() {
          _lead = lead;
          _tariff = tariff;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = _extractError(e); _loading = false; });
    }
  }

  // ─── Action helpers ────────────────────────────────────────────────────────

  void _showSnack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? AppColors.brand : AppColors.success,
    ));
  }

  Future<void> _runAction(Future<void> Function() action) async {
    setState(() => _actionLoading = true);
    try {
      await action();
    } catch (e) {
      _showSnack(_extractError(e), error: true);
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<String?> _showReasonDialog(String title, String hint) {
    final l = AppLocalizations.of(context)!;
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: ctrl,
          maxLines: 3,
          autofocus: true,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: AppColors.surface,
            border: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(12)),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l.btnCancel),
          ),
          FilledButton(
            onPressed: () {
              final t = ctrl.text.trim();
              if (t.isNotEmpty) Navigator.pop(ctx, t);
            },
            style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            child: Text(l.btnSend),
          ),
        ],
      ),
    );
  }

  Future<void> _pickAndUploadProof() async {
    final l = AppLocalizations.of(context)!;
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
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
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;

    final file = await _picker.pickImage(source: source, imageQuality: 85, maxWidth: 1920);
    if (file == null || !mounted) return;

    setState(() => _proofUploading = true);
    try {
      await _service.submitProof(widget.leadId, file.path);
      await _load();
      if (mounted) _showSnack(AppLocalizations.of(context)!.proofAttachedSnack);
    } catch (e) {
      _showSnack(_extractError(e), error: true);
    } finally {
      if (mounted) setState(() => _proofUploading = false);
    }
  }

  Future<void> _confirmPayment() async {
    await _runAction(() async {
      await _service.confirmPayment(widget.leadId);
      await _load();
      if (mounted) _showSnack(AppLocalizations.of(context)!.paymentConfirmedSnack);
    });
  }

  Future<void> _onAccept() async {
    setState(() => _actionLoading = true);
    try {
      await _service.acceptLead(widget.leadId);
      await _load();
      if (mounted) _showSnack(AppLocalizations.of(context)!.leadAcceptedSnack);
    } on DioException catch (e) {
      final msg = _extractError(e);
      if (e.response?.statusCode == 403 &&
          msg.toLowerCase().contains('верификац')) {
        if (!mounted) return;
        final l = AppLocalizations.of(context)!;
        await showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text(l.verificationRequired),
            content: Text(l.verificationRequiredBody),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(l.btnLater),
              ),
              FilledButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const VerificationScreen(),
                    ),
                  );
                },
                style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                child: Text(l.btnGoVerify),
              ),
            ],
          ),
        );
      } else {
        _showSnack(msg, error: true);
      }
    } catch (e) {
      _showSnack(_extractError(e), error: true);
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _onDecline() async {
    final l = AppLocalizations.of(context)!;
    final reason = await _showReasonDialog(l.declineLeadTitle, l.declineLeadHint);
    if (reason == null) return;
    await _runAction(() async {
      await _service.declineLead(widget.leadId, reason);
      if (mounted) Navigator.pop(context);
    });
  }

  Future<void> _onUpdateStatus(String status) => _runAction(() async {
        await _service.updateStatus(widget.leadId, status);
        await _load();
      });

  Future<void> _onClose() async {
    final l = AppLocalizations.of(context)!;
    final tariff = _tariff;
    final isPercent = tariff?.method == 'percent';
    final isFixed = tariff?.method == 'fixed';

    final commissionCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 32,
        ),
        child: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                l.closeLeadTitle,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 20),

              if (isFixed) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDF4),
                    border: Border.all(color: const Color(0xFF86EFAC)),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_outline,
                          size: 16, color: Color(0xFF16A34A)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          l.rewardAuthorLabel(tariff!.description),
                          style: const TextStyle(
                              fontSize: 13, color: Color(0xFF15803D)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  l.rewardFixedHint,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary),
                ),
              ],

              if (!isFixed) ...[
                TextFormField(
                  controller: commissionCtrl,
                  autofocus: true,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: false),
                  inputFormatters: [_ThousandsFormatter()],
                  decoration: InputDecoration(
                    labelText: l.commissionLabel,
                    hintText: '0',
                    filled: true,
                    fillColor: AppColors.surface,
                    border: const OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(12)),
                      borderSide:
                          BorderSide(color: AppColors.primary, width: 1.5),
                    ),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return l.fieldRequired;
                    final n = double.tryParse(
                        v.trim().replaceAll(' ', '').replaceAll(',', '.'));
                    if (n == null || n <= 0) return l.amountPositive;
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                Text(
                  isPercent ? l.percentCommissionHint : l.commissionHint,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary),
                ),
              ],

              const SizedBox(height: 20),
              FilledButton(
                onPressed: () {
                  if (isFixed || formKey.currentState!.validate()) {
                    Navigator.pop(ctx, true);
                  }
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.success,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  l.btnConfirmClose,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed != true || !mounted) return;

    double? amount;
    if (!isFixed) {
      final raw = commissionCtrl.text.trim()
          .replaceAll(' ', '')
          .replaceAll(',', '.');
      amount = double.parse(raw);
    }

    await _runAction(() async {
      await _service.updateStatus(
        widget.leadId,
        'closed_success',
        commissionAmount: amount,
      );
      await _load();
      if (mounted) _showSnack(AppLocalizations.of(context)!.leadClosedSnack);
    });
  }

  Future<void> _onCancelByExecutor() async {
    final l = AppLocalizations.of(context)!;
    final reason = await _showReasonDialog(l.cancelLeadTitle, l.cancelLeadHint);
    if (reason == null) return;
    await _runAction(() async {
      await _service.updateStatus(widget.leadId, 'cancelled', comment: reason);
      await _load();
      if (mounted) _showSnack(AppLocalizations.of(context)!.leadCancelledSnack);
    });
  }

  Future<void> _onDispute() async {
    final l = AppLocalizations.of(context)!;
    final reason = await _showReasonDialog(l.openDisputeTitle, l.openDisputeHint);
    if (reason == null) return;
    await _runAction(() async {
      await _service.openDispute(widget.leadId, reason);
      await _load();
      if (mounted) _showSnack(AppLocalizations.of(context)!.disputeOpenedSnack);
    });
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: Text(
          _lead != null ? leadTypeLabel(l, _lead!.type) : l.leadDetailTitle,
          style: const TextStyle(
              color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());

    if (_error != null) {
      final l = AppLocalizations.of(context)!;
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error!,
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.textSecondary),
                  textAlign: TextAlign.center),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh, size: 16),
                label: Text(l.btnRetry),
              ),
            ],
          ),
        ),
      );
    }

    final l = AppLocalizations.of(context)!;
    final lead = _lead!;
    final actionsWidget = _buildActionsBar(lead);

    return Column(
      children: [
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _StatusBanner(lead: lead),

                if (_tariff != null &&
                    _isExecutor &&
                    lead.status == 'pending_acceptance') ...[
                  const SizedBox(height: 10),
                  _TariffBanner(tariff: _tariff!),
                ],

                const SizedBox(height: 12),
                _Section(title: l.sectionAuthor, rows: [
                  if (lead.authorName != null) _Row(l.rowName, lead.authorName!),
                  _Row(l.rowLeadType, leadTypeLabel(l, lead.type)),
                  _Row(l.rowCity, lead.city),
                  _Row(l.rowCreated, formatLeadDateL(lead.createdAt, l)),
                  if (lead.closedAt != null)
                    _Row(l.rowClosed, formatLeadDateL(lead.closedAt!, l)),
                ]),

                if (_isAuthor) ...[
                  const SizedBox(height: 12),
                  _Section(title: l.sectionExecutor, rows: [
                    _Row(
                      l.rowName,
                      lead.executorName ?? l.notAssigned,
                      dimValue: lead.executorName == null,
                    ),
                  ]),
                ],

                const SizedBox(height: 12),
                if (lead.client != null && lead.client!.fullName != null)
                  _Section(title: l.sectionClient, rows: [
                    _Row(l.rowName, lead.client!.fullName!),
                    _Row(l.rowCity, lead.client!.city),
                    if (lead.client!.phone != null)
                      _Row(l.rowPhone, formatPhone(lead.client!.phone)),
                  ])
                else
                  _ClientPlaceholder(isExecutor: _isExecutor),

                const SizedBox(height: 12),
                _DescriptionSection(text: lead.description),

                if (lead.rewardAmount != null) ...[
                  const SizedBox(height: 12),
                  _Section(title: l.sectionReward, rows: [
                    _Row(l.rowAmount, '${_fmt(lead.rewardAmount!)} ₸'),
                    _Row(l.rowPaid, lead.rewardPaid ? l.yes : l.no),
                  ]),
                ],

                if (_isExecutor &&
                    lead.status == 'closed_success' &&
                    lead.authorPayment != null) ...[
                  const SizedBox(height: 12),
                  _AuthorPaymentBlock(payment: lead.authorPayment!),
                  if (lead.rewardStatus == 'awaiting_payment') ...[
                    const SizedBox(height: 12),
                    _ProofUploadBlock(
                      onUpload: _pickAndUploadProof,
                      uploading: _proofUploading,
                    ),
                  ] else if (lead.rewardStatus == 'paid') ...[
                    const SizedBox(height: 12),
                    const _ReceiptSentBanner(),
                  ],
                ],

                if (_isAuthor &&
                    lead.status == 'closed_success' &&
                    lead.rewardStatus == 'paid') ...[
                  const SizedBox(height: 12),
                  _ConfirmPaymentBlock(
                    proofUrl: lead.rewardProofUrl,
                    onConfirm: _confirmPayment,
                    confirming: _actionLoading,
                  ),
                ],

                if (lead.status == 'archived') ...[
                  const SizedBox(height: 12),
                  _PaymentConfirmedBanner(closedAt: lead.closedAt),
                ],

                if (lead.guarantor != null && lead.guarantor!.active) ...[
                  const SizedBox(height: 12),
                  _Section(title: l.sectionGuarantor, rows: [
                    _Row(l.rowCompany, lead.guarantor!.companyName),
                  ]),
                ],

                if (lead.history != null && lead.history!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _HistorySection(history: lead.history!),
                ],

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
        ?actionsWidget,
      ],
    );
  }

  Widget? _buildActionsBar(Lead lead) {
    if (_actionLoading) {
      return const _ActionBar(
        child: Center(
          child: SizedBox(
            height: 24,
            width: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    final l = AppLocalizations.of(context)!;
    final status = lead.status;

    if (_isExecutor) {
      if (status == 'pending_acceptance') {
        return _ActionBar(
          child: Row(children: [
            _ActionBtn(label: l.btnAccept, onTap: _onAccept, filled: true),
            const SizedBox(width: 12),
            _ActionBtn(label: l.btnDecline, onTap: _onDecline, danger: true),
          ]),
        );
      }
      if (status == 'in_progress') {
        return _ActionBar(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(children: [
                _ActionBtn(
                    label: l.btnContract,
                    onTap: () => _onUpdateStatus('contract'),
                    small: true),
                const SizedBox(width: 8),
                _ActionBtn(
                    label: l.btnDeposit,
                    onTap: () => _onUpdateStatus('deposit'),
                    small: true),
                const SizedBox(width: 8),
                _MutedCancelBtn(onTap: _onCancelByExecutor),
              ]),
              const SizedBox(height: 8),
              _CloseBtn(label: l.btnClose, onTap: _onClose),
            ],
          ),
        );
      }
      if (status == 'contract') {
        return _ActionBar(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(children: [
                _ActionBtn(
                    label: l.btnDeposit,
                    onTap: () => _onUpdateStatus('deposit'),
                    small: true),
                const SizedBox(width: 8),
                _MutedCancelBtn(onTap: _onCancelByExecutor),
              ]),
              const SizedBox(height: 8),
              _CloseBtn(label: l.btnClose, onTap: _onClose),
            ],
          ),
        );
      }
      if (status == 'deposit') {
        return _ActionBar(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(children: [
                _MutedCancelBtn(onTap: _onCancelByExecutor),
              ]),
              const SizedBox(height: 8),
              _CloseBtn(label: l.btnCloseDeal, onTap: _onClose),
            ],
          ),
        );
      }
    }

    if (_isAuthor) {
      const disputeStatuses = [
        'in_progress',
        'contract',
        'deposit',
        'closed_success',
        'cancelled',
      ];
      if (disputeStatuses.contains(status)) {
        return _ActionBar(
          child: Row(children: [
            _ActionBtn(
                label: l.btnOpenDispute,
                onTap: _onDispute,
                danger: true),
          ]),
        );
      }
    }

    return null;
  }
}

// ─── Layout widgets ───────────────────────────────────────────────────────────

class _ActionBar extends StatelessWidget {
  final Widget child;
  const _ActionBar({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: SafeArea(top: false, child: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: child,
      )),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool filled;
  final bool danger;
  final bool small;

  const _ActionBtn({
    required this.label,
    required this.onTap,
    this.filled = false,
    this.danger = false,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    final vPad = small ? 10.0 : 14.0;
    final fontSize = small ? 13.0 : 15.0;

    if (filled) {
      return Expanded(
        child: FilledButton(
          onPressed: onTap,
          style: FilledButton.styleFrom(
            backgroundColor: danger ? AppColors.brand : AppColors.primary,
            padding: EdgeInsets.symmetric(vertical: vPad),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
          child: Text(label,
              style: TextStyle(
                  fontWeight: FontWeight.w600, fontSize: fontSize)),
        ),
      );
    }

    final borderColor = danger ? AppColors.brand : AppColors.divider;
    final textColor = danger ? AppColors.brand : AppColors.textSecondary;

    return Expanded(
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: borderColor),
          padding: EdgeInsets.symmetric(vertical: vPad),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12)),
        ),
        child: Text(label,
            style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.w500,
                fontSize: fontSize)),
      ),
    );
  }
}

class _MutedCancelBtn extends StatelessWidget {
  final VoidCallback onTap;
  const _MutedCancelBtn({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        side: const BorderSide(color: AppColors.divider),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Text(
        l.btnCancelAction,
        style: const TextStyle(
          color: AppColors.textSecondary,
          fontWeight: FontWeight.w500,
          fontSize: 13,
        ),
      ),
    );
  }
}

class _CloseBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _CloseBtn({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: onTap,
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.success,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Text(
        label,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    );
  }
}

// ─── Content widgets ──────────────────────────────────────────────────────────

class _StatusBanner extends StatelessWidget {
  final Lead lead;
  const _StatusBanner({required this.lead});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final color = leadStatusColor(lead.status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Text(
            leadStatusLabel(l, lead.status),
            style: TextStyle(
                fontWeight: FontWeight.w600, color: color, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class _TariffBanner extends StatelessWidget {
  final LeadTariff tariff;
  const _TariffBanner({required this.tariff});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        border: Border.all(color: const Color(0xFFFCD34D)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 16, color: Color(0xFF92400E)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.tariffBannerTitle,
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF92400E)),
                ),
                const SizedBox(height: 4),
                Text(
                  l.rewardAuthorLabel(tariff.description),
                  style: const TextStyle(
                      fontSize: 13, color: Color(0xFF92400E)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<_Row> rows;
  const _Section({required this.title, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(),
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.5)),
          const SizedBox(height: 10),
          ...rows,
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final bool dimValue;
  const _Row(this.label, this.value, {this.dimValue = false});

  @override
  Widget build(BuildContext context) {
    final valueColor =
        dimValue ? AppColors.divider : AppColors.textPrimary;
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary)),
          ),
          Expanded(
            child: Text(value,
                style: TextStyle(
                    fontSize: 13,
                    color: valueColor,
                    fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

class _DescriptionSection extends StatelessWidget {
  final String text;
  const _DescriptionSection({required this.text});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l.sectionDescription,
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.5)),
          const SizedBox(height: 10),
          Text(text,
              style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textPrimary,
                  height: 1.5)),
        ],
      ),
    );
  }
}

class _ClientPlaceholder extends StatelessWidget {
  final bool isExecutor;
  const _ClientPlaceholder({required this.isExecutor});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock_outline, size: 16, color: AppColors.divider),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isExecutor ? l.clientDataLocked : l.sectionClient,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.divider,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Author payment block ─────────────────────────────────────────────────────

class _AuthorPaymentBlock extends StatelessWidget {
  final AuthorPayment payment;
  const _AuthorPaymentBlock({required this.payment});

  String _fmtAmount(String raw) {
    final n = double.tryParse(raw);
    if (n == null) return raw;
    return n
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        border: Border.all(color: const Color(0xFF86EFAC)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.account_balance_outlined,
                  size: 15, color: Color(0xFF16A34A)),
              const SizedBox(width: 8),
              Text(
                l.paymentToAuthorTitle,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF16A34A),
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),

          if (payment.rewardAmount != null) ...[
            const SizedBox(height: 12),
            Text(
              l.paymentToAuthorPrefix,
              style: const TextStyle(fontSize: 13, color: Color(0xFF15803D)),
            ),
            const SizedBox(height: 4),
            Text(
              '${_fmtAmount(payment.rewardAmount!)} ₸',
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: Color(0xFF15803D),
              ),
            ),
            const Divider(color: Color(0xFF86EFAC), height: 24),
          ] else
            const SizedBox(height: 12),

          Text(
            payment.bankName,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Color(0xFF15803D),
            ),
          ),
          const SizedBox(height: 6),

          GestureDetector(
            onTap: () {
              Clipboard.setData(ClipboardData(text: payment.phone));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(l.phoneCopied),
                  backgroundColor: AppColors.success,
                  duration: const Duration(seconds: 2),
                ),
              );
            },
            child: Row(
              children: [
                Text(
                  formatPhone(payment.phone),
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF15803D),
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.copy_outlined, size: 15, color: Color(0xFF16A34A)),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            l.copyPhoneHint,
            style: const TextStyle(fontSize: 11, color: Color(0xFF4ADE80)),
          ),
        ],
      ),
    );
  }
}

// ─── History ──────────────────────────────────────────────────────────────────

class _HistorySection extends StatelessWidget {
  final List<StatusHistoryItem> history;
  const _HistorySection({required this.history});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(l.historyTitle,
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                  letterSpacing: 0.5)),
          const SizedBox(height: 12),
          ...history.map((h) => _HistoryRow(h)),
        ],
      ),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  final StatusHistoryItem item;
  const _HistoryRow(this.item);

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final toColor = leadStatusColor(item.toStatus);
    final fromLabel = item.fromStatus != null
        ? leadStatusLabel(l, item.fromStatus!)
        : '—';
    final toLabel = leadStatusLabel(l, item.toStatus);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Container(
              width: 8,
              height: 8,
              decoration:
                  BoxDecoration(color: toColor, shape: BoxShape.circle),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textPrimary),
                    children: [
                      TextSpan(text: fromLabel),
                      const TextSpan(
                          text: ' → ',
                          style: TextStyle(color: AppColors.textSecondary)),
                      TextSpan(
                          text: toLabel,
                          style: TextStyle(
                              color: toColor,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                const SizedBox(height: 2),
                Text(formatLeadDateL(item.createdAt, l),
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textSecondary)),
                if (item.comment != null) ...[
                  const SizedBox(height: 2),
                  Text(item.comment!,
                      style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          fontStyle: FontStyle.italic)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Proof upload block (executor) ───────────────────────────────────────────

class _ProofUploadBlock extends StatelessWidget {
  final VoidCallback onUpload;
  final bool uploading;
  const _ProofUploadBlock({required this.onUpload, required this.uploading});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        border: Border.all(color: const Color(0xFFFBBF24)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.receipt_long_outlined,
                  size: 15, color: Color(0xFFD97706)),
              const SizedBox(width: 8),
              Text(
                l.proofTitle,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFD97706),
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            l.proofBody,
            style: const TextStyle(fontSize: 13, color: Color(0xFF92400E)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: uploading ? null : onUpload,
              icon: uploading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.upload_outlined, size: 18),
              label: Text(uploading ? l.uploading : l.btnAttachProof),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFD97706),
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Receipt sent banner (executor after upload) ──────────────────────────────

class _ReceiptSentBanner extends StatelessWidget {
  const _ReceiptSentBanner();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        border: Border.all(color: const Color(0xFF86EFAC)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline,
              size: 18, color: Color(0xFF16A34A)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              l.proofAttachedSnack,
              style: const TextStyle(fontSize: 13, color: Color(0xFF15803D)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Confirm payment block (author) ──────────────────────────────────────────

class _ConfirmPaymentBlock extends StatelessWidget {
  final String? proofUrl;
  final VoidCallback onConfirm;
  final bool confirming;
  const _ConfirmPaymentBlock({
    required this.proofUrl,
    required this.onConfirm,
    required this.confirming,
  });

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final imageUrl = proofUrl != null
        ? _resolveFileUrl(AppConfig.apiBaseUrl, proofUrl!)
        : null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F9FF),
        border: Border.all(color: const Color(0xFF7DD3FC)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.payments_outlined,
                  size: 15, color: Color(0xFF0284C7)),
              const SizedBox(width: 8),
              Text(
                l.paymentMarkedTitle,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0284C7),
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            l.paymentMarkedBody,
            style: const TextStyle(fontSize: 13, color: Color(0xFF0369A1)),
          ),

          if (imageUrl != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                imageUrl,
                fit: BoxFit.contain,
                width: double.infinity,
                errorBuilder: (_, __, ___) => Container(
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F2FE),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      l.receiptLoadFailed,
                      style: const TextStyle(
                          fontSize: 12, color: Color(0xFF0369A1)),
                    ),
                  ),
                ),
              ),
            ),
          ],

          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: confirming ? null : onConfirm,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF0284C7),
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              child: confirming
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : Text(l.btnConfirmPayment,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l.autoConfirmHint,
            style: const TextStyle(fontSize: 11, color: Color(0xFF0369A1)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ─── Payment confirmed banner (archived) ─────────────────────────────────────

class _PaymentConfirmedBanner extends StatelessWidget {
  final DateTime? closedAt;
  const _PaymentConfirmedBanner({this.closedAt});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        border: Border.all(color: const Color(0xFF86EFAC)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.verified_outlined, size: 20, color: Color(0xFF16A34A)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.rewardConfirmedBanner,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF15803D),
                  ),
                ),
                if (closedAt != null) ...[
                  const SizedBox(height: 3),
                  Text(
                    l.closedAtLabel(formatLeadDateL(closedAt!, l)),
                    style: const TextStyle(
                        fontSize: 11, color: Color(0xFF4ADE80)),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
