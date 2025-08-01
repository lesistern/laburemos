<?php
/**
 * LaburAR - Safe Index with Error Handling
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔍 LaburAR Safe Mode</h1>";

try {
    echo "<h2>Step 1: Loading Environment...</h2>";
    require_once __DIR__ . '/src/Core/Environment.php';
    \LaburAR\Core\Environment::load();
    echo "✅ Environment loaded<br>";
    
    echo "<h2>Step 2: Loading Bootstrap...</h2>";
    require_once __DIR__ . '/resources/views/bootstrap.php';
    echo "✅ Bootstrap loaded<br>";
    
    echo "<h2>Step 3: Testing Database Helper...</h2>";
    $stats = \LaburAR\Services\DatabaseHelper::getPlatformStats();
    echo "✅ Database Helper working<br>";
    echo "Stats: " . print_r($stats, true) . "<br>";
    
    echo "<h2>Step 4: Loading Main View...</h2>";
    // Try to include the main view
    ob_start();
    include __DIR__ . '/resources/views/index.php';
    $content = ob_get_clean();
    
    if (strlen($content) > 100) {
        echo "✅ Main view loaded successfully (" . strlen($content) . " characters)<br>";
        echo "<hr>";
        echo $content;
    } else {
        echo "❌ Main view failed to load properly<br>";
        echo "Content: " . htmlspecialchars($content) . "<br>";
    }
    
} catch (Exception $e) {
    echo "<h2>❌ ERROR FOUND:</h2>";
    echo "<pre>";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Stack Trace:\n" . $e->getTraceAsString();
    echo "</pre>";
} catch (Error $e) {
    echo "<h2>❌ FATAL ERROR FOUND:</h2>";
    echo "<pre>";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Stack Trace:\n" . $e->getTraceAsString();
    echo "</pre>";
}
?>