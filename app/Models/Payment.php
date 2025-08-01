<?php
/**
 * Payment Model
 * LaburAR Complete Platform
 * 
 * Manages payment processing, transactions, escrow,
 * and MercadoPago integration for Argentina market
 */

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/BaseModel.php';

class Payment extends BaseModel {
    protected static $table = 'transactions';
    
    protected static $fillable = [
        'project_id', 'milestone_id', 'payer_id', 'payee_id',
        'transaction_type', 'amount', 'currency', 'platform_fee_percentage',
        'platform_fee_amount', 'net_amount', 'payment_method_id',
        'payment_provider', 'status', 'description', 'metadata'
    ];
    
    // ===== Payment Processing =====
    
    public static function createTransaction($data) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            // Validate required fields
            $required = ['payer_id', 'payee_id', 'amount', 'transaction_type'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Field {$field} is required");
                }
            }
            
            // Calculate fees
            $platformFeePercentage = $data['platform_fee_percentage'] ?? 5.0;
            $platformFeeAmount = ($data['amount'] * $platformFeePercentage) / 100;
            $netAmount = $data['amount'] - $platformFeeAmount;
            
            $data['platform_fee_amount'] = $platformFeeAmount;
            $data['net_amount'] = $netAmount;
            $data['currency'] = $data['currency'] ?? 'ARS';
            $data['status'] = $data['status'] ?? 'pending';
            $data['payment_provider'] = $data['payment_provider'] ?? 'mercadopago';
            
            $pdo->beginTransaction();
            
            // Create transaction
            $transaction = static::create($data);
            
            // Create escrow if needed
            if (!empty($data['create_escrow']) && $data['create_escrow']) {
                static::createEscrowAccount($transaction['id'], $data);
            }
            
            $pdo->commit();
            
            return $transaction;
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Payment::createTransaction] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function processPayment($transactionId, $paymentData) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $transaction = static::find($transactionId);
            if (!$transaction) {
                throw new Exception('Transaction not found');
            }
            
            if ($transaction['status'] !== 'pending') {
                throw new Exception('Transaction is not in pending status');
            }
            
            $pdo->beginTransaction();
            
            // Update transaction with payment data
            $updates = [
                'status' => 'processing',
                'processed_at' => date('Y-m-d H:i:s'),
                'mp_payment_id' => $paymentData['mp_payment_id'] ?? null,
                'mp_preference_id' => $paymentData['mp_preference_id'] ?? null,
                'mp_status' => $paymentData['mp_status'] ?? null,
                'payment_method_id' => $paymentData['payment_method_id'] ?? null,
                'ip_address' => $paymentData['ip_address'] ?? null,
                'user_agent' => $paymentData['user_agent'] ?? null
            ];
            
            static::update($transactionId, $updates);
            
            // Process based on payment provider
            switch ($transaction['payment_provider']) {
                case 'mercadopago':
                    $result = static::processMercadoPagoPayment($transactionId, $paymentData);
                    break;
                    
                case 'bank_transfer':
                    $result = static::processBankTransfer($transactionId, $paymentData);
                    break;
                    
                default:
                    throw new Exception('Unsupported payment provider');
            }
            
            $pdo->commit();
            
            return $result;
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Payment::processPayment] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function completeTransaction($transactionId, $completionData = []) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $transaction = static::find($transactionId);
            if (!$transaction) {
                throw new Exception('Transaction not found');
            }
            
            $pdo->beginTransaction();
            
            // Update transaction status
            $updates = [
                'status' => 'completed',
                'completed_at' => date('Y-m-d H:i:s')
            ];
            
            if (!empty($completionData)) {
                $updates = array_merge($updates, $completionData);
            }
            
            static::update($transactionId, $updates);
            
            // Handle escrow if exists
            if ($transaction['project_id']) {
                static::handleEscrowOnPayment($transaction, 'completed');
            }
            
            // Generate invoice if needed
            if ($transaction['transaction_type'] === 'payment') {
                static::generateInvoice($transactionId);
            }
            
            $pdo->commit();
            
            return static::find($transactionId);
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Payment::completeTransaction] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== MercadoPago Integration =====
    
    public static function createMercadoPagoPreference($transactionId) {
        try {
            $transaction = static::getTransactionWithDetails($transactionId);
            if (!$transaction) {
                throw new Exception('Transaction not found');
            }
            
            $mpConfig = static::getMercadoPagoConfig();
            
            // Prepare preference data
            $preferenceData = [
                'items' => [
                    [
                        'title' => $transaction['description'] ?: 'Pago LaburAR',
                        'quantity' => 1,
                        'unit_price' => floatval($transaction['amount']),
                        'currency_id' => $transaction['currency']
                    ]
                ],
                'payer' => [
                    'email' => $transaction['payer_email'],
                    'first_name' => $transaction['payer_first_name'],
                    'last_name' => $transaction['payer_last_name']
                ],
                'back_urls' => [
                    'success' => $mpConfig['success_url'] . '?transaction_id=' . $transactionId,
                    'failure' => $mpConfig['failure_url'] . '?transaction_id=' . $transactionId,
                    'pending' => $mpConfig['pending_url'] . '?transaction_id=' . $transactionId
                ],
                'auto_return' => 'approved',
                'external_reference' => strval($transactionId),
                'notification_url' => $mpConfig['webhook_url'],
                'expires' => true,
                'expiration_date_from' => date('c'),
                'expiration_date_to' => date('c', strtotime('+24 hours'))
            ];
            
            // Call MercadoPago API
            $response = static::callMercadoPagoAPI('POST', '/checkout/preferences', $preferenceData);
            
            if ($response && !empty($response['id'])) {
                // Update transaction with preference ID
                static::update($transactionId, [
                    'mp_preference_id' => $response['id'],
                    'metadata' => json_encode(['mp_preference' => $response])
                ]);
                
                return [
                    'preference_id' => $response['id'],
                    'init_point' => $response['init_point'],
                    'sandbox_init_point' => $response['sandbox_init_point']
                ];
            } else {
                throw new Exception('Failed to create MercadoPago preference');
            }
            
        } catch (Exception $e) {
            error_log('[Payment::createMercadoPagoPreference] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function processMercadoPagoWebhook($webhookData) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            if ($webhookData['type'] !== 'payment') {
                return false; // Not a payment notification
            }
            
            $paymentId = $webhookData['data']['id'];
            
            // Get payment details from MercadoPago
            $paymentData = static::callMercadoPagoAPI('GET', "/v1/payments/{$paymentId}");
            
            if (!$paymentData) {
                throw new Exception('Failed to get payment data from MercadoPago');
            }
            
            // Find transaction by external reference or MP payment ID
            $transactionId = $paymentData['external_reference'];
            $transaction = static::find($transactionId);
            
            if (!$transaction) {
                error_log("[Payment::processMercadoPagoWebhook] Transaction not found: {$transactionId}");
                return false;
            }
            
            $pdo->beginTransaction();
            
            // Update transaction with MercadoPago data
            $updates = [
                'mp_payment_id' => $paymentData['id'],
                'mp_status' => $paymentData['status'],
                'mp_status_detail' => $paymentData['status_detail'],
                'mp_payment_type' => $paymentData['payment_type_id'],
                'mp_operation_type' => $paymentData['operation_type']
            ];
            
            // Handle different payment statuses
            switch ($paymentData['status']) {
                case 'approved':
                    $updates['status'] = 'completed';
                    $updates['completed_at'] = date('Y-m-d H:i:s');
                    break;
                    
                case 'pending':
                    $updates['status'] = 'processing';
                    break;
                    
                case 'rejected':
                case 'cancelled':
                    $updates['status'] = 'failed';
                    $updates['failed_at'] = date('Y-m-d H:i:s');
                    break;
                    
                case 'refunded':
                    $updates['status'] = 'refunded';
                    break;
            }
            
            static::update($transactionId, $updates);
            
            // Handle escrow and other side effects
            if ($updates['status'] === 'completed') {
                static::handleEscrowOnPayment($transaction, 'completed');
                static::generateInvoice($transactionId);
            }
            
            $pdo->commit();
            
            return true;
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Payment::processMercadoPagoWebhook] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Escrow Management =====
    
    public static function createEscrowAccount($transactionId, $data) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $transaction = static::find($transactionId);
            if (!$transaction) {
                throw new Exception('Transaction not found');
            }
            
            $escrowData = [
                'project_id' => $transaction['project_id'],
                'milestone_id' => $transaction['milestone_id'],
                'client_id' => $transaction['payer_id'],
                'freelancer_id' => $transaction['payee_id'],
                'total_amount' => $transaction['amount'],
                'platform_fee' => $transaction['platform_fee_amount'],
                'freelancer_amount' => $transaction['net_amount'],
                'auto_release_days' => $data['auto_release_days'] ?? 7
            ];
            
            // Calculate auto release date
            $autoReleaseDays = $escrowData['auto_release_days'];
            $autoReleaseDate = date('Y-m-d H:i:s', strtotime("+{$autoReleaseDays} days"));
            $escrowData['auto_release_at'] = $autoReleaseDate;
            
            $stmt = $pdo->prepare("
                INSERT INTO escrow_accounts 
                (project_id, milestone_id, client_id, freelancer_id, total_amount, platform_fee, freelancer_amount, auto_release_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $escrowData['project_id'],
                $escrowData['milestone_id'],
                $escrowData['client_id'],
                $escrowData['freelancer_id'],
                $escrowData['total_amount'],
                $escrowData['platform_fee'],
                $escrowData['freelancer_amount'],
                $escrowData['auto_release_at']
            ]);
            
            $escrowId = $pdo->lastInsertId();
            
            // Create escrow transaction record
            $stmt = $pdo->prepare("
                INSERT INTO escrow_transactions 
                (escrow_id, transaction_id, escrow_action, amount, authorized_by)
                VALUES (?, ?, 'fund', ?, ?)
            ");
            
            $stmt->execute([
                $escrowId,
                $transactionId,
                $escrowData['total_amount'],
                $transaction['payer_id']
            ]);
            
            return $escrowId;
            
        } catch (Exception $e) {
            error_log('[Payment::createEscrowAccount] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function releaseEscrow($escrowId, $userId, $reason = '') {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $escrow = static::getEscrowAccount($escrowId);
            if (!$escrow) {
                throw new Exception('Escrow account not found');
            }
            
            if ($escrow['status'] !== 'active') {
                throw new Exception('Escrow is not active');
            }
            
            // Verify user has permission to release
            if ($userId !== $escrow['client_id'] && !static::isAdmin($userId)) {
                throw new Exception('Unauthorized to release escrow');
            }
            
            $pdo->beginTransaction();
            
            // Update escrow status
            $stmt = $pdo->prepare("
                UPDATE escrow_accounts 
                SET status = 'released', released_at = NOW(), release_requested_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$escrowId]);
            
            // Create escrow transaction
            $stmt = $pdo->prepare("
                INSERT INTO escrow_transactions 
                (escrow_id, transaction_id, escrow_action, amount, authorized_by, authorization_reason)
                VALUES (?, NULL, 'release', ?, ?, ?)
            ");
            $stmt->execute([
                $escrowId,
                $escrow['freelancer_amount'],
                $userId,
                $reason
            ]);
            
            // Update freelancer balance (trigger will handle this)
            
            $pdo->commit();
            
            return static::getEscrowAccount($escrowId);
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Payment::releaseEscrow] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== User Balance Management =====
    
    public static function getUserBalance($userId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT * FROM user_balances WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $balance = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$balance) {
                // Create balance record if doesn't exist
                $stmt = $pdo->prepare("
                    INSERT INTO user_balances (user_id) VALUES (?)
                ");
                $stmt->execute([$userId]);
                
                return static::getUserBalance($userId);
            }
            
            return $balance;
            
        } catch (Exception $e) {
            error_log('[Payment::getUserBalance] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function createWithdrawal($userId, $amount, $withdrawalData) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $balance = static::getUserBalance($userId);
            
            if ($balance['available_balance'] < $amount) {
                throw new Exception('Insufficient balance');
            }
            
            $config = static::getPaymentConfig();
            
            if ($amount < $config['min_withdrawal_amount']) {
                throw new Exception('Amount below minimum withdrawal limit');
            }
            
            if ($amount > $config['max_withdrawal_amount']) {
                throw new Exception('Amount exceeds maximum withdrawal limit');
            }
            
            $pdo->beginTransaction();
            
            // Calculate fees
            $processingFee = $config['withdrawal_processing_fee'];
            $finalAmount = $amount - $processingFee;
            
            // Create withdrawal record
            $stmt = $pdo->prepare("
                INSERT INTO withdrawals 
                (user_id, requested_amount, available_balance, processing_fee, final_amount, 
                 withdrawal_method, payment_method_id, bank_details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $userId,
                $amount,
                $balance['available_balance'],
                $processingFee,
                $finalAmount,
                $withdrawalData['withdrawal_method'],
                $withdrawalData['payment_method_id'] ?? null,
                !empty($withdrawalData['bank_details']) ? json_encode($withdrawalData['bank_details']) : null
            ]);
            
            $withdrawalId = $pdo->lastInsertId();
            
            // Update user balance (reserve the amount)
            $stmt = $pdo->prepare("
                UPDATE user_balances 
                SET available_balance = available_balance - ?
                WHERE user_id = ?
            ");
            $stmt->execute([$amount, $userId]);
            
            $pdo->commit();
            
            return $withdrawalId;
            
        } catch (Exception $e) {
            if (isset($pdo)) $pdo->rollBack();
            error_log('[Payment::createWithdrawal] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Invoice Management =====
    
    public static function generateInvoice($transactionId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $transaction = static::getTransactionWithDetails($transactionId);
            if (!$transaction) {
                throw new Exception('Transaction not found');
            }
            
            // Check if invoice already exists
            $stmt = $pdo->prepare("SELECT id FROM invoices WHERE transaction_id = ?");
            $stmt->execute([$transactionId]);
            if ($stmt->fetch()) {
                return false; // Invoice already exists
            }
            
            // Generate invoice number
            $invoiceNumber = static::generateInvoiceNumber();
            
            $invoiceData = [
                'invoice_number' => $invoiceNumber,
                'project_id' => $transaction['project_id'],
                'transaction_id' => $transactionId,
                'client_id' => $transaction['payer_id'],
                'freelancer_id' => $transaction['payee_id'],
                'invoice_type' => static::determineInvoiceType($transaction),
                'description' => $transaction['description'] ?: 'Servicios de freelancing',
                'subtotal' => $transaction['amount'],
                'tax_rate' => 0.00, // Tax handling
                'tax_amount' => 0.00,
                'total_amount' => $transaction['amount'],
                'currency' => $transaction['currency'],
                'issue_date' => date('Y-m-d'),
                'due_date' => date('Y-m-d', strtotime('+30 days'))
            ];
            
            // Create invoice
            $stmt = $pdo->prepare("
                INSERT INTO invoices 
                (invoice_number, project_id, transaction_id, client_id, freelancer_id,
                 invoice_type, description, subtotal, tax_rate, tax_amount, total_amount,
                 currency, issue_date, due_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $invoiceData['invoice_number'],
                $invoiceData['project_id'],
                $invoiceData['transaction_id'],
                $invoiceData['client_id'],
                $invoiceData['freelancer_id'],
                $invoiceData['invoice_type'],
                $invoiceData['description'],
                $invoiceData['subtotal'],
                $invoiceData['tax_rate'],
                $invoiceData['tax_amount'],
                $invoiceData['total_amount'],
                $invoiceData['currency'],
                $invoiceData['issue_date'],
                $invoiceData['due_date']
            ]);
            
            $invoiceId = $pdo->lastInsertId();
            
            // Create line items
            static::createInvoiceLineItems($invoiceId, $transaction);
            
            return $invoiceId;
            
        } catch (Exception $e) {
            error_log('[Payment::generateInvoice] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    // ===== Helper Methods =====
    
    private static function getMercadoPagoConfig() {
        $config = static::getPaymentConfig();
        return [
            'access_token' => $config['mp_access_token'],
            'public_key' => $config['mp_public_key'],
            'environment' => $config['mp_environment'],
            'success_url' => $_SERVER['HTTP_HOST'] . '/payment/success',
            'failure_url' => $_SERVER['HTTP_HOST'] . '/payment/failure',
            'pending_url' => $_SERVER['HTTP_HOST'] . '/payment/pending',
            'webhook_url' => $_SERVER['HTTP_HOST'] . '/api/webhooks/mercadopago'
        ];
    }
    
    private static function callMercadoPagoAPI($method, $endpoint, $data = null) {
        try {
            $config = static::getMercadoPagoConfig();
            $baseUrl = $config['environment'] === 'production' 
                ? 'https://api.mercadopago.com' 
                : 'https://api.mercadopago.com';
            
            $url = $baseUrl . $endpoint;
            
            $headers = [
                'Authorization: Bearer ' . $config['access_token'],
                'Content-Type: application/json'
            ];
            
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST => $method,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_SSL_VERIFYPEER => true
            ]);
            
            if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error) {
                throw new Exception("cURL error: {$error}");
            }
            
            $responseData = json_decode($response, true);
            
            if ($httpCode >= 400) {
                $errorMsg = $responseData['message'] ?? 'MercadoPago API error';
                throw new Exception("MercadoPago API error ({$httpCode}): {$errorMsg}");
            }
            
            return $responseData;
            
        } catch (Exception $e) {
            error_log('[Payment::callMercadoPagoAPI] Error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public static function getPaymentConfig() {
        static $config = null;
        
        if ($config === null) {
            try {
                $db = Database::getInstance();
                $pdo = $db->getConnection();
                
                $stmt = $pdo->prepare("SELECT config_key, config_value FROM payment_config");
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $config = [];
                foreach ($results as $row) {
                    $config[$row['config_key']] = $row['config_value'];
                }
                
            } catch (Exception $e) {
                error_log('[Payment::getPaymentConfig] Error: ' . $e->getMessage());
                $config = [];
            }
        }
        
        return $config;
    }
    
    public static function getTransactionWithDetails($transactionId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT t.*, 
                       up.first_name as payer_first_name, up.last_name as payer_last_name, up.email as payer_email,
                       ur.first_name as payee_first_name, ur.last_name as payee_last_name, ur.email as payee_email,
                       p.title as project_title,
                       pm.title as milestone_title
                FROM transactions t
                LEFT JOIN users up ON t.payer_id = up.id
                LEFT JOIN users ur ON t.payee_id = ur.id
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN project_milestones pm ON t.milestone_id = pm.id
                WHERE t.id = ?
            ");
            $stmt->execute([$transactionId]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log('[Payment::getTransactionWithDetails] Error: ' . $e->getMessage());
            return null;
        }
    }
    
    private static function generateInvoiceNumber() {
        $year = date('Y');
        $prefix = "LAB-{$year}-";
        
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT MAX(CAST(SUBSTRING(invoice_number, LENGTH(?) + 1) AS UNSIGNED)) as max_number
                FROM invoices 
                WHERE invoice_number LIKE ?
            ");
            $stmt->execute([$prefix, $prefix . '%']);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $nextNumber = ($result['max_number'] ?? 0) + 1;
            return $prefix . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
            
        } catch (Exception $e) {
            // Fallback to timestamp-based number
            return $prefix . str_pad(time() % 1000000, 6, '0', STR_PAD_LEFT);
        }
    }
    
    private static function isAdmin($userId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("SELECT user_type FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $user && $user['user_type'] === 'admin';
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    public static function getEscrowAccount($escrowId) {
        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();
            
            $stmt = $pdo->prepare("
                SELECT ea.*, 
                       p.title as project_title,
                       uc.first_name as client_first_name, uc.last_name as client_last_name,
                       uf.first_name as freelancer_first_name, uf.last_name as freelancer_last_name
                FROM escrow_accounts ea
                LEFT JOIN projects p ON ea.project_id = p.id
                LEFT JOIN users uc ON ea.client_id = uc.id
                LEFT JOIN users uf ON ea.freelancer_id = uf.id
                WHERE ea.id = ?
            ");
            $stmt->execute([$escrowId]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log('[Payment::getEscrowAccount] Error: ' . $e->getMessage());
            return null;
        }
    }
}
?>