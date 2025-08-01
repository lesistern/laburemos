<?php
/**
 * EmailService - Sistema de Email Empresarial para LaburAR
 * 
 * Servicio enterprise para envío de emails transaccionales con templates,
 * queue management, retry logic y tracking completo.
 * 
 * @version 2.0.0
 * @package LaburAR\Services
 */

namespace LaburAR\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailService {
    
    private $mailer;
    private $config;
    private $templates_path;
    private $queue_enabled;
    private $tracking_enabled;
    private $log_path;
    
    // Email types constants
    const TYPE_VERIFICATION = 'verification';
    const TYPE_WELCOME = 'welcome';
    const TYPE_PASSWORD_RESET = 'password_reset';
    const TYPE_2FA_CODE = '2fa_code';
    const TYPE_PROJECT_NOTIFICATION = 'project_notification';
    const TYPE_PAYMENT_CONFIRMATION = 'payment_confirmation';
    const TYPE_INVOICE = 'invoice';
    const TYPE_DISPUTE = 'dispute';
    const TYPE_REVIEW = 'review';
    const TYPE_MILESTONE = 'milestone';
    
    // Email status
    const STATUS_PENDING = 'pending';
    const STATUS_SENT = 'sent';
    const STATUS_FAILED = 'failed';
    const STATUS_BOUNCED = 'bounced';
    const STATUS_OPENED = 'opened';
    const STATUS_CLICKED = 'clicked';
    
    /**
     * Constructor - Inicializa el servicio de email
     */
    public function __construct($config = []) {
        $this->config = array_merge($this->getDefaultConfig(), $config);
        $this->templates_path = __DIR__ . '/../templates/emails/';
        $this->queue_enabled = $this->config['queue_enabled'] ?? true;
        $this->tracking_enabled = $this->config['tracking_enabled'] ?? true;
        $this->log_path = __DIR__ . '/../logs/emails/';
        
        $this->initializeMailer();
        $this->ensureDirectories();
    }
    
    /**
     * Configuración por defecto
     */
    private function getDefaultConfig() {
        return [
            'smtp_host' => $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com',
            'smtp_port' => $_ENV['MAIL_PORT'] ?? 587,
            'smtp_username' => $_ENV['MAIL_USERNAME'] ?? '',
            'smtp_password' => $_ENV['MAIL_PASSWORD'] ?? '',
            'smtp_encryption' => $_ENV['MAIL_ENCRYPTION'] ?? PHPMailer::ENCRYPTION_STARTTLS,
            'from_email' => $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@laburar.com.ar',
            'from_name' => $_ENV['MAIL_FROM_NAME'] ?? 'LaburAR',
            'reply_to' => $_ENV['MAIL_REPLY_TO'] ?? 'soporte@laburar.com.ar',
            'charset' => 'UTF-8',
            'queue_enabled' => true,
            'tracking_enabled' => true,
            'retry_attempts' => 3,
            'retry_delay' => 300, // 5 minutos
            'rate_limit' => 50, // emails por minuto
            'bounce_webhook' => $_ENV['MAIL_BOUNCE_WEBHOOK'] ?? null
        ];
    }
    
    /**
     * Inicializa PHPMailer con configuración SMTP
     */
    private function initializeMailer() {
        $this->mailer = new PHPMailer(true);
        
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host = $this->config['smtp_host'];
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $this->config['smtp_username'];
            $this->mailer->Password = $this->config['smtp_password'];
            $this->mailer->SMTPSecure = $this->config['smtp_encryption'];
            $this->mailer->Port = $this->config['smtp_port'];
            
            // Default sender
            $this->mailer->setFrom($this->config['from_email'], $this->config['from_name']);
            $this->mailer->addReplyTo($this->config['reply_to']);
            
            // Encoding
            $this->mailer->CharSet = $this->config['charset'];
            $this->mailer->Encoding = 'base64';
            
            // HTML emails
            $this->mailer->isHTML(true);
            
        } catch (Exception $e) {
            $this->logError('Mailer initialization failed: ' . $e->getMessage());
            throw new \Exception('Email service initialization failed');
        }
    }
    
    /**
     * Envía email de verificación
     */
    public function sendVerificationEmail($user, $verification_token) {
        $data = [
            'user_name' => $user['name'],
            'verification_link' => $this->generateVerificationLink($verification_token),
            'expiry_hours' => 24,
            'support_email' => $this->config['reply_to']
        ];
        
        return $this->sendEmail(
            $user['email'],
            'Verificá tu cuenta en LaburAR',
            self::TYPE_VERIFICATION,
            $data,
            ['priority' => 'high']
        );
    }
    
    /**
     * Envía email de bienvenida
     */
    public function sendWelcomeEmail($user) {
        $data = [
            'user_name' => $user['name'],
            'user_type' => $user['user_type'],
            'profile_link' => $this->generateProfileLink($user['id']),
            'getting_started_link' => $this->generateGettingStartedLink($user['user_type']),
            'features' => $this->getUserTypeFeatures($user['user_type'])
        ];
        
        return $this->sendEmail(
            $user['email'],
            '¡Bienvenido a LaburAR! 🎉',
            self::TYPE_WELCOME,
            $data
        );
    }
    
    /**
     * Envía email de reset de password
     */
    public function sendPasswordResetEmail($user, $reset_token) {
        $data = [
            'user_name' => $user['name'],
            'reset_link' => $this->generatePasswordResetLink($reset_token),
            'expiry_minutes' => 60,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            'browser' => $this->getBrowserInfo()
        ];
        
        return $this->sendEmail(
            $user['email'],
            'Restablecer contraseña - LaburAR',
            self::TYPE_PASSWORD_RESET,
            $data,
            ['priority' => 'high', 'track_opens' => false]
        );
    }
    
    /**
     * Envía código 2FA
     */
    public function send2FACode($user, $code) {
        $data = [
            'user_name' => $user['name'],
            'verification_code' => $code,
            'expiry_minutes' => 10,
            'device_info' => $this->getDeviceInfo()
        ];
        
        return $this->sendEmail(
            $user['email'],
            'Código de verificación - LaburAR',
            self::TYPE_2FA_CODE,
            $data,
            ['priority' => 'urgent', 'bypass_queue' => true]
        );
    }
    
    /**
     * Envía notificación de proyecto
     */
    public function sendProjectNotification($user, $project, $notification_type) {
        $data = [
            'user_name' => $user['name'],
            'project_title' => $project['title'],
            'project_link' => $this->generateProjectLink($project['id']),
            'notification_type' => $notification_type,
            'action_required' => $this->getActionRequired($notification_type),
            'deadline' => $project['deadline'] ?? null
        ];
        
        return $this->sendEmail(
            $user['email'],
            $this->getProjectSubject($notification_type, $project['title']),
            self::TYPE_PROJECT_NOTIFICATION,
            $data
        );
    }
    
    /**
     * Envía confirmación de pago
     */
    public function sendPaymentConfirmation($user, $payment) {
        $data = [
            'user_name' => $user['name'],
            'amount' => $this->formatCurrency($payment['amount']),
            'payment_id' => $payment['id'],
            'payment_method' => $payment['method'],
            'project_title' => $payment['project_title'],
            'receipt_link' => $this->generateReceiptLink($payment['id']),
            'invoice_link' => $this->generateInvoiceLink($payment['id'])
        ];
        
        return $this->sendEmail(
            $user['email'],
            'Confirmación de pago - ' . $data['amount'],
            self::TYPE_PAYMENT_CONFIRMATION,
            $data,
            ['attachments' => [$this->generateReceiptPDF($payment)]]
        );
    }
    
    /**
     * Método principal para enviar emails
     */
    public function sendEmail($to, $subject, $template_type, $data = [], $options = []) {
        try {
            // Validaciones
            if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
                throw new \InvalidArgumentException('Invalid email address');
            }
            
            // Rate limiting
            if (!$this->checkRateLimit($to)) {
                throw new \Exception('Rate limit exceeded for recipient');
            }
            
            // Preparar email
            $email_id = $this->generateEmailId();
            $html_content = $this->renderTemplate($template_type, $data, $email_id);
            $text_content = $this->generateTextVersion($html_content);
            
            // Tracking pixel
            if ($this->tracking_enabled && ($options['track_opens'] ?? true)) {
                $html_content = $this->addTrackingPixel($html_content, $email_id);
            }
            
            // Queue o envío directo
            if ($this->queue_enabled && !($options['bypass_queue'] ?? false)) {
                return $this->queueEmail([
                    'id' => $email_id,
                    'to' => $to,
                    'subject' => $subject,
                    'html_content' => $html_content,
                    'text_content' => $text_content,
                    'template_type' => $template_type,
                    'data' => $data,
                    'options' => $options,
                    'attempts' => 0,
                    'status' => self::STATUS_PENDING,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            } else {
                return $this->sendImmediate($to, $subject, $html_content, $text_content, $options, $email_id);
            }
            
        } catch (\Exception $e) {
            $this->logError('Email send failed', [
                'to' => $to,
                'subject' => $subject,
                'template' => $template_type,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'email_id' => $email_id ?? null
            ];
        }
    }
    
    /**
     * Envío inmediato de email
     */
    private function sendImmediate($to, $subject, $html_content, $text_content, $options, $email_id) {
        try {
            // Reset mailer for new email
            $this->mailer->clearAllRecipients();
            $this->mailer->clearAttachments();
            
            // Set recipient
            $this->mailer->addAddress($to);
            
            // Set content
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $html_content;
            $this->mailer->AltBody = $text_content;
            
            // Priority
            if (($options['priority'] ?? 'normal') === 'high') {
                $this->mailer->Priority = 1;
            } elseif ($options['priority'] === 'urgent') {
                $this->mailer->Priority = 1;
                $this->mailer->addCustomHeader('X-MSMail-Priority', 'High');
                $this->mailer->addCustomHeader('Importance', 'High');
            }
            
            // Attachments
            if (!empty($options['attachments'])) {
                foreach ($options['attachments'] as $attachment) {
                    $this->mailer->addAttachment($attachment);
                }
            }
            
            // Custom headers
            $this->mailer->addCustomHeader('X-LaburAR-Email-ID', $email_id);
            $this->mailer->addCustomHeader('List-Unsubscribe', $this->generateUnsubscribeLink($to));
            
            // Send
            $this->mailer->send();
            
            // Log success
            $this->logEmailSent($email_id, $to, $subject);
            
            // Track in database
            $this->trackEmail($email_id, [
                'to' => $to,
                'subject' => $subject,
                'status' => self::STATUS_SENT,
                'sent_at' => date('Y-m-d H:i:s')
            ]);
            
            return [
                'success' => true,
                'email_id' => $email_id,
                'message' => 'Email sent successfully'
            ];
            
        } catch (Exception $e) {
            // Log failure
            $this->logError('SMTP send failed', [
                'email_id' => $email_id,
                'to' => $to,
                'error' => $e->getMessage()
            ]);
            
            // Track failure
            $this->trackEmail($email_id, [
                'to' => $to,
                'subject' => $subject,
                'status' => self::STATUS_FAILED,
                'error' => $e->getMessage(),
                'failed_at' => date('Y-m-d H:i:s')
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Renderiza template de email
     */
    private function renderTemplate($template_type, $data, $email_id) {
        $template_file = $this->templates_path . $template_type . '.php';
        
        if (!file_exists($template_file)) {
            // Usar template genérico si no existe específico
            $template_file = $this->templates_path . 'generic.php';
        }
        
        // Datos comunes para todos los templates
        $common_data = [
            'app_name' => 'LaburAR',
            'app_url' => 'https://laburar.com.ar',
            'logo_url' => 'https://laburar.com.ar/assets/img/logo.png',
            'current_year' => date('Y'),
            'unsubscribe_link' => $this->generateUnsubscribeLink($data['email'] ?? ''),
            'email_id' => $email_id,
            'social_links' => [
                'facebook' => 'https://facebook.com/laburar',
                'twitter' => 'https://twitter.com/laburar',
                'linkedin' => 'https://linkedin.com/company/laburar',
                'instagram' => 'https://instagram.com/laburar'
            ]
        ];
        
        $template_data = array_merge($common_data, $data);
        
        // Render template
        ob_start();
        extract($template_data);
        include $template_file;
        $content = ob_get_clean();
        
        // Apply master layout
        return $this->applyMasterLayout($content, $template_data);
    }
    
    /**
     * Aplica layout master a los emails
     */
    private function applyMasterLayout($content, $data) {
        $layout_file = $this->templates_path . 'layouts/master.php';
        
        if (!file_exists($layout_file)) {
            return $content;
        }
        
        ob_start();
        $email_content = $content;
        extract($data);
        include $layout_file;
        return ob_get_clean();
    }
    
    /**
     * Genera versión texto del email
     */
    private function generateTextVersion($html) {
        // Remove HTML tags
        $text = strip_tags($html);
        
        // Convert entities
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        
        // Clean up whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        // Add line breaks for readability
        $text = wordwrap($text, 70, "\n", true);
        
        return $text;
    }
    
    /**
     * Sistema de cola de emails
     */
    private function queueEmail($email_data) {
        $queue_file = $this->log_path . 'queue/' . $email_data['id'] . '.json';
        
        // Ensure queue directory exists
        $queue_dir = dirname($queue_file);
        if (!is_dir($queue_dir)) {
            mkdir($queue_dir, 0755, true);
        }
        
        // Save to queue
        file_put_contents($queue_file, json_encode($email_data, JSON_PRETTY_PRINT));
        
        // Log queued
        $this->logInfo('Email queued', [
            'email_id' => $email_data['id'],
            'to' => $email_data['to'],
            'template' => $email_data['template_type']
        ]);
        
        return [
            'success' => true,
            'email_id' => $email_data['id'],
            'message' => 'Email queued for delivery',
            'queued' => true
        ];
    }
    
    /**
     * Procesa cola de emails (llamar desde cron)
     */
    public function processQueue($limit = 50) {
        $queue_dir = $this->log_path . 'queue/';
        $processed = 0;
        $results = [];
        
        if (!is_dir($queue_dir)) {
            return $results;
        }
        
        $files = glob($queue_dir . '*.json');
        
        foreach ($files as $file) {
            if ($processed >= $limit) {
                break;
            }
            
            $email_data = json_decode(file_get_contents($file), true);
            
            // Skip if too many attempts
            if ($email_data['attempts'] >= $this->config['retry_attempts']) {
                $this->moveToFailed($file, $email_data);
                continue;
            }
            
            // Check retry delay
            if ($email_data['attempts'] > 0) {
                $last_attempt = strtotime($email_data['last_attempt'] ?? $email_data['created_at']);
                if (time() - $last_attempt < $this->config['retry_delay']) {
                    continue;
                }
            }
            
            // Try to send
            try {
                $result = $this->sendImmediate(
                    $email_data['to'],
                    $email_data['subject'],
                    $email_data['html_content'],
                    $email_data['text_content'],
                    $email_data['options'] ?? [],
                    $email_data['id']
                );
                
                // Success - remove from queue
                unlink($file);
                $results[] = $result;
                $processed++;
                
            } catch (\Exception $e) {
                // Update attempts
                $email_data['attempts']++;
                $email_data['last_attempt'] = date('Y-m-d H:i:s');
                $email_data['last_error'] = $e->getMessage();
                
                // Save back to queue
                file_put_contents($file, json_encode($email_data, JSON_PRETTY_PRINT));
                
                $results[] = [
                    'success' => false,
                    'email_id' => $email_data['id'],
                    'error' => $e->getMessage(),
                    'attempts' => $email_data['attempts']
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Tracking de emails
     */
    private function trackEmail($email_id, $data) {
        $tracking_file = $this->log_path . 'tracking/' . date('Y-m-d') . '.json';
        
        // Ensure tracking directory exists
        $tracking_dir = dirname($tracking_file);
        if (!is_dir($tracking_dir)) {
            mkdir($tracking_dir, 0755, true);
        }
        
        // Load existing data
        $tracking_data = [];
        if (file_exists($tracking_file)) {
            $tracking_data = json_decode(file_get_contents($tracking_file), true) ?? [];
        }
        
        // Add new tracking
        $tracking_data[$email_id] = array_merge($data, [
            'tracked_at' => date('Y-m-d H:i:s')
        ]);
        
        // Save
        file_put_contents($tracking_file, json_encode($tracking_data, JSON_PRETTY_PRINT));
    }
    
    /**
     * Procesa tracking pixel
     */
    public function processTrackingPixel($email_id) {
        $this->trackEmail($email_id, [
            'status' => self::STATUS_OPENED,
            'opened_at' => date('Y-m-d H:i:s'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ]);
        
        // Return 1x1 transparent pixel
        header('Content-Type: image/gif');
        echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    }
    
    /**
     * Procesa clicks en links
     */
    public function processLinkClick($email_id, $link_id, $destination) {
        $this->trackEmail($email_id, [
            'status' => self::STATUS_CLICKED,
            'clicked_at' => date('Y-m-d H:i:s'),
            'link_id' => $link_id,
            'destination' => $destination,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
        ]);
        
        // Redirect to destination
        header('Location: ' . $destination);
        exit;
    }
    
    /**
     * Helpers para generar links
     */
    private function generateVerificationLink($token) {
        return "https://laburar.com.ar/verify-email?token={$token}";
    }
    
    private function generatePasswordResetLink($token) {
        return "https://laburar.com.ar/reset-password?token={$token}";
    }
    
    private function generateProfileLink($user_id) {
        return "https://laburar.com.ar/profile/{$user_id}";
    }
    
    private function generateProjectLink($project_id) {
        return "https://laburar.com.ar/project/{$project_id}";
    }
    
    private function generateUnsubscribeLink($email) {
        $token = $this->generateUnsubscribeToken($email);
        return "https://laburar.com.ar/unsubscribe?email={$email}&token={$token}";
    }
    
    private function generateGettingStartedLink($user_type) {
        return "https://laburar.com.ar/getting-started/{$user_type}";
    }
    
    private function generateReceiptLink($payment_id) {
        return "https://laburar.com.ar/payment/receipt/{$payment_id}";
    }
    
    private function generateInvoiceLink($payment_id) {
        return "https://laburar.com.ar/payment/invoice/{$payment_id}";
    }
    
    /**
     * Helpers de utilidad
     */
    private function generateEmailId() {
        return 'LAB-' . strtoupper(bin2hex(random_bytes(8)));
    }
    
    private function generateUnsubscribeToken($email) {
        return hash_hmac('sha256', $email, 'laburar-unsubscribe-secret');
    }
    
    private function formatCurrency($amount) {
        return 'AR$ ' . number_format($amount, 2, ',', '.');
    }
    
    private function getBrowserInfo() {
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        
        if (strpos($user_agent, 'Chrome') !== false) {
            return 'Chrome';
        } elseif (strpos($user_agent, 'Firefox') !== false) {
            return 'Firefox';
        } elseif (strpos($user_agent, 'Safari') !== false) {
            return 'Safari';
        } elseif (strpos($user_agent, 'Edge') !== false) {
            return 'Edge';
        }
        
        return 'Other';
    }
    
    private function getDeviceInfo() {
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        
        if (strpos($user_agent, 'Mobile') !== false) {
            return 'Mobile';
        } elseif (strpos($user_agent, 'Tablet') !== false) {
            return 'Tablet';
        }
        
        return 'Desktop';
    }
    
    private function getUserTypeFeatures($user_type) {
        if ($user_type === 'freelancer') {
            return [
                'Creá tu portfolio profesional',
                'Publicá tus servicios',
                'Recibí pagos seguros con MercadoPago',
                'Gestioná proyectos y clientes',
                'Construí tu reputación'
            ];
        } else {
            return [
                'Encontrá los mejores freelancers',
                'Publicá proyectos',
                'Pagá de forma segura',
                'Seguí el progreso en tiempo real',
                'Accedé a talento verificado'
            ];
        }
    }
    
    private function getActionRequired($notification_type) {
        $actions = [
            'new_proposal' => 'Revisar propuesta',
            'proposal_accepted' => 'Iniciar proyecto',
            'milestone_completed' => 'Aprobar entrega',
            'payment_required' => 'Realizar pago',
            'new_message' => 'Responder mensaje',
            'project_deadline' => 'Completar entrega',
            'dispute_opened' => 'Responder disputa'
        ];
        
        return $actions[$notification_type] ?? 'Ver detalles';
    }
    
    private function getProjectSubject($notification_type, $project_title) {
        $subjects = [
            'new_proposal' => "Nueva propuesta para: {$project_title}",
            'proposal_accepted' => "¡Tu propuesta fue aceptada! - {$project_title}",
            'milestone_completed' => "Milestone completado - {$project_title}",
            'payment_required' => "Pago requerido - {$project_title}",
            'new_message' => "Nuevo mensaje en: {$project_title}",
            'project_deadline' => "Recordatorio de deadline - {$project_title}",
            'dispute_opened' => "Disputa abierta - {$project_title}"
        ];
        
        return $subjects[$notification_type] ?? "Actualización en: {$project_title}";
    }
    
    /**
     * Rate limiting
     */
    private function checkRateLimit($email) {
        $rate_file = $this->log_path . 'rate_limit/' . md5($email) . '.json';
        $rate_dir = dirname($rate_file);
        
        if (!is_dir($rate_dir)) {
            mkdir($rate_dir, 0755, true);
        }
        
        $current_minute = date('Y-m-d H:i');
        $rate_data = [];
        
        if (file_exists($rate_file)) {
            $rate_data = json_decode(file_get_contents($rate_file), true) ?? [];
        }
        
        // Clean old entries
        foreach ($rate_data as $minute => $count) {
            if ($minute < date('Y-m-d H:i', strtotime('-1 hour'))) {
                unset($rate_data[$minute]);
            }
        }
        
        // Check current minute
        $current_count = $rate_data[$current_minute] ?? 0;
        
        if ($current_count >= $this->config['rate_limit']) {
            return false;
        }
        
        // Update count
        $rate_data[$current_minute] = $current_count + 1;
        file_put_contents($rate_file, json_encode($rate_data));
        
        return true;
    }
    
    /**
     * Logging methods
     */
    private function logInfo($message, $context = []) {
        $this->log('INFO', $message, $context);
    }
    
    private function logError($message, $context = []) {
        $this->log('ERROR', $message, $context);
    }
    
    private function logEmailSent($email_id, $to, $subject) {
        $this->log('SENT', 'Email sent successfully', [
            'email_id' => $email_id,
            'to' => $to,
            'subject' => $subject
        ]);
    }
    
    private function log($level, $message, $context = []) {
        $log_file = $this->log_path . date('Y-m-d') . '.log';
        $log_dir = dirname($log_file);
        
        if (!is_dir($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
        
        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => $level,
            'message' => $message,
            'context' => $context
        ];
        
        file_put_contents(
            $log_file,
            json_encode($log_entry) . PHP_EOL,
            FILE_APPEND | LOCK_EX
        );
    }
    
    /**
     * Ensure required directories exist
     */
    private function ensureDirectories() {
        $directories = [
            $this->log_path,
            $this->log_path . 'queue/',
            $this->log_path . 'failed/',
            $this->log_path . 'tracking/',
            $this->log_path . 'rate_limit/',
            $this->templates_path,
            $this->templates_path . 'layouts/'
        ];
        
        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }
    
    /**
     * Move failed emails
     */
    private function moveToFailed($queue_file, $email_data) {
        $failed_file = $this->log_path . 'failed/' . basename($queue_file);
        
        // Add failure info
        $email_data['moved_to_failed'] = date('Y-m-d H:i:s');
        $email_data['final_status'] = self::STATUS_FAILED;
        
        // Save to failed
        file_put_contents($failed_file, json_encode($email_data, JSON_PRETTY_PRINT));
        
        // Remove from queue
        unlink($queue_file);
        
        // Log
        $this->logError('Email moved to failed queue', [
            'email_id' => $email_data['id'],
            'to' => $email_data['to'],
            'attempts' => $email_data['attempts']
        ]);
    }
    
    /**
     * Add tracking pixel to HTML
     */
    private function addTrackingPixel($html, $email_id) {
        $pixel_url = "https://laburar.com.ar/email/track/{$email_id}";
        $pixel_tag = '<img src="' . $pixel_url . '" width="1" height="1" style="display:none;" alt="" />';
        
        // Add before closing body tag
        if (strpos($html, '</body>') !== false) {
            $html = str_replace('</body>', $pixel_tag . '</body>', $html);
        } else {
            $html .= $pixel_tag;
        }
        
        return $html;
    }
    
    /**
     * Generate receipt PDF (placeholder)
     */
    private function generateReceiptPDF($payment) {
        // TODO: Implement PDF generation
        // For now, return path to pre-generated PDF
        return $this->templates_path . 'receipts/sample.pdf';
    }
    
    /**
     * Public method to get email statistics
     */
    public function getStatistics($date_from = null, $date_to = null) {
        $stats = [
            'total_sent' => 0,
            'total_failed' => 0,
            'total_opened' => 0,
            'total_clicked' => 0,
            'by_template' => [],
            'by_date' => []
        ];
        
        // TODO: Implement statistics gathering from tracking files
        
        return $stats;
    }
}
?>