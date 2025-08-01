<?php
/**
 * Payment Controller
 * LaburAR Complete Platform
 * 
 * Complete payment processing with MercadoPago integration,
 * escrow management, withdrawals, and financial operations
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../models/Payment.php';
require_once __DIR__ . '/../includes/SecurityHelper.php';
require_once __DIR__ . '/../includes/ValidationHelper.php';
require_once __DIR__ . '/../includes/RateLimiter.php';

class PaymentController {
    private $securityHelper;
    private $validator;
    private $rateLimiter;
    
    public function __construct() {
        $this->securityHelper = new SecurityHelper();
        $this->validator = new ValidationHelper();
        $this->rateLimiter = new RateLimiter();
    }
    
    public function handleRequest() {
        try {
            // Rate limiting
            if (!$this->rateLimiter->checkLimit('api_payment', 50)) { // Stricter limit for payments
                return $this->jsonError('Too many payment requests', 429);
            }
            
            $method = $_SERVER['REQUEST_METHOD'];
            $action = $_GET['action'] ?? '';
            
            // Handle webhooks without authentication
            if ($action === 'webhook') {
                return $this->handleWebhook();
            }
            
            // Get authenticated user for other endpoints
            $user = $this->getAuthenticatedUser();
            if (!$user) {
                return $this->jsonError('Authentication required', 401);
            }
            
            // Handle different request methods
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? $action;
                
                switch ($action) {
                    case 'create-payment':
                        return $this->createPayment($user, $input);
                        
                    case 'process-payment':
                        return $this->processPayment($user, $input);
                        
                    case 'create-preference':
                        return $this->createMercadoPagoPreference($user, $input);
                        
                    case 'release-escrow':
                        return $this->releaseEscrow($user, $input);
                        
                    case 'create-withdrawal':
                        return $this->createWithdrawal($user, $input);
                        
                    case 'add-payment-method':
                        return $this->addPaymentMethod($user, $input);
                        
                    case 'create-dispute':
                        return $this->createDispute($user, $input);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'GET') {
                switch ($action) {
                    case 'balance':
                        return $this->getUserBalance($user);
                        
                    case 'transactions':
                        return $this->getUserTransactions($user);
                        
                    case 'payment-methods':
                        return $this->getPaymentMethods($user);
                        
                    case 'escrow-accounts':
                        return $this->getEscrowAccounts($user);
                        
                    case 'withdrawals':
                        return $this->getWithdrawals($user);
                        
                    case 'invoices':
                        return $this->getInvoices($user);
                        
                    case 'payment-config':
                        return $this->getPaymentConfig();
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } elseif ($method === 'PUT') {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? $action;
                
                switch ($action) {
                    case 'update-payment-method':
                        return $this->updatePaymentMethod($user, $input);
                        
                    case 'process-withdrawal':
                        return $this->processWithdrawal($user, $input);
                        
                    default:
                        return $this->jsonError('Invalid action', 400);
                }
            } else {
                return $this->jsonError('Method not allowed', 405);
            }
            
        } catch (Exception $e) {
            error_log('[PaymentController] Error: ' . $e->getMessage());
            return $this->jsonError('Internal server error', 500);
        }
    }
    
    // ===== Payment Processing =====
    
    private function createPayment($user, $input) {
        try {
            // Validate required fields
            $required = ['payee_id', 'amount', 'transaction_type'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    return $this->jsonError("{$field} is required", 400);
                }
            }
            
            // Validate amount
            if ($input['amount'] < 100) {
                return $this->jsonError('Minimum payment amount is ARS 100', 400);
            }
            
            // Validate user can make payments
            if (!$this->canMakePayment($user, $input)) {
                return $this->jsonError('Payment not allowed', 403);
            }
            
            // Set payer
            $input['payer_id'] = $user['user_id'];
            
            // Fraud check
            $riskScore = $this->calculateRiskScore($user, $input);
            if ($riskScore > 0.75) {
                return $this->jsonError('Payment blocked due to risk assessment', 403);
            }
            
            // Add security data
            $input['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? null;
            $input['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $input['risk_score'] = $riskScore;
            
            $payment = Payment::createTransaction($input);
            
            return $this->jsonSuccess([
                'payment' => $payment,
                'message' => 'Payment created successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::createPayment] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to create payment: ' . $e->getMessage(), 500);
        }
    }
    
    private function processPayment($user, $input) {
        try {
            $transactionId = intval($input['transaction_id'] ?? 0);
            
            if (!$transactionId) {
                return $this->jsonError('Transaction ID is required', 400);
            }
            
            // Verify user owns this transaction
            $transaction = Payment::find($transactionId);
            if (!$transaction || $transaction['payer_id'] != $user['user_id']) {
                return $this->jsonError('Transaction not found or access denied', 404);
            }
            
            $result = Payment::processPayment($transactionId, $input);
            
            return $this->jsonSuccess([
                'transaction' => $result,
                'message' => 'Payment processed successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::processPayment] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to process payment: ' . $e->getMessage(), 500);
        }
    }
    
    private function createMercadoPagoPreference($user, $input) {
        try {
            $transactionId = intval($input['transaction_id'] ?? 0);
            
            if (!$transactionId) {
                return $this->jsonError('Transaction ID is required', 400);
            }
            
            // Verify user owns this transaction
            $transaction = Payment::find($transactionId);
            if (!$transaction || $transaction['payer_id'] != $user['user_id']) {
                return $this->jsonError('Transaction not found or access denied', 404);
            }
            
            if ($transaction['status'] !== 'pending') {
                return $this->jsonError('Transaction is not in pending status', 400);
            }
            
            $preference = Payment::createMercadoPagoPreference($transactionId);
            
            return $this->jsonSuccess([
                'preference' => $preference,
                'message' => 'MercadoPago preference created successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::createMercadoPagoPreference] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to create payment preference: ' . $e->getMessage(), 500);
        }
    }
    
    // ===== Escrow Management =====
    
    private function releaseEscrow($user, $input) {
        try {
            $escrowId = intval($input['escrow_id'] ?? 0);
            $reason = $input['reason'] ?? '';
            
            if (!$escrowId) {
                return $this->jsonError('Escrow ID is required', 400);
            }
            
            $escrow = Payment::getEscrowAccount($escrowId);
            if (!$escrow) {
                return $this->jsonError('Escrow account not found', 404);
            }
            
            // Verify user has permission
            if (!$this->canReleaseEscrow($user, $escrow)) {
                return $this->jsonError('Permission denied', 403);
            }
            
            $result = Payment::releaseEscrow($escrowId, $user['user_id'], $reason);
            
            return $this->jsonSuccess([
                'escrow' => $result,
                'message' => 'Escrow released successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::releaseEscrow] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to release escrow: ' . $e->getMessage(), 500);
        }
    }
    
    private function getEscrowAccounts($user) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $conditions = [];
            $params = [];
            
            // Filter by user role
            if ($user['user_type'] === 'client') {
                $conditions[] = 'ea.client_id = ?';
                $params[] = $user['user_id'];
            } elseif ($user['user_type'] === 'freelancer') {
                $conditions[] = 'ea.freelancer_id = ?';
                $params[] = $user['user_id'];
            } else {
                // Admin can see all
            }
            
            // Additional filters
            if (!empty($_GET['status'])) {
                $conditions[] = 'ea.status = ?';
                $params[] = $_GET['status'];
            }
            
            $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
            
            $stmt = $pdo->prepare("
                SELECT ea.*, 
                       p.title as project_title,
                       uc.first_name as client_first_name, uc.last_name as client_last_name,
                       uf.first_name as freelancer_first_name, uf.last_name as freelancer_last_name,
                       DATEDIFF(ea.auto_release_at, NOW()) as days_until_release
                FROM escrow_accounts ea
                LEFT JOIN projects p ON ea.project_id = p.id
                LEFT JOIN users uc ON ea.client_id = uc.id
                LEFT JOIN users uf ON ea.freelancer_id = uf.id
                {$whereClause}
                ORDER BY ea.created_at DESC
                LIMIT 50
            ");
            $stmt->execute($params);
            $escrows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process escrow data
            foreach ($escrows as &$escrow) {
                $escrow['formatted_total_amount'] = $this->formatCurrency($escrow['total_amount']);
                $escrow['formatted_freelancer_amount'] = $this->formatCurrency($escrow['freelancer_amount']);
                $escrow['client_name'] = trim($escrow['client_first_name'] . ' ' . $escrow['client_last_name']);
                $escrow['freelancer_name'] = trim($escrow['freelancer_first_name'] . ' ' . $escrow['freelancer_last_name']);
                $escrow['can_release'] = $this->canReleaseEscrow($user, $escrow);
            }
            
            return $this->jsonSuccess(['escrows' => $escrows]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::getEscrowAccounts] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get escrow accounts', 500);
        }
    }
    
    // ===== Balance & Withdrawals =====
    
    private function getUserBalance($user) {
        try {
            $balance = Payment::getUserBalance($user['user_id']);
            
            // Add formatted amounts
            $balance['formatted_available'] = $this->formatCurrency($balance['available_balance']);
            $balance['formatted_pending'] = $this->formatCurrency($balance['pending_balance']);
            $balance['formatted_total_earned'] = $this->formatCurrency($balance['total_earned']);
            $balance['formatted_total_spent'] = $this->formatCurrency($balance['total_spent']);
            
            // Add withdrawal limits
            $config = Payment::getPaymentConfig();
            $balance['withdrawal_limits'] = [
                'min_amount' => floatval($config['min_withdrawal_amount']),
                'max_amount' => floatval($config['max_withdrawal_amount']),
                'processing_fee' => floatval($config['withdrawal_processing_fee']),
                'formatted_min' => $this->formatCurrency($config['min_withdrawal_amount']),
                'formatted_max' => $this->formatCurrency($config['max_withdrawal_amount']),
                'formatted_fee' => $this->formatCurrency($config['withdrawal_processing_fee'])
            ];
            
            return $this->jsonSuccess(['balance' => $balance]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::getUserBalance] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get balance', 500);
        }
    }
    
    private function createWithdrawal($user, $input) {
        try {
            // Validate required fields
            $required = ['amount', 'withdrawal_method'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    return $this->jsonError("{$field} is required", 400);
                }
            }
            
            $amount = floatval($input['amount']);
            
            // Validate user is freelancer (only freelancers can withdraw)
            if ($user['user_type'] !== 'freelancer') {
                return $this->jsonError('Only freelancers can create withdrawals', 403);
            }
            
            $withdrawalId = Payment::createWithdrawal($user['user_id'], $amount, $input);
            
            return $this->jsonSuccess([
                'withdrawal_id' => $withdrawalId,
                'message' => 'Withdrawal request created successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::createWithdrawal] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to create withdrawal: ' . $e->getMessage(), 500);
        }
    }
    
    private function getWithdrawals($user) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT w.*, pm.card_last_four, pm.bank_name
                FROM withdrawals w
                LEFT JOIN payment_methods pm ON w.payment_method_id = pm.id
                WHERE w.user_id = ?
                ORDER BY w.requested_at DESC
                LIMIT 50
            ");
            $stmt->execute([$user['user_id']]);
            $withdrawals = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process withdrawal data
            foreach ($withdrawals as &$withdrawal) {
                $withdrawal['formatted_requested_amount'] = $this->formatCurrency($withdrawal['requested_amount']);
                $withdrawal['formatted_final_amount'] = $this->formatCurrency($withdrawal['final_amount']);
                $withdrawal['formatted_processing_fee'] = $this->formatCurrency($withdrawal['processing_fee']);
                $withdrawal['status_label'] = $this->getWithdrawalStatusLabel($withdrawal['status']);
                
                // Hide sensitive bank details for security
                if (!empty($withdrawal['bank_details'])) {
                    $withdrawal['bank_details'] = json_decode($withdrawal['bank_details'], true);
                    if (isset($withdrawal['bank_details']['account_number'])) {
                        $withdrawal['bank_details']['account_number'] = '****' . substr($withdrawal['bank_details']['account_number'], -4);
                    }
                }
            }
            
            return $this->jsonSuccess(['withdrawals' => $withdrawals]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::getWithdrawals] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get withdrawals', 500);
        }
    }
    
    // ===== Payment Methods =====
    
    private function addPaymentMethod($user, $input) {
        try {
            // Validate required fields based on method type
            $methodType = $input['method_type'] ?? '';
            
            if (empty($methodType)) {
                return $this->jsonError('method_type is required', 400);
            }
            
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Prepare payment method data
            $pmData = [
                'user_id' => $user['user_id'],
                'method_type' => $methodType,
                'provider' => $input['provider'] ?? 'mercadopago'
            ];
            
            // Handle different method types
            switch ($methodType) {
                case 'mercadopago':
                    $pmData['mp_customer_id'] = $input['mp_customer_id'] ?? null;
                    $pmData['mp_card_id'] = $input['mp_card_id'] ?? null;
                    $pmData['card_token'] = $input['card_token'] ?? null;
                    $pmData['card_last_four'] = $input['card_last_four'] ?? null;
                    $pmData['card_brand'] = $input['card_brand'] ?? null;
                    $pmData['card_holder_name'] = $input['card_holder_name'] ?? null;
                    break;
                    
                case 'bank_transfer':
                    $required = ['bank_name', 'account_type', 'account_holder_name', 'cbu_alias'];
                    foreach ($required as $field) {
                        if (empty($input[$field])) {
                            return $this->jsonError("{$field} is required for bank transfer", 400);
                        }
                    }
                    
                    $pmData['bank_name'] = $input['bank_name'];
                    $pmData['account_type'] = $input['account_type'];
                    $pmData['account_holder_name'] = $input['account_holder_name'];
                    $pmData['cbu_alias'] = $input['cbu_alias'];
                    $pmData['account_number_masked'] = $this->maskAccountNumber($input['account_number'] ?? '');
                    break;
                    
                default:
                    return $this->jsonError('Unsupported payment method type', 400);
            }
            
            // Set as default if it's the first method
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM payment_methods WHERE user_id = ?");
            $stmt->execute([$user['user_id']]);
            $isFirst = $stmt->fetchColumn() == 0;
            
            $pmData['is_default'] = $isFirst || !empty($input['is_default']);
            $pmData['verification_status'] = 'pending';
            
            // Create payment method
            $columns = implode(', ', array_keys($pmData));
            $placeholders = ':' . implode(', :', array_keys($pmData));
            
            $stmt = $pdo->prepare("
                INSERT INTO payment_methods ({$columns}) 
                VALUES ({$placeholders})
            ");
            $stmt->execute($pmData);
            
            $paymentMethodId = $pdo->lastInsertId();
            
            // If set as default, update other methods
            if ($pmData['is_default']) {
                $stmt = $pdo->prepare("
                    UPDATE payment_methods 
                    SET is_default = FALSE 
                    WHERE user_id = ? AND id != ?
                ");
                $stmt->execute([$user['user_id'], $paymentMethodId]);
            }
            
            return $this->jsonSuccess([
                'payment_method_id' => $paymentMethodId,
                'message' => 'Payment method added successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::addPaymentMethod] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to add payment method: ' . $e->getMessage(), 500);
        }
    }
    
    private function getPaymentMethods($user) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT id, method_type, provider, card_last_four, card_brand, 
                       card_holder_name, bank_name, account_type, account_number_masked,
                       account_holder_name, cbu_alias, is_verified, is_default,
                       verification_status, created_at
                FROM payment_methods 
                WHERE user_id = ? AND deleted_at IS NULL
                ORDER BY is_default DESC, created_at DESC
            ");
            $stmt->execute([$user['user_id']]);
            $methods = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process methods for display
            foreach ($methods as &$method) {
                $method['display_name'] = $this->getPaymentMethodDisplayName($method);
                $method['verification_label'] = $this->getVerificationStatusLabel($method['verification_status']);
            }
            
            return $this->jsonSuccess(['payment_methods' => $methods]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::getPaymentMethods] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get payment methods', 500);
        }
    }
    
    // ===== Transactions & History =====
    
    private function getUserTransactions($user) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $conditions = ['(t.payer_id = ? OR t.payee_id = ?)'];
            $params = [$user['user_id'], $user['user_id']];
            
            // Additional filters
            if (!empty($_GET['type'])) {
                $conditions[] = 't.transaction_type = ?';
                $params[] = $_GET['type'];
            }
            
            if (!empty($_GET['status'])) {
                $conditions[] = 't.status = ?';
                $params[] = $_GET['status'];
            }
            
            if (!empty($_GET['project_id'])) {
                $conditions[] = 't.project_id = ?';
                $params[] = $_GET['project_id'];
            }
            
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            $whereClause = implode(' AND ', $conditions);
            
            $stmt = $pdo->prepare("
                SELECT t.*, 
                       up.first_name as payer_first_name, up.last_name as payer_last_name,
                       ur.first_name as payee_first_name, ur.last_name as payee_last_name,
                       p.title as project_title,
                       pm.title as milestone_title
                FROM transactions t
                LEFT JOIN users up ON t.payer_id = up.id
                LEFT JOIN users ur ON t.payee_id = ur.id
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN project_milestones pm ON t.milestone_id = pm.id
                WHERE {$whereClause}
                ORDER BY t.created_at DESC
                LIMIT ? OFFSET ?
            ");
            
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process transaction data
            foreach ($transactions as &$transaction) {
                $transaction = $this->processTransactionData($transaction, $user['user_id']);
            }
            
            // Get total count
            $countStmt = $pdo->prepare("
                SELECT COUNT(*) FROM transactions t WHERE {$whereClause}
            ");
            $countStmt->execute(array_slice($params, 0, -2));
            $total = $countStmt->fetchColumn();
            
            return $this->jsonSuccess([
                'transactions' => $transactions,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $total,
                    'total_pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('[PaymentController::getUserTransactions] Error: ' . $e->getMessage());
            return $this->jsonError('Failed to get transactions', 500);
        }
    }
    
    // ===== Webhooks =====
    
    private function handleWebhook() {
        try {
            $payload = file_get_contents('php://input');
            $headers = getallheaders();
            
            // Verify webhook signature (implement based on provider)
            if (!$this->verifyWebhookSignature($payload, $headers)) {
                return $this->jsonError('Invalid webhook signature', 401);
            }
            
            $data = json_decode($payload, true);
            
            if (!$data) {
                return $this->jsonError('Invalid webhook payload', 400);
            }
            
            // Handle MercadoPago webhooks
            if (isset($data['type']) && $data['type'] === 'payment') {
                $result = Payment::processMercadoPagoWebhook($data);
                
                if ($result) {
                    return $this->jsonSuccess(['message' => 'Webhook processed successfully']);
                } else {
                    return $this->jsonError('Webhook processing failed', 500);
                }
            }
            
            return $this->jsonSuccess(['message' => 'Webhook received']);
            
        } catch (Exception $e) {
            error_log('[PaymentController::handleWebhook] Error: ' . $e->getMessage());
            return $this->jsonError('Webhook processing error', 500);
        }
    }
    
    // ===== Helper Methods =====
    
    private function canMakePayment($user, $input) {
        // Check if user can make this payment
        if ($user['user_type'] !== 'client') {
            return false; // Only clients can make payments
        }
        
        // Additional business logic checks
        if (!empty($input['project_id'])) {
            // Check if user owns the project
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("SELECT client_id FROM projects WHERE id = ?");
            $stmt->execute([$input['project_id']]);
            $project = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $project && $project['client_id'] == $user['user_id'];
        }
        
        return true;
    }
    
    private function canReleaseEscrow($user, $escrow) {
        // Client can release escrow or admin
        return ($user['user_id'] == $escrow['client_id']) || 
               ($user['user_type'] === 'admin');
    }
    
    private function calculateRiskScore($user, $input) {
        $score = 0.0;
        
        // New user risk
        $accountAge = time() - strtotime($user['created_at']);
        if ($accountAge < 86400) { // Less than 1 day
            $score += 0.3;
        } elseif ($accountAge < 604800) { // Less than 1 week
            $score += 0.1;
        }
        
        // Large amount risk
        if ($input['amount'] > 100000) { // > 100k ARS
            $score += 0.2;
        }
        
        // Frequency risk (implement based on recent transaction history)
        
        return min(1.0, $score);
    }
    
    private function processTransactionData($transaction, $currentUserId) {
        // Determine direction and labels
        $isIncoming = $transaction['payee_id'] == $currentUserId;
        $transaction['direction'] = $isIncoming ? 'incoming' : 'outgoing';
        
        // Format amounts
        $transaction['formatted_amount'] = $this->formatCurrency($transaction['amount']);
        $transaction['formatted_net_amount'] = $this->formatCurrency($transaction['net_amount']);
        $transaction['formatted_fee'] = $this->formatCurrency($transaction['platform_fee_amount']);
        
        // Set counterpart info
        if ($isIncoming) {
            $transaction['counterpart_name'] = trim($transaction['payer_first_name'] . ' ' . $transaction['payer_last_name']);
            $transaction['counterpart_type'] = 'payer';
        } else {
            $transaction['counterpart_name'] = trim($transaction['payee_first_name'] . ' ' . $transaction['payee_last_name']);
            $transaction['counterpart_type'] = 'payee';
        }
        
        // Status labels
        $transaction['status_label'] = $this->getTransactionStatusLabel($transaction['status']);
        $transaction['type_label'] = $this->getTransactionTypeLabel($transaction['transaction_type']);
        
        return $transaction;
    }
    
    private function formatCurrency($amount, $currency = 'ARS') {
        return number_format($amount, 2, ',', '.') . ' ' . $currency;
    }
    
    private function getTransactionStatusLabel($status) {
        $labels = [
            'pending' => 'Pendiente',
            'processing' => 'Procesando',
            'completed' => 'Completado',
            'failed' => 'Fallido',
            'cancelled' => 'Cancelado',
            'refunded' => 'Reembolsado',
            'disputed' => 'En Disputa'
        ];
        
        return $labels[$status] ?? $status;
    }
    
    private function getTransactionTypeLabel($type) {
        $labels = [
            'payment' => 'Pago',
            'refund' => 'Reembolso',
            'commission' => 'Comisión',
            'withdrawal' => 'Retiro',
            'deposit' => 'Depósito',
            'fee' => 'Tarifa',
            'bonus' => 'Bonus'
        ];
        
        return $labels[$type] ?? $type;
    }
    
    private function getWithdrawalStatusLabel($status) {
        $labels = [
            'pending' => 'Pendiente',
            'processing' => 'Procesando',
            'completed' => 'Completado',
            'failed' => 'Fallido',
            'cancelled' => 'Cancelado'
        ];
        
        return $labels[$status] ?? $status;
    }
    
    private function getPaymentMethodDisplayName($method) {
        switch ($method['method_type']) {
            case 'mercadopago':
                if ($method['card_brand'] && $method['card_last_four']) {
                    return ucfirst($method['card_brand']) . ' ****' . $method['card_last_four'];
                }
                return 'MercadoPago';
                
            case 'bank_transfer':
                return $method['bank_name'] . ' - ' . $method['account_number_masked'];
                
            default:
                return ucfirst($method['method_type']);
        }
    }
    
    private function getVerificationStatusLabel($status) {
        $labels = [
            'pending' => 'Pendiente',
            'verified' => 'Verificado',
            'failed' => 'Falló',
            'expired' => 'Expirado'
        ];
        
        return $labels[$status] ?? $status;
    }
    
    private function maskAccountNumber($accountNumber) {
        if (strlen($accountNumber) <= 4) {
            return str_repeat('*', strlen($accountNumber));
        }
        
        return str_repeat('*', strlen($accountNumber) - 4) . substr($accountNumber, -4);
    }
    
    private function verifyWebhookSignature($payload, $headers) {
        // Implement webhook signature verification based on provider
        // For MercadoPago, verify using webhook secret
        
        $config = Payment::getPaymentConfig();
        $secret = $config['mp_webhook_secret'] ?? '';
        
        if (empty($secret)) {
            return true; // Skip verification if no secret configured
        }
        
        $signature = $headers['X-Signature'] ?? '';
        $expectedSignature = hash_hmac('sha256', $payload, $secret);
        
        return hash_equals($expectedSignature, $signature);
    }
    
    private function getPaymentConfig() {
        $config = Payment::getPaymentConfig();
        
        // Return only public configuration
        return $this->jsonSuccess([
            'config' => [
                'platform_fee_percentage' => floatval($config['platform_fee_percentage']),
                'min_withdrawal_amount' => floatval($config['min_withdrawal_amount']),
                'max_withdrawal_amount' => floatval($config['max_withdrawal_amount']),
                'withdrawal_processing_fee' => floatval($config['withdrawal_processing_fee']),
                'auto_release_days' => intval($config['auto_release_days']),
                'max_dispute_days' => intval($config['max_dispute_days']),
                'mp_public_key' => $config['mp_public_key'],
                'mp_environment' => $config['mp_environment']
            ]
        ]);
    }
    
    // ===== Utility Methods =====
    
    private function getAuthenticatedUser() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        
        try {
            $payload = $this->securityHelper->validateJWT($matches[1]);
            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }
    
    private function jsonSuccess($data) {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    }
    
    private function jsonError($message, $code = 400) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => $message]);
        exit;
    }
}

// Handle the request
$controller = new PaymentController();
$controller->handleRequest();
?>