<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Validator;

class ProductController extends Controller
{
    // Get all products
    public function index()
    {
        try {
            $products = Product::all();
            return response()->json(['message' => 'Products fetched successfully', 'data' => $products], 200);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Error fetching products');
        }
    }

    // Store a new product
    public function store(Request $request)
    {
        Log::info('Creating new product:', $request->all());

        try {
            $validatedData = $request->validate($this->storeRules());
            $product = Product::create($validatedData);

            return response()->json(['message' => 'Product created successfully', 'data' => $product], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Error creating product');
        }
    }

    // Get a single product
    public function show($id)
    {
        try {
            $product = Product::findOrFail($id);
            return response()->json(['message' => 'Product fetched successfully', 'data' => $product], 200);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Product not found', 404);
        }
    }

    // Update a product
    public function update(Request $request, $id)
    {
        Log::info("Updating product ID: $id", $request->all());

        try {
            $product = Product::findOrFail($id);
            $validatedData = $request->validate($this->updateRules($id));
            $product->update($validatedData);

            return response()->json(['message' => 'Product updated successfully', 'data' => $product], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Error updating product');
        }
    }

    // Delete a product
    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);
            $product->delete();

            return response()->json(['message' => 'Product deleted successfully'], 200);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Error deleting product');
        }
    }

    // Import products from an Excel file
public function import(Request $request)
{
    Log::info('Import method called with request data: ', $request->all());

    try {
        // Validate the file
        Log::info('Validating file...');
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv',
        ]);

        if (!$request->hasFile('file')) {
            Log::warning('No file uploaded.');
            return response()->json([
                'message' => 'No file uploaded',
            ], 400);
        }

        $file = $request->file('file');
        Log::info('File uploaded:', ['file' => $file->getClientOriginalName()]);

        // Load the spreadsheet
        Log::info('Loading spreadsheet...');
        $spreadsheet = IOFactory::load($file->getPathname());

        // Get active sheet and convert to array
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        // Log rows to check the data
        Log::info('Rows data:', ['rows' => $rows]);

        $header = array_shift($rows); // Remove header row
        Log::info('Excel header:', ['header' => $header]);

        DB::beginTransaction();

        $importedProducts = [];
        $rowCount = count($rows);
        Log::info('Total rows to process: ' . $rowCount);

        foreach ($rows as $index => $row) {
            Log::info("Processing row: $index", ['row' => $row]);

            if (empty($row[0])) {
                Log::warning('Skipping row due to missing product_name:', ['index' => $index]);
                continue;
            }

            $productData = [
                'product_name' => $row[0] ?? null,
                'item_code' => $row[1] ?? null,
                'expiry_date' => $row[3] ?? null,
                'buying_cost' => $row[4] ?? 0,
                'sales_price' => $row[5] ?? 0,
                'minimum_price' => $row[6] ?? 0,
                'wholesale_price' => $row[7] ?? 0,
                'barcode' => $row[8] ?? null,
                'mrp' => $row[9] ?? 0,
                'minimum_stock_quantity' => $row[10] ?? 0,
                'opening_stock_quantity' => $row[11] ?? 0,
                'opening_stock_value' => $row[12] ?? 0,
                'category' => $row[13] ?? null,
                'supplier' => $row[14] ?? null,
                'unit_type' => $row[15] ?? null,
                'store_location' => $row[16] ?? null,
                'cabinet' => $row[17] ?? null,
                'row' => $row[18] ?? null,
                'extra_fields' => json_encode([
                    'extra_field_name' => $row[19] ?? null,
                    'extra_field_value' => $row[20] ?? null,
                ]),
            ];

            Log::info('Mapped product data:', ['product_data' => $productData]);

            // Validate the product data
            $validator = Validator::make($productData, $this->importRules());

            if ($validator->fails()) {
                Log::warning('Validation failed for row: ' . $index, ['errors' => $validator->errors()->all()]);
                continue;
            }

            // Create product and add to imported list
            try {
                $product = Product::create($productData);
                $importedProducts[] = $product;
                Log::info("Product created for row: $index", ['product' => $product]);
            } catch (\Exception $e) {
                Log::error("Error creating product for row $index:", ['error' => $e->getMessage()]);
            }
        }

        DB::commit();

        Log::info('Import process completed. Total products imported: ' . count($importedProducts));

        return response()->json([
            'message' => 'Products imported successfully',
            'imported_products' => $importedProducts,
        ], 200);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error importing products:', ['error' => $e->getMessage()]);
        return response()->json([
            'message' => 'Error importing products',
            'error' => $e->getMessage(),
        ], 500);
    }
}


    // Validation rules for store
    private function storeRules()
    {
        return [
            'product_name' => 'required|string|max:255',
            'item_code' => 'nullable|string|unique:products,item_code',
            'batch_number' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'buying_cost' => 'required|numeric|min:0',
            'sales_price' => 'required|numeric|min:0',
            'minimum_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'barcode' => 'nullable|string|unique:products,barcode',
            'mrp' => 'required|numeric|min:0',
            'minimum_stock_quantity' => 'nullable|integer|min:0',
            'opening_stock_quantity' => 'nullable|integer|min:0',
            'opening_stock_value' => 'nullable|numeric|min:0',
            'category' => 'nullable|string',
            'supplier' => 'nullable|string',
            'unit_type' => 'nullable|string',
            'store_location' => 'nullable|string',
            'cabinet' => 'nullable|string',
            'row' => 'nullable|string',
            'extra_fields' => 'nullable|json',
        ];
    }

    // Validation rules for update
    private function updateRules($id)
    {
        return array_merge($this->storeRules(), [
            'item_code' => ['nullable', 'string', Rule::unique('products', 'item_code')->ignore($id)],
            'barcode' => ['nullable', 'string', Rule::unique('products', 'barcode')->ignore($id)],
        ]);
    }

    // Validation rules for import
    private function importRules()
    {
        return $this->storeRules();
    }

    // Centralized exception handling
    private function handleException($e, $message, $status = 500)
    {
        Log::error($message . ': ' . $e->getMessage());
        return response()->json(['message' => $message, 'error' => $e->getMessage()], $status);
    }
}
