<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    UnitController,
    ProductController,
    CategoryController,
    SupplierController,
    StoreLocationController,
    CustomerController,
    SaleController,
    UserController,
    StockReportController,
    AuthController,
    RoleController,
    PermissionController,
    PurchaseController
};

// Authentication routes (no permission middleware)
Route::middleware(['api'])->group(function() {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// Global OPTIONS route to handle CORS preflight requests
Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

// Test route without permission middleware
Route::get('/test-auth', function() {
    try {
        $user = auth()->user();
        return response()->json([
            'success' => true,
            'user' => $user,
            'token_valid' => true
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 401);
    }
})->middleware('auth:api');

// Routes without authentication middleware
Route::middleware(['api'])->group(function () {
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::get('/roles/{role}', [RoleController::class, 'show']);
    Route::put('/roles/{role}', [RoleController::class, 'update']);
    Route::delete('/roles/{role}', [RoleController::class, 'destroy']);
    Route::post('/roles/{role}/permissions', [RoleController::class, 'assignPermissions']);
    // Permission routes
    Route::apiResource('permissions', PermissionController::class)->except(['update']);
    // Other resource routes
    Route::apiResource('products', ProductController::class);
    Route::post('/products/import', [ProductController::class, 'import']);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('store-locations', StoreLocationController::class);
    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('units', UnitController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('sales', SaleController::class);
    Route::get('/next-bill-number', [SaleController::class, 'getLastBillNumber']);
    Route::get('/sales/daily-profit-report', [SaleController::class, 'getDailyProfitReport']);
    Route::get('/sales/bill-wise-profit-report', [SaleController::class, 'getBillWiseProfitReport']);
    Route::get('/sales/company-wise-profit-report', [SaleController::class, 'getCompanyWiseProfitReport']);
    Route::get('/sales/supplier-wise-profit-report', [SaleController::class, 'getSupplierWiseProfitReport']);
    Route::get('/stock-reports', [StockReportController::class, 'index']);
    Route::get('/detailed-stock-reports', [StockReportController::class, 'detailedReport']);
    Route::get('/product/{id}', [ProductController::class, 'barcode']);
});

// Protected routes (requires authentication)
Route::middleware(['api', 'auth:api', \App\Http\Middleware\RolePermissionMiddleware::class])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/add-default-user', [AuthController::class, 'addDefaultUser']);
    Route::get('/verify-token', [AuthController::class, 'verifyToken']);
    Route::post('/refresh-token', [AuthController::class, 'refreshToken']);

    // User routes
    Route::apiResource('users', UserController::class)->except(['create', 'edit']);
    Route::get('users/deleted', [UserController::class, 'getDeletedUsers']);
    Route::post('users/{id}/restore', [UserController::class, 'restoreUser']);
    Route::delete('users/{id}/force', [UserController::class, 'forceDeleteUser']);
    Route::post('users/{user}/permissions', [UserController::class, 'assignPermissions']);
    Route::post('users/change-password', [UserController::class, 'changePassword']);
    Route::put('users/update-profile', [UserController::class, 'updateProfile']);
    Route::get('users/{user}/activity-log', [UserController::class, 'activityLog']);
    Route::post('users/{user}/enable-2fa', [UserController::class, 'enable2FA']);
    Route::post('users/{user}/activate', [UserController::class, 'activateUser']);
    Route::patch('users/{user}/status', [UserController::class, 'updateStatus']);
});


// Route::middleware('auth:sanctum')->group(function () {
//     Route::get('/purchases', [PurchaseController::class, 'index']);
//     Route::post('/purchases', [PurchaseController::class, 'store']);
//     Route::get('/purchases/{id}', [PurchaseController::class, 'show']);
//     Route::put('/purchases/{id}', [PurchaseController::class, 'update']);
//     Route::delete('/purchases/{id}', [PurchaseController::class, 'destroy']);
//     Route::get('/suppliers', [SupplierController::class, 'index']);
//     Route::get('/store-locations', [StoreLocationController::class, 'index']);
//     Route::get('/products', [ProductController::class, 'index']);
// });