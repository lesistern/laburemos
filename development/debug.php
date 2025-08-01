<?php
echo "<h1>🔍 LaburAR Debug Info</h1>";
echo "<pre>";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'not set') . "\n";
echo "SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'not set') . "\n";
echo "PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'not set') . "\n";
echo "QUERY_STRING: " . ($_SERVER['QUERY_STRING'] ?? 'not set') . "\n";

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$segments = array_filter(explode('/', trim($path, '/')));

echo "\nProcessed path: " . $path . "\n";
echo "Segments: " . print_r($segments, true) . "\n";
echo "First segment: " . ($segments[0] ?? 'EMPTY') . "\n";
echo "</pre>";

echo "<h2>🔗 Test Links:</h2>";
echo "<a href='/Laburar/'>Root</a> | ";
echo "<a href='/Laburar/home'>Home</a> | ";
echo "<a href='/Laburar/login'>Login</a><br>";
?>