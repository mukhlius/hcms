<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Total organization_units: " . App\Models\OrganizationUnit::count() . "\n";
echo "Total departments: " . App\Models\OrganizationDepartment::count() . "\n";
echo "Total sections: " . App\Models\OrganizationSection::count() . "\n";
echo "Total positions: " . App\Models\Position::count() . "\n";

$units = App\Models\OrganizationUnit::all();
echo "Units sample:\n" . json_encode($units, JSON_PRETTY_PRINT) . "\n";
