<?php
/**
 * Clear Session - Utility to reset login state
 */

session_start();

// Clear all session variables
$_SESSION = array();

// Destroy the session cookie if it exists
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy the session
session_destroy();

// Clear any remember me cookies
setcookie('remember_token', '', time() - 3600, '/', '', true, true);

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sesión Limpiada - LaburAR</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
            text-align: center;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        button:hover {
            background: #0056b3;
        }
        .test-btn {
            background: #28a745;
        }
        .test-btn:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧹 Sesión Limpiada</h1>
        
        <div class="success">
            <strong>✅ Éxito!</strong><br>
            Se han eliminado todas las cookies y datos de sesión.
        </div>
        
        <p>Ahora puedes probar el login desde cero.</p>
        
        <button onclick="location.href='/Laburar/'">
            🏠 Ir a Página Principal
        </button>
        
        <button class="test-btn" onclick="location.href='/Laburar/test-login-simple.php'">
            🧪 Ir a Test Login
        </button>
        
        <div style="margin-top: 20px; text-align: left; background: #e9ecef; padding: 15px; border-radius: 5px;">
            <h3>🔑 Credenciales de Prueba:</h3>
            <p><strong>Cliente:</strong> cliente@laburar.com / cliente123</p>
            <p><strong>Admin:</strong> admin@test.com / admin123</p>
        </div>
    </div>
</body>
</html>