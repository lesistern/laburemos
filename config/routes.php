<?php
/**
 * LaburAR - API Routes Configuration
 * Define all API endpoints and their corresponding controllers
 */

use LaburAR\Core\Router;

// Authentication routes
$router->post('/api/auth/register', 'AuthController@register');
$router->post('/api/auth/login', 'AuthController@login');
$router->post('/api/auth/logout', 'AuthController@logout');
$router->post('/api/auth/refresh', 'AuthController@refreshToken');
$router->post('/api/auth/forgot-password', 'AuthController@forgotPassword');
$router->post('/api/auth/reset-password', 'AuthController@resetPassword');
$router->post('/api/auth/verify-email', 'AuthController@verifyEmail');
$router->post('/api/auth/verify-phone', 'AuthController@verifyPhone');
$router->post('/api/auth/resend-verification', 'AuthController@resendVerification');

// Two-Factor Authentication
$router->post('/api/auth/2fa/enable', 'AuthController@enableTwoFactor');
$router->post('/api/auth/2fa/verify', 'AuthController@verifyTwoFactor');
$router->post('/api/auth/2fa/disable', 'AuthController@disableTwoFactor');

// Profile management
$router->get('/api/profile', 'ProfileController@show');
$router->put('/api/profile', 'ProfileController@update');
$router->post('/api/profile/avatar', 'ProfileController@uploadAvatar');
$router->delete('/api/profile/avatar', 'ProfileController@deleteAvatar');

// Freelancer specific routes
$router->get('/api/freelancer/profile', 'FreelancerController@profile');
$router->put('/api/freelancer/profile', 'FreelancerController@updateProfile');
$router->get('/api/freelancer/portfolio', 'FreelancerController@portfolio');
$router->post('/api/freelancer/portfolio', 'FreelancerController@addPortfolioItem');
$router->put('/api/freelancer/portfolio/{id}', 'FreelancerController@updatePortfolioItem');
$router->delete('/api/freelancer/portfolio/{id}', 'FreelancerController@deletePortfolioItem');

// Client specific routes
$router->get('/api/client/profile', 'ClientController@profile');
$router->put('/api/client/profile', 'ClientController@updateProfile');
$router->get('/api/client/projects', 'ClientController@projects');

// Search and marketplace
$router->get('/api/search/freelancers', 'SearchController@freelancers');
$router->get('/api/search/services', 'SearchController@services');
$router->get('/api/marketplace/categories', 'MarketplaceController@categories');
$router->get('/api/marketplace/featured-freelancers', 'MarketplaceController@featuredFreelancers');

// Project management
$router->get('/api/projects', 'ProjectController@index');
$router->post('/api/projects', 'ProjectController@create');
$router->get('/api/projects/{id}', 'ProjectController@show');
$router->put('/api/projects/{id}', 'ProjectController@update');
$router->delete('/api/projects/{id}', 'ProjectController@delete');

// Proposals and bids
$router->get('/api/projects/{id}/proposals', 'ProposalController@index');
$router->post('/api/projects/{id}/proposals', 'ProposalController@create');
$router->get('/api/proposals/{id}', 'ProposalController@show');
$router->put('/api/proposals/{id}', 'ProposalController@update');
$router->post('/api/proposals/{id}/accept', 'ProposalController@accept');
$router->post('/api/proposals/{id}/reject', 'ProposalController@reject');

// Chat and messaging
$router->get('/api/conversations', 'ChatController@conversations');
$router->get('/api/conversations/{id}', 'ChatController@show');
$router->post('/api/conversations', 'ChatController@create');
$router->post('/api/conversations/{id}/messages', 'ChatController@sendMessage');
$router->put('/api/messages/{id}/read', 'ChatController@markAsRead');

// Notifications
$router->get('/api/notifications', 'NotificationController@index');
$router->put('/api/notifications/{id}/read', 'NotificationController@markAsRead');
$router->post('/api/notifications/mark-all-read', 'NotificationController@markAllAsRead');
$router->delete('/api/notifications/{id}', 'NotificationController@delete');

// Payments and transactions
$router->get('/api/payments', 'PaymentController@index');
$router->post('/api/payments/create-intent', 'PaymentController@createPaymentIntent');
$router->post('/api/payments/confirm', 'PaymentController@confirmPayment');
$router->get('/api/payments/{id}', 'PaymentController@show');
$router->post('/api/payments/{id}/release-escrow', 'PaymentController@releaseEscrow');

// Reviews and ratings
$router->get('/api/reviews', 'ReviewController@index');
$router->post('/api/reviews', 'ReviewController@create');
$router->get('/api/reviews/{id}', 'ReviewController@show');
$router->put('/api/reviews/{id}', 'ReviewController@update');
$router->delete('/api/reviews/{id}', 'ReviewController@delete');

// Verification and trust signals
$router->post('/api/verification/request', 'VerificationController@request');
$router->get('/api/verification/status', 'VerificationController@status');
$router->post('/api/verification/document', 'VerificationController@uploadDocument');

// Trust signals and badges
$router->get('/api/trust-signals', 'TrustSignalController@index');
$router->post('/api/trust-signals/verify-cuil', 'TrustSignalController@verifyCuil');
$router->post('/api/trust-signals/verify-university', 'TrustSignalController@verifyUniversity');
$router->post('/api/trust-signals/verify-professional-chamber', 'TrustSignalController@verifyProfessionalChamber');

// Favorites and bookmarks
$router->get('/api/favorites', 'FavoriteController@index');
$router->post('/api/favorites', 'FavoriteController@add');
$router->delete('/api/favorites/{id}', 'FavoriteController@remove');

// Argentine-specific services
$router->get('/api/servicios-argentinos', 'ServiceArgentinoController@index');
$router->get('/api/servicios-argentinos/categories', 'ServiceArgentinoController@categories');
$router->get('/api/servicios-argentinos/{slug}', 'ServiceArgentinoController@show');

// Service packages
$router->get('/api/service-packages', 'ServicePackageController@index');
$router->post('/api/service-packages', 'ServicePackageController@create');
$router->get('/api/service-packages/{id}', 'ServicePackageController@show');
$router->put('/api/service-packages/{id}', 'ServicePackageController@update');
$router->delete('/api/service-packages/{id}', 'ServicePackageController@delete');

// Public endpoints (no auth required)
$router->get('/api/public/marketplace', 'PublicController@marketplace');
$router->get('/api/public/freelancer/{id}', 'PublicController@freelancerProfile');
$router->get('/api/public/categories', 'PublicController@categories');
$router->get('/api/public/skills', 'PublicController@skills');
$router->post('/api/public/contact', 'PublicController@contact');

// Admin routes (require admin role)
$router->group('/api/admin', function($router) {
    $router->get('/dashboard', 'AdminController@dashboard');
    $router->get('/users', 'AdminController@users');
    $router->get('/users/{id}', 'AdminController@userDetail');
    $router->put('/users/{id}/status', 'AdminController@updateUserStatus');
    $router->get('/verifications', 'AdminController@verifications');
    $router->post('/verifications/{id}/approve', 'AdminController@approveVerification');
    $router->post('/verifications/{id}/reject', 'AdminController@rejectVerification');
    $router->get('/reports', 'AdminController@reports');
    $router->get('/analytics', 'AdminController@analytics');
});

// Utility endpoints
$router->get('/api/csrf-token', function() {
    return json_encode(['csrf_token' => csrf_token()]);
});

$router->get('/api/health', function() {
    return json_encode([
        'status' => 'healthy',
        'timestamp' => gmdate('c'),
        'version' => '1.0.0'
    ]);
});

// Handle 404 for API routes
$router->fallback(function() {
    http_response_code(404);
    return json_encode([
        'success' => false,
        'error' => 'API endpoint not found',
        'error_code' => 'ENDPOINT_NOT_FOUND'
    ]);
});