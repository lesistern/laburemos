<?php
echo "<h1>🎉 LaburAR Test - XAMPP Funcionando</h1>";
echo "<p>Fecha: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>PHP Version: " . PHP_VERSION . "</p>";
echo "<hr>";

echo "<h2>🔗 Links de prueba:</h2>";
echo "<a href='public/index.php'>👉 Ir a LaburAR (public/index.php)</a><br>";
echo "<a href='resources/views/index.html'>👉 Vista directa (resources/views/index.html)</a><br>";
echo "<a href='public/'>👉 Carpeta public</a><br>";

echo "<hr>";
echo "<h2>📁 Estructura verificada:</h2>";
echo "✅ public/index.php: " . (file_exists('public/index.php') ? 'EXISTS' : 'MISSING') . "<br>";
echo "✅ resources/views/index.html: " . (file_exists('resources/views/index.html') ? 'EXISTS' : 'MISSING') . "<br>";
echo "✅ .htaccess: " . (file_exists('.htaccess') ? 'EXISTS' : 'MISSING') . "<br>";
?>