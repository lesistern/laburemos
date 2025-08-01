<?php
/**
 * LABUREMOS Data Audit Manager - Enterprise Grade Data Quality Assessment
 * 
 * Comprehensive audit system to identify dummy data, placeholders,
 * and quality issues across the entire LABUREMOS platform
 * 
 * @author LABUREMOS Data Quality Team
 * @version 1.0
 * @since 2025-07-20
 */

require_once __DIR__ . '/../../includes/DatabaseHelper.php';

class DataAuditManager {
    
    private $db;
    private $auditResults = [];
    private $detailedExamples = [];
    private $summaryStats = [];
    private $startTime;
    
    public function __construct() {
        $this->startTime = microtime(true);
        
        try {
            $this->db = DatabaseHelper::getConnection();
            echo "🔗 Database connection established\n";
        } catch (Exception $e) {
            echo "❌ Database connection failed: " . $e->getMessage() . "\n";
            exit(1);
        }
    }
    
    public function runCompleteAudit(): array {
        echo "🔍 LABUREMOS Data Quality Audit Starting...\n";
        echo "==========================================\n\n";
        
        // Run comprehensive audit
        $this->executeMainAudit();
        $this->collectDetailedExamples();
        $this->collectSummaryStatistics();
        $this->auditFileSystem();
        $this->validateDataIntegrity();
        
        // Generate comprehensive reports
        $this->generateHtmlReport();
        $this->generateJsonReport();
        $this->generateCsvReport();
        
        // Calculate audit summary
        $summary = $this->calculateAuditSummary();
        
        echo "\n==========================================\n";
        echo "✅ Audit completed in " . round(microtime(true) - $this->startTime, 2) . " seconds\n";
        echo "📊 Total issues found: " . $summary['total_issues'] . "\n";
        echo "📄 Reports generated:\n";
        echo "   - HTML: audit-report.html\n";
        echo "   - JSON: audit-results.json\n";
        echo "   - CSV: audit-data.csv\n\n";
        
        if ($summary['total_issues'] > 0) {
            echo "⚠️  WARNING: Platform NOT ready for production\n";
            echo "   Run cleanup script to resolve issues\n\n";
        } else {
            echo "🎉 SUCCESS: Platform ready for production\n";
            echo "   No dummy data detected\n\n";
        }
        
        return $this->auditResults;
    }
    
    private function executeMainAudit(): void {
        echo "📋 Executing main data audit...\n";
        
        try {
            $auditSql = file_get_contents(__DIR__ . '/data-audit.sql');
            
            // Split SQL into individual queries
            $queries = explode('UNION ALL', $auditSql);
            $mainQuery = implode('UNION ALL', array_slice($queries, 0, -4)); // Exclude examples and stats
            
            $stmt = $this->db->query($mainQuery);
            $this->auditResults = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "   ✓ Main audit completed - " . count($this->auditResults) . " checks performed\n";
            
        } catch (Exception $e) {
            echo "   ❌ Main audit failed: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
    
    private function collectDetailedExamples(): void {
        echo "🔍 Collecting detailed examples...\n";
        
        $exampleQueries = [
            'users' => "
                SELECT 'USER_EXAMPLES' as type, id, email, CONCAT(first_name, ' ', last_name) as name, 
                       LEFT(bio, 100) as bio_preview, avatar_url
                FROM users 
                WHERE 
                  email LIKE '%test%' OR email LIKE '%demo%' OR 
                  first_name IN ('John', 'Jane', 'Test', 'Demo', 'Usuario') OR
                  bio LIKE '%Lorem ipsum%' OR bio LIKE '%placeholder%'
                LIMIT 10
            ",
            'services' => "
                SELECT 'SERVICE_EXAMPLES' as type, id, title, LEFT(description, 100) as description_preview, 
                       starting_price, image_url
                FROM services 
                WHERE 
                  title LIKE '%test%' OR title LIKE '%demo%' OR 
                  description LIKE '%Lorem ipsum%' OR description LIKE '%placeholder%' OR
                  starting_price IN (1000, 5000, 10000)
                LIMIT 10
            ",
            'reviews' => "
                SELECT 'REVIEW_EXAMPLES' as type, id, user_id, service_id, comment, rating, created_at
                FROM reviews 
                WHERE 
                  comment LIKE '%Lorem%' OR
                  comment IN ('Great work', 'Excellent service', 'Perfect', 'Amazing') OR
                  LENGTH(comment) < 20
                LIMIT 10
            ",
            'projects' => "
                SELECT 'PROJECT_EXAMPLES' as type, id, title, LEFT(description, 100) as description_preview,
                       budget_min, budget_max, status
                FROM projects 
                WHERE 
                  title LIKE '%test%' OR title LIKE '%demo%' OR
                  description LIKE '%Lorem ipsum%' OR budget_min = budget_max OR
                  (budget_min = 1000 AND budget_max = 5000)
                LIMIT 10
            "
        ];
        
        foreach ($exampleQueries as $type => $query) {
            try {
                $stmt = $this->db->query($query);
                $this->detailedExamples[$type] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo "   ✓ {$type} examples collected\n";
            } catch (Exception $e) {
                echo "   ⚠️  Failed to collect {$type} examples: " . $e->getMessage() . "\n";
                $this->detailedExamples[$type] = [];
            }
        }
    }
    
    private function collectSummaryStatistics(): void {
        echo "📊 Collecting summary statistics...\n";
        
        $statsQuery = "
            SELECT 'SUMMARY_STATS' as type, 'Total Users' as metric, COUNT(*) as value FROM users
            UNION ALL
            SELECT 'SUMMARY_STATS' as type, 'Active Freelancers' as metric, COUNT(*) as value FROM users WHERE is_freelancer = 1 AND status = 'active'
            UNION ALL
            SELECT 'SUMMARY_STATS' as type, 'Total Services' as metric, COUNT(*) as value FROM services WHERE status = 'active'
            UNION ALL
            SELECT 'SUMMARY_STATS' as type, 'Total Reviews' as metric, COUNT(*) as value FROM reviews
            UNION ALL
            SELECT 'SUMMARY_STATS' as type, 'Total Projects' as metric, COUNT(*) as value FROM projects
            UNION ALL
            SELECT 'SUMMARY_STATS' as type, 'Average Rating' as metric, ROUND(AVG(rating), 2) as value FROM reviews
            UNION ALL
            SELECT 'SUMMARY_STATS' as type, 'Users with Complete Profiles' as metric, 
                   COUNT(*) as value FROM users WHERE bio IS NOT NULL AND LENGTH(bio) >= 50 AND avatar_url IS NOT NULL
            UNION ALL
            SELECT 'SUMMARY_STATS' as type, 'Services with Quality Descriptions' as metric,
                   COUNT(*) as value FROM services WHERE LENGTH(description) >= 100
        ";
        
        try {
            $stmt = $this->db->query($statsQuery);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($results as $row) {
                $this->summaryStats[$row['metric']] = $row['value'];
            }
            
            echo "   ✓ Summary statistics collected\n";
        } catch (Exception $e) {
            echo "   ⚠️  Failed to collect summary statistics: " . $e->getMessage() . "\n";
        }
    }
    
    private function auditFileSystem(): void {
        echo "📁 Auditing file system for dummy assets...\n";
        
        $imagePaths = [
            '/assets/img/demo/',
            '/assets/img/placeholders/',
            '/assets/img/test/',
            '/uploads/services/',
            '/uploads/avatars/',
            '/uploads/portfolio/'
        ];
        
        $dummyFiles = [];
        $totalFiles = 0;
        
        foreach ($imagePaths as $path) {
            $fullPath = $_SERVER['DOCUMENT_ROOT'] . '/Laburar' . $path;
            if (is_dir($fullPath)) {
                $files = glob($fullPath . '*');
                $totalFiles += count($files);
                
                foreach ($files as $file) {
                    $filename = basename($file);
                    if (preg_match('/(test|demo|placeholder|dummy|lorem|sample|example)/i', $filename)) {
                        $dummyFiles[] = [
                            'path' => $file,
                            'filename' => $filename,
                            'size' => filesize($file),
                            'modified' => date('Y-m-d H:i:s', filemtime($file))
                        ];
                    }
                }
            }
        }
        
        if (!empty($dummyFiles)) {
            file_put_contents(__DIR__ . '/dummy-files.json', json_encode($dummyFiles, JSON_PRETTY_PRINT));
            echo "   ⚠️  Found " . count($dummyFiles) . " dummy files (saved to dummy-files.json)\n";
        } else {
            echo "   ✓ No dummy files found in file system\n";
        }
        
        // Add to audit results
        $this->auditResults[] = [
            'table_name' => 'FILE_SYSTEM',
            'issue' => 'Dummy files found',
            'count' => count($dummyFiles)
        ];
        
        echo "   📈 Total files scanned: {$totalFiles}\n";
    }
    
    private function validateDataIntegrity(): void {
        echo "🔍 Validating data integrity...\n";
        
        $integrityChecks = [
            'Orphaned services' => 'SELECT COUNT(*) FROM services WHERE user_id NOT IN (SELECT id FROM users)',
            'Orphaned reviews' => 'SELECT COUNT(*) FROM reviews WHERE service_id NOT IN (SELECT id FROM services)',
            'Orphaned messages' => 'SELECT COUNT(*) FROM messages WHERE sender_id NOT IN (SELECT id FROM users) OR recipient_id NOT IN (SELECT id FROM users)',
            'Invalid ratings' => 'SELECT COUNT(*) FROM reviews WHERE rating < 1 OR rating > 5',
            'Empty required fields' => 'SELECT COUNT(*) FROM users WHERE email IS NULL OR email = ""',
            'Duplicate emails' => 'SELECT COUNT(*) - COUNT(DISTINCT email) FROM users',
            'Future dates' => 'SELECT COUNT(*) FROM projects WHERE deadline < CURDATE() AND status = "open"'
        ];
        
        $integrityIssues = [];
        
        foreach ($integrityChecks as $check => $sql) {
            try {
                $stmt = $this->db->query($sql);
                $count = $stmt->fetchColumn();
                if ($count > 0) {
                    $integrityIssues[] = ['check' => $check, 'count' => $count];
                    echo "   ⚠️  {$check}: {$count} issues\n";
                } else {
                    echo "   ✓ {$check}: OK\n";
                }
            } catch (Exception $e) {
                echo "   ❌ Failed to check {$check}: " . $e->getMessage() . "\n";
            }
        }
        
        if (!empty($integrityIssues)) {
            file_put_contents(__DIR__ . '/integrity-issues.json', json_encode($integrityIssues, JSON_PRETTY_PRINT));
            echo "   📄 Integrity issues saved to integrity-issues.json\n";
        }
        
        // Add integrity issues to audit results
        foreach ($integrityIssues as $issue) {
            $this->auditResults[] = [
                'table_name' => 'DATA_INTEGRITY',
                'issue' => $issue['check'],
                'count' => $issue['count']
            ];
        }
    }
    
    private function generateHtmlReport(): void {
        $totalIssues = array_sum(array_column($this->auditResults, 'count'));
        $executionTime = round(microtime(true) - $this->startTime, 2);
        
        $html = $this->generateHtmlContent($totalIssues, $executionTime);
        file_put_contents(__DIR__ . '/audit-report.html', $html);
        
        echo "📄 HTML report generated: audit-report.html\n";
    }
    
    private function generateHtmlContent($totalIssues, $executionTime): string {
        $criticalIssues = count(array_filter($this->auditResults, function($result) {
            return $this->determineSeverity($result['table_name'], $result['count']) === 'CRITICAL';
        }));
        
        $statusClass = $totalIssues > 0 ? 'critical' : 'success';
        $statusIcon = $totalIssues > 0 ? '❌' : '✅';
        $statusMessage = $totalIssues > 0 
            ? "CRITICAL: Dummy data detected. Platform NOT ready for production." 
            : "SUCCESS: No dummy data detected. Platform ready for production.";
        
        $html = "<!DOCTYPE html>
<html lang='es-AR'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>LABUREMOS Data Quality Audit Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8f9fa;
            margin: 0;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px; 
            border-radius: 12px; 
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header .subtitle { font-size: 1.1rem; opacity: 0.9; }
        .summary { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            margin-bottom: 30px; 
            border-left: 6px solid var(--status-color);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .summary.critical { --status-color: #dc3545; }
        .summary.success { --status-color: #28a745; }
        .summary h2 { color: var(--status-color); margin-bottom: 15px; }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin: 30px 0; 
        }
        .stat-card { 
            background: white; 
            padding: 25px; 
            border-radius: 10px; 
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .stat-number { 
            font-size: 2.5rem; 
            font-weight: bold; 
            color: #667eea; 
            display: block; 
        }
        .stat-label { 
            color: #666; 
            font-size: 0.9rem; 
            margin-top: 5px; 
        }
        .section { 
            background: white; 
            margin-bottom: 30px; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .section-header { 
            background: #f8f9fa; 
            padding: 20px 30px; 
            border-bottom: 1px solid #dee2e6; 
        }
        .section-title { 
            font-size: 1.3rem; 
            margin: 0; 
            color: #495057; 
        }
        .table-container { padding: 0; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        th, td { 
            padding: 15px 30px; 
            text-align: left; 
            border-bottom: 1px solid #dee2e6; 
        }
        th { 
            background: #f8f9fa; 
            font-weight: 600; 
            color: #495057; 
        }
        .count { 
            font-weight: bold; 
            font-size: 1.1rem; 
        }
        .count.critical { color: #dc3545; }
        .count.warning { color: #ffc107; }
        .count.ok { color: #28a745; }
        .severity { 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.85rem; 
            font-weight: 600; 
            text-transform: uppercase; 
        }
        .severity.critical { 
            background: #f8d7da; 
            color: #721c24; 
        }
        .severity.warning { 
            background: #fff3cd; 
            color: #856404; 
        }
        .severity.ok { 
            background: #d4edda; 
            color: #155724; 
        }
        .recommendations { 
            background: #e3f2fd; 
            padding: 25px; 
            border-radius: 8px; 
            margin: 30px 0; 
        }
        .recommendations h3 { 
            color: #1976d2; 
            margin-bottom: 15px; 
        }
        .recommendations ol { 
            margin-left: 20px; 
        }
        .recommendations li { 
            margin-bottom: 10px; 
            color: #424242; 
        }
        .footer { 
            text-align: center; 
            padding: 30px; 
            color: #666; 
            border-top: 1px solid #dee2e6; 
            margin-top: 40px; 
        }
        .examples { 
            margin-top: 20px; 
        }
        .example-item { 
            background: #f8f9fa; 
            padding: 15px; 
            margin-bottom: 10px; 
            border-radius: 6px; 
            border-left: 3px solid #dc3545; 
        }
        .meta-info { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            color: #666; 
            font-size: 0.9rem; 
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🔍 LABUREMOS Data Quality Audit</h1>
            <div class='subtitle'>Comprehensive Platform Readiness Assessment</div>
            <div class='meta-info'>
                <span>Generated: " . date('Y-m-d H:i:s') . "</span>
                <span>Execution Time: {$executionTime}s</span>
                <span>Checks Performed: " . count($this->auditResults) . "</span>
            </div>
        </div>
        
        <div class='summary {$statusClass}'>
            <h2>{$statusIcon} Executive Summary</h2>
            <p style='font-size: 1.1rem; margin-bottom: 20px;'>{$statusMessage}</p>
            <div class='stats-grid'>
                <div class='stat-card'>
                    <span class='stat-number'>{$totalIssues}</span>
                    <div class='stat-label'>Total Issues</div>
                </div>
                <div class='stat-card'>
                    <span class='stat-number'>{$criticalIssues}</span>
                    <div class='stat-label'>Critical Issues</div>
                </div>
                <div class='stat-card'>
                    <span class='stat-number'>" . ($this->summaryStats['Total Users'] ?? '0') . "</span>
                    <div class='stat-label'>Total Users</div>
                </div>
                <div class='stat-card'>
                    <span class='stat-number'>" . ($this->summaryStats['Total Services'] ?? '0') . "</span>
                    <div class='stat-label'>Active Services</div>
                </div>
            </div>
        </div>";
        
        // Platform Statistics Section
        if (!empty($this->summaryStats)) {
            $html .= "
            <div class='section'>
                <div class='section-header'>
                    <h2 class='section-title'>📊 Platform Statistics</h2>
                </div>
                <div class='table-container'>
                    <table>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>";
            
            foreach ($this->summaryStats as $metric => $value) {
                $status = $this->getMetricStatus($metric, $value);
                $html .= "
                            <tr>
                                <td>{$metric}</td>
                                <td class='stat-number'>{$value}</td>
                                <td><span class='severity {$status['class']}'>{$status['text']}</span></td>
                            </tr>";
            }
            
            $html .= "
                        </tbody>
                    </table>
                </div>
            </div>";
        }
        
        // Detailed Findings Section
        $html .= "
        <div class='section'>
            <div class='section-header'>
                <h2 class='section-title'>🔍 Detailed Findings</h2>
            </div>
            <div class='table-container'>
                <table>
                    <thead>
                        <tr>
                            <th>Table/Area</th>
                            <th>Issue Type</th>
                            <th>Count</th>
                            <th>Severity</th>
                            <th>Action Required</th>
                        </tr>
                    </thead>
                    <tbody>";
        
        foreach ($this->auditResults as $result) {
            $severity = $this->determineSeverity($result['table_name'], $result['count']);
            $severityClass = strtolower($severity);
            $action = $this->determineAction($result['table_name'], $result['count']);
            $countClass = $result['count'] > 0 ? $severityClass : 'ok';
            
            $html .= "
                        <tr>
                            <td><strong>{$result['table_name']}</strong></td>
                            <td>{$result['issue']}</td>
                            <td><span class='count {$countClass}'>{$result['count']}</span></td>
                            <td><span class='severity {$severityClass}'>{$severity}</span></td>
                            <td>{$action}</td>
                        </tr>";
        }
        
        $html .= "
                    </tbody>
                </table>
            </div>
        </div>";
        
        // Examples Section (if issues found)
        if ($totalIssues > 0 && !empty($this->detailedExamples)) {
            $html .= $this->generateExamplesSection();
        }
        
        // Recommendations Section
        $html .= "
        <div class='recommendations'>
            <h3>💡 Recommended Actions</h3>";
        
        if ($totalIssues > 0) {
            $html .= "
            <ol>
                <li><strong>🗑️ Execute cleanup script</strong> - Remove all identified dummy data using comprehensive-cleanup.sql</li>
                <li><strong>📝 Generate professional content</strong> - Replace with realistic demo data using ProfessionalContentSeeder.php</li>
                <li><strong>🔒 Implement content validation</strong> - Deploy ContentValidator.php to prevent future dummy data</li>
                <li><strong>✅ Re-run audit</strong> - Verify complete cleanup before production deployment</li>
                <li><strong>🎯 Manual review</strong> - Review examples above for context and edge cases</li>
            </ol>";
        } else {
            $html .= "
            <ol>
                <li><strong>✅ Platform Ready</strong> - No dummy data detected, platform ready for production</li>
                <li><strong>🔒 Deploy validation</strong> - Implement ContentValidator.php to maintain quality</li>
                <li><strong>📊 Monitor content</strong> - Regular audits to ensure ongoing quality</li>
                <li><strong>🚀 Production deployment</strong> - Platform meets all data quality criteria</li>
            </ol>";
        }
        
        $html .= "
        </div>
        
        <div class='footer'>
            <p><strong>LABUREMOS Data Quality Audit</strong> | Generated on " . date('Y-m-d H:i:s') . "</p>
            <p>Platform must show 0 issues before production deployment</p>
        </div>
    </div>
</body>
</html>";
        
        return $html;
    }
    
    private function generateExamplesSection(): string {
        $html = "
        <div class='section'>
            <div class='section-header'>
                <h2 class='section-title'>📋 Examples for Manual Review</h2>
            </div>
            <div style='padding: 30px;'>";
        
        foreach ($this->detailedExamples as $type => $examples) {
            if (!empty($examples)) {
                $html .= "<h4 style='color: #495057; margin: 20px 0 15px 0; text-transform: capitalize;'>{$type} Examples</h4>";
                
                foreach (array_slice($examples, 0, 5) as $example) {
                    $html .= "<div class='example-item'>";
                    
                    foreach ($example as $key => $value) {
                        if ($key !== 'type') {
                            $html .= "<strong>" . ucfirst(str_replace('_', ' ', $key)) . ":</strong> " . htmlspecialchars($value ?? 'N/A') . "<br>";
                        }
                    }
                    
                    $html .= "</div>";
                }
            }
        }
        
        $html .= "</div></div>";
        
        return $html;
    }
    
    private function generateJsonReport(): void {
        $report = [
            'audit_info' => [
                'timestamp' => date('Y-m-d H:i:s'),
                'execution_time' => round(microtime(true) - $this->startTime, 2),
                'version' => '1.0'
            ],
            'summary' => $this->calculateAuditSummary(),
            'results' => $this->auditResults,
            'detailed_examples' => $this->detailedExamples,
            'platform_stats' => $this->summaryStats
        ];
        
        file_put_contents(__DIR__ . '/audit-results.json', json_encode($report, JSON_PRETTY_PRINT));
        echo "📄 JSON report generated: audit-results.json\n";
    }
    
    private function generateCsvReport(): void {
        $csvFile = fopen(__DIR__ . '/audit-data.csv', 'w');
        
        // CSV Headers
        fputcsv($csvFile, ['Table/Area', 'Issue Type', 'Count', 'Severity', 'Action Required']);
        
        // CSV Data
        foreach ($this->auditResults as $result) {
            fputcsv($csvFile, [
                $result['table_name'],
                $result['issue'],
                $result['count'],
                $this->determineSeverity($result['table_name'], $result['count']),
                $this->determineAction($result['table_name'], $result['count'])
            ]);
        }
        
        fclose($csvFile);
        echo "📄 CSV report generated: audit-data.csv\n";
    }
    
    private function determineSeverity(string $table, int $count): string {
        if ($count === 0) return 'OK';
        
        // Critical issues that block production
        if (in_array($table, ['USERS', 'SERVICES', 'DATA_INTEGRITY']) && $count > 0) return 'CRITICAL';
        if ($table === 'FILE_SYSTEM' && $count > 10) return 'CRITICAL';
        
        // Warning issues that should be addressed
        if ($count > 5) return 'WARNING';
        
        return 'OK';
    }
    
    private function determineAction(string $table, int $count): string {
        if ($count === 0) return 'No action needed';
        
        switch ($table) {
            case 'USERS':
                return 'Delete dummy users immediately';
            case 'SERVICES':
                return 'Replace with professional content';
            case 'REVIEWS':
                return 'Remove generic reviews';
            case 'DATA_INTEGRITY':
                return 'Fix data relationships';
            case 'FILE_SYSTEM':
                return 'Remove placeholder files';
            default:
                return 'Review and clean';
        }
    }
    
    private function getMetricStatus(string $metric, $value): array {
        switch ($metric) {
            case 'Users with Complete Profiles':
                $percentage = ($this->summaryStats['Total Users'] > 0) 
                    ? ($value / $this->summaryStats['Total Users']) * 100 
                    : 0;
                if ($percentage >= 80) return ['class' => 'ok', 'text' => 'Good'];
                if ($percentage >= 50) return ['class' => 'warning', 'text' => 'Fair'];
                return ['class' => 'critical', 'text' => 'Poor'];
                
            case 'Services with Quality Descriptions':
                $percentage = ($this->summaryStats['Total Services'] > 0) 
                    ? ($value / $this->summaryStats['Total Services']) * 100 
                    : 0;
                if ($percentage >= 90) return ['class' => 'ok', 'text' => 'Excellent'];
                if ($percentage >= 70) return ['class' => 'warning', 'text' => 'Good'];
                return ['class' => 'critical', 'text' => 'Needs Work'];
                
            case 'Average Rating':
                if ($value >= 4.5) return ['class' => 'ok', 'text' => 'Excellent'];
                if ($value >= 4.0) return ['class' => 'warning', 'text' => 'Good'];
                return ['class' => 'critical', 'text' => 'Below Standard'];
                
            default:
                return ['class' => 'ok', 'text' => 'OK'];
        }
    }
    
    private function calculateAuditSummary(): array {
        $totalIssues = array_sum(array_column($this->auditResults, 'count'));
        $criticalIssues = count(array_filter($this->auditResults, function($result) {
            return $this->determineSeverity($result['table_name'], $result['count']) === 'CRITICAL';
        }));
        
        return [
            'total_issues' => $totalIssues,
            'critical_issues' => $criticalIssues,
            'production_ready' => $totalIssues === 0,
            'cleanup_required' => $totalIssues > 0,
            'quality_score' => max(0, 100 - ($totalIssues * 5)), // Simple scoring
            'platform_stats' => $this->summaryStats
        ];
    }
}

// Execute audit if run from command line
if (php_sapi_name() === 'cli') {
    echo "\n";
    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║                   LABUREMOS Data Quality Audit                ║\n";
    echo "║              Enterprise Platform Readiness Check            ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n";
    echo "\n";
    
    try {
        $audit = new DataAuditManager();
        $results = $audit->runCompleteAudit();
        
        $totalIssues = array_sum(array_column($results, 'count'));
        
        if ($totalIssues > 0) {
            echo "🚨 ATTENTION REQUIRED\n";
            echo "   Platform contains dummy data and is NOT ready for production\n";
            echo "   Review audit-report.html for detailed findings\n";
            echo "   Execute cleanup procedures before launch\n\n";
            exit(1);
        } else {
            echo "🎉 PRODUCTION READY\n";
            echo "   No dummy data detected\n";
            echo "   Platform meets enterprise quality standards\n\n";
            exit(0);
        }
        
    } catch (Exception $e) {
        echo "❌ AUDIT FAILED\n";
        echo "   Error: " . $e->getMessage() . "\n";
        echo "   Check database connection and permissions\n\n";
        exit(1);
    }
}

// For web access
if (isset($_GET['run_audit'])) {
    header('Content-Type: application/json');
    
    try {
        $audit = new DataAuditManager();
        $results = $audit->runCompleteAudit();
        
        echo json_encode([
            'success' => true,
            'total_issues' => array_sum(array_column($results, 'count')),
            'results' => $results,
            'report_url' => '/Laburar/database/scripts/audit-report.html'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
?>