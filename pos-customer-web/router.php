<?php
// Router PHP Server to automatically bypass Localtunnel & Ngrok reminder screens & CORS
header("Bypass-Tunnel-Reminder: true");
header("Bypass-Tunnel-Reminder: 1");
header("ngrok-skip-browser-warning: 1");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

$uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$filePath = __DIR__ . $uri;

if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    return false; // serve existing file directly
}

include __DIR__ . '/index.html';
